// Run with: node test/chorale.test.js
const assert = require('assert');
const C = require('../js/chorale.js');
const PHRASES = require('../js/chorales.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('ok   ' + name); }
  catch (e) { failures++; console.log('FAIL ' + name + ': ' + e.message); }
}

function chOf(ph) {
  return { key: ph.key, voices: ph.voices.map((v) => v.map((e) => Object.assign({ p: e[0], t: e[1], d: e[2] }, e[3] ? { tie: e[3] } : {}))) };
}
const analyzed = PHRASES.map((ph) => ({ ph, r: C.analyze(chOf(ph), 0, ph.len) }));
const find = (num, phrase) => analyzed.find((x) => x.ph.num === num && x.ph.phrase === phrase);

check('every shipped phrase analyzes cleanly', () => {
  analyzed.forEach(({ ph, r }) => assert(r.ok, '#' + ph.num + '.' + ph.phrase + ': ' + r.why));
});

check('every phrase has four voices of the same length', () => {
  PHRASES.forEach((ph) => ph.voices.forEach((v) => {
    const end = v.reduce((a, e) => Math.max(a, e[1] + e[2]), 0);
    assert.strictEqual(end, ph.len, '#' + ph.num + '.' + ph.phrase);
  }));
});

// Murray, Example V.2.1: Chorale 29, mm. 5-6 is G - C6 - D - C6 - G - D4-3 - G,
// I - IV6 - V - IV6 - I - V4-3 - I.
check('Chorale 29, phrase 3 matches Murray’s analysis (Ex. V.2.1)', () => {
  const { r } = find(29, 3);
  assert.deepStrictEqual(r.beats.slice(0, 7).map((b) => b.rn.label), ['I', 'IV6', 'V', 'IV6', 'I', 'V', 'I']);
  assert(r.beats[5].sus, 'the suspension on V');
});

check('the 4–3 in Chorale 159 is in the alto, G over D', () => {
  const { r, ph } = find(159, 1);
  const sus = r.ncts.find((x) => x.type === 'SUS');
  assert(sus && sus.v === 2, 'alto suspension');
  assert.strictEqual(ph.voices[2][sus.i][0], 'G4');
});

check('Chorale 89 is read in B minor, with a dominant seventh', () => {
  const { r } = find(89, 2);
  assert.strictEqual(r.k.mode, 'minor');
  assert(r.beats.some((b) => b.rn.label === 'V7'));
});

check('contours name the non-chord tones', () => {
  const T = require('../js/theory.js');
  const n = (s) => T.parse(s);
  assert.strictEqual(C.nctType(n('C4'), n('D4'), n('E4'), false, false), 'PT');
  assert.strictEqual(C.nctType(n('C4'), n('D4'), n('C4'), false, false), 'NT');
  assert.strictEqual(C.nctType(n('C4'), n('B3'), n('B3'), false, false), 'ANT');
  assert.strictEqual(C.nctType(n('C4'), n('C4'), n('B3'), true, true), 'SUS');
  assert.strictEqual(C.nctType(n('B3'), n('B3'), n('C4'), true, true), 'RET');
  assert.strictEqual(C.nctType(n('C4'), n('A4'), n('G4'), true, false), 'APP');
});

if (failures) { console.log(failures + ' failed'); process.exit(1); }
