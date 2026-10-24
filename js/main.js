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
    exploreScale: 'Explore', earScale: 'Ear', readScale: 'Read', modeFinal: 'Read', singScale: 'Sing', invertInterval: 'Read',
    earModulation: 'Ear', sightSingMod: 'Sing',
    tapRhythm: 'Rhythm', earRhythm: 'Ear', singRhythm: 'Sing',
    melodicDictation: 'Dictation', twoPart: 'Sing', rootMotion: 'Read',
    figuredBass: 'Read', buildChord: 'Read', readSymbol: 'Read', numeralKey: 'Read', sevenApproach: 'Read', readCadence: 'Read',
    earPhrase: 'Ear', readPeriod: 'Read', earPeriod: 'Ear', singConsequent: 'Sing', cpError: 'Read',
    spotError: 'Read', singVoice: 'Sing', readNCT: 'Read', earNCT: 'Ear', singNCT: 'Sing', learn: 'Learn',
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
    $('learn').hidden = true;
    $('home-btn').hidden = true;
    renderHome();
  }

  function openLesson(unit, lesson) {
    if (lesson.engine === 'learn') {
      A.markSeen(lesson.id);
      openLearn(lesson.page, null);
      return;
    }
    current = lesson;
    $('home').hidden = true;
    $('lesson').hidden = false;
    $('learn').hidden = true;
    $('home-btn').hidden = false;
    $('lesson-unit').textContent = unit.title;
    $('lesson-title').textContent = lesson.title;
    var ref = lesson.learn && Learn.find(lesson.learn);
    $('lesson-learn').hidden = !ref;
    if (ref) {
      $('lesson-learn').textContent = 'Read: ' + (ref.section || ref.page).title + ' \u2192';
      $('lesson-learn').dataset.learn = lesson.learn;
    }
    A.ui.clear();
    A.ui.staff({ clef: (lesson.clefs || ['treble'])[0], notes: [] });
    A.renderDots(lesson.id);
    $('dots').hidden = lesson.engine === 'explore';
    window.scrollTo(0, 0);
    var engine = Exercises.engines[lesson.engine];
    if (engine.mic) A.withMic(function () { if (current === lesson) engine.round(lesson); }, showHome);
    else engine.round(lesson);
  }

  // 'Murray III.1 Four-Voice Chorale Style, pp. 21–23' for a unit's lessons.
  function bookLine(u) {
    if (!u.murray) return '';
    return u.murray.map(function (ref) {
      var m = Curriculum.MURRAY[ref];
      return '<span class="book-ref"><b>Murray ' + ref + '</b> ' + m[0] + ' · pp. ' + m[1] + '</span>';
    }).join('');
  }

  // A lesson card's book note: its workbook set, or the text for a Learn card.
  function lessonBook(u, l) {
    if (l.ex) return 'Exercises ' + l.ex;
    if (l.engine === 'learn' && u.murray) return 'Text pp. ' + Curriculum.MURRAY[u.murray[0]][1];
    return '';
  }

  function renderHome() {
    var up = nextUp();
    $('continue-title').textContent = up.lesson.title;
    $('continue-meta').textContent = up.unit.title + ' · ' + ENGINE_LABEL[up.lesson.engine];
    $('continue-btn').onclick = function () { openLesson(up.unit, up.lesson); };

    var box = $('units');
    box.innerHTML = '';
    var section = null;
    UNITS.forEach(function (u, ui) {
      if (u.section && u.section !== section) {
        section = u.section;
        var h = document.createElement('h2');
        h.className = 'section-head';
        h.textContent = section;
        box.appendChild(h);
      }
      var mastered = u.lessons.filter(function (l) { return A.lessonScore(l.id).mastered; }).length;
      var sec = document.createElement('section');
      sec.className = 'unit';
      sec.style.setProperty('--c', A.DEG_COLORS[ui % 7]);
      sec.innerHTML = '<div class="unit-head"><div><div class="eyebrow">Unit ' + (ui + 1) + '</div>' +
        '<h3>' + u.title + '</h3><p>' + u.blurb + '</p>' + (u.murray ? '<p class="book-line">' + bookLine(u) + '</p>' : '') + '</div>' +
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
          (lessonBook(u, l) ? '<span class="lesson-book">' + lessonBook(u, l) + '</span>' : '') +
          '<span class="bar"><i style="width:' + Math.min(100, pct) + '%"></i></span>';
        b.onclick = function () { openLesson(u, l); };
        grid.appendChild(b);
      });
      sec.appendChild(grid);
      box.appendChild(sec);
    });
  }

  // ---------- Learn pages ----------
  // ref: 'page' or 'page#section'. from: the exercise to go back to.
  var learnPage = null, learnFrom = null;
  function openLearn(ref, from) {
    var found = Learn.find(ref);
    if (!found) return;
    // a link to another part of the page that's open just scrolls there
    if (!$('learn').hidden && learnPage === found.page.id) {
      LearnView.scrollTo($('learn-body'), found.section && found.section.id);
      return;
    }
    learnPage = found.page.id;
    learnFrom = from;
    A.newToken();
    A.stopListening();
    current = null;
    $('home').hidden = true;
    $('lesson').hidden = true;
    $('learn').hidden = false;
    $('home-btn').hidden = false;
    $('learn-book').textContent = found.page.book;
    $('learn-title').textContent = found.page.title;
    var back = $('learn-back');
    back.hidden = !from;
    if (from) {
      back.textContent = '\u2190 Back to \u201C' + from.lesson.title + '\u201D';
      back.onclick = function () { openLesson(from.unit, from.lesson); };
    }
    var practice = allLessons().filter(function (x) {
      return x.lesson.learn && x.lesson.learn.split('#')[0] === found.page.id;
    }).map(function (x) {
      return { tag: ENGINE_LABEL[x.lesson.engine], title: x.lesson.title, onclick: function () { openLesson(x.unit, x.lesson); } };
    });
    LearnView.render($('learn-body'), found.page, practice);
    LearnView.scrollTo($('learn-body'), found.section && found.section.id);
  }

  // Any element with data-learn="page#section" opens that page, with a way
  // back to the exercise it came from.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-learn]');
    if (!a) return;
    e.preventDefault();
    var from = null;
    if (current) allLessons().forEach(function (x) { if (x.lesson === current) from = x; });
    else if (!$('learn').hidden) from = learnFrom; // reading on: keep the way back
    openLearn(a.dataset.learn, from);
  });

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
  }, learn: function (ref) { openLearn(ref, null); } };
})();
