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
// Everything is drawn with additive light, so on see-through glasses black is simply not there. Own WebGL (no
// three.js); pure parts live in engine/trace.js.

import { trace, lookAt, roomScale, positions, busiest, metersPer, bounceIn, flightIn, faceHeading, faceWords, repScore } from './engine/trace.js';

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
    stop() { try { ac && ac.close(); } catch (e) {} ac = null; }
  };
}

// ---- shaders: one glow (ribbons, pillars, sprites), one for text ----
const VS = 'attribute vec3 p; attribute vec2 uv; attribute vec4 c; attribute float f; uniform mat4 vp; varying vec2 vU; varying vec4 vC; varying float vF; void main(){ vU = uv; vC = c; vF = f; gl_Position = vp * vec4(p, 1.0); }';
const FS = 'precision mediump float; varying vec2 vU; varying vec4 vC; varying float vF; uniform float time;' +
  'void main(){ float a; if (vF < -0.5) { a = exp(-dot(vU, vU) * 3.2) * vC.a; } else { float v = vU.y; a = (exp(-v * v * 7.0) + exp(-v * v * 1.6) * 0.4) * vC.a * mix(1.0, 0.5 + 0.5 * sin(vU.x * 3.2 - time * 5.0), vF); }' +
  ' gl_FragColor = vec4(vC.rgb * a, a); }';
const TVS = 'attribute vec3 p; attribute vec2 uv; attribute vec4 c; uniform mat4 vp; varying vec2 vU; varying vec4 vC; void main(){ vU = uv; vC = c; gl_Position = vp * vec4(p, 1.0); }';
const TFS = 'precision mediump float; varying vec2 vU; varying vec4 vC; uniform sampler2D tex; void main(){ float a = texture2D(tex, vU).a * vC.a; gl_FragColor = vec4(vC.rgb * a, a); }';

function program(gl, vs, fs) {
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  const at = {}; ['p', 'uv', 'c', 'f'].forEach(n => { at[n] = gl.getAttribLocation(p, n); });
  return { p, at, vp: gl.getUniformLocation(p, 'vp'), time: gl.getUniformLocation(p, 'time'), tex: gl.getUniformLocation(p, 'tex') };
}

// ---- geometry, pushed into flat arrays: glow verts are p3 uv2 c4 f1, text verts p3 uv2 c4 ----
function quad(out, a, b, c, d, ua, ub, uc, ud, col, f) {   // a-b-c-d around, two triangles
  for (const [p, u] of [[a, ua], [b, ub], [c, uc], [a, ua], [c, uc], [d, ud]]) {
    out.push(p[0], p[1], p[2], u[0], u[1], p.c ? p.c[0] : col[0], p.c ? p.c[1] : col[1], p.c ? p.c[2] : col[2], p.c ? p.c[3] : col[3]);
    if (f != null) out.push(f);
  }
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
const ring = (out, c, r, w, col, f) => ribbon(out, Array.from({ length: 33 }, (_, i) => [c[0] + Math.cos(i / 32 * Math.PI * 2) * r, c[1], c[2] + Math.sin(i / 32 * Math.PI * 2) * r]), w, col, f);
function arc(out, a, b, h, w, col, f, cam) {   // a ribbon turned to face you, lifted (or sagging) in the middle
  const n = 12, pts = [];
  for (let j = 0; j <= n; j++) { const u = j / n; pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(u * Math.PI) * h, a[2] + (b[2] - a[2]) * u]); }
  beam(out, pts, w, col, f, cam);
}
function beam(out, pts, w, col, f, cam) {   // a ribbon along any 3D polyline, turned to face you (posts, rims, the ball's flight)
  const n = pts.length - 1; let u = 0;
  for (let j = 0; j < n; j++) {
    const p = pts[j], q = pts[j + 1], m = [(p[0] + q[0]) / 2 - cam[0], (p[1] + q[1]) / 2 - cam[1], (p[2] + q[2]) / 2 - cam[2]], d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    let nx = d[1] * m[2] - d[2] * m[1], ny = d[2] * m[0] - d[0] * m[2], nz = d[0] * m[1] - d[1] * m[0]; const nl = Math.hypot(nx, ny, nz) || 1; nx *= w / 2 / nl; ny *= w / 2 / nl; nz *= w / 2 / nl;
    const L = Math.hypot(...d), u2 = u + L; if (L < 1e-5) continue;
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
`;

export function createTrace(ctx) {
  let el = null, gl = null, G = null, T = null, buf = null, tbuf = null, atlas = null, cells = {}, panel = null;
  let sim = null, sport = null, tr = null, who = -1, t = 0, playing = true, hold = 0, last = 0, raf = 0, mode = 'eyes', speed = 1;
  let yaw = null, dYaw = 0, dPitch = -0.2, xr = null, xrs = {}, how = null, scale = 1, origin = null, heading0 = 0, shift = [0, 0, 0], anchored = false;
  let panelPos = null, panelText = '', waiting = false, waitAt = 0, pinged = 0, spoken = -1, flown = -1, bounces = [], flights = [], ready = false, behind = false;
  let lates = [], reps = 0, score = null, ori = null, phoneOff = null, stream = null;
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
    G = program(gl, VS, FS); T = program(gl, TVS, TFS); buf = gl.createBuffer(); tbuf = gl.createBuffer();
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
  function lineOf(g, l, u, cam) {
    if (!l.p || l.p.length < 2) return;
    if (l.p.some(q => (q[2] || 0) > 0.05)) beam(g, l.p.map(q => W(q[0], q[1], q[2] || 0)), (0.03 + (l.w || 1) * 0.012) * u, (l.hot ? WHITE : l.warm ? [1, 0.86, 0.7] : ICE).concat(l.hot ? 0.8 : 0.5), 0, cam);   // stands up: goals, the hoop, pylons, the net
    else ribbon(g, l.p.map(q => W(q[0], q[1], (q[2] || 0) + 0.01)), (0.05 + (l.w || 1) * 0.02) * u, ICE.concat((walking() ? 0.22 : 0.4) * (l.hot ? 1.8 : 1)), 0);
  }

  // ---- the scene at time t, seen from cam (fwd: where you're looking, for the look-here cue) ----
  function scene(cam, now, fwd) {
    const g = [], tx = [], u = U(), n = sim.play.beats.length, P = sim.posAt(t), P2 = sim.posAt(Math.min(n, t + 0.06)), k = Math.min(n - 1, Math.floor(t)), ended = t >= n;
    const B = sim.ballAt(t), floor = W(0, 0, 0)[1];
    // the field: lines on the floor, and whatever stands up (a sport can give its landmarks at their real size)
    const props = sport.trace && sport.trace.props;
    for (const l of sport.field.lines({ los: sim.play.los })) if (!(props && l.p && l.p.some(q => (q[2] || 0) > 0.05))) lineOf(g, l, u, cam);
    if (props) for (const l of props()) lineOf(g, l, u, cam);
    // a net sport's court: the kitchens glow faintly red on the floor (no volleys in there), the net is a curtain of
    // light at its real height with a bright top band, and the ball's bounce this step is a ring where it lands
    const C = sport.court;
    if (C) {
      const h = C.W / 2, nn = C.net, zs = metersPer(sport) * (table() ? scale : Math.min(1, scale * 1.4)), flat = (x0, y0, x1, y1, col) => quad(g, W(x0, y0, 0.006), W(x1, y0, 0.006), W(x1, y1, 0.006), W(x0, y1, 0.006), [0, 0], [0, 0], [0, 0], [0, 0], col, 0);
      flat(-h, nn - C.nvz, h, nn, RED.concat(walking() ? 0.07 : 0.1)); flat(-h, nn, h, nn + C.nvz, RED.concat(walking() ? 0.07 : 0.1));
      quad(g, W(-C.post, nn, 0), W(C.post, nn, 0), W(C.post, nn, C.netMid), W(-C.post, nn, C.netMid), [0, 0], [0, 0], [0, 0], [0, 0], WHITE.concat(walking() ? 0.05 : 0.07), 0);
      arc(g, W(-C.post, nn, C.netH), W(C.post, nn, C.netH), -(C.netH - C.netMid) * zs, 0.07 * u, WHITE.concat(0.85), 0, cam);
      for (const x of [-C.post, C.post]) pillar(g, W(x, nn, 0), 0.07 * u, C.netH * zs, WHITE.concat(0.6), cam);
      const bz = bounces[k];
      if (bz && !ended) { const f = t - k, on = f > 0.25 && f < 0.98, c = W(bz[0], bz[1], 0.02); ring(g, c, (0.22 + (on ? 0.08 * Math.sin(now / 120) : 0)) * u, 0.08 * u, ICE.concat(on ? 0.9 : 0.35), 0); }
    }
    // your path: done faint, now bright and flowing, to come dimmer; a ring where each move ends
    tr.steps.forEach(s => {
      if (s.pts.length < 2) return;
      const now0 = s.k === k && !ended, done = s.k < k || ended, pts = s.pts.map(q => W(q[0], q[1], 0.02));
      ribbon(g, pts, (walking() ? 0.3 : 0.36) * u, GOLD.concat(now0 ? 0.95 : done ? 0.2 : 0.42), now0 ? 1 : done ? 0 : 0.4);
      if (s.moved) {
        const e = W(s.to[0], s.to[1], 0.03), pulse = now0 ? 0.65 + 0.35 * Math.sin(now / 160) : done ? 0.25 : 0.4;
        ring(g, e, (now0 && waiting ? 0.38 + 0.06 * Math.sin(now / 90) : 0.38) * u, 0.12 * u, GOLD.concat(pulse), 0);
        if (cells[String(s.k + 1)]) label(tx, [e[0], e[1] + 0.12 * u, e[2]], 0.44 * u, 0.22 * u, cells[String(s.k + 1)], GOLD.concat(done ? 0.35 : 0.95), cam);
      }
    });
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
        if (Math.abs(d) > 0.8) for (let j = 0; j < 3; j++) {
          const a = yawOf(fwd) + Math.sign(d) * (0.35 + j * 0.09), pulse = 0.5 + 0.5 * Math.sin(now / 110 - j);
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
    return { g, tx };
  }
  function draw(vp, data) {
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.disable(gl.DEPTH_TEST);
    const run = (P, arr, stride, b) => {
      if (!arr.length) return;
      gl.useProgram(P.p); gl.uniformMatrix4fv(P.vp, false, vp); if (P.time) gl.uniform1f(P.time, performance.now() / 1000);
      gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.DYNAMIC_DRAW);
      const S = stride * 4; let o = 0;
      for (const [n, sz] of [['p', 3], ['uv', 2], ['c', 4], ['f', 1]]) { if (n === 'f' && stride < 10) break; const a = P.at[n]; if (a >= 0) { gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, sz, gl.FLOAT, false, S, o); } o += sz * 4; }
      gl.drawArrays(gl.TRIANGLES, 0, arr.length / stride);
      for (const n of ['p', 'uv', 'c', 'f']) if (P.at[n] >= 0) gl.disableVertexAttribArray(P.at[n]);
    };
    run(G, data.g, 10, buf);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlas); gl.useProgram(T.p); gl.uniform1i(T.tex, 0);
    run(T, data.tx, 9, tbuf);
  }

  // ---- the clock: one beat every BEAT_S seconds (÷ speed); walking it in XR it waits for you at the end of each
  // of your moves, pings from the ring while it waits, and scores the rep ----
  function advance(now, head) {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
    const n = sim.play.beats.length;
    if (!playing) return;
    if (t >= n) { hold += dt; if (hold > (score ? 4 : 2.2)) { t = 0; hold = 0; lates = []; score = null; } return; }
    const k = Math.floor(t), next = t + dt * speed / BEAT_S;
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
    if (t >= n && walking()) finishRep();
  }
  function finishRep() {
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
    if (ready) return { head: `On a real ${(sport.trace && sport.trace.place) || 'field'} · you are ${tr.name}`, job: `Stand on your spot facing ${faceWords(sim, who, sport)}. Pinch to start.` };
    if (t >= n && score) return { head: `Rep ${reps} · ${'★'.repeat(score.stars)}${'☆'.repeat(3 - score.stars)}${score.beat ? ' · new best' : ''}`, job: `${score.onTime} of ${score.moves} moves on time${score.avg > 0.4 ? `, ${score.avg.toFixed(1)} s late on average` : ''}. Again in a moment.` };
    if (t >= n) return { head: 'That’s the play', job: 'Again from the top in a moment.' };
    return { head: `Step ${k + 1} of ${n} · you are ${tr.name}`, job: waiting ? 'Walk to the ring to keep going' : behind ? 'Catch your ghost · ' + tr.steps[k].job : tr.steps[k].job };
  }
  function sayStep() {
    const k = Math.floor(t); if (k === spoken || !ctx.speak || t >= sim.play.beats.length || ready) return;
    spoken = k; ctx.speak(tr.steps[k].job);
  }

  // ---- first person on a screen; on a phone with Camera, the light over the camera and the phone is your eyes ----
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!el || xr) return;
    advance(now);
    const cv = el.querySelector('canvas'), dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const cam = mode === 'cam';
    gl.viewport(0, 0, cv.width, cv.height); if (cam) gl.clearColor(0, 0, 0, 0); else gl.clearColor(0.008, 0.02, 0.04, 1); gl.clear(gl.COLOR_BUFFER_BIT);
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
    const vp = mul(persp(cam ? (h > w ? 1.05 : 0.75) : h > w ? 1.45 : 1.1, w / h, 0.05, 300), look(eye, fwd, up));
    sfx.ear(eye, fwd); cues(eye);
    draw(vp, scene(eye, now, fwd));
    const s = stepText(); el.querySelector('[data-t=head]').textContent = s.head; el.querySelector('[data-t=job]').textContent = s.job;
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

  // ---- WebXR: on a real court or field, fit my room, VR, or a tabletop hologram ----
  async function xrSupport() {
    const out = {}; if (!navigator.xr) return out;
    for (const m of ['immersive-ar', 'immersive-vr']) { try { out[m] = await navigator.xr.isSessionSupported(m); } catch (e) {} }
    return out;
  }
  async function enterXR(m, mode2) {
    sfx.start(); if (mode === 'cam') camera(false);
    const session = await navigator.xr.requestSession(m, { optionalFeatures: ['local-floor', 'hand-tracking'] });
    xr = { session, m }; how = mode2; ctx.track && ctx.track('trace_xr', { m: m === 'immersive-ar' ? 'ar' : 'vr', how: mode2 });
    await gl.makeXRCompatible();
    session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });
    let space, floor = 0;
    try { space = await session.requestReferenceSpace('local-floor'); } catch (e) { space = await session.requestReferenceSpace('local'); floor = -1.5; }
    const F = sport.field, mp = metersPer(sport);
    scale = how === 'room' ? roomScale(tr, sport) : how === 'table' ? 1.1 / (Math.max(F.x[1] - F.x[0], F.y[1] - F.y[0]) * mp) : 1;
    origin = how === 'table' ? [(F.x[0] + F.x[1]) / 2, (F.y[0] + F.y[1]) / 2] : tr.start; shift = [0, 0, 0]; heading0 = 0; anchored = false;
    t = 0; hold = 0; waiting = false; panelPos = null; last = 0; lates = []; score = null; reps = 0; spoken = -1; flown = -1;
    // on a real court or field the field follows you until you stand on your spot facing the goal (or the net, or
    // the ball) and pinch: then it locks, so its lines land on the real ones
    ready = how === 'real'; playing = !ready;
    const ar = m === 'immersive-ar' || session.environmentBlendMode !== 'opaque';
    session.addEventListener('select', () => {
      const n = sim.play.beats.length;
      if (ready) { ready = false; anchored = true; playing = true; t = 0; lates = []; score = null; ctx.chime && ctx.chime('ok'); return; }
      if (waiting) { waiting = false; lates[Math.floor(t)] = null; t = Math.floor(t) + 1; }
      else if (t >= n) { t = 0; hold = 0; lates = []; score = null; }
      else playing = !playing;
    });
    session.addEventListener('end', () => { xr = null; how = null; scale = 1; origin = null; heading0 = 0; shift = [0, 0, 0]; last = 0; ready = false; waiting = false; playing = true; });
    const onFrame = (now, frame) => {
      if (!xr) return; session.requestAnimationFrame(onFrame);
      const pose = frame.getViewerPose(space); if (!pose) return;
      const hp = pose.transform.position, head = [hp.x, hp.y - floor, hp.z];
      const o = pose.transform.orientation, fz = [2 * (o.x * o.z + o.w * o.y), 0, 1 - 2 * (o.x * o.x + o.y * o.y)], fl = Math.hypot(fz[0], fz[2]) || 1, fwd = [-fz[0] / fl, 0, -fz[2] / fl];
      if (ready || !anchored) {
        if (table()) anchor([head[0] + fwd[0] * 0.8, Math.max(0.55, head[1] - 0.6), head[2] + fwd[2] * 0.8], fz, 0, origin);
        else anchor([head[0], 0, head[2]], fz, how === 'real' ? faceHeading(sim, who, sport) : lookAt(sim, who, 0, sport), tr.start);
        if (!ready) anchored = true;
      }
      advance(now, head); sfx.ear(head, fwd); cues(head);
      const layer = session.renderState.baseLayer;
      gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
      gl.clearColor(ar ? 0 : 0.008, ar ? 0 : 0.02, ar ? 0 : 0.04, ar ? 0 : 1); gl.clear(gl.COLOR_BUFFER_BIT);
      const data = scene(head, now, fwd), s = stepText(), txt = s.head + '\n' + s.job;
      // the step card: floats ahead of you, a little low (above the far end of a tabletop), and follows lazily
      const want = table() ? [head[0] + fwd[0] * 1.7, head[1] + 0.05, head[2] + fwd[2] * 1.7] : [head[0] + fwd[0] * 1.4, head[1] - 0.45, head[2] + fwd[2] * 1.4];
      panelPos = panelPos ? panelPos.map((v, j) => v + (want[j] - v) * 0.04) : want;
      if (txt !== panelText) { panelText = txt; drawPanel(s); }
      sayStep();
      for (const view of pose.views) {
        const vpt = layer.getViewport(view); gl.viewport(vpt.x, vpt.y, vpt.width, vpt.height);
        const V = view.transform.inverse.matrix, Fm = new Float32Array(16); Fm.set(V); for (let j = 0; j < 3; j++) Fm[12 + j] += V[4 + j] * floor;   // our floor (y 0) is at `floor` in this space
        const vp = mul(view.projectionMatrix, Fm);
        draw(vp, data);
        if (panel) { const pt = []; label(pt, panelPos, 0.9, 0.34, [0, 0, 1, 1], [1, 1, 1, 1], head); gl.bindTexture(gl.TEXTURE_2D, panel); gl.useProgram(T.p); gl.uniformMatrix4fv(T.vp, false, vp); runPanel(pt); }
      }
    };
    session.requestAnimationFrame(onFrame);
  }
  function drawPanel(s) {
    const cv = document.createElement('canvas'); cv.width = 768; cv.height = 290; const c = cv.getContext('2d');
    c.fillStyle = '#ffc75a'; c.font = '800 34px system-ui, sans-serif'; c.fillText(s.head.toUpperCase(), 20, 52, 728);
    c.fillStyle = '#ffffff'; c.font = '800 54px system-ui, sans-serif';
    const words = s.job.split(' '); let line = '', y = 128;
    for (const w of words) { if (c.measureText(line + w).width > 720 && line) { c.fillText(line.trim(), 20, y); line = ''; y += 66; if (y > 270) break; } line += w + ' '; }
    if (y <= 270) c.fillText(line.trim(), 20, y);
    if (!panel) panel = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, panel); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  function runPanel(arr) {
    gl.bindBuffer(gl.ARRAY_BUFFER, tbuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.DYNAMIC_DRAW);
    let o = 0; for (const [n, sz] of [['p', 3], ['uv', 2], ['c', 4]]) { const a = T.at[n]; gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, sz, gl.FLOAT, false, 36, o); o += sz * 4; }
    gl.drawArrays(gl.TRIANGLES, 0, arr.length / 9);
  }

  // ---- open / close ----
  function pick(i) {
    who = i; tr = trace(sim, i, sport, name); t = 0; hold = 0; yaw = null; dYaw = 0; spoken = -1; flown = -1; waiting = false; lates = []; score = null; reps = 0; phoneOff = null;
    bounces = sim.play.beats.map((_, k) => bounceIn(sim, sport, k));
    flights = sim.play.beats.map((_, k) => flightIn(sim, sport, k));
    el.querySelectorAll('.tr-who button').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
    ctx.track && ctx.track('trace_pick', { side: tr.side });
  }
  async function open(whoId) {
    sim = ctx.sim(); sport = ctx.sport(); if (!sim || !sport) return;
    if (!document.querySelector('style[data-chalk-talk-trace]')) { const st = document.createElement('style'); st.dataset.chalkTalkTrace = ''; st.textContent = CSS; document.head.appendChild(st); }
    close();
    const list = positions(sim, sport, name);
    el = document.createElement('div'); el.className = 'ct-tr'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Trace your path');
    el.innerHTML = `<video muted playsinline autoplay aria-hidden="true"></video><canvas></canvas><div class="tr-top"><div class="tr-who" role="group" aria-label="Your position">${list.map(p => `<button type="button" data-i="${p.i}" class="${p.side === 'D' ? 'd' : ''}" aria-label="${esc((p.side === 'D' ? (sport.sides ? sport.sides.D + ' ' : 'Defense ') : '') + p.label)}">${esc(p.side === 'D' && !sport.rally ? 'X' + p.short : p.short)}</button>`).join('')}</div><button type="button" class="tr-x" data-a="close" aria-label="Close trace">✕</button></div>
      <p class="tr-hint">Drag to look around</p>
      <div class="tr-card"><div class="tr-step" data-t="head"></div><div class="tr-job" data-t="job"></div><div class="tr-row"><button type="button" data-a="prev" aria-label="Previous step">⏮</button><button type="button" data-a="play" aria-label="Play or pause">⏯</button><button type="button" data-a="next" aria-label="Next step">⏭</button><button type="button" data-a="mode">Eyes</button><button type="button" data-a="speed" aria-label="Speed">1×</button><span class="sp"></span><span data-t="xr"></span></div></div>`;
    ctx.root.appendChild(el);
    try { setup(el.querySelector('canvas'), true); } catch (e) { el.querySelector('[data-t=job]').textContent = 'This device can’t draw 3D (WebGL is off).'; return; }
    sfx.start();
    const id = whoId ? sim.play.players.findIndex(p => p.id === whoId) : -1;
    pick(id >= 0 ? id : busiest(sim));
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.i != null) pick(+b.dataset.i);
      const a = b.dataset.a, n = sim.play.beats.length;
      if (a === 'close') close();
      if (a === 'play') { if (t >= n) t = 0; playing = !playing; }
      if (a === 'next') { t = Math.min(n, Math.floor(t) + 1); hold = 0; }
      if (a === 'prev') { t = Math.max(0, Math.ceil(t) - 2); hold = 0; }
      if (a === 'mode') { if (mode === 'cam') camera(false); else mode = mode === 'eyes' ? 'above' : 'eyes'; b.textContent = mode === 'eyes' ? 'Eyes' : 'Above'; }
      if (a === 'speed') { speed = speed === 1 ? 0.5 : 1; b.textContent = speed === 1 ? '1×' : '½×'; }
      if (a === 'cam') camera(mode !== 'cam');
      const go = { ar: ['immersive-ar', 'real'], room: ['immersive-ar', 'room'], vr: ['immersive-vr', 'vr'], table: [xrs['immersive-ar'] ? 'immersive-ar' : 'immersive-vr', 'table'] }[a];
      if (go) enterXR(go[0], go[1]).catch(err => { el.querySelector('[data-t=job]').textContent = 'Couldn’t start: ' + (err && err.message || err); });
    });
    // drag to look; a double tap looks where the player looks (and recenters the phone)
    const cv = el.querySelector('canvas'); let drag = null;
    cv.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, dYaw, dPitch]; cv.setPointerCapture(e.pointerId); if (mode !== 'cam') el.querySelector('.tr-hint').hidden = true; });
    cv.addEventListener('pointermove', e => { if (!drag) return; dYaw = drag[2] + (e.clientX - drag[0]) * 0.006; dPitch = Math.max(-1.2, Math.min(0.6, drag[3] + (e.clientY - drag[1]) * 0.005)); });
    cv.addEventListener('pointerup', () => { drag = null; });
    cv.addEventListener('dblclick', () => { dYaw = 0; dPitch = -0.2; phoneOff = null; });
    const place = (sport.trace && sport.trace.place) || 'field', phone = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && matchMedia('(pointer: coarse)').matches;
    xrSupport().then(s => {
      xrs = s; const b = [];
      if (s['immersive-ar']) b.push(`<button type="button" class="tr-xr" data-a="ar">On a real ${place}</button><button type="button" data-a="room">Fit my room</button><button type="button" data-a="table">Tabletop</button>`);
      if (s['immersive-vr']) b.push('<button type="button" class="tr-xr" data-a="vr">VR</button>' + (s['immersive-ar'] ? '' : '<button type="button" data-a="table">Tabletop</button>'));
      if (phone) b.push('<button type="button" class="tr-xr" data-a="cam">Camera</button>');
      if (el) el.querySelector('[data-t=xr]').innerHTML = b.join('');
    });
    last = 0; playing = true; mode = 'eyes'; speed = 1; raf = requestAnimationFrame(frame);
    ctx.track && ctx.track('trace', { sport: sport.id });
  }
  function close() {
    cancelAnimationFrame(raf); raf = 0;
    if (xr) { try { xr.session.end(); } catch (e) {} xr = null; }
    camera(false); sfx.stop();
    if (el) { el.remove(); el = null; } gl = null; atlas = null; panel = null; panelText = '';
    ctx.onClose && ctx.onClose();
  }
  return { open, close, get on() { return !!el; } };
}
