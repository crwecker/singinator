// Writing exercises, like the workbook's "write in four voices" pages:
// one chord from its symbol, two-chord groups, figured bass, cadences over
// a given soprano, and first-species counterpoint over a cantus firmus.
//
// One shared writer: a grand staff where you tap to place the selected
// voice, nudge it with ↑ ↓ and ♭ ♮ ♯, and Check. Answers are graded by
// rule, not against one key: spelling, wrong notes, the inversion, complete
// chords, then the part-writing rules (Partwriting.errors). Guidelines
// (doubled third, diminished-triad doubling) are noted but don't fail.
(function () {
  'use strict';

  var A = App;
  var T = Theory;
  var H = Harmony;
  var P = Partwriting;
  var ui = A.ui;
  var X = Exercises.helpers;
  var E = Exercises.engines;
  var midiOf = X.midiOf;

  var INK = '#3b3355';
  var GIVEN = '#8a83a3';
  var BAD = 'var(--do)';
  var GOOD = 'var(--fa)';
  var MEMBERS = ['root', 'third', 'fifth', 'seventh'];
  var FOUR = [
    { name: 'Bass', short: 'B', staff: 1 }, { name: 'Tenor', short: 'T', staff: 1 },
    { name: 'Alto', short: 'A', staff: 0 }, { name: 'Soprano', short: 'S', staff: 0 },
  ];
  var GUIDELINES = { dbl3: 1, dimDouble: 1 };

  var activeKey = null;
  document.addEventListener('keydown', function (ev) {
    if (activeKey && !document.getElementById('lesson').hidden) activeKey(ev);
  });

  // ---------- The writer ----------
  // o: { token, k (key signature; spelling defaults), fifths, voices (FOUR
  //   or two parts), cols, given: [[note|null per voice] per column],
  //   labels (under the lowest staff, per column), slotLabels, order (voice
  //   indexes in the order to fill), grade(notes) -> { problems:
  //   [{ col, voices, msg }], notes: [msg] }, model (voices to play/show),
  //   onDone(ok) }
  function writer(o) {
    var svgs = [document.getElementById('staff'), document.getElementById('staff2')];
    var nv = o.voices.length;
    var notes = o.given.map(function (col) { return col.slice(); });
    var editable = function (col, vi) { return !o.given[col][vi]; };
    var order = (o.order || o.voices.map(function (_, i) { return i; })).filter(function (vi) {
      return o.given.some(function (col) { return !col[vi]; });
    });
    var sel = { col: 0, vi: order[0] };
    var done = false, marks = null;

    function firstEmpty() {
      for (var c = 0; c < o.cols; c++) {
        for (var i = 0; i < order.length; i++) if (!notes[c][order[i]]) return { col: c, vi: order[i] };
      }
      return null;
    }

    function staffOpts(staff) {
      var cols = o.cols * 2;
      var width = Math.max(480, 140 + cols * 46);
      var items = [];
      notes.forEach(function (col, c) {
        col.forEach(function (n, vi) {
          if (!n || o.voices[vi].staff !== staff) return;
          var color = marks ? (marks[c] && marks[c][vi] ? BAD : GOOD) : !editable(c, vi) ? GIVEN : INK;
          var it = { n: n, col: 2 * c, color: color, tag: o.voices[vi].short,
            state: !done && sel.col === c && sel.vi === vi ? 'current' : '' };
          items.push(it);
        });
      });
      if (o.labels && staff === 1) {
        // labels hang under the bass staff, whether or not the column has notes yet
        o.labels.forEach(function (l, c) {
          var here = items.filter(function (it) { return it.col === 2 * c; });
          if (here.length) here[0].label = l;
          else items.push({ col: 2 * c, labelOnly: true, label: l });
        });
      }
      var place = staff ? T.parse('C3') : T.parse('C5');
      return { clef: staff ? 'bass' : 'treble', fifths: o.fifths, minWidth: width,
        notes: items.concat([{ n: place, col: cols - 1, hidden: true }]) };
    }

    function draw() {
      ui.staff(staffOpts(0));
      ui.staff2(staffOpts(1));
      svgs.forEach(function (s) { s.classList.toggle('writable', !done); });
      drawSlots();
      drawTools();
    }

    // One slot per column: its label, and which voices are written.
    function drawSlots() {
      var box = document.getElementById('slots');
      box.hidden = false;
      box.innerHTML = '';
      for (var c = 0; c < o.cols; c++) {
        (function (c) {
          var b = document.createElement('button');
          var full = notes[c].every(Boolean);
          var state = marks ? (marks[c] && Object.keys(marks[c]).length ? 'wrong' : 'right') : full ? 'filled' : 'empty';
          if (!done && sel.col === c) state += ' next';
          b.className = 'slot ' + state;
          b.innerHTML = '<span>' + ((o.slotLabels || o.labels || [])[c] || c + 1) + '</span>';
          b.onclick = function () {
            if (done) return;
            sel.col = c;
            if (!editable(c, sel.vi)) sel.vi = order.filter(function (vi) { return editable(c, vi); })[0];
            draw();
          };
          box.appendChild(b);
        })(c);
      }
    }

    function drawTools() {
      var box = document.getElementById('answers');
      box.innerHTML = '';
      box.className = 'answers tools' + (done ? ' locked' : '');
      order.slice().reverse().forEach(function (vi) {
        var v = o.voices[vi];
        var b = document.createElement('button');
        b.className = 'ans-btn tool voice-pick' + (sel.vi === vi ? ' on' : '');
        b.innerHTML = '<span class="ans-main">' + v.short + '</span>';
        b.title = v.name;
        b.onclick = function () {
          if (done || !editable(sel.col, vi)) return;
          sel.vi = vi;
          draw();
        };
        box.appendChild(b);
      });
      [
        { label: '↑', fn: function () { nudge(1); }, title: 'Up a step' },
        { label: '↓', fn: function () { nudge(-1); }, title: 'Down a step' },
        { label: '♭', fn: function () { setAcc(-1); }, title: 'Flat' },
        { label: '♮', fn: function () { setAcc(0); }, title: 'Natural' },
        { label: '♯', fn: function () { setAcc(1); }, title: 'Sharp' },
        { label: 'Erase', fn: erase, title: 'Erase the selected note' },
      ].forEach(function (t) {
        var b = document.createElement('button');
        b.className = 'ans-btn tool';
        b.innerHTML = '<span class="ans-main">' + t.label + '</span>';
        b.title = t.title;
        b.onclick = function () { if (!done) t.fn(); };
        box.appendChild(b);
      });
    }

    function noteAt(staff, pos) {
      var clef = staff ? 'bass' : 'treble';
      var n = T.fromStep(T.step(T.CLEFS[clef].bottom) + pos, 0);
      n.acc = T.sigAcc(o.fifths, n.l);
      return n;
    }

    function place(n, vi) {
      if (done) return;
      if (vi == null) vi = sel.vi;
      if (!editable(sel.col, vi)) return;
      sel.vi = vi;
      notes[sel.col][vi] = n;
      Sound.playNote(midiOf(n), 0.5);
      // move on to the next empty voice, in this chord first
      var here = order.filter(function (x) { return editable(sel.col, x) && !notes[sel.col][x]; })[0];
      if (here != null) sel.vi = here;
      else {
        var next = firstEmpty();
        if (next) sel = next;
      }
      draw();
    }

    function tap(staff, ev) {
      if (done) return;
      ev.preventDefault();
      var n = noteAt(staff, Staff.posAt(svgs[staff], ev));
      // a tap on the other staff picks a voice that lives there
      var vi = sel.vi;
      if (o.voices[vi].staff !== staff) {
        var there = order.filter(function (x) { return o.voices[x].staff === staff && editable(sel.col, x); });
        if (!there.length) return;
        vi = there.filter(function (x) { return !notes[sel.col][x]; })[0];
        if (vi == null) vi = there[0];
      }
      place(n, vi);
    }

    function nudge(d) {
      var c = notes[sel.col][sel.vi];
      if (!c || !editable(sel.col, sel.vi)) return;
      var n = T.fromStep(T.step(c) + d, 0);
      n.acc = T.sigAcc(o.fifths, n.l);
      notes[sel.col][sel.vi] = n;
      Sound.playNote(midiOf(n), 0.4);
      draw();
    }

    function setAcc(a) {
      var c = notes[sel.col][sel.vi];
      if (!c || !editable(sel.col, sel.vi)) return;
      notes[sel.col][sel.vi] = T.note(c.l, a, c.oct);
      Sound.playNote(midiOf(notes[sel.col][sel.vi]), 0.4);
      draw();
    }

    function erase() {
      if (!editable(sel.col, sel.vi)) return;
      notes[sel.col][sel.vi] = null;
      draw();
    }

    function playVoices(v) {
      var len = 0.9;
      var at = Sound.now() + 0.1;
      v.forEach(function (col, c) {
        col.forEach(function (n, vi) { if (n) Sound.playAt(midiOf(n), at + c * len, len * 0.95, vi === 0 ? 0.26 : 0.18); });
      });
    }

    function check() {
      if (done) return;
      var empty = firstEmpty();
      if (empty) {
        sel = empty;
        draw();
        ui.feedback('Write every note first: ' + o.voices[empty.vi].name.toLowerCase() + ' in chord ' + (empty.col + 1));
        return;
      }
      var g = o.grade(notes);
      done = true;
      activeKey = null;
      marks = {};
      g.problems.forEach(function (p) {
        (p.cols || [p.col]).forEach(function (c) {
          marks[c] = marks[c] || {};
          (p.voices && p.voices.length ? p.voices : o.voices.map(function (_, i) { return i; })).forEach(function (vi) { marks[c][vi] = 1; });
        });
      });
      var ok = !g.problems.length;
      draw();
      var list = g.problems.map(function (p) { return '<li>' + p.msg + '</li>'; }).join('');
      var tips = (g.notes || []).map(function (m) { return '<li class="muted">' + m + '</li>'; }).join('');
      ui.feedback(ok ? '<b>Correct.</b>' + (tips ? '<ul class="write-list">' + tips + '</ul>' : '')
        : '<b>Not quite:</b><ul class="write-list">' + list + tips + '</ul>', ok ? 'good' : 'bad');
      if (!ok && g.review) X.review(g.review);
      A.record(o.lesson.id, ok);
      if (ok) A.celebrate('✓', false);
      var acts = [{ label: 'Hear mine', ghost: true, fn: function () { playVoices(notes); } }];
      if (!ok && o.model) acts.push({ label: 'Show a model answer', ghost: true, fn: function () {
        notes = o.model.map(function (c) { return c.slice(); });
        marks = null;
        draw();
        playVoices(notes);
      } });
      acts.push({ label: 'Next →', fn: o.again });
      ui.actions(acts);
      if (!ok) X.review(o.lesson.learn);
    }

    svgs.forEach(function (s, staff) { s.onpointerdown = function (ev) { tap(staff, ev); }; });
    activeKey = function (ev) {
      if (!A.alive(o.token)) return;
      if (ev.key === 'ArrowUp') { ev.preventDefault(); nudge(1); }
      else if (ev.key === 'ArrowDown') { ev.preventDefault(); nudge(-1); }
      else if (ev.key === 'Backspace' || ev.key === 'Delete') { ev.preventDefault(); erase(); }
      else if (ev.key === '#' || ev.key === 's') setAcc(1);
      else if (ev.key === 'b' || ev.key === 'f') setAcc(-1);
      else if (ev.key === 'n') setAcc(0);
      else if (ev.key === 'Enter') check();
    };

    ui.actions([
      { label: 'Hear mine', ghost: true, fn: function () { playVoices(notes); } },
      { label: 'Check', fn: check },
    ]);
    draw();
    // for tests
    return { notes: notes, model: o.model, place: function (c, vi, n) { sel = { col: c, vi: vi }; place(n, vi); }, check: check, setAcc: setAcc, nudge: nudge };
  }

  // ---------- Grading four voices ----------
  // targets: chord objects (tones in root position, type, inv, deg,
  // secondary, label). keyless: no key, so no leading-tone rules.
  function gradeFour(k, targets, notes, opts) {
    opts = opts || {};
    var problems = [], tips = [];
    var clean = true;
    var vname = function (vi) { return FOUR[vi].name.toLowerCase(); };
    targets.forEach(function (c, ci) {
      var where = targets.length > 1 ? ' in chord ' + (ci + 1) + ' (' + c.label + ')' : '';
      var bad = false;
      notes[ci].forEach(function (n, vi) {
        var same = c.tones.filter(function (t) { return t.l === n.l; })[0];
        if (same && same.acc === n.acc) return;
        bad = true;
        if (same) problems.push({ col: ci, voices: [vi], msg: 'The ' + vname(vi) + ' needs ' + T.name(same) + ', not ' + T.name(n) + where });
        else {
          var enh = c.tones.filter(function (t) { return T.pc(t) === T.pc(n); })[0];
          problems.push({ col: ci, voices: [vi], msg: enh
            ? 'Spell the ' + vname(vi) + ' as ' + T.name(enh) + ', not ' + T.name(n) + where
            : T.name(n) + ' (' + vname(vi) + ') isn’t in ' + c.label + ': its notes are ' + c.tones.map(function (t) { return T.name(t); }).join('–') });
        }
      });
      if (bad) { clean = false; return; }
      var count = c.tones.map(function (t) { return notes[ci].filter(function (n) { return n.l === t.l; }).length; });
      var want = c.tones[c.inv];
      if (notes[ci][0].l !== want.l) {
        problems.push({ col: ci, voices: [0], msg: 'The bass should be the ' + MEMBERS[c.inv] + ', ' + T.name(want) + where +
          (c.inv ? ' (' + (T.figure(c.type, c.inv)) + ')' : ' (root position)') });
        clean = false;
      }
      [0, 1, 3].forEach(function (m) {
        if (m < c.tones.length && !count[m]) problems.push({ col: ci, voices: [], msg: 'Missing the ' + MEMBERS[m] + ' (' + T.name(c.tones[m]) + ')' + where });
      });
      if (!count[2]) {
        var sev = c.tones.length === 4;
        if (sev && (c.type === 'hdim7' || c.type === 'dim7')) problems.push({ col: ci, voices: [], msg: 'A ' + T.CHORDS[c.type].name + ' needs its fifth (' + T.name(c.tones[2]) + ')' + where });
        else if (sev && count[0] < 2) problems.push({ col: ci, voices: [], msg: 'Leaving out the fifth: double the root' + where });
        else if (!sev && count[0] < 3) problems.push({ col: ci, voices: [], msg: 'Leaving out the fifth: triple the root' + where });
      }
      if (problems.some(function (p) { return p.col === ci; })) clean = false;
    });
    if (clean) {
      P.errors(k, targets, notes).forEach(function (e) {
        if (e.rule === 'noThird') return; // reported above
        if (opts.keyless && (e.rule === 'ltDouble' || e.rule === 'ltRes')) return;
        var where = targets.length > 1 ? (P.MOTION_RULES[e.rule] ? ' (chord ' + e.at + ' to ' + (e.at + 1) + ')' : ' (chord ' + (e.at + 1) + ')') : '';
        var who = e.voices.length ? ': ' + e.voices.map(vname).join(' and ') : '';
        var msg = P.RULES[e.rule] + who + where;
        if (GUIDELINES[e.rule]) { tips.push('Guideline: ' + msg); return; }
        problems.push({ col: e.at, cols: P.MOTION_RULES[e.rule] ? [e.at - 1, e.at] : null, voices: e.voices, msg: msg, rule: e.rule });
      });
    }
    var first = problems.filter(function (p) { return p.rule; })[0];
    return { problems: problems, notes: tips, review: first ? Learn.LINKS.rule[first.rule] : null };
  }

  function emptyCols(n, w) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(w ? w.slice() : [null, null, null, null]);
    return out;
  }

  // A keyless chord from a letter symbol (Exercises III.1.1, V.1.1).
  var ROOTS = ['C4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C#4', 'Db4', 'G#4'];
  function looseChord(root, type, inv) {
    return { tones: T.chordTones(root, type), type: type, inv: inv, deg: -1, secondary: false, label: T.letterSymbol(root, type, inv) };
  }

  function sharpless(c) { return c.tones.every(function (t) { return Math.abs(t.acc) <= 1; }); }

  // ---------- Write one chord from its symbol ----------
  E.writeChord = {
    round: function (lesson) {
      var token = A.newToken();
      var c = null;
      for (var t = 0; !c || !sharpless(c) || c.label === E.writeChord.last; t++) {
        var type = A.pick(lesson.types);
        // no diminished 6/4: its two doubling rules contradict each other
        c = looseChord(T.parse(A.pick(ROOTS)), type, Math.floor(Math.random() * (T.CHORDS[type].ivs.length === 3 ? 4 : type === 'dim' ? 2 : 3)));
        if (t > 50) break;
      }
      E.writeChord.last = c.label;
      var k = T.key('C');
      var again = function () { E.writeChord.round(lesson); };
      ui.prompt('Write <b>' + c.label + '</b> in four voices');
      ui.sub('No key signature: add accidentals · tap a staff, then adjust · fill the bass first');
      ui.feedback('');
      E.writeChord.current = writer({ token: token, lesson: lesson, k: k, fifths: 0, voices: FOUR, cols: 1, given: emptyCols(1),
        labels: [c.label], order: [0, 3, 2, 1], again: again, model: H.voiceLead(k, [c]),
        grade: function (notes) { return gradeFour(k, [c], notes, { keyless: true }); } });
    },
  };

  // ---------- Two-chord groups in a key ----------
  // lesson.pairs (Roman numerals); shown as letter symbols over the key
  // signature, like the workbook. lesson.given: 'bass' or 'soprano' fixes
  // that voice from a model realization; lesson.figures shows figures
  // under a given bass instead of the chord names.
  function keyText(k) {
    var n = T.name(k.tonic);
    return k.mode === 'minor' ? n.charAt(0).toLowerCase() + n.slice(1) + ' minor' : n + ' major';
  }

  // Figures for a chord over its bass in key k: the inversion figure, with
  // ♯ / ♮ / ♭ where a note above the bass leaves the key signature.
  function figureText(k, c) {
    var fig = T.figure(c.type, c.inv) || '';
    var bass = c.tones[c.inv];
    var shown = fig ? fig.split('/') : c.tones.length === 4 ? ['7'] : [];
    var marks = [];
    c.tones.forEach(function (t, i) {
      if (i === c.inv) return;
      var acc = T.sigAcc(T.fifths(k), t.l);
      if (t.acc === acc) return;
      var size = T.mod(t.l - bass.l, 7) + 1;
      var sign = t.acc > acc ? (t.acc === 0 ? '♮' : '♯') : (t.acc === 0 ? '♮' : '♭');
      marks.push({ size: size, sign: sign });
    });
    marks.forEach(function (m) {
      var at = shown.indexOf(String(m.size));
      if (at >= 0) shown[at] = m.sign + shown[at];
      else if (m.size === 3) shown.unshift(m.sign);
      else shown.unshift(m.sign + m.size);
    });
    return shown.join('/');
  }

  E.writePair = {
    round: function (lesson) {
      var token = A.newToken();
      var k, ids, chords, model;
      for (var t = 0; t < 30; t++) {
        k = A.pick(A.keysFor(lesson.keys));
        ids = A.pick(lesson.pairs || [['V', 'I']]);
        chords = ids.map(function (id) { return H.chord(k, id); });
        if (!chords.every(sharpless)) continue;
        if (lesson.minorOnly && k.mode !== 'minor') continue;
        model = lesson.cadence ? null : H.voiceLead(k, chords);
        if (lesson.cadence) {
          var types = lesson.cadence.filter(function (c) { return c !== 'Ph' || k.mode === 'minor'; });
          var ph = H.cadencePhrase(k, A.pick(types));
          var n = ph.chords.length;
          chords = ph.chords.slice(n - 2);
          model = ph.voices.slice(n - 2);
        }
        if (model && !gradeFour(k, chords, model).problems.length) break;
      }
      var letters = chords.map(function (c) { return T.letterSymbol(c.root, c.type, c.inv); });
      var given = emptyCols(chords.length);
      var givenVoice = lesson.given === 'bass' ? 0 : lesson.given === 'soprano' ? 3 : -1;
      if (givenVoice >= 0) model.forEach(function (v, c) { given[c][givenVoice] = v[givenVoice]; });
      var labels = lesson.figures ? chords.map(function (c) { return figureText(k, c) || ' '; })
        : lesson.cadence ? chords.map(function (c) { return c.label; }) : letters;
      var again = function () { E.writePair.round(lesson); };

      ui.prompt(lesson.figures ? 'Realize the figured bass' : lesson.cadence ? 'Write the cadence' : 'Write <b>' + letters.join(' – ') + '</b> in four voices');
      ui.sub('Key: <b>' + keyText(k) + '</b>' + (givenVoice === 0 ? ' · the bass is given' : givenVoice === 3 ? ' · the soprano is given' : '') +
        ' · tap a staff, then adjust');
      ui.feedback('');
      E.writePair.current = writer({ token: token, lesson: lesson, k: k, fifths: T.fifths(k), voices: FOUR, cols: chords.length, given: given,
        labels: labels, slotLabels: lesson.figures ? chords.map(function (c, i) { return (i + 1) + ': ' + (figureText(k, c) || '5/3'); }) : null,
        order: [0, 3, 2, 1], again: again, model: model,
        grade: function (notes) {
          var g = gradeFour(k, chords, notes);
          if (!g.problems.length) {
            var names = chords.map(function (c, i) { return letters[i] + ' (' + c.label + ')'; }).join(' – ');
            g.notes = [names + (lesson.cadence ? ': ' + cadenceName(k, chords, notes) : '')].concat(g.notes);
          }
          return g;
        } });
    },
  };

  // The cadence a pair makes, by the workbook's definitions.
  function cadenceName(k, chords, notes) {
    var a = chords[0], b = chords[1];
    if (b.deg === 4 && !b.secondary) return a.deg === 3 && a.inv === 1 && k.mode === 'minor' ? 'Phrygian half (Ph)' : 'half (H)';
    if ((a.deg === 4 || a.deg === 6) && b.deg === 0) {
      var perfect = a.deg === 4 && a.inv === 0 && b.inv === 0 && T.pc(notes[1][3]) === T.pc(k.tonic);
      return perfect ? 'perfect authentic (PA)' : 'imperfect authentic (IA)';
    }
    if (a.deg === 4 && b.deg === 5) return 'deceptive (D)';
    if (a.deg === 3 && b.deg === 0) return 'plagal (Pl)';
    return 'cadence';
  }

  // ---------- First-species counterpoint ----------
  // A cantus firmus is given; write a note against each of its notes.
  // (Exercises II.2.1-3, Part II.)
  var TWO = [{ name: 'Lower voice', short: 'L', staff: 1 }, { name: 'Upper voice', short: 'U', staff: 0 }];

  E.writeCounterpoint = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var cfAbove = lesson.cf === 'above' ? true : lesson.cf === 'below' ? false : Math.random() < 0.5;
      var duet = null;
      for (var t = 0; !duet && t < 30; t++) duet = Counterpoint.makeDuet(k, lesson.length || 8, cfAbove, T.note(k.tonic.l, k.tonic.acc, cfAbove ? 4 : 3));
      var n = duet.cf.length;
      var cfVoice = cfAbove ? 1 : 0, cpVoice = 1 - cfVoice;
      var given = duet.cf.map(function (c) { var col = [null, null]; col[cfVoice] = c; return col; });
      var model = duet.cf.map(function (c, i) { var col = [null, null]; col[cfVoice] = c; col[cpVoice] = duet.cp[i]; return col; });
      var voices = TWO.map(function (v, i) { return Object.assign({}, v, { short: i === cfVoice ? 'CF' : 'CP' }); });
      var again = function () { E.writeCounterpoint.round(lesson); };

      ui.prompt('Write a counterpoint ' + (cfAbove ? 'below' : 'above') + ' the cantus firmus');
      ui.sub('Key: <b>' + keyText(k) + '</b> · one note against each note · start and end on a perfect consonance');
      ui.feedback('');
      E.writeCounterpoint.current = writer({ token: token, lesson: lesson, k: k, fifths: T.fifths(k), voices: voices, cols: n, given: given,
        order: [cpVoice], again: again, model: model,
        grade: function (notes) {
          var cp = notes.map(function (c) { return c[cpVoice]; });
          var problems = Counterpoint.violations(duet.cf, cp, !cfAbove).map(function (v) {
            return { col: v.at, voices: [cpVoice], msg: 'Note ' + (v.at + 1) + ': ' + v.why };
          });
          var tips = [];
          if (!problems.length && T.mod(T.step(cp[n - 2]) - T.step(cp[n - 1]), 7) !== 6 && T.mod(T.step(cp[n - 2]) - T.step(cp[n - 1]), 7) !== 1) {
            tips.push('Tip: approach the last note by step');
          }
          return { problems: problems, notes: tips };
        } });
    },
  };

  // Shared with the tests.
  Exercises.compose = { gradeFour: gradeFour, looseChord: looseChord, figureText: figureText, cadenceName: cadenceName, FOUR: FOUR };
})();
