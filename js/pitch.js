// Pitch detection and note math. Pure functions: no DOM, no Web Audio.
// Works as a browser global (window.Pitch) and as a Node module (for tests).
(function (root) {
  'use strict';

  // YIN pitch detector (de Cheveigné & Kawahara, 2002).
  // Returns { hz, clarity } or null when there is no clear pitch.
  function detectPitch(buf, sampleRate, opts) {
    opts = opts || {};
    var minHz = opts.minHz || 65; // low enough for basses (C2)
    var maxHz = opts.maxHz || 1100;
    var threshold = opts.threshold || 0.2;
    var fallback = opts.fallback || 0.35; // accept the best dip if nothing beats threshold
    // Low on purpose: with auto-gain off, laptop mics hear singing very quietly.
    var minRms = opts.minRms == null ? 0.002 : opts.minRms;

    var n = buf.length;
    var rms = 0;
    for (var i = 0; i < n; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / n);
    if (rms < minRms) return null;

    var tauMin = Math.max(2, Math.floor(sampleRate / maxHz));
    var tauMax = Math.min(Math.floor(sampleRate / minHz), Math.floor(n / 2));
    var w = n - tauMax;

    // Difference function, then cumulative mean normalized difference.
    var d = new Float32Array(tauMax + 1);
    for (var tau = 1; tau <= tauMax; tau++) {
      var sum = 0;
      for (var j = 0; j < w; j++) {
        var diff = buf[j] - buf[j + tau];
        sum += diff * diff;
      }
      d[tau] = sum;
    }
    var cmnd = new Float32Array(tauMax + 1);
    cmnd[0] = 1;
    var running = 0;
    for (tau = 1; tau <= tauMax; tau++) {
      running += d[tau];
      cmnd[tau] = running > 0 ? (d[tau] * tau) / running : 1;
    }

    // First dip below the threshold, walked down to its local minimum.
    var best = -1;
    for (tau = tauMin; tau <= tauMax; tau++) {
      if (cmnd[tau] < threshold) {
        while (tau + 1 <= tauMax && cmnd[tau + 1] < cmnd[tau]) tau++;
        best = tau;
        break;
      }
    }
    // Breathy or noisy voices may never dip below the threshold; take the
    // deepest dip if it is still clearly periodic.
    if (best < 0) {
      var lowest = 1;
      for (tau = tauMin; tau <= tauMax; tau++) {
        if (cmnd[tau] < lowest) lowest = cmnd[tau];
      }
      if (lowest > fallback) return null;
      // Multiples of the true period dip just as deep, so take the first one.
      for (tau = tauMin; tau <= tauMax; tau++) {
        if (cmnd[tau] <= lowest + 0.08) {
          while (tau + 1 <= tauMax && cmnd[tau + 1] < cmnd[tau]) tau++;
          best = tau;
          break;
        }
      }
    }

    // Parabolic interpolation for sub-sample accuracy.
    var t = best;
    if (t > 1 && t < tauMax) {
      var a = cmnd[t - 1], b = cmnd[t], c = cmnd[t + 1];
      var denom = a - 2 * b + c;
      if (denom !== 0) t = t + (a - c) / (2 * denom);
    }
    return { hz: sampleRate / t, clarity: 1 - cmnd[best], rms: rms };
  }

  function hzToMidi(hz) {
    return 69 + 12 * Math.log2(hz / 440);
  }

  function midiToHz(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Distance in semitones from target to sung, ignoring octave.
  // Result is in [-6, 6): negative means "sing higher".
  function pitchClassDiff(sungMidi, targetMidi) {
    var d = (sungMidi - targetMidi) % 12;
    if (d < -6) d += 12;
    if (d >= 6) d -= 12;
    return d + 0; // normalize -0
  }

  function median(values) {
    var s = values.slice().sort(function (x, y) { return x - y; });
    var m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  var api = {
    detectPitch: detectPitch,
    hzToMidi: hzToMidi,
    midiToHz: midiToHz,
    pitchClassDiff: pitchClassDiff,
    median: median,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Pitch = api;
})(this);
