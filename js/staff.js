// Draws a staff (treble, bass, alto or tenor clef) with a key signature and
// notes as inline SVG. Positions come from Theory.staffPos: 0 = bottom line.
(function (root) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var GAP = 12;               // distance between staff lines
  var TOP = 46;               // y of the top line (position 8)
  var HEIGHT = 168;
  var INK = 'staff-ink';

  function yFor(pos) { return TOP + (8 - pos) * (GAP / 2); }

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function stroke(d, w, parent) {
    return el('path', { d: d, fill: 'none', 'stroke-width': w, 'stroke-linecap': 'round', class: INK }, parent);
  }

  // ---------- Clefs ----------
  function trebleClef(g) {
    var o = TOP - 40; // path drawn for a staff whose top line is y=40
    var t = el('g', { transform: 'translate(0 ' + o + ')' }, g);
    stroke('M 37 100 L 30 24 C 29 13, 35 6, 39 12 C 45 21, 35 38, 24 52 ' +
      'C 13 66, 16 89, 32 90 C 46 91, 50 74, 38 70 C 28 67, 23 78, 32 82', 3.2, t);
    stroke('M 37 100 C 38 110, 30 113, 26 108', 3.2, t);
    el('circle', { cx: 28, cy: 106, r: 4.2, class: INK + ' fill' }, t);
  }

  function bassClef(g) {
    var y = yFor(6); // F line
    el('circle', { cx: 20, cy: y, r: 5, class: INK + ' fill' }, g);
    stroke('M 17 ' + (y - 2) + ' C 18 ' + (y - 14) + ', 42 ' + (y - 17) + ', 44 ' + (y + 1) +
      ' C 46 ' + (y + 19) + ', 30 ' + (y + 34) + ', 14 ' + (y + 44), 3.6, g);
    el('circle', { cx: 53, cy: y - 6, r: 2.6, class: INK + ' fill' }, g);
    el('circle', { cx: 53, cy: y + 6, r: 2.6, class: INK + ' fill' }, g);
  }

  function cClef(g, pos) {
    var c = yFor(pos);
    var top = c - 24, bot = c + 24;
    el('rect', { x: 12, y: top, width: 6, height: 48, class: INK + ' fill' }, g);
    el('rect', { x: 22, y: top, width: 2.2, height: 48, class: INK + ' fill' }, g);
    // Two mirrored lobes meeting at the clef's line.
    stroke('M 24 ' + c + ' L 29 ' + (c - 7) + ' C 32 ' + (c - 2) + ', 46 ' + (c - 4) + ', 44 ' + (c - 15) +
      ' C 43 ' + (c - 24) + ', 30 ' + (c - 25) + ', 31 ' + (c - 17), 3.2, g);
    stroke('M 24 ' + c + ' L 29 ' + (c + 7) + ' C 32 ' + (c + 2) + ', 46 ' + (c + 4) + ', 44 ' + (c + 15) +
      ' C 43 ' + (c + 24) + ', 30 ' + (c + 25) + ', 31 ' + (c + 17), 3.2, g);
    el('circle', { cx: 33, cy: c - 17, r: 3.4, class: INK + ' fill' }, g);
    el('circle', { cx: 33, cy: c + 17, r: 3.4, class: INK + ' fill' }, g);
    void bot;
  }

  function drawClef(svg, clef) {
    var g = el('g', { class: 'clef' }, svg);
    if (clef === 'bass') bassClef(g);
    else if (clef === 'alto') cClef(g, 4);
    else if (clef === 'tenor') cClef(g, 6);
    else trebleClef(g);
  }

  // ---------- Accidentals ----------
  function accidental(parent, acc, x, y, cls) {
    var g = el('g', { class: 'acc ' + (cls || '') }, parent);
    var line = function (x1, y1, x2, y2, w) {
      el('line', { x1: x1, y1: y1, x2: x2, y2: y2, 'stroke-width': w, class: INK, 'stroke-linecap': 'butt' }, g);
    };
    if (acc === 1) {
      line(x - 2.4, y - 10, x - 2.4, y + 11, 1.4);
      line(x + 2.4, y - 11, x + 2.4, y + 10, 1.4);
      line(x - 5.5, y - 2, x + 5.5, y - 5, 3);
      line(x - 5.5, y + 5, x + 5.5, y + 2, 3);
    } else if (acc === -1) {
      line(x - 3, y - 15, x - 3, y + 5, 1.5);
      stroke('M ' + (x - 3) + ' ' + (y + 5) + ' C ' + (x + 6) + ' ' + (y + 1) + ', ' + (x + 6) + ' ' + (y - 7) +
        ', ' + (x - 3) + ' ' + (y - 1), 2.1, g);
    } else if (acc === 0) {
      line(x - 3, y - 12, x - 3, y + 5, 1.4);
      line(x + 3, y - 5, x + 3, y + 12, 1.4);
      line(x - 3, y - 2, x + 3, y - 4, 3);
      line(x - 3, y + 4, x + 3, y + 2, 3);
    } else if (acc === 2) {
      line(x - 4, y - 4, x + 4, y + 4, 2.6);
      line(x - 4, y + 4, x + 4, y - 4, 2.6);
    } else if (acc === -2) {
      accidental(g, -1, x - 4, y);
      accidental(g, -1, x + 4, y);
    }
    return g;
  }

  function keySignature(svg, clef, fifths, x0) {
    var count = Math.abs(fifths);
    var table = Theory.SIG_POS[clef][fifths > 0 ? 'sharp' : 'flat'];
    for (var i = 0; i < count; i++) {
      accidental(svg, fifths > 0 ? 1 : -1, x0 + i * 11, yFor(table[i]), 'sig');
    }
    return count * 11;
  }

  // ---------- Notes ----------
  var HEAD_W = 16.4; // a note head's width: seconds in a chord shift by this

  // One column: a single note or a chord sharing a stem. items carry
  // { pos, show (accidental to draw or null), color, state, label }.
  function drawColumn(svg, items, x) {
    items = items.slice().sort(function (a, b) { return a.pos - b.pos; });
    var lo = items[0].pos, hi = items[items.length - 1].pos;
    var stemUp = (lo + hi) / 2 < 4;
    var color = items[0].color || '#3b3355';
    var state = items.every(function (it) { return it.state === items[0].state; }) ? items[0].state : '';
    var g = el('g', { class: 'note ' + (state || '') }, svg);

    // Seconds can't share a side of the stem: walk from the end the stem
    // starts at and push every other note of a cluster across it.
    var order = stemUp ? items : items.slice().reverse();
    var shifted = false;
    order.forEach(function (it, i) {
      var prev = order[i - 1];
      shifted = !!prev && Math.abs(it.pos - prev.pos) === 1 && !shifted;
      it.dx = shifted ? (stemUp ? HEAD_W : -HEAD_W) : 0;
    });
    var anyRight = items.some(function (it) { return it.dx > 0; });
    var anyLeft = items.some(function (it) { return it.dx < 0; });

    // Ledger lines wide enough for displaced heads.
    var lx1 = x - 14 + (anyLeft ? -HEAD_W : 0), lx2 = x + 14 + (anyRight ? HEAD_W : 0);
    for (var p = -2; p >= lo; p -= 2) el('line', { x1: lx1, x2: lx2, y1: yFor(p), y2: yFor(p), class: 'staff-line' }, g);
    for (p = 10; p <= hi; p += 2) el('line', { x1: lx1, x2: lx2, y1: yFor(p), y2: yFor(p), class: 'staff-line' }, g);

    // One halo for a single note; chords get none (rings would pile up).
    if (items.length === 1 && items[0].state === 'current') {
      el('circle', { cx: x, cy: yFor(items[0].pos), r: 17, class: 'note-halo' }, g);
    }

    // Accidentals, top down, each in the first slot far enough from the
    // ones already placed (about a 6th apart can share a slot).
    var slots = [];
    var accLeft = x - 20 + (anyLeft ? -HEAD_W : 0);
    items.slice().reverse().forEach(function (it) {
      if (it.show == null) return;
      var s = 0;
      while ((slots[s] || []).some(function (q) { return Math.abs(q - it.pos) < 6; })) s++;
      (slots[s] = slots[s] || []).push(it.pos);
      accidental(g, it.show, accLeft - s * 11, yFor(it.pos), 'note-acc');
    });

    if (!items[0].noStem) {
      var sx = stemUp ? x + 7.2 : x - 7.2;
      var y1 = yFor(stemUp ? lo : hi), y2 = stemUp ? yFor(hi) - 38 : yFor(lo) + 38;
      el('line', { x1: sx, x2: sx, y1: y1, y2: y2, class: 'stem', stroke: color }, g);
    }
    items.forEach(function (it) {
      var hx = x + it.dx, y = yFor(it.pos);
      var c = it.color || '#3b3355';
      el('ellipse', it.open ? {
        cx: hx, cy: y, rx: 8.4, ry: 5.6, transform: 'rotate(-20 ' + hx + ' ' + y + ')',
        fill: 'var(--staff-bg)', stroke: c, 'stroke-width': 2.6, class: 'note-head',
      } : {
        cx: hx, cy: y, rx: 8.2, ry: 5.8, transform: 'rotate(-20 ' + hx + ' ' + y + ')',
        fill: c, class: 'note-head',
      }, g);
    });

    // Tags: a small word to the right of each head (chord member, syllable).
    // Two tags a step apart would overlap, so they spread up and down.
    var tagX = x + (anyRight ? HEAD_W : 0) + 13;
    var last = null;
    items.forEach(function (it) {
      if (!it.tag) return;
      var y = yFor(it.pos) + 4;
      var t = el('text', { x: tagX, y: y, class: 'note-tag', fill: it.color || '#3b3355' }, g);
      t.textContent = it.tag;
      if (last && it.pos - last.pos < 2) {
        last.t.setAttribute('y', last.y + 3);
        t.setAttribute('y', y - 3);
        last = null;
      } else last = { t: t, y: y, pos: it.pos };
    });

    var labels = items.filter(function (it) { return it.label; });
    labels.reverse().forEach(function (it, i) {
      var t = el('text', { x: x, y: HEIGHT - 8 - (labels.length - 1 - i) * 16, 'text-anchor': 'middle', class: 'note-label', fill: it.color || '#3b3355' }, g);
      t.textContent = it.label;
    });
  }

  // opts: { clef, fifths, notes: [{ n, color, state, label, col, tag, hidden,
  //   labelOnly }], width, minWidth }
  // Notes sharing a col are drawn as a chord (harmonic interval).
  function render(svg, opts) {
    var clef = opts.clef || 'treble';
    var fifths = opts.fifths || 0;
    var notes = opts.notes || [];
    var cols = 0;
    notes.forEach(function (it, i) { if (it.col == null) it.col = i; cols = Math.max(cols, it.col + 1); });

    var sigW = Math.abs(fifths) * 11;
    var startX = 72 + sigW + 26;
    var minW = 58; // tightest note spacing; few notes get spread wider
    var width = Math.max(opts.minWidth || 480, startX + Math.max(0, cols - 1) * minW + 60);
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + HEIGHT);
    svg.innerHTML = '';
    el('rect', { x: 0, y: 0, width: width, height: HEIGHT, class: 'staff-bg' }, svg);
    for (var i = 0; i < 5; i++) {
      el('line', { x1: 8, x2: width - 8, y1: TOP + i * GAP, y2: TOP + i * GAP, class: 'staff-line' }, svg);
    }
    drawClef(svg, clef);
    keySignature(svg, clef, fifths, 70);

    // Accidentals carry through the "measure", like real notation.
    var inForce = {};
    var span = width - startX - 50;
    var colW = cols > 1 ? Math.min(110, span / (cols - 1)) : 0;
    var x0 = cols > 1 ? startX + (span - colW * (cols - 1)) / 2 : startX;
    var byCol = [];
    var labelOnly = [];
    notes.forEach(function (it) {
      if (it.labelOnly) { labelOnly.push(it); return; } // a label under an empty column
      if (it.hidden) return; // placeholder: keeps its column, draws nothing
      var n = it.n;
      var keyAcc = Theory.sigAcc(fifths, n.l);
      var k = n.l + ':' + n.oct;
      var current = k in inForce ? inForce[k] : keyAcc;
      var show = n.acc !== current || it.forceAcc ? n.acc : null;
      inForce[k] = n.acc;
      (byCol[it.col] = byCol[it.col] || []).push(Object.assign({}, it, { pos: Theory.staffPos(n, clef), show: show }));
    });
    var colX = function (c) { return cols === 1 ? startX + span / 2 : x0 + c * colW; };
    byCol.forEach(function (items, c) {
      if (!items) return;
      drawColumn(svg, items, colX(c));
    });
    labelOnly.forEach(function (it) {
      var t = el('text', { x: colX(it.col), y: HEIGHT - 8, 'text-anchor': 'middle', class: 'note-label', fill: it.color || '#3b3355' }, svg);
      t.textContent = it.label;
    });
    // A tie runs from a note to the same note in the next column that has one.
    byCol.forEach(function (items, c) {
      (items || []).forEach(function (it) {
        if (!it.tie) return;
        var next = c + 1;
        while (next < byCol.length && !byCol[next]) next++;
        if (next >= byCol.length) return;
        // the top note of a chord ties above, others below
        var top = items.every(function (o) { return o.pos <= it.pos; }) && (items.length > 1 || it.pos >= 4);
        var y = yFor(it.pos) + (top ? -9 : 9);
        var bend = top ? -8 : 8;
        var xa = colX(c) + 9, xb = colX(next) - 9;
        stroke('M ' + xa + ' ' + y + ' Q ' + (xa + xb) / 2 + ' ' + (y + bend) + ' ' + xb + ' ' + y, 2, svg);
      });
    });
  }

  // ---------- Rhythmic notation ----------
  // Base value and dot for a duration in quarters (1.5 = dotted quarter).
  function glyphOf(dur) {
    var dotted = [3, 1.5, 0.75].indexOf(dur) >= 0;
    return { base: dotted ? dur / 1.5 : dur, dot: dotted };
  }

  function restGlyph(g, base, x, dotted) {
    var y = yFor(4);
    if (base >= 4) el('rect', { x: x - 7, y: yFor(6), width: 14, height: 6, class: INK + ' fill' }, g);
    else if (base >= 2) el('rect', { x: x - 7, y: y - 6, width: 14, height: 6, class: INK + ' fill' }, g);
    else if (base >= 1) {
      stroke('M ' + (x - 3) + ' ' + (y - 15) + ' L ' + (x + 4) + ' ' + (y - 7) + ' L ' + (x - 2) + ' ' + (y) +
        ' L ' + (x + 4) + ' ' + (y + 6) + ' C ' + (x - 4) + ' ' + (y + 2) + ', ' + (x - 5) + ' ' + (y + 10) + ', ' + x + ' ' + (y + 13), 2.6, g);
    } else {
      var hooks = base >= 0.5 ? 1 : 2;
      el('line', { x1: x + 4, y1: y - 8, x2: x - 2, y2: y + 12, 'stroke-width': 1.8, class: INK }, g);
      for (var i = 0; i < hooks; i++) el('circle', { cx: x - 2 - i * 2, cy: y - 5 + i * 8, r: 2.8, class: INK + ' fill' }, g);
    }
    if (dotted) el('circle', { cx: x + 11, cy: y - 3, r: 2.3, class: INK + ' fill' }, g);
  }

  // Returns the x of each event (for hit-testing).
  // opts: { clef ('percussion' for a one-line rhythm staff), fifths, links,
  //   bars (see the beam and barline comments below),
  //   time: '3/4', events: [{ n (null for rests / percussion), dur, rest,
  //   tie, state, result: 'right'|'wrong', label, color }], minWidth }
  function renderMeasures(svg, opts) {
    var clef = opts.clef || 'treble';
    var perc = clef === 'percussion';
    var fifths = perc ? 0 : opts.fifths || 0;
    var time = Rhythm.TIME[opts.time || '4/4'];
    var events = opts.events || [];
    var beatLen = time.beat === 2 ? 1 : time.beat; // cut time beams by the quarter

    var sigW = Math.abs(fifths) * 11;
    var timeX = 72 + sigW + 8;
    var startX = timeX + 30;
    var adv = function (e) { return 22 + 30 * Math.sqrt(e.dur); };
    // x for every event, with barlines between measures
    var xs = [], bars = [];
    var x = startX + 14, measure = 0;
    events.forEach(function (e, i) {
      // opts.bars: [true after event i] puts barlines where a student drew them
      var bar = opts.bars ? i > 0 && opts.bars[i - 1] : e.measure !== measure;
      if (bar) { bars.push(x - 8); x += 14; measure = e.measure; }
      xs[i] = x;
      x += adv(e);
    });
    var natural = x + 4;
    var width = Math.max(opts.minWidth || 480, natural);
    var stretch = (width - startX - 14) / Math.max(1, natural - startX - 14);
    xs = xs.map(function (v) { return startX + (v - startX) * stretch; });
    bars = bars.map(function (v) { return startX + (v - startX) * stretch; });

    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + HEIGHT);
    svg.innerHTML = '';
    el('rect', { x: 0, y: 0, width: width, height: HEIGHT, class: 'staff-bg' }, svg);
    if (perc) {
      el('line', { x1: 8, x2: width - 8, y1: yFor(4), y2: yFor(4), class: 'staff-line' }, svg);
      el('rect', { x: 22, y: yFor(6), width: 4, height: 24, class: INK + ' fill' }, svg);
      el('rect', { x: 30, y: yFor(6), width: 4, height: 24, class: INK + ' fill' }, svg);
    } else {
      for (var i = 0; i < 5; i++) el('line', { x1: 8, x2: width - 8, y1: TOP + i * GAP, y2: TOP + i * GAP, class: 'staff-line' }, svg);
      drawClef(svg, clef);
      keySignature(svg, clef, fifths, 70);
    }
    [[time.top, yFor(4) - 2], [time.bottom, yFor(0) - 2]].forEach(function (p) {
      var t = el('text', { x: timeX + 10, y: p[1], 'text-anchor': 'middle', class: 'time-sig' }, svg);
      t.textContent = p[0];
    });
    var barTop = perc ? yFor(6) : yFor(8), barBot = perc ? yFor(2) : yFor(0);
    bars.forEach(function (bx) { el('line', { x1: bx, x2: bx, y1: barTop, y2: barBot, class: 'staff-line barline' }, svg); });
    el('line', { x1: width - 12, x2: width - 12, y1: barTop, y2: barBot, class: 'staff-line barline' }, svg);
    el('rect', { x: width - 9, y: barTop, width: 4, height: barBot - barTop, class: INK + ' fill' }, svg);

    // positions, accidentals (reset at each barline), colors
    var inForce = {}, lastMeasure = -1;
    var info = events.map(function (e, i) {
      var g = glyphOf(e.dur);
      var o = { e: e, x: xs[i], base: g.base, dot: g.dot, color: e.result === 'right' ? 'var(--fa)' : e.result === 'wrong' ? 'var(--do)' : (e.color || '#3b3355') };
      if (e.rest) return o;
      if (e.measure !== lastMeasure) { inForce = {}; lastMeasure = e.measure; }
      if (perc || !e.n) { o.pos = 4; return o; }
      o.pos = Theory.staffPos(e.n, clef);
      var k = e.n.l + ':' + e.n.oct;
      var current = k in inForce ? inForce[k] : Theory.sigAcc(fifths, e.n.l);
      // a tied continuation keeps its accidental silently
      var tiedIn = i > 0 && events[i - 1].tie;
      o.show = e.n.acc !== current && !tiedIn ? e.n.acc : null;
      inForce[k] = e.n.acc;
      return o;
    });

    // beam groups: runs of eighths/sixteenths inside one beat, or where
    // opts.links says (links[i]: event i is beamed to the next)
    var groups = [];
    var cur = null;
    info.forEach(function (o, i) {
      var beamable = !o.e.rest && o.base <= 0.5;
      var beat = Math.floor(o.e.start / beatLen + 1e-9) + '|' + o.e.measure;
      if (opts.links) beat = cur && opts.links[i - 1] ? cur.beat : 'g' + i;
      if (beamable && cur && cur.beat === beat) cur.items.push(i);
      else { cur = beamable ? { beat: beat, items: [i] } : null; if (cur) groups.push(cur); }
    });
    var groupOf = {};
    groups.forEach(function (gr) { if (gr.items.length > 1) gr.items.forEach(function (i) { groupOf[i] = gr; }); });

    // stem direction: per beam group, else per note
    groups.forEach(function (gr) {
      if (gr.items.length < 2) return;
      var avg = gr.items.reduce(function (a, i) { return a + info[i].pos; }, 0) / gr.items.length;
      gr.up = perc || avg < 4;
    });

    info.forEach(function (o, i) {
      var e = o.e;
      var g = el('g', { class: 'note ' + (e.state || '') }, svg);
      if (e.rest) { restGlyph(g, o.base, o.x, o.dot); return; }
      var y = yFor(o.pos);
      if (!perc) {
        for (var p = -2; p >= o.pos; p -= 2) el('line', { x1: o.x - 14, x2: o.x + 14, y1: yFor(p), y2: yFor(p), class: 'staff-line' }, g);
        for (p = 10; p <= o.pos; p += 2) el('line', { x1: o.x - 14, x2: o.x + 14, y1: yFor(p), y2: yFor(p), class: 'staff-line' }, g);
      }
      if (e.state === 'current') el('circle', { cx: o.x, cy: y, r: 17, class: 'note-halo' }, g);
      if (o.show != null) accidental(g, o.show, o.x - 20, y, 'note-acc');
      var open = o.base >= 2;
      el('ellipse', {
        cx: o.x, cy: y, rx: open ? 7.8 : 8.2, ry: open ? 5.4 : 5.8, transform: 'rotate(-20 ' + o.x + ' ' + y + ')',
        fill: open ? 'var(--staff-bg)' : o.color, stroke: open ? o.color : 'none', 'stroke-width': open ? 2.2 : 0, class: 'note-head',
      }, g);
      if (o.dot) el('circle', { cx: o.x + 13, cy: o.pos % 2 === 0 ? y - 4 : y, r: 2.4, fill: o.color }, g);
      if (o.base < 4) {
        var gr = groupOf[i];
        var up = gr ? gr.up : perc || o.pos < 4;
        o.up = up;
        o.sx = up ? o.x + 7.2 : o.x - 7.2;
        o.y = y;
        o.g = g;
        if (!gr) {
          var y2 = up ? y - 36 : y + 36;
          el('line', { x1: o.sx, x2: o.sx, y1: y, y2: y2, class: 'stem', stroke: o.color }, g);
          var flagsN = o.base <= 0.25 ? 2 : o.base <= 0.5 ? 1 : 0;
          for (var f = 0; f < flagsN; f++) {
            var fy = y2 + (up ? f * 8 : -f * 8);
            var d = up
              ? 'M ' + o.sx + ' ' + fy + ' c 1 7, 11 9, 9 22'
              : 'M ' + o.sx + ' ' + fy + ' c 1 -7, 11 -9, 9 -22';
            el('path', { d: d, fill: 'none', stroke: o.color, 'stroke-width': 2.4 }, g);
          }
        }
      }
      if (e.label) {
        var t = el('text', { x: o.x, y: HEIGHT - 8, 'text-anchor': 'middle', class: 'note-label', fill: e.color || o.color }, g);
        t.textContent = e.label;
      }
    });

    // beams
    groups.forEach(function (gr) {
      if (gr.items.length < 2) return;
      var its = gr.items.map(function (i) { return info[i]; });
      var first = its[0], last = its[its.length - 1];
      var dir = gr.up ? -1 : 1;
      var e1 = first.y + dir * 34, e2 = last.y + dir * 34;
      var slope = Math.max(-0.2, Math.min(0.2, (e2 - e1) / Math.max(1, last.sx - first.sx)));
      var beamY = function (xx) { return e1 + slope * (xx - first.sx); };
      // keep every stem at least 28 long
      var need = 0;
      its.forEach(function (o) {
        var gap = dir * (beamY(o.sx) - o.y);
        if (gap < 28) need = Math.max(need, 28 - gap);
      });
      e1 += dir * need;
      var g = el('g', { class: 'beam' }, svg);
      its.forEach(function (o) {
        el('line', { x1: o.sx, x2: o.sx, y1: o.y, y2: beamY(o.sx), class: 'stem', stroke: o.color }, g);
      });
      var beam = function (x1, x2, level) {
        var off = -dir * level * 7;
        var ya = beamY(x1) + off, yb = beamY(x2) + off;
        var th = dir * -BEAM;
        el('path', { d: 'M ' + x1 + ' ' + ya + ' L ' + x2 + ' ' + yb + ' L ' + x2 + ' ' + (yb + th) + ' L ' + x1 + ' ' + (ya + th) + ' Z', class: INK + ' fill' }, g);
      };
      beam(first.sx, last.sx, 0);
      // secondary beams for sixteenths; a lone one gets a stub
      its.forEach(function (o, j) {
        if (o.base > 0.25) return;
        var next = its[j + 1], prev = its[j - 1];
        if (next && next.base <= 0.25) beam(o.sx, next.sx, 1);
        else if (!(prev && prev.base <= 0.25)) {
          if (next) beam(o.sx, o.sx + 10, 1); else beam(o.sx - 10, o.sx, 1);
        }
      });
    });

    // ties
    info.forEach(function (o, i) {
      if (!o.e.tie || o.e.rest || !info[i + 1]) return;
      var n = info[i + 1];
      var below = o.up !== false;
      var y = (o.y || yFor(o.pos)) + (below ? 9 : -9);
      var c = below ? y + 9 : y - 9;
      el('path', { d: 'M ' + (o.x + 6) + ' ' + y + ' Q ' + ((o.x + n.x) / 2) + ' ' + c + ', ' + (n.x - 6) + ' ' + y, fill: 'none', 'stroke-width': 2, class: INK }, svg);
    });
    return xs;
  }
  var BEAM = 4.8;

  // Staff position under a pointer event on a rendered staff svg.
  function posAt(svg, ev) {
    var rect = svg.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    var y = (ev.clientY - rect.top) * (vb.height / rect.height);
    return Math.round(8 - (y - TOP) / (GAP / 2));
  }

  root.Staff = { render: render, renderMeasures: renderMeasures, yFor: yFor, posAt: posAt };
})(this);
