// Everything is synthesised with WebAudio, so the game ships no audio files.
let ctx = null;
let master = null;
let ambience = null;
let enabled = true;

function noiseBuffer(seconds = 1, brown = false) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return buf;
}

export function init() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = enabled ? 0.9 : 0;
  master.connect(ctx.destination);
}

export function setEnabled(on) {
  enabled = on;
  if (master) master.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.05);
}

function env(gain, t, peak, attack, decay) {
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function burst(t, { freq = 2000, q = 1, peak = 0.3, decay = 0.05, type = 'bandpass' } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(0.3);
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  env(g, t, peak, 0.002, decay);
  src.connect(f).connect(g).connect(master);
  src.start(t); src.stop(t + decay + 0.05);
}

function tone(t, { freq = 440, to = null, type = 'sine', peak = 0.2, attack = 0.005, decay = 0.2 } = {}) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
  const g = ctx.createGain();
  env(g, t, peak, attack, decay);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + attack + decay + 0.05);
}

export function startAmbience() {
  if (!ctx || ambience) return;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(0.5, t + 3);
  out.connect(master);

  const rumble = ctx.createBufferSource();
  rumble.buffer = noiseBuffer(4, true);
  rumble.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 240;
  const rg = ctx.createGain(); rg.gain.value = 0.09;
  rumble.connect(lp).connect(rg).connect(out);
  rumble.start();

  const hum = ctx.createOscillator();
  hum.type = 'sine'; hum.frequency.value = 50;
  const hum2 = ctx.createOscillator();
  hum2.type = 'sine'; hum2.frequency.value = 100.4;
  const hg = ctx.createGain(); hg.gain.value = 0.012;
  hum.connect(hg); hum2.connect(hg); hg.connect(out);
  hum.start(); hum2.start();

  ambience = { out, lp };
}

export function brighten(on) {
  if (!ctx || !ambience) return;
  ambience.out.gain.setTargetAtTime(on ? 0.18 : 0.5, ctx.currentTime, 0.6);
}

export function click() {
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(t, { freq: 1900, to: 900, type: 'square', peak: 0.05, decay: 0.012 });
  burst(t, { freq: 3200, q: 0.8, peak: 0.12, decay: 0.03 });
}

export function select() {
  if (!ctx) return;
  const t = ctx.currentTime;
  burst(t, { freq: 1400, q: 2, peak: 0.07, decay: 0.05 });
  tone(t, { freq: 520, to: 380, type: 'triangle', peak: 0.05, decay: 0.06 });
}

export function stampThud(weight = 1) {
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(t, { freq: 150, to: 38, type: 'sine', peak: 0.55 * (0.8 + weight * 0.12), attack: 0.003, decay: 0.28 });
  burst(t, { freq: 700, q: 0.6, peak: 0.28, decay: 0.09, type: 'lowpass' });
  burst(t + 0.001, { freq: 3500, q: 1, peak: 0.08, decay: 0.03 });
}

export function flicker(count = 4) {
  if (!ctx) return;
  const t = ctx.currentTime;
  for (let i = 0; i < count; i++) {
    const s = t + i * 0.07 + Math.random() * 0.03;
    tone(s, { freq: 110, type: 'sawtooth', peak: 0.035, attack: 0.004, decay: 0.035 });
    burst(s, { freq: 2600, q: 1, peak: 0.05, decay: 0.02 });
  }
}

export function lightsOn() {
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(t, { freq: 90, to: 60, type: 'square', peak: 0.12, decay: 0.12 });
  burst(t, { freq: 900, q: 0.5, peak: 0.2, decay: 0.1, type: 'lowpass' });
  tone(t + 0.12, { freq: 60, to: 220, type: 'sawtooth', peak: 0.04, attack: 0.3, decay: 0.7 });
}

export function flip(ok) {
  if (!ctx) return;
  const t = ctx.currentTime;
  burst(t, { freq: 2400, q: 0.7, peak: 0.1, decay: 0.07 });
  if (ok === true) {
    tone(t + 0.05, { freq: 660, type: 'triangle', peak: 0.07, decay: 0.3 });
    tone(t + 0.12, { freq: 990, type: 'triangle', peak: 0.06, decay: 0.4 });
  } else if (ok === false) {
    tone(t + 0.05, { freq: 196, to: 150, type: 'triangle', peak: 0.1, decay: 0.35 });
  }
}

export function fanfare() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [392, 494, 587, 784].forEach((f, i) => tone(t + i * 0.09, { freq: f, type: 'triangle', peak: 0.07, decay: 0.7 }));
}
