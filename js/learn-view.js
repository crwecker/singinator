// Draws a learn page (from Learn.PAGES) into the learn screen: sections
// with their own anchors, and four-part examples you can hear.
(function (root) {
  'use strict';

  var A = App;
  var T = Theory;
  var H = Harmony;
  var X = Exercises.helpers;

  var MARK = 'var(--do)';
  var NCT_MARK = 'var(--sol)';
  var INK = '#3b3355';
  var NS = 'http://www.w3.org/2000/svg';

  function keyOf(spec) { return A.keysFor({ list: [spec] })[0]; }

  // What the small word beside each note shows: 'member' (R, 3, 5, 7),
  // 'syl' (solfège) or 'none'. Remembered per browser.
  var TAG_MODES = [['member', 'Chord members'], ['syl', 'Solfège'], ['none', 'None']];
  var tagMode = 'member';
  try { tagMode = localStorage.getItem('learnTags') || 'member'; } catch (e) { /* storage blocked */ }
  var redraws = [];

  var MEMBER = ['R', '3', '5', '7'];
  var NCT_TAG = { PT: 'p', NT: 'n', ANT: 'ant', APP: 'app', ET: 'e', SUS: 's', RET: 'ret' };

  // n's chord member in chord c; with no chord, count letters up from the
  // bass (the hand-built examples without chords are root-position stacks).
  function member(n, c, bass) {
    if (c) {
      var i = c.tones.map(T.pc).indexOf(T.pc(n));
      return i < 0 ? '' : MEMBER[i];
    }
    var d = ((n.l - bass.l) % 7 + 7) % 7;
    return d % 2 ? '' : MEMBER[d / 2];
  }

  function tagFor(n, c, bass, k) {
    if (tagMode === 'syl') return A.sylOf(n, k).text;
    if (tagMode === 'member') return member(n, c, bass);
    return '';
  }

  // A plain-words line for a chord symbol: what the numeral, case, sign and
  // figure say, and which notes that makes.
  var DEGREE_NAMES = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant', 'leading tone'];
  var POSITIONS = ['root position (root in the bass)', 'first inversion (third in the bass)',
    'second inversion (fifth in the bass)', 'third inversion (seventh in the bass)'];
  function describe(k, c) {
    var q = T.CHORDS[c.type];
    var kind = q.name + (c.tones.length > 3 ? ' chord' : ' triad');
    var rootSyl = A.sylOf(c.root, k).text.toLowerCase();
    var name = DEGREE_NAMES[c.deg];
    if (c.deg === 6 && T.pc(c.root) !== T.pc(T.transpose(k.tonic, 'm2', false))) name = 'subtonic';
    var on = c.secondary ? 'on ' + rootSyl + ' (a secondary chord, borrowed from another key)'
      : 'on ' + rootSyl + ', the ' + name + ' (scale degree ' + (c.deg + 1) + ')';
    var notes = c.tones.map(function (t) { return A.sylOf(t, k).text.toLowerCase(); }).join('–') +
      ' (' + c.tones.map(function (t) { return T.name(t); }).join('–') + ')';
    return '<b>' + c.label + '</b>: ' + kind + ' ' + on + ', ' + POSITIONS[c.inv] + '. Notes: ' + notes + '.';
  }

  function legend(box, k, chords) {
    box.innerHTML = '';
    var seen = {};
    chords.forEach(function (c) {
      if (!c || seen[c.label]) return;
      seen[c.label] = 1;
      var li = document.createElement('li');
      li.innerHTML = describe(k, c);
      box.appendChild(li);
    });
    box.hidden = !box.children.length;
  }

  // An example spec becomes { k, voices, labels, line?, color? }.
  //   { key: 'C', chords: ['I', 'V', 'I'] }                voiced by the app
  //   { key: 'C', voices: [['C3', 'G3', 'E4', 'C5'], ...], labels, mark: [[chord, voice], ...] }
  //   { key: 'C', nct: 'SUS' }                             a fresh non-chord-tone example
  function build(ex) {
    var k = keyOf(ex.key || 'C');
    if (ex.nct) {
      var n = null;
      for (var i = 0; !n && i < 20; i++) n = NCT.example(k, ex.nct);
      if (!n) return null;
      return { k: k, voices: n.voices, chords: n.chords, labels: n.chords.map(function (c) { return c.label; }), line: n.line,
        lineColor: function (e) { return e.nct ? NCT_MARK : INK; } };
    }
    if (ex.voices) {
      var voices = ex.voices.map(function (v) { return v.map(T.parse); });
      var marks = ex.mark || [];
      var chords = ex.chords ? ex.chords.map(function (id) { return H.chord(k, id); }) : null;
      var labels = ex.labels || (chords ? chords.map(function (c) { return c.label; }) : []);
      return { k: k, voices: voices, chords: chords, labels: labels, color: function (vi, j) {
        return marks.some(function (m) { return m[0] === j && m[1] === vi; }) ? MARK : INK;
      } };
    }
    var chords = ex.chords.map(function (id) { return H.chord(k, id); });
    var opts = ex.end != null ? { sopranoEnd: T.pc(T.degreeNote(k, ex.end, 0, 4)) } : {};
    return { k: k, voices: H.voiceLead(k, chords, opts), chords: chords, labels: chords.map(function (c) { return c.label; }) };
  }

  function svg() {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('class', 'staff learn-staff');
    s.setAttribute('role', 'img');
    return s;
  }

  function example(ex) {
    var box = document.createElement('figure');
    box.className = 'learn-ex';
    var top = svg(), bottom = svg();
    var cap = document.createElement('figcaption');
    var chordList = document.createElement('ul');
    chordList.className = 'learn-chords';
    var row = document.createElement('div');
    row.className = 'action-row';
    box.appendChild(top);
    box.appendChild(bottom);
    box.appendChild(cap);
    box.appendChild(chordList);
    box.appendChild(row);
    var cur;
    var paint = function () {
      var chordAt = function (j) { return cur.chords ? cur.chords[j] : null; };
      X.grandStaff(cur.k, cur.voices, { labels: cur.labels, color: cur.color, line: cur.line, lineColor: cur.lineColor, svgs: [top, bottom],
        tag: function (vi, j) { return tagFor(cur.voices[j][vi], chordAt(j), cur.voices[j][0], cur.k); },
        lineTag: function (e) {
          if (tagMode === 'member' && e.nct) return NCT_TAG[ex.nct];
          var j = Math.floor(e.col / 2);
          return tagFor(e.n, chordAt(j), cur.voices[j][0], cur.k);
        } });
    };
    var draw = function () {
      cur = build(ex);
      if (!cur) { box.hidden = true; return; }
      top.setAttribute('aria-label', 'Example in ' + A.keyLabel(cur.k));
      paint();
      cap.innerHTML = (ex.caption ? ex.caption + ' · ' : '') + '<span class="muted">' + A.keyLabel(cur.k) + '</span>';
      legend(chordList, cur.k, cur.chords || []);
    };
    redraws.push(function () { if (cur) paint(); });
    var hear = document.createElement('button');
    hear.className = 'pill-btn';
    hear.textContent = 'Hear it';
    hear.onclick = function () { X.playFour(cur.voices, ex.beat || 0.9, cur.line); };
    row.appendChild(hear);
    if (ex.nct || ex.again) {
      var another = document.createElement('button');
      another.className = 'pill-btn ghost';
      another.textContent = 'Another one';
      another.onclick = draw;
      row.appendChild(another);
    }
    draw();
    return box;
  }

  // page: from Learn.PAGES; practice: [{ title, onclick }] exercises that use it.
  function render(box, page, practice) {
    box.innerHTML = '';
    redraws = [];
    closeTerm();
    box.appendChild(tagSwitch());
    var toc = document.createElement('nav');
    toc.className = 'learn-toc';
    page.sections.forEach(function (s) {
      var a = document.createElement('a');
      a.href = '#';
      a.textContent = s.title;
      a.onclick = function (e) { e.preventDefault(); scrollTo(box, s.id); };
      toc.appendChild(a);
    });
    box.appendChild(toc);
    if (page.intro) {
      var p = document.createElement('p');
      p.className = 'learn-intro';
      p.innerHTML = page.intro;
      linkTerms(p, page.id);
      box.appendChild(p);
    }
    page.sections.forEach(function (s) {
      var sec = document.createElement('section');
      sec.className = 'learn-sec';
      sec.id = 'learn-' + s.id;
      sec.innerHTML = '<h3>' + s.title + '</h3>';
      var body = document.createElement('div');
      body.innerHTML = s.html;
      linkTerms(body, page.id + '#' + s.id);
      sec.appendChild(body);
      (s.examples || []).forEach(function (ex) { sec.appendChild(example(ex)); });
      box.appendChild(sec);
    });
    if (practice && practice.length) {
      var pr = document.createElement('section');
      pr.className = 'learn-sec learn-practice';
      pr.innerHTML = '<h3>Practice</h3>';
      var grid = document.createElement('div');
      grid.className = 'lesson-grid';
      practice.forEach(function (x) {
        var b = document.createElement('button');
        b.className = 'lesson-card';
        b.innerHTML = '<span class="tag">' + x.tag + '</span><span class="lesson-name">' + x.title + '</span>';
        b.onclick = x.onclick;
        grid.appendChild(b);
      });
      pr.appendChild(grid);
      box.appendChild(pr);
    }
  }

  function tagSwitch() {
    var bar = document.createElement('div');
    bar.className = 'learn-tags';
    bar.innerHTML = '<span class="muted">Labels beside the notes:</span>';
    TAG_MODES.forEach(function (m) {
      var b = document.createElement('button');
      b.className = 'chip' + (m[0] === tagMode ? ' on' : '');
      b.textContent = m[1];
      b.onclick = function () {
        tagMode = m[0];
        try { localStorage.setItem('learnTags', tagMode); } catch (e) { /* storage blocked */ }
        Array.prototype.forEach.call(bar.querySelectorAll('.chip'), function (x) { x.classList.toggle('on', x === b); });
        redraws.forEach(function (f) { f(); });
      };
      bar.appendChild(b);
    });
    return bar;
  }

  // ---------- Terms ----------
  // Wrap the first use of each glossary term in a section in a button that
  // pops up its definition. A term isn't linked inside the section it
  // points to, and never inside a heading, a link or a table header.
  var SKIP = { A: 1, H3: 1, TH: 1, BUTTON: 1 };
  var termRes = null;
  function termList() {
    if (!termRes) {
      termRes = Object.keys(Learn.TERMS).map(function (id) {
        return { id: id, re: new RegExp('\\b(?:' + Learn.TERMS[id].match + ')\\b', 'i') };
      });
    }
    return termRes;
  }

  function linkTerms(el, here) {
    var used = {};
    var texts = [];
    var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
      for (var p = n.parentNode; p && p !== el; p = p.parentNode) if (SKIP[p.nodeName]) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    } });
    while (walk.nextNode()) texts.push(walk.currentNode);
    texts.forEach(function (node) {
      for (;;) {
        // the earliest match of a term not used yet; the longest on a tie
        var best = null;
        termList().forEach(function (t) {
          if (used[t.id] || Learn.TERMS[t.id].see === here) return;
          var m = t.re.exec(node.nodeValue);
          if (m && (!best || m.index < best.m.index || (m.index === best.m.index && m[0].length > best.m[0].length))) best = { t: t, m: m };
        });
        if (!best) return;
        used[best.t.id] = 1;
        var word = node.splitText(best.m.index);
        var rest = word.splitText(best.m[0].length);
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'term';
        b.dataset.term = best.t.id;
        b.textContent = word.nodeValue;
        b.onclick = function (e) { e.stopPropagation(); openTerm(b); };
        word.parentNode.replaceChild(b, word);
        node = rest;
      }
    });
  }

  var pop = null;
  function closeTerm() {
    if (pop) { pop.remove(); pop = null; }
  }
  function openTerm(btn) {
    var same = pop && pop.dataset.term === btn.dataset.term && pop.anchor === btn;
    closeTerm();
    if (same) return;
    var t = Learn.TERMS[btn.dataset.term];
    var found = Learn.find(t.see);
    pop = document.createElement('div');
    pop.className = 'term-pop';
    pop.dataset.term = btn.dataset.term;
    pop.anchor = btn;
    pop.setAttribute('role', 'note');
    pop.innerHTML = '<b>' + btn.textContent + '</b>: ' + t.def +
      (found ? ' <a href="#" class="learn-link" data-learn="' + t.see + '">More: ' + found.section.title + ' \u2192</a>' : '');
    // inside the block that holds the word, so it scrolls with the text
    var block = btn.closest('li, p, td, .rule') || btn.parentNode;
    block.appendChild(pop);
    pop.addEventListener('click', function (e) { if (!e.target.closest('[data-learn]')) e.stopPropagation(); });
  }
  document.addEventListener('click', function (e) { if (pop && !pop.contains(e.target)) closeTerm(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTerm(); });

  function scrollTo(box, id) {
    var el = id && box.querySelector('#learn-' + id);
    if (!el) { window.scrollTo(0, 0); return; }
    el.scrollIntoView({ block: 'start' });
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  root.LearnView = { render: render, scrollTo: scrollTo };
})(this);
