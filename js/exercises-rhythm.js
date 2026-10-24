// Rhythm engines: tap a rhythm, pick the rhythm you heard, and sight-sing
// melodies in time. Timing runs on the AudioContext clock.
(function () {
  'use strict';

  var A = App;
  var T = Theory;
  var R = Rhythm;
  var ui = A.ui;
  var X = Exercises.helpers;
  var E = Exercises.engines;
  var midiOf = X.midiOf;

  function secPerQuarter(ts, bpm) { return 60 / bpm / R.TIME[ts].beat; }
  function beatsPerMeasure(ts) { return Math.round(R.TIME[ts].measure / R.TIME[ts].beat); }

  // Metronome from `from` for `measures` measures; returns the end time.
  function clicks(from, ts, bpm, measures) {
    var beat = 60 / bpm;
    var n = beatsPerMeasure(ts) * measures;
    for (var b = 0; b < n; b++) Sound.click(from + b * beat, b % beatsPerMeasure(ts) === 0);
    return from + n * beat;
  }

  function totalQuarters(events) {
    var last = events[events.length - 1];
    return last.start + last.dur;
  }

  // Index of the event sounding at quarter-time q.
  function eventAt(events, q) {
    for (var i = 0; i < events.length; i++) if (q >= events[i].start && q < events[i].start + events[i].dur) return i;
    return -1;
  }

  function pickTime(lesson) { return A.pick(lesson.time || ['4/4']); }

  // Play a rhythm (hits) or melody (pitched) with a one-measure count-in.
  function playBack(events, ts, bpm, pitched) {
    var spq = secPerQuarter(ts, bpm);
    var t0 = clicks(Sound.now() + 0.15, ts, bpm, 1);
    events.forEach(function (e, i) {
      if (e.rest || (i > 0 && events[i - 1].tie)) return;
      // a tied note sounds through its continuation
      var len = e.dur;
      for (var j = i; events[j].tie && events[j + 1]; j++) len += events[j + 1].dur;
      var at = t0 + e.start * spq;
      if (pitched) Sound.playAt(midiOf(e.n), at, Math.max(0.12, len * spq * 0.92), 0.32);
      else Sound.hit(at, e.start % R.TIME[ts].measure === 0);
    });
    return t0 + totalQuarters(events) * spq;
  }

  // ---------- Tap the rhythm ----------
  var activeKey = null;
  document.addEventListener('keydown', function (ev) {
    if (activeKey && !document.getElementById('lesson').hidden) activeKey(ev);
  });

  E.tapRhythm = {
    round: function (lesson) {
      var token = A.newToken();
      var ts = pickTime(lesson);
      var bpm = lesson.bpm || 80;
      var events = R.makeRhythm(ts, lesson.measures || 2, lesson.level || 1);
      var again = function () { E.tapRhythm.round(lesson); };
      var running = false, taps = [], t0 = 0, raf = 0, recorded = false;
      var draw = function (current) {
        ui.staff(null);
        var svg = document.getElementById('staff');
        svg.style.display = '';
        Staff.renderMeasures(svg, { clef: 'percussion', time: ts, minWidth: 520, events: events.map(function (e, i) {
          return Object.assign({}, e, { state: i === current ? 'current' : '' });
        }) });
      };

      function tap(ev) {
        if (!running) return;
        if (ev) ev.preventDefault();
        taps.push(Sound.now());
        var pad = document.getElementById('tap-pad');
        if (pad) { pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit'); }
      }
      function onKey(ev) { if (A.alive(token) && (ev.code === 'Space' || ev.key === ' ')) tap(ev); }

      function start() {
        if (running) return;
        running = true;
        taps = [];
        var spq = secPerQuarter(ts, bpm);
        t0 = clicks(Sound.now() + 0.2, ts, bpm, 1);              // count-in
        clicks(t0, ts, bpm, lesson.measures || 2);              // and keep time
        var end = t0 + totalQuarters(events) * spq;
        ui.feedback('Count in… then tap on the notes');
        var follow = function () {
          if (!A.alive(token)) return;
          var now = Sound.now();
          if (now >= t0) draw(eventAt(events, (now - t0) / spq));
          if (now < end + 0.5) raf = requestAnimationFrame(follow);
          else finish(spq);
        };
        raf = requestAnimationFrame(follow);
      }

      function finish(spq) {
        running = false;
        cancelAnimationFrame(raf);
        var on = R.onsets(events);
        var expected = on.map(function (o) { return t0 + o.at * spq; });
        var gaps = expected.slice(1).map(function (x, i) { return x - expected[i]; });
        var tol = Math.max(0.06, Math.min(0.12, 0.3 * Math.min.apply(null, gaps.concat([1]))));
        var s = R.scoreTaps(expected, taps, tol);
        var right = s.hits.filter(Boolean).length;
        var result = {};
        on.forEach(function (o, i) { result[o.index] = s.hits[i] ? 'right' : 'wrong'; });
        // tied continuations take their attack's result
        events.forEach(function (e, i) { if (!(i in result) && i > 0 && events[i - 1].tie) result[i] = result[i - 1]; });
        var svg = document.getElementById('staff');
        Staff.renderMeasures(svg, { clef: 'percussion', time: ts, minWidth: 520, events: events.map(function (e, i) {
          return Object.assign({}, e, { result: result[i] });
        }) });
        // taps are exact input, not noisy detection: every note must land
        var ok = right === on.length && s.extras <= 1;
        var latency = Math.abs(s.offset) > 0.04 ? ' · you tap ' + Math.round(Math.abs(s.offset) * 1000) + ' ms ' + (s.offset > 0 ? 'late' : 'early') + ' (allowed for)' : '';
        ui.feedback(right + ' of ' + on.length + ' in time' + (s.extras ? ' · ' + s.extras + ' extra tap' + (s.extras > 1 ? 's' : '') : '') + latency, ok ? 'good' : 'bad');
        // only the first graded try counts toward mastery; retries are practice
        if (!recorded) { recorded = true; A.record(lesson.id, ok); }
        if (ok) A.celebrate('✓', false);
        ui.actions([
          { label: 'Try again', ghost: true, fn: function () { draw(-1); start(); } },
          { label: 'Hear it', ghost: true, fn: function () { playBack(events, ts, bpm, false); } },
          { label: 'Next →', fn: again },
        ]);
      }

      ui.prompt('Tap the rhythm');
      ui.sub(ts + ' · ♩ = ' + bpm + (R.compound(ts) ? ' (dotted quarter)' : '') + ' · tap the pad or press Space');
      ui.feedback('');
      draw(-1);
      var box = document.getElementById('answers');
      box.innerHTML = '';
      box.className = 'answers';
      var pad = document.createElement('button');
      pad.id = 'tap-pad';
      pad.className = 'tap-pad';
      pad.textContent = 'TAP';
      pad.addEventListener('pointerdown', tap);
      box.appendChild(pad);
      activeKey = onKey; // one document listener, pointed at the current round
      ui.actions([
        { label: 'Start', fn: start },
        { label: 'Hear it', ghost: true, fn: function () { playBack(events, ts, bpm, false); } },
      ]);
      // expose for tests
      E.tapRhythm.current = { events: events, ts: ts, bpm: bpm, t0: function () { return t0; }, tap: function (at) { taps.push(at); } };
    },
  };

  // ---------- Which rhythm did you hear? ----------
  function sameOnsets(a, b) {
    var x = R.onsets(a).map(function (o) { return o.at; }).join(',');
    var y = R.onsets(b).map(function (o) { return o.at; }).join(',');
    return x === y;
  }

  E.earRhythm = {
    round: function (lesson) {
      var token = A.newToken();
      var ts = pickTime(lesson);
      var bpm = lesson.bpm || 84;
      var level = lesson.level || 2;
      var answer = R.makeRhythm(ts, lesson.measures || 1, level);
      var options = [answer];
      for (var tries = 0; options.length < (lesson.choices || 3) && tries < 200; tries++) {
        var o = R.makeRhythm(ts, lesson.measures || 1, level);
        if (!options.some(function (x) { return sameOnsets(x, o); })) options.push(o);
      }
      options.sort(function () { return Math.random() - 0.5; });
      var correct = options.indexOf(answer);
      var again = function () { E.earRhythm.round(lesson); };
      var play = function () { playBack(answer, ts, bpm, false); };

      ui.prompt('Which rhythm did you hear?');
      ui.sub(ts + ' · one measure of clicks first');
      ui.feedback('');
      ui.staff(null);
      ui.actions([{ label: 'Replay', fn: play }]);
      ui.answers(options.map(function (ev, i) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'mini-staff');
        Staff.renderMeasures(svg, { clef: 'percussion', time: ts, minWidth: 360, events: ev });
        // crop to the one-line staff and its stems/beams
        svg.setAttribute('viewBox', '0 24 ' + svg.viewBox.baseVal.width + ' 84');
        return { label: svg.outerHTML, value: i };
      }), function (v) {
        var ok = Number(v) === correct;
        ui.lockAnswers(correct, v);
        ui.feedback(ok ? 'Yes' : 'It was the highlighted one', ok ? 'good' : 'bad');
        X.settle(lesson, token, ok, again);
      }, 'rhythms');
      play();
    },
  };

  // ---------- Sight-sing in time ----------
  E.singRhythm = {
    mic: true,
    round: function (lesson) {
      var token = A.newToken();
      var k = A.pick(A.keysFor(lesson.keys));
      var clef = X.clefOf(lesson);
      var ts = pickTime(lesson);
      var bpm = lesson.bpm || 72;
      var events = R.makeRhythm(ts, lesson.measures || 2, lesson.level || 1);
      var on = R.onsets(events);
      var melody = X.placeMelody(Object.assign({}, lesson, { length: on.length, chromatic: false }), k, clef);
      // pitches onto attacks; tied continuations keep their pitch
      var p = 0;
      events.forEach(function (e, i) {
        if (e.rest) return;
        e.n = i > 0 && events[i - 1].tie ? events[i - 1].n : melody[p++];
      });
      var spq = secPerQuarter(ts, bpm);
      var again = function () { E.singRhythm.round(lesson); };
      var running = false, t0 = 0, samples = [], raf = 0, recorded = false;
      var tonic = A.placeTonic(k, clef, 0, 0);

      var draw = function (current, results) {
        var svg = document.getElementById('staff');
        svg.style.display = '';
        Staff.renderMeasures(svg, { clef: clef, fifths: T.fifths(k), time: ts, minWidth: 560, events: events.map(function (e, i) {
          var o = Object.assign({}, e, { state: i === current ? 'current' : '' });
          if (results) {
            o.result = results[i];
            if (e.n) o.label = A.sylOf(e.n, k).text;
          } else if (lesson.labels && e.n) {
            o.label = A.sylOf(e.n, k).text;
          }
          return o;
        }) });
      };

      // Sounding notes: attack + any tied continuations, as time windows.
      function notesWithWindows() {
        var out = [];
        events.forEach(function (e, i) {
          if (e.rest || (i > 0 && events[i - 1].tie)) return;
          var len = e.dur, last = i;
          while (events[last].tie && events[last + 1]) { last++; len += events[last].dur; }
          var s = t0 + e.start * spq, d = len * spq;
          // skip the first 30% (scoops and late entries), stop just short of the end
          out.push({ first: i, last: last, n: e.n, from: s + 0.3 * d, to: s + d - 0.04 });
        });
        return out;
      }

      function start() {
        if (running) return;
        running = true;
        samples = [];
        A.stopListening();
        Sound.playNote(midiOf(tonic), 0.8);
        var countFrom = Sound.now() + 1.2;
        t0 = clicks(countFrom, ts, bpm, 1);
        clicks(t0, ts, bpm, lesson.measures || 2);
        var end = t0 + totalQuarters(events) * spq;
        ui.feedback('Count in… then sing');
        A.meter.reset('Get ready…');
        var lastDraw = -2, lastRead = 0, silent = 0;
        var follow = function () {
          if (!A.alive(token)) return;
          var now = Sound.now();
          // ~40 pitch reads a second, like the main listener
          var r = now - lastRead >= 0.025 ? Sound.readPitch() : null;
          if (r) {
            silent = !r.quiet && r.level < 0.0002 ? silent + (now - lastRead) : 0;
            lastRead = now;
          }
          if (r && !r.quiet) A.meter.level(r.level);
          if (silent > 3) { A.meter.hint('No sound from the microphone.', 'warn'); A.meter.update(null, A.MIC_HELP); }
          if (r && r.hz) samples.push({ t: now, midi: Pitch.hzToMidi(r.hz) });
          if (now >= t0 && now < end) {
            var idx = eventAt(events, (now - t0) / spq);
            if (idx !== lastDraw) { draw(idx); lastDraw = idx; }
            var e = events[idx];
            if (e && e.n && r && r.hz) {
              var cents = Pitch.pitchClassDiff(Pitch.hzToMidi(r.hz), midiOf(e.n)) * 100;
              A.meter.update(cents, 'You: ' + Math.round(cents) + '¢');
              A.meter.hint(Math.abs(cents) <= A.settings.tol ? 'In tune' : cents < 0 ? 'Higher ↑' : 'Lower ↓',
                Math.abs(cents) <= A.settings.tol ? 'good' : cents < 0 ? 'up' : 'down');
            } else if (e && e.rest) {
              A.meter.update(null); A.meter.hint('Rest', 'listen');
            }
          } else if (now < t0) {
            A.meter.hint('Count in: ' + (Math.floor((t0 - now) / (60 / bpm)) + 1), 'listen');
          }
          if (now < end + 0.3) raf = requestAnimationFrame(follow);
          else finish();
        };
        raf = requestAnimationFrame(follow);
      }

      function finish() {
        running = false;
        cancelAnimationFrame(raf);
        var notes = notesWithWindows();
        var shift = null;
        var tolC = A.settings.tol * 1.5; // in-time singing gets a little more slack
        var results = {};
        var right = 0;
        notes.forEach(function (nw) {
          var inWin = samples.filter(function (s) { return s.t >= nw.from && s.t <= nw.to; }).map(function (s) { return s.midi; });
          var ok = false;
          if (inWin.length >= 2) {
            var med = Pitch.median(inWin);
            if (shift === null) shift = Math.round((med - midiOf(nw.n)) / 12) * 12;
            ok = Math.abs(med - (midiOf(nw.n) + shift)) * 100 <= tolC;
          }
          nw.count = inWin.length;
          nw.median = inWin.length ? Pitch.median(inWin) : null;
          for (var i = nw.first; i <= nw.last; i++) results[i] = ok ? 'right' : 'wrong';
          if (ok) right++;
        });
        draw(-1, results);
        E.singRhythm.lastScore = { notes: notes, shift: shift, samples: samples.length }; // for tests
        var pass = right >= Math.ceil(notes.length * 0.8);
        ui.feedback(right + ' of ' + notes.length + ' notes in tune and in time', pass ? 'good' : 'bad');
        A.meter.hint(pass ? 'Nice!' : 'Try again', pass ? 'good' : 'warn');
        if (!recorded) { recorded = true; A.record(lesson.id, pass); } // first try counts
        if (pass) A.celebrate('✓', false);
        ui.actions([
          { label: 'Try again', ghost: true, fn: function () { draw(-1); start(); } },
          { label: 'Hear it', ghost: true, fn: function () { playBack(events, ts, bpm, true); } },
          { label: 'Next →', fn: again },
        ]);
      }

      ui.prompt('Sing it in time');
      ui.sub('Key: <b>' + A.keyLabel(k) + '</b> · ' + ts + ' · ♩ = ' + bpm + (R.compound(ts) ? ' (dotted quarter)' : '') + ' · you’ll hear the tonic, then a measure of clicks');
      ui.feedback('');
      ui.answers([]);
      ui.meter(true);
      A.meter.reset('Press Start');
      draw(-1);
      ui.actions([
        { label: 'Start', fn: start },
        { label: 'Hear key', ghost: true, fn: function () { A.playCadence(k, true); } },
        { label: 'Skip', ghost: true, fn: function () { A.record(lesson.id, false); again(); } },
      ]);
      A.playCadence(k);
      E.singRhythm.current = { events: events, spq: spq, t0: function () { return t0; }, start: start };
    },
  };

  // ---------- Beams and barlines (Exercises I.2.3) ----------
  // A rhythm written with flags. Tap between two notes to beam them (and,
  // in 'both' mode, to draw a barline). Beam by the beat: eighths and
  // shorter join inside one beat, never across it.
  function beamable(e) { return !e.rest && e.dur <= 0.75; }
  function beatOf(ts, e) {
    var b = R.TIME[ts].beat === 2 ? 1 : R.TIME[ts].beat;
    return Math.floor(e.start / b + 1e-9);
  }
  function rightBeams(ts, events) {
    return events.slice(0, -1).map(function (e, i) {
      var f = events[i + 1];
      return beamable(e) && beamable(f) && beatOf(ts, e) === beatOf(ts, f) && e.measure === f.measure;
    });
  }
  function rightBars(events) {
    return events.slice(0, -1).map(function (e, i) { return events[i + 1].measure !== e.measure; });
  }
  var BEAT_WORDS = { '2/4': 'a quarter', '3/4': 'a quarter', '4/4': 'a quarter', '6/8': 'a dotted quarter (three eighths)',
    '9/8': 'a dotted quarter (three eighths)', '12/8': 'a dotted quarter (three eighths)' };

  E.beamRhythm = {
    round: function (lesson) {
      var token = A.newToken();
      var both = lesson.mode === 'both';
      var ts, events, want;
      for (var t = 0; t < 40; t++) {
        ts = A.pick(lesson.time);
        events = R.makeRhythm(ts, lesson.measures || 1, lesson.level || 3);
        want = rightBeams(ts, events);
        if (want.filter(Boolean).length >= 2) break;
      }
      var wantBars = rightBars(events);
      var links = want.map(function () { return false; });
      var bars = both ? wantBars.map(function () { return false; }) : null;
      var tool = 'beam', done = false, result = null;
      var svg = document.getElementById('staff');
      var xs = [];
      var again = function () { E.beamRhythm.round(lesson); };

      function draw() {
        var showLinks = result ? want : links, showBars = result && both ? wantBars : bars;
        svg.style.display = '';
        xs = Staff.renderMeasures(svg, { clef: 'percussion', time: ts, minWidth: 560, links: showLinks, bars: showBars,
          events: events.map(function (e, i) {
            var bad = result && ((i > 0 && result[i - 1]) || result[i]);
            return Object.assign({}, e, { color: bad ? 'var(--do)' : result ? 'var(--fa)' : null });
          }) });
        svg.classList.toggle('writable', !done);
        drawTools();
      }

      function drawTools() {
        var box = document.getElementById('answers');
        box.innerHTML = '';
        box.className = 'answers tools' + (done ? ' locked' : '');
        var tools = both ? [['beam', 'Beam'], ['bar', 'Barline']] : [];
        tools.forEach(function (tt) {
          var b = document.createElement('button');
          b.className = 'ans-btn tool voice-pick' + (tool === tt[0] ? ' on' : '');
          b.innerHTML = '<span class="ans-main">' + tt[1] + '</span>';
          b.onclick = function () { if (!done) { tool = tt[0]; drawTools(); } };
          box.appendChild(b);
        });
        var clr = document.createElement('button');
        clr.className = 'ans-btn tool';
        clr.innerHTML = '<span class="ans-main">Clear</span>';
        clr.onclick = function () {
          if (done) return;
          links = links.map(function () { return false; });
          if (bars) bars = bars.map(function () { return false; });
          draw();
        };
        box.appendChild(clr);
      }

      // the gap nearest a tap, between event i and i + 1
      function gapAt(ev) {
        var rect = svg.getBoundingClientRect();
        var vb = svg.viewBox.baseVal;
        var x = (ev.clientX - rect.left) * (vb.width / rect.width);
        var best = -1, dist = Infinity;
        for (var i = 0; i < xs.length - 1; i++) {
          var d = Math.abs(x - (xs[i] + xs[i + 1]) / 2);
          if (d < dist) { dist = d; best = i; }
        }
        return best;
      }

      function toggle(i) {
        if (done || i < 0) return;
        if (tool === 'bar') { bars[i] = !bars[i]; draw(); return; }
        if (!beamable(events[i]) || !beamable(events[i + 1])) {
          ui.feedback('Only eighth notes and shorter get beams');
          return;
        }
        ui.feedback('');
        links[i] = !links[i];
        draw();
      }

      function check() {
        if (done) return;
        done = true;
        result = links.map(function (l, i) { return l !== want[i] || (both && bars[i] !== wantBars[i]); });
        var beamMiss = links.filter(function (l, i) { return l !== want[i]; }).length;
        var barMiss = both ? bars.filter(function (b, i) { return b !== wantBars[i]; }).length : 0;
        var ok = !beamMiss && !barMiss;
        draw();
        var why = 'In ' + ts + ' the beat is ' + BEAT_WORDS[ts] + ': beam the eighths and sixteenths inside each beat, and break the beam between beats.';
        var parts = [];
        if (beamMiss) parts.push(beamMiss + ' beam' + (beamMiss > 1 ? 's' : '') + ' wrong');
        if (barMiss) parts.push(barMiss + ' barline' + (barMiss > 1 ? 's' : '') + ' wrong (each measure of ' + ts + ' holds ' + R.TIME[ts].top + ' ' + (R.TIME[ts].bottom === 8 ? 'eighths' : R.TIME[ts].bottom === 2 ? 'halves' : 'quarters') + ')');
        ui.feedback(ok ? '<b>Correct.</b> ' + why : '<b>Not quite:</b> ' + parts.join(', ') + '. This is the right version. ' + why, ok ? 'good' : 'bad');
        A.record(lesson.id, ok);
        if (ok) A.celebrate('✓', false);
        else X.review(lesson.learn);
        ui.actions([{ label: 'Next →', fn: again }]);
      }

      svg.onpointerdown = function (ev) { ev.preventDefault(); toggle(gapAt(ev)); };
      ui.prompt(both ? 'Add the beams and barlines' : 'Add the beams');
      ui.sub('Meter: <b>' + ts + '</b> · tap between two notes' + (both ? ' (choose Beam or Barline first)' : ' to beam them') + ' · tap again to undo');
      ui.feedback('');
      ui.staff2(null);
      ui.actions([{ label: 'Check', fn: check }]);
      draw();
      E.beamRhythm.current = { want: want, wantBars: wantBars, toggle: toggle, setTool: function (t2) { tool = t2; }, check: check }; // for tests
    },
  };
})();
