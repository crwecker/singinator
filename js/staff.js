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
  function ledgers(g, pos, x) {
    for (var p = -2; p >= pos; p -= 2) {
      el('line', { x1: x - 14, x2: x + 14, y1: yFor(p), y2: yFor(p), class: 'staff-line' }, g);
    }
    for (p = 10; p <= pos; p += 2) {
      el('line', { x1: x - 14, x2: x + 14, y1: yFor(p), y2: yFor(p), class: 'staff-line' }, g);
    }
  }

  function drawNote(svg, item, x, pos, showAcc) {
    var y = yFor(pos);
    var color = item.color || '#3b3355';
    var g = el('g', { class: 'note ' + (item.state || '') }, svg);
    ledgers(g, pos, x);
    if (item.state === 'current') el('circle', { cx: x, cy: y, r: 17, class: 'note-halo' }, g);
    if (showAcc != null) accidental(g, showAcc, x - 20, y, 'note-acc');
    if (!item.hideHead) {
      var stemUp = pos < 4;
      var sx = stemUp ? x + 7.2 : x - 7.2;
      if (!item.whole) el('line', { x1: sx, x2: sx, y1: y, y2: stemUp ? y - 38 : y + 38, class: 'stem', stroke: color }, g);
      el('ellipse', {
        cx: x, cy: y, rx: 8.2, ry: 5.8, transform: 'rotate(-20 ' + x + ' ' + y + ')',
        fill: color, class: 'note-head',
      }, g);
    }
    if (item.label) {
      var t = el('text', { x: x, y: HEIGHT - 8, 'text-anchor': 'middle', class: 'note-label', fill: color }, g);
      t.textContent = item.label;
    }
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
    notes.forEach(function (it) {
      if (it.hidden) return; // placeholder: keeps its column, draws nothing
      var n = it.n;
      var keyAcc = Theory.sigAcc(fifths, n.l);
      var k = n.l + ':' + n.oct;
      var current = k in inForce ? inForce[k] : keyAcc;
      var show = n.acc !== current || it.forceAcc ? n.acc : null;
      inForce[k] = n.acc;
      var x = cols === 1 ? startX + span / 2 : x0 + it.col * colW;
      drawNote(svg, it, x, Theory.staffPos(n, clef), show);
    });
  }

  root.Staff = { render: render, yFor: yFor };
})(this);
