// Exercise engines. Each one runs rounds for a lesson from curriculum.js.
// Every round grabs a fresh token; anything async checks App.alive(token)
// so leaving the lesson (or moving on) cancels pending work.
(function (root) {
  'use strict';

  var A = App;
  var T = Theory;
  var ui = A.ui;

  function clefOf(lesson) { return A.pick(lesson.clefs || ['treble']); }
  function clefName(c) { return T.CLEFS[c].name + ' clef'; }
  function midiOf(n) { return T.midi(n); }
  function keyLine(k, clef) {
    return 'Key: <b>' + A.keyLabel(k) + '</b> · ' + clefName(clef);
  }

  // Schedule the next round unless the student has moved on.
  function later(token, ms, fn) {
    setTimeout(function () { if (A.alive(token)) fn(); }, ms);
  }

  // After an answer: record it, then auto-advance when right or offer Next.
  function settle(lesson, token, ok, again) {
    A.record(lesson.id, ok);
    if (ok) {
      A.celebrate('✓', false);
      later(token, 1100, again);
    } else {
      ui.actions([{ label: 'Next →', fn: again }]);
    }
  }

  // Skip spellings that need a double accidental (ri in E major = F
  // double-sharp), except minor's raised 6th and 7th, which are real (the
  // leading tone of G♯ minor is F double-sharp).
  function usableDegree(s, k, tonic) {
    var d = A.parseDegree(s);
    if (k.mode === 'minor' && (s === '+6' || s === '+7')) return true;
    return Math.abs(A.noteAt(k, tonic, d.deg, d.alt).acc) <= 1;
  }

  // A random degree from the pool as a note, avoiding the previous question.
  function pickDegreeNote(degrees, k, tonic, memo) {
    var usable = degrees.filter(function (s) { return usableDegree(s, k, tonic); });
    var ds = A.pick(usable, memo.last);
    memo.last = ds;
    var d = A.parseDegree(ds);
    return A.noteAt(k, tonic, d.deg, d.alt);
  }

  // Unique syllable answers for a key, in curriculum order.
  function syllableChoices(k, tonic, degrees) {
    var seen = {};
    var out = [];
    degrees.forEach(function (s) {
      var d = A.parseDegree(s);
      var n = A.noteAt(k, tonic, d.deg, d.alt);
      var info = A.sylOf(n, k);
      if (seen[info.text] || !usableDegree(s, k, tonic)) return;
      seen[info.text] = true;
      out.push({ label: info.text, value: info.text, color: info.color });
    });
    return out;
  }

  function staffNote(n, k, opts) {
    var info = A.sylOf(n, k);
    return Object.assign({ n: n, color: info.color }, opts || {});
  }

  // ---------- Melodies ----------
  function weightedPick(items) {
    var total = items.reduce(function (a, it) { return a + it.w; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < items.length; i++) { r -= items[i].w; if (r <= 0) return items[i].v; }
    return items[items.length - 1].v;
  }

  // Returns [{ off, alt }]: diatonic offsets from the tonic.
  function makeMelody(lesson, k) {
    var len = lesson.length || 5;
    var pool = lesson.degrees.map(A.parseDegree);
    var allowed = {};
    pool.forEach(function (d) { if (d.alt === 0) allowed[d.deg % 7] = true; });
    var ok = function (off) { return allowed[T.mod(off, 7)] && off >= -3 && off <= 8; };

    var starts = [0, 0, 2, 4].filter(ok);
    var seq = [A.pick(starts)];
    while (seq.length < len - 1) {
      var cur = seq[seq.length - 1];
      var cands = [];
      for (var off = cur - 4; off <= cur + 4; off++) {
        if (off === cur || !ok(off)) continue;
        var dist = Math.abs(off - cur);
        var w = [0, 6, 3, lesson.leaps ? 1.5 : 0.6, lesson.leaps ? 1 : 0.3][dist];
        cands.push({ v: off, w: w });
      }
      seq.push(weightedPick(cands));
    }
    var last = seq[seq.length - 1];
    seq.push(Math.abs(last - 7) < Math.abs(last) ? 7 : 0);

    var notes = seq.map(function (off) { return { off: off, alt: 0 }; });

    // Minor: raise 7 going to the tonic (harmonic), and 6 on the way up to a
    // raised 7 (melodic), when the lesson includes them.
    var hasRaised = lesson.degrees.indexOf('+7') >= 0 || (lesson.keys && lesson.keys.mode === 'any') || lesson.chromatic;
    if (k.mode === 'minor' && hasRaised) {
      for (var i = notes.length - 2; i >= 0; i--) {
        var a = notes[i], b = notes[i + 1];
        var prev = notes[i - 1];
        var ascending = !prev || prev.off < a.off;
        if (T.mod(a.off, 7) === 6 && b.off === a.off + 1) a.alt = 1;
        if (T.mod(a.off, 7) === 5 && b.off === a.off + 1 && b.alt === 1 && ascending) a.alt = 1;
      }
    }

    // A chromatic note must have a standard syllable in both minor
    // conventions and no double accidental (no se in E♭ = B𝄫).
    var STANDARD = /^(do|di|ra|re|ri|me|mi|fa|fi|se|sol|si|le|la|li|te|ti)$/;
    var plain = function (off, alt) {
      var n = A.noteAt(k, T.note(k.tonic.l, k.tonic.acc, 4), off, alt);
      return Math.abs(n.acc) <= 1 && STANDARD.test(T.syllable(n, k, 'do').syl) && STANDARD.test(T.syllable(n, k, 'la').syl);
    };

    // Chromatic passing tones: raised notes resolve up, lowered resolve down,
    // filling a whole step (fa-fi-sol, la-le-sol).
    if (lesson.chromatic) {
      var tonic = T.note(k.tonic.l, k.tonic.acc, 4);
      var semis = function (n1, n2) {
        return midiOf(A.noteAt(k, tonic, n2.off, n2.alt)) - midiOf(A.noteAt(k, tonic, n1.off, n1.alt));
      };
      var wanted = len >= 7 ? 2 : 1;
      var spots = [];
      for (var j = 0; j < notes.length - 1; j++) {
        var d = notes[j + 1].off - notes[j].off;
        if ((d === 1 || d === -1) && Math.abs(semis(notes[j], notes[j + 1])) === 2 && notes[j].alt === 0 &&
            plain(notes[j].off, d)) spots.push(j);
      }
      spots.sort(function () { return Math.random() - 0.5; });
      spots.slice(0, wanted).sort(function (x, y) { return y - x; }).forEach(function (j) {
        var up = notes[j + 1].off > notes[j].off;
        notes.splice(j + 1, 0, { off: notes[j].off, alt: up ? 1 : -1 });
      });
    }
    return notes;
  }

  function placeMelody(lesson, k, clef) {
    var shape = makeMelody(lesson, k);
    var offs = shape.map(function (s) { return s.off; });
    var tonic = A.placeTonic(k, clef, Math.min.apply(null, offs), Math.max.apply(null, offs));
    return shape.map(function (s) { return A.noteAt(k, tonic, s.off, s.alt); });
  }

  // ---------- Engines ----------
  var E = {};

  // Tap syllables to hear and see them.
  E.explore = {
    round: function (lesson, keyIndex) {
      var token = A.newToken();
      A.markSeen(lesson.id);
      var keys = A.keysFor(lesson.keys);
      var ki = keyIndex || 0;
      var k = keys[ki % keys.length];
      var clef = (lesson.clefs || ['treble'])[0];
      var degs = lesson.degrees.map(A.parseDegree);
      var tonic = A.placeTonic(k, clef, 0, 7);
      var notes = degs.map(function (d) { return A.noteAt(k, tonic, d.deg, d.alt); });

      function draw(current) {
        ui.staff({
          clef: clef, fifths: T.fifths(k), minWidth: 520,
          notes: notes.map(function (n, i) {
            return staffNote(n, k, { state: i === current ? 'current' : current == null ? '' : 'faded', label: A.sylOf(n, k).text });
          }),
        });
      }

      ui.prompt('Tap a syllable to hear it');
      ui.sub(keyLine(k, clef) + (k.mode === 'minor' ? ' · ' + (A.settings.minor === 'la' ? 'la' : 'do') + '-based minor' : ''));
      ui.feedback('');
      draw(null);
      ui.answers(notes.map(function (n, i) {
        var info = A.sylOf(n, k);
        return { label: info.text, sub: T.name(n), value: i, color: info.color };
      }), function (i) {
        draw(Number(i));
        Sound.playNote(midiOf(notes[i]), 0.9);
      });
      ui.actions([
        { label: 'Play all', fn: function () {
          Sound.playSequence(notes.map(midiOf), 0.45, function (i) { if (A.alive(token)) draw(i); })
            .then(function () { if (A.alive(token)) draw(null); });
        } },
        { label: 'Play cadence', ghost: true, fn: function () { A.playCadence(k, true); } },
        keys.length > 1 ? { label: 'Next key →', ghost: true, fn: function () { E.explore.round(lesson, ki + 1); } } : null,
      ]);
    },
  };

  // Name the syllable of a note on the staff.
  E.readSyllable = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var clef = clefOf(lesson);
      var tonic = A.placeTonic(k, clef, 0, 7);
      var n = pickDegreeNote(lesson.degrees, k, tonic, E.readSyllable);
      var answer = A.sylOf(n, k);
      var again = function () { E.readSyllable.round(lesson); };

      ui.prompt('Which syllable?');
      ui.sub(keyLine(k, clef));
      ui.feedback('');
      ui.actions([]);
      ui.staff({ clef: clef, fifths: T.fifths(k), notes: [staffNote(n, k, { state: 'current', color: '#3b3355' })] });
      ui.answers(syllableChoices(k, tonic, lesson.degrees), function (v) {
        var ok = v === answer.text;
        ui.lockAnswers(answer.text, v);
        ui.staff({ clef: clef, fifths: T.fifths(k), notes: [staffNote(n, k, { state: 'current', label: answer.text })] });
        ui.feedback(ok ? answer.text + ' — ' + T.name(n, true) : 'It’s <b>' + answer.text + '</b> (' + T.name(n, true) + ')', ok ? 'good' : 'bad');
        Sound.playNote(midiOf(n), 0.7);
        settle(lesson, token, ok, again);
      }, 'syllables');
    },
  };

  // Name the letter of a note (clef reading).
  E.readLetter = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var clef = clefOf(lesson);
      var r = T.clefRange(clef);
      var s;
      do { s = r.lo + 1 + Math.floor(Math.random() * (r.hi - r.lo - 1)); } while (s === E.readLetter.last);
      E.readLetter.last = s;
      var n = T.fromStep(s, 0);
      n.acc = T.sigAcc(T.fifths(k), n.l);
      var again = function () { E.readLetter.round(lesson); };

      ui.prompt('Name this note');
      ui.sub(clefName(clef) + (T.fifths(k) ? ' · mind the key signature' : ''));
      ui.feedback('');
      ui.actions([]);
      ui.staff({ clef: clef, fifths: T.fifths(k), notes: [{ n: n, state: 'current' }] });
      ui.answers(T.LETTERS.map(function (L) { return { label: L, value: L }; }), function (v) {
        var ok = v === T.LETTERS[n.l];
        ui.lockAnswers(T.LETTERS[n.l], v);
        ui.staff({ clef: clef, fifths: T.fifths(k), notes: [{ n: n, state: 'current', label: T.name(n, true) }] });
        ui.feedback((ok ? '' : 'It’s ') + '<b>' + T.name(n, true) + '</b>', ok ? 'good' : 'bad');
        Sound.playNote(midiOf(n), 0.7);
        settle(lesson, token, ok, again);
      }, 'letters');
    },
  };

  // Identify a key from its signature.
  E.keySig = {
    round: function (lesson) {
      var token = A.newToken();
      var keys = A.keysFor(lesson.keys);
      var k = A.pick(keys.filter(function (x) { return A.keyLabel(x) !== E.keySig.last; }));
      E.keySig.last = A.keyLabel(k);
      var clef = clefOf(lesson);
      var mode = k.mode;
      var again = function () { E.keySig.round(lesson); };
      var sorted = keys.slice().sort(function (a, b) { return T.fifths(a) - T.fifths(b); });

      ui.prompt('Which ' + mode + ' key?');
      ui.sub(clefName(clef));
      ui.feedback('');
      ui.actions([]);
      ui.staff({ clef: clef, fifths: T.fifths(k), notes: [] });
      ui.answers(sorted.map(function (x) {
        var f = T.fifths(x);
        return { label: T.name(x.tonic), value: T.name(x.tonic), sub: f === 0 ? '—' : Math.abs(f) + (f > 0 ? '♯' : '♭') };
      }), function (v) {
        var ok = v === T.name(k.tonic);
        ui.lockAnswers(T.name(k.tonic), v);
        ui.feedback((ok ? '' : 'It’s ') + '<b>' + A.keyLabel(k) + '</b>', ok ? 'good' : 'bad');
        A.playCadence(k, true);
        settle(lesson, token, ok, again);
      }, 'keys');
    },
  };

  // Hear a degree after a cadence; name its syllable.
  E.earSyllable = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var clef = clefOf(lesson);
      var tonic = A.placeTonic(k, clef, 0, 7);
      var n = pickDegreeNote(lesson.degrees, k, tonic, E.earSyllable);
      var answer = A.sylOf(n, k);
      var again = function () { E.earSyllable.round(lesson); };
      var play = function () {
        A.playCadence(k, true).then(function () { if (A.alive(token)) Sound.playNote(midiOf(n), 1); });
      };

      ui.prompt('What syllable do you hear?');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b>');
      ui.feedback('');
      ui.staff({ clef: clef, fifths: T.fifths(k), notes: [] });
      ui.actions([
        { label: 'Replay', fn: play },
        { label: 'Note only', ghost: true, fn: function () { Sound.playNote(midiOf(n), 1); } },
      ]);
      ui.answers(syllableChoices(k, tonic, lesson.degrees), function (v) {
        var ok = v === answer.text;
        ui.lockAnswers(answer.text, v);
        ui.staff({ clef: clef, fifths: T.fifths(k), notes: [staffNote(n, k, { state: 'current', label: answer.text })] });
        ui.feedback(ok ? answer.text : 'It was <b>' + answer.text + '</b>', ok ? 'good' : 'bad');
        Sound.playNote(midiOf(n), 0.7);
        settle(lesson, token, ok, again);
      }, 'syllables');
      play();
    },
  };

  var NATURALISH = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'Bb3', 'B3', 'C4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'A4'];

  // Hear an interval; name it (by sound, so the tritone is one answer).
  E.earInterval = {
    round: function (lesson) {
      var token = A.newToken();
      var id = A.pick(lesson.intervals, E.earInterval.last);
      E.earInterval.last = id;
      var dir = A.pick(lesson.dirs || ['up']);
      var spelled = id === 'TT' ? (Math.random() < 0.5 ? 'A4' : 'd5') : id;
      var a, b;
      do {
        a = T.parse(A.pick(NATURALISH));
        b = T.transpose(a, spelled, dir !== 'down');
      } while (Math.abs(b.acc) > 1);
      var midis = dir === 'harmonic' ? [[midiOf(a), midiOf(b)]] : [midiOf(a), midiOf(b)];
      var info = T.EAR_INTERVALS.filter(function (x) { return x.id === id; })[0];
      var again = function () { E.earInterval.round(lesson); };
      var play = function () { Sound.playSequence(midis, dir === 'harmonic' ? 1.4 : 0.8); };
      var clef = midiOf(a) + midiOf(b) < 2 * 57 ? 'bass' : 'treble';

      ui.prompt('Name the interval');
      ui.sub(dir === 'harmonic' ? 'Played together' : dir === 'up' ? 'Ascending' : 'Descending');
      ui.feedback('');
      ui.staff({ clef: clef, notes: [] });
      ui.actions([{ label: 'Replay', fn: play }]);
      var choices = T.EAR_INTERVALS.filter(function (x) { return lesson.intervals.indexOf(x.id) >= 0; });
      ui.answers(choices.map(function (x) {
        return { label: x.label, value: x.id, sub: x.id === 'TT' ? 'A4 / d5' : T.intervalName(x.id) };
      }), function (v) {
        var ok = v === id;
        ui.lockAnswers(id, v);
        ui.staff({ clef: clef, notes: [
          { n: a, state: 'current', label: T.name(a, true), col: 0 },
          { n: b, state: 'current', label: T.name(b, true), col: dir === 'harmonic' ? 0 : 1 },
        ] });
        var full = id === 'TT' ? 'tritone (' + T.intervalName(spelled) + ')' : T.intervalName(id);
        ui.feedback((ok ? '' : 'It was a ') + '<b>' + full + '</b>' + (ok ? '' : ' — ' + info.semis + ' half steps'), ok ? 'good' : 'bad');
        play();
        settle(lesson, token, ok, again);
      }, 'intervals');
      play();
    },
  };

  // Read a spelled interval on the staff.
  E.readInterval = {
    round: function (lesson) {
      var token = A.newToken();
      var clef = clefOf(lesson);
      var r = T.clefRange(clef);
      var id = A.pick(lesson.intervals, E.readInterval.last);
      E.readInterval.last = id;
      var iv = T.parseInterval(id);
      var a, b;
      do {
        a = T.fromStep(r.lo + 2 + Math.floor(Math.random() * Math.max(1, r.hi - r.lo - 4 - iv.size)), A.pick([-1, 0, 0, 0, 1]));
        b = T.transpose(a, id, true);
      } while (Math.abs(b.acc) > 1 || T.step(b) > r.hi);
      var down = Math.random() < 0.35;
      var first = down ? b : a, second = down ? a : b;
      var again = function () { E.readInterval.round(lesson); };

      ui.prompt('Name the interval');
      ui.sub(clefName(clef));
      ui.feedback('');
      ui.actions([]);
      ui.staff({ clef: clef, notes: [{ n: first, state: 'current' }, { n: second, state: 'current' }] });
      var choices = lesson.intervals.slice().sort(function (x, y) {
        var X = T.parseInterval(x), Y = T.parseInterval(y);
        return X.size - Y.size || X.semis - Y.semis;
      });
      ui.answers(choices.map(function (x) { return { label: x, value: x }; }), function (v) {
        var ok = v === id;
        ui.lockAnswers(id, v);
        ui.staff({ clef: clef, notes: [
          { n: first, state: 'current', label: T.name(first, true) },
          { n: second, state: 'current', label: T.name(second, true) },
        ] });
        ui.feedback((ok ? '' : 'It’s a ') + '<b>' + T.intervalName(id) + '</b> (' + iv.semis + ' half steps)', ok ? 'good' : 'bad');
        Sound.playSequence([midiOf(first), midiOf(second)], 0.7);
        settle(lesson, token, ok, again);
      }, 'intervals');
    },
  };

  // Sing a scale degree shown on the staff.
  E.sing = {
    mic: true,
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var clef = clefOf(lesson);
      var tonic = A.placeTonic(k, clef, 0, 7);
      var n = pickDegreeNote(lesson.degrees, k, tonic, E.sing);
      var info = A.sylOf(n, k);
      var again = function () { E.sing.round(lesson); };
      var draw = function (reveal) {
        ui.staff({ clef: clef, fifths: T.fifths(k), notes: [staffNote(n, k, {
          state: 'current', label: reveal || lesson.labels ? info.text : '', color: reveal || lesson.labels ? info.color : '#3b3355' })] });
      };
      var listen = function () {
        A.listen({ midi: midiOf(n), mode: 'pc', label: lesson.labels ? info.text : 'the note', color: info.color,
          onMatch: function () {
            draw(true);
            ui.feedback('<b>' + info.text + '</b> — ' + T.name(n), 'good');
            settle(lesson, token, true, again);
          } });
      };

      ui.prompt(lesson.labels ? 'Sing <span style="color:' + info.color + '">' + info.text + '</span>' : 'Sing this note');
      ui.sub(keyLine(k, clef) + ' · any octave');
      ui.feedback('');
      ui.answers([]);
      ui.meter(true);
      draw(false);
      ui.actions([
        { label: 'Hear it', ghost: true, fn: function () { Sound.playNote(midiOf(n), 1); } },
        { label: 'Replay key', ghost: true, fn: function () { A.playCadence(k, true); } },
        { label: 'Skip', ghost: true, fn: function () {
          A.stopListening();
          draw(true);
          ui.feedback('That was <b>' + info.text + '</b>', 'bad');
          Sound.playNote(midiOf(n), 1);
          A.record(lesson.id, false);
          later(token, 1500, again);
        } },
      ]);
      A.playCadence(k);
      listen();
    },
  };

  // Sing the starting note, then an interval above or below it.
  E.singInterval = {
    mic: true,
    round: function (lesson) {
      var token = A.newToken();
      var clef = clefOf(lesson);
      var r = T.clefRange(clef);
      var id = A.pick(lesson.intervals, E.singInterval.last);
      E.singInterval.last = id;
      var up = A.pick(lesson.dirs || ['up']) !== 'down';
      var iv = T.parseInterval(id);
      var a, b;
      do {
        var lo = up ? r.lo + 2 : r.lo + 2 + iv.size;
        var hi = up ? r.hi - 2 - iv.size : r.hi - 2;
        a = T.fromStep(lo + Math.floor(Math.random() * Math.max(1, hi - lo)), A.pick([-1, 0, 0, 0, 1]));
        b = T.transpose(a, id, up);
      } while (Math.abs(b.acc) > 1);
      var again = function () { E.singInterval.round(lesson); };
      var draw = function (both) {
        ui.staff({ clef: clef, notes: [
          { n: a, state: both ? 'done' : 'current', label: T.name(a) },
          { n: b, state: 'current', label: both ? T.name(b) : '?', hidden: !both },
        ] });
      };
      var name = T.intervalName(id);

      ui.prompt('Sing ' + (up ? 'up' : 'down') + ' a <b>' + name + '</b>');
      ui.sub('Start on ' + T.name(a) + ' · ' + clefName(clef) + ' · sing it in your octave');
      ui.feedback('');
      ui.answers([]);
      ui.meter(true);
      draw(false);
      ui.actions([
        { label: 'Hear start', ghost: true, fn: function () { Sound.playNote(midiOf(a), 1); } },
        // The start note sets the octave; if that went wrong, re-anchor.
        { label: 'Start over', ghost: true, fn: function () { ui.feedback(''); listenStart(); } },
        { label: 'Skip', ghost: true, fn: function () {
          A.stopListening();
          draw(true);
          ui.feedback('Here’s how it sounds', 'bad');
          Sound.playSequence([midiOf(a), midiOf(b)], 0.8);
          A.record(lesson.id, false);
          later(token, 2200, again);
        } },
      ]);
      Sound.playNote(midiOf(a), 1);
      // First match the start note in any octave, then hold the singer to
      // that octave so "up a 3rd" can't be answered by singing down a 6th.
      function listenStart() {
        A.listen({ midi: midiOf(a), mode: 'pc', label: T.name(a), hint: 'Sing ' + T.name(a) + ' first', onMatch: function (sung) {
          var shift = Math.round((sung - midiOf(a)) / 12) * 12;
          ui.feedback('Now ' + (up ? 'up' : 'down') + ' a ' + name + '…');
          A.listen({ midi: midiOf(b) + shift, mode: 'abs', label: (up ? 'up' : 'down') + ' a ' + name, hint: 'Now ' + (up ? 'up ↑' : 'down ↓'),
            onMatch: function () {
              draw(true);
              ui.feedback('<b>' + T.name(a) + ' → ' + T.name(b) + '</b>', 'good');
              settle(lesson, token, true, again);
            } });
        } });
      }
      listenStart();
    },
  };

  // Sing a melody note by note. First note: any octave. The rest are held to
  // that octave so contour counts.
  function singMelody(lesson, token, k, clef, notes, draw, onDone) {
    var i = 0, shift = 0;
    function step() {
      if (!A.alive(token)) return;
      draw(i);
      var n = notes[i];
      var info = A.sylOf(n, k);
      A.listen({
        midi: midiOf(n) + shift, mode: i === 0 ? 'pc' : 'abs',
        label: lesson.labels ? info.text : 'note ' + (i + 1) + ' of ' + notes.length, color: info.color,
        onMatch: function (sung) {
          if (i === 0) shift = Math.round((sung - midiOf(n)) / 12) * 12;
          i++;
          if (i < notes.length) step(); else { draw(-1); onDone(); }
        },
      });
    }
    step();
    return { restart: function () { i = 0; shift = 0; step(); } };
  }

  // Hear a melody, then sing it back.
  E.echo = {
    mic: true,
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var clef = clefOf(lesson);
      var notes = placeMelody(lesson, k, clef);
      var sung = 0;
      var again = function () { E.echo.round(lesson); };
      var draw = function (current) {
        if (current >= 0) sung = current;
        ui.staff({ clef: clef, fifths: T.fifths(k), minWidth: 480, notes: notes.map(function (n, j) {
          var revealed = current < 0 || j < sung;
          return staffNote(n, k, { state: revealed ? 'done' : j === sung ? 'current' : '', hidden: !revealed, label: revealed ? A.sylOf(n, k).text : '' });
        }) });
      };
      var run;
      var playAndSing = function () {
        A.stopListening();
        ui.prompt('Listen…');
        draw(0);
        A.playCadence(k).then(function () {
          if (!A.alive(token)) return;
          return Sound.playSequence(notes.map(midiOf), 0.6);
        }).then(function () {
          if (!A.alive(token)) return;
          ui.prompt('Sing it back');
          run = singMelody(lesson, token, k, clef, notes, draw, function () {
            ui.prompt('Nice!');
            ui.feedback(notes.map(function (n) { return A.sylOf(n, k).text; }).join(' – '), 'good');
            settle(lesson, token, true, again);
          });
        });
      };

      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · ' + notes.length + ' notes · first note in any octave');
      ui.feedback('');
      ui.answers([]);
      ui.meter(true);
      ui.actions([
        { label: 'Replay', ghost: true, fn: playAndSing },
        { label: 'Skip', ghost: true, fn: function () {
          A.stopListening();
          draw(-1);
          ui.feedback(notes.map(function (n) { return A.sylOf(n, k).text; }).join(' – '), 'bad');
          A.record(lesson.id, false);
          Sound.playSequence(notes.map(midiOf), 0.5).then(function () { later(token, 600, again); });
        } },
      ]);
      playAndSing();
    },
  };

  // Read a melody from the staff and sing it.
  E.sightSing = {
    mic: true,
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var clef = clefOf(lesson);
      var notes = placeMelody(lesson, k, clef);
      var tonic = A.placeTonic(k, clef, 0, 0);
      var again = function () { E.sightSing.round(lesson); };
      var cur = 0;
      var draw = function (current) {
        if (current != null) cur = current;
        ui.staff({ clef: clef, fifths: T.fifths(k), minWidth: 480, notes: notes.map(function (n, j) {
          var done = cur < 0 || j < cur;
          var opts = { state: done ? 'done' : j === cur ? 'current' : '', label: done || lesson.labels ? A.sylOf(n, k).text : '' };
          if (!done) opts.color = '#3b3355'; // syllable colors would give the answer away
          return staffNote(n, k, opts);
        }) });
      };
      var start = function () {
        A.playCadence(k).then(function () {
          if (A.alive(token)) Sound.playNote(midiOf(tonic), 1);
        });
      };

      ui.prompt('Sight-sing this melody');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · ' + clefName(clef) + ' · you’ll hear the key and tonic');
      ui.feedback('');
      ui.answers([]);
      ui.meter(true);
      draw(0);
      ui.actions([
        { label: 'Hear tonic', ghost: true, fn: function () { Sound.playNote(midiOf(tonic), 1); } },
        { label: 'Replay key', ghost: true, fn: start },
        { label: 'Hear melody', ghost: true, fn: function () { Sound.playSequence(notes.map(midiOf), 0.6); } },
        // The first note sets the octave; if that went wrong, re-anchor.
        { label: 'Start over', ghost: true, fn: function () { run.restart(); } },
        { label: 'Skip', ghost: true, fn: function () {
          A.stopListening();
          draw(-1);
          A.record(lesson.id, false);
          Sound.playSequence(notes.map(midiOf), 0.5).then(function () { later(token, 600, again); });
        } },
      ]);
      start();
      var run = singMelody(lesson, token, k, clef, notes, draw, function () {
        ui.prompt('Nice!');
        settle(lesson, token, true, again);
      });
    },
  };

  root.Exercises = { engines: E, makeMelody: makeMelody };
})(this);
