// Run with: node test/harmony.test.js
const assert = require('assert');
const T = require('../js/theory.js');
const H = require('../js/harmony.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('ok   ' + name); }
  catch (e) { failures++; console.log('FAIL ' + name + ': ' + e.message); }
}

const BANK = ['I', 'I6', 'I6/4', 'ii', 'ii6', 'ii7', 'ii6/5', 'iii', 'IV', 'IV6', 'V', 'V6', 'V7', 'V6/5', 'V4/3', 'V4/2',
  'vi', 'vii°6', 'V/V', 'V7/V', 'V/vi', 'V7/vi', 'V7/IV', 'V/ii', 'V7/ii'];

// Deterministic random so failures reproduce.
function rng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

check('chord ids parse and label correctly in major and minor', () => {
  const lab = (k, id) => H.chord(k, id).label;
  const C = T.key('C'), cm = T.key('C', 'minor');
  assert.strictEqual(lab(C, 'ii6'), 'ii6');
  assert.strictEqual(lab(cm, 'ii6'), 'ii°6');
  assert.strictEqual(lab(cm, 'I'), 'i');
  assert.strictEqual(lab(cm, 'IV'), 'iv');
  assert.strictEqual(lab(cm, 'vi'), 'VI');
  assert.strictEqual(lab(C, 'V6/5'), 'V6/5');
  assert.strictEqual(lab(C, 'V7/V'), 'V7/V');
  assert.strictEqual(lab(cm, 'V7/IV'), 'V7/iv');
  for (const k of [C, cm, T.key('Eb'), T.key('F#', 'minor')]) {
    for (const id of BANK) {
      const c = H.chord(k, id);
      assert(c.type, `${T.keyName(k)} ${id}`);
    }
  }
});

function checkVoicing(k, chords, voices, where) {
  const lt = T.pc(T.transpose(k.tonic, 'm2', false));
  voices.forEach((v, i) => {
    const c = chords[i];
    const m = v.map(T.midi);
    const what = `${where} chord ${i} ${c.label}: ${v.map((n) => T.name(n, true)).join(' ')}`;
    assert(m[0] < m[1] && m[1] < m[2] && m[2] < m[3], 'voices out of order: ' + what);
    const r = H.RANGES;
    assert(m[0] >= r.bass[0] && m[0] <= r.bass[1], 'bass range: ' + what);
    assert(m[1] >= r.tenor[0] && m[1] <= r.tenor[1], 'tenor range: ' + what);
    assert(m[2] >= r.alto[0] && m[2] <= r.alto[1], 'alto range: ' + what);
    assert(m[3] >= r.soprano[0] && m[3] <= r.soprano[1], 'soprano range: ' + what);
    const tonePcs = c.tones.map(T.pc);
    v.forEach((n) => assert(tonePcs.includes(T.pc(n)), 'non-chord tone: ' + what));
    assert.strictEqual(T.pc(v[0]), T.pc(c.tones[c.inv]), 'wrong bass for inversion: ' + what);
    assert(v.some((n) => T.pc(n) === tonePcs[1]), 'missing third: ' + what);
    if (c.tones.length === 4) assert(v.some((n) => T.pc(n) === tonePcs[3]), 'missing seventh: ' + what);
    if (c.deg === 4 || c.secondary) assert(v.filter((n) => T.pc(n) === lt).length <= 1 || c.secondary, 'doubled leading tone: ' + what);
    if (i > 0) assert.strictEqual(H.parallelPenalty(voices[i - 1], v), 0, 'parallel 5ths/8ves into ' + what);
  });
}

check('generated progressions follow tonic-predominant-dominant grammar and voice-lead cleanly', () => {
  const r = rng(42);
  const pools = [
    ['I', 'IV', 'V'],
    ['I', 'ii', 'IV', 'V', 'V7', 'vi'],
    ['I', 'I6', 'ii6', 'IV', 'IV6', 'V', 'V6', 'V7', 'V6/5', 'V4/3', 'vi', 'I6/4', 'vii°6'],
    ['I', 'ii', 'IV', 'V', 'V7', 'vi', 'V/V', 'V7/V', 'V/vi', 'V7/IV'],
  ];
  let n = 0;
  for (const pool of pools) {
    for (const k of T.allKeys('major', 5).concat(T.allKeys('minor', 4))) {
      for (let t = 0; t < 6; t++) {
        const len = 4 + Math.floor(r() * 3);
        const ids = H.makeProgression(pool, len, r);
        const where = `${T.keyName(k)} [${ids.join(' ')}]`;
        assert.strictEqual(ids.length, len, 'length: ' + where);
        assert.strictEqual(ids[0], 'I', 'start: ' + where);
        assert.strictEqual(ids[len - 1], 'I', 'end: ' + where);
        assert.strictEqual(H.FUNCTION[ids[len - 2]], 'D', 'penultimate dominant: ' + where);
        ids.forEach((id) => assert(pool.includes(id), 'outside pool: ' + where));
        const chords = ids.map((id) => H.chord(k, id));
        checkVoicing(k, chords, H.voiceLead(k, chords), where);
        n++;
      }
    }
  }
  console.log('     (' + n + ' progressions)');
});

check('cadence phrases end the right way', () => {
  const r = rng(7);
  for (const k of [T.key('C'), T.key('A', 'minor'), T.key('Bb'), T.key('E')]) {
    for (const type of Object.keys(H.CADENCES)) {
      for (let t = 0; t < 5; t++) {
        const p = H.cadencePhrase(k, type, r);
        const last = p.voices[p.voices.length - 1];
        const where = `${T.keyName(k)} ${type} [${p.ids.join(' ')}]`;
        checkVoicing(k, p.chords, p.voices, where);
        if (type === 'PAC') assert.strictEqual(T.pc(last[3]), T.pc(k.tonic), 'PAC soprano on do: ' + where);
        if (type === 'IAC') assert.notStrictEqual(T.pc(last[3]), T.pc(k.tonic), 'IAC soprano not on do: ' + where);
        if (type === 'HC') assert.strictEqual(p.ids[p.ids.length - 1], 'V');
        if (type === 'DC') assert.strictEqual(p.ids[p.ids.length - 1], 'vi');
      }
    }
  }
});

check('every mode has an establishing progression', () => {
  for (const mode of Object.keys(T.MODES)) {
    for (const k of T.allKeys(mode, 3)) {
      const v = H.establishing(k);
      assert(v.length >= 3 && v.every((c) => c.length === 4), mode);
    }
  }
});

check('modulations voice-lead cleanly and land in the new key', () => {
  const r = rng(11);
  for (const k of T.allKeys('major', 4)) {
    for (const target of Object.keys(H.MODULATIONS)) {
      for (let t = 0; t < 3; t++) {
        const m = H.modulation(k, target, r);
        const where = `${T.keyName(k)} -> ${target} [${m.chords.map((c) => c.label).join(' ')}]`;
        // chords carry their own key, so check each against its key
        m.voices.forEach((v, i) => {
          const c = m.chords[i];
          if (i > 0) assert.strictEqual(H.parallelPenalty(m.voices[i - 1], v), 0, 'parallels into ' + c.label + ': ' + where);
          v.forEach((n) => assert(c.tones.map(T.pc).includes(T.pc(n)), 'non-chord tone: ' + where));
        });
        const last = m.voices[m.voices.length - 1];
        assert.strictEqual(T.pc(last[0]), T.pc(m.to.tonic), 'ends on new tonic: ' + where);
        assert.strictEqual(T.pc(last[3]), T.pc(m.to.tonic), 'soprano ends on new do: ' + where);
      }
    }
  }
  assert.strictEqual(H.modulation(T.key('C'), 'V').chords.find((c) => c.label.includes('=')).label, 'vi = ii');
  assert.strictEqual(T.keyName(H.modulation(T.key('C'), 'vi').to), 'A minor');
});

console.log(failures ? `\n${failures} failing` : '\nall passing');
process.exit(failures ? 1 : 0);
