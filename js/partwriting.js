// Partwriting: checks four-part writing against the classroom rules and
// builds "find the error" exercises by bending one chord of a clean
// connection until it breaks exactly one rule. Pure (depends on Theory and
// Harmony); browser global (window.Partwriting) or Node module.
//
// Voicings are [bass, tenor, alto, soprano] as spelled notes, the same as
// Harmony.voiceLead returns.
(function (root) {
  'use strict';

  var node = typeof module !== 'undefined' && module.exports;
  var T = node ? require('./theory.js') : root.Theory;
  var H = node ? require('./harmony.js') : root.Harmony;

  var VOICES = ['bass', 'tenor', 'alto', 'soprano'];

  // Rule ids and how the app names them.
  var RULES = {
    range: 'Voice out of range',
    spacing: 'Spacing (more than an octave)',
    crossing: 'Voice crossing',
    noThird: 'Missing third',
    ltDouble: 'Doubled leading tone',
    par5: 'Parallel 5ths',
    par8: 'Parallel octaves',
    ltRes: 'Leading tone doesn’t resolve',
    sevRes: '7th doesn’t resolve down',
    dbl3: 'Doubled 3rd in a root-position triad',
    dimDouble: 'Diminished triad: double the 3rd',
    dbl64: '6/4 chord: double the bass',
    leap: 'Awkward leap (over a 5th, or a 7th in the bass)',
    augmented: 'Augmented melodic interval',
  };
  // Rules about the move between two chords (the rest are about one chord).
  var MOTION_RULES = { par5: 1, par8: 1, ltRes: 1, sevRes: 1, leap: 1, augmented: 1 };

  function leadingPc(k) { return T.pc(T.transpose(k.tonic, 'm2', false)); }
  function isDominant(c) { return !c.secondary && (c.deg === 4 || c.deg === 6); }

  function withPc(v, pc) { return [0, 1, 2, 3].filter(function (i) { return T.pc(v[i]) === pc; }); }

  // Errors inside one chord: [{ rule, at, voices }]. prev: the chord before,
  // if any (V-vi may double vi's third).
  function chordErrors(k, c, v, at, prev) {
    var out = [];
    var m = v.map(T.midi);
    VOICES.forEach(function (name, i) {
      var r = H.RANGES[name];
      if (m[i] < r[0] || m[i] > r[1]) out.push({ rule: 'range', at: at, voices: [i] });
    });
    for (var i = 1; i < 4; i++) {
      if (m[i] < m[i - 1]) out.push({ rule: 'crossing', at: at, voices: [i - 1, i] });
    }
    if (m[3] - m[2] > 12) out.push({ rule: 'spacing', at: at, voices: [2, 3] });
    if (m[2] - m[1] > 12) out.push({ rule: 'spacing', at: at, voices: [1, 2] });
    var third = T.pc(c.tones[1]);
    if (!v.some(function (n) { return T.pc(n) === third; })) out.push({ rule: 'noThird', at: at, voices: [] });
    if (c.tones.length === 3 && !c.secondary) {
      var thirds = withPc(v, third);
      if (c.type === 'dim' && thirds.length < 2) out.push({ rule: 'dimDouble', at: at, voices: [] });
      if (c.inv === 2 && withPc(v, T.pc(v[0])).length < 2) out.push({ rule: 'dbl64', at: at, voices: [0] });
      // V-vi doubles vi's third; V's third is the leading tone (ltDouble)
      var deceptive = c.deg === 5 && prev && isDominant(prev);
      if (c.inv === 0 && (c.type === 'maj' || c.type === 'min') && thirds.length > 1 && !deceptive && !isDominant(c)) out.push({ rule: 'dbl3', at: at, voices: thirds });
    }
    if (isDominant(c)) {
      var lt = leadingPc(k);
      var lts = [0, 1, 2, 3].filter(function (i) { return T.pc(v[i]) === lt; });
      if (lts.length > 1) out.push({ rule: 'ltDouble', at: at, voices: lts });
    }
    return out;
  }

  // Errors in the move from chord a (voicing va) to chord b (voicing vb).
  function connectionErrors(k, a, va, b, vb, at) {
    var out = [];
    var m0 = va.map(T.midi), m1 = vb.map(T.midi);
    for (var i = 0; i < 4; i++) {
      for (var j = i + 1; j < 4; j++) {
        var i0 = T.mod(m0[j] - m0[i], 12), i1 = T.mod(m1[j] - m1[i], 12);
        var moved = m0[i] !== m1[i] || m0[j] !== m1[j];
        var same = (m1[i] - m0[i]) * (m1[j] - m0[j]) > 0;
        if (moved && same && i0 === i1 && i0 === 7) out.push({ rule: 'par5', at: at, voices: [i, j] });
        if (moved && same && i0 === i1 && i0 === 0) out.push({ rule: 'par8', at: at, voices: [i, j] });
      }
    }
    // Singable lines: no leap over a 5th in the upper voices, no 7th or
    // more than an octave in the bass, nothing augmented.
    for (var vi = 0; vi < 4; vi++) {
      if (m0[vi] === m1[vi]) continue;
      var iv = T.interval(va[vi], vb[vi]);
      if (vi > 0 ? iv.size > 4 : iv.size === 6 || iv.size > 7) out.push({ rule: 'leap', at: at, voices: [vi] });
      else if (/^A/.test(iv.id) && iv.id !== 'A1') out.push({ rule: 'augmented', at: at, voices: [vi] });
    }
    // The leading tone in an outer voice of V or vii° goes up to do when
    // the next chord is I.
    if (isDominant(a) && b.deg === 0 && !b.secondary) {
      var lt = leadingPc(k);
      [0, 3].forEach(function (i) {
        if (T.pc(va[i]) === lt && m1[i] - m0[i] !== 1) out.push({ rule: 'ltRes', at: at, voices: [i] });
      });
    }
    // A chordal 7th steps down (one or two semitones) into the next chord.
    if (a.tones.length === 4 && !a.secondary) {
      var sev = T.pc(a.tones[3]);
      for (var v = 0; v < 4; v++) {
        if (T.pc(va[v]) !== sev) continue;
        var d = m1[v] - m0[v];
        if (d !== -1 && d !== -2) out.push({ rule: 'sevRes', at: at, voices: [v] });
      }
    }
    return out;
  }

  // Every error in a progression: chords from Harmony.chord, voicings to match.
  function errors(k, chords, voices) {
    var out = [];
    chords.forEach(function (c, i) {
      out = out.concat(chordErrors(k, c, voices[i], i, chords[i - 1]));
      if (i > 0) out = out.concat(connectionErrors(k, chords[i - 1], voices[i - 1], c, voices[i], i));
    });
    return out;
  }

  // ---------- Exercises ----------
  function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }

  // Every spelling of a tone between two midi numbers.
  function spellings(tone, lo, hi) {
    var out = [];
    for (var oct = 1; oct <= 6; oct++) {
      var n = T.note(tone.l, tone.acc, oct);
      if (T.midi(n) >= lo && T.midi(n) <= hi) out.push(n);
    }
    return out;
  }

  // All voicings of a chord (bass on the right tone), a little past the
  // usual ranges so out-of-range mistakes are possible.
  function looseVoicings(c) {
    var bass = spellings(c.tones[c.inv], H.RANGES.bass[0] - 3, H.RANGES.bass[1] + 3);
    var upper = function (name) {
      var r = H.RANGES[name], out = [];
      c.tones.forEach(function (t) { out = out.concat(spellings(t, r[0] - 3, r[1] + 3)); });
      return out;
    };
    var ts = upper('tenor'), as = upper('alto'), ss = upper('soprano');
    var out = [];
    bass.forEach(function (b) {
      ts.forEach(function (t) {
        as.forEach(function (a) {
          ss.forEach(function (s) { out.push([b, t, a, s]); });
        });
      });
    });
    return out;
  }

  // A voicing with one voice moved an octave: the classic range slip.
  function octaveSlips(v) {
    var out = [];
    v.forEach(function (n, i) {
      [-1, 1].forEach(function (d) {
        var w = v.slice();
        w[i] = T.note(n.l, n.acc, n.oct + d);
        out.push(w);
      });
    });
    return out;
  }

  function motion(va, vb) {
    var d = 0;
    for (var i = 0; i < 4; i++) d += Math.abs(T.midi(va[i]) - T.midi(vb[i]));
    return d;
  }

  // A clean two-chord connection, then (unless rule is null) the same
  // connection with one chord rewritten to break exactly that rule.
  // pairs: [['V', 'I'], ...] chord ids. Returns
  // { ids, chords, clean, voices, error } or null if nothing fits.
  function faultyConnection(k, pairs, rule, rnd) {
    rnd = rnd || Math.random;
    for (var tries = 0; tries < 40; tries++) {
      var ids = pick(pairs, rnd);
      var chords = ids.map(function (id) { return H.chord(k, id); });
      var clean = H.voiceLead(k, chords);
      if (errors(k, chords, clean).length) continue;
      if (!rule) return { ids: ids, chords: chords, clean: clean, voices: clean, error: null };
      // Bend the second chord, or (when that can't do it) the first.
      var fits = [];
      [1, 0].forEach(function (bend) {
        if (fits.length) return;
        looseVoicings(chords[bend]).concat(octaveSlips(clean[bend])).forEach(function (v) {
          var vs = bend ? [clean[0], v] : [v, clean[1]];
          var errs = errors(k, chords, vs);
          // mistakes a student would plausibly make: close to the clean answer
          if (errs.length === 1 && errs[0].rule === rule) fits.push({ voices: vs, error: errs[0], d: motion(clean[bend], v) });
        });
      });
      if (!fits.length) continue;
      fits.sort(function (x, y) { return x.d - y.d; });
      var bad = pick(fits.slice(0, 4), rnd);
      return { ids: ids, chords: chords, clean: clean, voices: bad.voices, error: bad.error };
    }
    return null;
  }

  var api = {
    RULES: RULES, MOTION_RULES: MOTION_RULES, VOICES: VOICES, errors: errors, chordErrors: chordErrors, connectionErrors: connectionErrors,
    faultyConnection: faultyConnection,
  };
  if (node) module.exports = api;
  else root.Partwriting = api;
})(this);
