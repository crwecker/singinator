// Non-chord tones: decorate the soprano of a four-part progression with
// one passing tone, neighbor, anticipation, escape tone, appoggiatura,
// suspension or retardation. Pure (depends on Theory, Harmony and
// Partwriting); browser global (window.NCT) or Node module.
//
// Each chord takes two half-beat columns: chords on even columns, the
// soprano's in-between notes on odd ones (the staff draws whole-number
// columns only).
(function (root) {
  'use strict';

  var node = typeof module !== 'undefined' && module.exports;
  var T = node ? require('./theory.js') : root.Theory;
  var H = node ? require('./harmony.js') : root.Harmony;
  var P = node ? require('./partwriting.js') : root.Partwriting;

  var TYPES = {
    PT:  { name: 'Passing tone', how: 'step in, step on in the same direction' },
    NT:  { name: 'Neighbor tone', how: 'step away, step back' },
    ANT: { name: 'Anticipation', how: 'the next chord’s note, arriving early' },
    ET:  { name: 'Escape tone', how: 'step out, leap back the other way' },
    APP: { name: 'Appoggiatura', how: 'leap in on the beat, step out the other way' },
    SUS: { name: 'Suspension', how: 'held over from the last chord, resolves down by step' },
    RET: { name: 'Retardation', how: 'held over from the last chord, resolves up by step' },
  };
  var ACCENTED = { APP: 1, SUS: 1, RET: 1 };

  function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }

  // The diatonic note d steps from n in key k.
  function stepFrom(k, n, d) {
    var m = T.fromStep(T.step(n) + d, 0);
    m.acc = T.sigAcc(T.fifths(k), m.l);
    return m;
  }

  function inChord(n, c) {
    return c.tones.some(function (t) { return T.pc(t) === T.pc(n); });
  }

  // No augmented or diminished melodic intervals (fa up to ti).
  function plainMove(a, b) { return !/^[Ad]/.test(T.interval(a, b).id); }

  // Suspension figure from the dissonance's interval above the bass.
  function susFigure(n, bass, up) {
    var g = T.mod(T.step(n) - T.step(bass), 7) + 1; // generic interval, 1-7
    if (up) return g === 7 ? '7–8' : g === 2 ? '2–3' : null;
    return g === 4 ? '4–3' : g === 7 ? '7–6' : g === 2 ? '9–8' : null;
  }

  // Ways to put each type between chord i and chord i+1 (s = soprano notes).
  function options(k, chords, voices, i, type) {
    var a = chords[i], b = chords[i + 1];
    var s0 = voices[i][3], s1 = voices[i + 1][3];
    var gap = T.step(s1) - T.step(s0);
    var out = [];
    var add = function (n, accented, resolution, extra) {
      var against = accented ? b : a;
      if (inChord(n, against)) return;
      // an accented dissonance can't sound against its own resolution in the tenor or alto
      if (accented && voices[i + 1].slice(1, 3).some(function (x) { return T.pc(x) === T.pc(resolution); })) return;
      var line = accented ? [s0, n, resolution] : [s0, n, s1];
      if (!plainMove(line[0], line[1]) || !plainMove(line[1], line[2])) return;
      out.push(Object.assign({ n: n, accented: !!accented }, extra || {}));
    };
    if (type === 'PT' && Math.abs(gap) === 2) add(stepFrom(k, s0, gap / 2));
    if (type === 'NT' && T.midi(s0) === T.midi(s1)) { add(stepFrom(k, s0, 1)); add(stepFrom(k, s0, -1)); }
    if (type === 'ANT' && Math.abs(gap) === 1 && !inChord(s1, a)) add(s1);
    if (type === 'ET' && Math.abs(gap) === 1) add(stepFrom(k, s0, -gap)); // step away, leap back
    if (type === 'APP' && Math.abs(gap) >= 1) {
      // leap up to the note above the target and step down, or the reverse
      [1, -1].forEach(function (d) {
        var app = stepFrom(k, s1, d);
        var leap = T.step(app) - T.step(s0);
        if (Math.abs(leap) >= 2 && leap * d > 0) add(app, true, s1);
      });
    }
    if ((type === 'SUS' && gap === -1) || (type === 'RET' && gap === 1)) {
      var fig = susFigure(s0, voices[i + 1][0], type === 'RET');
      if (fig) add(s0, true, s1, { figure: fig });
    }
    return out;
  }

  var POOL = ['I', 'I6', 'ii', 'ii6', 'IV', 'V', 'V6', 'V7', 'vi'];

  // A short progression whose soprano carries one non-chord tone of the
  // given type. Returns { k, type, chords, voices, at, nct, line } where
  // line is the soprano: [{ n, col, nct, tie }].
  function example(k, type, rnd, opts) {
    rnd = rnd || Math.random;
    opts = opts || {};
    for (var tries = 0; tries < 200; tries++) {
      var ids = H.makeProgression(opts.pool || POOL, opts.length || 4, rnd);
      var chords = ids.map(function (id) { return H.chord(k, id); });
      var voices = H.voiceLead(k, chords);
      if (P.errors(k, chords, voices).length) continue;
      var spots = [];
      for (var i = 0; i < chords.length - 1; i++) {
        options(k, chords, voices, i, type).forEach(function (o) { spots.push(Object.assign({ i: i }, o)); });
      }
      if (!spots.length) continue;
      var o = pick(spots, rnd);
      var line = voices.map(function (v, j) { return { n: v[3], col: 2 * j }; });
      if (o.accented) {
        // the dissonance takes the next chord's beat, and resolves on the half beat
        line[o.i + 1] = { n: o.n, col: 2 * (o.i + 1), nct: true };
        line.splice(o.i + 2, 0, { n: voices[o.i + 1][3], col: 2 * (o.i + 1) + 1 });
        if (type === 'SUS' || type === 'RET') line[o.i].tie = true;
      } else {
        line.splice(o.i + 1, 0, { n: o.n, col: 2 * o.i + 1, nct: true });
      }
      return { k: k, type: type, ids: ids, chords: chords, voices: voices, at: o.i, nct: o.n, figure: o.figure || null, line: line };
    }
    return null;
  }

  // When each soprano note sounds, in beats (a chord lasts one beat).
  // Tied notes merge into one.
  function sopranoTimes(line) {
    var out = [];
    line.forEach(function (e, j) {
      var next = line[j + 1];
      var start = e.col / 2;
      var end = next ? next.col / 2 : start + 1;
      var prev = out[out.length - 1];
      if (prev && prev.tie) { prev.end = end; prev.tie = !!e.tie; return; }
      out.push({ n: e.n, start: start, end: end, tie: !!e.tie });
    });
    return out;
  }

  var api = { TYPES: TYPES, ACCENTED: ACCENTED, options: options, example: example, sopranoTimes: sopranoTimes, inChord: inChord };
  if (node) module.exports = api;
  else root.NCT = api;
})(this);
