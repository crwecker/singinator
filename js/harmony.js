// Harmony: Roman-numeral chord ids, four-part voice leading, cadences and
// functional progressions. Pure (depends only on Theory); browser global
// (window.Harmony) or Node module.
(function (root) {
  'use strict';

  var T = typeof module !== 'undefined' && module.exports ? require('./theory.js') : root.Theory;

  var ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  var FIGURE_INV = { '': [0, false], '6': [1, false], '6/4': [2, false], '7': [0, true], '6/5': [1, true], '4/3': [2, true], '4/2': [3, true] };

  // Chord ids are written as in a major key ('ii6', 'V6/5', 'V7/V'); in
  // minor the same id means the same degree and function, and the label
  // comes out right (ii°6, V6/5, V7/iv).
  function parseId(id) {
    var sec = /^V(7?)\/(\w+)$/.exec(id);
    if (sec) return { secondary: true, seventh: sec[1] === '7', target: ROMANS.indexOf(sec[2].toUpperCase()) };
    var m = /^([ivIV]+)(?:°|ø|\+)?(7|6\/5|4\/3|4\/2|6\/4|6)?$/.exec(id);
    if (!m) throw new Error('bad chord id ' + id);
    var fi = FIGURE_INV[m[2] || ''];
    return { deg: ROMANS.indexOf(m[1].toUpperCase()), inv: fi[0], seventh: fi[1] };
  }

  // { id, label, root, type, inv, tones (root position, spelled), deg }
  function chord(k, id) {
    var p = parseId(id);
    var c, label;
    if (p.secondary) {
      c = T.secondaryDominant(k, p.target, p.seventh);
      label = c.numeral;
      p.inv = 0;
    } else {
      c = T.diatonicChord(k, p.deg, p.seventh);
      label = T.numeral(c.type, p.deg, p.inv);
    }
    return { id: id, label: label, root: c.root, type: c.type, inv: p.inv, deg: p.deg, secondary: !!p.secondary,
      tones: T.chordTones(c.root, c.type), key: k };
  }

  // ---------- Voice leading ----------
  var RANGES = { bass: [40, 60], tenor: [48, 67], alto: [55, 74], soprano: [60, 79] };

  function spellingsInRange(tone, lo, hi) {
    var out = [];
    for (var oct = 1; oct <= 6; oct++) {
      var n = T.note(tone.l, tone.acc, oct);
      var m = T.midi(n);
      if (m >= lo && m <= hi) out.push(n);
    }
    return out;
  }

  function parallelPenalty(prev, next) {
    var pen = 0;
    for (var i = 0; i < 4; i++) {
      for (var j = i + 1; j < 4; j++) {
        var a0 = T.midi(prev[i]), b0 = T.midi(prev[j]), a1 = T.midi(next[i]), b1 = T.midi(next[j]);
        var i0 = T.mod(b0 - a0, 12), i1 = T.mod(b1 - a1, 12);
        var moved = a0 !== a1 || b0 !== b1;
        var same = (a1 - a0) * (b1 - b0) > 0;
        if (moved && same && i0 === i1 && (i0 === 7 || i0 === 0)) pen += 200;
      }
    }
    return pen;
  }

  // Leading tone of the key (raised in minor).
  function leadingPc(k) {
    return T.pc(T.transpose(k.tonic, 'm2', false));
  }

  // Every acceptable four-part voicing of one chord, with its own cost
  // (classroom rules: third present, 7th present and not doubled, no doubled
  // leading tone in dominants, double the bass of a 6/4, sensible spacing).
  function voicingsFor(k, c) {
    var lt = leadingPc(c.key || k); // chords in a modulation carry their own key
    var seventh = c.tones.length === 4;
    var basses = spellingsInRange(c.tones[c.inv], RANGES.bass[0], RANGES.bass[1]);
    var cands = [];
    c.tones.forEach(function (t, ti) {
      spellingsInRange(t, RANGES.tenor[0], RANGES.soprano[1]).forEach(function (n) { cands.push({ n: n, ti: ti, m: T.midi(n) }); });
    });
    cands.sort(function (x, y) { return x.m - y.m; });
    var out = [];
    basses.forEach(function (bass) {
      var mb = T.midi(bass);
      for (var i = 0; i < cands.length; i++) {
        var tn = cands[i];
        if (tn.m <= mb || tn.m > RANGES.tenor[1] || tn.m - mb > 19) continue;
        for (var j = i + 1; j < cands.length; j++) {
          var al = cands[j];
          if (al.m === tn.m || al.m < RANGES.alto[0] || al.m > RANGES.alto[1] || al.m - tn.m > 12) continue;
          for (var l = j + 1; l < cands.length; l++) {
            var so = cands[l];
            if (so.m === al.m || so.m < RANGES.soprano[0] || so.m - al.m > 12) continue;
            var count = [0, 0, 0, 0];
            [c.inv, tn.ti, al.ti, so.ti].forEach(function (x) { count[x]++; });
            if (!count[1]) continue;
            if (seventh && (!count[3] || count[3] > 1)) continue;
            var voices = [bass, tn.n, al.n, so.n];
            var ltCount = voices.filter(function (n) { return T.pc(n) === lt; }).length;
            if (ltCount > 1 && (c.deg === 4 || c.deg === 6 || c.secondary)) continue;
            var cost = 0.7 * Math.abs(mb - 46);
            if (!count[0]) cost += 60;
            if (!seventh && !count[2]) cost += 30;
            if (!seventh && c.inv === 2 && count[2] < 2) cost += 20;
            out.push({ v: voices, m: [mb, tn.m, al.m, so.m], cost: cost });
          }
        }
      }
    });
    return out;
  }

  // Voice a list of chords (from chord()) in four parts: returns
  // [[bass, tenor, alto, soprano], ...] as spelled notes. Dynamic
  // programming over all voicings, minimizing motion, with parallel 5ths
  // and 8ves as heavy penalties. opts.sopranoEnd: pitch class the last
  // soprano note must have (PAC vs IAC); the search plans ahead for it.
  function voiceLead(k, chords, opts) {
    opts = opts || {};
    var layers = chords.map(function (c) { return voicingsFor(k, c); });
    var best = [];
    layers.forEach(function (layer, li) {
      var last = li === layers.length - 1;
      best[li] = layer.map(function (cand) {
        var own = cand.cost;
        if (last && opts.sopranoEnd != null && T.pc(cand.v[3]) !== opts.sopranoEnd) own += 1000;
        if (li === 0) return { total: own + Math.abs(cand.m[3] - 70), from: -1 };
        var bestTotal = Infinity, from = -1;
        layers[li - 1].forEach(function (prev, pi) {
          var t = best[li - 1][pi].total;
          if (t >= bestTotal) return;
          var move = 0.5 * Math.abs(cand.m[0] - prev.m[0]);
          for (var v = 1; v < 4; v++) {
            var d = Math.abs(cand.m[v] - prev.m[v]);
            move += d + (d > 7 ? 10 : 0);
          }
          var total = t + move + parallelPenalty(prev.v, cand.v);
          if (total < bestTotal) { bestTotal = total; from = pi; }
        });
        return { total: bestTotal + own, from: from };
      });
    });
    // backtrack
    var lastLayer = best[best.length - 1];
    var idx = 0;
    lastLayer.forEach(function (b, i) { if (b.total < lastLayer[idx].total) idx = i; });
    var out = [];
    for (var li = layers.length - 1; li >= 0; li--) {
      if (!layers[li].length) { out.unshift([chords[li].tones[0]].concat(chords[li].tones.slice(0, 3))); continue; }
      out.unshift(layers[li][idx].v);
      idx = best[li][idx].from;
      if (idx < 0) idx = 0;
    }
    return out;
  }

  // ---------- Progressions ----------
  // Function of each chord id for a tonic -> predominant -> dominant grammar.
  var FUNCTION = {
    'I': 'T', 'I6': 'T', 'vi': 'T', 'iii': 'T',
    'ii': 'PD', 'ii6': 'PD', 'ii7': 'PD', 'ii6/5': 'PD', 'IV': 'PD', 'IV6': 'PD',
    'V': 'D', 'V6': 'D', 'V7': 'D', 'V6/5': 'D', 'V4/3': 'D', 'V4/2': 'D', 'vii°6': 'D', 'I6/4': 'CAD',
    'V/V': 'SD', 'V7/V': 'SD', 'V/vi': 'ST', 'V7/vi': 'ST', 'V7/IV': 'SP', 'V/ii': 'SP', 'V7/ii': 'SP',
  };
  // What may follow each function.
  var NEXT = {
    T: ['T', 'PD', 'D', 'SP', 'ST', 'SD'],
    PD: ['PD', 'D', 'CAD', 'SD'],
    CAD: ['D'],
    D: ['T'],
    SD: ['D', 'CAD'],     // V/V -> V
    ST: ['T'],            // V/vi -> vi
    SP: ['PD'],           // V/ii -> ii, V7/IV -> IV
  };

  function pick(arr, rnd) { return arr[Math.floor((rnd || Math.random)() * arr.length)]; }

  // Secondary dominants must resolve to their own target.
  function resolves(prevId, nextId) {
    var p = /^V7?\/(\w+)$/.exec(prevId);
    if (!p) return true;
    var target = p[1];
    var next = nextId.replace(/(6\/5|4\/3|4\/2|6\/4|7|6)$/, '');
    return next.toUpperCase() === target.toUpperCase() || (target === 'V' && nextId === 'I6/4');
  }

  // A progression from pool ids: starts on I, ends dominant -> I, with a
  // cadential 6/4 before the dominant now and then when the pool has one.
  function makeProgression(pool, length, rnd) {
    rnd = rnd || Math.random;
    // vii°6 works mid-phrase (vii°6-I) but not as the final cadence's dominant
    var dominants = pool.filter(function (id) { return FUNCTION[id] === 'D' && id.indexOf('vii') < 0; });
    var midDominants = pool.filter(function (id) { return FUNCTION[id] === 'D'; });
    var follows = function (cur, id) {
      return id !== cur && NEXT[FUNCTION[cur]].indexOf(FUNCTION[id]) >= 0 && resolves(cur, id);
    };
    for (var tries = 0; tries < 300; tries++) {
      var seq = ['I'];
      while (seq.length < length - 2) {
        var cur = seq[seq.length - 1];
        var opts = pool.filter(function (id) { return id !== 'I6/4' && FUNCTION[id] !== 'D' && follows(cur, id); });
        // a dominant mid-phrase must go back to tonic, which the walk allows
        if (seq.length < length - 3) opts = opts.concat(midDominants.filter(function (id) { return follows(cur, id); }));
        if (!opts.length) break;
        seq.push(pick(opts, rnd));
      }
      if (seq.length !== length - 2) continue;
      var penult = seq[seq.length - 1];
      if (pool.indexOf('I6/4') >= 0 && FUNCTION[penult] === 'PD' && length >= 5 && rnd() < 0.4) {
        seq[seq.length - 1] = 'I6/4';
        if (FUNCTION[seq[seq.length - 2]] !== 'PD') continue;
        penult = 'I6/4';
      }
      var dom = dominants.filter(function (id) { return follows(penult, id); });
      if (!dom.length) continue;
      seq.push(pick(dom, rnd));
      seq.push('I');
      return seq;
    }
    return ['I', 'IV', 'V', 'I'].slice(0, length);
  }

  // ---------- Cadences ----------
  // Each cadence is a lead-in, (usually) a predominant, then its ending.
  var CADENCES = {
    PAC: { name: 'Perfect authentic', tail: ['V', 'I'], end: 'do' },
    IAC: { name: 'Imperfect authentic', tail: ['V', 'I'], end: 'mi' },
    HC:  { name: 'Half', tail: ['V'] },
    PC:  { name: 'Plagal', tail: ['IV', 'I'], noPredominant: true },
    DC:  { name: 'Deceptive', tail: ['V', 'vi'] },
  };

  // A short phrase ending in the cadence.
  function cadencePhrase(k, type, rnd) {
    var c = CADENCES[type];
    var lead = pick([['I'], ['I', 'vi'], ['I', 'I6']], rnd);
    var pd = c.noPredominant ? [] : [pick(lead[lead.length - 1] === 'vi' ? ['IV', 'ii6', 'ii'] : ['IV', 'ii6'], rnd)];
    var ids = lead.concat(pd, c.tail);
    var chords = ids.map(function (id) { return chord(k, id); });
    var sopranoEnd = null;
    if (c.end === 'do') sopranoEnd = T.pc(k.tonic);
    if (c.end === 'mi') sopranoEnd = T.pc(T.degreeNote(k, 2, 0, 4));
    return { ids: ids, chords: chords, voices: voiceLead(k, chords, { sopranoEnd: sopranoEnd }) };
  }

  // Chords that establish a key: I-IV-V-I in major/minor; modes get their
  // characteristic chord between tonic chords (Dorian's IV, Mixolydian's
  // bVII, Lydian's II, Phrygian's bII).
  var MODE_COLOR = { dorian: 3, phrygian: 1, lydian: 1, mixolydian: 6, locrian: 1 };
  function establishing(k) {
    if (k.mode === 'major' || k.mode === 'minor' || k.mode === 'ionian' || k.mode === 'aeolian') {
      var kk = k.mode === 'aeolian' ? T.key(k.tonic, 'minor') : k.mode === 'ionian' ? T.key(k.tonic, 'major') : k;
      return voiceLead(kk, ['I', 'IV', 'V', 'I'].map(function (id) { return chord(kk, id); }));
    }
    var tonic = T.diatonicChord(k, 0, false);
    var color = T.diatonicChord(k, MODE_COLOR[k.mode], false);
    var mk = function (c) { return { tones: T.chordTones(c.root, c.type), inv: 0, deg: c.deg, type: c.type }; };
    return voiceLead(k, [mk(tonic), mk(color), mk(tonic)]);
  }

  // ---------- Modulation ----------
  // Where a phrase can go, and how it gets there: a pivot chord that
  // belongs to both keys, then V7-I in the new key.
  var MODULATIONS = {
    V:    { name: 'Dominant (V)', newKey: function (k) { return T.key(T.transpose(k.tonic, 'P5', true), 'major'); }, pivot: ['vi', 'ii'] },
    IV:   { name: 'Subdominant (IV)', newKey: function (k) { return T.key(T.transpose(k.tonic, 'P4', true), 'major'); }, pivot: ['ii', 'vi'] },
    vi:   { name: 'Relative minor (vi)', newKey: function (k) { return T.key(T.transpose(k.tonic, 'M6', true), 'minor'); }, pivot: ['ii', 'IV'] },
    none: { name: 'Stays home', newKey: function (k) { return k; }, pivot: ['ii', 'ii'] },
  };

  // Chords of a modulating phrase; each carries its key. The pivot chord's
  // label shows both functions ("vi = ii").
  function modulation(k, target, rnd) {
    var m = MODULATIONS[target];
    var k2 = m.newKey(k);
    var opening = pick([['I', 'IV', 'V', 'I'], ['I', 'vi', 'IV', 'V', 'I'], ['I', 'V', 'I']], rnd);
    var chords = opening.map(function (id) { return chord(k, id); });
    var pivot = chord(k, m.pivot[0]);
    var inNew = chord(k2, m.pivot[1]);
    pivot.label = target === 'none' ? pivot.label : pivot.label + ' = ' + inNew.label;
    pivot.key = k2;
    chords.push(pivot);
    chords.push(chord(k2, 'V7'));
    chords.push(chord(k2, 'I'));
    return { from: k, to: k2, chords: chords, voices: voiceLead(k, chords, { sopranoEnd: T.pc(k2.tonic) }) };
  }

  var api = {
    MODULATIONS: MODULATIONS, modulation: modulation,
    parseId: parseId, chord: chord, voiceLead: voiceLead, makeProgression: makeProgression,
    CADENCES: CADENCES, cadencePhrase: cadencePhrase, establishing: establishing,
    FUNCTION: FUNCTION, parallelPenalty: parallelPenalty, RANGES: RANGES,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Harmony = api;
})(this);
