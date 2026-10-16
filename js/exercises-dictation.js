// Melodic dictation: hear a melody, write it on the staff. Tap the staff
// to place a note, then fine-tune with the big buttons (or the keyboard:
// arrows nudge, b / n / # set the accidental, Backspace undoes).
(function () {
  'use strict';

  var A = App;
  var T = Theory;
  var ui = A.ui;
  var X = Exercises.helpers;
  var E = Exercises.engines;
  var midiOf = X.midiOf;

  var ACC = { '-1': '♭', '0': '♮', '1': '♯' };
  var activeKey = null;
  document.addEventListener('keydown', function (ev) {
    if (activeKey && !document.getElementById('lesson').hidden) activeKey(ev);
  });

  E.melodicDictation = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var clef = X.clefOf(lesson);
      var answer = X.placeMelody(lesson, k, clef);
      var n = answer.length;
      var written = [answer[0]]; // the first note is given
      var sel = 1;               // slot being edited
      var done = false;
      var r = T.clefRange(clef);
      var again = function () { E.melodicDictation.round(lesson); };
      var svg = document.getElementById('staff');

      function noteFromPos(pos, acc) {
        var nn = T.fromStep(T.step(T.CLEFS[clef].bottom) + pos, 0);
        nn.acc = acc == null ? T.sigAcc(T.fifths(k), nn.l) : acc;
        return nn;
      }

      function draw(results) {
        ui.staff({ clef: clef, fifths: T.fifths(k), minWidth: 520, notes: answer.map(function (_, i) {
          var w = written[i];
          if (!w) return { n: answer[0], hidden: true };
          var it = { n: w, state: !done && i === sel ? 'current' : '', label: i === 0 ? 'given' : '' };
          if (results) {
            it.color = results[i] ? 'var(--fa)' : 'var(--do)';
            it.label = A.sylOf(w, k).text;
          }
          return it;
        }) });
        svg.classList.toggle('writable', !done);
        drawSlots(results);
      }

      function drawSlots(results) {
        var box = document.getElementById('slots');
        box.hidden = false;
        box.innerHTML = '';
        answer.forEach(function (_, i) {
          var b = document.createElement('button');
          var state = i === 0 ? 'given' : results ? (results[i] ? 'right' : 'wrong') : written[i] ? 'filled' : 'empty';
          if (!done && i === sel) state += ' next';
          b.className = 'slot ' + state;
          b.innerHTML = '<span>' + (written[i] ? T.name(written[i]) : i + 1) + '</span>' +
            (results && !results[i] ? '<small>' + T.name(answer[i]) + '</small>' : '');
          b.onclick = function () { if (!done && i > 0 && i <= written.length) { sel = i; draw(); } };
          box.appendChild(b);
        });
      }

      function place(nn) {
        if (done || sel < 1) return;
        if (T.step(nn) < r.lo - 2 || T.step(nn) > r.hi + 2) return;
        written[sel] = nn;
        Sound.playNote(midiOf(nn), 0.5);
        // just filled the newest note: move on to the next empty slot
        if (sel === written.length - 1 && written.length < n) sel = written.length;
        draw();
      }

      function nudge(d) {
        var c = written[sel];
        if (!c) { place(noteFromPos(T.staffPos(written[sel - 1], clef) + d)); return; }
        var nn = T.fromStep(T.step(c) + d, 0);
        nn.acc = T.sigAcc(T.fifths(k), nn.l);
        written[sel] = nn;
        Sound.playNote(midiOf(nn), 0.4);
        draw();
      }

      function setAcc(a) {
        var c = written[sel];
        if (!c) return;
        written[sel] = T.note(c.l, a, c.oct);
        Sound.playNote(midiOf(written[sel]), 0.4);
        draw();
      }

      function undo() {
        if (done || written.length <= 1) return;
        written.pop();
        sel = written.length; // the slot just cleared
        draw();
      }

      function check() {
        if (written.length < n) { ui.feedback('Write all ' + n + ' notes first'); return; }
        done = true;
        activeKey = null;
        var results = answer.map(function (a, i) { return T.same(a, written[i]); });
        var ok = results.every(Boolean);
        var notes = [];
        results.forEach(function (rr, i) {
          if (rr) return;
          var w = written[i], a = answer[i];
          if (midiOf(w) === midiOf(a)) notes.push('note ' + (i + 1) + ': right pitch, spell it ' + T.name(a));
          else notes.push('note ' + (i + 1) + ': ' + T.name(a, true) + ' (' + A.sylOf(a, k).text + ')');
        });
        draw(results);
        ui.feedback(ok ? 'All correct: ' + answer.map(function (a) { return A.sylOf(a, k).text; }).join(' – ') : notes.join(' · '), ok ? 'good' : 'bad');
        document.getElementById('answers').classList.add('locked');
        A.record(lesson.id, ok);
        if (ok) A.celebrate('✓', false);
        ui.actions([
          { label: 'Hear answer', ghost: true, fn: function () { Sound.playSequence(answer.map(midiOf), 0.6); } },
          { label: 'Hear mine', ghost: true, fn: function () { Sound.playSequence(written.map(midiOf), 0.6); } },
          { label: 'Next →', fn: again },
        ]);
      }

      var play = function () {
        A.playCadence(k).then(function () {
          if (A.alive(token)) Sound.playSequence(answer.map(midiOf), 0.65);
        });
      };

      svg.onpointerdown = function (ev) {
        if (done) return;
        ev.preventDefault();
        place(noteFromPos(Staff.posAt(svg, ev)));
      };
      activeKey = function (ev) {
        if (!A.alive(token)) return;
        if (ev.key === 'ArrowUp') { ev.preventDefault(); nudge(1); }
        else if (ev.key === 'ArrowDown') { ev.preventDefault(); nudge(-1); }
        else if (ev.key === 'Backspace') { ev.preventDefault(); undo(); }
        else if (ev.key === '#' || ev.key === 's') setAcc(1);
        else if (ev.key === 'b' || ev.key === 'f') setAcc(-1);
        else if (ev.key === 'n') setAcc(0);
        else if (ev.key === 'Enter') check();
      };

      ui.prompt('Write the melody');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · ' + n + ' notes · tap the staff, then adjust');
      ui.feedback('');
      var box = document.getElementById('answers');
      box.innerHTML = '';
      box.className = 'answers tools';
      [
        { label: '↑', fn: function () { nudge(1); }, title: 'Up a step' },
        { label: '↓', fn: function () { nudge(-1); }, title: 'Down a step' },
        { label: ACC[-1], fn: function () { setAcc(-1); }, title: 'Flat' },
        { label: ACC[0], fn: function () { setAcc(0); }, title: 'Natural' },
        { label: ACC[1], fn: function () { setAcc(1); }, title: 'Sharp' },
        { label: 'Undo', fn: undo },
        { label: 'Repeat', fn: function () { if (written.length < n) { sel = written.length; place(noteFromPos(T.staffPos(written[sel - 1], clef))); } }, title: 'Repeat the last note' },
      ].forEach(function (t) {
        var b = document.createElement('button');
        b.className = 'ans-btn tool';
        b.innerHTML = '<span class="ans-main">' + t.label + '</span>';
        if (t.title) b.title = t.title;
        b.onclick = function () { if (!done) t.fn(); };
        box.appendChild(b);
      });
      ui.actions([
        { label: 'Replay', ghost: true, fn: play },
        { label: 'Melody only', ghost: true, fn: function () { Sound.playSequence(answer.map(midiOf), 0.65); } },
        { label: 'Check', fn: check },
      ]);
      draw();
      play();
      E.melodicDictation.current = { answer: answer, place: place, setAcc: setAcc, nudge: nudge, check: check, undo: undo }; // for tests
    },
  };
})();
