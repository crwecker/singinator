// Shared services for every exercise: settings, progress, the lesson screen,
// the pitch meter / listener, mic handling and music helpers.
(function (root) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  // ---------- Storage ----------
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem('singinator.' + k); return v == null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem('singinator.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ }
    },
  };

  var settings = Object.assign({ minor: 'do', tol: 35, cadence: true }, store.get('settings', {}));
  function saveSettings() { store.set('settings', settings); }

  // ---------- Progress ----------
  // progress[lessonId] = last 10 results (1 = right, 0 = wrong); explore
  // lessons are marked { seen: true }.
  var progress = store.get('progress', {});
  var stars = store.get('stars', 0);

  function lessonScore(id) {
    var h = progress[id];
    if (!h) return { done: 0, right: 0, mastered: false };
    if (h.seen) return { done: 10, right: 10, mastered: true };
    var right = h.reduce(function (a, b) { return a + b; }, 0);
    return { done: h.length, right: right, mastered: right >= 8 };
  }

  function record(id, ok) {
    var before = lessonScore(id).mastered;
    var h = Array.isArray(progress[id]) ? progress[id] : [];
    h.push(ok ? 1 : 0);
    if (h.length > 10) h.shift();
    progress[id] = h;
    store.set('progress', progress);
    if (ok) addStar();
    renderDots(id);
    if (!before && lessonScore(id).mastered) celebrate('Lesson mastered!', true);
  }

  function markSeen(id) {
    if (!progress[id]) { progress[id] = { seen: true }; store.set('progress', progress); }
  }

  function resetProgress() {
    progress = {}; stars = 0;
    store.set('progress', progress); store.set('stars', 0);
    $('star-count').textContent = 0;
  }

  function addStar() {
    stars++;
    store.set('stars', stars);
    var el = $('star-count');
    el.textContent = stars;
    el.parentElement.classList.remove('pop');
    void el.offsetWidth;
    el.parentElement.classList.add('pop');
  }

  function renderDots(id) {
    var box = $('dots');
    box.innerHTML = '';
    var h = Array.isArray(progress[id]) ? progress[id] : [];
    for (var i = 0; i < 10; i++) {
      var d = document.createElement('i');
      d.className = i < h.length ? (h[i] ? 'right' : 'wrong') : '';
      box.appendChild(d);
    }
  }

  // ---------- Celebration ----------
  function celebrate(message, big) {
    var box = $('celebrate');
    box.innerHTML = '';
    var msg = document.createElement('div');
    msg.className = 'celebrate-msg' + (big ? '' : ' small');
    msg.textContent = message;
    box.appendChild(msg);
    if (big) {
      var colors = ['--do', '--re', '--mi', '--fa', '--sol', '--la', '--ti'];
      for (var i = 0; i < 40; i++) {
        var c = document.createElement('i');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.background = 'var(' + colors[i % colors.length] + ')';
        c.style.animationDelay = Math.random() * 0.3 + 's';
        c.style.setProperty('--drift', (Math.random() * 200 - 100) + 'px');
        c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
        box.appendChild(c);
      }
    }
    clearTimeout(celebrate.t);
    celebrate.t = setTimeout(function () { box.innerHTML = ''; }, big ? 1800 : 900);
  }

  // ---------- Music helpers ----------
  var DEG_COLORS = ['var(--do)', 'var(--re)', 'var(--mi)', 'var(--fa)', 'var(--sol)', 'var(--la)', 'var(--ti)'];

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function sylOf(n, k) {
    var s = Theory.syllable(n, k, settings.minor);
    return { text: cap(s.syl), color: DEG_COLORS[s.deg], deg: s.deg, alt: s.alt };
  }

  function pick(arr, avoid) {
    if (arr.length === 1) return arr[0];
    var x;
    do { x = arr[Math.floor(Math.random() * arr.length)]; } while (x === avoid);
    return x;
  }

  function keysFor(spec) {
    spec = spec || { list: ['C'] };
    if (spec.list) return spec.list.map(function (t) { return Theory.key(t, spec.mode === 'minor' ? 'minor' : 'major'); });
    if (spec.mode === 'any') return Theory.allKeys('major', spec.max).concat(Theory.allKeys('minor', spec.max));
    return Theory.allKeys(spec.mode || 'major', spec.max);
  }

  function keyLabel(k) {
    return Theory.name(k.tonic) + ' ' + k.mode;
  }

  // '+7' -> { deg: 6, alt: 1 }; '8' -> { deg: 7, alt: 0 }
  function parseDegree(s) {
    var m = /^([+-]?)(\d)$/.exec(s);
    return { deg: Number(m[2]) - 1, alt: m[1] === '+' ? 1 : m[1] === '-' ? -1 : 0 };
  }

  // Tonic with an octave chosen so diatonic offsets lo..hi fit the clef,
  // as close to the middle of the staff as possible.
  function placeTonic(k, clef, lo, hi) {
    var r = Theory.clefRange(clef);
    var center = (r.lo + r.hi) / 2;
    var best = null, bestD = Infinity;
    for (var oct = 0; oct <= 8; oct++) {
      var t = Theory.note(k.tonic.l, k.tonic.acc, oct);
      var s = Theory.step(t);
      var fits = s + lo >= r.lo && s + hi <= r.hi;
      var d = Math.abs(s + (lo + hi) / 2 - center) + (fits ? 0 : 100);
      if (d < bestD) { bestD = d; best = t; }
    }
    return best;
  }

  // Note at a diatonic offset from a placed tonic, altered against the key.
  function noteAt(k, tonic, off, alt) {
    var n = Theory.fromStep(Theory.step(tonic) + off, 0);
    n.acc = Theory.sigAcc(Theory.fifths(k), n.l) + (alt || 0);
    return n;
  }

  function playCadence(k, force) {
    if (!settings.cadence && !force) return Promise.resolve();
    return playVoicings(Harmony.establishing(k), 0.7);
  }

  // Four-part voicings ([[b, t, a, s], ...] spelled) as block chords.
  function playVoicings(voices, len, onChord) {
    return Sound.playSequence(voices.map(function (v) { return v.map(Theory.midi); }), len || 0.9, onChord);
  }

  // ---------- Lesson session ----------
  // Every async step checks its token so a stale callback from a previous
  // question or lesson can't touch the screen.
  var session = { token: 0 };
  function newToken() { session.token++; return session.token; }
  function alive(token) { return token === session.token; }

  var ui = {
    prompt: function (html) { $('prompt').innerHTML = html; },
    sub: function (html) { $('sub').innerHTML = html || ''; },
    feedback: function (html, cls) {
      var f = $('feedback');
      f.innerHTML = html || '&nbsp;';
      f.className = 'feedback ' + (cls || '');
    },
    staff: function (opts) {
      var svg = $('staff');
      svg.style.display = opts ? '' : 'none';
      if (opts) Staff.render(svg, opts);
    },
    // items: [{ label, value, color, sub }]; onPick(value, button)
    answers: function (items, onPick, cls) {
      var box = $('answers');
      box.innerHTML = '';
      box.className = 'answers ' + (cls || '');
      items.forEach(function (it) {
        var b = document.createElement('button');
        b.className = 'ans-btn';
        if (it.color) { b.style.setProperty('--c', it.color); b.classList.add('colored'); }
        b.innerHTML = '<span class="ans-main">' + it.label + '</span>' + (it.sub ? '<span class="ans-sub">' + it.sub + '</span>' : '');
        b.dataset.value = it.value;
        b.onclick = function () { if (!box.classList.contains('locked')) onPick(it.value, b); };
        box.appendChild(b);
      });
    },
    lockAnswers: function (correct, picked) {
      var box = $('answers');
      box.classList.add('locked');
      Array.prototype.forEach.call(box.children, function (b) {
        if (b.dataset.value === String(correct)) b.classList.add('right');
        else if (b.dataset.value === String(picked)) b.classList.add('wrong');
      });
    },
    actions: function (list) {
      var box = $('actions');
      box.innerHTML = '';
      (list || []).forEach(function (a) {
        if (!a) return;
        var b = document.createElement('button');
        b.className = 'pill-btn' + (a.ghost ? ' ghost' : '');
        b.textContent = a.label;
        b.onclick = a.fn;
        if (a.id) b.id = a.id;
        box.appendChild(b);
      });
    },
    meter: function (show) {
      var slot = document.querySelector('#lesson .meter-slot');
      if (show && meter.root.parentNode !== slot) slot.appendChild(meter.root);
      slot.hidden = !show;
    },
    // Answer slots for dictation: [{ label, state: 'given'|'filled'|'empty'|'right'|'wrong', sub }]
    slots: function (items) {
      var box = $('slots');
      box.innerHTML = '';
      box.hidden = !items || !items.length;
      (items || []).forEach(function (it) {
        var d = document.createElement('div');
        d.className = 'slot ' + (it.state || '');
        d.innerHTML = '<span>' + (it.label || '?') + '</span>' + (it.sub ? '<small>' + it.sub + '</small>' : '');
        box.appendChild(d);
      });
    },
    clear: function () {
      this.slots([]);
      this.prompt(''); this.sub(''); this.feedback('');
      this.answers([], function () {}); this.actions([]); this.meter(false);
      stopListening();
    },
  };

  // ---------- Pitch meter ----------
  var DEBUG = /[?&]debug\b/.test(location.search);
  var MIC_HELP = 'Try a different microphone in the menu below. On a Mac, also check System Settings → ' +
    'Privacy & Security → Microphone, and that Sound → Input uses the right device.';

  var meter = (function () {
    var rootEl = $('meter-tpl').content.firstElementChild.cloneNode(true);
    var q = function (c) { return rootEl.querySelector(c); };
    var RANGE = 300; // cents shown above/below the target
    return {
      root: rootEl,
      setTolerance: function (tol) { q('.meter-zone').style.height = (tol / RANGE) * 50 + '%'; },
      setColor: function (color) { rootEl.style.setProperty('--c', color); },
      update: function (cents, sungText) {
        var ball = q('.meter-ball');
        if (cents == null) {
          ball.classList.add('idle');
        } else {
          ball.classList.remove('idle');
          var c = Math.max(-RANGE, Math.min(RANGE, cents));
          ball.style.top = (50 - (c / RANGE) * 50) + '%';
        }
        q('.meter-sung').innerHTML = sungText || '&nbsp;';
      },
      hint: function (text, cls) {
        var h = q('.meter-hint');
        h.textContent = text;
        h.className = 'meter-hint ' + (cls || '');
      },
      hold: function (frac) { q('.meter-hold-fill').style.width = Math.min(100, frac * 100) + '%'; },
      level: function (rms) {
        var pct = rms > 0 ? Math.max(0, Math.min(100, (Math.log10(rms) + 4) * 30)) : 0;
        q('.meter-level-fill').style.width = pct + '%';
      },
      debug: function (text) {
        var d = q('.meter-debug');
        d.hidden = !DEBUG;
        if (DEBUG) d.textContent = text;
      },
      reset: function (hint) { this.update(null); this.hold(0); this.hint(hint || 'Sing when you’re ready'); },
    };
  })();

  // ---------- Listening ----------
  var HOLD_MS = 600;
  var listener = null;

  // opts: { midi, mode: 'pc' (any octave) | 'abs', label, color, onMatch(sungMidi) }
  function listen(opts) {
    stopListening();
    meter.setTolerance(settings.tol);
    meter.setColor(opts.color || 'var(--sol)');
    meter.reset(opts.hint);
    listener = Object.assign({ hold: 0, diffs: [], sung: [], last: performance.now(), lastRead: 0, silentMs: 0 }, opts);
    listener.raf = requestAnimationFrame(tick);
  }

  function stopListening() {
    if (listener) cancelAnimationFrame(listener.raf);
    listener = null;
  }

  function sungName(midi) {
    var names = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
    var m = Math.round(midi);
    return names[Theory.mod(m, 12)] + (Math.floor(m / 12) - 1);
  }

  function tick(now) {
    var L = listener;
    if (!L) return;
    L.raf = requestAnimationFrame(tick);
    if (now - L.lastRead < 25) return; // ~40 reads/sec is plenty
    var dt = Math.min(250, now - L.last);
    L.last = now;
    L.lastRead = now;

    var r = Sound.readPitch();
    if (r && !r.quiet) {
      meter.level(r.level);
      // Real mics always hear some room noise; perfect silence means the
      // browser is getting an empty stream (blocked or wrong input).
      L.silentMs = r.level < 0.0002 ? L.silentMs + dt : 0;
    }
    if (DEBUG) {
      var st = Sound.status();
      meter.debug('ctx=' + st.ctx + ' ' + st.rate + 'Hz | mic=' + st.mic +
        ' | level=' + (r && r.level != null ? r.level.toFixed(5) : '-') +
        ' | hz=' + (r && r.hz ? r.hz.toFixed(1) + ' clarity=' + r.clarity.toFixed(2) : '-'));
    }

    if (L.silentMs > 3000) {
      meter.update(null, MIC_HELP);
      meter.hint('No sound from the microphone.', 'warn');
    } else if (r && r.quiet) {
      meter.hint('Listen…', 'listen');
      meter.update(null);
      L.diffs = []; L.sung = [];
    } else if (r && r.hz) {
      var midi = Pitch.hzToMidi(r.hz);
      var diff = L.mode === 'abs' ? midi - L.midi : Pitch.pitchClassDiff(midi, L.midi);
      L.diffs.push(diff); L.sung.push(midi);
      if (L.diffs.length > 7) { L.diffs.shift(); L.sung.shift(); }
      var cents = Pitch.median(L.diffs) * 100;
      meter.update(cents, 'You: ' + sungName(midi) + ' (' + (cents >= 0 ? '+' : '') + Math.round(cents) + '¢)');
      if (Math.abs(cents) <= settings.tol) {
        L.hold += dt;
        meter.hint('In tune — hold it', 'good');
      } else {
        L.hold = Math.max(0, L.hold - dt);
        meter.hint(cents < 0 ? 'Higher ↑' : 'Lower ↓', cents < 0 ? 'up' : 'down');
      }
    } else {
      meter.update(null);
      L.diffs = []; L.sung = [];
      L.hold = Math.max(0, L.hold - dt * 0.5);
      if (L.hold === 0) meter.hint(L.hint || 'Sing ' + (L.label || ''));
    }
    meter.hold(L.hold / HOLD_MS);

    if (L.hold >= HOLD_MS) {
      var sung = Pitch.median(L.sung);
      stopListening();
      meter.hint('✓ ' + (L.label || 'Got it'), 'good');
      L.onMatch(sung);
    }
  }

  function currentTarget() { return listener ? listener.midi : null; }

  // ---------- Microphone ----------
  function withMic(enter, onCancel) {
    Sound.startMic(store.get('micId', null)).then(function () {
      $('mic-help').hidden = true;
      fillMicPicker();
      enter();
    }).catch(function (err) {
      var text = $('mic-help-text');
      if (err && err.message === 'no-mic-support') {
        text.textContent = 'This browser can’t use the microphone here. Open Singinator from http://localhost or an https:// address.';
      }
      $('mic-help').hidden = false;
      $('mic-retry').onclick = function () { withMic(enter, onCancel); };
      $('mic-cancel').onclick = function () { $('mic-help').hidden = true; if (onCancel) onCancel(); };
    });
  }

  function fillMicPicker() {
    var select = meter.root.querySelector('.mic-select');
    if (!Sound.currentMicId()) { select.hidden = true; return; } // dev tone
    Sound.listMics().then(function (mics) {
      select.hidden = mics.length < 2;
      select.innerHTML = '';
      mics.forEach(function (m, i) {
        var o = document.createElement('option');
        o.value = m.deviceId;
        o.textContent = m.label || 'Microphone ' + (i + 1);
        select.appendChild(o);
      });
      select.value = Sound.currentMicId();
    });
    select.onchange = function () {
      Sound.switchMic(select.value).then(function () {
        store.set('micId', select.value);
        if (listener) listener.silentMs = 0;
      });
    };
  }

  root.App = {
    $: $, store: store, settings: settings, saveSettings: saveSettings,
    lessonScore: lessonScore, record: record, markSeen: markSeen, resetProgress: resetProgress,
    renderDots: renderDots, celebrate: celebrate, stars: function () { return stars; },
    DEG_COLORS: DEG_COLORS, cap: cap, sylOf: sylOf, pick: pick, keysFor: keysFor, keyLabel: keyLabel,
    parseDegree: parseDegree, placeTonic: placeTonic, noteAt: noteAt, playCadence: playCadence, playVoicings: playVoicings,
    session: session, newToken: newToken, alive: alive, ui: ui,
    meter: meter, listen: listen, stopListening: stopListening, currentTarget: currentTarget,
    withMic: withMic,
  };
})(this);
