// Trace: pick a position and the play is projected around you as aurora light. Your path glows on the floor with
// light flowing along the move you make now; the steps to come are dimmer, rings mark where each step ends;
// everyone else is a figure of light facing where they're going, the ball a bright orb with a tail, and every
// pass, throw, hit or shot is drawn along the ball's real flight (gold when it's coming to you). The goals, the
// hoop, the pylons and the net stand up at their real size.
// Ways in: first person on a screen (your eyes, or just above and behind you; drag to look around); Camera on a
// phone (the light over the camera, look around by moving the phone); and WebXR (Snap Spectacles' browser, Quest,
// Vision Pro, Android XR): on a real court or field (stand on your spot facing the goal, pinch, and the field locks
// to you), fit my room, VR, or a tabletop hologram of the whole play. Walking it, a gold ghost of you runs on time,
// arrows on the floor point to the next ring, a ping sounds from where you need to go, and each rep is scored.
// The step card fits each headset's view (narrow glasses get a smaller card that tags along with your gaze), and
// the words fit its input (pinch, tap, trigger). Without a headset: Earbuds (Ray-Ban Meta, AirPods, any earbuds:
// every step spoken and paced, pings from where to go, a tap on the glasses pauses), Display glasses (XREAL,
// VITURE, RayNeo, Rokid: full screen, black is clear, 3D side by side), and a 4-digit code that hands the play to
// any headset's browser (mutaafaziz.com/chalktalk/go) or Ray-Ban Display.
// Everything is drawn with additive light, so on see-through glasses black is simply not there. Own WebGL (no
// three.js); pure parts live in engine/trace.js.

import { trace, lookAt, roomScale, positions, busiest, metersPer, bounceIn, flightIn, faceHeading, faceWords, repScore, hudFit, pressWord, earPace, thin, resStep } from './engine/trace.js';
import { qrSvg } from './qr.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const GOLD = [1, 0.78, 0.35], ORANGE = [1, 0.56, 0.23], ICE = [0.62, 0.8, 1], WHITE = [0.93, 0.96, 1], RED = [1, 0.42, 0.42];
const BEAT_S = 1.7, EYE = 1.6;

// ---- tiny matrix kit (column-major, like WebGL and WebXR) ----
const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
function persp(fovy, asp, n, f) { const t = 1 / Math.tan(fovy / 2), o = new Float32Array(16); o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f); return o; }
function look(e, fwd, up = [0, 1, 0]) {
  const z = [-fwd[0], -fwd[1], -fwd[2]];
  let x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]; const xl = Math.hypot(...x) || 1; x = x.map(v => v / xl);
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1]);
}

// a phone's orientation as a camera (the way three.js reads deviceorientation): quaternions are [x, y, z, w]
const qmul = (a, b) => [a[0] * b[3] + a[3] * b[0] + a[1] * b[2] - a[2] * b[1], a[1] * b[3] + a[3] * b[1] + a[2] * b[0] - a[0] * b[2], a[2] * b[3] + a[3] * b[2] + a[0] * b[1] - a[1] * b[0], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
function qrot(q, v) { const [x, y, z, w] = q, ix = w * v[0] + y * v[2] - z * v[1], iy = w * v[1] + z * v[0] - x * v[2], iz = w * v[2] + x * v[1] - y * v[0], iw = -x * v[0] - y * v[1] - z * v[2]; return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x]; }
function phoneQuat(o) {
  const x = o.b / 2, y = o.a / 2, z = -o.g / 2, c1 = Math.cos(x), c2 = Math.cos(y), c3 = Math.cos(z), s1 = Math.sin(x), s2 = Math.sin(y), s3 = Math.sin(z);
  let q = [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 - s1 * s2 * c3, c1 * c2 * c3 + s1 * s2 * s3];   // YXZ
  q = qmul(q, [-Math.SQRT1_2, 0, 0, Math.SQRT1_2]);                                    // the camera looks out of the back
  return qmul(q, [0, 0, Math.sin(-o.s / 2), Math.cos(-o.s / 2)]);                      // and the screen may be turned
}
const yawOf = f => Math.atan2(f[0], -f[2]);
const rotY = (v, o) => [v[0] * Math.cos(o) - v[2] * Math.sin(o), v[1], v[0] * Math.sin(o) + v[2] * Math.cos(o)];

// speech of our own (Earbuds speaks every step whatever the board's narration is set to); `done` when it's said
function say(text, done) {
  let fired = false; const fin = () => { if (!fired) { fired = true; done && done(); } };
  try {
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 1.02; u.onend = fin; u.onerror = fin; speechSynthesis.speak(u);
    setTimeout(fin, 900 + String(text).split(/\s+/).length * 420);   // some voices never say they're done
  } catch (e) { setTimeout(fin, 300); }
}
// a second of near silence, looped: it makes this page the one playing, so a tap on Ray-Ban Meta, AirPods or any
// earbuds (play/pause, next, previous) comes to us through the Media Session
function quiet() {
  const n = 8000, b = new Uint8Array(44 + n), v = new DataView(b.buffer), w = (o, t) => [...t].forEach((c, i) => { b[o + i] = c.charCodeAt(0); });
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) b[44 + i] = 128 + (i % 2);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}

// ---- a tiny spatial synth: pings that come from a place (HRTF), so you can find the ring without looking ----
function spatial() {
  let ac = null;
  const set = (P, k, v) => { if (P[k + 'X']) { P[k + 'X'].value = v[0]; P[k + 'Y'].value = v[1]; P[k + 'Z'].value = v[2]; } };
  return {
    start() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.resume) ac.resume(); } catch (e) { ac = null; } },
    ear(pos, fwd) {
      if (!ac) return; const L = ac.listener;
      if (L.positionX) { set(L, 'position', pos); set(L, 'forward', fwd); set(L, 'up', [0, 1, 0]); }
      else if (L.setPosition) { L.setPosition(pos[0], pos[1], pos[2]); L.setOrientation(fwd[0], fwd[1], fwd[2], 0, 1, 0); }
    },
    ping(pos, f = 880, len = 0.2, vol = 0.22) {
      if (!ac || ac.state !== 'running') return;
      const now = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), p = ac.createPanner();
      p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 1.2; p.rolloffFactor = 0.6;
      if (p.positionX) set(p, 'position', pos); else p.setPosition(pos[0], pos[1], pos[2]);
      o.type = 'sine'; o.frequency.setValueAtTime(f, now); o.frequency.exponentialRampToValueAtTime(f * 1.25, now + len);
      g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, now + len);
      o.connect(g); g.connect(p); p.connect(ac.destination); o.start(now); o.stop(now + len + 0.05);
    },
    stop() { try { if (ac && ac.state !== 'closed') { const p = ac.close(); if (p && p.catch) p.catch(() => {}); } } catch (e) {} ac = null; }   // close() rejects on a closed context: it was an uncaught 'AudioContext is closed' on every Trace close
  };
}

// ---- shaders: one glow (ribbons, pillars, sprites, rings), one for text. f picks the shape: 0 a line (0..1: with
// light flowing along it), -1 a soft dot, -2-ρ a ring at radius ρ of its quad (one quad instead of 32 per ring) ----
const VS = 'attribute vec3 p; attribute vec2 uv; attribute vec4 c; attribute float f; uniform mat4 vp; varying vec2 vU; varying vec4 vC; varying float vF; void main(){ vU = uv; vC = c; vF = f; gl_Position = vp * vec4(p, 1.0); }';
const FS = 'precision mediump float; varying vec2 vU; varying vec4 vC; varying float vF; uniform float time;' +
  'void main(){ float a; if (vF < -1.5) { float r = -vF - 2.0; float v = (length(vU) - r) / ((1.0 - r) * 0.5); a = (exp(-v * v * 7.0) + exp(-v * v * 1.6) * 0.4) * vC.a; }' +
  ' else if (vF < -0.5) { a = exp(-dot(vU, vU) * 3.2) * vC.a; } else { float v = vU.y; a = (exp(-v * v * 7.0) + exp(-v * v * 1.6) * 0.4) * vC.a * mix(1.0, 0.5 + 0.5 * sin(vU.x * 3.2 - time * 5.0), vF); }' +
  ' gl_FragColor = vec4(vC.rgb * a, a); }';
const TVS = 'attribute vec3 p; attribute vec2 uv; attribute vec4 c; uniform mat4 vp; varying vec2 vU; varying vec4 vC; void main(){ vU = uv; vC = c; gl_Position = vp * vec4(p, 1.0); }';
const TFS = 'precision mediump float; varying vec2 vU; varying vec4 vC; uniform sampler2D tex; void main(){ float a = texture2D(tex, vU).a * vC.a; gl_FragColor = vec4(vC.rgb * a, a); }';

function program(gl, vs, fs) {
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  const at = {}; ['p', 'uv', 'c', 'f'].forEach(n => { at[n] = gl.getAttribLocation(p, n); });
  return { p, at, vp: gl.getUniformLocation(p, 'vp'), time: gl.getUniformLocation(p, 'time'), tex: gl.getUniformLocation(p, 'tex') };
}

// ---- geometry, written straight into typed arrays that live as long as Trace does: glow verts are p3 uv2 c4 f1,
// text verts p3 uv2 c4. (It used to be a JS array per frame, copied into a new Float32Array for every draw and every
// eye: on a full soccer field that was most of the frame, and the garbage made the hitches.) ----
const vb = stride => ({ a: new Float32Array(stride * 6 * 256), n: 0, stride });
function grow(o, k) { if (o.n + k <= o.a.length) return; const g = new Float32Array(Math.max(o.a.length * 2, o.n + k)); g.set(o.a.subarray(0, o.n)); o.a = g; }
function vert(o, p, uv, col, f) {
  const a = o.a, i = o.n, c = p.c || col;
  a[i] = p[0]; a[i + 1] = p[1]; a[i + 2] = p[2]; a[i + 3] = uv[0]; a[i + 4] = uv[1]; a[i + 5] = c[0]; a[i + 6] = c[1]; a[i + 7] = c[2]; a[i + 8] = c[3];
  if (o.stride === 10) a[i + 9] = f || 0;
  o.n = i + o.stride;
}
function quad(o, a, b, c, d, ua, ub, uc, ud, col, f) {   // a-b-c-d around, two triangles
  grow(o, o.stride * 6); vert(o, a, ua, col, f); vert(o, b, ub, col, f); vert(o, c, uc, col, f); vert(o, a, ua, col, f); vert(o, c, uc, col, f); vert(o, d, ud, col, f);
}
function ribbon(out, pts, w, col, f) {   // flat on its own height, along a world polyline
  let u = 0;
  for (let j = 0; j < pts.length - 1; j++) {
    const a = pts[j], b = pts[j + 1], dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz);
    if (L < 1e-4) continue;
    const nx = -dz / L * w / 2, nz = dx / L * w / 2, u2 = u + L;
    quad(out, [a[0] + nx, a[1], a[2] + nz], [b[0] + nx, b[1], b[2] + nz], [b[0] - nx, b[1], b[2] - nz], [a[0] - nx, a[1], a[2] - nz], [u, 1], [u2, 1], [u2, -1], [u, -1], col, f);
    u = u2;
  }
}
const UV4 = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
function ring(out, c, r, w, col) {   // a ring of light lying flat: one quad, the shader draws the ring (ρ = r / half)
  const h = r + w; quad(out, [c[0] - h, c[1], c[2] - h], [c[0] + h, c[1], c[2] - h], [c[0] + h, c[1], c[2] + h], [c[0] - h, c[1], c[2] + h], UV4[0], UV4[1], UV4[2], UV4[3], col, -2 - r / h);
}
function arc(out, a, b, h, w, col, f, cam) {   // a ribbon turned to face you, lifted (or sagging) in the middle
  const n = 12, pts = [];
  for (let j = 0; j <= n; j++) { const u = j / n; pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(u * Math.PI) * h, a[2] + (b[2] - a[2]) * u]); }
  beam(out, pts, w, col, f, cam);
}
function beam(out, pts, w, col, f, cam) {   // a ribbon along any 3D polyline, turned to face you (posts, rims, the ball's flight)
  const n = pts.length - 1; let u = 0;
  for (let j = 0; j < n; j++) {
    const p = pts[j], q = pts[j + 1], m0 = (p[0] + q[0]) / 2 - cam[0], m1 = (p[1] + q[1]) / 2 - cam[1], m2 = (p[2] + q[2]) / 2 - cam[2], d0 = q[0] - p[0], d1 = q[1] - p[1], d2 = q[2] - p[2];
    let nx = d1 * m2 - d2 * m1, ny = d2 * m0 - d0 * m2, nz = d0 * m1 - d1 * m0; const nl = Math.hypot(nx, ny, nz) || 1; nx *= w / 2 / nl; ny *= w / 2 / nl; nz *= w / 2 / nl;
    const L = Math.hypot(d0, d1, d2), u2 = u + L; if (L < 1e-5) continue;
    quad(out, [p[0] + nx, p[1] + ny, p[2] + nz], [q[0] + nx, q[1] + ny, q[2] + nz], [q[0] - nx, q[1] - ny, q[2] - nz], [p[0] - nx, p[1] - ny, p[2] - nz], [u, 1], [u2, 1], [u2, -1], [u, -1], col, f);
    u = u2;
  }
}
function facing(c, cam) { const dx = cam[0] - c[0], dz = cam[2] - c[2], L = Math.hypot(dx, dz) || 1; return [dz / L, -dx / L]; }   // your right, for things that turn to face you (a sideways unit vector, for things that turn to face you
function pillar(out, c, w, h, col, cam) {
  const [rx, rz] = facing(c, cam), x = rx * w / 2, z = rz * w / 2, top = col.slice(0, 3).concat(0);
  const a = [c[0] - x, c[1], c[2] - z], b = [c[0] + x, c[1], c[2] + z], d = [c[0] - x, c[1] + h, c[2] - z], e = [c[0] + x, c[1] + h, c[2] + z];
  d.c = top; e.c = top;
  quad(out, a, b, e, d, [0, -1], [0, 1], [0, 1], [0, -1], col, 0);
}
function sprite(out, c, s, col, cam) {
  const [rx, rz] = facing(c, cam), x = rx * s, z = rz * s;
  quad(out, [c[0] - x, c[1] - s, c[2] - z], [c[0] + x, c[1] - s, c[2] + z], [c[0] + x, c[1] + s, c[2] + z], [c[0] - x, c[1] + s, c[2] - z], [-1, -1], [1, -1], [1, 1], [-1, 1], col, -1);
}
function label(out, c, w, h, cell, col, cam) {   // a text card from the atlas, turned to face you
  const [rx, rz] = facing(c, cam), x = rx * w / 2, z = rz * w / 2, [u0, v0, u1, v1] = cell;
  quad(out, [c[0] - x, c[1], c[2] - z], [c[0] + x, c[1], c[2] + z], [c[0] + x, c[1] + h, c[2] + z], [c[0] - x, c[1] + h, c[2] - z], [u0, v1], [u1, v1], [u1, v0], [u0, v0], col);
}
// along a world polyline: the point at distance d
function along(pts, d) {
  for (let j = 0; j < pts.length - 1; j++) { const a = pts[j], b = pts[j + 1], L = Math.hypot(b[0] - a[0], b[2] - a[2]); if (d <= L) { const u = L ? d / L : 0; return [a[0] + (b[0] - a[0]) * u, a[1], a[2] + (b[2] - a[2]) * u]; } d -= L; }
  return pts[pts.length - 1];
}
function chevron(out, c, d, s, w, col, f) {   // a V on the floor at c, pointing along the unit vector d
  const r = [-d[2], 0, d[0]];
  ribbon(out, [[c[0] - d[0] * s + r[0] * s, c[1], c[2] - d[2] * s + r[2] * s], [c[0] + d[0] * s * 0.4, c[1], c[2] + d[2] * s * 0.4], [c[0] - d[0] * s - r[0] * s, c[1], c[2] - d[2] * s - r[2] * s]], w, col, f);
}
const plen = pts => { let L = 0; for (let j = 1; j < pts.length; j++) L += Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][2] - pts[j - 1][2]); return L; };

const CSS = `
.ct-tr { position: absolute; inset: 0; z-index: 60; background: #02050a; color: var(--paper, #eef4ff); font-family: var(--body, system-ui), sans-serif; overflow: hidden; touch-action: none; }
.ct-tr canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: grab; }
.ct-tr .tr-top { position: absolute; left: 12px; right: 12px; top: calc(10px + env(safe-area-inset-top)); display: flex; gap: 8px; align-items: center; }
.ct-tr .tr-who { flex: 1; min-width: 0; display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding: 2px; }
.ct-tr .tr-who::-webkit-scrollbar { display: none; }
.ct-tr button { font: 700 13px/1 var(--body, system-ui), sans-serif; color: inherit; border: 1px solid rgba(140, 188, 255, .28); background: rgba(8, 14, 26, .62); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 999px; min-height: 40px; padding: 0 14px; cursor: pointer; flex: none; }
.ct-tr .tr-who button.d { color: #a9d4ff; } .ct-tr .tr-who button.on { background: #ffc75a; color: #04070c; border-color: transparent; }
.ct-tr .tr-x { width: 40px; padding: 0; font-size: 18px; }
.ct-tr .tr-card { position: absolute; left: 50%; translate: -50% 0; bottom: calc(14px + env(safe-area-inset-bottom)); width: min(560px, calc(100% - 24px)); padding: 12px 14px; border-radius: 18px; background: rgba(8, 14, 26, .66); border: 1px solid rgba(140, 188, 255, .22); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.ct-tr .tr-step { font: 900 11px/1 var(--display, system-ui); letter-spacing: .16em; text-transform: uppercase; color: #ffc75a; }
.ct-tr .tr-job { margin: 6px 0 10px; font-size: clamp(18px, 4.6vw, 24px); font-weight: 800; line-height: 1.2; }
.ct-tr .tr-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.ct-tr .tr-row .sp { flex: 1; }
.ct-tr .tr-xr { background: #ff8e3a; color: #04070c; border-color: transparent; }
.ct-tr video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: none; }
.ct-tr.cam { background: #000; } .ct-tr.cam video { display: block; }
.ct-tr .tr-row button.tr-xr.on { background: #ffc75a; }
.ct-tr .tr-hint { position: absolute; top: calc(60px + env(safe-area-inset-top)); left: 0; right: 0; text-align: center; font-size: 12px; color: rgba(199, 214, 238, .7); pointer-events: none; }
/* Display glasses: pure black (clear on the glasses), the step card drawn in the light, the controls out of the way */
.ct-tr.gl { background: #000; } .ct-tr.gl canvas { cursor: none; }
.ct-tr.gl .tr-top, .ct-tr.gl .tr-card, .ct-tr.gl .tr-hint { opacity: 0; pointer-events: none; transition: opacity .4s; }
.ct-tr .tr-glbar { position: absolute; right: 12px; top: calc(10px + env(safe-area-inset-top)); display: none; gap: 8px; transition: opacity .4s; }
.ct-tr.gl .tr-glbar { display: flex; } .ct-tr.gl.idle .tr-glbar { opacity: 0; }
/* Earbuds: the step big, for a glance at the phone */
.ct-tr.ear .tr-job { font-size: clamp(22px, 6vw, 34px); }
.ct-tr .tr-row button.on { background: #ffc75a; color: #04070c; border-color: transparent; }
/* one tap in: the big button a link lands on */
.ct-tr .tr-go { position: absolute; left: 50%; top: 52%; translate: -50% -50%; width: min(420px, calc(100% - 32px)); padding: 22px 20px 18px; border-radius: 24px; text-align: center; background: rgba(6, 11, 21, .9); border: 1px solid rgba(255, 199, 90, .4); box-shadow: 0 0 60px rgba(255, 199, 90, .18); display: grid; gap: 12px; z-index: 2; }
.ct-tr .tr-go p { margin: 0; font-size: 15px; color: #c7d6ee; } .ct-tr .tr-go p b { color: #ffc75a; }
.ct-tr .tr-go .big { min-height: 64px; font: 900 19px/1.1 var(--display, system-ui), sans-serif; letter-spacing: .02em; background: #ffc75a; color: #04070c; border: 0; border-radius: 18px; }
.ct-tr .tr-go .alt { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; } .ct-tr .tr-go small { font-size: 12.5px; color: #8fa3c2; }
/* handheld AR (dom-overlay): the camera is the page; only the card and the top bar sit over it */
.ct-tr.xr-dom { background: transparent; } .ct-tr.xr-dom canvas, .ct-tr.xr-dom video, .ct-tr.xr-dom .tr-hint, .ct-tr.xr-dom [data-t=xr], .ct-tr.xr-dom [data-a=mode] { display: none; }
/* the sheet: every other way in, and the code for a headset */
.ct-tr .tr-sheet, .ct-tr .tr-sheet * { box-sizing: border-box; }
.ct-tr .tr-sheet { position: absolute; inset: auto 0 0 0; max-height: 86%; overflow-y: auto; padding: 18px 16px calc(18px + env(safe-area-inset-bottom)); background: rgba(6, 11, 21, .97); border-top: 1px solid rgba(140, 188, 255, .25); border-radius: 22px 22px 0 0; display: grid; gap: 10px; }
.ct-tr .tr-sheet h3 { margin: 0; font: 900 12px/1 var(--display, system-ui); letter-spacing: .16em; text-transform: uppercase; color: #ffc75a; }
.ct-tr .tr-sheet .way { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 12px; align-items: center; padding: 12px; border-radius: 14px; border: 1px solid rgba(140, 188, 255, .18); }
.ct-tr .tr-sheet .way b { font-size: 16px; } .ct-tr .tr-sheet .way small { grid-column: 1; font-size: 13px; line-height: 1.35; color: #a8bad6; }
.ct-tr .tr-sheet .way > button, .ct-tr .tr-sheet .way .bs { grid-row: 1 / span 2; grid-column: 2; } .ct-tr .tr-sheet .way .bs { display: flex; gap: 6px; }
.ct-tr .tr-sheet .code { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 14px; align-items: center; padding: 14px; border-radius: 16px; background: rgba(255, 199, 90, .08); border: 1px solid rgba(255, 199, 90, .35); }
.ct-tr .tr-sheet .code .qr { width: 132px; height: 132px; border-radius: 10px; overflow: hidden; background: #fff; }
.ct-tr .tr-sheet .code .qr svg { width: 100%; height: 100%; display: block; }
.ct-tr .tr-sheet .code .num { font: 900 46px/1 var(--display, system-ui); letter-spacing: .14em; color: #ffc75a; font-variant-numeric: tabular-nums; }
.ct-tr .tr-sheet .code p { margin: 6px 0 0; font-size: 13.5px; line-height: 1.4; color: #c7d6ee; } .ct-tr .tr-sheet .code p b { color: #fff; overflow-wrap: anywhere; }
@media (max-width: 420px) { .ct-tr .tr-sheet .code .qr { width: 104px; height: 104px; } .ct-tr .tr-sheet .code .num { font-size: 38px; } }
.ct-tr .tr-sheet ul { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.45; color: #a8bad6; } .ct-tr .tr-sheet li b { color: #eef4ff; }
`;

export function createTrace(ctx) {
  let el = null, gl = null, G = null, T = null, atlas = null, cells = {}, panel = null;
  let sim = null, sport = null, tr = null, who = -1, t = 0, playing = true, hold = 0, last = 0, raf = 0, mode = 'eyes', speed = 1;
  let yaw = null, dYaw = 0, dPitch = -0.2, xr = null, xrs = {}, how = null, scale = 1, origin = null, heading0 = 0, shift = [0, 0, 0], anchored = false;
  let panelPos = null, panelText = '', waiting = false, waitAt = 0, pinged = 0, spoken = -1, flown = -1, bounces = [], flights = [], ready = false, behind = false;
  let lates = [], reps = 0, score = null, ori = null, phoneOff = null, stream = null;
  let fit = hudFit(1, 1), press = 'Pinch', glasses = null, ear = null, sheet = null, idleT = 0;
  // drawing: the field's flat lines live in their own buffer, rebuilt only when the field moves in the room (`skey`);
  // everything else is rewritten into the same typed arrays each frame and uploaded once, whatever the number of eyes
  const SB = vb(10), DB = vb(10), TB = vb(9), PB = vb(9); let GB = null, skey = '', ver = 0, lines = [], wpath = [];
  let track = [], lastTrack = null, res = 1, fms = [], lastNow = 0, tick = 0, dragging = false, hitSrc = null, placing = false, domOv = false, shown = ['', ''];
  const name = id => ctx.name ? ctx.name(id) : id, sfx = spatial();
  const table = () => how === 'table', walking = () => !!xr && !table();
  const bestKey = () => `chalktalk.trace.best.${sport.id}.${sim.play.title || ''}.${tr.id}`;

  // field → world meters. In XR the field is anchored in the room (`anchor`): `origin` (a field point) lands on
  // `shift` (a world point) and the field heading `heading0` points along world −Z
  function W(x, y, z) {
    const mp = metersPer(sport), m = mp * scale, ox = origin ? origin[0] : 0, oy = origin ? origin[1] : 0;
    const X = (x - ox) * m, Z = (y - oy) * m, c = Math.cos(heading0), s = Math.sin(heading0);
    return [X * c + Z * s + shift[0], (z || 0) * mp * (table() ? scale : Math.min(1, scale * 1.4)) + shift[1], -X * s + Z * c + shift[2]];
  }
  // put the field in the room: field heading h straight ahead of you (fz = your head's +Z), field point `at` at `pos`
  function anchor(pos, fz, h, at) {
    const fl = Math.hypot(fz[0], fz[2]) || 1;
    heading0 = h - Math.atan2(-fz[0] / fl, fz[2] / fl); origin = at; shift = pos;
  }
  const U = () => (table() ? Math.max(0.04, scale * 1.6) : 1);   // the size of things: they shrink on a tabletop
  const H = 1.8;   // a player's height in meters (shrunk with the room, never under 0.7; true to scale on a table)
  const ph = () => (table() ? H * scale * 1.3 : Math.max(0.7, H * Math.min(1, scale * 1.6)));

  function setup(canvas, xrc) {
    gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, xrCompatible: !!xrc });
    if (!gl) throw new Error('no webgl');
    G = program(gl, VS, FS); T = program(gl, TVS, TFS);
    const nb = () => ({ buf: gl.createBuffer(), cap: 0, n: 0 }); GB = { s: nb(), d: nb(), t: nb(), p: nb() }; skey = '';
    buildAtlas();
  }
  function buildAtlas() {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512; const c = cv.getContext('2d');
    c.font = '800 42px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
    const texts = sim.play.players.map(p => sport.notation.inside(p)).concat(sim.play.beats.map((_, k) => String(k + 1)));
    cells = {}; let n = 0;
    for (const s of new Set(texts)) { if (n >= 32) break; const cx = (n % 4) * 128, cy = Math.floor(n / 4) * 64; c.fillText(s, cx + 64, cy + 34, 120); cells[s] = [cx / 512, cy / 512, (cx + 128) / 512, (cy + 64) / 512]; n++; }
    if (!atlas) atlas = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, atlas); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  // a player as a figure of light: a ring where they stand, a V on the floor the way they're going, a body, a head
  function figure(g, tx, at, d, col, a, cam, u, cell) {
    const h = ph(), y = at[1] + 0.02 * u;
    ring(g, [at[0], y, at[2]], 0.26 * u, 0.06 * u, col.concat(a * 0.9), 0);
    chevron(g, [at[0] + d[0] * 0.5 * u, y, at[2] + d[2] * 0.5 * u], d, 0.16 * u, 0.07 * u, col.concat(Math.min(1, a * 1.5)), 0);
    pillar(g, [at[0], at[1] + h * 0.06, at[2]], 0.4 * u, h * 0.74, col.concat(a), cam);
    sprite(g, [at[0], at[1] + h * 0.9, at[2]], 0.14 * u, col.concat(Math.min(1, a * 1.6)), cam);
    if (cell) label(tx, [at[0], at[1] + h + 0.1 * u, at[2]], 0.5 * u, 0.25 * u, cell, col.concat(0.95), cam);
  }
  const stands = l => l.p && l.p.some(q => (q[2] || 0) > 0.05);
  function lineOf(g, l, u, cam) {
    if (!l.p || l.p.length < 2) return;
    if (stands(l)) beam(g, l.p.map(q => W(q[0], q[1], q[2] || 0)), (0.03 + (l.w || 1) * 0.012) * u, (l.hot ? WHITE : l.warm ? [1, 0.86, 0.7] : ICE).concat(l.hot ? 0.8 : 0.5), 0, cam);   // stands up: goals, the hoop, pylons, the net
    else ribbon(g, l.p.map(q => W(q[0], q[1], (q[2] || 0) + 0.01)), (0.05 + (l.w || 1) * 0.02) * u, ICE.concat((walking() ? 0.22 : 0.4) * (l.hot ? 1.8 : 1)), 0);
  }
  // what doesn't move with the clock or your head: the field's flat lines, a court's kitchens and the net's curtain,
  // and your path in room coordinates. Rebuilt only when the field moves (pick, anchor, scale) or walking starts
  function staticLayer() {
    const a = W(0, 0, 0), b = W(7, 3, 1), key = [a[0], a[1], a[2], b[0], b[1], b[2]].map(v => Math.round(v * 1e4)).join() + (walking() ? 'w' : '') + ver;
    if (key === skey) return; skey = key;
    const g = SB, u = U(); g.n = 0;
    for (const l of lines) if (!stands(l)) lineOf(g, l, u, null);
    if (sport.trace && sport.trace.props) for (const l of sport.trace.props()) if (!stands(l)) lineOf(g, l, u, null);
    const C = sport.court;
    if (C) {
      const h = C.W / 2, nn = C.net, flat = (x0, y0, x1, y1, col) => quad(g, W(x0, y0, 0.006), W(x1, y0, 0.006), W(x1, y1, 0.006), W(x0, y1, 0.006), [0, 0], [0, 0], [0, 0], [0, 0], col, 0);
      flat(-h, nn - C.nvz, h, nn, RED.concat(walking() ? 0.07 : 0.1)); flat(-h, nn, h, nn + C.nvz, RED.concat(walking() ? 0.07 : 0.1));
      quad(g, W(-C.post, nn, 0), W(C.post, nn, 0), W(C.post, nn, C.netMid), W(-C.post, nn, C.netMid), [0, 0], [0, 0], [0, 0], [0, 0], WHITE.concat(walking() ? 0.05 : 0.07), 0);
    }
    wpath = tr.steps.map(st => st.pts.map(q => W(q[0], q[1], 0.02)));
    upload(GB.s, g);
  }
  function upload(b, o) {
    gl.bindBuffer(gl.ARRAY_BUFFER, b.buf); const bytes = o.n * 4;
    if (b.cap < bytes) { b.cap = Math.max(bytes, b.cap * 2, 1 << 16); gl.bufferData(gl.ARRAY_BUFFER, b.cap, gl.DYNAMIC_DRAW); }
    if (o.n) gl.bufferSubData(gl.ARRAY_BUFFER, 0, o.a.subarray(0, o.n)); b.n = o.n / o.stride;
  }

  // ---- the scene at time t, seen from cam (fwd: where you're looking, for the look-here cue) ----
  function scene(cam, now, fwd) {
    staticLayer();
    const g = DB, tx = TB, u = U(), n = sim.play.beats.length, P = sim.posAt(t), P2 = sim.posAt(Math.min(n, t + 0.06)), k = Math.min(n - 1, Math.floor(t)), ended = t >= n;
    const B = sim.ballAt(t), floor = W(0, 0, 0)[1]; g.n = 0; tx.n = 0;
    // whatever stands up (the flat lines are in the static layer; a sport can give its landmarks at their real size)
    const props = sport.trace && sport.trace.props;
    if (!props) for (const l of lines) if (stands(l)) lineOf(g, l, u, cam);
    if (props) for (const l of props()) if (stands(l)) lineOf(g, l, u, cam);
    // a net sport's court: the kitchens glow faintly red on the floor (no volleys in there), the net is a curtain of
    // light at its real height with a bright top band, and the ball's bounce this step is a ring where it lands
    const C = sport.court;
    if (C) {
      const nn = C.net, zs = metersPer(sport) * (table() ? scale : Math.min(1, scale * 1.4));
      arc(g, W(-C.post, nn, C.netH), W(C.post, nn, C.netH), -(C.netH - C.netMid) * zs, 0.07 * u, WHITE.concat(0.85), 0, cam);
      for (const x of [-C.post, C.post]) pillar(g, W(x, nn, 0), 0.07 * u, C.netH * zs, WHITE.concat(0.6), cam);
      const bz = bounces[k];
      if (bz && !ended) { const f = t - k, on = f > 0.25 && f < 0.98, c = W(bz[0], bz[1], 0.02); ring(g, c, (0.22 + (on ? 0.08 * Math.sin(now / 120) : 0)) * u, 0.08 * u, ICE.concat(on ? 0.9 : 0.35), 0); }
    }
    // your path: done faint, now bright and flowing, to come dimmer; a ring where each move ends
    tr.steps.forEach((s, j) => {
      if (s.pts.length < 2) return;
      const now0 = s.k === k && !ended, done = s.k < k || ended, pts = wpath[j];
      ribbon(g, pts, (walking() ? 0.3 : 0.36) * u, GOLD.concat(now0 ? 0.95 : done ? 0.2 : 0.42), now0 ? 1 : done ? 0 : 0.4);
      if (s.moved) {
        const e = W(s.to[0], s.to[1], 0.03), pulse = now0 ? 0.65 + 0.35 * Math.sin(now / 160) : done ? 0.25 : 0.4;
        ring(g, e, (now0 && waiting ? 0.38 + 0.06 * Math.sin(now / 90) : 0.38) * u, 0.12 * u, GOLD.concat(pulse), 0);
        if (cells[String(s.k + 1)]) label(tx, [e[0], e[1] + 0.12 * u, e[2]], 0.44 * u, 0.22 * u, cells[String(s.k + 1)], GOLD.concat(done ? 0.35 : 0.95), cam);
      }
    });
    // walking it: where you really went last rep, in ice, against the gold you were meant to run
    if (lastTrack && lastTrack.length > 1) ribbon(g, lastTrack.map(q => [q[0], floor + 0.025, q[1]]), 0.14 * u, ICE.concat(ended ? 0.75 : 0.2), ended ? 0.6 : 0);
    // light flowing along the move you make now
    const cur = tr.steps[k];
    if (cur && cur.moved && !ended) {
      const pts = cur.pts.map(q => W(q[0], q[1], 0.05)), L = plen(pts);
      for (let j = 0; j < 14; j++) sprite(g, along(pts, ((now / 1000 * 1.6 * u + j / 14 * L) % L)), 0.09 * u, GOLD.concat(0.9), cam);
    }
    // everyone: figures of light facing where they're going (or the ball); you are a gold ghost, on time, except
    // when you are the camera
    behind = false;
    sim.play.players.forEach((p, i) => {
      const at = W(P[i][0], P[i][1], 0), mine = i === who;
      if (mine && !xr && mode !== 'above') return;
      let hx = P2[i][0] - P[i][0], hy = P2[i][1] - P[i][1];
      if (Math.hypot(hx, hy) < sport.mark * 0.02 && B) { hx = B[0] - P[i][0]; hy = B[1] - P[i][1]; }
      const hl = Math.hypot(hx, hy) || 1, q = W(P[i][0] + hx / hl, P[i][1] + hy / hl, 0), dl = Math.hypot(q[0] - at[0], q[2] - at[2]) || 1, d = [(q[0] - at[0]) / dl, 0, (q[2] - at[2]) / dl];
      const col = mine ? GOLD : p.side === 'O' ? ORANGE : ICE;
      figure(g, tx, at, d, col, mine ? 0.34 : p.side === 'O' ? 0.5 : 0.4, cam, u, mine ? null : cells[sport.notation.inside(p)]);
      if (mine) ring(g, [at[0], at[1] + 0.03 * u, at[2]], 0.34 * u, 0.1 * u, GOLD.concat(0.9), 0);
      // walking it: if you fall behind your ghost, a thread of light pulls you to it
      if (mine && walking() && !ready && cur && cur.moved && !ended && Math.hypot(cam[0] - at[0], cam[2] - at[2]) > 1.4) {
        behind = true; ribbon(g, [[cam[0], floor + 0.03, cam[2]], [at[0], floor + 0.03, at[2]]], 0.06, GOLD.concat(0.5), 1);
      }
    });
    // walking it: arrows on the floor from your feet to where you need to be next
    if (walking() && !ready && cur && !ended) {
      const tgt = waiting && cur.moved ? W(cur.to[0], cur.to[1], 0) : cur.moved ? W(P[who][0], P[who][1], 0) : null;
      const dx = tgt ? tgt[0] - cam[0] : 0, dz = tgt ? tgt[2] - cam[2] : 0, D = Math.hypot(dx, dz);
      if (tgt && D > 0.9) for (let j = 0; j < 3; j++) {
        const s = 0.55 + j * 0.4; if (s > D - 0.35) break;
        const ph0 = 0.5 + 0.5 * Math.sin(now / 140 - j * 1.2);
        chevron(g, [cam[0] + dx / D * s, floor + 0.04, cam[2] + dz / D * s], [dx / D, 0, dz / D], 0.16, 0.06, GOLD.concat(0.35 + 0.55 * ph0), 0);
      }
    }
    // the ball's real flight this step: a pass, a throw, a hit, a shot (gold when it's coming to you), and a ring
    // where you catch it
    const fl = !ended && flights[k];
    if (fl) {
      const me = fl.target === tr.id, pts = fl.pts.map(q => W(q[0], q[1], Math.max(q[2], 0.1)));
      beam(g, pts, (me ? 0.09 : 0.06) * u, (me ? GOLD : WHITE).concat(me ? 0.75 : 0.4), 1, cam);
      const e = fl.pts[fl.pts.length - 1];
      if (me) ring(g, W(e[0], e[1], 0.03), 0.3 * u, 0.06 * u, GOLD.concat(0.7), 0);
      // and if it's coming to you and you're looking away, light at the edge of your view shows which way to turn
      if (me && fwd && walking() && B && t - k < 0.9) {
        const b = W(B[0], B[1], B[2] || 0), want = Math.atan2(b[0] - cam[0], -(b[2] - cam[2])), d = Math.atan2(Math.sin(want - yawOf(fwd)), Math.cos(want - yawOf(fwd)));
        if (Math.abs(d) > Math.min(0.8, fit.edge * 2)) for (let j = 0; j < 3; j++) {
          const a = yawOf(fwd) + Math.sign(d) * fit.edge * (1 + j * 0.26), pulse = 0.5 + 0.5 * Math.sin(now / 110 - j);
          sprite(g, [cam[0] + Math.sin(a) * 1.1, cam[1] - 0.12, cam[2] - Math.cos(a) * 1.1], 0.05 + j * 0.012, GOLD.concat(0.4 + 0.5 * pulse), cam);
        }
      }
    }
    // the ball, with a tail while it flies
    if (B) {
      const lift = q => { const w = W(q[0], q[1], q[2] || 0); w[1] = Math.max(w[1], floor + 0.15 * u); return w; };
      sprite(g, lift(B), 0.28 * u, [1, 0.85, 0.45, 1], cam);
      if (sim.holderAt(t) < 0) for (let j = 1; j <= 8; j++) { const Q = sim.ballAt(Math.max(0, t - j * 0.012)); if (Q) sprite(g, lift(Q), (0.24 - j * 0.02) * u, [1, 0.8, 0.4, 0.5 - j * 0.05], cam); }
    }
    upload(GB.d, g); upload(GB.t, tx);
  }
  // one pass per eye: the static field, the moving scene, the labels, the step card; nothing is uploaded here
  function pass(P, b, stride, vp) {
    if (!b.n) return;
    gl.useProgram(P.p); gl.uniformMatrix4fv(P.vp, false, vp); if (P.time) gl.uniform1f(P.time, performance.now() / 1000);
    gl.bindBuffer(gl.ARRAY_BUFFER, b.buf);
    const S = stride * 4; let o = 0;
    for (const [n, sz] of [['p', 3], ['uv', 2], ['c', 4], ['f', 1]]) { if (n === 'f' && stride < 10) break; const a = P.at[n]; if (a >= 0) { gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, sz, gl.FLOAT, false, S, o); } o += sz * 4; }
    gl.drawArrays(gl.TRIANGLES, 0, b.n);
    for (const n of ['p', 'uv', 'c', 'f']) if (P.at[n] >= 0) gl.disableVertexAttribArray(P.at[n]);
  }
  function draw(vp, card) {
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.disable(gl.DEPTH_TEST);
    pass(G, GB.s, 10, vp); pass(G, GB.d, 10, vp);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlas); gl.useProgram(T.p); gl.uniform1i(T.tex, 0);
    pass(T, GB.t, 9, vp);
    if (card && panel) { gl.bindTexture(gl.TEXTURE_2D, panel); pass(T, GB.p, 9, vp); }
  }
  // the step card as a quad of light at `at`, facing `cam`
  function cardAt(at, w, h, cam) { PB.n = 0; label(PB, at, w, h, [0, 0, 1, 1], [1, 1, 1, 1], cam); upload(GB.p, PB); }
  const setText = s2 => { if (!el) return; if (shown[0] !== s2.head) el.querySelector('[data-t=head]').textContent = shown[0] = s2.head; if (shown[1] !== s2.job) el.querySelector('[data-t=job]').textContent = shown[1] = s2.job; };

  // ---- the clock: one beat every BEAT_S seconds (÷ speed); walking it in XR it waits for you at the end of each
  // of your moves, pings from the ring while it waits, and scores the rep ----
  function advance(now, head) {
    const dt = last ? Math.min(ear ? 1 : 0.1, (now - last) / 1000) : 0; last = now;
    const n = sim.play.beats.length;
    if (!playing) return;
    if (t >= n) { hold += dt; if (hold > (score ? 4 : 2.2)) { t = 0; hold = 0; lates = []; score = null; } return; }
    const k = Math.floor(t), next = t + dt / (ear ? earPace(tr.steps[k] && tr.steps[k].job, speed, BEAT_S) : BEAT_S / speed);
    if (head && walking() && Math.floor(next) > k) {
      const s = tr.steps[k];
      if (s && s.moved) {
        const e = W(s.to[0], s.to[1], 0), d = Math.hypot(head[0] - e[0], head[2] - e[2]);
        if (!waiting && d > 0.6) { waiting = true; waitAt = now; pinged = 0; t = k + 0.999; return; }
        if (waiting && d > 0.6) {
          t = k + 0.999;
          if (now - pinged > 900) { pinged = now; sfx.ping([e[0], 1, e[2]], 660 + 600 * Math.max(0, 1 - d / 6)); }   // higher as you get closer
          return;
        }
        lates[k] = waiting ? (now - waitAt) / 1000 : 0;
        if (waiting) { waiting = false; ctx.chime && ctx.chime('ok'); sfx.ping([e[0], 0.5, e[2]], 1320, 0.25, 0.3); }
      }
    }
    t = Math.min(n, next);
    if (head && walking() && anchored && !ready && !placing) thin(track, [head[0], head[2]], 0.12, 500);
    if (t >= n && walking()) finishRep();
  }
  function finishRep() {
    if (track.length > 1) { lastTrack = track; track = []; }
    const sc = repScore(lates); if (!sc.moves) return;
    reps++; let best = 0;
    try { best = +localStorage.getItem(bestKey()) || 0; if (sc.stars > best) localStorage.setItem(bestKey(), String(sc.stars)); } catch (e) {}
    score = Object.assign(sc, { best: Math.max(best, sc.stars), beat: sc.stars > best && best > 0 });
    ctx.track && ctx.track('trace_rep', { stars: sc.stars, moves: sc.moves });
    if (sc.stars === 3) ctx.chime && ctx.chime('ok');
  }
  // a pass or hit coming your way: a ping from the player who lets it go, once
  function cues(head) {
    const k = Math.floor(t), fl = flights[k];
    if (!fl || fl.target !== tr.id || flown === k || t - k < 0.25 || t >= sim.play.beats.length) return;
    flown = k; const a = fl.pts[0], p = W(a[0], a[1], 0); sfx.ping([p[0], head ? head[1] : 1.5, p[2]], 520, 0.3, 0.26);
  }
  function stepText() {
    const n = sim.play.beats.length, k = Math.min(n - 1, Math.floor(t));
    if (placing) return { head: `Tabletop · you are ${tr.name}`, job: `Look at a table or the floor · ${press} to set the play down` };
    if (ready) return { head: `On a real ${(sport.trace && sport.trace.place) || 'field'} · you are ${tr.name}`, job: `Stand on your spot facing ${faceWords(sim, who, sport)}. ${press} to start.` };
    if (t >= n && score) return { head: `Rep ${reps} · ${'★'.repeat(score.stars)}${'☆'.repeat(3 - score.stars)}${score.beat ? ' · new best' : ''}`, job: `${score.onTime} of ${score.moves} moves on time${score.avg > 0.4 ? `, ${score.avg.toFixed(1)} s late on average` : ''}.${lastTrack ? ' Blue is where you went.' : ''} Again in a moment.` };
    if (ear && !playing && t === 0) return { head: `Earbuds · you are ${tr.name}`, job: `Face ${faceWords(sim, who, sport)}. Listen for each step.` };
    if (t >= n) return { head: 'That’s the play', job: 'Again from the top in a moment.' };
    return { head: `Step ${k + 1} of ${n} · you are ${tr.name}`, job: waiting ? `Walk to the ring to keep going · ${press} to skip` : behind ? 'Catch your ghost · ' + tr.steps[k].job : tr.steps[k].job };
  }
  function sayStep() {
    const n = sim.play.beats.length, k = Math.floor(t);
    if (ear) {   // every step said, whatever narration is set to, and a ping from where you're going
      if (t >= n) { if (spoken !== n) { spoken = n; say('That’s the play. Again in a moment.'); } return; }
      if (k === spoken || !playing) return;
      spoken = k; const s = tr.steps[k]; say(`${k + 1}. ${s.job}`);
      if (s.moved) { const e = W(s.to[0], s.to[1], 0), P = sim.posAt(t)[who], me = W(P[0], P[1], 0), d = Math.hypot(e[0] - me[0], e[2] - me[2]); sfx.ping([e[0], EYE, e[2]], 660 + 600 * Math.max(0, 1 - d / 8), 0.3, 0.3); }
      return;
    }
    if (k === spoken || !ctx.speak || t >= n || ready) return;
    spoken = k; ctx.speak(tr.steps[k].job);
  }

  // ---- first person on a screen; on a phone with Camera, the light over the camera and the phone is your eyes ----
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!el || xr) return;
    // paused, still and not on a camera: half the frames are enough for the pulses (a phone on a tripod at practice)
    tick++; if (!playing && !dragging && mode !== 'cam' && !glasses && (tick & 1)) return;
    // the render scale follows how long frames really take: a hot phone or a full soccer field drops it, it climbs back
    if (lastNow) { fms.push(now - lastNow); if (fms.length >= 45) { res = resStep(res, fms.reduce((a, b) => a + b, 0) / fms.length); fms = []; } } lastNow = now;
    advance(now);
    const cv = el.querySelector('canvas'), dpr = Math.min(2, devicePixelRatio || 1) * res, w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const cam = mode === 'cam';
    gl.viewport(0, 0, cv.width, cv.height); if (cam) gl.clearColor(0, 0, 0, 0); else if (glasses) gl.clearColor(0, 0, 0, 1); else gl.clearColor(0.008, 0.02, 0.04, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    const target = lookAt(sim, who, t, sport);
    if (yaw == null) yaw = target; let d = target - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * 0.06;
    const P = sim.posAt(t)[who], me = W(P[0], P[1], 0);
    let fwd, up = [0, 1, 0], eye;
    if (cam && ori) {
      const q = phoneQuat(ori), f = qrot(q, [0, 0, -1]);
      // the way you hold the phone now is where the player looks now (once it's up off the flat, where yaw means something)
      if (phoneOff == null && Math.abs(f[1]) < 0.8) phoneOff = target - yawOf(f);
      const off = (phoneOff == null ? target - yawOf(f) : phoneOff) + dYaw;
      fwd = rotY(f, off); up = rotY(qrot(q, [0, 1, 0]), off); eye = [me[0], EYE, me[2]];
    } else {
      const a = yaw + dYaw, pitch = dPitch + (mode === 'above' ? -0.45 : 0);
      fwd = [Math.sin(a) * Math.cos(pitch), Math.sin(pitch), -Math.cos(a) * Math.cos(pitch)];
      eye = mode === 'above' ? [me[0] - Math.sin(a) * 4.2, 4.4, me[2] + Math.cos(a) * 4.2] : [me[0], EYE, me[2]];
    }
    // heard, not seen: you stand facing the goal (or the net), so the pings come from where that puts the ring
    if (ear) { const hf = faceHeading(sim, who, sport); sfx.ear([me[0], EYE, me[2]], [Math.sin(hf), 0, -Math.cos(hf)]); } else sfx.ear(eye, fwd);
    cues(eye);
    scene(eye, now, fwd); const s = stepText();
    if (glasses) {
      // display glasses: one picture, or one per eye side by side (3D mode), with the step card in the light
      const halves = glasses.sbs ? 2 : 1, fov = 0.75, aw = w / halves, r = [-fwd[2], 0, fwd[0]], rl = Math.hypot(r[0], r[2]) || 1;
      const tv = Math.tan(fov / 2), f2 = hudFit(tv * aw / h, tv, 1.4);
      const txt = s.head + '\n' + s.job; if (txt !== panelText) { panelText = txt; drawPanel(s); }
      cardAt([eye[0] + fwd[0] * 1.4, eye[1] + fwd[1] * 1.4 - f2.drop, eye[2] + fwd[2] * 1.4], f2.w, f2.h, eye);
      for (let e = 0; e < halves; e++) {
        const o = halves === 2 ? (e ? 0.032 : -0.032) / rl : 0, ey = [eye[0] + r[0] * o, eye[1], eye[2] + r[2] * o];
        gl.viewport(Math.round(e * cv.width / halves), 0, Math.round(cv.width / halves), cv.height);
        draw(mul(persp(fov, aw / h, 0.05, 300), look(ey, fwd, up)), true);
      }
    } else draw(mul(persp(cam ? (h > w ? 1.05 : 0.75) : h > w ? 1.45 : 1.1, w / h, 0.05, 300), look(eye, fwd, up)), false);
    setText(s);
    sayStep();
  }
  const onOri = e => { if (e.alpha == null) return; const r = Math.PI / 180, so = (screen.orientation && screen.orientation.angle) || window.orientation || 0; ori = { a: e.alpha * r, b: e.beta * r, g: e.gamma * r, s: so * r }; };
  async function camera(on) {
    if (!el) return;
    const v = el.querySelector('video'), b = el.querySelector('[data-a=cam]');
    if (!on) {
      if (stream) stream.getTracks().forEach(x => x.stop()); stream = null; if (v) v.srcObject = null;
      removeEventListener('deviceorientation', onOri); ori = null; el.classList.remove('cam'); if (mode === 'cam') mode = 'eyes'; if (b) b.classList.remove('on');
      return;
    }
    // iOS asks for motion on the tap itself, before anything else waits
    let asked = null; try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') asked = DeviceOrientationEvent.requestPermission(); } catch (e) {}
    addEventListener('deviceorientation', onOri); phoneOff = null; dYaw = 0; mode = 'cam'; el.classList.add('cam'); if (b) b.classList.add('on');
    el.querySelector('.tr-hint').textContent = 'Move your phone to look around · double-tap to recenter'; el.querySelector('.tr-hint').hidden = false;
    const mb = el.querySelector('[data-a=mode]'); if (mb) mb.textContent = 'Eyes';
    try { if (asked) await asked; } catch (e) {}
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      if (!el || mode !== 'cam') { stream.getTracks().forEach(x => x.stop()); stream = null; return; }
      v.srcObject = stream; await v.play();
    } catch (e) { el.classList.remove('cam'); el.querySelector('.tr-hint').textContent = 'No camera here: move your phone to look around'; }
    ctx.track && ctx.track('trace_cam', { motion: ori ? 1 : 0 });
  }

  // ---- Earbuds: Ray-Ban Meta, Oakley Meta, AirPods, any earbuds. The phone in your pocket says each step, paced
  // to the words, a ping comes from where you're going, and a tap on the glasses (or earbuds) pauses and plays ----
  function earIntro() {
    if (!ear) return; t = 0; hold = 0; playing = false; spoken = -1; lates = []; score = null;
    say(`You are ${/^\d+$/.test(tr.name) ? 'number ' + tr.name : tr.name}. ${sim.play.title ? sim.play.title + '. ' : ''}Stand on your spot facing ${faceWords(sim, who, sport)}. Ready. Go.`, () => { if (ear && !playing && t === 0) { playing = true; last = 0; } });
  }
  async function earbuds(on) {
    const ms = navigator.mediaSession, set = (k, f) => { try { ms.setActionHandler(k, f); } catch (e) {} };
    if (!on) {
      if (!ear) return;
      try { ear.a.pause(); URL.revokeObjectURL(ear.a.src); } catch (e) {}
      try { if (ear.lock) ear.lock.release(); } catch (e) {} clearInterval(ear.tick);
      if (ms) ['play', 'pause', 'nexttrack', 'previoustrack'].forEach(k => set(k, null));
      try { speechSynthesis.cancel(); } catch (e) {}
      ear = null; playing = true;
      if (el) { el.classList.remove('ear'); el.querySelector('.tr-hint').hidden = true; }
      return;
    }
    if (xr || ear) return;
    if (glasses) glassMode(false);
    sfx.start();
    const a = new Audio(quiet()); a.loop = true; a.play().catch(() => {});
    ear = { a, lock: null }; el.classList.add('ear');
    const hint = el.querySelector('.tr-hint'); hint.textContent = 'Phone in your pocket: tap your glasses or earbuds to pause and play'; hint.hidden = false;
    earIntro();   // said on the tap itself (iOS lets speech start only there)
    if (ms) {
      try { ms.metadata = new MediaMetadata({ title: `${tr.name} · ${sim.play.title || 'Chalk Talk'}`, artist: 'Chalk Talk Trace', album: sport.name }); } catch (e) {}
      set('play', () => { if (!ear) return; playing = true; spoken = -1; ear.a.play().catch(() => {}); ms.playbackState = 'playing'; });
      set('pause', () => { if (!ear) return; playing = false; ear.a.pause(); ms.playbackState = 'paused'; try { speechSynthesis.cancel(); } catch (e) {} });
      set('nexttrack', () => { t = Math.min(sim.play.beats.length, Math.floor(t) + 1); hold = 0; });
      set('previoustrack', () => { t = Math.max(0, Math.ceil(t) - 2); hold = 0; spoken = -1; });
      ms.playbackState = 'playing';
    }
    // the screen stays on if it can; if it goes off anyway, a timer keeps the steps coming (frames stop when hidden)
    ear.tick = setInterval(() => { if (ear && document.hidden) { advance(performance.now()); sayStep(); } }, 250);
    try { if (navigator.wakeLock) ear.lock = await navigator.wakeLock.request('screen'); } catch (e) {}
    ctx.track && ctx.track('trace_ear', { media: ms ? 1 : 0 });
  }

  // ---- Display glasses (XREAL, VITURE, RayNeo, Rokid, anything that plugs in as a screen): full screen and pure
  // black, so only the light shows; 3D draws one picture per eye side by side for glasses in their 3D mode ----
  const poke = () => { if (!el) return; el.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => { if (el) el.classList.add('idle'); }, 3000); };
  function glassMode(on, sbs) {
    if (!el) return;
    if (!on) {
      glasses = null; el.classList.remove('gl', 'idle'); panelText = '';
      try { if (document.fullscreenElement === el) document.exitFullscreen().catch(() => {}); } catch (e) {}
      return;
    }
    if (mode === 'cam') camera(false); if (ear) earbuds(false);
    glasses = { sbs: !!sbs }; panelText = ''; el.classList.add('gl'); showSheet(false); poke();
    el.querySelector('[data-a=sbs]').textContent = glasses.sbs ? '2D' : '3D';
    try { const r = el.requestFullscreen && el.requestFullscreen({ navigationUI: 'hide' }); if (r && r.catch) r.catch(() => {}); } catch (e) {}
    ctx.track && ctx.track('trace_glasses', { sbs: glasses.sbs ? 1 : 0 });
  }
  const onFs = () => { if (glasses && el && !document.fullscreenElement) glassMode(false); };
  // a keyboard, a ring or a clicker drives it when you can't see the buttons
  const onKey = e => {
    if (!el || xr || !(glasses || ear)) return;
    const n = sim.play.beats.length, k = e.key;
    if (k === ' ' || k === 'Enter') { if (t >= n) t = 0; playing = !playing; if (ear) playing ? ear.a.play().catch(() => {}) : ear.a.pause(); }
    else if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown') { t = Math.min(n, Math.floor(t) + 1); hold = 0; }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { t = Math.max(0, Math.ceil(t) - 2); hold = 0; spoken = -1; }
    else return;
    e.preventDefault(); e.stopPropagation(); poke();
  };

  // ---- every other way in: a code for a headset, Earbuds, Display glasses ----
  function showSheet(on) {
    if (sheet) { sheet.remove(); sheet = null; }
    if (!on || !el) return;
    sheet = document.createElement('div'); sheet.className = 'tr-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Trace on any glasses');
    sheet.innerHTML = `<h3>Trace on any glasses</h3>
      ${ctx.handoff ? '<div class="way"><b>Send to a headset</b><small>Snap Specs, Quest, Vision Pro, Android XR, Pico or Ray-Ban Display: a 4-digit code opens this play and your position there.</small><button type="button" class="tr-xr" data-a="hand">Get a code</button></div><div data-t="code" aria-live="polite"></div>' : ''}
      <div class="way"><b>Earbuds</b><small>Ray-Ban Meta, Oakley Meta, AirPods or any earbuds: every step said out loud with your phone in your pocket, a ping from where you’re going. Tap your glasses or earbuds to pause.</small><button type="button" data-a="ear" class="${ear ? 'on' : ''}">${ear ? 'Stop' : 'Start'}</button></div>
      <div class="way"><b>Display glasses</b><small>XREAL, VITURE, RayNeo, Rokid or any glasses you plug in: full screen, black is clear. 3D if your glasses are in side-by-side mode.</small><span class="bs"><button type="button" data-a="glass">Start</button><button type="button" data-a="glass3d">3D</button></span></div>
      <button type="button" data-a="sheet-x">Done</button>`;
    el.appendChild(sheet);
  }
  async function handoff() {
    const box = sheet && sheet.querySelector('[data-t=code]'); if (!box) return;
    box.innerHTML = '<p>Making a code…</p>';
    try {
      const r = await ctx.handoff(tr.id); if (!sheet || !box.isConnected) return;
      const base = /^(localhost|127\.)/.test(location.hostname) ? location.origin + location.pathname : 'https://mutaafaziz.com/chalktalk/';
      box.innerHTML = `<div class="code"><div class="qr">${qrSvg(base + '?hand=' + r.code + '&go=auto')}</div><div><div class="num">${esc(r.code)}</div><p>On the headset: <b>mutaafaziz.com/chalktalk/go</b>, then the code. Ray-Ban Display: <b>mutaafaziz.com/chalktalk/glasses</b> → Enter a code. Or scan it with a phone. Good for ${Math.round((r.minutes || 120) / 60)} hours.</p></div></div>`;
      ctx.track && ctx.track('trace_hand', {});
    } catch (e) { box.innerHTML = `<p>${esc((e && e.message) || 'Couldn’t make a code.')}</p>`; }
  }

  // ---- WebXR: on a real court or field, fit my room, VR, or a tabletop hologram ----
  async function xrSupport() {
    const out = {}; if (!navigator.xr) return out;
    for (const m of ['immersive-ar', 'immersive-vr']) { try { out[m] = await navigator.xr.isSessionSupported(m); } catch (e) {} }
    return out;
  }
  async function enterXR(m, mode2) {
    sfx.start(); if (mode === 'cam') camera(false); if (ear) earbuds(false); if (glasses) glassMode(false); showSheet(false);
    // hit-test sets a tabletop down on a real surface; dom-overlay keeps the step card and the buttons on a phone's
    // screen in handheld AR (headsets ignore both when they can't)
    const session = await navigator.xr.requestSession(m, { optionalFeatures: ['local-floor', 'hand-tracking', 'hit-test', 'dom-overlay'], domOverlay: { root: el } });
    xr = { session, m }; how = mode2;
    // the words for "go" follow what you hold or use: a pinch, a tap on a phone's screen, a controller's trigger
    const words = () => { press = pressWord(session.inputSources); panelText = ''; };
    words(); session.addEventListener('inputsourceschange', words);
    domOv = !!session.domOverlayState; if (domOv) el.classList.add('xr-dom');
    await gl.makeXRCompatible();
    const layer0 = new XRWebGLLayer(session, gl);
    if ('fixedFoveation' in layer0) layer0.fixedFoveation = 1;   // glow is soft at the edges anyway: fewer pixels out there (Quest)
    session.updateRenderState({ baseLayer: layer0 });
    let space, floor = 0;
    try { space = await session.requestReferenceSpace('local-floor'); } catch (e) { space = await session.requestReferenceSpace('local'); floor = -1.5; }
    hitSrc = null; placing = false;
    if (how === 'table' && session.requestHitTestSource) { try { hitSrc = await session.requestHitTestSource({ space: await session.requestReferenceSpace('viewer') }); placing = true; } catch (e) { hitSrc = null; } }
    ctx.track && ctx.track('trace_xr', { m: m === 'immersive-ar' ? 'ar' : 'vr', how: mode2, hit: hitSrc ? 1 : 0, dom: domOv ? 1 : 0 });
    const F = sport.field, mp = metersPer(sport);
    scale = how === 'room' ? roomScale(tr, sport) : how === 'table' ? 1.1 / (Math.max(F.x[1] - F.x[0], F.y[1] - F.y[0]) * mp) : 1;
    origin = how === 'table' ? [(F.x[0] + F.x[1]) / 2, (F.y[0] + F.y[1]) / 2] : tr.start; shift = [0, 0, 0]; heading0 = 0; anchored = false;
    t = 0; hold = 0; waiting = false; panelPos = null; last = 0; lates = []; score = null; reps = 0; spoken = -1; flown = -1; track = []; lastTrack = null;
    // on a real court or field the field follows you until you stand on your spot facing the goal (or the net, or
    // the ball) and pinch: then it locks, so its lines land on the real ones
    ready = how === 'real'; playing = !ready;
    const ar = m === 'immersive-ar' || session.environmentBlendMode !== 'opaque'; let hadHit = false;
    session.addEventListener('select', () => {
      const n = sim.play.beats.length;
      if (placing) { placing = false; anchored = true; ctx.chime && ctx.chime('ok'); return; }
      if (ready) { ready = false; anchored = true; playing = true; t = 0; lates = []; score = null; track = []; lastTrack = null; ctx.chime && ctx.chime('ok'); return; }
      if (waiting) { waiting = false; lates[Math.floor(t)] = null; t = Math.floor(t) + 1; }
      else if (t >= n) { t = 0; hold = 0; lates = []; score = null; }
      else playing = !playing;
    });
    session.addEventListener('end', () => {
      xr = null; how = null; scale = 1; origin = null; heading0 = 0; shift = [0, 0, 0]; last = 0; ready = false; waiting = false; playing = true; skey = '';
      try { hitSrc && hitSrc.cancel(); } catch (e) {} hitSrc = null; placing = false; domOv = false; track = []; lastTrack = null; if (el) el.classList.remove('xr-dom');
    });
    const onFrame = (now, frame) => {
      if (!xr) return; session.requestAnimationFrame(onFrame);
      const pose = frame.getViewerPose(space); if (!pose) return;
      const hp = pose.transform.position, head = [hp.x, hp.y - floor, hp.z];
      const o = pose.transform.orientation, fz = [2 * (o.x * o.z + o.w * o.y), 0, 1 - 2 * (o.x * o.x + o.y * o.y)], fl = Math.hypot(fz[0], fz[2]) || 1, fwd = [-fz[0] / fl, 0, -fz[2] / fl];
      if (ready || !anchored || placing) {
        if (table()) {
          // tabletop: the hologram rides where you look on a real surface until you set it down (else 0.8 m ahead)
          const hit = placing && hitSrc && frame.getHitTestResults(hitSrc)[0], hpz = hit && hit.getPose(space);
          if (hpz) { const q = hpz.transform.position; anchor([q.x, q.y - floor + 0.01, q.z], fz, 0, origin); hadHit = true; }
          else if (!hadHit) anchor([head[0] + fwd[0] * 0.8, Math.max(0.55, head[1] - 0.6), head[2] + fwd[2] * 0.8], fz, 0, origin);
        } else anchor([head[0], 0, head[2]], fz, how === 'real' ? faceHeading(sim, who, sport) : lookAt(sim, who, 0, sport), tr.start);
        if (!ready && !placing) anchored = true;
      }
      advance(now, head); sfx.ear(head, fwd); cues(head);
      const layer = session.renderState.baseLayer;
      gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
      gl.clearColor(ar ? 0 : 0.008, ar ? 0 : 0.02, ar ? 0 : 0.04, ar ? 0 : 1); gl.clear(gl.COLOR_BUFFER_BIT);
      scene(head, now, fwd); const s = stepText();
      // the step card: on a phone (dom-overlay) it's the page's own card over the camera; on a headset, fitted to this
      // device's view: on a wide headset it floats ahead, a little low (above the far end of a tabletop), and follows
      // lazily; on narrow glasses (Snap Specs) it's smaller and tags along with your gaze
      if (domOv) setText(s);
      else {
        const P0 = pose.views[0].projectionMatrix, dist = table() ? 1.7 : 1.4; fit = hudFit(1 / P0[0], 1 / P0[5], dist);
        const gz = [-fz[0], -2 * (o.y * o.z - o.w * o.x), -fz[2]], txt = s.head + '\n' + s.job;
        const want = fit.follow ? [head[0] + gz[0] * dist, head[1] + gz[1] * dist - fit.drop, head[2] + gz[2] * dist]
          : table() ? [head[0] + fwd[0] * 1.7, head[1] + 0.05, head[2] + fwd[2] * 1.7] : [head[0] + fwd[0] * 1.4, head[1] - fit.drop, head[2] + fwd[2] * 1.4];
        panelPos = panelPos ? panelPos.map((v, j) => v + (want[j] - v) * (fit.follow ? 0.12 : 0.04)) : want;
        if (txt !== panelText) { panelText = txt; drawPanel(s); }
        cardAt(panelPos, fit.w, fit.h, head);
      }
      sayStep();
      for (const view of pose.views) {
        const vpt = layer.getViewport(view); gl.viewport(vpt.x, vpt.y, vpt.width, vpt.height);
        const V = view.transform.inverse.matrix, Fm = new Float32Array(16); Fm.set(V); for (let j = 0; j < 3; j++) Fm[12 + j] += V[4 + j] * floor;   // our floor (y 0) is at `floor` in this space
        draw(mul(view.projectionMatrix, Fm), !domOv);
      }
    };
    session.requestAnimationFrame(onFrame);
  }
  let pcv = null;
  function drawPanel(s) {
    if (!pcv) { pcv = document.createElement('canvas'); pcv.width = 768; pcv.height = 290; }
    const c = pcv.getContext('2d'); c.clearRect(0, 0, 768, 290);
    c.fillStyle = '#ffc75a'; c.font = '800 34px system-ui, sans-serif'; c.fillText(s.head.toUpperCase(), 20, 52, 728);
    c.fillStyle = '#ffffff'; c.font = '800 54px system-ui, sans-serif';
    const words = s.job.split(' '); let line = '', y = 128;
    for (const w of words) { if (c.measureText(line + w).width > 720 && line) { c.fillText(line.trim(), 20, y); line = ''; y += 66; if (y > 270) break; } line += w + ' '; }
    if (y <= 270) c.fillText(line.trim(), 20, y);
    if (!panel) panel = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, panel); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pcv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  // ---- one tap in: a link (?trace=1&go=auto, a handed code) lands on one big button that goes straight into the
  // best way this device has (a browser starts AR/VR only from a tap, so it can't be zero). go: auto, ar, room,
  // table, vr, cam, ear, glass, glass3d ----
  function launch(go, s, phone, place) {
    const ar = !!s['immersive-ar'], vr = !!s['immersive-vr'];
    const name = { ar: `Walk it on a real ${place}`, room: 'Walk it in this room', table: 'Put it on a table', vr: 'Walk it in VR', cam: 'Walk it through the camera', ear: 'Hear it in my earbuds', glass: 'Show it on my glasses', glass3d: 'Show it on my glasses in 3D', screen: 'Walk it on this screen' };
    const ok = { ar, room: ar, table: ar || vr, vr, cam: phone, ear: true, glass: true, glass3d: true };
    let main = go === 'auto' ? (ar ? 'room' : vr ? 'vr' : phone ? 'cam' : 'screen') : ok[go] ? go : (ar ? 'room' : vr ? 'vr' : phone ? 'cam' : 'screen');
    const more = (ar ? ['ar', 'room', 'table'] : vr ? ['vr', 'table'] : phone ? ['cam', 'ear'] : ['ear', 'glass']).filter(k => k !== main).slice(0, 3);
    const box = document.createElement('div'); box.className = 'tr-go';
    box.innerHTML = `<p>You are <b>${esc(tr.name)}</b>${sim.play.title ? ` · ${esc(sim.play.title)}` : ''}</p><button type="button" class="big" data-a="${main === 'screen' ? 'go-x' : main}" data-go="1">${esc(name[main])}</button>
      ${more.length ? `<div class="alt">${more.map(k => `<button type="button" data-a="${k}" data-go="1">${esc((t2 => t2[0].toUpperCase() + t2.slice(1))(name[k].replace(/^Walk it /, '')))}</button>`).join('')}</div>` : ''}
      <small>${main === 'ar' || main === 'room' || main === 'vr' ? `Then ${esc(press.toLowerCase())} to start. ` : ''}Another position? Tap it along the top.</small>`;
    el.appendChild(box); playing = false;
    ctx.track && ctx.track('trace_go', { go, main });
  }

  // ---- open / close ----
  function pick(i) {
    who = i; tr = trace(sim, i, sport, name); lines = sport.field.lines({ los: sim.play.los }); ver++; track = []; lastTrack = null; t = 0; hold = 0; yaw = null; dYaw = 0; spoken = -1; flown = -1; waiting = false; lates = []; score = null; reps = 0; phoneOff = null;
    bounces = sim.play.beats.map((_, k) => bounceIn(sim, sport, k));
    flights = sim.play.beats.map((_, k) => flightIn(sim, sport, k));
    if (ear) earIntro();
    el.querySelectorAll('.tr-who button').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
    ctx.track && ctx.track('trace_pick', { side: tr.side });
  }
  async function open(whoId, go) {
    sim = ctx.sim(); sport = ctx.sport(); if (!sim || !sport) return;
    if (!document.querySelector('style[data-chalk-talk-trace]')) { const st = document.createElement('style'); st.dataset.chalkTalkTrace = ''; st.textContent = CSS; document.head.appendChild(st); }
    close();
    const list = positions(sim, sport, name);
    el = document.createElement('div'); el.className = 'ct-tr'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Trace your path');
    el.innerHTML = `<video muted playsinline autoplay aria-hidden="true"></video><canvas></canvas><div class="tr-top"><div class="tr-who" role="group" aria-label="Your position">${list.map(p => `<button type="button" data-i="${p.i}" class="${p.side === 'D' ? 'd' : ''}" aria-label="${esc((p.side === 'D' ? (sport.sides ? sport.sides.D + ' ' : 'Defense ') : '') + p.label)}">${esc(p.side === 'D' && !sport.rally ? 'X' + p.short : p.short)}</button>`).join('')}</div><button type="button" class="tr-x" data-a="close" aria-label="Close trace">✕</button></div>
      <p class="tr-hint">Drag to look around</p>
      <div class="tr-card"><div class="tr-step" data-t="head"></div><div class="tr-job" data-t="job"></div><div class="tr-row"><button type="button" data-a="prev" aria-label="Previous step">⏮</button><button type="button" data-a="play" aria-label="Play or pause">⏯</button><button type="button" data-a="next" aria-label="Next step">⏭</button><button type="button" data-a="mode">Eyes</button><button type="button" data-a="speed" aria-label="Speed">1×</button><span class="sp"></span><span data-t="xr"></span></div></div>
      <div class="tr-glbar"><button type="button" data-a="sbs">3D</button><button type="button" data-a="glx">Exit glasses</button></div>`;
    ctx.root.appendChild(el);
    try { setup(el.querySelector('canvas'), true); } catch (e) { console.error('[chalk-talk] trace', e); el.querySelector('[data-t=job]').textContent = 'This device can’t draw 3D (WebGL is off).'; return; }
    sfx.start();
    const id = whoId ? sim.play.players.findIndex(p => p.id === whoId) : -1;
    pick(id >= 0 ? id : busiest(sim));
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.go) { const g = el.querySelector('.tr-go'); if (g) g.remove(); playing = true; t = 0; }
      if (b.dataset.i != null) pick(+b.dataset.i);
      const a = b.dataset.a, n = sim.play.beats.length;
      if (a === 'close') { if (xr) { try { xr.session.end(); } catch (e2) {} } else close(); }
      if (a === 'play') { if (t >= n) t = 0; playing = !playing; if (ear) playing ? ear.a.play().catch(() => {}) : ear.a.pause(); }
      if (a === 'next') { t = Math.min(n, Math.floor(t) + 1); hold = 0; }
      if (a === 'prev') { t = Math.max(0, Math.ceil(t) - 2); hold = 0; }
      if (a === 'mode') { if (mode === 'cam') camera(false); else mode = mode === 'eyes' ? 'above' : 'eyes'; b.textContent = mode === 'eyes' ? 'Eyes' : 'Above'; }
      if (a === 'speed') { speed = speed === 1 ? 0.5 : 1; b.textContent = speed === 1 ? '1×' : '½×'; }
      if (a === 'cam') camera(mode !== 'cam');
      if (a === 'ways') showSheet(!sheet);
      if (a === 'sheet-x') showSheet(false);
      if (a === 'hand') handoff();
      if (a === 'ear') { if (ear) earbuds(false); else { earbuds(true); showSheet(false); } }
      if (a === 'glass' || a === 'glass3d') glassMode(true, a === 'glass3d');
      if (a === 'sbs' && glasses) { glasses.sbs = !glasses.sbs; b.textContent = glasses.sbs ? '2D' : '3D'; poke(); }
      if (a === 'glx') glassMode(false);
      const go = { ar: ['immersive-ar', 'real'], room: ['immersive-ar', 'room'], vr: ['immersive-vr', 'vr'], table: [xrs['immersive-ar'] ? 'immersive-ar' : 'immersive-vr', 'table'] }[a];
      if (go) enterXR(go[0], go[1]).catch(err => { el.querySelector('[data-t=job]').textContent = 'Couldn’t start: ' + (err && err.message || err); });
    });
    // drag to look; a double tap looks where the player looks (and recenters the phone)
    const cv = el.querySelector('canvas'); let drag = null;
    // handheld AR: a tap on the card's buttons is a button, not a select in the scene
    el.addEventListener('beforexrselect', e => { if (e.target.closest && e.target.closest('button, .tr-sheet, .tr-card')) e.preventDefault(); });
    cv.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, dYaw, dPitch]; dragging = true; cv.setPointerCapture(e.pointerId); if (mode !== 'cam') el.querySelector('.tr-hint').hidden = true; });
    cv.addEventListener('pointermove', e => { if (glasses) poke(); if (!drag) return; dYaw = drag[2] + (e.clientX - drag[0]) * 0.006; dPitch = Math.max(-1.2, Math.min(0.6, drag[3] + (e.clientY - drag[1]) * 0.005)); });
    cv.addEventListener('pointerup', e => {
      if (glasses && drag && Math.hypot(e.clientX - drag[0], e.clientY - drag[1]) < 8) { if (t >= sim.play.beats.length) t = 0; playing = !playing; }
      drag = null; dragging = false;
    });
    cv.addEventListener('dblclick', () => { dYaw = 0; dPitch = -0.2; phoneOff = null; });
    const place = (sport.trace && sport.trace.place) || 'field', phone = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && matchMedia('(pointer: coarse)').matches;
    xrSupport().then(s => {
      xrs = s; const b = [];
      if (s['immersive-ar']) b.push(`<button type="button" class="tr-xr" data-a="ar">On a real ${place}</button><button type="button" data-a="room">Fit my room</button><button type="button" data-a="table">Tabletop</button>`);
      if (s['immersive-vr']) b.push('<button type="button" class="tr-xr" data-a="vr">VR</button>' + (s['immersive-ar'] ? '' : '<button type="button" data-a="table">Tabletop</button>'));
      if (phone) b.push('<button type="button" class="tr-xr" data-a="cam">Camera</button>');
      b.push('<button type="button" data-a="ways">Any glasses</button>');
      if (el) el.querySelector('[data-t=xr]').innerHTML = b.join('');
      if (el && go) launch(go, s, phone, place);
    });
    addEventListener('keydown', onKey, true); document.addEventListener('fullscreenchange', onFs);
    last = 0; playing = true; mode = 'eyes'; speed = 1; raf = requestAnimationFrame(frame);
    ctx.track && ctx.track('trace', { sport: sport.id });
  }
  function close() {
    cancelAnimationFrame(raf); raf = 0;
    if (xr) { try { xr.session.end(); } catch (e) {} xr = null; }
    camera(false); earbuds(false); glassMode(false); showSheet(false); sfx.stop(); clearTimeout(idleT);
    removeEventListener('keydown', onKey, true); document.removeEventListener('fullscreenchange', onFs);
    if (el) { el.remove(); el = null; } gl = null; atlas = null; panel = null; panelText = ''; GB = null; skey = ''; shown = ['', '']; res = 1; fms = []; lastNow = 0;
    ctx.onClose && ctx.onClose();
  }
  // Esc: out of the sheet, Display glasses or Earbuds first; false when there's nothing to step back from
  function back() { if (sheet) { showSheet(false); return true; } if (glasses) { glassMode(false); return true; } if (ear) { earbuds(false); return true; } return false; }
  return { open, close, back, get on() { return !!el; } };
}
