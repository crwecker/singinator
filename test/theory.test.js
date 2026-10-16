// Run with: node test/theory.test.js
const assert = require('assert');
const T = require('../js/theory.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('ok   ' + name); }
  catch (e) { failures++; console.log('FAIL ' + name + ': ' + e.message); }
}
const P = T.parse;
const syl = (n, k, conv) => T.syllable(P(n), k, conv).syl;

check('midi from spelling', () => {
  assert.strictEqual(T.midi(P('C4')), 60);
  assert.strictEqual(T.midi(P('A4')), 69);
  assert.strictEqual(T.midi(P('B#3')), 60);
  assert.strictEqual(T.midi(P('Cb4')), 59);
  assert.strictEqual(T.midi(P('Fx4')), 67);
});

check('intervals: quality by spelling', () => {
  const cases = [
    ['E4', 'F4', 'm2'], ['F4', 'B4', 'A4'], ['B4', 'F5', 'd5'], ['C4', 'G#4', 'A5'],
    ['C4', 'Ab4', 'm6'], ['C4', 'E4', 'M3'], ['C#4', 'Eb4', 'd3'], ['Eb4', 'F#4', 'A2'],
    ['C4', 'C5', 'P8'], ['C4', 'B4', 'M7'], ['C#4', 'Bb4', 'd7'], ['D4', 'C5', 'm7'],
    ['G4', 'D5', 'P5'], ['A4', 'D5', 'P4'], ['F4', 'Bb4', 'P4'], ['B3', 'C4', 'm2'],
  ];
  for (const [a, b, id] of cases) {
    assert.strictEqual(T.interval(P(a), P(b)).id, id, `${a}-${b}`);
    const down = T.interval(P(b), P(a));
    assert.strictEqual(down.id, id, `${b}-${a} descending`);
    assert.strictEqual(down.up, false);
  }
});

check('transpose round-trips every interval from every natural/sharp/flat', () => {
  const ids = ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'd5', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8', 'A2', 'd7', 'A5', 'd4'];
  for (const start of ['C4', 'D4', 'Eb4', 'F#4', 'Bb3', 'B3', 'G#4', 'Db4']) {
    for (const id of ids) {
      for (const up of [true, false]) {
        const t = T.transpose(P(start), id, up);
        const iv = T.interval(P(start), t);
        assert.strictEqual(iv.id, id, `${start} ${id} ${up ? 'up' : 'down'} -> ${T.name(t, true)}`);
        assert.strictEqual(iv.up, up);
        assert.strictEqual(Math.abs(T.midi(t) - T.midi(P(start))), T.parseInterval(id).semis);
      }
    }
  }
});

check('key signatures for all 15 major keys', () => {
  const expect = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7 };
  for (const t in expect) assert.strictEqual(T.fifths(T.key(t)), expect[t], t);
  assert.strictEqual(T.allKeys('major').length, 15);
  assert.strictEqual(T.allKeys('minor').length, 15);
  assert.strictEqual(T.fifths(T.key('A', 'minor')), 0);
  assert.strictEqual(T.fifths(T.key('C#', 'minor')), 4);
  assert.strictEqual(T.fifths(T.key('Eb', 'minor')), -6);
});

check('major scale in every key spells 7 letters and sings do..ti', () => {
  for (const k of T.allKeys('major')) {
    const names = [];
    for (let d = 0; d < 7; d++) {
      const n = T.degreeNote(k, d, 0, 4);
      names.push(T.syllable(n, k, 'do').syl);
      if (d > 0) {
        const prev = T.degreeNote(k, d - 1, 0, 4);
        const semis = T.midi(n) - T.midi(prev);
        assert.strictEqual(semis, [2, 2, 1, 2, 2, 2][d - 1], `${T.keyName(k)} step ${d}`);
      }
    }
    assert.deepStrictEqual(names, ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'], T.keyName(k));
  }
});

check('natural minor in every key: do-based and la-based', () => {
  for (const k of T.allKeys('minor')) {
    const doB = [], laB = [];
    for (let d = 0; d < 7; d++) {
      const n = T.degreeNote(k, d, 0, 4);
      doB.push(T.syllable(n, k, 'do').syl);
      laB.push(T.syllable(n, k, 'la').syl);
    }
    assert.deepStrictEqual(doB, ['do', 're', 'me', 'fa', 'sol', 'le', 'te'], T.keyName(k));
    assert.deepStrictEqual(laB, ['la', 'ti', 'do', 're', 'mi', 'fa', 'sol'], T.keyName(k));
  }
});

check('raised 6 and 7 in minor', () => {
  const am = T.key('A', 'minor');
  assert.strictEqual(syl('F#4', am, 'do'), 'la');
  assert.strictEqual(syl('G#4', am, 'do'), 'ti');
  assert.strictEqual(syl('F#4', am, 'la'), 'fi');
  assert.strictEqual(syl('G#4', am, 'la'), 'si');
  const raised7 = T.degreeNote(T.key('Bb', 'minor'), 6, 1, 4);
  assert.strictEqual(T.name(raised7), 'A');
});

check('chromatic syllables are spelling-aware', () => {
  const C = T.key('C');
  assert.strictEqual(syl('F#4', C), 'fi');
  assert.strictEqual(syl('Gb4', C), 'se');
  assert.deepStrictEqual(['C#4', 'D#4', 'F#4', 'G#4', 'A#4'].map((n) => syl(n, C)), ['di', 'ri', 'fi', 'si', 'li']);
  assert.deepStrictEqual(['Db4', 'Eb4', 'Gb4', 'Ab4', 'Bb4'].map((n) => syl(n, C)), ['ra', 'me', 'se', 'le', 'te']);
  const Eb = T.key('Eb');
  assert.strictEqual(syl('A4', Eb), 'fi');
  assert.strictEqual(syl('Db5', Eb), 'te');
  assert.strictEqual(syl('E4', Eb), 'di');
});

check('clef positions of middle C', () => {
  const c4 = P('C4');
  assert.strictEqual(T.staffPos(c4, 'treble'), -2);
  assert.strictEqual(T.staffPos(c4, 'bass'), 10);
  assert.strictEqual(T.staffPos(c4, 'alto'), 4);
  assert.strictEqual(T.staffPos(c4, 'tenor'), 6);
});

check('key signature positions land on the right letters', () => {
  const sharpLetters = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
  const flatLetters = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
  for (const clef of ['treble', 'bass', 'alto', 'tenor']) {
    const bottom = T.step(T.CLEFS[clef].bottom);
    T.SIG_POS[clef].sharp.forEach((p, i) => {
      assert.strictEqual(T.LETTERS[T.mod(bottom + p, 7)], sharpLetters[i], `${clef} sharp ${i}`);
      assert(p >= -1 && p <= 9, `${clef} sharp ${i} off staff`);
    });
    T.SIG_POS[clef].flat.forEach((p, i) => {
      assert.strictEqual(T.LETTERS[T.mod(bottom + p, 7)], flatLetters[i], `${clef} flat ${i}`);
      assert(p >= -1 && p <= 9, `${clef} flat ${i} off staff`);
    });
  }
});

check('interval names', () => {
  assert.strictEqual(T.intervalName('m3'), 'minor 3rd');
  assert.strictEqual(T.intervalName('A4'), 'augmented 4th');
  assert.strictEqual(T.intervalName('P8'), 'perfect octave');
});


check('compound intervals and inversion', () => {
  assert.strictEqual(T.interval(P('C4'), P('D5')).id, 'M9');
  assert.strictEqual(T.interval(P('C4'), P('Eb5')).id, 'm10');
  assert.strictEqual(T.interval(P('C4'), P('F5')).id, 'P11');
  assert.strictEqual(T.interval(P('C4'), P('G5')).id, 'P12');
  assert.strictEqual(T.interval(P('C4'), P('A5')).id, 'M13');
  assert.strictEqual(T.intervalName('m10'), 'minor 10th');
  assert.strictEqual(T.transpose(P('E4'), 'm9', true).acc, 0); // F5
  for (const [a, b] of [['m3', 'M6'], ['M2', 'm7'], ['P4', 'P5'], ['A4', 'd5'], ['P1', 'P8'], ['d7', 'A2']]) {
    assert.strictEqual(T.invertInterval(a), b);
    assert.strictEqual(T.invertInterval(b), a);
  }
  assert.strictEqual(T.simpleInterval('M9'), 'M2');
  assert.strictEqual(T.simpleInterval('P12'), 'P5');
});

check('modes: signatures and syllables', () => {
  const f = (t, m) => T.fifths(T.key(t, m));
  assert.strictEqual(f('D', 'dorian'), 0);
  assert.strictEqual(f('E', 'phrygian'), 0);
  assert.strictEqual(f('F', 'lydian'), 0);
  assert.strictEqual(f('G', 'mixolydian'), 0);
  assert.strictEqual(f('B', 'locrian'), 0);
  assert.strictEqual(f('C', 'dorian'), -2);
  assert.strictEqual(f('C', 'lydian'), 1);
  for (const mode of ['dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian']) {
    assert.strictEqual(T.allKeys(mode).length, 15, mode);
    for (const k of T.allKeys(mode)) assert(Math.abs(T.fifths(k)) <= 7, T.keyName(k));
  }
  const D = T.key('D', 'dorian');
  const scale = (k, conv) => [0, 1, 2, 3, 4, 5, 6].map((d) => T.syllable(T.degreeNote(k, d, 0, 4), k, conv).syl);
  assert.deepStrictEqual(scale(D, 'do'), ['do', 're', 'me', 'fa', 'sol', 'la', 'te']);
  assert.deepStrictEqual(scale(D, 'la'), ['re', 'mi', 'fa', 'sol', 'la', 'ti', 'do']);
  assert.deepStrictEqual(scale(T.key('G', 'mixolydian'), 'do'), ['do', 're', 'mi', 'fa', 'sol', 'la', 'te']);
  assert.deepStrictEqual(scale(T.key('F', 'lydian'), 'do'), ['do', 're', 'mi', 'fi', 'sol', 'la', 'ti']);
  assert.deepStrictEqual(scale(T.key('E', 'phrygian'), 'do'), ['do', 'ra', 'me', 'fa', 'sol', 'le', 'te']);
  assert.deepStrictEqual(scale(T.key('B', 'locrian'), 'do'), ['do', 'ra', 'me', 'fa', 'se', 'le', 'te']);
  // minor still works the old way
  assert.deepStrictEqual(scale(T.key('A', 'minor'), 'la'), ['la', 'ti', 'do', 're', 'mi', 'fa', 'sol']);
});

check('chords: qualities and inversions', () => {
  const names = (ns) => ns.map((n) => T.name(n)).join(' ');
  assert.strictEqual(names(T.chordTones(P('C4'), 'maj')), 'C E G');
  assert.strictEqual(names(T.chordTones(P('B3'), 'dim')), 'B D F');
  assert.strictEqual(names(T.chordTones(P('G3'), 'dom7')), 'G B D F');
  assert.strictEqual(names(T.chordTones(P('C#4'), 'dim7')), 'C♯ E G B♭');
  assert.strictEqual(names(T.chordTones(P('Eb4'), 'aug')), 'E♭ G B');
  assert.strictEqual(names(T.chordVoicing(P('G3'), 'dom7', 2)), 'D F G B');
  for (const type of Object.keys(T.CHORDS)) {
    for (const root of ['C4', 'F#3', 'Bb3', 'D4']) {
      assert.strictEqual(T.chordType(T.chordTones(P(root), type)), type, root + ' ' + type);
    }
  }
});

check('Roman numerals: diatonic chords in major and minor', () => {
  const nums = (k, sev) => [0, 1, 2, 3, 4, 5, 6].map((d) => T.diatonicChord(k, d, sev).numeral).join(' ');
  assert.strictEqual(nums(T.key('C')), 'I ii iii IV V vi vii°');
  assert.strictEqual(nums(T.key('A', 'minor')), 'i ii° III iv V VI vii°');
  assert.strictEqual(nums(T.key('Eb')), 'I ii iii IV V vi vii°');
  assert.strictEqual(nums(T.key('C'), true), 'IM7 ii7 iii7 IVM7 V7 vi7 viiø7');
  assert.strictEqual(nums(T.key('C', 'minor'), true), 'i7 ii\u00F87 IIIM7 iv7 V7 VIM7 vii\u00B07');
  assert.strictEqual(T.numeral('dom7', 4, 1), 'V6/5');
  assert.strictEqual(T.numeral('dim', 6, 1), 'vii°6');
  assert.strictEqual(T.numeral('maj', 0, 2), 'I6/4');
  assert.strictEqual(T.numeral('hdim7', 1, 3), 'iiø4/2');
  const v = T.secondaryDominant(T.key('C'), 4, true);
  assert.strictEqual(T.name(v.root) + ' ' + v.numeral, 'D V7/V');
  assert.strictEqual(T.secondaryDominant(T.key('C'), 1, false).numeral, 'V/ii');
});

check('other scales are spelled with real letters', () => {
  const names = (id, t) => T.scaleNotes(P(t || 'C4'), id).map((n) => T.name(n)).join(' ');
  assert.strictEqual(names('whole tone'), 'C D E F♯ G♯ A♯ C');
  assert.strictEqual(names('blues'), 'C E♭ F G♭ G B♭ C');
  assert.strictEqual(names('octatonic (H-W)'), 'C D♭ E♭ E F♯ G A B♭ C');
  assert.strictEqual(names('major pentatonic', 'G4'), 'G A B D E G');
  for (const id of Object.keys(T.SCALES)) {
    const ns = T.scaleNotes(P('C4'), id);
    for (let i = 1; i < ns.length; i++) assert(T.midi(ns[i]) > T.midi(ns[i - 1]), id + ' ascends');
    assert.strictEqual(T.midi(ns[ns.length - 1]) - T.midi(ns[0]), 12, id + ' spans an octave');
  }
});

console.log(failures ? `\n${failures} failing` : '\nall passing');
process.exit(failures ? 1 : 0);
