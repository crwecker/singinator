// Modulation: hear where a phrase goes, and sight-sing melodies that
// change key, re-solmizing at the pivot (sol = do).
(function () {
  'use strict';

  var A = App;
  var T = Theory;
  var H = Harmony;
  var ui = A.ui;
  var X = Exercises.helpers;
  var E = Exercises.engines;
  var midiOf = X.midiOf;

  // Hear a phrase; where does it end up?
  E.earModulation = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var target = A.pick(lesson.targets, E.earModulation.last);
      E.earModulation.last = target;
      var m = H.modulation(k, target);
      var again = function () { E.earModulation.round(lesson); };
      var play = function () { A.playVoicings(m.voices, 0.8); };
      ui.prompt('Where does it go?');
      ui.sub('Starts in <b>' + A.keyLabel(k) + '</b>');
      ui.feedback('');
      ui.staff(null);
      ui.actions([{ label: 'Replay', fn: play }]);
      ui.answers(lesson.targets.map(function (t) { return { label: H.MODULATIONS[t].name, value: t }; }), function (v) {
        var ok = v === target;
        ui.lockAnswers(target, v);
        var labels = m.chords.map(function (c) { return c.label; });
        ui.staff({ clef: 'bass', fifths: T.fifths(k), minWidth: 560, notes: m.voices.map(function (vv, i) {
          return { n: vv[0], col: i, state: labels[i].indexOf('=') >= 0 ? 'current' : 'done', label: labels[i].replace(' = ', '=') };
        }) });
        var where = target === 'none' ? 'It stays in ' + A.keyLabel(k) : A.keyLabel(k) + ' → <b>' + A.keyLabel(m.to) + '</b>';
        ui.feedback((ok ? '' : 'Not quite. ') + where, ok ? 'good' : 'bad');
        X.settle(lesson, token, ok, again);
      }, 'cadences');
      A.playCadence(k).then(function () { if (A.alive(token)) play(); });
    },
  };

  function weighted(items) {
    var total = items.reduce(function (a, it) { return a + it.w; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < items.length; i++) { r -= items[i].w; if (r <= 0) return items[i].v; }
    return items[items.length - 1].v;
  }

  // [{ n, k, label }]: a phrase in the home key, a pivot note that is do in
  // the new key, then a cadence in the new key through its leading tone.
  function modulatingMelody(lesson, k1, target, clef) {
    var k2 = H.MODULATIONS[target].newKey(k1);
    var partA = Exercises.makeMelody({ degrees: lesson.degrees, length: 4, leaps: lesson.leaps }, k1).slice(0, 3);
    var tonic1 = A.placeTonic(k1, clef, -2, 7);
    var notes = partA.map(function (s) {
      var n = A.noteAt(k1, tonic1, s.off, s.alt);
      return { n: n, k: k1 };
    });
    // new tonic in the octave nearest the end of part A
    var lastStep = T.step(notes[notes.length - 1].n);
    var best = null;
    for (var oct = 1; oct <= 6; oct++) {
      var t = T.note(k2.tonic.l, k2.tonic.acc, oct);
      if (!best || Math.abs(T.step(t) - lastStep) < Math.abs(T.step(best) - lastStep)) best = t;
    }
    var tonic2 = best;
    var offs = [0];
    var middle = 1 + Math.floor(Math.random() * 2);
    for (var i = 0; i < middle; i++) {
      var cur = offs[offs.length - 1];
      offs.push(weighted([-2, -1, 1, 2, 3].map(function (d) {
        return { v: cur + d, w: Math.abs(d) === 1 ? 5 : Math.abs(d) === 2 ? 2 : 1 };
      }).filter(function (c) { return c.v >= -3 && c.v <= 6 && c.v !== cur; })));
    }
    var end = offs[offs.length - 1] > 3 ? 7 : 0;
    offs.push(end - 1, end); // ti - do
    var ltAlt = k2.mode === 'minor' ? 1 : 0;
    offs.forEach(function (off, i) {
      var alt = T.mod(off, 7) === 6 && i === offs.length - 2 ? ltAlt : 0;
      notes.push({ n: A.noteAt(k2, tonic2, off, alt), k: k2, pivot: i === 0 });
    });
    // fit the whole line into the clef
    var r = T.clefRange(clef);
    var steps = notes.map(function (x) { return T.step(x.n); });
    var lo = Math.min.apply(null, steps), hi = Math.max.apply(null, steps);
    var shift = 0;
    while (hi + shift * 7 > r.hi && lo + (shift - 1) * 7 >= r.lo - 3) shift--;
    while (lo + shift * 7 < r.lo && hi + (shift + 1) * 7 <= r.hi + 3) shift++;
    notes.forEach(function (x) {
      x.n = T.note(x.n.l, x.n.acc, x.n.oct + shift);
      var here = A.sylOf(x.n, x.k);
      x.color = here.color;
      x.label = x.pivot ? A.sylOf(x.n, k1).text + '=' + here.text : here.text;
    });
    return { notes: notes, from: k1, to: k2 };
  }

  // Sight-sing a modulating melody.
  E.sightSingMod = {
    mic: true,
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var target = A.pick(lesson.targets);
      var clef = X.clefOf(lesson);
      var mm = modulatingMelody(lesson, k, target, clef);
      var notes = mm.notes;
      var again = function () { E.sightSingMod.round(lesson); };
      var cur = 0;
      var draw = function (i) {
        if (i != null) cur = i;
        ui.staff({ clef: clef, fifths: T.fifths(k), minWidth: 520, notes: notes.map(function (x, j) {
          var done = cur < 0 || j < cur;
          var it = { n: x.n, state: done ? 'done' : j === cur ? 'current' : '', label: done || x.pivot ? x.label : '' };
          if (done) it.color = x.color;
          return it;
        }) });
      };
      var tonic = A.placeTonic(k, clef, 0, 0);
      var start = function () { A.playCadence(k).then(function () { if (A.alive(token)) Sound.playNote(midiOf(tonic), 1); }); };

      ui.prompt('Sight-sing: this one modulates');
      ui.sub('Starts in <b>' + A.keyLabel(k) + '</b> · re-solmize at the pivot (' + notes.filter(function (x) { return x.pivot; })[0].label + ')');
      ui.feedback('');
      ui.answers([]);
      ui.meter(true);
      draw(0);
      var run;
      ui.actions([
        { label: 'Hear tonic', ghost: true, fn: function () { Sound.playNote(midiOf(tonic), 1); } },
        { label: 'Hear melody', ghost: true, fn: function () { Sound.playSequence(notes.map(function (x) { return midiOf(x.n); }), 0.6); } },
        { label: 'Start over', ghost: true, fn: function () { run.restart(); } },
        { label: 'Skip', ghost: true, fn: function () {
          A.stopListening();
          draw(-1);
          A.record(lesson.id, false);
          Sound.playSequence(notes.map(function (x) { return midiOf(x.n); }), 0.5).then(function () { X.later(token, 600, again); });
        } },
      ]);
      start();
      run = X.singMelody({ labels: false }, token, k, clef, notes.map(function (x) { return x.n; }), draw, function () {
        ui.prompt('Nice!');
        ui.feedback(A.keyLabel(mm.from) + ' → ' + A.keyLabel(mm.to), 'good');
        X.settle(lesson, token, true, again);
      });
    },
  };

  Exercises.modulatingMelody = modulatingMelody;
})();
