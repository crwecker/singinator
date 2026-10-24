// Fundamentals, the workbook way (Units I-II, plus V.2's "invent a
// progression"): write a pitch in a given octave, an interval above or
// below a note, a scale from one of its degrees, a key signature; name a
// meter's type and beat; name the motion between two voices; and invent a
// progression with mostly progressive root motion.
(function () {
  'use strict';

  var A = App;
  var T = Theory;
  var H = Harmony;
  var ui = A.ui;
  var X = Exercises.helpers;
  var E = Exercises.engines;
  var midiOf = X.midiOf;
  var writer = Exercises.compose.writer;

  var ONE = [{ name: 'Note', short: '', staff: 0 }];
  var DEGREE_NAMES = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant', 'leading tone'];

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function cols(n) { var out = []; for (var i = 0; i < n; i++) out.push([null]); return out; }
  function clefFor(lesson) { return lesson.clefs ? A.pick(lesson.clefs) : 'treble'; }
  function sameNote(a, b) { return a && b && T.same(a, b); }

  // ---------- Write a note, an interval, a scale ----------
  // lesson.ask: 'pitch' (Exercises I.1.1), 'interval' (I.1.3-8: lesson.intervals,
  // lesson.generic for sizes only, lesson.below), 'scale' (II.1.2-3:
  // lesson.mode 'major' | 'natural' | 'harmonic' | 'melodic').
  function scaleFrom(given, deg, mode) {
    // the tonic whose scale has `given` as degree deg
    var minor = mode !== 'major';
    var raise = mode === 'harmonic' ? { 6: 1 } : mode === 'melodic' ? { 5: 1, 6: 1 } : {};
    for (var acc = -1; acc <= 1; acc++) {
      var t = T.fromStep(T.step(given) - deg, acc);
      var k = T.key(T.LETTERS[t.l] + (acc < 0 ? 'b' : acc > 0 ? '#' : ''), minor ? 'minor' : 'major');
      var notes = [];
      for (var i = 0; i <= 7; i++) {
        var n = T.fromStep(T.step(t) + i, 0);
        n.acc = T.sigAcc(T.fifths(k), n.l) + (raise[i % 7] || 0);
        notes.push(n);
      }
      if (sameNote(notes[deg], given) && notes.every(function (n) { return Math.abs(n.acc) <= 1; }) && Math.abs(T.fifths(k)) <= 7) return { k: k, notes: notes };
    }
    return null;
  }

  E.writeNote = {
    round: function (lesson) {
      var token = A.newToken();
      var clef = clefFor(lesson);
      var r = T.clefRange(clef);
      var task = null;
      for (var t = 0; !task && t < 60; t++) {
        var s = r.lo - 1 + Math.floor(Math.random() * (r.hi - r.lo + 3));
        var acc = Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) : 0;
        var n = T.fromStep(s, acc);
        if (lesson.ask === 'pitch') {
          task = { given: [null], want: [n], prompt: 'Write <b>' + T.name(n, true) + '</b>', sub: X.clefName(clef) + ' · middle C is C4' };
        } else if (lesson.ask === 'interval') {
          var id = A.pick(lesson.intervals);
          var below = lesson.below && Math.random() < 0.5;
          var target = T.transpose(n, id, !below);
          if (Math.abs(target.acc) > 1 || T.step(target) < r.lo - 2 || T.step(target) > r.hi + 2) continue;
          var size = Number(id.replace(/\D/g, ''));
          var what = lesson.generic ? 'a ' + size + (size === 2 ? 'nd' : size === 3 ? 'rd' : 'th') : 'a ' + id;
          task = { given: [n, null], want: [n, target], id: id, below: below, generic: lesson.generic,
            prompt: 'Write ' + what + ' <b>' + (below ? 'below' : 'above') + '</b> ' + T.name(n),
            sub: X.clefName(clef) + (lesson.generic ? ' · count the letter names; any accidental' : ' · mind the quality') };
        } else {
          var deg = Math.floor(Math.random() * 7);
          var mode = lesson.modes ? A.pick(lesson.modes) : lesson.mode;
          var sc = scaleFrom(n, deg, mode);
          if (!sc || T.step(sc.notes[0]) < r.lo - 2 || T.step(sc.notes[7]) > r.hi + 2) continue;
          var given = sc.notes.map(function (x, i) { return i === deg ? x : null; });
          var label = Math.random() < 0.5 ? 'scale degree ' + (deg + 1) : 'the ' + DEGREE_NAMES[deg];
          var kind = mode === 'major' ? 'major' : mode + ' minor';
          task = { given: given, want: sc.notes, k: sc.k,
            prompt: '<b>' + T.name(n) + '</b> is ' + label + ' of a ' + kind + ' scale. Write the scale',
            sub: X.clefName(clef) + ' · from the tonic up, no key signature: add accidentals' + (mode === 'melodic' ? ' · ascending form' : '') };
        }
      }
      var again = function () { E.writeNote.round(lesson); };
      ui.prompt(task.prompt);
      ui.sub(task.sub);
      ui.feedback('');
      var nCols = task.want.length;
      E.writeNote.current = writer({ token: token, lesson: lesson, k: T.key('C'), fifths: 0, voices: ONE, cols: nCols,
        given: task.given.map(function (g) { return [g]; }), clefs: [clef, 'bass'], single: true, again: again,
        model: task.want.map(function (w) { return [w]; }),
        slotLabels: lesson.ask === 'scale' ? task.want.map(function (_, i) { return String(i % 7 + 1); }) : null,
        grade: function (notes) {
          var problems = [];
          if (task.id) {
            var w = notes[1][0];
            var iv = T.interval(task.below ? w : task.given[0], task.below ? task.given[0] : w);
            var dirOk = task.below ? T.step(w) < T.step(task.given[0]) : T.step(w) > T.step(task.given[0]);
            var want = task.generic ? T.parseInterval(task.id).size : task.id;
            var got = task.generic ? iv.size : iv.id;
            if (!dirOk || got !== want) {
              problems.push({ col: 1, voices: [0], msg: (dirOk ? 'That’s ' + (task.generic ? 'a ' + (iv.size + 1) + (iv.size + 1 === 2 ? 'nd' : iv.size + 1 === 3 ? 'rd' : 'th') : 'a ' + iv.id) : 'Wrong direction') +
                ': ' + T.name(task.want[1], true) + ' is ' + (task.generic ? 'the note' : 'a ' + task.id) + ' ' + (task.below ? 'below' : 'above') });
            }
            return { problems: problems };
          }
          notes.forEach(function (c, i) {
            if (task.given[i]) return;
            var w = task.want[i], n = c[0];
            if (sameNote(n, w)) return;
            var msg = midiOf(n) === midiOf(w) ? 'spell it ' + T.name(w) + ', not ' + T.name(n) : n.l === w.l && n.oct === w.oct ? T.name(w) + ', not ' + T.name(n) : T.name(w, true);
            problems.push({ col: i, voices: [0], msg: (nCols > 1 ? 'Note ' + (i + 1) + ': ' : '') + msg });
          });
          return { problems: problems, notes: task.k ? [A.keyLabel(task.k) + ': ' + task.want.map(function (x) { return T.name(x); }).join(' ')] : [] };
        } });
    },
  };

  // ---------- Write a key signature ----------
  // Tap the staff to place each sharp or flat, in order. (Exercises II.1.2-3, Part III)
  E.writeKeySig = {
    round: function (lesson) {
      var token = A.newToken();
      var keys = A.keysFor(lesson.keys).filter(function (x) { return T.fifths(x) !== 0; });
      var k = A.pick(keys.filter(function (x) { return A.keyLabel(x) !== E.writeKeySig.last; }));
      E.writeKeySig.last = A.keyLabel(k);
      var clef = clefFor(lesson);
      var f = T.fifths(k);
      var table = T.SIG_POS[clef][f > 0 ? 'sharp' : 'flat'];
      var want = table.slice(0, Math.abs(f));
      var placed = [];
      var tool = f > 0 ? 1 : -1;
      var done = false, result = null;
      var svg = document.getElementById('staff');
      var again = function () { E.writeKeySig.round(lesson); };

      function draw() {
        var items = placed.map(function (p, i) {
          var n = T.fromStep(T.step(T.CLEFS[clef].bottom) + p.pos, p.acc);
          return { n: n, col: i, accOnly: true, state: result ? (result[i] ? 'right' : 'wrong') : '' };
        });
        ui.staff({ clef: clef, minWidth: 420, notes: items.concat([{ n: T.fromStep(T.clefRange(clef).lo + 4, 0), col: 7, hidden: true }]) });
        svg.classList.toggle('writable', !done);
        var box = document.getElementById('answers');
        box.innerHTML = '';
        box.className = 'answers tools' + (done ? ' locked' : '');
        [[1, '♯'], [-1, '♭']].forEach(function (tt) {
          var b = document.createElement('button');
          b.className = 'ans-btn tool voice-pick' + (tool === tt[0] ? ' on' : '');
          b.innerHTML = '<span class="ans-main">' + tt[1] + '</span>';
          b.onclick = function () { if (!done) { tool = tt[0]; draw(); } };
          box.appendChild(b);
        });
        var u = document.createElement('button');
        u.className = 'ans-btn tool';
        u.innerHTML = '<span class="ans-main">Undo</span>';
        u.onclick = function () { if (!done) { placed.pop(); draw(); } };
        box.appendChild(u);
      }

      function check() {
        if (done) return;
        done = true;
        result = placed.map(function (p, i) { return i < want.length && p.pos === want[i] && p.acc === (f > 0 ? 1 : -1); });
        var ok = placed.length === want.length && result.every(Boolean);
        draw();
        var order = (f > 0 ? 'F C G D A E B' : 'B E A D G C F').split(' ').slice(0, want.length).join(' ');
        ui.feedback((ok ? '<b>Correct:</b> ' : '<b>Not quite.</b> ' + A.keyLabel(k) + ' has ') + Math.abs(f) + ' ' + (f > 0 ? 'sharp' : 'flat') + (Math.abs(f) > 1 ? 's' : '') +
          ', in order: ' + order + '. Below is where each one goes.', ok ? 'good' : 'bad');
        // show the right signature on the second staff
        ui.staff2({ clef: clef, fifths: f, minWidth: 420, notes: [{ n: T.fromStep(T.clefRange(clef).lo + 4, 0), col: 7, hidden: true }] });
        A.record(lesson.id, ok);
        if (ok) A.celebrate('✓', false);
        else X.review(lesson.learn);
        ui.actions([{ label: 'Next →', fn: again }]);
      }

      svg.onpointerdown = function (ev) {
        if (done || placed.length >= 7) return;
        ev.preventDefault();
        placed.push({ pos: Staff.posAt(svg, ev), acc: tool });
        draw();
      };
      ui.prompt('Write the key signature of <b>' + A.keyLabel(k) + '</b>');
      ui.sub(X.clefName(clef) + ' · pick ♯ or ♭, then tap where each one goes, in order');
      ui.feedback('');
      ui.staff2(null);
      ui.actions([{ label: 'Check', fn: check }]);
      draw();
      E.writeKeySig.current = { want: want, sharp: f > 0, place: function (pos, acc) { placed.push({ pos: pos, acc: acc }); }, check: check }; // for tests
    },
  };

  // ---------- Meter: type and beat ----------
  // (Exercises I.2.1)
  var METERS = ['2/4', '3/4', '4/4', '2/2', '3/2', '4/2', '2/8', '3/8', '4/8', '6/8', '9/8', '12/8', '6/4', '9/4', '12/4', '6/16', '9/16', '12/16', '6/2', '12/2', '3/16'];
  var NOTE_NAMES = { 1: 'whole', 2: 'half', 4: 'quarter', 8: 'eighth', 16: 'sixteenth', 32: 'thirty-second' };

  function meterInfo(sig) {
    var top = Number(sig.split('/')[0]), bottom = Number(sig.split('/')[1]);
    var compound = top % 3 === 0 && top > 3;
    var beats = compound ? top / 3 : top;
    var count = { 2: 'Duple', 3: 'Triple', 4: 'Quadruple' }[beats];
    return { type: count + ' ' + (compound ? 'compound' : 'simple'), beat: compound ? 'Dotted ' + NOTE_NAMES[bottom / 2] : NOTE_NAMES[bottom].charAt(0).toUpperCase() + NOTE_NAMES[bottom].slice(1),
      division: compound ? 'three ' + NOTE_NAMES[bottom] + 's' : 'two ' + NOTE_NAMES[bottom * 2] + 's', beats: beats, compound: compound };
  }

  E.meterType = {
    round: function (lesson) {
      var token = A.newToken();
      var sig = A.pick(METERS, E.meterType.last);
      E.meterType.last = sig;
      var m = meterInfo(sig);
      var ask = lesson.ask || 'type';
      var answer = ask === 'type' ? m.type : m.beat;
      var choices = ask === 'type'
        ? ['Duple simple', 'Triple simple', 'Quadruple simple', 'Duple compound', 'Triple compound', 'Quadruple compound']
        : ['Half', 'Quarter', 'Eighth', 'Sixteenth', 'Dotted whole', 'Dotted half', 'Dotted quarter', 'Dotted eighth'];
      var again = function () { E.meterType.round(lesson); };
      ui.prompt('<span class="meter-sig"><b>' + sig.split('/')[0] + '</b><b>' + sig.split('/')[1] + '</b></span>');
      ui.sub(ask === 'type' ? 'What type of meter? (at a moderate tempo)' : 'What note gets the beat?');
      ui.feedback('');
      ui.staff(null);
      ui.actions([]);
      ui.answers(choices.map(function (c) { return { label: c, value: c }; }), function (v) {
        var ok = v === answer;
        ui.lockAnswers(answer, v);
        ui.feedback((ok ? '' : 'It’s ') + '<b>' + sig + ': ' + m.type.toLowerCase() + '</b>. ' + m.beats + ' beats of a ' + m.beat.toLowerCase() +
          ', each divided into ' + m.division + (m.compound ? ' (a top of 6, 9 or 12 means compound: divide it by 3 to count the beats)' : '') + '.', ok ? 'good' : 'bad');
        X.settle(lesson, token, ok, again);
      }, 'cadences');
    },
  };

  // ---------- Motion between two voices ----------
  // (Exercises II.2.1, Part I: C, O, S, P)
  var MOTIONS = { C: 'Contrary', O: 'Oblique', S: 'Similar', P: 'Parallel' };

  function motionOf(u0, u1, l0, l1) {
    var du = midiOf(u1) - midiOf(u0), dl = midiOf(l1) - midiOf(l0);
    if (!du && !dl) return null;
    if (!du || !dl) return 'O';
    if (du * dl < 0) return 'C';
    return T.interval(l0, u0).size === T.interval(l1, u1).size ? 'P' : 'S';
  }

  E.motionType = {
    round: function (lesson) {
      var token = A.newToken();
      var want = A.pick(Object.keys(MOTIONS), E.motionType.last);
      var k = A.pick(A.keysFor(lesson.keys || { mode: 'major', max: 3 }));
      var u, l, got;
      for (var t = 0; t < 200; t++) {
        var lo = T.degreeNote(k, Math.floor(Math.random() * 7), 0, 3);
        var up = T.degreeNote(k, Math.floor(Math.random() * 7), 0, 4);
        if (midiOf(up) <= midiOf(lo) + 2) continue;
        var mv = function (n) { return T.fromStep(T.step(n) + [-3, -2, -1, 0, 1, 2, 3][Math.floor(Math.random() * 7)], 0); };
        var up2 = mv(up), lo2 = mv(lo);
        up2.acc = T.sigAcc(T.fifths(k), up2.l); lo2.acc = T.sigAcc(T.fifths(k), lo2.l);
        if (midiOf(up2) <= midiOf(lo2) + 2) continue;
        got = motionOf(up, up2, lo, lo2);
        if (got === want) { u = [up, up2]; l = [lo, lo2]; break; }
      }
      E.motionType.last = want;
      var again = function () { E.motionType.round(lesson); };
      ui.prompt('What kind of motion?');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · upper voice on the treble staff, lower voice on the bass staff');
      ui.feedback('');
      ui.actions([{ label: 'Hear it', ghost: true, fn: function () { Sound.playSequence([[midiOf(l[0]), midiOf(u[0])], [midiOf(l[1]), midiOf(u[1])]], 0.9); } }]);
      var draw = function (labels) {
        ui.staff({ clef: 'treble', fifths: T.fifths(k), minWidth: 360, notes: u.map(function (n, i) { return { n: n, col: i * 2 }; }).concat([{ n: T.parse('C5'), col: 3, hidden: true }]) });
        ui.staff2({ clef: 'bass', fifths: T.fifths(k), minWidth: 360, notes: l.map(function (n, i) { return { n: n, col: i * 2, label: labels ? labels[i] : '' }; }).concat([{ n: T.parse('C3'), col: 3, hidden: true }]) });
      };
      draw();
      ui.answers(Object.keys(MOTIONS).map(function (m) { return { label: MOTIONS[m] + ' (' + m + ')', value: m }; }), function (v) {
        var ok = v === want;
        ui.lockAnswers(want, v);
        var ivs = [T.interval(l[0], u[0]).id, T.interval(l[1], u[1]).id];
        draw(ivs);
        var how = { C: 'the voices move in opposite directions', O: 'one voice holds while the other moves', S: 'both move the same way, to a different interval', P: 'both move the same way and keep the same interval' }[want];
        ui.feedback((ok ? '' : 'It’s ') + '<b>' + MOTIONS[want] + '</b>: ' + how + ' (' + ivs.join(' → ') + ')', ok ? 'good' : 'bad');
        X.settle(lesson, token, ok, again);
      }, 'cadences');
    },
  };

  // ---------- Invent a progression ----------
  // 8-10 chords, mostly progressive root motion, ending V(7)-I. (Exercises V.2.3-4, Part II)
  var PALETTE = ['I', 'ii', 'iii', 'IV', 'V', 'V7', 'vi', 'vii°'];
  function rootDeg(id) { return { I: 0, ii: 1, iii: 2, IV: 3, V: 4, V7: 4, vi: 5, 'vii°': 6 }[id]; }
  // P: down a 5th (up a 4th), up a 2nd, down a 3rd; R: the reverse
  function motionKind(a, b) {
    var d = T.mod(rootDeg(b) - rootDeg(a), 7);
    return d === 3 || d === 1 || d === 5 ? 'P' : d === 0 ? '=' : 'R';
  }

  E.inventProgression = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var n = lesson.length || 8;
      var seq = ['I'];
      var done = false;
      var again = function () { E.inventProgression.round(lesson); };

      function drawSlots(marks) {
        ui.slots(seq.concat(new Array(Math.max(0, n - seq.length)).fill('')).slice(0, Math.max(n, seq.length)).map(function (id, i) {
          var st = i === 0 ? 'given' : id ? 'filled' : 'empty' + (i === seq.length ? ' next' : '');
          if (marks && i > 0) st = marks[i - 1] === 'P' ? 'right' : 'wrong';
          return { label: id || '', state: st, sub: marks && i > 0 ? marks[i - 1] : '' };
        }));
      }

      function choose(id) {
        if (done || seq.length >= (lesson.max || 10)) return;
        seq.push(id);
        var c = H.chord(k, id);
        Sound.playSequence([T.chordVoicing(T.note(c.root.l, c.root.acc, 4), c.type, 0).map(midiOf)], 0.6);
        drawSlots();
      }

      function check() {
        if (done) return;
        if (seq.length < n) { ui.feedback('Write at least ' + n + ' chords'); return; }
        var marks = seq.slice(1).map(function (id, i) { return motionKind(seq[i], id); });
        var problems = [];
        if (marks.indexOf('=') >= 0) problems.push('Don’t repeat a chord right away');
        var p = marks.filter(function (m) { return m === 'P'; }).length;
        if (p < Math.ceil(marks.length * 0.7)) problems.push('Only ' + p + ' of ' + marks.length + ' moves are progressive; aim for most of them');
        var last = seq.slice(-2);
        if (rootDeg(last[0]) !== 4 || last[1] !== 'I') problems.push('End with V (or V7) to I');
        if (marks.slice(-3).indexOf('R') >= 0) problems.push('Avoid retrogressive motion near the end of the phrase');
        done = true;
        drawSlots(marks);
        var chords = seq.map(function (id) { return H.chord(k, id); });
        var voices = H.voiceLead(k, chords);
        X.grandStaff(k, voices, { labels: chords.map(function (c) { return c.label; }) });
        X.playFour(voices, 0.8);
        var ok = !problems.length;
        ui.feedback(ok ? '<b>A good progression.</b> ' + p + ' of ' + marks.length + ' moves are progressive (P). Listen to how it drives to the cadence.'
          : '<b>Not quite:</b><ul class="write-list">' + problems.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>', ok ? 'good' : 'bad');
        A.record(lesson.id, ok);
        if (ok) A.celebrate('✓', false); else X.review(lesson.learn);
        ui.actions([{ label: 'Hear it', ghost: true, fn: function () { X.playFour(voices, 0.8); } }, { label: 'Next →', fn: again }]);
      }

      ui.prompt('Invent a progression of ' + n + '–' + (lesson.max || 10) + ' chords');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · mostly progressive root motion (down a 5th, up a 2nd, down a 3rd) · end V–I');
      ui.feedback('');
      ui.staff(null);
      ui.staff2(null);
      ui.answers(PALETTE.map(function (id) { return { label: H.chord(k, id).label, value: id }; }), choose, 'chords');
      ui.actions([
        { label: 'Undo', ghost: true, fn: function () { if (!done && seq.length > 1) { seq.pop(); drawSlots(); } } },
        { label: 'Check', fn: check },
      ]);
      drawSlots();
      E.inventProgression.current = { choose: choose, check: check, seq: seq }; // for tests
    },
  };

  Exercises.fundamentals = { scaleFrom: scaleFrom, meterInfo: meterInfo, motionOf: motionOf, motionKind: motionKind };
})();
