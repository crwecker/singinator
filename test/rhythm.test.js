// Run with: node test/rhythm.test.js
const assert = require('assert');
const R = require('../js/rhythm.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('ok   ' + name); }
  catch (e) { failures++; console.log('FAIL ' + name + ': ' + e.message); }
}
function rng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

check('generated rhythms fill every measure exactly', () => {
  const r = rng(3);
  let n = 0;
  for (const ts of Object.keys(R.TIME)) {
    for (let level = 1; level <= 4; level++) {
      for (let t = 0; t < 60; t++) {
        const measures = 1 + Math.floor(r() * 4);
        const ev = R.makeRhythm(ts, measures, level, r);
        const where = `${ts} L${level}: ${ev.map((e) => (e.rest ? 'r' : '') + e.dur + (e.tie ? '~' : '')).join(' ')}`;
        const per = {};
        ev.forEach((e) => { per[e.measure] = (per[e.measure] || 0) + e.dur; });
        for (let m = 0; m < measures; m++) assert(Math.abs(per[m] - R.TIME[ts].measure) < 1e-9, 'measure ' + m + ' sums wrong: ' + where);
        assert(!ev[0].rest, 'starts with a rest: ' + where);
        assert(!ev[ev.length - 1].rest && !ev[ev.length - 1].tie, 'ends badly: ' + where);
        let t0 = 0;
        ev.forEach((e) => { assert(Math.abs(e.start - t0) < 1e-9, 'start times: ' + where); t0 += e.dur; });
        // nothing crosses a barline
        ev.forEach((e) => {
          const ms = R.TIME[ts].measure;
          assert(Math.floor(e.start / ms + 1e-9) === Math.floor((e.start + e.dur) / ms - 1e-9), 'crosses barline: ' + where);
        });
        n++;
      }
    }
  }
  console.log('     (' + n + ' rhythms)');
});

check('levels introduce their material', () => {
  const r = rng(5);
  const all = (ts, level) => {
    const durs = new Set();
    for (let t = 0; t < 200; t++) R.makeRhythm(ts, 2, level, r).forEach((e) => durs.add((e.rest ? 'r' : '') + e.dur));
    return durs;
  };
  const l1 = all('4/4', 1);
  assert(![...l1].some((d) => d === '0.5' || d.startsWith('r')), 'level 1 is quarters, halves, wholes only');
  assert(all('4/4', 2).has('0.5'), 'level 2 has eighths');
  assert(all('4/4', 3).has('1.5'), 'level 3 has dotted quarters');
  assert(all('4/4', 4).has('0.25'), 'level 4 has sixteenths');
  assert(all('6/8', 1).has('1.5'), '6/8 has dotted quarters');
});

check('onsets skip rests and tied notes', () => {
  const ev = [
    { dur: 0.5, start: 0 }, { dur: 0.5, start: 0.5, tie: true }, { dur: 0.5, start: 1 },
    { dur: 0.5, start: 1.5, rest: true }, { dur: 2, start: 2 },
  ];
  assert.deepStrictEqual(R.onsets(ev).map((o) => o.at), [0, 0.5, 2]);
});

check('tap scoring removes constant latency and catches misses/extras', () => {
  const r = rng(9);
  const expected = [0, 0.5, 1, 1.25, 1.5, 2.5, 3];
  const jitter = () => (r() - 0.5) * 0.04;
  // everything 140 ms late (Bluetooth) with ±20 ms jitter: all hits
  let s = R.scoreTaps(expected, expected.map((e) => e + 0.14 + jitter()), 0.07);
  assert(s.hits.every(Boolean), 'late but steady should pass: ' + JSON.stringify(s));
  assert(Math.abs(s.offset - 0.14) < 0.03);
  assert.strictEqual(s.extras, 0);
  // a missing tap
  const missing = expected.filter((_, i) => i !== 3).map((e) => e + 0.05);
  s = R.scoreTaps(expected, missing, 0.07);
  assert.deepStrictEqual(s.hits.map(Number), [1, 1, 1, 0, 1, 1, 1]);
  // an extra tap
  s = R.scoreTaps(expected, expected.concat([2.0]), 0.07);
  assert.strictEqual(s.extras, 1);
  // a rushed note
  const rushed = expected.slice();
  rushed[5] -= 0.2;
  s = R.scoreTaps(expected, rushed, 0.07);
  assert.strictEqual(s.hits[5], false);
});

console.log(failures ? `\n${failures} failing` : '\nall passing');
process.exit(failures ? 1 : 0);
