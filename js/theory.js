// Music theory core: spelled pitches, intervals, keys, clefs and movable-do
// solfège. Pure functions; browser global (window.Theory) or Node module.
//
// A note is { l, acc, oct }: l = letter index 0-6 (C D E F G A B),
// acc = -2..2 (flats negative), oct = scientific octave (C4 = middle C).
// Everything (MIDI, staff position, syllable) is derived from the spelling,
// so F♯ and G♭ stay different notes.
(function (root) {
  'use strict';

  var LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  var LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
  var MAJOR = [0, 2, 4, 5, 7, 9, 11];
  var ACC_TEXT = { '-2': '♭♭', '-1': '♭', '0': '', '1': '♯', '2': '×' };

  function mod(a, n) { return ((a % n) + n) % n; }

  function note(l, acc, oct) { return { l: mod(l, 7), acc: acc || 0, oct: oct }; }

  // "F#4", "Bb3", "C4", "Ebb5", "Fx4"
  function parse(s) {
    var m = /^([A-Ga-g])(bb|b|#|x|##)?(-?\d+)?$/.exec(s);
    if (!m) throw new Error('bad note ' + s);
    var acc = { bb: -2, b: -1, '#': 1, '##': 2, x: 2 }[m[2]] || 0;
    return note(LETTERS.indexOf(m[1].toUpperCase()), acc, m[3] == null ? 4 : Number(m[3]));
  }

  function midi(n) { return 12 * (n.oct + 1) + LETTER_PC[n.l] + n.acc; }
  function pc(n) { return mod(LETTER_PC[n.l] + n.acc, 12); }
  function step(n) { return n.oct * 7 + n.l; } // diatonic step number
  function name(n, withOct) {
    return LETTERS[n.l] + ACC_TEXT[n.acc] + (withOct ? n.oct : '');
  }
  function same(a, b) { return a.l === b.l && a.acc === b.acc && a.oct === b.oct; }

  function fromStep(s, acc) { return note(mod(s, 7), acc, Math.floor(s / 7)); }

  // ---------- Intervals ----------
  // size = generic interval minus one (0 = unison, 7 = octave).
  var PERFECT = { 0: true, 3: true, 4: true };
  var BASE_SEMIS = [0, 2, 4, 5, 7, 9, 11];
  var ORD = ['unison', '2nd', '3rd', '4th', '5th', '6th', '7th', 'octave', '9th', '10th', '11th', '12th', '13th'];
  var QUAL_NAME = { P: 'perfect', M: 'major', m: 'minor', A: 'augmented', d: 'diminished' };

  function quality(size, semis) {
    var simple = size % 7;
    var base = BASE_SEMIS[simple] + 12 * Math.floor(size / 7);
    var diff = semis - base;
    if (PERFECT[simple]) return { '-1': 'd', '0': 'P', '1': 'A' }[diff] || null;
    return { '-2': 'd', '-1': 'm', '0': 'M', '1': 'A' }[diff] || null;
  }

  // Interval from a to b. Returns { id: 'm3', size, semis, up } (simple or octave).
  function interval(a, b) {
    var size = step(b) - step(a);
    var semis = midi(b) - midi(a);
    var up = size > 0 || (size === 0 && semis >= 0);
    if (!up) { size = -size; semis = -semis; }
    var q = quality(size, semis);
    return { id: q ? q + (size + 1) : '?', size: size, semis: semis, up: up };
  }

  function parseInterval(id) {
    var m = /^([PMmAd])(\d+)$/.exec(id);
    var size = Number(m[2]) - 1;
    var simple = size % 7;
    var base = BASE_SEMIS[simple] + 12 * Math.floor(size / 7);
    var off = PERFECT[simple] ? { d: -1, P: 0, A: 1 }[m[1]] : { d: -2, m: -1, M: 0, A: 1 }[m[1]];
    return { id: id, size: size, semis: base + off };
  }

  function intervalName(id) {
    var iv = parseInterval(id);
    var q = QUAL_NAME[id[0]];
    if (iv.size === 7 && id[0] === 'P') return 'perfect octave';
    if (iv.size === 0 && id[0] === 'P') return 'perfect unison';
    return q + ' ' + (ORD[iv.size] || (iv.size + 1) + 'th');
  }

  // Inversion of a simple interval: the number becomes 9 - n and the quality
  // flips (M <-> m, A <-> d, P stays P). m3 -> M6, A4 -> d5, P8 -> P1.
  function invertInterval(id) {
    var iv = parseInterval(id);
    var q = { P: 'P', M: 'm', m: 'M', A: 'd', d: 'A' }[id[0]];
    return q + (9 - (iv.size + 1));
  }

  // Simple interval inside a compound one: M9 -> M2, P12 -> P5.
  function simpleInterval(id) {
    var iv = parseInterval(id);
    return iv.size <= 7 ? id : id[0] + ((iv.size % 7) + 1);
  }

  // Note a given interval above (up=true) or below n. May produce double
  // accidentals; callers that don't want them should check .acc.
  function transpose(n, id, up) {
    var iv = parseInterval(id);
    var dir = up === false ? -1 : 1;
    var target = fromStep(step(n) + dir * iv.size, 0);
    var want = midi(n) + dir * iv.semis;
    target.acc = want - midi(target);
    return target;
  }

  // Ear-training classes: by ear, A4 and d5 sound the same, so the answers
  // are semitone counts.
  var EAR_INTERVALS = [
    { semis: 1, id: 'm2', label: 'm2' }, { semis: 2, id: 'M2', label: 'M2' },
    { semis: 3, id: 'm3', label: 'm3' }, { semis: 4, id: 'M3', label: 'M3' },
    { semis: 5, id: 'P4', label: 'P4' }, { semis: 6, id: 'TT', label: 'Tritone' },
    { semis: 7, id: 'P5', label: 'P5' }, { semis: 8, id: 'm6', label: 'm6' },
    { semis: 9, id: 'M6', label: 'M6' }, { semis: 10, id: 'm7', label: 'm7' },
    { semis: 11, id: 'M7', label: 'M7' }, { semis: 12, id: 'P8', label: 'P8' },
  ];

  // ---------- Keys ----------
  var SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]; // F C G D A E B
  var FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];  // B E A D G C F
  var LETTER_FIFTHS = [0, 2, 4, -1, 1, 3, 5]; // C D E F G A B on the circle

  // Church modes, by how far their signature sits from the parallel major
  // and where their tonic sits above the parent major's tonic.
  var MODES = {
    major:      { fifths: 0,  offset: 'P1' },
    ionian:     { fifths: 0,  offset: 'P1' },
    dorian:     { fifths: -2, offset: 'M2' },
    phrygian:   { fifths: -4, offset: 'M3' },
    lydian:     { fifths: 1,  offset: 'P4' },
    mixolydian: { fifths: -1, offset: 'P5' },
    minor:      { fifths: -3, offset: 'M6' },
    aeolian:    { fifths: -3, offset: 'M6' },
    locrian:    { fifths: -5, offset: 'M7' },
  };

  // key = { tonic: note (octave ignored), mode: one of MODES }
  function key(tonic, mode) {
    var t = typeof tonic === 'string' ? parse(tonic) : tonic;
    return { tonic: note(t.l, t.acc, 4), mode: mode || 'major' };
  }

  function fifths(k) {
    var f = LETTER_FIFTHS[k.tonic.l] + 7 * k.tonic.acc;
    return f + MODES[k.mode].fifths;
  }

  function keyName(k) {
    return name(k.tonic) + ' ' + k.mode;
  }

  // Accidental the key signature gives a letter.
  function sigAcc(f, l) {
    if (f > 0) return SHARP_ORDER.indexOf(l) < f ? 1 : 0;
    if (f < 0) return FLAT_ORDER.indexOf(l) < -f ? -1 : 0;
    return 0;
  }

  // All 15 major and 15 minor keys (−7..7 accidentals).
  var MAJOR_TONICS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
  // Every mode's keys come from the 15 major keys, so spellings stay sane
  // (A minor, D dorian, ... never G## anything).
  function allKeys(mode, maxAcc) {
    mode = mode || 'major';
    var list = MAJOR_TONICS.map(function (t) { return key(transpose(parse(t), MODES[mode].offset, true), mode); });
    return list.filter(function (k) { return Math.abs(fifths(k)) <= (maxAcc == null ? 7 : maxAcc); });
  }

  // Scale degree (0-6 above the tonic) with an alteration relative to the
  // key signature, e.g. raised 7th in minor = degree(k, 6, 1).
  function degreeNote(k, deg, alt, oct) {
    var s = step(k.tonic) + deg;
    var n = fromStep(s, 0);
    n.acc = sigAcc(fifths(k), n.l) + (alt || 0);
    if (oct != null) n.oct = oct + Math.floor((k.tonic.l + deg) / 7);
    return n;
  }

  // ---------- Movable-do solfège ----------
  // Rows are degrees above do; columns are alteration −1, 0, +1 from major.
  var SYL = [
    ['de', 'do', 'di'],
    ['ra', 're', 'ri'],
    ['me', 'mi', 'my'],
    ['fe', 'fa', 'fi'],
    ['se', 'sol', 'si'],
    ['le', 'la', 'li'],
    ['te', 'ti', 'tai'],
  ];

  // conv: 'do' (do is always the tonic: do-based minor, do-based modes) or
  // 'la' (relative: do is the parent major's tonic, so minor is la-based,
  // dorian re-based, mixolydian sol-based ...).
  function doNote(k, conv) {
    if (conv === 'la' && MODES[k.mode].offset !== 'P1') return transpose(k.tonic, MODES[k.mode].offset, false);
    return k.tonic;
  }

  // Returns { syl, deg, alt }: deg is 0-6 above do (for coloring).
  function syllable(n, k, conv) {
    var d = doNote(k, conv);
    var deg = mod(n.l - d.l, 7);
    var semis = mod(pc(n) - pc(d), 12);
    var alt = semis - MAJOR[deg];
    if (alt > 6) alt -= 12;
    if (alt < -6) alt += 12;
    var syl = alt >= -1 && alt <= 1 ? SYL[deg][alt + 1] : SYL[deg][1] + ACC_TEXT[alt];
    return { syl: syl, deg: deg, alt: alt };
  }

  // ---------- Chords ----------
  // Interval stacks above the root. sym is how the quality is written in a
  // Roman numeral (case comes from the third).
  var CHORDS = {
    maj:   { name: 'major',              ivs: ['M3', 'P5'],       sym: '' },
    min:   { name: 'minor',              ivs: ['m3', 'P5'],       sym: '' },
    dim:   { name: 'diminished',         ivs: ['m3', 'd5'],       sym: '\u00B0' },
    aug:   { name: 'augmented',          ivs: ['M3', 'A5'],       sym: '+' },
    dom7:  { name: 'dominant 7th',       ivs: ['M3', 'P5', 'm7'], sym: '7' },
    maj7:  { name: 'major 7th',          ivs: ['M3', 'P5', 'M7'], sym: 'M7' },
    min7:  { name: 'minor 7th',          ivs: ['m3', 'P5', 'm7'], sym: '7' },
    hdim7: { name: 'half-diminished 7th', ivs: ['m3', 'd5', 'm7'], sym: '\u00F87' },
    dim7:  { name: 'diminished 7th',     ivs: ['m3', 'd5', 'd7'], sym: '\u00B07' },
  };
  var TRIAD_FIGURES = ['', '6', '6/4'];
  var SEVENTH_FIGURES = ['7', '6/5', '4/3', '4/2'];

  // Chord tones, root position, root first.
  function chordTones(root, type) {
    return [root].concat(CHORDS[type].ivs.map(function (iv) { return transpose(root, iv, true); }));
  }

  // Chord tones from the bass up for an inversion (0 = root position):
  // the lower tones move up an octave.
  function chordVoicing(root, type, inv) {
    var tones = chordTones(root, type);
    for (var i = 0; i < (inv || 0); i++) {
      var t = tones.shift();
      tones.push(note(t.l, t.acc, t.oct + 1));
    }
    return tones;
  }

  function chordType(tones) {
    var ivs = tones.slice(1).map(function (t) { return interval(tones[0], t).id; }).join(',');
    for (var id in CHORDS) if (CHORDS[id].ivs.join(',') === ivs) return id;
    return null;
  }

  function figure(type, inv) {
    var seventh = CHORDS[type].ivs.length === 3;
    return (seventh ? SEVENTH_FIGURES : TRIAD_FIGURES)[inv || 0];
  }

  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  // Roman numeral text for a chord quality on a scale degree (0-6),
  // e.g. ('dim', 6, 1) -> 'vii°6'. Sevenths: V7, ii7, viiø7, vii°7, IM7.
  function numeral(type, deg, inv) {
    var c = CHORDS[type];
    var upper = c.ivs[0] === 'M3';
    var r = upper ? ROMAN[deg] : ROMAN[deg].toLowerCase();
    var fig = figure(type, inv);
    var sym = c.sym;
    if (c.ivs.length === 3) {
      // the figure replaces the plain '7'; ø/° and M stay
      sym = sym.replace('7', '');
      if (type === 'maj7') sym = 'M';
      return r + sym + fig;
    }
    return r + sym + fig;
  }

  // Diatonic chord on a scale degree. Minor uses harmonic minor for V and
  // vii (raised leading tone), the way theory classes spell them.
  function diatonicChord(k, deg, seventh) {
    var count = seventh ? 4 : 3;
    var root = degreeNote(k, deg, 0, 3);
    var tones = [];
    for (var i = 0; i < count; i++) {
      var d = deg + 2 * i;
      var n = degreeNote(k, d % 7, 0, 3);
      n.oct = root.oct + Math.floor((root.l + 2 * i) / 7);
      if ((k.mode === 'minor') && (deg === 4 || deg === 6) && d % 7 === 6) n.acc += 1;
      tones.push(n);
    }
    var type = chordType(tones);
    return { root: root, type: type, deg: deg, numeral: numeral(type, deg, 0) };
  }

  // Secondary dominant of a degree: V/x or V7/x (x = 1-6 as 0-6).
  function secondaryDominant(k, target, seventh) {
    var t = degreeNote(k, target, 0, 3);
    var root = transpose(t, 'P5', true);
    root.oct = 3;
    var tgt = diatonicChord(k, target, false);
    return { root: root, type: seventh ? 'dom7' : 'maj', target: target,
      numeral: 'V' + (seventh ? '7' : '') + '/' + tgt.numeral };
  }

  // ---------- Other scales ----------
  // Spelled as (letter steps, semitones) above the tonic, so the octatonic
  // scale's 8 notes and the blues scale's flat 5 spell correctly.
  var SCALES = {
    'major pentatonic':  [[0, 0], [1, 2], [2, 4], [4, 7], [5, 9]],
    'minor pentatonic':  [[0, 0], [2, 3], [3, 5], [4, 7], [6, 10]],
    'blues':             [[0, 0], [2, 3], [3, 5], [4, 6], [4, 7], [6, 10]],
    'whole tone':        [[0, 0], [1, 2], [2, 4], [3, 6], [4, 8], [5, 10]],
    'octatonic (H-W)':   [[0, 0], [1, 1], [2, 3], [2, 4], [3, 6], [4, 7], [5, 9], [6, 10]],
    'octatonic (W-H)':   [[0, 0], [1, 2], [2, 3], [3, 5], [4, 6], [5, 8], [5, 9], [6, 11]],
    'harmonic minor':    [[0, 0], [1, 2], [2, 3], [3, 5], [4, 7], [5, 8], [6, 11]],
    'melodic minor':     [[0, 0], [1, 2], [2, 3], [3, 5], [4, 7], [5, 9], [6, 11]],
  };

  function scaleNotes(tonic, id) {
    var notes = SCALES[id].map(function (p) {
      var n = fromStep(step(tonic) + p[0], 0);
      n.acc = midi(tonic) + p[1] - midi(n);
      return n;
    });
    notes.push(note(tonic.l, tonic.acc, tonic.oct + 1));
    return notes;
  }

  // ---------- Clefs ----------
  // Staff position: 0 = bottom line, 8 = top line, one per diatonic step.
  var CLEFS = {
    treble: { bottom: parse('E4'), name: 'Treble' },
    bass:   { bottom: parse('G2'), name: 'Bass' },
    alto:   { bottom: parse('F3'), name: 'Alto' },
    tenor:  { bottom: parse('D3'), name: 'Tenor' },
  };

  // Key-signature positions for each sharp/flat, in order. Tenor sharps break
  // the usual zig-zag (they'd sit above the staff), so these are a table.
  var SIG_POS = {
    treble: { sharp: [8, 5, 9, 6, 3, 7, 4], flat: [4, 7, 3, 6, 2, 5, 1] },
    bass:   { sharp: [6, 3, 7, 4, 1, 5, 2], flat: [2, 5, 1, 4, 0, 3, -1] },
    alto:   { sharp: [7, 4, 8, 5, 2, 6, 3], flat: [3, 6, 2, 5, 1, 4, 0] },
    tenor:  { sharp: [2, 6, 3, 7, 4, 8, 5], flat: [5, 8, 4, 7, 3, 6, 2] },
  };

  function staffPos(n, clef) {
    return step(n) - step(CLEFS[clef].bottom);
  }

  // Comfortable written range for a clef: about two ledger lines each way.
  function clefRange(clef) {
    var b = step(CLEFS[clef].bottom);
    return { lo: b - 4, hi: b + 12 };
  }

  var api = {
    LETTERS: LETTERS, EAR_INTERVALS: EAR_INTERVALS, CLEFS: CLEFS, SIG_POS: SIG_POS,
    note: note, parse: parse, midi: midi, pc: pc, step: step, name: name, same: same, fromStep: fromStep,
    interval: interval, parseInterval: parseInterval, intervalName: intervalName, transpose: transpose,
    key: key, fifths: fifths, keyName: keyName, sigAcc: sigAcc, allKeys: allKeys, degreeNote: degreeNote,
    doNote: doNote, syllable: syllable, staffPos: staffPos, clefRange: clefRange, mod: mod,
    invertInterval: invertInterval, simpleInterval: simpleInterval, MODES: MODES,
    CHORDS: CHORDS, chordTones: chordTones, chordVoicing: chordVoicing, chordType: chordType,
    figure: figure, numeral: numeral, diatonicChord: diatonicChord, secondaryDominant: secondaryDominant,
    SCALES: SCALES, scaleNotes: scaleNotes,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Theory = api;
})(this);
