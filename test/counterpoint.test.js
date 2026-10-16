// Run with: node test/counterpoint.test.js
const assert = require('assert');
const T = require('../js/theory.js');
const C = require('../js/counterpoint.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('ok   ' + name); }
  catch (e) { failures++; console.log('FAIL ' + name + ': ' + e.message); }
}
function rng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

check('cantus firmi start and end on do through re, with one climax', () => {
  const r = rng(1);
  for (let t = 0; t < 500; t++) {
    const len = 6 + Math.floor(r() * 4);
    const cf = C.makeCantus(len, r);
    assert.strictEqual(cf.length, len);
    assert.strictEqual(cf[0], 0);
    assert.strictEqual(cf[len - 1], 0);
    assert.strictEqual(cf[len - 2], 1);
    const hi = Math.max(...cf);
    assert.strictEqual(cf.filter((x) => x === hi).length, 1, 'one climax: ' + cf);
    for (let i = 1; i < len; i++) assert(Math.abs(cf[i] - cf[i - 1]) <= 4 && cf[i] !== cf[i - 1], 'motion: ' + cf);
  }
});

check('duets obey first-species rules (re-checked independently)', () => {
  const r = rng(2);
  let made = 0, tried = 0;
  for (const k of T.allKeys('major', 5)) {
    for (const cfAbove of [false, true]) {
      for (let t = 0; t < 12; t++) {
        tried++;
        const len = 6 + Math.floor(r() * 3);
        const cfTonic = T.note(k.tonic.l, k.tonic.acc, cfAbove ? 4 : 3);
        const d = C.makeDuet(k, len, cfAbove, cfTonic, r);
        if (!d) continue;
        made++;
        const where = `${T.keyName(k)} upper ${d.upper.map((n) => T.name(n, true)).join(' ')} / lower ${d.lower.map((n) => T.name(n, true)).join(' ')}`;
        const ivs = d.upper.map((u, i) => T.interval(d.lower[i], u));
        ivs.forEach((iv, i) => {
          assert(T.midi(d.upper[i]) >= T.midi(d.lower[i]), 'crossing: ' + where);
          assert(['P1', 'm3', 'M3', 'P5', 'm6', 'M6', 'P8', 'm10', 'M10', 'P12'].includes(iv.id), `dissonance ${iv.id} at ${i}: ` + where);
        });
        assert(['P1', 'P5', 'P8', 'P12'].includes(ivs[0].id), 'start: ' + where);
        assert(['P1', 'P8'].includes(ivs[len - 1].id), 'end: ' + where);
        for (let i = 1; i < len; i++) {
          const s0 = (T.midi(d.upper[i - 1]) - T.midi(d.lower[i - 1])) % 12;
          const s1 = (T.midi(d.upper[i]) - T.midi(d.lower[i])) % 12;
          const moved = T.midi(d.upper[i]) !== T.midi(d.upper[i - 1]) || T.midi(d.lower[i]) !== T.midi(d.lower[i - 1]);
          assert(!((s1 === 0 || s1 === 7) && s0 === s1 && moved), 'parallels at ' + i + ': ' + where);
          for (const part of [d.upper, d.lower]) {
            const mv = T.interval(part[i - 1], part[i]);
            assert(!['A', 'd'].includes(mv.id[0]), `melodic ${mv.id}: ` + where);
          }
        }
        // the line ends ti -> do
        const cp = d.cp;
        assert.strictEqual(T.midi(cp[len - 1]) - T.midi(cp[len - 2]), 1, 'leading tone: ' + where);
      }
    }
  }
  console.log('     (' + made + ' of ' + tried + ' duets generated)');
  assert(made / tried > 0.95, 'generator should almost always succeed');
});

console.log(failures ? `\n${failures} failing` : '\nall passing');
process.exit(failures ? 1 : 0);
