// Phrases and periods: melodies that end in an authentic cadence (on do)
// or a half cadence (on re, ti or sol), and two-phrase pairs that form a
// parallel period, a contrasting period, or no period at all. Melodies are
// diatonic offsets from the tonic. Pure; browser global (window.Phrase) or
// Node module.
(function (root) {
  'use strict';

  function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }

  // Endings, as the last two offsets: re-do or ti-do for an authentic
  // cadence; mi-re, do-ti, la-sol or fa-sol... for a half cadence.
  var ENDINGS = {
    PAC: [[1, 0], [-1, 0], [8, 7], [6, 7]],
    HC: [[2, 1], [0, 1], [0, -1], [5, 4], [3, 4], [-2, -1]],
  };

  var PERIODS = {
    parallel: 'Parallel period',
    contrasting: 'Contrasting period',
    none: 'Not a period',
  };

  function mod7(x) { return ((x % 7) + 7) % 7; }
  // fa up to ti or ti up to fa: no tritone leaps
  function tritone(a, b) {
    var lo = Math.min(a, b), hi = Math.max(a, b);
    return (mod7(lo) === 3 && hi - lo === 3) || (mod7(lo) === 6 && hi - lo === 4);
  }

  // A random walk of len offsets from start, mostly steps, inside -3..8,
  // that can reach the ending's first note by step.
  function walk(start, len, target, rnd) {
    for (var tries = 0; tries < 400; tries++) {
      var seq = [start];
      while (seq.length < len) {
        var cur = seq[seq.length - 1];
        var moves = [-1, -1, 1, 1, -2, 2, 0, -3, 3, 4];
        var opts = moves.map(function (m) { return cur + m; }).filter(function (o) { return o >= -3 && o <= 8 && !tritone(cur, o); });
        var prevMove = seq.length > 1 ? cur - seq[seq.length - 2] : 0;
        if (Math.abs(prevMove) >= 3) opts = [cur + (prevMove > 0 ? -1 : 1)]; // recover from a leap
        if (prevMove === 0) opts = opts.filter(function (o) { return o !== cur; });
        seq.push(pick(opts, rnd));
      }
      if (Math.abs(seq[seq.length - 1] - target) <= 1 && seq[seq.length - 1] !== target) return seq;
    }
    return null;
  }

  // One phrase of len notes ending in cadence ('PAC' or 'HC'). opening:
  // offsets to begin with (a parallel consequent repeats the antecedent's).
  function phrase(cadence, len, rnd, opening) {
    rnd = rnd || Math.random;
    len = len || 8;
    for (var tries = 0; tries < 200; tries++) {
      var end = pick(ENDINGS[cadence], rnd);
      var head = opening ? opening.slice() : [pick([0, 0, 2, 4], rnd)];
      var body = walk(head[head.length - 1], len - 2 - head.length + 1, end[0], rnd);
      if (!body) continue;
      var seq = head.concat(body.slice(1), end);
      if (seq.length !== len) continue;
      if (Math.max.apply(null, seq) - Math.min.apply(null, seq) > 9) continue;
      return seq;
    }
    return null;
  }

  // Two phrases. kind: 'parallel' (the consequent starts like the
  // antecedent, then ends more strongly), 'contrasting' (new material,
  // stronger ending) or 'none' (the second cadence is no stronger).
  function period(kind, len, rnd) {
    rnd = rnd || Math.random;
    len = len || 8;
    var half = Math.floor(len / 2);
    for (var tries = 0; tries < 200; tries++) {
      var firstCad = kind === 'none' ? pick(['PAC', 'HC'], rnd) : 'HC';
      var secondCad = kind === 'none' ? (firstCad === 'PAC' ? pick(['PAC', 'HC'], rnd) : 'HC') : 'PAC';
      var a = phrase(firstCad, len, rnd);
      if (!a) continue;
      var opening = kind === 'parallel' || (kind === 'none' && rnd() < 0.5) ? a.slice(0, half) : null;
      var b = phrase(secondCad, len, rnd, opening);
      if (!b) continue;
      if (!opening && !different(a, b, half)) continue;
      if (a.join() === b.join()) continue;
      return { kind: kind, cadences: [firstCad, secondCad], phrases: [a, b] };
    }
    return null;
  }

  // Openings differ enough to hear: the first notes or the contour.
  function different(a, b, half) {
    var diff = 0;
    for (var i = 0; i < half; i++) if (a[i] !== b[i]) diff++;
    return diff >= Math.ceil(half * 0.75) && a[1] - a[0] !== b[1] - b[0];
  }

  var api = { ENDINGS: ENDINGS, PERIODS: PERIODS, phrase: phrase, period: period, different: different };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Phrase = api;
})(this);
