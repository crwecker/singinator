// Modes, other scales, compound intervals and interval inversion.
(function () {
  'use strict';

  var A = App;
  var T = Theory;
  var ui = A.ui;
  var X = Exercises.helpers;
  var E = Exercises.engines;
  var midiOf = X.midiOf;

  var MODE_ORDER = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];
  var DISPLAY = {
    major: 'Major', minor: 'Natural minor', ionian: 'Ionian', dorian: 'Dorian', phrygian: 'Phrygian', lydian: 'Lydian',
    mixolydian: 'Mixolydian', aeolian: 'Aeolian', locrian: 'Locrian',
    'major pentatonic': 'Major pentatonic', 'minor pentatonic': 'Minor pentatonic', blues: 'Blues',
    'whole tone': 'Whole tone', 'octatonic (H-W)': 'Octatonic (half-whole)', 'octatonic (W-H)': 'Octatonic (whole-half)',
    'harmonic minor': 'Harmonic minor', 'melodic minor': 'Melodic minor',
  };
  function title(id) { return DISPLAY[id] || id; }

  // Any scale or mode id, spelled up an octave from a tonic note.
  function scaleFor(id, tonic) {
    if (T.SCALES[id]) return T.scaleNotes(tonic, id);
    var k = T.key(tonic, id);
    var notes = [];
    for (var d = 0; d <= 7; d++) {
      var n = T.degreeNote(k, d % 7, 0, tonic.oct);
      if (d === 7) n.oct = tonic.oct + 1;
      notes.push(n);
    }
    return notes;
  }

  // A tonic that keeps the scale on the staff and free of double accidentals.
  var TONICS = ['C4', 'D4', 'E4', 'F4', 'G4', 'A3', 'Bb3', 'Eb4', 'B3', 'F#4', 'Ab3', 'Db4'];
  function scaleWithTonic(id, clef, fixed) {
    for (var i = 0; i < 40; i++) {
      var t = T.parse(fixed || A.pick(TONICS));
      if (clef === 'bass') t.oct -= 1;
      var notes = scaleFor(id, t);
      if (notes.every(function (n) { return Math.abs(n.acc) <= 1; })) return notes;
    }
    return scaleFor(id, T.parse('C4'));
  }

  function scaleStaff(notes, clef, current, labels) {
    return { clef: clef, minWidth: 520, notes: notes.map(function (n, i) {
      return { n: n, state: current == null ? '' : i === current ? 'current' : 'faded', label: labels ? T.name(n) : '' };
    }) };
  }

  // Tap through scales and modes to see and hear them.
  E.exploreScale = {
    round: function (lesson, which) {
      var token = A.newToken();
      A.markSeen(lesson.id);
      var id = which || lesson.scales[0];
      var notes = scaleWithTonic(id, 'treble', lesson.tonic || 'C4');
      var draw = function (i) { ui.staff(scaleStaff(notes, 'treble', i, true)); };
      ui.prompt(title(id));
      ui.sub(lesson.blurbs && lesson.blurbs[id] ? lesson.blurbs[id] : 'Tap a scale to hear it');
      ui.feedback('');
      draw(null);
      ui.answers(lesson.scales.map(function (s) { return { label: title(s), value: s }; }), function (v) {
        E.exploreScale.round(lesson, v);
        var mine = A.session.token; // the round just started; leaving it cancels the animation
        var n2 = scaleWithTonic(v, 'treble', lesson.tonic || 'C4');
        Sound.playSequence(n2.map(midiOf), 0.4, function (i) {
          if (A.alive(mine)) ui.staff(scaleStaff(n2, 'treble', i, true));
        });
      }, 'scales');
      ui.actions([
        { label: 'Play up & down', fn: function () {
          var seq = notes.concat(notes.slice(0, -1).reverse());
          Sound.playSequence(seq.map(midiOf), 0.35, function (i) {
            if (A.alive(token)) draw(i < notes.length ? i : 2 * notes.length - 2 - i);
          });
        } },
      ]);
    },
  };

  // Hear a scale (or mode); name it.
  E.earScale = {
    round: function (lesson) {
      var token = A.newToken();
      var id = A.pick(lesson.scales, E.earScale.last);
      E.earScale.last = id;
      var notes = scaleWithTonic(id, 'treble');
      var again = function () { E.earScale.round(lesson); };
      var play = function () {
        var seq = lesson.descending ? notes.concat(notes.slice(0, -1).reverse()) : notes;
        return Sound.playSequence(seq.map(midiOf), 0.32);
      };
      ui.prompt('Which scale?');
      ui.sub(lesson.descending ? 'Up and back down' : 'Ascending');
      ui.feedback('');
      ui.staff(null);
      ui.actions([{ label: 'Replay', fn: play }]);
      ui.answers(lesson.scales.map(function (s) { return { label: title(s), value: s }; }), function (v) {
        var ok = v === id;
        ui.lockAnswers(id, v);
        ui.staff(scaleStaff(notes, 'treble', null, true));
        ui.feedback((ok ? '' : 'It was ') + '<b>' + title(id) + '</b> on ' + T.name(notes[0]), ok ? 'good' : 'bad');
        X.settle(lesson, token, ok, again);
      }, 'scales');
      play();
    },
  };

  // See a scale on the staff; name it.
  E.readScale = {
    round: function (lesson) {
      var token = A.newToken();
      var id = A.pick(lesson.scales, E.readScale.last);
      E.readScale.last = id;
      var clef = X.clefOf(lesson);
      var notes = scaleWithTonic(id, clef);
      var again = function () { E.readScale.round(lesson); };
      ui.prompt('Name this scale');
      ui.sub(X.clefName(clef));
      ui.feedback('');
      ui.actions([]);
      ui.staff(scaleStaff(notes, clef, null, false));
      ui.answers(lesson.scales.map(function (s) { return { label: title(s), value: s }; }), function (v) {
        var ok = v === id;
        ui.lockAnswers(id, v);
        ui.staff(scaleStaff(notes, clef, null, true));
        ui.feedback((ok ? '' : 'It’s ') + '<b>' + title(id) + '</b> on ' + T.name(notes[0]), ok ? 'good' : 'bad');
        Sound.playSequence(notes.map(midiOf), 0.3);
        X.settle(lesson, token, ok, again);
      }, 'scales');
    },
  };

  // Key signature + final note: which mode?
  E.modeFinal = {
    round: function (lesson) {
      var token = A.newToken();
      var modes = lesson.modes;
      var mode = A.pick(modes, E.modeFinal.last);
      E.modeFinal.last = mode;
      var keys = T.allKeys(mode, lesson.max == null ? 4 : lesson.max);
      var k = A.pick(keys);
      var clef = X.clefOf(lesson);
      var tonic = A.placeTonic(k, clef, 0, 7);
      var again = function () { E.modeFinal.round(lesson); };
      ui.prompt('Which mode ends on this note?');
      ui.sub('Key signature + final note · ' + X.clefName(clef));
      ui.feedback('');
      ui.actions([]);
      ui.staff({ clef: clef, fifths: T.fifths(k), notes: [{ n: tonic, state: 'current' }] });
      ui.answers(MODE_ORDER.filter(function (m) { return modes.indexOf(m) >= 0; }).map(function (m) {
        return { label: title(m), value: m };
      }), function (v) {
        var ok = v === mode;
        ui.lockAnswers(mode, v);
        var notes = [];
        for (var d = 0; d <= 7; d++) notes.push(A.noteAt(k, tonic, d, 0));
        ui.staff({ clef: clef, fifths: T.fifths(k), minWidth: 520, notes: notes.map(function (n, i) {
          return X.staffNote(n, k, { state: i === 0 || i === 7 ? 'current' : '', label: A.sylOf(n, k).text });
        }) });
        ui.feedback((ok ? '' : 'It’s ') + '<b>' + T.name(k.tonic) + ' ' + title(mode) + '</b>', ok ? 'good' : 'bad');
        Sound.playSequence(notes.map(midiOf), 0.3);
        X.settle(lesson, token, ok, again);
      }, 'scales');
    },
  };

  // Sing a scale or mode from the staff.
  E.singScale = {
    mic: true,
    round: function (lesson) {
      var token = A.newToken();
      var id = A.pick(lesson.scales, E.singScale.last);
      E.singScale.last = id;
      var clef = X.clefOf(lesson);
      var notes = scaleWithTonic(id, clef);
      if (lesson.descending) notes = notes.concat(notes.slice(0, -1).reverse());
      var again = function () { E.singScale.round(lesson); };
      var cur = 0;
      var draw = function (i) {
        if (i != null) cur = i;
        ui.staff({ clef: clef, minWidth: 520, notes: notes.map(function (n, j) {
          var done = cur < 0 || j < cur;
          return { n: n, state: done ? 'done' : j === cur ? 'current' : '', label: T.name(n), color: done ? 'var(--fa)' : undefined };
        }) });
      };
      var fakeKey = T.key(notes[0], 'major');
      ui.prompt('Sing ' + title(id) + ' on ' + T.name(notes[0]));
      ui.sub(X.clefName(clef) + ' · first note in any octave');
      ui.feedback('');
      ui.answers([]);
      ui.meter(true);
      draw(0);
      var run;
      ui.actions([
        { label: 'Hear it', ghost: true, fn: function () { Sound.playSequence(notes.map(midiOf), 0.35); } },
        { label: 'Start over', ghost: true, fn: function () { run.restart(); } },
        { label: 'Skip', ghost: true, fn: function () { A.stopListening(); A.record(lesson.id, false); again(); } },
      ]);
      Sound.playNote(midiOf(notes[0]), 1);
      run = X.singMelody({ labels: false }, token, fakeKey, clef, notes, draw, function () {
        ui.prompt('Nice!');
        X.settle(lesson, token, true, again);
      });
    },
  };

  // Name the inversion of an interval.
  E.invertInterval = {
    round: function (lesson) {
      var token = A.newToken();
      var id = A.pick(lesson.intervals, E.invertInterval.last);
      E.invertInterval.last = id;
      var inv = T.invertInterval(id);
      var a = T.parse(A.pick(['C4', 'D4', 'E4', 'F4', 'G4', 'Bb3', 'A3']));
      var b = T.transpose(a, id, true);
      var again = function () { E.invertInterval.round(lesson); };
      ui.prompt('Invert a <b>' + T.intervalName(id) + '</b>');
      ui.sub('Move the bottom note up an octave. What do you get?');
      ui.feedback('');
      ui.actions([]);
      ui.staff({ clef: 'treble', notes: [{ n: a, label: T.name(a), col: 0 }, { n: b, label: T.name(b), col: 0 }] });
      var choices = lesson.intervals.map(T.invertInterval).concat(lesson.intervals)
        .filter(function (x, i, arr) { return arr.indexOf(x) === i; })
        .sort(function (x, y) { return T.parseInterval(x).semis - T.parseInterval(y).semis || T.parseInterval(x).size - T.parseInterval(y).size; });
      ui.answers(choices.map(function (x) { return { label: x, value: x }; }), function (v) {
        var ok = v === inv;
        ui.lockAnswers(inv, v);
        var a2 = T.note(a.l, a.acc, a.oct + 1);
        ui.staff({ clef: 'treble', notes: [
          { n: b, label: T.name(b), col: 0 }, { n: a2, label: T.name(a2), col: 0 },
        ] });
        ui.feedback((ok ? '' : 'It’s a ') + '<b>' + T.intervalName(inv) + '</b> — ' + T.parseInterval(id).semis + ' + ' + T.parseInterval(inv).semis + ' = 12 half steps', ok ? 'good' : 'bad');
        Sound.playSequence([[midiOf(a), midiOf(b)], [midiOf(b), midiOf(a2)]], 0.9);
        X.settle(lesson, token, ok, again);
      }, 'intervals');
    },
  };
})();
