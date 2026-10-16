// Navigation, the course map, settings and the dev panel.
(function () {
  'use strict';

  var A = App;
  var $ = A.$;
  var UNITS = Curriculum.UNITS;
  var current = null; // open lesson

  var ENGINE_LABEL = {
    explore: 'Explore', readSyllable: 'Read', readLetter: 'Read', keySig: 'Read',
    earSyllable: 'Ear', earInterval: 'Ear', readInterval: 'Read',
    sing: 'Sing', singInterval: 'Sing', echo: 'Sing', sightSing: 'Sing',
    earChord: 'Ear', readChord: 'Read', readNumeral: 'Read', singChord: 'Sing', earCadence: 'Ear', dictation: 'Dictation',
  };

  function allLessons() {
    var out = [];
    UNITS.forEach(function (u) { u.lessons.forEach(function (l) { out.push({ unit: u, lesson: l }); }); });
    return out;
  }

  function nextUp() {
    var list = allLessons();
    for (var i = 0; i < list.length; i++) if (!A.lessonScore(list[i].lesson.id).mastered) return list[i];
    return list[list.length - 1];
  }

  // ---------- Screens ----------
  function showHome() {
    A.newToken();
    A.stopListening();
    current = null;
    $('home').hidden = false;
    $('lesson').hidden = true;
    $('home-btn').hidden = true;
    renderHome();
  }

  function openLesson(unit, lesson) {
    current = lesson;
    $('home').hidden = true;
    $('lesson').hidden = false;
    $('home-btn').hidden = false;
    $('lesson-unit').textContent = unit.title;
    $('lesson-title').textContent = lesson.title;
    A.ui.clear();
    A.ui.staff({ clef: (lesson.clefs || ['treble'])[0], notes: [] });
    A.renderDots(lesson.id);
    $('dots').hidden = lesson.engine === 'explore';
    window.scrollTo(0, 0);
    var engine = Exercises.engines[lesson.engine];
    if (engine.mic) A.withMic(function () { if (current === lesson) engine.round(lesson); }, showHome);
    else engine.round(lesson);
  }

  function renderHome() {
    var up = nextUp();
    $('continue-title').textContent = up.lesson.title;
    $('continue-meta').textContent = up.unit.title + ' · ' + ENGINE_LABEL[up.lesson.engine];
    $('continue-btn').onclick = function () { openLesson(up.unit, up.lesson); };

    var box = $('units');
    box.innerHTML = '';
    UNITS.forEach(function (u, ui) {
      var mastered = u.lessons.filter(function (l) { return A.lessonScore(l.id).mastered; }).length;
      var sec = document.createElement('section');
      sec.className = 'unit';
      sec.style.setProperty('--c', A.DEG_COLORS[ui % 7]);
      sec.innerHTML = '<div class="unit-head"><div><div class="eyebrow">Unit ' + (ui + 1) + '</div>' +
        '<h3>' + u.title + '</h3><p>' + u.blurb + '</p></div>' +
        '<div class="unit-count">' + mastered + '/' + u.lessons.length + '</div></div>';
      var grid = document.createElement('div');
      grid.className = 'lesson-grid';
      u.lessons.forEach(function (l) {
        var s = A.lessonScore(l.id);
        var b = document.createElement('button');
        b.className = 'lesson-card' + (s.mastered ? ' mastered' : '') + (l === up.lesson ? ' next' : '');
        var pct = l.engine === 'explore' ? (s.mastered ? 100 : 0) : Math.round((s.right / 8) * 100);
        b.innerHTML = '<span class="tag">' + ENGINE_LABEL[l.engine] + '</span>' +
          '<span class="lesson-name">' + l.title + '</span>' +
          '<span class="bar"><i style="width:' + Math.min(100, pct) + '%"></i></span>';
        b.onclick = function () { openLesson(u, l); };
        grid.appendChild(b);
      });
      sec.appendChild(grid);
      box.appendChild(sec);
    });
  }

  // ---------- Settings ----------
  function openSettings() {
    $('set-minor').value = A.settings.minor;
    $('set-tol').value = String(A.settings.tol);
    $('set-cadence').checked = A.settings.cadence;
    $('settings').hidden = false;
  }

  $('set-minor').onchange = function () { A.settings.minor = this.value; A.saveSettings(); };
  $('set-tol').onchange = function () { A.settings.tol = Number(this.value); A.saveSettings(); A.meter.setTolerance(A.settings.tol); };
  $('set-cadence').onchange = function () { A.settings.cadence = this.checked; A.saveSettings(); };
  $('set-close').onclick = function () {
    $('settings').hidden = true;
    // Re-run the current question so a changed minor convention shows up.
    if (current && !Exercises.engines[current.engine].mic) Exercises.engines[current.engine].round(current);
    if (!current) renderHome();
  };
  $('set-reset').onclick = function () {
    if (this.dataset.armed) {
      A.resetProgress();
      this.textContent = 'Progress reset';
      delete this.dataset.armed;
      renderHome();
    } else {
      this.dataset.armed = '1';
      this.textContent = 'Tap again to confirm';
    }
  };

  // ---------- Dev panel (?dev): a test tone stands in for the mic ----------
  var DEV = /[?&]dev\b/.test(location.search);
  function setupDev() {
    if (!DEV) return;
    $('dev-panel').hidden = false;
    var slider = $('dev-hz');
    function set(hz) {
      hz = Number(hz);
      slider.value = hz;
      $('dev-hz-val').textContent = hz > 0 ? hz.toFixed(1) + ' Hz' : 'off';
      Sound.startDevTone(hz);
    }
    function setMidi(m) { if (m != null) set(Pitch.midiToHz(m)); }
    slider.oninput = function () { set(slider.value); };
    $('dev-target').onclick = function () { setMidi(A.currentTarget()); };
    $('dev-target-8vb').onclick = function () { var m = A.currentTarget(); if (m != null) setMidi(m - 12); };
    $('dev-off').onclick = function () { set(0); };
    window.__dev = { set: set, setMidi: setMidi };
  }

  // ---------- Wiring ----------
  $('start-btn').onclick = function () {
    Sound.context();
    $('start').hidden = true;
    if (DEV) Sound.startDevTone(0);
  };
  $('home-btn').onclick = showHome;
  $('settings-btn').onclick = openSettings;
  $('star-count').textContent = A.stars();

  setupDev();
  renderHome();
  window.__app = { open: function (id) {
    allLessons().forEach(function (x) { if (x.lesson.id === id) openLesson(x.unit, x.lesson); });
  } };
})();
