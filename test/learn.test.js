// Run with: node test/learn.test.js
const assert = require('assert');
const T = require('../js/theory.js');
const H = require('../js/harmony.js');
const P = require('../js/partwriting.js');
const N = require('../js/nct.js');
const L = require('../js/learn.js');
const fs = require('fs');
const path = require('path');

const Curriculum = (() => {
  const r = {};
  (function () { eval(fs.readFileSync(path.join(__dirname, '../js/curriculum.js'), 'utf8')); }).call(r);
  return r.Curriculum;
})();
const lessons = Curriculum.UNITS.flatMap((u) => u.lessons);

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('ok   ' + name); }
  catch (e) { failures++; console.log('FAIL ' + name + ': ' + e.message); }
}

function keyOf(spec) {
  const [tonic, mode] = spec.split(' ');
  return T.key(tonic, mode || 'major');
}

check('lesson ids are unique', () => {
  const seen = {};
  lessons.forEach((l) => { assert(!seen[l.id], 'duplicate ' + l.id); seen[l.id] = 1; });
});

check('every learn card opens a page, and every page has a card', () => {
  const cards = lessons.filter((l) => l.engine === 'learn');
  cards.forEach((l) => assert(L.find(l.page) && !L.find(l.page).section, l.id + ' -> ' + l.page));
  L.PAGES.forEach((p) => assert(cards.some((l) => l.page === p.id), 'no card for ' + p.id));
});

check('every exercise link resolves to a section', () => {
  lessons.filter((l) => l.learn).forEach((l) => assert(L.find(l.learn), l.id + ' -> ' + l.learn));
});

check('every rule, non-chord tone and cadence has a section', () => {
  Object.keys(P.RULES).forEach((r) => assert(L.find(L.LINKS.rule[r]), 'rule ' + r));
  Object.keys(N.TYPES).forEach((t) => assert(L.find(L.LINKS.nct[t]), 'nct ' + t));
  Object.keys(H.CADENCES).forEach((c) => assert(L.find(L.LINKS.cadence[c]), 'cadence ' + c));
  ['function#root-motion', 'connecting-1#roots', 'function#categories'].forEach((r) => assert(L.find(r), r));
});

check('every term points to a section and its pattern compiles', () => {
  Object.keys(L.TERMS).forEach((id) => {
    const t = L.TERMS[id];
    assert(L.find(t.see) && L.find(t.see).section, id + ' -> ' + t.see);
    assert(new RegExp(t.match, 'i'), id);
  });
});

check('section ids are unique within a page', () => {
  L.PAGES.forEach((p) => {
    const ids = p.sections.map((s) => s.id);
    assert.strictEqual(new Set(ids).size, ids.length, p.id);
  });
});

// Examples captioned "Wrong" must break a rule; the rest must be clean.
check('examples break rules only where the caption says so', () => {
  L.PAGES.forEach((p) => p.sections.forEach((s) => (s.examples || []).forEach((ex) => {
    if (ex.nct || !ex.chords) return;
    const k = keyOf(ex.key);
    const chords = ex.chords.map((id) => H.chord(k, id));
    const voices = ex.voices ? ex.voices.map((v) => v.map(T.parse))
      : H.voiceLead(k, chords, ex.end != null ? { sopranoEnd: T.pc(T.degreeNote(k, ex.end, 0, 4)) } : {});
    const errs = P.errors(k, chords, voices).map((e) => e.rule);
    const wrong = /^Wrong|gap of more than an octave/.test(ex.caption || '');
    assert(wrong ? errs.length : !errs.length, p.id + '#' + s.id + ' ' + ex.chords.join('-') + ': ' + errs.join(','));
  })));
});

check('non-chord-tone examples can be made in C', () => {
  L.PAGES.forEach((p) => p.sections.forEach((s) => (s.examples || []).filter((ex) => ex.nct).forEach((ex) => {
    let n = null;
    for (let i = 0; !n && i < 20; i++) n = N.example(keyOf(ex.key), ex.nct);
    assert(n, p.id + '#' + s.id);
  })));
});

check('vii° in minor is built on the leading tone', () => {
  ['A', 'C', 'E', 'G#', 'Bb'].forEach((t) => {
    const k = T.key(t, 'minor');
    const lt = T.pc(T.transpose(k.tonic, 'm2', false));
    assert.strictEqual(T.pc(H.chord(k, 'vii°').root), lt, t + ' minor vii°');
    assert.strictEqual(T.pc(H.chord(k, 'vii7').root), lt, t + ' minor vii°7');
    assert.strictEqual(H.chord(k, 'vii°').type, 'dim');
    assert.strictEqual(H.chord(k, 'vii7').type, 'dim7');
  });
});

check('Phrygian cadences: iv6–V, bass down a half step, clean voice leading', () => {
  T.allKeys('minor', 5).forEach((k) => {
    for (let i = 0; i < 6; i++) {
      const ph = H.cadencePhrase(k, 'Ph');
      const n = ph.chords.length;
      assert.deepStrictEqual(ph.chords.slice(-2).map((c) => c.label), ['iv6', 'V'], T.name(k.tonic));
      const v = ph.voices;
      assert.strictEqual(T.midi(v[n - 2][0]) - T.midi(v[n - 1][0]), 1, 'bass le-sol in ' + T.name(k.tonic));
      assert.deepStrictEqual(P.errors(k, ph.chords, v), [], T.name(k.tonic) + ' minor');
      // the bass of iv6 (le) is not doubled
      const le = T.pc(v[n - 2][0]);
      assert.strictEqual(v[n - 2].filter((x) => T.pc(x) === le).length, 1, 'le doubled in ' + T.name(k.tonic));
    }
  });
});

check('deceptive cadences in minor double the third of VI, no bass 7ths', () => {
  T.allKeys('minor', 5).forEach((k) => {
    for (let i = 0; i < 6; i++) {
      const dc = H.cadencePhrase(k, 'DC');
      const n = dc.chords.length, v = dc.voices;
      const third = T.pc(dc.chords[n - 1].tones[1]);
      assert.strictEqual(v[n - 1].filter((x) => T.pc(x) === third).length, 2, 'third not doubled in ' + T.name(k.tonic));
      assert.deepStrictEqual(P.errors(k, dc.chords, v), [], T.name(k.tonic) + ' minor');
      for (let j = 1; j < n; j++) {
        const leap = Math.abs(T.midi(v[j][0]) - T.midi(v[j - 1][0]));
        assert(leap !== 10 && leap !== 11, 'bass 7th in ' + T.name(k.tonic) + ' minor');
      }
    }
  });
});

check('the new connection pools give every rule they drill', () => {
  lessons.filter((l) => l.engine === 'spotError').forEach((l) => {
    l.rules.forEach((r) => {
      let ok = false;
      for (let i = 0; !ok && i < 20; i++) ok = !!P.faultyConnection(T.key('D'), l.pairs, r);
      assert(ok, l.id + ' cannot make ' + r);
    });
  });
});

if (failures) { console.log(failures + ' failed'); process.exit(1); }
