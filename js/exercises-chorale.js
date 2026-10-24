// Analysis of real Bach chorale phrases (chorales.js, analyzed by
// chorale.js), like the workbook's analysis pages: name a marked non-chord
// tone in any voice (Exercises IV.1.1-2, IV.2.1-2), the Roman numeral of a
// marked chord (V.2.3-4), or its figured bass (III.2.3-III.3.4, Part I).
(function () {
  'use strict';

  var A = App;
  var T = Theory;
  var ui = A.ui;
  var X = Exercises.helpers;
  var E = Exercises.engines;
  var midiOf = X.midiOf;

  var INK = '#3b3355';
  var MARK = 'var(--do)';
  var NCT_LABELS = { CT: 'Chord tone', PT: 'Passing (p)', NT: 'Neighbor (n)', ANT: 'Anticipation (ant)', APP: 'Appoggiatura (app)', ET: 'Escape tone (e)',
    APT: 'Accented passing (p)', ANB: 'Accented neighbor (n)', SUS: 'Suspension (s)', RET: 'Retardation (ret)' };
  var NCT_SHORT = { PT: 'p', NT: 'n', ANT: 'ant', APP: 'app', ET: 'e', APT: 'p', ANB: 'n', SUS: 's', RET: 'ret' };
  var STEM = ['down', 'up', 'down', 'up'];

  // A phrase from chorales.js as the { key, voices: [[{ p, t, d, tie }]] }
  // that Chorale.analyze reads.
  function fromPhrase(ph) {
    return { key: ph.key, voices: ph.voices.map(function (v) {
      return v.map(function (e) { var o = { p: e[0], t: e[1], d: e[2] }; if (e[3]) o.tie = e[3]; return o; });
    }) };
  }

  function title(ph) {
    return 'Bach, Chorale ' + ph.num + ', “' + ph.title + '”' + (ph.bwv ? ' (' + ph.bwv + ')' : '') + ', phrase ' + ph.phrase;
  }

  // Draw the phrase on a grand staff: one column per onset time.
  function draw(ph, ch, k, opts) {
    opts = opts || {};
    var times = [];
    ch.voices.forEach(function (v) { v.forEach(function (e) { if (times.indexOf(e.t) < 0) times.push(e.t); }); });
    times.sort(function (a, b) { return a - b; });
    var colOf = function (t) { return times.indexOf(t); };
    var upper = [], lower = [];
    ch.voices.forEach(function (v, vi) {
      v.forEach(function (e, i) {
        var n = T.parse(e.p);
        var marked = opts.mark && opts.mark(vi, i, e);
        var it = { n: n, col: colOf(e.t), stem: STEM[vi], color: marked ? MARK : INK, state: marked ? 'current' : '',
          open: e.d >= 2, whole: e.d >= 4, dot: [0.75, 1.5, 3].indexOf(e.d) >= 0, flag: e.d <= 0.25 ? 2 : e.d <= 0.75 ? 1 : 0,
          tie: e.tie === 'start' || e.tie === 'mid', tag: opts.tag ? opts.tag(vi, i, e) : '' };
        if (vi === 0 && opts.labels && opts.labels[e.t] != null) it.label = opts.labels[e.t];
        (vi >= 2 ? upper : lower).push(it);
      });
    });
    var bars = (ph.bars || []).map(colOf).filter(function (c) { return c > 0; });
    var width = Math.max(520, 150 + times.length * 50);
    ui.staff({ clef: 'treble', fifths: T.fifths(k), minWidth: width, barsBefore: bars, notes: upper });
    ui.staff2({ clef: 'bass', fifths: T.fifths(k), minWidth: width, barsBefore: bars, notes: lower });
  }

  function play(ch) {
    var beat = 0.7, at = Sound.now() + 0.1;
    ch.voices.forEach(function (v, vi) {
      v.forEach(function (e) {
        if (e.tie === 'end' || e.tie === 'mid') return;
        var d = e.d, j = v.indexOf(e);
        while ((v[j].tie === 'start' || v[j].tie === 'mid') && v[j + 1]) { j++; d += v[j].d; }
        Sound.playAt(midiOf(T.parse(e.p)), at + e.t * beat, d * beat * 0.95, vi === 0 ? 0.24 : 0.17);
      });
    });
  }

  // The beats where the harmony is struck (any voice moves).
  function struck(ch, r) {
    return r.beats.filter(function (b, i) {
      return i === 0 || ch.voices.some(function (v) { return v.some(function (e) { return e.t === b.t && e.tie !== 'end' && e.tie !== 'mid'; }); });
    });
  }

  function susFigure(ch, b) {
    var v = b.sus.v, s = ch.voices[v][b.sus.i], res = ch.voices[v][b.sus.i + 1];
    var bass = ch.voices[0].filter(function (e) { return e.t <= b.t && b.t < e.t + e.d; })[0];
    var g = function (n) { return T.mod(T.step(T.parse(n)) - T.step(T.parse(bass.p)), 7) + 1; };
    var f1 = g(s.p), f2 = g(res.p);
    return f1 === 2 && f2 === 1 ? '9–8' : f1 + '–' + f2;
  }

  E.choraleAnalysis = {
    round: function (lesson) {
      var token = A.newToken();
      var ask = lesson.ask;
      var pick = null;
      for (var t = 0; !pick && t < 40; t++) {
        var ph = A.pick(CHORALES);
        var ch = fromPhrase(ph);
        var r = Chorale.analyze(ch, 0, ph.len);
        if (!r.ok) continue;
        var beats = struck(ch, r);
        if (ask === 'nct') {
          var cands = r.ncts.filter(function (x) { return lesson.types.indexOf(x.type) >= 0; });
          if (!cands.length) continue;
          var target;
          if (Math.random() < 0.25) {
            // a chord tone, for contrast
            var b = A.pick(beats), vi = Math.floor(Math.random() * 4);
            var i = ch.voices[vi].map(function (e) { return e.t; }).indexOf(b.t);
            if (i < 0 || r.ncts.some(function (x) { return x.v === vi && x.i === i; })) continue;
            target = { v: vi, i: i, type: 'CT' };
          } else target = A.pick(cands);
          pick = { ph: ph, ch: ch, r: r, target: target };
        } else {
          var bt = A.pick(beats);
          var answer = ask === 'figures' ? (bt.sus ? susFigure(ch, bt) : bt.figures || '5/3') : bt.rn.label;
          pick = { ph: ph, ch: ch, r: r, beat: bt, answer: answer, beats: beats };
        }
        if (pick && pick.ph.num + ':' + (pick.target ? pick.target.v + '.' + pick.target.i : pick.beat.t) === E.choraleAnalysis.last) pick = null;
      }
      E.choraleAnalysis.last = pick.ph.num + ':' + (pick.target ? pick.target.v + '.' + pick.target.i : pick.beat.t);
      var k = pick.r.k, ch2 = pick.ch;
      var again = function () { E.choraleAnalysis.round(lesson); };
      var labels = {};
      pick.r.beats.forEach(function (b) { if (pick.beats ? pick.beats.indexOf(b) >= 0 : true) labels[b.t] = ask === 'figures' ? (b.sus ? susFigure(ch2, b) : b.figures) : b.rn.label; });
      var nctAt = {};
      pick.r.ncts.forEach(function (x) { nctAt[x.v + '.' + x.i] = x.type; });

      var mark, prompt, choices, answer;
      if (ask === 'nct') {
        var tg = pick.target;
        mark = function (vi, i) { return vi === tg.v && i === tg.i; };
        answer = tg.type;
        prompt = 'What is the marked note?';
        choices = ['CT'].concat(lesson.types).map(function (x) { return { label: NCT_LABELS[x], value: x }; });
      } else {
        mark = function (vi, i, e) { return e.t === pick.beat.t; };
        answer = pick.answer;
        prompt = ask === 'figures' ? 'Figured bass for the marked chord?' : 'Roman numeral of the marked chord?';
        var pool = [answer];
        pick.beats.forEach(function (b) { pool.push(ask === 'figures' ? (b.sus ? susFigure(ch2, b) : b.figures || '5/3') : b.rn.label); });
        (ask === 'figures' ? ['5/3', '6', '6/4', '7', '6/5', '4/3', '4/2', '4–3', '♯', '♯6'] : []).forEach(function (f) { pool.push(f); });
        if (ask === 'numeral') ['I', 'ii', 'IV', 'V', 'vi', 'V7', 'I6', 'V6'].forEach(function (id) { try { pool.push(Harmony.chord(k, id).label); } catch (e) { /* skip */ } });
        var seen = {};
        choices = pool.filter(function (x) { if (!x || seen[x]) return false; seen[x] = 1; return true; }).slice(0, 7);
        if (choices.indexOf(answer) < 0) choices[0] = answer;
        choices = choices.sort(function () { return Math.random() - 0.5; }).map(function (x) { return { label: x, value: x }; });
      }

      ui.prompt(prompt);
      ui.sub(title(pick.ph) + ' · ' + A.keyLabel(k));
      ui.feedback('');
      draw(pick.ph, ch2, k, { mark: mark });
      ui.actions([{ label: 'Hear it', ghost: true, fn: function () { play(ch2); } }]);
      ui.answers(choices, function (v) {
        var ok = v === answer;
        ui.lockAnswers(answer, v);
        draw(pick.ph, ch2, k, { mark: mark, labels: labels, tag: function (vi, i) { return NCT_SHORT[nctAt[vi + '.' + i]] || ''; } });
        var what;
        if (ask === 'nct') {
          var e = ch2.voices[pick.target.v][pick.target.i];
          what = '<b>' + NCT_LABELS[answer] + '</b>: ' + T.name(T.parse(e.p)) + ' in the ' + ['bass', 'tenor', 'alto', 'soprano'][pick.target.v];
          if (answer === 'CT') what += ', part of ' + pick.r.beats.filter(function (b) { return b.t <= e.t && e.t < b.t + 1; })[0].rn.label;
        } else {
          var b = pick.beat;
          what = '<b>' + answer + '</b>: ' + T.name(b.chord.root) + ' ' + T.CHORDS[b.chord.type].name + (b.chord.inv ? ', ' + ['root', 'third', 'fifth', 'seventh'][b.chord.inv] + ' in the bass' : '') +
            (ask === 'figures' ? ' (' + b.rn.label + ')' : '');
        }
        ui.feedback((ok ? '' : 'It’s ') + what + '. The labels show the whole phrase’s analysis.', ok ? 'good' : 'bad');
        X.settle(lesson, token, ok, again);
      }, 'cadences');
    },
  };

  Exercises.chorale = { fromPhrase: fromPhrase };
})();
