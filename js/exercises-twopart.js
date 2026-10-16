// Two-part singing: the app plays one voice of a first-species duet while
// the student sings the other, in time. Frames that sound like the app's
// own part (speaker bleed) are ignored when that pitch isn't the target.
(function () {
  'use strict';

  var A = App;
  var T = Theory;
  var ui = A.ui;
  var X = Exercises.helpers;
  var E = Exercises.engines;
  var midiOf = X.midiOf;

  // Generic interval between the parts, as species exercises label them (3, 6, 8, 10).
  function intervalNumber(lo, hi) { return String(T.step(hi) - T.step(lo) + 1); }

  E.twoPart = {
    mic: true,
    round: function (lesson, keep) {
      var token = A.newToken();
      var duet, k, studentUpper;
      if (keep) {
        duet = keep.duet; k = keep.k; studentUpper = !keep.studentUpper; // swap parts, same duet
      } else {
        k = A.pick(A.keysFor(lesson.keys));
        studentUpper = lesson.part === 'upper' ? true : lesson.part === 'lower' ? false : Math.random() < 0.5;
        var cfAbove = lesson.cantus === 'upper' ? true : lesson.cantus === 'lower' ? false : Math.random() < 0.5;
        var len = lesson.length || 6;
        for (var tries = 0; !duet && tries < 5; tries++) {
          duet = Counterpoint.makeDuet(k, len, cfAbove, T.note(k.tonic.l, k.tonic.acc, cfAbove ? 4 : 3));
        }
      }
      var mine = studentUpper ? duet.upper : duet.lower;
      var theirs = studentUpper ? duet.lower : duet.upper;
      var n = mine.length;
      var bpm = lesson.bpm || 52;
      var beat = 60 / bpm;
      var again = function () { E.twoPart.round(lesson); };
      var running = false, t0 = 0, samples = [], raf = 0, recorded = false, rejected = 0;

      function staffOpts(part, clef, current, results, isMine) {
        return { clef: clef, fifths: T.fifths(k), minWidth: 520, notes: part.map(function (nn, i) {
          var it = { n: nn, col: i, open: true, noStem: true, state: i === current ? 'current' : '' };
          if (results && isMine) { it.color = results[i] ? 'var(--fa)' : 'var(--do)'; it.label = A.sylOf(nn, k).text; }
          if (results && !isMine) it.label = intervalNumber(duet.lower[i], duet.upper[i]);
          return it;
        }) };
      }
      function draw(current, results) {
        ui.staff(staffOpts(duet.upper, 'treble', current, results, studentUpper));
        ui.staff2(staffOpts(duet.lower, 'bass', current, results, !studentUpper));
        document.getElementById('staff').classList.toggle('mine', studentUpper);
        document.getElementById('staff2').classList.toggle('mine', !studentUpper);
      }

      function playBoth(which) {
        var at = Sound.now() + 0.2;
        for (var i = 0; i < n; i++) {
          if (which !== 'theirs') Sound.playAt(midiOf(mine[i]), at + i * beat, beat * 0.95, 0.3);
          if (which !== 'mine') Sound.playAt(midiOf(theirs[i]), at + i * beat, beat * 0.95, 0.24);
        }
      }

      function start() {
        if (running) return;
        running = true;
        samples = [];
        rejected = 0;
        Sound.playNote(midiOf(mine[0]), 0.9); // your starting pitch
        var countFrom = Sound.now() + 1.3;
        for (var c = 0; c < 4; c++) Sound.click(countFrom + c * beat, c === 0);
        t0 = countFrom + 4 * beat;
        for (var i = 0; i < n; i++) {
          Sound.playAt(midiOf(theirs[i]), t0 + i * beat, beat * 0.95, 0.24);
          Sound.click(t0 + i * beat, false);
        }
        var end = t0 + n * beat;
        A.meter.reset('Get ready…');
        ui.feedback('Count in… then sing your part with the app');
        var last = -2, lastRead = 0, silent = 0;
        var follow = function () {
          if (!A.alive(token)) return;
          var now = Sound.now();
          var r = now - lastRead >= 0.025 ? Sound.readPitch() : null; // ~40 reads a second
          if (r) {
            silent = !r.quiet && r.level < 0.0002 ? silent + (now - lastRead) : 0;
            lastRead = now;
          }
          if (r && !r.quiet) A.meter.level(r.level);
          if (silent > 3) { A.meter.hint('No sound from the microphone.', 'warn'); A.meter.update(null, A.MIC_HELP); }
          var idx = Math.floor((now - t0) / beat);
          if (now >= t0 && idx < n) {
            if (idx !== last) { draw(idx); last = idx; }
            if (r && r.hz) {
              var m = Pitch.hzToMidi(r.hz);
              var app = midiOf(theirs[idx]), want = midiOf(mine[idx]);
              var bleed = Math.abs(Pitch.pitchClassDiff(m, app)) < 0.5 && Math.abs(Pitch.pitchClassDiff(want, app)) >= 1;
              if (bleed) rejected++;
              else {
                samples.push({ t: now, midi: m });
                var cents = Pitch.pitchClassDiff(m, want) * 100;
                A.meter.update(cents, 'You: ' + Math.round(cents) + '¢');
                var good = Math.abs(cents) <= A.settings.tol;
                A.meter.hint(good ? 'In tune' : cents < 0 ? 'Higher ↑' : 'Lower ↓', good ? 'good' : cents < 0 ? 'up' : 'down');
              }
            }
          } else if (now < t0) {
            A.meter.hint('Count in: ' + (Math.floor((t0 - now) / beat) + 1), 'listen');
          }
          if (now < end + 0.3) raf = requestAnimationFrame(follow);
          else finish();
        };
        raf = requestAnimationFrame(follow);
      }

      function finish() {
        running = false;
        cancelAnimationFrame(raf);
        var shift = null, right = 0;
        var tolC = A.settings.tol * 1.5;
        var results = mine.map(function (nn, i) {
          var from = t0 + i * beat + 0.3 * beat, to = t0 + (i + 1) * beat - 0.05;
          var inWin = samples.filter(function (s) { return s.t >= from && s.t <= to; }).map(function (s) { return s.midi; });
          if (inWin.length < 2) return false;
          var med = Pitch.median(inWin);
          if (shift === null) shift = Math.round((med - midiOf(nn)) / 12) * 12;
          var ok = Math.abs(med - (midiOf(nn) + shift)) * 100 <= tolC;
          if (ok) right++;
          return ok;
        });
        draw(-1, results);
        var pass = right >= Math.ceil(n * 0.8);
        var bleedNote = rejected > 20 ? ' · heard the app’s part through the mic; headphones help' : '';
        ui.feedback(right + ' of ' + n + ' notes in tune' + bleedNote, pass ? 'good' : 'bad');
        A.meter.hint(pass ? 'Nice!' : 'Try again', pass ? 'good' : 'warn');
        if (!recorded) { recorded = true; A.record(lesson.id, pass); } // first try counts
        if (pass) A.celebrate('✓', false);
        E.twoPart.lastScore = { results: results, rejected: rejected, samples: samples.length }; // for tests
      }

      ui.prompt('You sing the <b>' + (studentUpper ? 'upper' : 'lower') + '</b> part');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · the app sings the other part · headphones recommended');
      ui.feedback('');
      ui.answers([]);
      ui.meter(true);
      A.meter.reset('Press Start');
      draw(-1);
      ui.actions([
        { label: 'Start', fn: start },
        { label: 'Hear both', ghost: true, fn: function () { playBoth('both'); } },
        { label: 'Hear mine', ghost: true, fn: function () { playBoth('mine'); } },
        { label: 'Swap parts', ghost: true, fn: function () { E.twoPart.round(lesson, { duet: duet, k: k, studentUpper: studentUpper }); } },
        { label: 'Next →', fn: again },
      ]);
      E.twoPart.current = { mine: mine, theirs: theirs, beat: beat, t0: function () { return t0; }, start: start }; // for tests
    },
  };
})();
