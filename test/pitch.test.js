// Run with: node test/pitch.test.js
const assert = require('assert');
const { detectPitch, hzToMidi, pitchClassDiff, median } = require('../js/pitch.js');

const SR = 48000;
const N = 4096; // matches the analyser fftSize in sound.js

function wave(hz, shape, amp = 0.5) {
  const buf = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const phase = (i * hz) / SR;
    if (shape === 'sine') buf[i] = amp * Math.sin(2 * Math.PI * phase);
    else if (shape === 'saw') buf[i] = amp * (2 * (phase - Math.floor(phase + 0.5)));
    else if (shape === 'voice') {
      // Harmonic-rich with a weak fundamental: a classic octave-error trap.
      let v = 0;
      const partials = [0.5, 1, 0.8, 0.5, 0.3, 0.2];
      partials.forEach((g, k) => { v += g * Math.sin(2 * Math.PI * phase * (k + 1)); });
      buf[i] = (amp * v) / 3;
    }
  }
  return buf;
}

function cents(a, b) {
  return 1200 * Math.log2(a / b);
}

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('ok   ' + name); }
  catch (e) { failures++; console.log('FAIL ' + name + ': ' + e.message); }
}

for (const hz of [82, 98, 110, 131, 165, 196, 262, 294, 330, 349, 392, 440, 494, 523, 659, 784]) {
  for (const shape of ['sine', 'saw', 'voice']) {
    check(`${shape} ${hz} Hz`, () => {
      const r = detectPitch(wave(hz, shape), SR);
      assert(r, 'no pitch detected');
      // Octave-agnostic matching means a pitch-class match is what counts,
      // but we still want the exact octave on clean signals.
      const off = cents(r.hz, hz);
      assert(Math.abs(off) < 10, `detected ${r.hz.toFixed(1)} Hz (${off.toFixed(1)} cents off)`);
    });
  }
}

// Real laptop mics with auto-gain off: quiet voice plus room noise.
function noisyVoice(hz, voiceAmp, noiseAmp) {
  const buf = wave(hz, "voice", voiceAmp);
  let seed = 7;
  for (let i = 0; i < N; i++) {
    seed = (seed * 16807) % 2147483647;
    buf[i] += (seed / 2147483647 - 0.5) * 2 * noiseAmp;
  }
  return buf;
}

for (const hz of [262, 330, 392, 523]) {
  check(`quiet noisy voice ${hz} Hz`, () => {
    const r = detectPitch(noisyVoice(hz, 0.012, 0.004), SR);
    assert(r, "no pitch detected");
    assert(Math.abs(cents(r.hz, hz)) < 15, `detected ${r.hz.toFixed(1)} Hz`);
  });
}

check('silence returns null', () => {
  assert.strictEqual(detectPitch(new Float32Array(N), SR), null);
});

check('white noise returns null', () => {
  const buf = new Float32Array(N);
  let seed = 1;
  for (let i = 0; i < N; i++) {
    seed = (seed * 16807) % 2147483647;
    buf[i] = (seed / 2147483647 - 0.5) * 0.6;
  }
  assert.strictEqual(detectPitch(buf, SR), null);
});

check('pitchClassDiff ignores octaves', () => {
  assert.strictEqual(pitchClassDiff(72, 60), 0);
  assert.strictEqual(pitchClassDiff(48, 60), 0);
  assert.strictEqual(pitchClassDiff(59, 60), -1);
  assert.strictEqual(pitchClassDiff(71, 60), -1); // B4 is just under high C
  assert.strictEqual(pitchClassDiff(61.5, 60), 1.5);
});

check('hzToMidi', () => {
  assert(Math.abs(hzToMidi(261.63) - 60) < 0.01);
});

check('median', () => {
  assert.strictEqual(median([3, 1, 2]), 2);
  assert.strictEqual(median([4, 1, 3, 2]), 2.5);
});

console.log(failures ? `\n${failures} failing` : '\nall passing');
process.exit(failures ? 1 : 0);
