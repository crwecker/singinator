// Web Audio: playing reference notes and listening to the microphone.
(function (root) {
  'use strict';

  var ctx = null;
  var analyser = null;
  var buf = null;
  var micStream = null;
  var micSource = null; // held so Firefox doesn't garbage-collect it
  var devOsc = null;
  var quietUntil = 0; // don't listen while (or just after) we play a note

  var LISTEN_GAP = 0.3; // seconds of silence after playback before listening

  function context() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // A soft, music-box-ish tone: triangle + a touch of sine an octave up,
  // scheduled at an absolute AudioContext time. Returns its end time.
  function tone(midi, start, duration, level) {
    var c = context();
    var end = start + duration;
    var hz = Pitch.midiToHz(midi);

    var gain = c.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + 0.02);
    gain.gain.setValueAtTime(level, Math.max(start + 0.03, end - 0.25));
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    gain.connect(c.destination);

    var osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = hz;
    osc.connect(gain);

    var shimmer = c.createOscillator();
    var shimmerGain = c.createGain();
    shimmer.frequency.value = hz * 2;
    shimmerGain.gain.value = 0.15;
    shimmer.connect(shimmerGain).connect(gain);

    osc.start(start); osc.stop(end + 0.05);
    shimmer.start(start); shimmer.stop(end + 0.05);
    return end;
  }

  // A reference note: listening pauses while it sounds, so the app can't
  // hear itself and call it a match.
  function playNote(midi, duration, when, level) {
    var c = context();
    var end = tone(midi, c.currentTime + (when || 0) + 0.02, duration || 0.9, level || 0.35);
    quietUntil = Math.max(quietUntil, end + LISTEN_GAP);
    return end;
  }

  // Accompaniment and rhythm playback at an absolute time. Doesn't pause
  // listening: the student sings along with it.
  function playAt(midi, at, duration, level) {
    return tone(midi, at, duration, level || 0.3);
  }

  // Metronome tick: a short high blip, above the pitch detector's range so
  // it never reads as a sung note.
  function click(at, accent) {
    var c = context();
    var g = c.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(accent ? 0.35 : 0.22, at + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.04);
    g.connect(c.destination);
    var o = c.createOscillator();
    o.frequency.value = accent ? 2200 : 1600;
    o.connect(g);
    o.start(at);
    o.stop(at + 0.05);
  }

  // Woodblock-ish hit for playing a rhythm back.
  function hit(at, accent) {
    var c = context();
    var g = c.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(accent ? 0.5 : 0.38, at + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.12);
    g.connect(c.destination);
    var o = c.createOscillator();
    o.type = 'square';
    o.frequency.value = 820;
    var f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1200;
    o.connect(f).connect(g);
    o.start(at);
    o.stop(at + 0.13);
  }

  function now() { return context().currentTime; }

  // Plays notes (or chords, given as arrays) one after another.
  // onNote(i) fires as each one starts.
  function playSequence(midis, noteLen, onNote) {
    noteLen = noteLen || 0.7;
    context();
    var step = noteLen + 0.12;
    midis.forEach(function (m, i) {
      if (Array.isArray(m)) {
        m.forEach(function (x) { playNote(x, noteLen, i * step, 0.5 / m.length); });
      } else {
        playNote(m, noteLen, i * step);
      }
    });
    return new Promise(function (resolve) {
      midis.forEach(function (m, i) {
        setTimeout(function () { if (onNote) onNote(i); }, i * step * 1000);
      });
      setTimeout(resolve, (midis.length * step + LISTEN_GAP) * 1000);
    });
  }

  function makeAnalyser() {
    var c = context();
    if (!analyser) {
      analyser = c.createAnalyser();
      analyser.fftSize = 4096; // ~85ms: room for bass periods and noisy voices
      buf = new Float32Array(analyser.fftSize);
      // Silent path to the speakers so every browser keeps pulling audio through.
      var mute = c.createGain();
      mute.gain.value = 0;
      analyser.connect(mute).connect(c.destination);
    }
    return analyser;
  }

  // Loopback/streaming drivers show up as mics but carry no voice.
  var VIRTUAL = /blackhole|steam|virtual|loopback|soundflower|aggregate|zoomaudio|teams|krisp|obs/i;

  function openMic(deviceId) {
    // Voice processing smears pitch and squashes held notes, so turn it off.
    var audio = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
    if (deviceId) audio.deviceId = { exact: deviceId };
    return navigator.mediaDevices.getUserMedia({ audio: audio }).then(function (stream) {
      if (micSource) micSource.disconnect();
      if (micStream) micStream.getTracks().forEach(function (t) { t.stop(); });
      micStream = stream;
      micSource = context().createMediaStreamSource(stream);
      micSource.connect(makeAnalyser());
    });
  }

  function listMics() {
    return navigator.mediaDevices.enumerateDevices().then(function (devices) {
      return devices.filter(function (d) { return d.kind === 'audioinput' && d.deviceId !== 'communications'; });
    });
  }

  function currentMicId() {
    var track = micStream && micStream.getAudioTracks()[0];
    return track ? track.getSettings().deviceId : null;
  }

  // preferredId: a mic the user picked before. Otherwise, if the browser's
  // default is a virtual device, switch to the first real microphone.
  function startMic(preferredId) {
    if (micStream || devOsc) return Promise.resolve();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(new Error('no-mic-support'));
    }
    return openMic(preferredId).catch(function (err) {
      if (preferredId) return openMic(); // saved mic was unplugged
      throw err;
    }).then(function () {
      var track = micStream.getAudioTracks()[0];
      if (preferredId || !VIRTUAL.test(track.label)) return;
      return listMics().then(function (mics) {
        var real = mics.filter(function (m) { return !VIRTUAL.test(m.label); });
        var builtIn = real.filter(function (m) { return /built-?in|macbook|internal/i.test(m.label); });
        var pick = builtIn[0] || real[0];
        if (pick) return openMic(pick.deviceId);
      });
    });
  }

  // Dev mode: feed an oscillator into the analyser instead of the mic.
  function startDevTone(hz) {
    var c = context();
    if (!devOsc) {
      devOsc = c.createOscillator();
      devOsc.type = 'sawtooth';
      var g = c.createGain();
      g.gain.value = 0.3;
      devOsc.connect(g).connect(makeAnalyser());
      devOsc.start();
    }
    devOsc.frequency.value = hz;
    devOsc.__on = hz > 0;
  }

  function micReady() {
    return !!(micStream || devOsc);
  }

  // Returns { quiet: true } while we're playing, otherwise { level } with
  // { hz, clarity } added when there's a clear pitch. level is input RMS.
  function readPitch() {
    if (!analyser) return null;
    // Safari can leave the context 'interrupted' after the mic prompt.
    if (ctx.state !== 'running') ctx.resume();
    if (ctx.currentTime < quietUntil) return { quiet: true };
    if (devOsc && !devOsc.__on) return { level: 0 };
    analyser.getFloatTimeDomainData(buf);
    var sum = 0;
    for (var i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    var level = Math.sqrt(sum / buf.length);
    var r = Pitch.detectPitch(buf, ctx.sampleRate);
    if (r && r.clarity > 0.6) { r.level = level; return r; }
    return { level: level };
  }

  function status() {
    var track = micStream && micStream.getAudioTracks()[0];
    return {
      ctx: ctx ? ctx.state : 'none',
      rate: ctx ? ctx.sampleRate : 0,
      mic: track ? track.label + (track.muted ? ' (muted)' : '') + ' ' + track.readyState : devOsc ? 'dev tone' : 'none',
    };
  }

  root.Sound = {
    context: context,
    playNote: playNote,
    playAt: playAt,
    click: click,
    hit: hit,
    now: now,
    playSequence: playSequence,
    startMic: startMic,
    switchMic: openMic,
    listMics: listMics,
    currentMicId: currentMicId,
    startDevTone: startDevTone,
    micReady: micReady,
    readPitch: readPitch,
    status: status,
  };
})(this);
