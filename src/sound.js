// Quiet, broadcast-graphics style cues made on the fly (no files): a soft two-note rise for a right
// read, a low muted tone for a miss, a short fanfare on level up. Off with chalktalk.sound = '0'.

let ac = null;
// iPhone and iPad: audio only plays after a tap unlocks it, and Web Audio follows the ring/silent switch.
// On the first tap: ask for the "playback" audio session (plays through the silent switch), start the
// audio context, and unlock one shared <audio> element that every voice line then plays through.
export const player = typeof Audio !== 'undefined' ? new Audio() : null;
if (player) { player.preload = 'auto'; player.setAttribute('playsinline', ''); }
let unlocked = false;
function silence() {   // a 50 ms silent WAV
  const n = 1102, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), w = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 22050, true); v.setUint32(28, 44100, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}
export function unlockAudio() {
  if (unlocked) return; unlocked = true;
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); const src = ac.createBufferSource(); src.buffer = ac.createBuffer(1, 1, 22050); src.connect(ac.destination); src.start(0); } catch (e) {}
  try { if (player) { player.src = silence(); player.play().catch(() => {}); } } catch (e) {}
  try { if (typeof speechSynthesis !== 'undefined') { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) {}
}
if (typeof addEventListener !== 'undefined') ['pointerdown', 'touchend', 'keydown'].forEach(ev => addEventListener(ev, unlockAudio, { capture: true, passive: true }));
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
  ask: () => tone(880, 0, 0.09, 'sine', 0.088),
  yes: () => { tone(660, 0, 0.14, 'triangle', 0.154); tone(990, 0.08, 0.22, 'triangle', 0.154); },
  half: () => tone(740, 0, 0.18, 'triangle', 0.132),
  no: () => { tone(220, 0, 0.2, 'sine', 0.154); tone(196, 0.1, 0.22, 'sine', 0.11); },
  done: () => { tone(523, 0, 0.16, 'triangle', 0.132); tone(784, 0.1, 0.26, 'triangle', 0.132); },
  level: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3, 'triangle', 0.154)),
  stroke: () => tone(1320, 0, 0.05, 'sine', 0.055)
};
export function chime(kind) {
  if (!on() || !CUES[kind]) return;
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state !== 'running') ac.resume().then(() => CUES[kind]()).catch(() => {}); else CUES[kind](); } catch (e) {}
}
