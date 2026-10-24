// Analysis of real chorale phrases (data in chorales.js): the chord on each
// beat, its Roman numeral and figures, and every non-chord tone in every
// voice, by contour. Phrases the rules can't read cleanly (a chord change
// inside a beat, a chromatic chord, a note that fits no NCT pattern) are
// marked unreadable and not used. Pure; browser global (window.Chorale) or
// Node module.
(function (root) {
  'use strict';

  var node = typeof module !== 'undefined' && module.exports;
  var T = node ? require('./theory.js') : root.Theory;
  var H = node ? require('./harmony.js') : root.Harmony;

  var TYPES = ['maj', 'min', 'dim', 'dom7', 'min7', 'hdim7', 'dim7', 'maj7'];

  function keyOf(ch) {
    var tok = ch.key;
    if (!tok) {
      // no key given: the last bass note is the tonic; the soprano's or
      // inner voices' third of it says major or minor
      var bass = ch.voices[0].filter(function (e) { return !e.rest; });
      var last = T.parse(bass[bass.length - 1].p);
      var thirds = ch.voices.map(function (v) { var x = v.filter(function (e) { return !e.rest; }); return T.parse(x[x.length - 1].p); })
        .filter(function (n) { return T.mod(n.l - last.l, 7) === 2; });
      var minor = thirds.length && T.mod(T.midi(thirds[0]) - T.midi(last), 12) === 3;
      return T.key(T.LETTERS[last.l] + (last.acc < 0 ? 'b' : last.acc > 0 ? '#' : ''), minor ? 'minor' : 'major');
    }
    var minor = tok.charAt(0) === tok.charAt(0).toLowerCase();
    return T.key(tok.charAt(0).toUpperCase() + tok.slice(1).replace('-', 'b'), minor ? 'minor' : 'major');
  }

  function notes(ch) {
    return ch.voices.map(function (v) {
      return v.map(function (e) { return e.rest ? e : Object.assign({}, e, { n: T.parse(e.p) }); });
    });
  }

  // The event sounding in voice v at time t (and its index).
  function at(vs, v, t) {
    for (var i = 0; i < vs[v].length; i++) {
      var e = vs[v][i];
      if (e.t <= t + 1e-9 && t < e.t + e.d - 1e-9) return i;
    }
    return -1;
  }

  // The chord a set of notes (bass first) spells, or null. Every pitch
  // class must belong to it; it must have its root and third.
  function fit(ns) {
    var pcs = ns.map(T.pc);
    var best = null;
    ns.forEach(function (r) {
      TYPES.forEach(function (type) {
        var tones = T.chordTones(T.note(r.l, r.acc, 4), type);
        var tpcs = tones.map(T.pc);
        if (!pcs.every(function (p) { return tpcs.indexOf(p) >= 0; })) return;
        var has = tpcs.map(function (p) { return pcs.indexOf(p) >= 0; });
        if (!has[0] || !has[1]) return;
        // spelled the same way, letter by letter
        if (!ns.every(function (n) { return tones.some(function (t) { return t.l === n.l && t.acc === n.acc; }); })) return;
        var seventh = tones.length === 4;
        if (seventh && !has[3]) return;
        var score = has.filter(Boolean).length - (seventh ? 0.5 : 0);
        var inv = tpcs.indexOf(T.pc(ns[0]));
        if (!best || score > best.score) best = { root: tones[0], type: type, tones: tones, inv: inv, score: score };
      });
    });
    return best;
  }

  function step(a, b) { return T.step(b) - T.step(a); }

  // Roman numeral of a chord in key k, if it is diatonic there.
  var IDS = (function () {
    var out = [];
    ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'].forEach(function (id, deg) {
      ['', '6', '6/4'].forEach(function (f) { out.push(id + f); });
      var sev = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'][deg];
      ['7', '6/5', '4/3', '4/2'].forEach(function (f) { out.push(sev + f); });
    });
    return out;
  })();

  function numeral(k, c) {
    for (var i = 0; i < IDS.length; i++) {
      var x;
      try { x = H.chord(k, IDS[i]); } catch (e) { continue; }
      if (x.type !== c.type || x.inv !== c.inv || T.pc(x.root) !== T.pc(c.root) || x.root.l !== c.root.l) continue;
      return { id: IDS[i], chord: x, label: x.label };
    }
    return null;
  }

  // Figures over the bass, with an accidental where a note leaves the key
  // signature (♯ alone: a raised 3rd).
  function figures(k, c) {
    var fig = T.figure(c.type, c.inv) || '';
    var bass = c.tones[c.inv];
    var shown = fig ? fig.split('/') : c.tones.length === 4 ? ['7'] : [];
    var marks = [];
    c.tones.forEach(function (t, i) {
      if (i === c.inv) return;
      var acc = T.sigAcc(T.fifths(k), t.l);
      if (t.acc === acc) return;
      var size = T.mod(t.l - bass.l, 7) + 1;
      marks.push({ size: size, sign: t.acc > acc ? (t.acc === 0 ? '♮' : '♯') : (t.acc === 0 ? '♮' : '♭') });
    });
    marks.forEach(function (m) {
      var i = shown.indexOf(String(m.size));
      if (i >= 0) shown[i] = m.sign + shown[i];
      else if (m.size === 3) shown.unshift(m.sign);
      else shown.unshift(m.sign + m.size);
    });
    return shown.join('/');
  }

  // Name a non-chord tone from its neighbors in the same voice.
  // accented: it sounds on the beat. held: tied or repeated from before.
  function nctType(prev, n, next, accented, held) {
    if (!prev || !next) return null;
    var d1 = step(prev, n), d2 = step(n, next);
    var s1 = Math.abs(d1) === 1, s2 = Math.abs(d2) === 1, same = d1 * d2 > 0;
    if (accented && held && d2 === -1) return 'SUS';
    if (accented && held && d2 === 1) return 'RET';
    if (s1 && s2 && same) return 'PT';
    if (s1 && s2) return 'NT';
    if (s1 && d2 === 0 && T.midi(n) === T.midi(next)) return 'ANT';
    if (Math.abs(d1) > 1 && s2 && !same) return 'APP';
    if (s1 && Math.abs(d2) > 1 && !same) return 'ET';
    return null;
  }

  // Analyze a phrase [t0, t1): { beats: [{ t, chord, rn, figures, sus }],
  // ncts: [{ v, i, type, t }], ok, why }.
  function analyze(ch, t0, t1) {
    var k = keyOf(ch);
    var vs = notes(ch);
    var beats = [], ncts = [], why = null;
    for (var t = t0; t < t1 - 1e-9 && !why; t += 1) {
      var idx = [0, 1, 2, 3].map(function (v) { return at(vs, v, t); });
      if (idx.some(function (i) { return i < 0 || vs[0][0] === undefined; })) { why = 'gap at ' + t; break; }
      var evs = idx.map(function (i, v) { return vs[v][i]; });
      if (evs.some(function (e) { return e.rest; })) { why = 'rest at ' + t; break; }
      var on = evs.map(function (e) { return e.n; });
      var chord = fit(on), accented = {};
      if (!chord) {
        // an accented dissonance: a voice that moves by step inside the
        // beat; read the chord from where it resolves
        var res = on.slice();
        [0, 1, 2, 3].forEach(function (v) {
          var e = evs[v], nx = vs[v][idx[v] + 1];
          if (nx && nx.t < t + 1 - 1e-9 && !nx.rest && Math.abs(step(e.n, nx.n)) === 1) { res[v] = nx.n; accented[v] = true; }
        });
        chord = fit(res);
        if (chord) {
          [0, 1, 2, 3].forEach(function (v) {
            if (!accented[v]) return;
            if (chord.tones.some(function (x) { return T.pc(x) === T.pc(on[v]); })) { delete accented[v]; return; }
            var e = evs[v], pv = vs[v][idx[v] - 1];
            var held = e.t < t - 1e-9 || (pv && !pv.rest && T.midi(pv.n) === T.midi(e.n));
            var type = nctType(pv && !pv.rest ? pv.n : null, e.n, vs[v][idx[v] + 1].n, true, held);
            if (!type) { why = 'unclear accented note at ' + t; return; }
            ncts.push({ v: v, i: idx[v], t: t, type: type === 'PT' ? 'APT' : type === 'NT' ? 'ANB' : type });
          });
        }
      }
      if (!chord) { why = 'no chord at ' + t; break; }
      // two dissonances on one beat could as well be a passing chord: too
      // ambiguous to grade
      if (Object.keys(accented).length > 1) { why = 'two accented dissonances at ' + t; break; }
      // the rest of the beat: chord tones or non-chord tones
      var tpcs = chord.tones.map(T.pc);
      for (var v = 0; v < 4 && !why; v++) {
        for (var i = idx[v] + 1; i < vs[v].length && vs[v][i].t < t + 1 - 1e-9; i++) {
          var e = vs[v][i];
          if (e.rest) { why = 'rest at ' + e.t; break; }
          if (accented[v] && i === idx[v] + 1) continue; // its resolution
          if (tpcs.indexOf(T.pc(e.n)) >= 0) continue;
          var prev = vs[v][i - 1], next = vs[v][i + 1];
          var type = nctType(prev && !prev.rest ? prev.n : null, e.n, next && !next.rest ? next.n : null, false, false);
          if (!type) { why = 'unclear note in voice ' + v + ' at ' + e.t; break; }
          ncts.push({ v: v, i: i, t: e.t, type: type });
        }
      }
      // Two voices off the chord at once are double passing (or neighbor)
      // tones, unless together they spell a new chord: then the harmony
      // changed inside the beat, which these rules don't read.
      var byTime = {};
      ncts.forEach(function (x) { if (x.t > t && x.t < t + 1) (byTime[x.t] = byTime[x.t] || []).push(x); });
      Object.keys(byTime).forEach(function (s) {
        if (byTime[s].length < 2 || why) return;
        var slice = [0, 1, 2, 3].map(function (v) { var j = at(vs, v, Number(s)); return vs[v][j].n; });
        var other = fit(slice);
        if (other && other.tones.length >= 3 && slice.map(T.pc).filter(function (p, i, a) { return a.indexOf(p) === i; }).length >= 3) why = 'chord change inside beat ' + t;
      });
      var rn = numeral(k, chord);
      if (!rn) why = why || 'not diatonic at ' + t + ' (' + T.name(chord.root) + ' ' + chord.type + ')';
      var sus = ncts.filter(function (x) { return x.t === t && x.type === 'SUS'; })[0];
      beats.push({ t: t, chord: chord, rn: rn, figures: rn ? figures(k, rn.chord) : '', sus: sus || null });
    }
    return { k: k, beats: beats, ncts: ncts, ok: !why, why: why };
  }

  // Phrases end at fermatas in the soprano.
  function phrases(ch) {
    var out = [], start = 0;
    ch.voices[3].forEach(function (e) {
      if (e.ferm) { out.push([start, e.t + e.d]); start = e.t + e.d; }
    });
    return out;
  }

  var api = { keyOf: keyOf, analyze: analyze, phrases: phrases, fit: fit, nctType: nctType, figures: figures, notes: notes };
  if (node) module.exports = api;
  else root.Chorale = api;
})(this);
