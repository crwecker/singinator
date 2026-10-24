// Engines that mirror workbook tasks from Murray's Essential Materials:
// name a chord from a bass note and figures, build a chord from one of its
// members, Roman numerals <-> chords <-> keys, how a chordal 7th is
// approached, and naming a cadence from the score. Chords are named with
// letter symbols the way the workbook writes them (F♯6, c6/4, gø7).
(function () {
  'use strict';

  var A = App;
  var T = Theory;
  var H = Harmony;
  var ui = A.ui;
  var X = Exercises.helpers;
  var E = Exercises.engines;
  var midiOf = X.midiOf;

  var MEMBERS = ['root', 'third', 'fifth', 'seventh'];
  var DEGREE_NAMES = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant', 'leading tone'];
  var IDS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // The answer plus up to n-1 distinct distractors, shuffled.
  function withDistractors(answer, pool, n) {
    var seen = {}; seen[answer] = 1;
    var out = [answer];
    shuffle(pool.slice()).forEach(function (p) { if (p && !seen[p] && out.length < (n || 6)) { seen[p] = 1; out.push(p); } });
    return shuffle(out).map(function (l) { return { label: l, value: l }; });
  }

  function clean(notes) { return notes.every(function (n) { return Math.abs(n.acc) <= 1; }); }

  function seventh(type) { return T.CHORDS[type].ivs.length === 3; }

  // Root-position tones of a chord: root, third, fifth (seventh).
  function tonesOf(root, type) { return T.chordTones(root, type); }

  // Symbols a student might confuse with this one: other inversions, the
  // other qualities on the same root, and the chord read from a wrong root.
  function symbolPool(root, type, inv, types) {
    var pool = [];
    var invs = seventh(type) ? 4 : 3;
    for (var i = 0; i < invs; i++) pool.push(T.letterSymbol(root, type, i));
    types.forEach(function (t) { if (seventh(t) === seventh(type)) pool.push(T.letterSymbol(root, t, inv)); });
    tonesOf(root, type).slice(1).forEach(function (n) {
      types.forEach(function (t) {
        if (seventh(t) !== seventh(type)) return;
        var c = tonesOf(n, t);
        if (clean(c)) pool.push(T.letterSymbol(n, t, inv));
      });
    });
    return pool;
  }

  function placeIn(notes, clef) {
    var r = T.clefRange(clef);
    var shift = Math.round(((r.lo + r.hi) / 2 - T.step(notes[0]) - 3) / 7);
    return notes.map(function (n) { return T.note(n.l, n.acc, n.oct + shift); });
  }

  function chordStaff(notes, clef, fifths, label, marked) {
    return { clef: clef, fifths: fifths || 0, minWidth: 360, notes: notes.map(function (n, i) {
      return { n: n, col: 0, state: marked != null && marked !== i ? '' : 'current', label: i === 0 ? label || '' : '' };
    }) };
  }

  function play(notes, arpeggio) {
    var m = notes.map(midiOf);
    return Sound.playSequence(arpeggio ? [m].concat(m) : [m], 0.8);
  }

  // ---------- Figured bass: name the chord ----------
  // lesson.figures: from FIGURES. The key signature sets every note above
  // the bass; ♯ raises the 3rd (alone) or the 6th (♯6) a half step.
  var FIGURES = {
    '': [3, 5], '6': [3, 6], '6/4': [4, 6],
    '7': [3, 5, 7], '6/5': [3, 5, 6], '4/3': [3, 4, 6], '4/2': [2, 4, 6],
    '♯': ['3+', 5], '♯6': [3, '6+'],
  };

  // Notes above a bass for a figure, from the key signature.
  function realize(bass, fig, fifths) {
    return [bass].concat(FIGURES[fig].map(function (iv) {
      var raise = typeof iv === 'string';
      var size = parseInt(iv, 10);
      var n = T.fromStep(T.step(bass) + size - 1, 0);
      n.acc = T.sigAcc(fifths, n.l) + (raise ? 1 : 0);
      return n;
    }));
  }

  // { root, type, inv } for a set of notes (bass first), or null.
  function analyze(notes) {
    for (var i = 0; i < notes.length; i++) {
      var r = notes[i];
      var stack = notes.map(function (n) { return T.mod(n.l - r.l, 7); });
      var want = notes.length === 3 ? [0, 2, 4] : [0, 2, 4, 6];
      if (want.some(function (d) { return stack.indexOf(d) < 0; })) continue;
      var root = T.note(r.l, r.acc, 4);
      var ordered = want.map(function (d) {
        var n = notes[stack.indexOf(d)];
        var x = T.note(n.l, n.acc, 4);
        while (T.step(x) <= T.step(root) && d) x.oct++;
        return x;
      });
      var type = T.chordType(ordered);
      if (!type) return null;
      return { root: root, type: type, inv: want.indexOf(T.mod(notes[0].l - r.l, 7)) };
    }
    return null;
  }

  E.figuredBass = {
    round: function (lesson) {
      var token = A.newToken();
      var pick = null;
      for (var t = 0; !pick && t < 60; t++) {
        var k = A.pick(A.keysFor(lesson.keys));
        var fifths = T.fifths(k);
        var fig = A.pick(lesson.figures);
        // ♯ figures belong in minor: ♯ under the dominant, ♯6 under re (vii°6)
        if (fig === '♯' || fig === '♯6') {
          if (k.mode !== 'minor') continue;
        }
        var deg = fig === '♯' ? 4 : fig === '♯6' ? 1 : Math.floor(Math.random() * 7);
        var bass = T.degreeNote(k, deg, 0, 3);
        if (T.step(bass) > T.step(T.parse('A3'))) bass.oct--;
        var notes = realize(bass, fig, fifths);
        var a = clean(notes) && analyze(notes);
        if (!a || a.type === 'aug' || (lesson.types && lesson.types.indexOf(a.type) < 0)) continue;
        if (fig + T.name(bass) === E.figuredBass.last) continue;
        pick = { k: k, fifths: fifths, fig: fig, bass: bass, notes: notes, a: a };
      }
      E.figuredBass.last = pick.fig + T.name(pick.bass);
      var answer = T.letterSymbol(pick.a.root, pick.a.type, pick.a.inv);
      var types = seventh(pick.a.type) ? ['maj7', 'dom7', 'min7', 'hdim7', 'dim7'] : ['maj', 'min', 'dim'];
      var pool = symbolPool(pick.a.root, pick.a.type, pick.a.inv, types);
      // the classic slip: reading the bass as the root
      var onBass = analyze(realize(pick.bass, seventh(pick.a.type) ? '7' : '', pick.fifths));
      if (onBass) pool.push(T.letterSymbol(onBass.root, onBass.type, 0), T.letterSymbol(onBass.root, onBass.type, pick.a.inv));
      var again = function () { E.figuredBass.round(lesson); };
      var figText = pick.fig || 'no figure';

      ui.prompt('Which chord?');
      ui.sub('Bass with <b>' + figText + '</b> · the key signature sets every note above it');
      ui.feedback('');
      ui.actions([]);
      ui.staff({ clef: 'bass', fifths: pick.fifths, minWidth: 360, notes: [{ n: pick.bass, col: 0, state: 'current', label: pick.fig || '' }] });
      ui.answers(withDistractors(answer, pool, 6), function (v) {
        var ok = v === answer;
        ui.lockAnswers(answer, v);
        var shown = [pick.bass].concat(pick.notes.slice(1).map(function (n) {
          var x = T.note(n.l, n.acc, n.oct);
          while (T.step(x) <= T.step(pick.bass)) x.oct++;
          return x;
        }));
        ui.staff({ clef: 'bass', fifths: pick.fifths, minWidth: 360, notes: shown.map(function (n, i) {
          return { n: n, col: 0, state: 'current', label: i === 0 ? pick.fig || '' : '' };
        }) });
        var spelled = tonesOf(pick.a.root, pick.a.type).map(function (n) { return T.name(n); }).join('–');
        ui.feedback((ok ? '' : 'It’s ') + '<b>' + answer + '</b>: ' + figText + ' above ' + T.name(pick.bass) + ' gives ' + spelled +
          ', ' + (pick.a.inv ? 'with the ' + MEMBERS[pick.a.inv] + ' in the bass' : 'root position'), ok ? 'good' : 'bad');
        play(shown, true);
        X.settle(lesson, token, ok, again);
      }, 'chords');
    },
  };

  // ---------- Name a chord by its letter symbol ----------
  // (Exercises II.3.1, IV.3.1-4: root, quality and figures, e.g. f♯°6, B♭4/3.)
  var ROOTS = ['C3', 'D3', 'Eb3', 'E3', 'F3', 'F#3', 'G3', 'Ab3', 'A3', 'Bb3', 'B3', 'C#3', 'Db3', 'G#3'];

  E.readSymbol = {
    round: function (lesson) {
      var token = A.newToken();
      var p = null;
      for (var t = 0; !p && t < 60; t++) {
        var type = A.pick(lesson.types);
        var inv = lesson.inversions ? Math.floor(Math.random() * (seventh(type) ? 4 : 3)) : 0;
        var root = T.parse(A.pick(ROOTS));
        var notes = T.chordVoicing(root, type, inv);
        if (!clean(notes) || T.letterSymbol(root, type, inv) === E.readSymbol.last) continue;
        p = { type: type, inv: inv, root: T.note(root.l, root.acc, 4), notes: notes };
      }
      var answer = T.letterSymbol(p.root, p.type, p.inv);
      E.readSymbol.last = answer;
      var clef = lesson.clefs ? A.pick(lesson.clefs) : 'treble';
      var notes = placeIn(p.notes, clef);
      var again = function () { E.readSymbol.round(lesson); };

      ui.prompt('Name the chord');
      ui.sub(X.clefName(clef) + ' · root, quality' + (lesson.inversions ? ' and figures' : ''));
      ui.feedback('');
      ui.actions([]);
      ui.staff(chordStaff(notes, clef, 0, ''));
      ui.answers(withDistractors(answer, symbolPool(p.root, p.type, p.inv, lesson.types), 6), function (v) {
        var ok = v === answer;
        ui.lockAnswers(answer, v);
        ui.staff(chordStaff(notes, clef, 0, answer));
        var desc = T.name(p.root) + ' ' + T.CHORDS[p.type].name + (p.inv ? ', ' + MEMBERS[p.inv] + ' in the bass' : ', root position');
        ui.feedback((ok ? '' : 'It’s ') + '<b>' + answer + '</b>: ' + desc, ok ? 'good' : 'bad');
        play(notes, true);
        X.settle(lesson, token, ok, again);
      }, 'chords');
    },
  };

  // ---------- Build a chord from one given member ----------
  // "E♭ is the third of a minor triad": which triad? (Exercises II.3.3, IV.3.3)
  var GIVEN = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'Bb3', 'Eb4', 'Ab4', 'Db4', 'F#4', 'C#4', 'G#4'];
  var TYPE_WORDS = { maj: 'major triad', min: 'minor triad', dim: 'diminished triad', aug: 'augmented triad',
    maj7: 'major 7th chord', dom7: 'dominant 7th chord', min7: 'minor 7th chord', hdim7: 'half-diminished 7th chord', dim7: 'fully diminished 7th chord' };

  E.buildChord = {
    round: function (lesson) {
      var token = A.newToken();
      var p = null;
      for (var t = 0; !p && t < 60; t++) {
        var type = A.pick(lesson.types);
        var members = seventh(type) ? lesson.members : lesson.members.filter(function (m) { return m !== 'seventh'; });
        var m = MEMBERS.indexOf(A.pick(members));
        var given = T.parse(A.pick(GIVEN));
        var root = m ? T.transpose(given, T.CHORDS[type].ivs[m - 1], false) : given;
        var tones = tonesOf(root, type);
        if (!clean(tones) || T.letterSymbol(root, type, 0) === E.buildChord.last) continue;
        p = { type: type, m: m, given: given, root: root, tones: tones };
      }
      var answer = T.letterSymbol(p.root, p.type, 0);
      E.buildChord.last = answer;
      // wrong readings: the given note as another member, or the wrong quality
      var pool = [];
      MEMBERS.slice(0, p.tones.length).forEach(function (mm, i) {
        if (i === p.m) return;
        var r = i ? T.transpose(p.given, T.CHORDS[p.type].ivs[i - 1], false) : p.given;
        if (clean(tonesOf(r, p.type))) pool.push(T.letterSymbol(r, p.type, 0));
      });
      lesson.types.forEach(function (t) {
        if (t === p.type || seventh(t) !== seventh(p.type)) return;
        var r = p.m ? T.transpose(p.given, T.CHORDS[t].ivs[p.m - 1] || 'P1', false) : p.given;
        if (clean(tonesOf(r, t))) pool.push(T.letterSymbol(r, t, 0));
      });
      var again = function () { E.buildChord.round(lesson); };

      ui.prompt('<b>' + T.name(p.given) + '</b> is the <b>' + MEMBERS[p.m] + '</b> of a ' + TYPE_WORDS[p.type] + '. Which chord?');
      ui.sub('Don’t change the given note');
      ui.feedback('');
      ui.actions([]);
      ui.staff({ clef: 'treble', minWidth: 360, notes: [{ n: p.given, col: 0, state: 'current' }] });
      ui.answers(withDistractors(answer, pool, 5), function (v) {
        var ok = v === answer;
        ui.lockAnswers(answer, v);
        var shown = placeIn(p.tones, 'treble');
        ui.staff(chordStaff(shown, 'treble', 0, answer, p.m));
        ui.feedback((ok ? '' : 'It’s ') + '<b>' + answer + '</b>: ' + p.tones.map(function (n) { return T.name(n); }).join('–') +
          ', with ' + T.name(p.given) + ' as its ' + MEMBERS[p.m], ok ? 'good' : 'bad');
        play(shown, true);
        X.settle(lesson, token, ok, again);
      }, 'chords');
    },
  };

  // ---------- Roman numerals, chords and keys ----------
  // lesson.ask: 'numeral' (E♭: V -> which triad), 'name' (c♯: subdominant ->
  // which triad) or 'key' (d is iv in which key?). (Exercises V.2.1-2)
  function keyText(k) {
    var n = T.name(k.tonic);
    return k.mode === 'minor' ? n.charAt(0).toLowerCase() + n.slice(1) + ' minor' : n + ' major';
  }

  E.numeralKey = {
    round: function (lesson) {
      var token = A.newToken();
      var keys = A.keysFor(lesson.keys);
      var k, deg, c;
      for (var t = 0; t < 40; t++) {
        k = A.pick(keys);
        deg = Math.floor(Math.random() * 7);
        c = H.chord(k, IDS[deg]);
        if (clean(c.tones) && c.label + keyText(k) !== E.numeralKey.last) break;
      }
      E.numeralKey.last = c.label + keyText(k);
      var symbol = T.letterSymbol(c.root, c.type, 0);
      var answer, choices, prompt;
      if (lesson.ask === 'key') {
        // every key (up to the lesson's signatures) where this chord is diatonic
        var homes = [];
        ['major', 'minor'].forEach(function (mode) {
          T.allKeys(mode, lesson.keys.max || 6).forEach(function (kk) {
            IDS.forEach(function (id) {
              var x = H.chord(kk, id);
              if (T.letterSymbol(x.root, x.type, 0) === symbol) homes.push({ k: kk, label: x.label });
            });
          });
        });
        answer = keyText(k);
        prompt = '<b>' + symbol + '</b> is <b>' + c.label + '</b> in which key?';
        choices = withDistractors(answer, homes.map(function (h) { return h.label === c.label ? null : keyText(h.k); })
          .concat(keys.map(keyText)), 5);
        ui.sub('Minor keys use i, ii°, III, iv, V, VI, vii°');
        E.numeralKey.homes = homes;
      } else {
        answer = symbol;
        prompt = lesson.ask === 'name'
          ? 'In <b>' + keyText(k) + '</b>, which triad is the <b>' + DEGREE_NAMES[deg] + '</b>?'
          : 'In <b>' + keyText(k) + '</b>, which triad is <b>' + c.label + '</b>?';
        var pool = IDS.map(function (id) { var x = H.chord(k, id); return T.letterSymbol(x.root, x.type, 0); });
        ['maj', 'min', 'dim'].forEach(function (tt) { if (tt !== c.type && clean(tonesOf(c.root, tt))) pool.push(T.letterSymbol(c.root, tt, 0)); });
        choices = withDistractors(answer, pool, 6);
        ui.sub(k.mode === 'minor' ? 'Minor: V and vii° use the raised leading tone' : '');
      }
      var again = function () { E.numeralKey.round(lesson); };
      var notes = placeIn(T.chordVoicing(c.root, c.type, 0), 'treble');

      ui.prompt(prompt);
      ui.feedback('');
      ui.actions([]);
      ui.staff(lesson.ask === 'key' ? chordStaff(notes, 'treble', 0, '') : { clef: 'treble', fifths: T.fifths(k), minWidth: 360, notes: [] });
      ui.answers(choices, function (v) {
        var ok = v === answer;
        ui.lockAnswers(answer, v);
        ui.staff(chordStaff(notes, 'treble', T.fifths(k), c.label));
        var more = '';
        if (lesson.ask === 'key') {
          more = E.numeralKey.homes.map(function (h) { return keyText(h.k).replace(' major', '').replace(' minor', '') + ': ' + h.label; }).join(' · ');
        }
        ui.feedback((ok ? '' : 'It’s ') + '<b>' + answer + '</b>: ' + c.label + ' in ' + keyText(k) + ' is ' +
          c.tones.map(function (n) { return T.name(n); }).join('–') + (more ? '<br><span class="muted">' + symbol + ' is ' + more + '</span>' : ''), ok ? 'good' : 'bad');
        A.playCadence(k, true).then(function () { if (A.alive(token)) play(notes, false); });
        X.settle(lesson, token, ok, again);
      }, 'chords');
    },
  };

  // ---------- How is the 7th approached? ----------
  // The reading's three-chord examples in C (sevenths-4v#approach), moved to
  // a random major key. The marked note is the chordal 7th. (Exercises V.1.3-4)
  var APPROACHES = Learn.find('sevenths-4v#approach').section.examples.filter(function (ex) { return ex.approach; })
    .map(function (ex) { return { name: ex.approach, chords: ex.chords, voices: ex.voices, at: ex.mark[0][1] }; });

  function moveTo(k, voices) {
    var tonic = T.note(k.tonic.l, k.tonic.acc, 4);
    var iv = T.interval(T.parse('C4'), tonic);
    var down = iv.semis > 5;
    var id = down ? T.invertInterval(iv.id) : iv.id;
    return voices.map(function (v) { return v.map(function (s) { return iv.semis === 0 ? T.parse(s) : T.transpose(T.parse(s), id, !down); }); });
  }

  E.sevenApproach = {
    round: function (lesson) {
      var token = A.newToken();
      var ap = A.pick(APPROACHES, E.sevenApproach.last);
      E.sevenApproach.last = ap;
      var k, voices;
      for (var t = 0; t < 30; t++) {
        k = A.pick(A.keysFor(lesson.keys));
        voices = moveTo(k, ap.voices);
        if (voices.every(clean)) break;
      }
      var labels = ap.chords.map(function (id) { return H.chord(k, id).label; });
      var mark = function (vi, j) { return j === 1 && vi === ap.at ? 'var(--do)' : '#3b3355'; };
      var again = function () { E.sevenApproach.round(lesson); };

      ui.prompt('The marked 7th is approached like which non-chord tone?');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · look at the marked voice in all three chords');
      ui.feedback('');
      X.grandStaff(k, voices, { labels: labels, color: mark });
      ui.actions([{ label: 'Hear it', fn: function () { X.playFour(voices); } }]);
      ui.answers(APPROACHES.map(function (a) { return { label: a.name, value: a.name }; }), function (v) {
        var ok = v === ap.name;
        ui.lockAnswers(ap.name, v);
        var line = voices.map(function (c) { return T.name(c[ap.at]); }).join(' → ');
        ui.feedback((ok ? '' : 'It’s ') + '<b>' + ap.name + '</b>: ' + line + ' in the ' + ['bass', 'tenor', 'alto', 'soprano'][ap.at], ok ? 'good' : 'bad');
        X.playFour(voices);
        X.settle(lesson, token, ok, again);
      }, 'cadences');
    },
  };

  // ---------- Name a cadence from the score ----------
  // (Exercises V.3.1-2: label the chords, name the cadence.)
  E.readCadence = {
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var type = A.pick(lesson.cadences.filter(function (c) { return k.mode === 'minor' || c !== 'Ph'; }), E.readCadence.last);
      E.readCadence.last = type;
      var phrase = H.cadencePhrase(k, type);
      var labels = phrase.chords.map(function (c) { return c.label; });
      var again = function () { E.readCadence.round(lesson); };

      ui.prompt('Which cadence?');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · name the last two chords, then the cadence');
      ui.feedback('');
      X.grandStaff(k, phrase.voices, {});
      ui.actions([{ label: 'Hear it', ghost: true, fn: function () { A.playVoicings(phrase.voices, 0.85); } }]);
      ui.answers(lesson.cadences.map(function (c) { return { label: H.CADENCES[c].name, value: c }; }), function (v) {
        var ok = v === type;
        ui.lockAnswers(type, v);
        X.grandStaff(k, phrase.voices, { labels: labels });
        ui.feedback((ok ? '' : 'It’s ') + '<b>' + H.CADENCES[type].name + '</b>: ' + labels.slice(-2).join(' → '), ok ? 'good' : 'bad');
        if (!ok) X.review(Learn.LINKS.cadence[type]);
        A.playVoicings(phrase.voices, 0.85);
        X.settle(lesson, token, ok, again);
      }, 'cadences');
    },
  };

  // Shared with the tests.
  Exercises.book = { realize: realize, analyze: analyze, moveTo: moveTo, APPROACHES: APPROACHES, FIGURES: FIGURES };
})();
