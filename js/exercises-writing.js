// Engines for the written-theory topics: phrases and periods, first-species
// errors, four-part writing (find the error, sing a voice) and non-chord
// tones. Four-part examples use both staves: soprano and alto on the
// treble, tenor and bass on the bass, chords on even columns.
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
  var GREY = '#b9b2cc';
  var MARK = 'var(--sol)';
  var BAD = 'var(--do)';
  var NCT_MARK = 'var(--ti)'; // in sung lessons, where blue marks the current note
  var VOICE_NAMES = ['bass', 'tenor', 'alto', 'soprano'];

  function later(token, ms, fn) { X.later(token, ms, fn); }

  // Like settle, but a right answer waits for the replay to finish before
  // moving on, so the next round's sound doesn't land on top of it.
  function settleAfter(lesson, token, ok, again, playing) {
    if (!ok) { X.settle(lesson, token, ok, again); return; }
    A.record(lesson.id, true);
    A.celebrate('✓', false);
    playing.then(function () { later(token, 400, again); });
  }

  // ---------- Four-part helpers ----------
  // voices: [[b, t, a, s], ...]. opts: labels (under the bass), color(v, j)
  // for voice v of chord j, line (a soprano line from NCT.example, replacing
  // the soprano), lineColor(e, i), hide (voice indexes not drawn), sylLabels
  // ({ v, k }: syllables under that voice), svgs ([upper, lower] to draw
  // into instead of the lesson's staves), tag(v, j) / lineTag(e, i): a
  // small word beside a note head.
  // Chorale stems: soprano and tenor up, alto and bass down. For the
  // notation-error exercises, opts.flip(v, j) turns a voice's stem the
  // wrong way and opts.upper(v, j) writes it on the treble staff.
  function stemOf(vi, j, opts) {
    var up = vi === 1 || vi === 3;
    if (opts.flip && opts.flip(vi, j)) up = !up;
    if (opts.upper && opts.upper(vi, j) && vi === 1) up = false; // a third voice on the staff: no free direction
    return up ? 'up' : 'down';
  }

  function grandStaff(k, voices, opts) {
    opts = opts || {};
    var hide = opts.hide || [];
    var color = opts.color || function () { return INK; };
    var upper = [], lower = [];
    voices.forEach(function (v, j) {
      [0, 1, 2, 3].forEach(function (vi) {
        if (hide.indexOf(vi) >= 0 || (opts.line && vi === 3)) return;
        var it = { n: v[vi], col: 2 * j, color: color(vi, j), tag: opts.tag && opts.tag(vi, j),
          stem: opts.stems === false ? null : stemOf(vi, j, opts) };
        if (vi === 0 && opts.labels) it.label = opts.labels[j];
        if (opts.sylLabels && opts.sylLabels.v === vi && opts.sylLabels.upTo > j) it.label = A.sylOf(v[vi], k).text;
        (vi >= 2 || (opts.upper && opts.upper(vi, j)) ? upper : lower).push(it);
      });
    });
    if (opts.line && hide.indexOf(3) < 0) {
      opts.line.forEach(function (e, i) {
        var it = { n: e.n, col: e.col, tie: e.tie, color: opts.lineColor ? opts.lineColor(e, i) : INK, tag: opts.lineTag && opts.lineTag(e, i),
          stem: opts.stems === false ? null : 'up' };
        if (opts.sylLabels && opts.sylLabels.v === 3 && opts.sylLabels.upTo > i) it.label = A.sylOf(e.n, k).text;
        upper.push(it);
      });
    }
    var cols = voices.length * 2;
    var width = Math.max(480, 140 + cols * 46);
    var top = { clef: 'treble', fifths: T.fifths(k), minWidth: width, notes: upper.concat([{ n: T.parse('C5'), col: cols - 1, hidden: true }]) };
    var bottom = { clef: 'bass', fifths: T.fifths(k), minWidth: width, notes: lower.concat([{ n: T.parse('C3'), col: cols - 1, hidden: true }]) };
    if (opts.svgs) { Staff.render(opts.svgs[0], top); Staff.render(opts.svgs[1], bottom); return; }
    ui.staff(top);
    ui.staff2(bottom);
  }

  // Play block chords a beat each; the soprano can follow its own line
  // (NCT.sopranoTimes). Resolves when the last chord ends.
  function playFour(voices, beat, line) {
    beat = beat || 0.9;
    var at = Sound.now() + 0.15;
    voices.forEach(function (v, j) {
      v.forEach(function (n, vi) {
        if (line && vi === 3) return;
        Sound.playAt(midiOf(n), at + j * beat, beat * 0.95, vi === 0 ? 0.26 : 0.18);
      });
    });
    if (line) {
      NCT.sopranoTimes(line).forEach(function (e) {
        Sound.playAt(midiOf(e.n), at + e.start * beat, (e.end - e.start) * beat * 0.95, 0.28);
      });
    }
    var ms = (voices.length * beat + 0.4) * 1000;
    return new Promise(function (res) { setTimeout(res, ms); });
  }

  // The learn pages draw and play their examples the same way.
  X.grandStaff = grandStaff;
  X.playFour = playFour;

  function retry(fn, tries) {
    for (var i = 0; i < (tries || 20); i++) { var r = fn(); if (r) return r; }
    return null;
  }

  function voicesList(vs) {
    var names = vs.map(function (v) { return VOICE_NAMES[v]; });
    return names.length === 2 ? names[0] + ' and ' + names[1] : names[0] || '';
  }

  // ---------- Find the error in a connection ----------
  E.spotError = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var choices = lesson.rules.concat(['none']);
      var r = null, rule;
      for (var t = 0; !r && t < 12; t++) {
        rule = A.pick(choices, E.spotError.last);
        r = P.faultyConnection(k, lesson.pairs, rule === 'none' ? null : rule);
      }
      if (!r) { rule = 'none'; r = P.faultyConnection(k, [['I', 'IV'], ['V', 'I']], null); }
      E.spotError.last = rule;
      var labels = r.chords.map(function (c) { return c.label; });
      var again = function () { E.spotError.round(lesson); };

      ui.prompt('What’s wrong with this connection?');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · soprano and alto on top, tenor and bass below');
      ui.feedback('');
      var err0 = r.error;
      var notation = err0 && err0.rule === 'notation' ? {
        flip: function (vi, j) { return err0.kind === 'stems' && j === err0.at && vi === err0.voices[0]; },
        upper: function (vi, j) { return err0.kind === 'staff' && j === err0.at && vi === 1; },
      } : {};
      grandStaff(k, r.voices, Object.assign({ labels: labels }, notation));
      ui.actions([
        { label: 'Hear it', fn: function () { playFour(r.voices); } },
      ]);
      ui.answers(choices.map(function (c) { return { label: c === 'none' ? 'No errors' : P.RULES[c], value: c }; }), function (v) {
        var ok = v === rule;
        ui.lockAnswers(rule, v);
        var err = r.error;
        grandStaff(k, r.voices, Object.assign({ labels: labels }, notation, { color: function (vi, j) {
          if (!err) return INK;
          // connection errors involve both chords; chord errors only their own
          var chord = P.MOTION_RULES[err.rule] ? j <= 1 : j === err.at;
          return chord && err.voices.indexOf(vi) >= 0 ? BAD : INK;
        } }));
        var what = err ? P.RULES[err.rule] + (err.voices.length ? ' (' + voicesList(err.voices) + ')' : '') : 'No errors: this connection is fine';
        ui.feedback((ok ? '' : 'It’s: ') + '<b>' + what + '</b>', ok ? 'good' : 'bad');
        if (!ok) X.review(Learn.LINKS.rule[err ? err.rule : v]);
        var acts = [{ label: 'Hear it', ghost: true, fn: function () { playFour(r.voices); } }];
        if (err) acts.push({ label: 'Hear a correct version', ghost: true, fn: function () {
          grandStaff(k, r.clean, { labels: labels, color: function () { return 'var(--fa)'; } });
          playFour(r.clean);
        } });
        // a right answer moves on by itself (settle); a wrong one waits for Next
        X.settle(lesson, token, ok, again);
        if (!ok) ui.actions(acts.concat([{ label: 'Next →', fn: again }]));
      }, 'cadences');
    },
  };

  // ---------- Sing one line of a four-part texture ----------
  // notes: the line to sing; draw(i) redraws with note i current.
  function singLine(lesson, token, k, notes, drawAt, playAll, again, intro) {
    var run;
    ui.feedback('');
    ui.answers([]);
    ui.meter(true);
    drawAt(0);
    ui.actions([
      { label: 'Hear it all', ghost: true, fn: function () { A.stopListening(); playAll().then(function () { if (A.alive(token) && run) run.restart(); }); } },
      { label: 'Hear my part', ghost: true, fn: function () { Sound.playSequence(notes.map(midiOf), 0.55); } },
      { label: 'Start over', ghost: true, fn: function () { if (run) run.restart(); } },
      { label: 'Skip', ghost: true, fn: function () {
        A.stopListening();
        drawAt(-1);
        A.record(lesson.id, false);
        playAll().then(function () { later(token, 400, again); });
      } },
    ]);
    // Listen only after the chords stop: the detector would lock onto them.
    A.playCadence(k).then(function () {
      if (!A.alive(token)) return;
      ui.prompt('Listen…');
      return playAll();
    }).then(function () {
      if (!A.alive(token)) return;
      ui.prompt(intro);
      run = X.singMelody(Object.assign({}, lesson, { labels: true }), token, k, 'treble', notes, drawAt, function () {
        ui.prompt('Nice!');
        settleAfter(lesson, token, true, again, playAll());
      });
    });
  }

  function lineColor(cur) {
    return function (i) { return cur < 0 || i < cur ? 'var(--fa)' : i === cur ? MARK : INK; };
  }

  // Sing the soprano, alto, tenor or bass of a progression.
  E.singVoice = {
    mic: true,
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var pg = retry(function () {
        var ids = H.makeProgression(lesson.chords, lesson.length || 4);
        var chords = ids.map(function (id) { return H.chord(k, id); });
        var voices = H.voiceLead(k, chords);
        return P.errors(k, chords, voices).length ? null : { chords: chords, voices: voices };
      }) || (function () {
        var chords = ['I', 'IV', 'V', 'I'].map(function (id) { return H.chord(k, id); });
        return { chords: chords, voices: H.voiceLead(k, chords) };
      })();
      var vi = lesson.voice === 'any' || !lesson.voice ? A.pick([0, 1, 2, 3]) : VOICE_NAMES.indexOf(lesson.voice);
      var notes = pg.voices.map(function (v) { return v[vi]; });
      var labels = pg.chords.map(function (c) { return c.label; });
      var again = function () { E.singVoice.round(lesson); };
      var cur = 0;
      var drawAt = function (i) {
        if (i != null) cur = i;
        var col = lineColor(cur);
        grandStaff(k, pg.voices, { labels: labels, sylLabels: { v: vi, upTo: cur < 0 ? notes.length : cur },
          color: function (v, j) { return v === vi ? col(j) : GREY; } });
      };

      ui.prompt('Sing the <b>' + VOICE_NAMES[vi] + '</b>');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · hear the chords, then sing your line · first note in any octave');
      singLine(lesson, token, k, notes, drawAt, function () { return playFour(pg.voices); }, again, 'Sing the ' + VOICE_NAMES[vi]);
    },
  };

  // ---------- Non-chord tones ----------
  function nctExample(lesson, k) {
    var type = A.pick(lesson.types, E.readNCT.last);
    E.readNCT.last = type;
    var ex = NCT.example(k, type);
    return ex || NCT.example(k, 'PT');
  }

  function nctDesc(ex) {
    var t = NCT.TYPES[ex.type];
    return '<b>' + t.name + (ex.figure ? ' (' + ex.figure + ')' : '') + '</b>: ' + t.how;
  }

  function nctChoices(lesson) {
    return lesson.types.map(function (t) { return { label: NCT.TYPES[t].name, value: t }; });
  }

  // See a short progression; name the marked non-chord tone.
  E.readNCT = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var ex = nctExample(lesson, k);
      var labels = ex.chords.map(function (c) { return c.label; });
      var again = function () { E.readNCT.round(lesson); };
      var draw = function () {
        grandStaff(k, ex.voices, { labels: labels, line: ex.line, lineColor: function (e) { return e.nct ? MARK : INK; } });
      };
      var play = function () { return playFour(ex.voices, 1, ex.line); };

      ui.prompt('What kind of non-chord tone is the <span style="color:var(--sol)">blue</span> note?');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · look at how the soprano gets to it and leaves it');
      ui.feedback('');
      draw();
      ui.actions([{ label: 'Hear it', fn: play }]);
      ui.answers(nctChoices(lesson), function (v) {
        var ok = v === ex.type;
        ui.lockAnswers(ex.type, v);
        ui.feedback((ok ? '' : 'It’s: ') + nctDesc(ex), ok ? 'good' : 'bad');
        if (!ok) X.review(Learn.LINKS.nct[ex.type]);
        settleAfter(lesson, token, ok, again, play());
      }, 'cadences');
    },
  };

  // Hear a progression; name the non-chord tone in the soprano.
  E.earNCT = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var ex = nctExample(lesson, k);
      var labels = ex.chords.map(function (c) { return c.label; });
      var again = function () { E.earNCT.round(lesson); };
      var play = function () { return playFour(ex.voices, 1, ex.line); };

      ui.prompt('Which non-chord tone do you hear in the soprano?');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · the lower voices are shown; the top line is hidden');
      ui.feedback('');
      grandStaff(k, ex.voices, { labels: labels, hide: [3] });
      ui.actions([{ label: 'Replay', fn: play }]);
      ui.answers(nctChoices(lesson), function (v) {
        var ok = v === ex.type;
        ui.lockAnswers(ex.type, v);
        grandStaff(k, ex.voices, { labels: labels, line: ex.line, lineColor: function (e) { return e.nct ? MARK : INK; } });
        ui.feedback((ok ? '' : 'It was: ') + nctDesc(ex), ok ? 'good' : 'bad');
        if (!ok) X.review(Learn.LINKS.nct[ex.type]);
        settleAfter(lesson, token, ok, again, play());
      }, 'cadences');
      A.playCadence(k).then(function () { if (A.alive(token)) play(); });
    },
  };

  // Sing a soprano line with its non-chord tone over the chords.
  E.singNCT = {
    mic: true,
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var ex = nctExample(lesson, k);
      // a tied note is sung once
      var sung = ex.line.filter(function (e, i) { return !(i > 0 && ex.line[i - 1].tie); });
      var notes = sung.map(function (e) { return e.n; });
      var labels = ex.chords.map(function (c) { return c.label; });
      var again = function () { E.singNCT.round(lesson); };
      var cur = 0;
      var drawAt = function (i) {
        if (i != null) cur = i;
        var col = lineColor(cur);
        grandStaff(k, ex.voices, { labels: labels, line: ex.line,
          color: function () { return GREY; },
          lineColor: function (e) {
            var si = sung.indexOf(e);
            if (si < 0) si = sung.indexOf(ex.line[ex.line.indexOf(e) - 1]); // held half of a tie
            return e.nct && (cur >= 0 && si >= cur) ? NCT_MARK : col(si);
          } });
      };

      ui.prompt('Sing the soprano');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · ' + NCT.TYPES[ex.type].name.toLowerCase() + ' in pink · first note in any octave');
      singLine(lesson, token, k, notes, drawAt, function () { return playFour(ex.voices, 1, ex.line); }, again, 'Sing the soprano, non-chord tone and all');
    },
  };

  // ---------- Root relationships and root motion ----------
  // Root distance going up, in steps (0-6): 3 = up a 4th / down a 5th.
  var ROOT_MOVES = ['', 'up a 2nd', 'up a 3rd', 'up a 4th (down a 5th)', 'up a 5th (down a 4th)', 'down a 3rd', 'down a 2nd'];
  var RELATION = { 1: '27', 6: '27', 2: '36', 5: '36', 3: '45', 4: '45' };
  var RELATIONS = [
    { label: '4th / 5th', sub: '1 common tone', value: '45' },
    { label: '3rd / 6th', sub: '2 common tones', value: '36' },
    { label: '2nd / 7th', sub: 'no common tones', value: '27' },
  ];
  var PROGRESSIVE = { 3: 1, 1: 1, 5: 1 };
  var MOTIONS = [
    { label: 'Progressive', sub: 'down a 5th, up a 2nd, down a 3rd', value: 'P' },
    { label: 'Retrogressive', sub: 'the reverse', value: 'R' },
  ];

  // See two chords; name how their roots relate (ask: 'relation') or
  // whether the root motion is progressive (ask: 'motion').
  E.rootMotion = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var ids, d;
      do {
        ids = [A.pick(lesson.chords), A.pick(lesson.chords)];
        var cs = ids.map(function (id) { return H.chord(k, id); });
        d = T.mod(cs[1].root.l - cs[0].root.l, 7);
      } while (!d || (E.rootMotion.last === RELATION[d] && Math.random() < 0.6));
      E.rootMotion.last = lesson.ask === 'motion' ? null : RELATION[d];
      var chords = ids.map(function (id) { return H.chord(k, id); });
      var voices = H.voiceLead(k, chords);
      var labels = chords.map(function (c) { return c.label; });
      var common = chords[0].tones.map(T.pc).filter(function (pc) { return chords[1].tones.some(function (t) { return T.pc(t) === pc; }); });
      var answer = lesson.ask === 'motion' ? (PROGRESSIVE[d] ? 'P' : 'R') : RELATION[d];
      var again = function () { E.rootMotion.round(lesson); };
      var play = function () { return playFour(voices, 1.1); };

      ui.prompt(lesson.ask === 'motion' ? 'Progressive or retrogressive?' : 'How far apart are the roots?');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · find each chord’s root, not its bass note');
      ui.feedback('');
      grandStaff(k, voices, {});
      ui.actions([{ label: 'Hear it', fn: play }]);
      ui.answers(lesson.ask === 'motion' ? MOTIONS : RELATIONS, function (v) {
        var ok = v === answer;
        ui.lockAnswers(answer, v);
        grandStaff(k, voices, { labels: labels, color: function (vi, j) {
          return common.indexOf(T.pc(voices[j][vi])) >= 0 ? 'var(--fa)' : INK;
        } });
        var roots = T.name(chords[0].root) + ' → ' + T.name(chords[1].root);
        var shares = common.length ? 'common tone' + (common.length > 1 ? 's' : '') + ' in green' : 'no common tones';
        ui.feedback((ok ? '' : 'Not quite: ') + 'roots ' + roots + ' go <b>' + ROOT_MOVES[d] + '</b>' +
          (lesson.ask === 'motion' ? ', <b>' + (PROGRESSIVE[d] ? 'progressive' : 'retrogressive') + '</b>' : '') + ' · ' + shares, ok ? 'good' : 'bad');
        if (!ok) X.review(lesson.ask === 'motion' ? 'function#root-motion' : 'connecting-1#roots');
        settleAfter(lesson, token, ok, again, play());
      }, 'cadences');
    },
  };

  // ---------- Phrases and periods ----------
  var CADENCE_ANSWERS = [
    { label: 'Authentic cadence', sub: 'ends on do', value: 'PAC' },
    { label: 'Half cadence', sub: 'ends on re, ti or sol', value: 'HC' },
  ];

  function placePhrases(k, phrases, clef) {
    var all = [].concat.apply([], phrases);
    var tonic = A.placeTonic(k, clef, Math.min.apply(null, all), Math.max.apply(null, all));
    return phrases.map(function (p) { return p.map(function (off) { return A.noteAt(k, tonic, off, 0); }); });
  }

  // Each phrase on its own staff, one above the other, so their openings
  // line up; cadence names under the last notes.
  function phraseStaff(k, clef, notes, opts) {
    opts = opts || {};
    var draw = [ui.staff.bind(ui), ui.staff2.bind(ui)];
    notes.forEach(function (p, pi) {
      draw[pi]({ clef: clef, fifths: T.fifths(k), minWidth: 480, notes: p.map(function (n, i) {
        var info = A.sylOf(n, k);
        var it = { n: n, col: i, color: opts.plain ? INK : info.color, state: opts.state ? opts.state(pi, i) : '' };
        if (opts.syllables) it.label = info.text;
        if (opts.cadences && i === p.length - 1) it.label = (it.label ? it.label + ' ' : '') + opts.cadences[pi];
        return it;
      }) });
    });
    if (notes.length < 2) ui.staff2(null);
  }

  function playPhrases(notes, token) {
    var seq = [];
    notes.forEach(function (p, i) {
      if (i) seq.push(null, null);
      seq = seq.concat(p.map(midiOf));
    });
    var at = Sound.now() + 0.1, beat = 0.5;
    seq.forEach(function (m, i) { if (m != null) Sound.playAt(m, at + i * beat, beat * (i === seq.length - 1 ? 1.8 : 0.92), 0.32); });
    return new Promise(function (res) { setTimeout(res, (seq.length * beat + 0.6) * 1000); });
  }

  // Hear a phrase; is its cadence authentic or half?
  E.earPhrase = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var clef = X.clefOf(lesson);
      var cad = Math.random() < 0.5 ? 'PAC' : 'HC';
      var notes = placePhrases(k, [Phrase.phrase(cad, lesson.length || 8)], clef);
      var again = function () { E.earPhrase.round(lesson); };
      var play = function () { return playPhrases(notes, token); };

      ui.prompt('How does the phrase end?');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · a conclusive ending lands on do');
      ui.feedback('');
      ui.staff({ clef: clef, fifths: T.fifths(k), notes: [] });
      ui.actions([{ label: 'Replay', fn: play }, { label: 'Replay key', ghost: true, fn: function () { A.playCadence(k, true); } }]);
      ui.answers(CADENCE_ANSWERS, function (v) {
        var ok = v === cad;
        ui.lockAnswers(cad, v);
        phraseStaff(k, clef, notes, { syllables: true });
        var last = A.sylOf(notes[0][notes[0].length - 1], k).text;
        ui.feedback((ok ? '' : 'It was a ') + '<b>' + (cad === 'PAC' ? 'authentic' : 'half') + ' cadence</b>, ending on ' + last, ok ? 'good' : 'bad');
        X.settle(lesson, token, ok, again);
      }, 'cadences');
      A.playCadence(k).then(function () { if (A.alive(token)) play(); });
    },
  };

  function periodAnswers() {
    return Object.keys(Phrase.PERIODS).map(function (p) { return { label: Phrase.PERIODS[p], value: p }; });
  }

  function periodWhy(pd) {
    var cads = pd.cadences.map(function (c) { return c === 'PAC' ? 'authentic' : 'half'; });
    if (pd.kind === 'none') return 'the second cadence (' + cads[1] + ') is no stronger than the first (' + cads[0] + ')';
    return cads[0] + ' then ' + cads[1] + ' cadence; the second phrase ' + (pd.kind === 'parallel' ? 'begins like the first' : 'begins with new material');
  }

  function periodRound(lesson, engine, byEar) {
    var token = A.newToken();
    var k = A.pick(A.keysFor(lesson.keys));
    var clef = X.clefOf(lesson);
    var kind = A.pick(Object.keys(Phrase.PERIODS), engine.last);
    engine.last = kind;
    var pd = retry(function () { return Phrase.period(kind, lesson.length || 8); });
    var notes = placePhrases(k, pd.phrases, clef);
    var again = function () { periodRound(lesson, engine, byEar); };
    var play = function () { return playPhrases(notes, token); };

    ui.prompt(byEar ? 'Listen to both phrases. What do they form?' : 'Two phrases. What do they form?');
    ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · compare the openings, then the cadences');
    ui.feedback('');
    if (byEar) ui.staff({ clef: clef, fifths: T.fifths(k), notes: [] });
    else phraseStaff(k, clef, notes, { plain: true });
    ui.actions([{ label: byEar ? 'Replay' : 'Hear it', fn: play }]);
    ui.answers(periodAnswers(), function (v) {
      var ok = v === kind;
      ui.lockAnswers(kind, v);
      phraseStaff(k, clef, notes, { syllables: true, cadences: pd.cadences.map(function (c) { return c === 'PAC' ? 'AC' : 'HC'; }) });
      ui.feedback((ok ? '' : 'It’s: ') + '<b>' + Phrase.PERIODS[kind] + '</b>: ' + periodWhy(pd), ok ? 'good' : 'bad');
      if (byEar) X.settle(lesson, token, ok, again);
      else settleAfter(lesson, token, ok, again, play());
    }, 'cadences');
    if (byEar) A.playCadence(k).then(function () { if (A.alive(token)) play(); });
  }

  E.earPeriod = { round: function (lesson) { periodRound(lesson, E.earPeriod, true); } };
  E.readPeriod = { round: function (lesson) { periodRound(lesson, E.readPeriod, false); } };

  // Hear the antecedent; sing the consequent from the staff.
  E.singConsequent = {
    mic: true,
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var clef = X.clefOf(lesson);
      var kind = A.pick(['parallel', 'contrasting']);
      var pd = retry(function () { return Phrase.period(kind, lesson.length || 8); });
      var notes = placePhrases(k, pd.phrases, clef);
      var mine = notes[1];
      var again = function () { E.singConsequent.round(lesson); };
      var cur = 0;
      var drawAt = function (i) {
        if (i != null) cur = i;
        phraseStaff(k, clef, notes, { plain: true, state: function (pi, j) {
          if (pi === 0) return 'done';
          return cur < 0 || j < cur ? 'done' : j === cur ? 'current' : '';
        } });
      };
      var run;

      ui.prompt('Listen to the question…');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · ' + Phrase.PERIODS[kind].toLowerCase() + ' · sing the answering phrase');
      ui.feedback('');
      ui.answers([]);
      ui.meter(true);
      drawAt(0);
      ui.actions([
        { label: 'Hear the question', ghost: true, fn: function () { A.stopListening(); playPhrases([notes[0]], token).then(function () { if (A.alive(token) && run) run.restart(); }); } },
        { label: 'Start over', ghost: true, fn: function () { if (run) run.restart(); } },
        { label: 'Skip', ghost: true, fn: function () {
          A.stopListening();
          drawAt(-1);
          A.record(lesson.id, false);
          playPhrases(notes, token).then(function () { later(token, 400, again); });
        } },
      ]);
      A.playCadence(k).then(function () {
        if (!A.alive(token)) return;
        return playPhrases([notes[0]], token);
      }).then(function () {
        if (!A.alive(token)) return;
        ui.prompt('Now sing the answer');
        run = X.singMelody(lesson, token, k, clef, mine, drawAt, function () {
          ui.prompt('Nice!');
          ui.feedback(periodWhy(pd), 'good');
          settleAfter(lesson, token, true, again, playPhrases(notes, token));
        });
      });
    },
  };

  // ---------- First species: find the broken rule ----------
  var CP_RULES = Counterpoint.ERROR_RULES;

  E.cpError = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var choices = lesson.rules.concat(['none']);
      var r = null, rule;
      for (var t = 0; !r && t < 8; t++) {
        rule = A.pick(choices, E.cpError.last);
        r = Counterpoint.brokenDuet(k, lesson.length || 7, rule);
      }
      if (!r) { rule = 'none'; r = Counterpoint.brokenDuet(k, 6, 'none'); }
      E.cpError.last = rule;
      var d = r.duet;
      var again = function () { E.cpError.round(lesson); };
      // reveal: interval numbers; mark: color the notes at fault (or fixed)
      var draw = function (duet, reveal, mark) {
        var opts = function (part, clef, isCp) {
          return { clef: clef, fifths: T.fifths(k), minWidth: 520, notes: part.map(function (n, i) {
            var it = { n: n, col: i, open: true, noStem: true, color: INK };
            if (mark && isCp && r.error && (i === r.error.at || (/parallel|hidden|leap/.test(r.error.why) && i === r.error.at - 1))) it.color = mark;
            if (reveal && !isCp) it.label = String(T.step(duet.upper[i]) - T.step(duet.lower[i]) + 1);
            return it;
          }) };
        };
        ui.staff(opts(duet.upper, 'treble', duet.upper === duet.cp));
        ui.staff2(opts(duet.lower, 'bass', duet.lower === duet.cp));
      };
      var play = function (duet) {
        var at = Sound.now() + 0.1;
        duet.upper.forEach(function (n, i) {
          Sound.playAt(midiOf(n), at + i * 0.8, 0.76, 0.26);
          Sound.playAt(midiOf(duet.lower[i]), at + i * 0.8, 0.76, 0.26);
        });
      };

      ui.prompt('Which rule does the counterpoint break?');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · cantus firmus in the ' + (r.above ? 'bass' : 'treble') + ', counterpoint in the ' + (r.above ? 'treble' : 'bass'));
      ui.feedback('');
      draw(d, false);
      ui.actions([{ label: 'Hear it', fn: function () { play(d); } }]);
      ui.answers(choices.map(function (c) { return { label: c === 'none' ? 'No errors' : CP_RULES[c].name, value: c }; }), function (v) {
        var ok = v === rule;
        ui.lockAnswers(rule, v);
        draw(d, true, BAD);
        var why = r.error && r.error.why.replace(/^dissonance or bad interval (\w+)$/, function (_, id) { return 'a harmonic ' + T.intervalName(id).toLowerCase(); });
        var what = r.error ? CP_RULES[rule].name + ' at note ' + (r.error.at + 1) + ' (' + why + ')' : 'No errors';
        ui.feedback((ok ? '' : 'It’s: ') + '<b>' + what + '</b>', ok ? 'good' : 'bad');
        X.settle(lesson, token, ok, again);
        if (r.error) {
          var acts = [{ label: 'Hear it', ghost: true, fn: function () { play(d); } },
            { label: 'Hear it fixed', ghost: true, fn: function () { draw(r.fixed, true, 'var(--fa)'); play(r.fixed); } }];
          if (!ok) acts.push({ label: 'Next →', fn: again });
          ui.actions(acts);
        }
      }, 'cadences');
    },
  };
})();
