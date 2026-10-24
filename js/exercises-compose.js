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
    { name: 'Bass', short: 'B', staff: 1, stem: 'down' }, { name: 'Tenor', short: 'T', staff: 1, stem: 'up' },
    { name: 'Alto', short: 'A', staff: 0, stem: 'down' }, { name: 'Soprano', short: 'S', staff: 0, stem: 'up' },
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
  //   indexes in the order to fill), prefill (notes shown but editable),
  //   optional ([col]: may stay empty), lens (beats per column), start
  //   ({ col, vi } to select first), clefs ([upper, lower]), single (one
  //   staff only), grade(notes) -> { problems:
  //   [{ col, voices, msg }], notes: [msg] }, model (voices to play/show),
  //   onDone(ok) }
  function writer(o) {
    var svgs = [document.getElementById('staff'), document.getElementById('staff2')];
    var clefs = o.clefs || ['treble', 'bass'];
    var nv = o.voices.length;
    var notes = o.given.map(function (col, c) {
      return col.map(function (n, vi) { return n || (o.prefill && o.prefill[c][vi]) || null; });
    });
    var editable = function (col, vi) { return !o.given[col][vi]; };
    var optional = function (col) { return !!(o.optional && o.optional[col]); };
    var order = (o.order || o.voices.map(function (_, i) { return i; })).filter(function (vi) {
      return o.given.some(function (col) { return !col[vi]; });
    });
    var sel = o.start ? { col: o.start.col, vi: o.start.vi } : { col: 0, vi: order[0] };
    var done = false, marks = null;

    function firstEmpty() {
      for (var c = 0; c < o.cols; c++) {
        if (optional(c)) continue;
        for (var i = 0; i < order.length; i++) if (!notes[c][order[i]]) return { col: c, vi: order[i] };
      }
      return null;
    }

    // a single line takes one column per note; chords leave room between
    var step = o.single ? 1 : 2;
    function staffOpts(staff) {
      var cols = o.cols * step;
      var width = Math.max(480, 140 + cols * 46);
      var items = [];
      notes.forEach(function (col, c) {
        col.forEach(function (n, vi) {
          if (!n || o.voices[vi].staff !== staff) return;
          var color = marks ? (marks[c] && marks[c][vi] ? BAD : GOOD) : !editable(c, vi) ? GIVEN : INK;
          if (marks && o.plain && o.plain(c, vi, n)) color = !editable(c, vi) ? GIVEN : INK;
          var it = { n: n, col: step * c, color: color, tag: o.voices[vi].short, stem: o.voices[vi].stem,
            state: !done && sel.col === c && sel.vi === vi ? 'current' : '' };
          items.push(it);
        });
      });
      if (o.labels && staff === 1) {
        // labels hang under the bass staff, whether or not the column has notes yet
        o.labels.forEach(function (l, c) {
          var here = items.filter(function (it) { return it.col === step * c; });
          if (here.length) here[0].label = l;
          else items.push({ col: step * c, labelOnly: true, label: l });
        });
      }
      var place = T.fromStep(T.clefRange(clefs[staff]).lo + 4, 0);
      return { clef: clefs[staff], fifths: o.fifths, minWidth: width,
        notes: items.concat([{ n: place, col: cols - 1, hidden: true }]) };
    }

    function draw() {
      ui.staff(staffOpts(0));
      ui.staff2(o.single ? null : staffOpts(1));
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
          var full = optional(c) ? notes[c].some(Boolean) : notes[c].every(Boolean);
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
      (order.length > 1 ? order.slice().reverse() : []).forEach(function (vi) {
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
      var clef = clefs[staff];
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
      if (optional(sel.col)) { draw(); return; } // a decoration: stay put
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

    // Each note lasts until its voice's next note; columns last lens[c] beats.
    function playVoices(v) {
      var beat = 0.9;
      var at = Sound.now() + 0.1;
      var starts = [0];
      for (var c = 0; c < v.length; c++) starts.push(starts[c] + (o.lens ? o.lens[c] : 1));
      for (var vi = 0; vi < nv; vi++) {
        for (c = 0; c < v.length; c++) {
          var n = v[c][vi];
          if (!n) continue;
          var e = c + 1;
          while (e < v.length && !v[e][vi]) e++;
          Sound.playAt(midiOf(n), at + starts[c] * beat, (starts[e] - starts[c]) * beat * 0.95, vi === 0 ? 0.26 : 0.18);
        }
      }
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

    svgs.forEach(function (s, staff) { s.onpointerdown = o.single && staff ? null : function (ev) { tap(staff, ev); }; });
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


  // ---------- Add a non-chord tone or a suspension ----------
  // Two given chords. Write one decoration in one voice: an unaccented NCT
  // on the half beat between them, or an accented one (appoggiatura,
  // accented passing tone, suspension) on the second chord's beat with its
  // resolution on the half beat after. (Exercises IV.1.3-4, IV.2.3-4)
  var NCT_NAMES = { PT: 'passing tone (p)', NT: 'neighbor tone (n)', ANT: 'anticipation (ant)', ET: 'escape tone (e)',
    APP: 'appoggiatura (app)', APT: 'accented passing tone (p)', ANB: 'accented neighbor tone (n)', SUS: 'suspension (s)', RET: 'retardation (ret)' };
  var NCT_LINK = { PT: 'nct-1#passing', NT: 'nct-1#neighbor', ANT: 'nct-1#anticipation', ET: 'nct-1#escape', APP: 'nct-1#appoggiatura',
    APT: 'nct-1#passing', ANB: 'nct-1#neighbor', SUS: 'nct-2#suspension', RET: 'nct-2#retardation' };

  function inChord(n, c) { return c.tones.some(function (t) { return T.pc(t) === T.pc(n); }); }
  function stepsBetween(a, b) { return T.step(b) - T.step(a); }
  function generic(n, bass) { return T.mod(T.step(n) - T.step(bass), 7) + 1; }

  // Parallel 5ths / octaves between two sonorities (any voice moving).
  function parallels(a, b) {
    var out = [];
    for (var i = 0; i < 4; i++) {
      for (var j = i + 1; j < 4; j++) {
        var i0 = T.mod(midiOf(a[j]) - midiOf(a[i]), 12), i1 = T.mod(midiOf(b[j]) - midiOf(b[i]), 12);
        var di = midiOf(b[i]) - midiOf(a[i]), dj = midiOf(b[j]) - midiOf(a[j]);
        if (i0 === i1 && (i0 === 7 || i0 === 0) && di * dj > 0) out.push({ voices: [i, j], what: i0 ? 'Parallel 5ths' : 'Parallel octaves' });
      }
    }
    return out;
  }

  // Suspension figure: '4-3', '7-6', '9-8' over the bass, or '2-3' in it.
  function susFigure(v, beat, after) {
    if (v === 0) return '2-3';
    var f1 = generic(beat[v], beat[0]), f2 = generic(after[v], after[0]);
    if (f1 === 2 && f2 === 1) return '9-8';
    return f1 + '-' + f2;
  }

  // What a decoration is, from the grid [c1, half, c2 beat, half]. Returns
  // { v, type, problems } (type null when it isn't a known NCT).
  function readNCT(k, c1, c2, model2, grid) {
    var problems = [];
    var touched = [0, 1, 2, 3].filter(function (v) {
      return grid[1][v] || grid[3][v] || !T.same(grid[2][v], model2[v]);
    });
    if (touched.length !== 1) {
      problems.push({ col: 1, voices: touched, msg: touched.length ? 'Decorate one voice only' : 'Add the non-chord tone: write it between the chords, or change a note of the second chord and resolve it' });
      return { problems: problems };
    }
    var v = touched[0];
    var a = grid[0][v], m = grid[1][v], b = grid[2][v], p = grid[3][v];
    var accented = !T.same(b, model2[v]);
    var res = { v: v, accented: accented, problems: problems };
    var nct = accented ? b : m;
    var against = accented ? c2 : c1;
    var col = accented ? 2 : 1;
    if (accented && m) { problems.push({ col: 1, voices: [v], msg: 'With an accented NCT, leave the half beat before it empty' }); return res; }
    if (accented && !p) { problems.push({ col: 3, voices: [v], msg: 'Resolve it: write the resolution on the half beat after the second chord' }); return res; }
    if (!accented && p) { problems.push({ col: 3, voices: [v], msg: 'An unaccented NCT goes between the chords, on the first half beat' }); return res; }
    if (inChord(nct, against)) {
      problems.push({ col: col, voices: [v], msg: T.name(nct) + ' is in ' + against.label + ', so it’s a chord tone, not a non-chord tone' });
      return res;
    }
    var key = T.sigAcc(T.fifths(k), nct.l) === nct.acc ||
      (k.mode === 'minor' && nct.acc === T.sigAcc(T.fifths(k), nct.l) + 1 && [5, 6].indexOf(T.mod(nct.l - k.tonic.l, 7)) >= 0);
    if (!key) problems.push({ col: col, voices: [v], msg: 'Use a note of the key for ' + T.name(nct) });
    var before = accented ? a : a, after = accented ? p : b;
    [[before, nct], [nct, after]].forEach(function (pr, i) {
      var iv = T.interval(pr[0], pr[1]);
      if (/^A/.test(iv.id) && iv.id !== 'A1') problems.push({ col: col + i, voices: [v], msg: 'Augmented ' + iv.id + ' in the ' + FOUR[v].name.toLowerCase() });
    });
    var d1 = stepsBetween(before, nct), d2 = stepsBetween(nct, after);
    var step1 = Math.abs(d1) === 1, step2 = Math.abs(d2) === 1, same = d1 * d2 > 0;
    if (!accented) {
      if (step1 && step2 && same) res.type = 'PT';
      else if (step1 && step2) res.type = 'NT';
      else if (step1 && d2 === 0 && midiOf(nct) === midiOf(after)) res.type = 'ANT';
      else if (step1 && Math.abs(d2) > 1 && !same) res.type = 'ET';
      else if (Math.abs(d1) > 1 && step2 && !same) res.type = 'APP';
    } else {
      if (d1 === 0 && midiOf(a) === midiOf(b) && d2 === -1) res.type = 'SUS';
      else if (d1 === 0 && midiOf(a) === midiOf(b) && d2 === 1) res.type = 'RET';
      else if (Math.abs(d1) > 1 && step2 && !same) res.type = 'APP';
      else if (step1 && step2 && same) res.type = 'APT';
      else if (step1 && step2) res.type = 'ANB';
      if (!inChord(p, c2)) problems.push({ col: 3, voices: [v], msg: 'Resolve to a note of ' + c2.label + ' (' + T.name(p) + ' isn’t in it)' });
    }
    if (res.type === 'SUS' || res.type === 'RET') res.figure = susFigure(v, grid[2], grid[2].map(function (n, i) { return i === v ? p : n; }));
    return res;
  }

  // The sonorities in time order, holding notes through empty half beats.
  function slices(grid) {
    var out = [grid[0].slice()];
    for (var c = 1; c < 4; c++) {
      var prev = out[out.length - 1];
      var cur = grid[c].map(function (n, v) { return n || (c === 3 ? out[2][v] : prev[v]); });
      if (c === 2 || grid[c].some(Boolean)) out.push(cur); else out.push(prev.slice());
    }
    return out;
  }

  function gradeNCT(k, c1, c2, model, want, grid) {
    var r = readNCT(k, c1, c2, model[1], grid);
    var problems = r.problems;
    var tips = [];
    if (!problems.length) {
      var name = want.figure ? want.figure.replace('-', '–') + ' suspension' : NCT_NAMES[want.type];
      if (r.type !== want.type || (want.figure && r.figure !== want.figure)) {
        var got = r.type ? (r.figure ? r.figure.replace('-', '–') + ' suspension' : NCT_NAMES[r.type]) : 'not one of the standard non-chord tones';
        var an = function (w) { return (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w; };
        problems.push({ col: r.accented ? 2 : 1, voices: [r.v], msg: 'You wrote ' + (r.type ? an(got) : got) + '; the task asks for ' + an(name) });
      }
    }
    if (!problems.length) {
      var sl = slices(grid);
      for (var i = 1; i < sl.length; i++) {
        if (sl[i].every(function (n, v) { return T.same(n, sl[i - 1][v]); })) continue;
        parallels(sl[i - 1], sl[i]).forEach(function (pp) {
          problems.push({ col: i, voices: pp.voices, msg: pp.what + ': ' + pp.voices.map(function (v) { return FOUR[v].name.toLowerCase(); }).join(' and ') });
        });
      }
      var final = grid[2].map(function (n, v) { return grid[3][v] || n; });
      var g = gradeFour(k, [c1, c2], [grid[0], final]);
      g.problems.forEach(function (pp) { problems.push({ col: pp.col === 1 ? (r.accented ? 3 : 2) : 0, voices: pp.voices, msg: pp.msg }); });
      tips = g.notes;
      if (r.type === 'SUS' && r.v > 0) {
        var resPc = T.pc(grid[3][r.v]);
        if (grid[2].some(function (n, v) { return v !== r.v && v > 0 && T.pc(n) === resPc; })) tips.push('Tip: avoid doubling the note of resolution in another upper voice');
      }
    }
    return { problems: problems, notes: tips, review: problems.length ? NCT_LINK[want.type] : null };
  }

  // Every way to add the wanted decoration to a model connection.
  function nctSolutions(k, c1, c2, model, want) {
    var out = [];
    for (var v = 0; v < 4; v++) {
      for (var d = -4; d <= 4; d++) {
        var accented = /^(APP|APT|ANB|SUS|RET)$/.test(want.type);
        var base = accented ? model[1][v] : model[0][v];
        if (want.type === 'SUS' || want.type === 'RET') { if (d) continue; base = model[0][v]; }
        var n = T.fromStep(T.step(base) + d, 0);
        n.acc = T.sigAcc(T.fifths(k), n.l);
        var grid = [model[0].slice(), [null, null, null, null], model[1].slice(), [null, null, null, null]];
        if (accented) { grid[2][v] = n; grid[3][v] = model[1][v]; } else grid[1][v] = n;
        var g = gradeNCT(k, c1, c2, model, want, grid);
        if (!g.problems.length) out.push({ grid: grid, clean: !g.notes.length });
      }
    }
    return out;
  }

  E.writeNCT = {
    round: function (lesson) {
      var token = A.newToken();
      var task = null;
      for (var t = 0; !task && t < 80; t++) {
        var k = A.pick(A.keysFor(lesson.keys));
        var ids = A.pick(lesson.pairs);
        var chords = ids.map(function (id) { return H.chord(k, id); });
        if (!chords.every(sharpless)) continue;
        var model = H.voiceLead(k, chords);
        if (gradeFour(k, chords, model).problems.length) continue;
        var want = lesson.figures ? { type: 'SUS', figure: A.pick(lesson.figures) } : { type: A.pick(lesson.types) };
        if (want.type + want.figure + ids.join() === E.writeNCT.last) continue;
        var sols = nctSolutions(k, chords[0], chords[1], model, want);
        // a model answer that earns no tips, when there is one
        var best = sols.filter(function (x) { return x.clean; });
        if (sols.length) task = { k: k, chords: chords, model: model, want: want, sol: A.pick(best.length ? best : sols).grid, ids: ids };
      }
      E.writeNCT.last = task.want.type + task.want.figure + task.ids.join();
      var k2 = task.k, c = task.chords, m = task.model;
      var letters = c.map(function (x) { return T.letterSymbol(x.root, x.type, x.inv); });
      var given = [m[0].slice(), [null, null, null, null], [null, null, null, null], [null, null, null, null]];
      var prefill = [null, null, m[1].slice(), null].map(function (col) { return col || [null, null, null, null]; });
      var name = task.want.figure ? 'a ' + task.want.figure.replace('-', '–') + ' suspension' : (/^[aeiou]/.test(NCT_NAMES[task.want.type]) ? 'an ' : 'a ') + NCT_NAMES[task.want.type];
      var accented = /^(APP|APT|ANB|SUS|RET)$/.test(task.want.type);
      var again = function () { E.writeNCT.round(lesson); };

      ui.prompt('Add ' + name);
      ui.sub('Key: <b>' + keyText(k2) + '</b> · ' + letters.join(' – ') + ' · ' + (accented
        ? 'change one note of the second chord to the dissonance, then resolve it on the half beat after'
        : 'write it on the half beat between the chords, in any voice'));
      ui.feedback('');
      E.writeNCT.current = writer({ token: token, lesson: lesson, k: k2, fifths: T.fifths(k2), voices: FOUR, cols: 4, given: given, prefill: prefill,
        optional: [false, true, false, true], lens: accented ? [1, 0, 0.5, 0.5] : [0.5, 0.5, 1, 0.5],
        labels: [letters[0], '+', letters[1], '+'], slotLabels: ['1: ' + letters[0], '+', '2: ' + letters[1], '+'],
        order: [3, 2, 1, 0], start: { col: accented ? 2 : 1, vi: 3 }, again: again, model: task.sol,
        plain: function (col, vi, n) {
          return col === 0 || (col === 2 && T.same(n, m[1][vi]));
        },
        grade: function (grid) { return gradeNCT(k2, c[0], c[1], m, task.want, grid); } });
    },
  };

  // ---------- Approach and resolve the 7th like a non-chord tone ----------
  // Three chords, the middle one a seventh chord. (Exercises V.1.3-4)
  var APPROACH_NAMES = { SUS: 'suspension', PT: 'passing tone', NT: 'neighbor tone', APP: 'appoggiatura' };
  var SEV_TRIPLES = [['I', 'ii6/5', 'V'], ['I', 'V4/2', 'I6'], ['V', 'V7', 'I'], ['I', 'V4/3', 'I'], ['I6', 'V4/3', 'I'],
    ['IV', 'V7', 'I'], ['vi', 'ii7', 'V'], ['ii', 'V7', 'I'], ['I', 'V6/5', 'I'], ['I', 'IV7', 'V']];

  // How the 7th of the middle chord is approached, or null.
  function sevenApproach(c, notes) {
    var sev = T.pc(c[1].tones[3]);
    var v = [0, 1, 2, 3].filter(function (i) { return T.pc(notes[1][i]) === sev; })[0];
    if (v == null) return null;
    var a = notes[0][v], s = notes[1][v], r = notes[2][v];
    var d1 = stepsBetween(a, s), d2 = stepsBetween(s, r);
    var type = null;
    if (midiOf(a) === midiOf(s)) type = 'SUS';
    else if (d1 === -1 && d2 === -1) type = 'PT';
    else if (d1 === 1 && d2 === -1) type = 'NT';
    else if (Math.abs(d1) > 1 && d2 === -1) type = 'APP';
    return { v: v, type: type };
  }

  E.writeSeventh = {
    round: function (lesson) {
      var token = A.newToken();
      var want = A.pick(['SUS', 'PT', 'NT', 'APP'], E.writeSeventh.last);
      var task = null;
      for (var t = 0; !task && t < 120; t++) {
        var k = A.pick(A.keysFor(lesson.keys));
        // after 60 misses, fall back on the reading's example for this approach
        var tpl = t > 60 ? Exercises.book.APPROACHES.filter(function (x) { return x.name.toLowerCase() === APPROACH_NAMES[want]; })[0] : null;
        var ids = tpl ? tpl.chords : A.pick(SEV_TRIPLES);
        var chords = ids.map(function (id) { return H.chord(k, id); });
        if (!chords.every(sharpless)) continue;
        var model = tpl ? Exercises.book.moveTo(k, tpl.voices) : H.voiceLead(k, chords);
        if (gradeFour(k, chords, model).problems.length) continue;
        var ap = sevenApproach(chords, model);
        if (ap && ap.type === want) task = { k: k, chords: chords, model: model };
      }
      if (!task) { E.writeSeventh.last = want; return E.writeSeventh.round(lesson); }
      E.writeSeventh.last = want;
      var k2 = task.k, c = task.chords;
      var letters = c.map(function (x) { return T.letterSymbol(x.root, x.type, x.inv); });
      var again = function () { E.writeSeventh.round(lesson); };

      ui.prompt('Write <b>' + letters.join(' – ') + '</b>: approach the 7th like a <b>' + APPROACH_NAMES[want] + '</b>');
      ui.sub('Key: <b>' + keyText(k2) + '</b> (' + c.map(function (x) { return x.label; }).join(' – ') + ') · the 7th resolves down by step');
      ui.feedback('');
      E.writeSeventh.current = writer({ token: token, lesson: lesson, k: k2, fifths: T.fifths(k2), voices: FOUR, cols: 3, given: emptyCols(3),
        labels: letters, order: [0, 3, 2, 1], again: again, model: task.model,
        grade: function (notes) {
          var g = gradeFour(k2, c, notes);
          if (!g.problems.length) {
            var ap = sevenApproach(c, notes);
            if (!ap || ap.type !== want) {
              g.problems.push({ col: 1, voices: ap ? [ap.v] : [], msg: ap
                ? 'The 7th (' + T.name(notes[1][ap.v]) + ', ' + FOUR[ap.v].name.toLowerCase() + ') is approached ' + (ap.type ? 'like a ' + APPROACH_NAMES[ap.type] : 'by an awkward leap') + ', not like a ' + APPROACH_NAMES[want]
                : 'Chord 2 needs its 7th' });
              g.review = 'sevenths-4v#approach';
            }
          }
          return g;
        } });
    },
  };

  // Shared with the tests.
  Exercises.compose = { writer: writer, gradeFour: gradeFour, gradeNCT: gradeNCT, readNCT: readNCT, nctSolutions: nctSolutions, sevenApproach: sevenApproach, looseChord: looseChord, figureText: figureText, cadenceName: cadenceName, FOUR: FOUR };
})();
