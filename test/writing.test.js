// Run with: node test/writing.test.js
const assert = require('assert');
const T = require('../js/theory.js');
const H = require('../js/harmony.js');
const P = require('../js/partwriting.js');
const N = require('../js/nct.js');
const Ph = require('../js/phrase.js');
const CP = require('../js/counterpoint.js');
const fs = require('fs');
const path = require('path');

// The course data, as the browser sees it.
const Curriculum = (() => {
  const r = {};
  (function () { eval(fs.readFileSync(path.join(__dirname, '../js/curriculum.js'), 'utf8')); }).call(r);
  return r.Curriculum;
})();
const lessonsOf = (engine) => Curriculum.UNITS.flatMap((u) => u.lessons).filter((l) => l.engine === engine);
const keysOf = (spec) => T.allKeys(spec.mode || 'major', spec.max);

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('ok   ' + name); }
  catch (e) { failures++; console.log('FAIL ' + name + ': ' + e.message); }
}

function rng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

const keys = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Ab'].map((t) => T.key(t));
const v = (k, ids, s) => {
  const chords = ids.map((id) => H.chord(k, id));
  return { chords, voices: s.map((row) => row.split(' ').map(T.parse)) };
};

// ---------- Partwriting checker ----------
check('checker finds the textbook mistakes', () => {
  const C = T.key('C');
  const rules = (ids, s) => { const x = v(C, ids, s); return P.errors(C, x.chords, x.voices).map((e) => e.rule).sort(); };
  // I-V with parallel 5ths between bass and soprano (C-G to G-D)
  assert.deepStrictEqual(rules(['I', 'V'], ['C3 E4 C5 G5', 'G3 D4 B4 D6']).filter((r) => r === 'par5'), ['par5']);
  // a clean I-IV-V-I
  assert.deepStrictEqual(rules(['I', 'IV', 'V', 'I'], ['C3 G3 E4 C5', 'F3 A3 F4 C5', 'G3 G3 D4 B4', 'C3 G3 E4 C5']), []);
  // V-I with ti in the soprano falling to sol
  assert.deepStrictEqual(rules(['V', 'I'], ['G3 G3 D4 B4', 'C3 G3 E4 G4']), ['ltRes']);
  // V7-I with the 7th (F) leaping up
  assert(rules(['V7', 'I'], ['G2 F3 D4 B4', 'C3 G3 E4 C5']).includes('sevRes'));
  // spacing, missing third, doubled leading tone
  assert(rules(['I', 'I'], ['C3 G3 C4 E5', 'C3 G3 C4 E5']).includes('spacing'));
  assert(rules(['I'], ['C3 G3 C4 G4']).includes('noThird'));
  assert(rules(['V'], ['G2 B3 D4 B4']).includes('ltDouble'));
  // the workbook's single-chord errors (Exercises III.1.3)
  assert.deepStrictEqual(rules(['I'], ['C3 E3 G3 E4']), ['dbl3']);
  assert.deepStrictEqual(rules(['vii°6'], ['D3 F3 B3 F4']), ['dimDouble']);
  assert.deepStrictEqual(rules(['I6/4'], ['G2 C4 E4 C5']), ['dbl64']);
  // V-vi may double vi's third; V's own third is the leading tone, flagged as ltDouble only
  assert.deepStrictEqual(rules(['V', 'vi'], ['G2 G3 D4 B4', 'A2 E3 C4 C5']), []);
  assert.deepStrictEqual(rules(['V'], ['G2 B3 D4 B4']), ['ltDouble']);
  // and its melodic errors: a 7th in the bass, an augmented 2nd in minor
  assert(rules(['ii', 'I'], ['D3 F3 A3 D4', 'C4 E4 G4 C5']).includes('leap'));
  const a = T.key('A', 'minor');
  const am = (ids, s) => { const x = v(a, ids, s); return P.errors(a, x.chords, x.voices).map((e) => e.rule); };
  assert(am(['IV', 'V'], ['D3 F3 A3 D4', 'E3 G#3 B3 E4']).includes('augmented'));
});

check('voiceLead’s cadence progressions pass the checker', () => {
  const r = rng(11);
  let clean = 0, total = 0;
  for (const k of keys) {
    for (let i = 0; i < 30; i++) {
      const ids = H.makeProgression(['I', 'ii', 'IV', 'V', 'vi', 'I6', 'ii6'], 4 + (i % 3), r);
      const chords = ids.map((id) => H.chord(k, id));
      const voices = H.voiceLead(k, chords);
      total++;
      if (!P.errors(k, chords, voices).length) clean++;
    }
  }
  // the engines regenerate the rare unclean one; most must come out clean
  assert(clean / total > 0.7, clean + '/' + total);
});

check('faulty connections break exactly the asked-for rule', () => {
  const r = rng(5);
  const pairs = [['I', 'IV'], ['I', 'V'], ['IV', 'V'], ['V', 'I'], ['ii', 'V'], ['I', 'vi'], ['V', 'vi'], ['ii6', 'V'],
    ['V7', 'I'], ['V7', 'vi'], ['ii7', 'V'], ['V6/5', 'I'], ['V4/3', 'I'], ['V4/2', 'I6']];
  for (const rule of [null, 'range', 'spacing', 'noThird', 'ltDouble', 'par5', 'par8', 'ltRes', 'sevRes']) {
    let made = 0;
    for (const k of keys) {
      // the leading-tone rule needs a dominant going home
      const x = P.faultyConnection(k, rule === 'ltRes' ? [['V', 'I'], ['V6', 'I'], ['V', 'I6']] : pairs, rule, r);
      if (!x) continue;
      made++;
      assert.deepStrictEqual(P.errors(k, x.chords, x.clean), [], 'clean version is clean');
      const errs = P.errors(k, x.chords, x.voices);
      if (!rule) assert.strictEqual(errs.length, 0);
      else {
        assert.strictEqual(errs.length, 1, rule + ' in ' + T.keyName(k) + ': ' + JSON.stringify(errs));
        assert.strictEqual(errs[0].rule, rule);
      }
      // the bass keeps each chord's inversion
      x.chords.forEach((c, i) => assert.strictEqual(T.pc(x.voices[i][0]), T.pc(c.tones[c.inv])));
    }
    assert(made >= keys.length - 2, rule + ': only ' + made);
  }
});

// ---------- Non-chord tones ----------
check('every non-chord tone is approached and left the way its name says', () => {
  const r = rng(7);
  for (const type of Object.keys(N.TYPES)) {
    for (const k of keys) {
      for (let n = 0; n < 6; n++) {
        const ex = N.example(k, type, r);
        assert(ex, type + ' in ' + T.keyName(k));
        const line = ex.line;
        const j = line.findIndex((e) => e.nct);
        assert(j > 0 && j < line.length - 1, 'one NCT inside the line');
        assert.strictEqual(line.filter((e) => e.nct).length, 1);
        const before = line[j - 1].n, it = line[j].n, after = line[j + 1].n;
        const inStep = T.step(it) - T.step(before), outStep = T.step(after) - T.step(it);
        // what it sounds against: the chord whose column it sits in
        const chord = ex.chords[Math.floor(line[j].col / 2)];
        assert(!N.inChord(it, chord), type + ': ' + T.name(it) + ' is a chord tone of ' + chord.label);
        // written with the key signature, nothing chromatic
        assert.strictEqual(it.acc, T.sigAcc(T.fifths(k), it.l));
        for (const [a, b] of [[before, it], [it, after]]) {
          assert(!/^[Ad]/.test(T.interval(a, b).id), 'no augmented/diminished melodic interval');
        }
        const where = `${type} ${T.keyName(k)} ${line.map((e) => T.name(e.n, true)).join(' ')}`;
        switch (type) {
          case 'PT': assert(Math.abs(inStep) === 1 && inStep === outStep, where); break;
          case 'NT': assert(Math.abs(inStep) === 1 && outStep === -inStep, where); break;
          case 'ANT': assert(Math.abs(inStep) === 1 && T.same(it, after), where); break;
          case 'ET': assert(Math.abs(inStep) === 1 && Math.abs(outStep) === 2 && outStep * inStep < 0, where); break;
          case 'APP': assert(Math.abs(inStep) >= 2 && Math.abs(outStep) === 1 && outStep * inStep < 0, where); break;
          case 'SUS':
            assert(T.same(before, it) && line[j - 1].tie && outStep === -1, where);
            assert(['4–3', '7–6', '9–8'].includes(ex.figure), where);
            break;
          case 'RET': assert(T.same(before, it) && line[j - 1].tie && outStep === 1, where); break;
        }
        if (N.ACCENTED[type]) assert.strictEqual(line[j].col % 2, 0, 'accented: on the beat');
        else assert.strictEqual(line[j].col % 2, 1, 'unaccented: off the beat');
      }
    }
  }
});

check('soprano timing merges ties and fills every beat', () => {
  const ex = N.example(T.key('C'), 'SUS', rng(3));
  const times = N.sopranoTimes(ex.line);
  assert.strictEqual(times[0].start, 0);
  assert.strictEqual(times[times.length - 1].end, ex.chords.length);
  for (let i = 1; i < times.length; i++) assert.strictEqual(times[i].start, times[i - 1].end);
  assert.strictEqual(times.length, ex.line.length - 1);
});

// ---------- Phrases and periods ----------
check('phrases end on their cadence and stay singable', () => {
  const r = rng(9);
  for (let i = 0; i < 300; i++) {
    const cad = i % 2 ? 'PAC' : 'HC';
    const p = Ph.phrase(cad, 8, r);
    assert.strictEqual(p.length, 8);
    const last = ((p[7] % 7) + 7) % 7;
    if (cad === 'PAC') assert.strictEqual(last, 0, p.join());
    else assert([1, 4, 6].includes(last), p.join());
    assert.strictEqual(Math.abs(p[7] - p[6]), 1, 'cadence approached by step: ' + p.join());
    assert(Math.max(...p) - Math.min(...p) <= 9);
  }
});

check('periods: weaker then stronger cadence; parallel reuses the opening', () => {
  const r = rng(13);
  const strength = { HC: 0, PAC: 1 };
  for (const kind of ['parallel', 'contrasting', 'none']) {
    for (let i = 0; i < 100; i++) {
      const pd = Ph.period(kind, 8, r);
      const [a, b] = pd.phrases;
      const stronger = strength[pd.cadences[1]] > strength[pd.cadences[0]];
      if (kind === 'none') assert(!stronger, pd.cadences.join());
      else assert(stronger && pd.cadences[0] === 'HC', pd.cadences.join());
      if (kind === 'parallel') assert.deepStrictEqual(a.slice(0, 4), b.slice(0, 4));
      if (kind === 'contrasting') assert(Ph.different(a, b, 4), a.join() + ' | ' + b.join());
    }
  }
});

// ---------- Every lesson as configured ----------
check('every spotError lesson can make every one of its rules in every key', () => {
  const r = rng(21);
  for (const l of lessonsOf('spotError')) {
    for (const rule of l.rules.concat([null])) {
      for (const k of keysOf(l.keys)) {
        let x = null;
        for (let t = 0; t < 3 && !x; t++) x = P.faultyConnection(k, l.pairs, rule, r);
        assert(x, `${l.id}: ${rule} in ${T.keyName(k)}`);
        const errs = P.errors(k, x.chords, x.voices);
        // spelling and notation are seen, not heard: the checker finds nothing
        const seen = rule === 'spelling' || rule === 'notation';
        assert.strictEqual(errs.length, rule && !seen ? 1 : 0, `${l.id}: ${rule}`);
        if (seen) assert.strictEqual(x.error.rule, rule);
      }
    }
  }
});

check('every cpError lesson can break each of its rules, once', () => {
  const r = rng(23);
  for (const l of lessonsOf('cpError')) {
    for (const rule of l.rules.concat(['none'])) {
      for (const k of keysOf(l.keys)) {
        const x = CP.brokenDuet(k, l.length, rule, r);
        assert(x, `${l.id}: ${rule} in ${T.keyName(k)}`);
        const vs = CP.violations(x.duet.cf, x.duet.cp, x.above);
        assert.strictEqual(vs.length, rule === 'none' ? 0 : 1, `${l.id}: ${rule} ${JSON.stringify(vs)}`);
        assert.deepStrictEqual(CP.violations(x.fixed.cf, x.fixed.cp, x.above), [], 'the fix is clean');
      }
    }
  }
});

check('every NCT and singVoice lesson generates in every key', () => {
  const r = rng(29);
  for (const l of lessonsOf('readNCT').concat(lessonsOf('earNCT'), lessonsOf('singNCT'))) {
    for (const type of l.types) for (const k of keysOf(l.keys)) assert(N.example(k, type, r), `${l.id} ${type} ${T.keyName(k)}`);
  }
  for (const l of lessonsOf('singVoice')) {
    for (const k of keysOf(l.keys)) {
      let clean = false;
      for (let t = 0; t < 20 && !clean; t++) {
        const chords = H.makeProgression(l.chords, l.length, r).map((id) => H.chord(k, id));
        clean = !P.errors(k, chords, H.voiceLead(k, chords)).length;
      }
      assert(clean, `${l.id} ${T.keyName(k)}`);
    }
  }
});

check('function lessons only use chords with a function', () => {
  for (const l of lessonsOf('readNumeral').concat(lessonsOf('dictation')).filter((x) => x.askFunction || x.functions)) {
    for (const id of l.chords) assert(['T', 'PD', 'D', 'CAD'].includes(H.FUNCTION[id]), l.id + ' ' + id);
  }
});

if (failures) { console.log(failures + ' failed'); process.exit(1); }
