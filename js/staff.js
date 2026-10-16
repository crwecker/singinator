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

    items.forEach(function (it) {
      if (it.state === 'current') el('circle', { cx: x + it.dx, cy: yFor(it.pos), r: 17, class: 'note-halo' }, g);
    });

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
      el('ellipse', {
        cx: hx, cy: y, rx: 8.2, ry: 5.8, transform: 'rotate(-20 ' + hx + ' ' + y + ')',
        fill: it.color || '#3b3355', class: 'note-head',
      }, g);
    });

    var labels = items.filter(function (it) { return it.label; });
    labels.reverse().forEach(function (it, i) {
      var t = el('text', { x: x, y: HEIGHT - 8 - (labels.length - 1 - i) * 16, 'text-anchor': 'middle', class: 'note-label', fill: it.color || '#3b3355' }, g);
      t.textContent = it.label;
    });
  }

  // opts: { clef, fifths, notes: [{ n, color, state, label, col }], width, minWidth }
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
    notes.forEach(function (it) {
      if (it.hidden) return; // placeholder: keeps its column, draws nothing
      var n = it.n;
      var keyAcc = Theory.sigAcc(fifths, n.l);
      var k = n.l + ':' + n.oct;
      var current = k in inForce ? inForce[k] : keyAcc;
      var show = n.acc !== current || it.forceAcc ? n.acc : null;
      inForce[k] = n.acc;
      (byCol[it.col] = byCol[it.col] || []).push(Object.assign({}, it, { pos: Theory.staffPos(n, clef), show: show }));
    });
    byCol.forEach(function (items, c) {
      if (!items) return;
      drawColumn(svg, items, cols === 1 ? startX + span / 2 : x0 + c * colW);
    });
  }

  root.Staff = { render: render, yFor: yFor };
})(this);
