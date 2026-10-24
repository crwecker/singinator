// Harmony engines: chords by ear and on the staff, Roman numerals, sung
// arpeggios, cadences and harmonic dictation. Registers into
// Exercises.engines like the others.
(function () {
  'use strict';

  var A = App;
  var T = Theory;
  var H = Harmony;
  var ui = A.ui;
  var X = Exercises.helpers;
  var E = Exercises.engines;
  var midiOf = X.midiOf;

  // Harmonic function for the function lessons (the cadential 6/4 is dominant).
  var FN_NAMES = { T: 'Tonic', PD: 'Predominant', D: 'Dominant', CAD: 'Dominant' };
  var FN_SHORT = { T: 'T', PD: 'PD', D: 'D', CAD: 'D' };

  var ROOTS = ['C3', 'D3', 'Eb3', 'E3', 'F3', 'F#3', 'G3', 'Ab3', 'A3', 'Bb3', 'B3', 'C4', 'Db4', 'D4', 'E4', 'F4'];
  var INV_NAMES = ['Root position', '1st inversion', '2nd inversion', '3rd inversion'];

  // A random spelled root whose chord stays free of double accidentals.
  function cleanChord(type, inv) {
    for (var i = 0; i < 50; i++) {
      var root = T.parse(A.pick(ROOTS));
      var tones = T.chordVoicing(root, type, inv);
      if (tones.every(function (t) { return Math.abs(t.acc) <= 1; })) return tones;
    }
    return T.chordVoicing(T.parse('C4'), type, inv);
  }

  function clefFor(notes) {
    var avg = notes.reduce(function (a, n) { return a + midiOf(n); }, 0) / notes.length;
    return avg < 57 ? 'bass' : 'treble';
  }

  function chordStaff(notes, clef, fifths, label, state) {
    return { clef: clef, fifths: fifths || 0, minWidth: 360, notes: notes.map(function (n, i) {
      return { n: n, col: 0, state: state || 'current', label: i === 0 ? label : '' };
    }) };
  }

  function playChord(notes, arpeggio) {
    var midis = notes.map(midiOf);
    var seq = [midis];
    if (arpeggio) seq = seq.concat(midis);
    return Sound.playSequence(seq, 0.8);
  }

  function seventh(type) { return T.CHORDS[type].ivs.length === 3; }

  // Hear a chord: name its quality, or (askInversion) its inversion.
  E.earChord = {
    round: function (lesson) {
      var token = A.newToken();
      var type = A.pick(lesson.types, E.earChord.last);
      E.earChord.last = type;
      var maxInv = seventh(type) ? 3 : 2;
      var inv = lesson.askInversion || lesson.inversions ? Math.floor(Math.random() * (maxInv + 1)) : 0;
      var notes = cleanChord(type, inv);
      var clef = clefFor(notes);
      var again = function () { E.earChord.round(lesson); };
      var play = function () { playChord(notes, true); };
      var answer = lesson.askInversion ? INV_NAMES[inv] : type;

      ui.prompt(lesson.askInversion ? 'Which inversion?' : 'What kind of chord?');
      ui.sub('Played together, then broken');
      ui.feedback('');
      ui.staff({ clef: clef, notes: [] });
      ui.actions([
        { label: 'Replay', fn: play },
        { label: 'Together', ghost: true, fn: function () { playChord(notes, false); } },
      ]);
      var choices = lesson.askInversion
        ? INV_NAMES.slice(0, lesson.types.some(seventh) ? 4 : 3).map(function (n) { return { label: n, value: n }; })
        : lesson.types.map(function (t) { return { label: T.CHORDS[t].name, value: t }; });
      ui.answers(choices, function (v) {
        var ok = v === answer;
        ui.lockAnswers(answer, v);
        var root = notes[(notes.length - inv) % notes.length];
        var desc = T.name(root) + ' ' + T.CHORDS[type].name + ', ' + INV_NAMES[inv].toLowerCase();
        ui.staff(chordStaff(notes, clef, 0, T.figure(type, inv) || 'root'));
        ui.feedback((ok ? '' : 'It was: ') + '<b>' + desc + '</b>', ok ? 'good' : 'bad');
        playChord(notes, false);
        X.settle(lesson, token, ok, again);
      }, 'chords');
      play();
    },
  };

  // Read a chord on the staff: its quality (and inversion when asked).
  E.readChord = {
    round: function (lesson) {
      var token = A.newToken();
      var type = A.pick(lesson.types, E.readChord.last);
      E.readChord.last = type;
      var maxInv = seventh(type) ? 3 : 2;
      var inv = lesson.inversions ? Math.floor(Math.random() * (maxInv + 1)) : 0;
      var notes = cleanChord(type, inv);
      var clef = lesson.clefs ? A.pick(lesson.clefs) : clefFor(notes);
      // Re-place the chord in the chosen clef's range.
      var r = T.clefRange(clef);
      var mid = (r.lo + r.hi) / 2;
      var shift = Math.round((mid - T.step(notes[0]) - 3) / 7);
      notes = notes.map(function (n) { return T.note(n.l, n.acc, n.oct + shift); });
      var answer = lesson.inversions ? type + '|' + inv : type;
      var again = function () { E.readChord.round(lesson); };

      ui.prompt(lesson.inversions ? 'Quality and inversion?' : 'What kind of chord?');
      ui.sub(X.clefName(clef));
      ui.feedback('');
      ui.actions([]);
      ui.staff(chordStaff(notes, clef, 0, ''));
      var choices = [];
      lesson.types.forEach(function (t) {
        var n = seventh(t) ? 4 : 3;
        if (!lesson.inversions) { choices.push({ label: T.CHORDS[t].name, value: t }); return; }
        for (var i = 0; i < n; i++) {
          choices.push({ label: T.CHORDS[t].name.replace(' 7th', '7').replace('half-diminished', 'ø').replace('diminished', 'dim').replace('dominant', 'dom').replace('augmented', 'aug'),
            sub: T.figure(t, i) || 'root', value: t + '|' + i });
        }
      });
      ui.answers(choices, function (v) {
        var ok = v === answer;
        ui.lockAnswers(answer, v);
        // Inverting moves the lower tones up, so the root ends up here.
        var root = notes[(notes.length - inv) % notes.length];
        var desc = T.name(root) + ' ' + T.CHORDS[type].name + (lesson.inversions ? ', ' + INV_NAMES[inv].toLowerCase() : '');
        ui.staff(chordStaff(notes, clef, 0, T.figure(type, inv) || 'root'));
        ui.feedback((ok ? '' : 'It’s ') + '<b>' + desc + '</b>', ok ? 'good' : 'bad');
        playChord(notes, true);
        X.settle(lesson, token, ok, again);
      }, lesson.inversions ? 'chords dense' : 'chords');
    },
  };

  // Roman numeral (with figures) of a chord in a key.
  E.readNumeral = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var clef = X.clefOf(lesson);
      var id = A.pick(lesson.chords, E.readNumeral.last);
      E.readNumeral.last = id;
      var c = H.chord(k, id);
      var notes = T.chordVoicing(c.root, c.type, c.inv);
      var r = T.clefRange(clef);
      var shift = Math.round(((r.lo + r.hi) / 2 - T.step(notes[0]) - 3) / 7);
      notes = notes.map(function (n) { return T.note(n.l, n.acc, n.oct + shift); });
      var again = function () { E.readNumeral.round(lesson); };

      var fn = lesson.askFunction ? FN_NAMES[H.FUNCTION[id]] : null;
      var answer = fn || c.label;

      ui.prompt(fn ? 'Tonic, predominant or dominant?' : 'Roman numeral?');
      ui.sub(X.keyLine(k, clef));
      ui.feedback('');
      ui.actions([]);
      ui.staff(chordStaff(notes, clef, T.fifths(k), ''));
      var seen = {};
      var choices = fn ? ['Tonic', 'Predominant', 'Dominant'].map(function (l) { return { label: l, value: l }; })
        : lesson.chords.map(function (x) { return H.chord(k, x).label; })
          .filter(function (l) { if (seen[l]) return false; seen[l] = true; return true; })
          .map(function (l) { return { label: l, value: l }; });
      ui.answers(choices, function (v) {
        var ok = v === answer;
        ui.lockAnswers(answer, v);
        ui.staff(chordStaff(notes, clef, T.fifths(k), c.label));
        ui.feedback((ok ? '' : 'It’s ') + '<b>' + (fn ? fn + '</b>: ' + c.label : c.label + '</b>') + ' — ' + T.name(c.root) + ' ' + T.CHORDS[c.type].name, ok ? 'good' : 'bad');
        A.playCadence(k, true).then(function () { if (A.alive(token)) playChord(notes, false); });
        if (!ok && fn) X.review('function#categories');
        X.settle(lesson, token, ok, again);
      }, 'chords');
    },
  };

  // Sing a chord's arpeggio in a key, bottom up (and back down when asked).
  E.singChord = {
    mic: true,
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var clef = X.clefOf(lesson);
      var id = A.pick(lesson.chords, E.singChord.last);
      E.singChord.last = id;
      var c = H.chord(k, id);
      var tonic = A.placeTonic(k, clef, 0, 7);
      // root position, starting from the chord root nearest the staff middle
      var root = c.tones[0];
      var start = T.note(root.l, root.acc, tonic.oct);
      if (T.step(start) < T.step(tonic) - 1) start.oct++;
      var notes = T.chordVoicing(start, c.type, 0);
      notes = notes.concat([T.note(start.l, start.acc, start.oct + 1)]);
      if (T.step(notes[notes.length - 1]) > T.clefRange(clef).hi) notes = notes.map(function (n) { return T.note(n.l, n.acc, n.oct - 1); });
      var again = function () { E.singChord.round(lesson); };
      var cur = 0;
      var draw = function (i) {
        if (i != null) cur = i;
        ui.staff({ clef: clef, fifths: T.fifths(k), notes: notes.map(function (n, j) {
          var done = cur < 0 || j < cur;
          return X.staffNote(n, k, { state: done ? 'done' : j === cur ? 'current' : '', label: A.sylOf(n, k).text });
        }) });
      };
      var syls = notes.map(function (n) { return A.sylOf(n, k).text; }).join('–');

      ui.prompt('Sing <b>' + c.label + '</b>');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · ' + syls + ' · first note in any octave');
      ui.feedback('');
      ui.answers([]);
      ui.meter(true);
      draw(0);
      var run;
      ui.actions([
        { label: 'Replay key', ghost: true, fn: function () { A.playCadence(k, true); } },
        { label: 'Hear chord', ghost: true, fn: function () { playChord(notes.slice(0, -1), false); } },
        { label: 'Start over', ghost: true, fn: function () { run.restart(); } },
        { label: 'Skip', ghost: true, fn: function () {
          A.stopListening();
          draw(-1);
          A.record(lesson.id, false);
          Sound.playSequence(notes.map(midiOf), 0.5).then(function () { X.later(token, 500, again); });
        } },
      ]);
      A.playCadence(k);
      run = X.singMelody(Object.assign({}, lesson, { labels: true }), token, k, clef, notes, draw, function () {
        ui.prompt('Nice!');
        X.settle(lesson, token, true, again);
      });
    },
  };

  function bassLine(voices, k, labels) {
    return { clef: 'bass', fifths: T.fifths(k), minWidth: 480, notes: voices.map(function (v, i) {
      return { n: v[0], col: i, state: 'done', label: labels[i] };
    }) };
  }

  // Hear a phrase; name its cadence.
  E.earCadence = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var type = A.pick(lesson.cadences, E.earCadence.last);
      E.earCadence.last = type;
      var phrase = H.cadencePhrase(k, type);
      var again = function () { E.earCadence.round(lesson); };
      var play = function () { A.playVoicings(phrase.voices, 0.85); };

      ui.prompt('Which cadence?');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · listen to the last two chords');
      ui.feedback('');
      ui.staff(null);
      ui.actions([{ label: 'Replay', fn: play }]);
      ui.answers(lesson.cadences.map(function (c) { return { label: H.CADENCES[c].name, value: c }; }), function (v) {
        var ok = v === type;
        ui.lockAnswers(type, v);
        var labels = phrase.chords.map(function (c) { return c.label; });
        ui.staff(bassLine(phrase.voices, k, labels));
        ui.feedback((ok ? '' : 'It was ') + '<b>' + H.CADENCES[type].name + '</b>: ' + labels.slice(-2).join(' → '), ok ? 'good' : 'bad');
        if (!ok) X.review(Learn.LINKS.cadence[type]);
        X.settle(lesson, token, ok, again);
      }, 'cadences');
      play();
    },
  };

  // Hear a progression; write its Roman numerals.
  E.dictation = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var len = lesson.length || 4;
      if (Array.isArray(len)) len = len[0] + Math.floor(Math.random() * (len[1] - len[0] + 1));
      var ids = H.makeProgression(lesson.chords, len);
      len = ids.length; // the generator's fallback can be shorter
      var chords = ids.map(function (id) { return H.chord(k, id); });
      var voices = H.voiceLead(k, chords);
      var numerals = chords.map(function (c) { return c.label; });
      // function lessons write T / PD / D in place of numerals
      var labels = lesson.functions ? ids.map(function (id) { return FN_SHORT[H.FUNCTION[id]]; }) : numerals;
      var answer = [labels[0]];
      var done = false;
      var again = function () { E.dictation.round(lesson); };
      var play = function () {
        A.playVoicings(voices, 0.9, function (i) {
          if (!A.alive(token) || done) return;
          drawSlots(i);
        }).then(function () { if (A.alive(token) && !done) drawSlots(-1); });
      };
      function drawSlots(playing) {
        ui.slots(labels.map(function (l, i) {
          var state = i === 0 ? 'given' : answer[i] ? 'filled' : 'empty' + (i === answer.length ? ' next' : '');
          if (i === playing) state += ' playing';
          return { label: answer[i] || '', state: state };
        }));
      }

      ui.prompt(lesson.functions ? 'Write each chord’s function' : 'Write the progression');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · ' + len + ' chords · the first is given');
      ui.feedback('');
      ui.staff(null);
      drawSlots(-1);
      var seen = {};
      var palette = lesson.functions ? ['T', 'PD', 'D'] : lesson.chords.map(function (x) { return H.chord(k, x).label; })
        .filter(function (l) { if (seen[l]) return false; seen[l] = true; return true; });
      ui.answers(palette.map(function (l) { return { label: l, value: l }; }), function (v) {
        if (done || answer.length >= len) return;
        answer.push(v);
        drawSlots(-1);
      }, 'chords');
      var check = function () {
        if (answer.length < len) { ui.feedback('Fill every chord first'); return; }
        done = true;
        var ok = answer.every(function (a, i) { return a === labels[i]; });
        ui.slots(labels.map(function (l, i) {
          return { label: answer[i], state: i === 0 ? 'given' : answer[i] === l ? 'right' : 'wrong', sub: answer[i] === l ? '' : l };
        }));
        document.getElementById('answers').classList.add('locked');
        ui.staff(bassLine(voices, k, numerals));
        ui.feedback(ok ? 'All correct' + (lesson.functions ? ': ' + numerals.join(' – ') : '') : 'Answer: <b>' + labels.join(' – ') + '</b>' +
          (lesson.functions ? ' (' + numerals.join(' – ') + ')' : ''), ok ? 'good' : 'bad');
        A.record(lesson.id, ok);
        if (ok) A.celebrate('✓', false);
        ui.actions([{ label: 'Replay', ghost: true, fn: play }, { label: 'Next →', fn: again }]);
      };
      ui.actions([
        { label: 'Replay', ghost: true, fn: play },
        { label: 'Undo', ghost: true, fn: function () { if (!done && answer.length > 1) { answer.pop(); drawSlots(-1); } } },
        { label: 'Check', fn: check },
      ]);
      A.playCadence(k).then(function () { if (A.alive(token)) play(); });
    },
  };
})();
