// Quiet, broadcast-graphics style cues made on the fly (no files): a soft two-note rise for a right
// read, a low muted tone for a miss, a short fanfare on level up. Off with chalktalk.sound = '0'.

let ac = null;
const on = () => { try { return localStorage.getItem('chalktalk.sound') !== '0'; } catch (e) { return true; } };
export const setSound = v => { try { localStorage.setItem('chalktalk.sound', v ? '1' : '0'); } catch (e) {} };
export const soundOn = on;

function tone(f, at, dur, type, vol) {
  const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at;
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
}
const CUES = {
  ask: () => tone(880, 0, 0.09, 'sine', 0.04),
  yes: () => { tone(660, 0, 0.14, 'triangle', 0.07); tone(990, 0.08, 0.22, 'triangle', 0.07); },
  half: () => tone(740, 0, 0.18, 'triangle', 0.06),
  no: () => { tone(220, 0, 0.2, 'sine', 0.07); tone(196, 0.1, 0.22, 'sine', 0.05); },
  done: () => { tone(523, 0, 0.16, 'triangle', 0.06); tone(784, 0.1, 0.26, 'triangle', 0.06); },
  level: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3, 'triangle', 0.07)),
  stroke: () => tone(1320, 0, 0.05, 'sine', 0.025)
};
export function chime(kind) {
  if (!on() || !CUES[kind]) return;
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); CUES[kind](); } catch (e) {}
}
