// Rhythm: time signatures, a measure-aware rhythm generator and tap
// scoring. Durations are in quarter notes (eighth = 0.5, dotted quarter =
// 1.5). Pure; browser global (window.Rhythm) or Node module.
(function (root) {
  'use strict';

  // measure and beat lengths in quarters; compound meters beat in dotted quarters
  var TIME = {
    '2/4': { top: 2, bottom: 4, measure: 2, beat: 1 },
    '3/4': { top: 3, bottom: 4, measure: 3, beat: 1 },
    '4/4': { top: 4, bottom: 4, measure: 4, beat: 1 },
    '2/2': { top: 2, bottom: 2, measure: 4, beat: 2 },
    '6/8': { top: 6, bottom: 8, measure: 3, beat: 1.5 },
    '9/8': { top: 9, bottom: 8, measure: 4.5, beat: 1.5 },
    '12/8': { top: 12, bottom: 8, measure: 6, beat: 1.5 },
  };

  function compound(ts) { return TIME[ts].beat === 1.5; }

  // Patterns fill whole beats. 'r' = rest, '~' = tied into the next note.
  // level: the first difficulty level a pattern appears at.
  var SIMPLE = [
    { level: 1, beats: 1, d: ['1'] },
    { level: 1, beats: 2, d: ['2'], on: [0, 2] },
    { level: 1, beats: 4, d: ['4'], on: [0] },
    { level: 2, beats: 1, d: ['.5', '.5'] },
    { level: 2, beats: 1, d: ['r1'] },
    { level: 2, beats: 3, d: ['3'], on: [0] },
    { level: 3, beats: 2, d: ['1.5', '.5'], on: [0, 1, 2] },
    { level: 3, beats: 1, d: ['r.5', '.5'] },
    { level: 3, beats: 1, d: ['.5', 'r.5'] },
    { level: 3, beats: 2, d: ['.5', '1', '.5'], on: [0, 1, 2] },
    { level: 3, beats: 2, d: ['.5', '.5~', '.5', '.5'], on: [0, 1, 2] },
    { level: 4, beats: 1, d: ['.25', '.25', '.25', '.25'] },
    { level: 4, beats: 1, d: ['.5', '.25', '.25'] },
    { level: 4, beats: 1, d: ['.25', '.25', '.5'] },
    { level: 4, beats: 1, d: ['.75', '.25'] },
    { level: 4, beats: 1, d: ['.25', '.5', '.25'] },
  ];
  var COMPOUND = [
    { level: 1, beats: 1, d: ['1.5'] },
    { level: 1, beats: 1, d: ['.5', '.5', '.5'] },
    { level: 1, beats: 1, d: ['1', '.5'] },
    { level: 2, beats: 2, d: ['3'], on: [0, 2] },
    { level: 2, beats: 1, d: ['.5', '1'] },
    { level: 2, beats: 1, d: ['r1.5'] },
    { level: 3, beats: 1, d: ['r.5', '.5', '.5'] },
    { level: 3, beats: 1, d: ['.75', '.25', '.5'] },
    { level: 4, beats: 1, d: ['.25', '.25', '.5', '.5'] },
    { level: 4, beats: 1, d: ['.5', '.25', '.25', '.5'] },
  ];

  function parsePattern(d) {
    return d.map(function (x) {
      var rest = x[0] === 'r';
      var tie = x[x.length - 1] === '~';
      return { dur: Number(x.replace(/[r~]/g, '')), rest: rest, tie: tie };
    });
  }

  // events: [{ dur, rest, tie, measure, start }] (start in quarters from 0)
  function makeRhythm(ts, measures, level, rnd) {
    rnd = rnd || Math.random;
    var info = TIME[ts];
    var lib = compound(ts) ? COMPOUND : SIMPLE;
    var unit = info.beat; // pattern beats are counted in this meter's beat
    if (ts === '2/2') unit = 1; // cut time: patterns in quarters, two per beat
    var units = Math.round(info.measure / unit);
    for (var tries = 0; tries < 200; tries++) {
      var events = [];
      var t = 0;
      var ok = true;
      for (var m = 0; m < measures && ok; m++) {
        var b = 0;
        while (b < units) {
          var last = m === measures - 1;
          var opts = lib.filter(function (p) {
            if (p.level > level || b + p.beats > units) return false;
            if (p.on && p.on.indexOf(b) < 0) return false;
            if (p.beats === 4 && units !== 4) return false;
            return true;
          });
          // end on a held note: the last pattern of the exercise must finish
          // with a note of at least a beat
          if (last) {
            var finals = opts.filter(function (p) {
              if (b + p.beats < units) return true;
              var e = parsePattern(p.d);
              var end = e[e.length - 1];
              return !end.rest && !end.tie && end.dur >= unit;
            });
            if (finals.length) opts = finals;
          }
          if (!opts.length) { ok = false; break; }
          var pat = opts[Math.floor(rnd() * opts.length)];
          parsePattern(pat.d).forEach(function (e) {
            e.measure = m;
            e.start = t;
            t += e.dur;
            events.push(e);
          });
          b += pat.beats;
        }
      }
      if (!ok) continue;
      if (events[0].rest) continue;               // start with a sound
      var fin = events[events.length - 1];
      if (fin.rest || fin.tie) continue;
      var hard = events.filter(function (e) { return e.dur < 1 || e.rest || e.tie; }).length;
      if (level >= 2 && hard === 0) continue;     // make each level show its new material
      return events;
    }
    return [{ dur: info.measure, rest: false, tie: false, measure: 0, start: 0 }];
  }

  // Onset times (in quarters) of the attacks: rests and tied continuations
  // don't get a new attack.
  function onsets(events) {
    var out = [];
    events.forEach(function (e, i) {
      if (e.rest) return;
      if (i > 0 && events[i - 1].tie) return;
      out.push({ index: i, at: e.start });
    });
    return out;
  }

  function median(xs) {
    var s = xs.slice().sort(function (a, b) { return a - b; });
    var m = s.length >> 1;
    return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0;
  }

  // Match taps to expected onsets (both in seconds). A constant offset
  // (Bluetooth, audio output latency, a habitually early tapper) is measured
  // as the median tap-to-nearest-onset difference and removed first.
  function scoreTaps(expected, taps, tol) {
    var diffs = taps.map(function (t) {
      var best = Infinity;
      expected.forEach(function (e) { if (Math.abs(t - e) < Math.abs(best)) best = t - e; });
      return best;
    }).filter(function (d) { return Math.abs(d) < 0.3; });
    var offset = Math.max(-0.25, Math.min(0.25, median(diffs)));
    var adj = taps.map(function (t) { return t - offset; });
    var used = adj.map(function () { return false; });
    var hits = expected.map(function (e) {
      var bi = -1;
      adj.forEach(function (t, i) {
        if (used[i] || Math.abs(t - e) > tol) return;
        if (bi < 0 || Math.abs(t - e) < Math.abs(adj[bi] - e)) bi = i;
      });
      if (bi < 0) return null;
      used[bi] = true;
      return adj[bi] - e;
    });
    return {
      hits: hits.map(function (h) { return h !== null; }),
      errors: hits,
      extras: used.filter(function (u) { return !u; }).length,
      offset: offset,
    };
  }

  var api = { TIME: TIME, compound: compound, makeRhythm: makeRhythm, onsets: onsets, scoreTaps: scoreTaps, parsePattern: parsePattern };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Rhythm = api;
})(this);
