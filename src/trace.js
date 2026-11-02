// Trace: pick a position and the play is projected around you as aurora light. Your path glows on the floor with
// light flowing along the move you make now; the steps to come are dimmer, rings mark where each step ends;
// teammates and defenders are soft pillars of light, the ball a bright orb, passes arcs at chest height.
// Two ways in: first person on a screen (your eyes, or just above and behind you; drag to look around), and
// WebXR (Snap Spectacles' browser, Quest, Vision Pro, Android XR): life size, or shrunk to fit the room, starting
// on your spot and facing your first look. In XR the play waits at the end of each of your moves until you've
// walked to the ring; a pinch or trigger moves it on. Everything is drawn with additive light, so on see-through
// glasses black is simply not there. Own WebGL (no three.js); pure parts live in engine/trace.js.

import { trace, lookAt, roomScale, positions, busiest, metersPer } from './engine/trace.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const GOLD = [1, 0.78, 0.35], ORANGE = [1, 0.56, 0.23], ICE = [0.62, 0.8, 1], WHITE = [0.93, 0.96, 1];
const BEAT_S = 1.7, EYE = 1.6;

// ---- tiny matrix kit (column-major, like WebGL and WebXR) ----
const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
function persp(fovy, asp, n, f) { const t = 1 / Math.tan(fovy / 2), o = new Float32Array(16); o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f); return o; }
function look(e, fwd) {
  const z = [-fwd[0], -fwd[1], -fwd[2]], up = [0, 1, 0];
  let x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]; const xl = Math.hypot(...x) || 1; x = x.map(v => v / xl);
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1]);
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
function arc(out, a, b, h, w, col, f, cam) {   // a pass: a ribbon turned to face you, lifted in the middle
  const n = 12, pts = [];
  for (let j = 0; j <= n; j++) { const u = j / n; pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(u * Math.PI) * h, a[2] + (b[2] - a[2]) * u]); }
  let u = 0;
  for (let j = 0; j < n; j++) {
    const p = pts[j], q = pts[j + 1], m = [(p[0] + q[0]) / 2 - cam[0], (p[1] + q[1]) / 2 - cam[1], (p[2] + q[2]) / 2 - cam[2]], d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    let nx = d[1] * m[2] - d[2] * m[1], ny = d[2] * m[0] - d[0] * m[2], nz = d[0] * m[1] - d[1] * m[0]; const nl = Math.hypot(nx, ny, nz) || 1; nx *= w / 2 / nl; ny *= w / 2 / nl; nz *= w / 2 / nl;
    const L = Math.hypot(...d), u2 = u + L;
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
.ct-tr .tr-hint { position: absolute; top: calc(60px + env(safe-area-inset-top)); left: 0; right: 0; text-align: center; font-size: 12px; color: rgba(199, 214, 238, .7); pointer-events: none; }
`;

export function createTrace(ctx) {
  let el = null, gl = null, G = null, T = null, buf = null, tbuf = null, atlas = null, cells = {}, panel = null;
  let sim = null, sport = null, tr = null, who = -1, t = 0, playing = true, hold = 0, last = 0, raf = 0, mode = 'eyes';
  let yaw = null, dYaw = 0, dPitch = -0.2, xr = null, scale = 1, origin = null, heading0 = 0, panelPos = null, panelText = '', waiting = false, spoken = -1;
  const name = id => ctx.name ? ctx.name(id) : id;

  // field → world meters: in XR the origin is your first spot and your first look is straight ahead
  function W(x, y, z) {
    const m = metersPer(sport) * scale, ox = origin ? origin[0] : 0, oy = origin ? origin[1] : 0;
    const X = (x - ox) * m, Z = (y - oy) * m, c = Math.cos(heading0), s = Math.sin(heading0);
    return [X * c + Z * s, (z || 0) * metersPer(sport) * Math.min(1, scale * 1.4), -X * s + Z * c];
  }
  const H = 1.8;   // a player's height in meters (shrunk with the room, never under 0.7)
  const ph = () => Math.max(0.7, H * Math.min(1, scale * 1.6));

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

  // ---- the scene at time t, seen from cam ----
  function scene(cam, now) {
    const g = [], tx = [], P = sim.posAt(t), k = Math.min(sim.play.beats.length - 1, Math.floor(t)), ended = t >= sim.play.beats.length;
    // the field's lines, faint
    for (const l of sport.field.lines({ los: sim.play.los })) if (l.p && l.p.length > 1) ribbon(g, l.p.map(q => W(q[0], q[1], (q[2] || 0) + 0.01)), 0.05 + (l.w || 1) * 0.02, ICE.concat(xr ? 0.22 : 0.4), 0);
    // your path: done faint, now bright and flowing, to come dimmer; a ring where each move ends
    tr.steps.forEach(s => {
      if (s.pts.length < 2) return;
      const now0 = s.k === k && !ended, done = s.k < k || ended, pts = s.pts.map(q => W(q[0], q[1], 0.02));
      ribbon(g, pts, xr ? 0.3 : 0.36, GOLD.concat(now0 ? 0.95 : done ? 0.2 : 0.42), now0 ? 1 : done ? 0 : 0.4);
      if (s.moved) {
        const e = W(s.to[0], s.to[1], 0.03), pulse = now0 ? 0.65 + 0.35 * Math.sin(now / 160) : done ? 0.25 : 0.4;
        ring(g, e, 0.38, 0.12, GOLD.concat(pulse), 0);
        if (cells[String(s.k + 1)]) label(tx, [e[0], e[1] + 0.12, e[2]], 0.44, 0.22, cells[String(s.k + 1)], GOLD.concat(done ? 0.35 : 0.95), cam);
      }
    });
    // light flowing along the move you make now
    const cur = tr.steps[k];
    if (cur && cur.moved && !ended) {
      const pts = cur.pts.map(q => W(q[0], q[1], 0.05)), L = plen(pts);
      for (let j = 0; j < 14; j++) sprite(g, along(pts, ((now / 1000 * 1.6 + j / 14 * L) % L)), 0.09, GOLD.concat(0.9), cam);
    }
    // everyone else: soft pillars and their letters; you are a gold beam where the play has you now
    sim.play.players.forEach((p, i) => {
      const at = W(P[i][0], P[i][1], 0), col = i === who ? GOLD : p.side === 'O' ? ORANGE : ICE;
      if (i === who) { if (xr || mode !== 'eyes') { ring(g, [at[0], 0.03, at[2]], 0.3, 0.1, GOLD.concat(0.9), 0); pillar(g, at, 0.3, ph() * 1.4, GOLD.concat(0.35), cam); } return; }
      pillar(g, at, 0.42, ph(), col.concat(p.side === 'O' ? 0.5 : 0.4), cam);
      sprite(g, [at[0], at[1] + ph() * 0.92, at[2]], 0.13, col.concat(0.7), cam);
      const c = cells[sport.notation.inside(p)]; if (c) label(tx, [at[0], at[1] + ph() + 0.12, at[2]], 0.5, 0.25, c, col.concat(0.95), cam);
    });
    // passes in this step, and the ball
    if (!ended) for (const r of sim.routes) if (r.dashed && r.beat === k && r.pts.length > 1) { const a = r.pts[0], b = r.pts[r.pts.length - 1]; arc(g, W(a[0], a[1], 0), W(b[0], b[1], 0), ph() * 0.6, 0.12, WHITE.concat(0.5), 1, cam); }
    const B = sim.ballAt(t); if (B) { const b = W(B[0], B[1], B[2] || 0); b[1] = Math.max(b[1], 0.15); sprite(g, b, 0.28, [1, 0.85, 0.45, 1], cam); }
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

  // ---- the clock: one beat every BEAT_S seconds; in XR it waits for you at the end of each of your moves ----
  function advance(now, head) {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
    const n = sim.play.beats.length;
    if (!playing) return;
    if (t >= n) { hold += dt; if (hold > 2.2) { t = 0; hold = 0; } return; }
    const k = Math.floor(t), next = t + dt / BEAT_S;
    if (xr && head && Math.floor(next) > k) {
      const s = tr.steps[k];
      if (s && s.moved && !waiting) { const e = W(s.to[0], s.to[1], 0); if (Math.hypot(head[0] - e[0], head[2] - e[2]) > 0.6) { waiting = true; t = k + 0.999; return; } }
      if (waiting) { const e = W(s.to[0], s.to[1], 0); if (Math.hypot(head[0] - e[0], head[2] - e[2]) > 0.6) return; waiting = false; ctx.chime && ctx.chime('ok'); }
    }
    t = Math.min(n, next);
  }
  function stepText() {
    const n = sim.play.beats.length, k = Math.min(n - 1, Math.floor(t));
    if (t >= n) return { head: 'That’s the play', job: 'Again from the top in a moment.' };
    return { head: `Step ${k + 1} of ${n} · you are ${tr.name}`, job: waiting ? 'Walk to the ring to keep going' : tr.steps[k].job };
  }
  function sayStep() {
    const k = Math.floor(t); if (k === spoken || !ctx.speak || t >= sim.play.beats.length) return;
    spoken = k; ctx.speak(tr.steps[k].job);
  }

  // ---- first person on a screen ----
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!el || xr) return;
    advance(now);
    const cv = el.querySelector('canvas'), dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0.008, 0.02, 0.04, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    const target = lookAt(sim, who, t, sport);
    if (yaw == null) yaw = target; let d = target - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * 0.06;
    const P = sim.posAt(t)[who], me = W(P[0], P[1], 0), a = yaw + dYaw, pitch = dPitch + (mode === 'eyes' ? 0 : -0.45);
    const fwd = [Math.sin(a) * Math.cos(pitch), Math.sin(pitch), -Math.cos(a) * Math.cos(pitch)];
    const eye = mode === 'eyes' ? [me[0], EYE, me[2]] : [me[0] - Math.sin(a) * 4.2, 4.4, me[2] + Math.cos(a) * 4.2];
    const vp = mul(persp(h > w ? 1.45 : 1.1, w / h, 0.05, 300), look(eye, fwd));
    draw(vp, scene(eye, now));
    const s = stepText(); el.querySelector('[data-t=head]').textContent = s.head; el.querySelector('[data-t=job]').textContent = s.job;
    sayStep();
  }

  // ---- WebXR: life size or room size, light on the real floor ----
  async function xrSupport() {
    const out = {}; if (!navigator.xr) return out;
    for (const m of ['immersive-ar', 'immersive-vr']) { try { out[m] = await navigator.xr.isSessionSupported(m); } catch (e) {} }
    return out;
  }
  async function enterXR(m, fit) {
    const session = await navigator.xr.requestSession(m, { optionalFeatures: ['local-floor', 'hand-tracking'] });
    xr = { session, m }; ctx.track && ctx.track('trace_xr', { m: m === 'immersive-ar' ? 'ar' : 'vr', fit: fit ? 1 : 0 });
    await gl.makeXRCompatible();
    session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });
    let space, floor = 0;
    try { space = await session.requestReferenceSpace('local-floor'); } catch (e) { space = await session.requestReferenceSpace('local'); floor = -1.5; }
    // stand on your spot, facing your first look
    scale = fit ? roomScale(tr, sport) : 1; origin = tr.start; heading0 = lookAt(sim, who, 0, sport); t = 0; hold = 0; waiting = false; panelPos = null; last = 0;
    const ar = m === 'immersive-ar' || session.environmentBlendMode !== 'opaque';
    session.addEventListener('select', () => { if (waiting) { waiting = false; t = Math.floor(t) + 1; } else if (t >= sim.play.beats.length) { t = 0; hold = 0; } else playing = !playing; });
    session.addEventListener('end', () => { xr = null; scale = 1; origin = null; heading0 = 0; last = 0; });
    const onFrame = (now, frame) => {
      if (!xr) return; session.requestAnimationFrame(onFrame);
      const pose = frame.getViewerPose(space); if (!pose) return;
      const hp = pose.transform.position, head = [hp.x, hp.y - floor, hp.z];
      advance(now, head);
      const layer = session.renderState.baseLayer;
      gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
      gl.clearColor(ar ? 0 : 0.008, ar ? 0 : 0.02, ar ? 0 : 0.04, ar ? 0 : 1); gl.clear(gl.COLOR_BUFFER_BIT);
      const data = scene(head, now), s = stepText(), txt = s.head + '\n' + s.job;
      // the step card: floats ahead of you, a little low, and follows lazily
      const o = pose.transform.orientation, fz = [2 * (o.x * o.z + o.w * o.y), 0, 1 - 2 * (o.x * o.x + o.y * o.y)], fl = Math.hypot(fz[0], fz[2]) || 1;
      const want = [head[0] - fz[0] / fl * 1.4, head[1] - 0.45, head[2] - fz[2] / fl * 1.4];
      panelPos = panelPos ? panelPos.map((v, j) => v + (want[j] - v) * 0.04) : want;
      if (txt !== panelText) { panelText = txt; drawPanel(s); sayStep(); }
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
    c.fillStyle = 'rgba(8,14,26,.0)'; c.fillRect(0, 0, 768, 290);
    c.fillStyle = '#ffc75a'; c.font = '800 34px system-ui, sans-serif'; c.fillText(s.head.toUpperCase(), 20, 52, 728);
    c.fillStyle = '#ffffff'; c.font = '800 54px system-ui, sans-serif';
    const words = s.job.split(' '); let line = '', y = 128;
    for (const w of words) { if (c.measureText(line + w).width > 720 && line) { c.fillText(line.trim(), 20, y); line = ''; y += 66; } line += w + ' '; }
    c.fillText(line.trim(), 20, y);
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
    who = i; tr = trace(sim, i, sport, name); t = 0; hold = 0; yaw = null; dYaw = 0; spoken = -1; waiting = false;
    el.querySelectorAll('.tr-who button').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
    ctx.track && ctx.track('trace_pick', { side: tr.side });
  }
  async function open(whoId) {
    sim = ctx.sim(); sport = ctx.sport(); if (!sim || !sport) return;
    if (!document.querySelector('style[data-chalk-talk-trace]')) { const st = document.createElement('style'); st.dataset.chalkTalkTrace = ''; st.textContent = CSS; document.head.appendChild(st); }
    close();
    const list = positions(sim, sport, name);
    el = document.createElement('div'); el.className = 'ct-tr'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Trace your path');
    el.innerHTML = `<canvas></canvas><div class="tr-top"><div class="tr-who" role="group" aria-label="Your position">${list.map(p => `<button type="button" data-i="${p.i}" class="${p.side === 'D' ? 'd' : ''}" aria-label="${esc((p.side === 'D' ? 'Defense ' : '') + p.label)}">${esc(p.side === 'D' ? 'X' + p.short : p.short)}</button>`).join('')}</div><button type="button" class="tr-x" data-a="close" aria-label="Close trace">✕</button></div>
      <p class="tr-hint">Drag to look around</p>
      <div class="tr-card"><div class="tr-step" data-t="head"></div><div class="tr-job" data-t="job"></div><div class="tr-row"><button type="button" data-a="prev" aria-label="Previous step">⏮</button><button type="button" data-a="play" aria-label="Play or pause">⏯</button><button type="button" data-a="next" aria-label="Next step">⏭</button><button type="button" data-a="mode">Eyes</button><span class="sp"></span><span data-t="xr"></span></div></div>`;
    ctx.root.appendChild(el);
    try { setup(el.querySelector('canvas'), true); } catch (e) { el.querySelector('[data-t=job]').textContent = 'This device can’t draw 3D (WebGL is off).'; return; }
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
      if (a === 'mode') { mode = mode === 'eyes' ? 'above' : 'eyes'; b.textContent = mode === 'eyes' ? 'Eyes' : 'Above'; }
      if (a === 'ar' || a === 'vr' || a === 'room') enterXR(a === 'vr' ? 'immersive-vr' : 'immersive-ar', a === 'room').catch(err => { el.querySelector('[data-t=job]').textContent = 'Couldn’t start: ' + (err && err.message || err); });
    });
    // drag to look; a double tap looks where the player looks
    const cv = el.querySelector('canvas'); let drag = null;
    cv.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, dYaw, dPitch]; cv.setPointerCapture(e.pointerId); el.querySelector('.tr-hint').hidden = true; });
    cv.addEventListener('pointermove', e => { if (!drag) return; dYaw = drag[2] + (e.clientX - drag[0]) * 0.006; dPitch = Math.max(-1.2, Math.min(0.6, drag[3] + (e.clientY - drag[1]) * 0.005)); });
    cv.addEventListener('pointerup', () => { drag = null; });
    cv.addEventListener('dblclick', () => { dYaw = 0; dPitch = -0.2; });
    xrSupport().then(s => {
      const b = []; if (s['immersive-ar']) b.push('<button type="button" class="tr-xr" data-a="ar">Life size AR</button><button type="button" data-a="room">Fit my room</button>');
      if (s['immersive-vr']) b.push('<button type="button" class="tr-xr" data-a="vr">VR</button>');
      if (el) el.querySelector('[data-t=xr]').innerHTML = b.join('');
    });
    last = 0; playing = true; raf = requestAnimationFrame(frame);
    ctx.track && ctx.track('trace', { sport: sport.id });
  }
  function close() {
    cancelAnimationFrame(raf); raf = 0;
    if (xr) { try { xr.session.end(); } catch (e) {} xr = null; }
    if (el) { el.remove(); el = null; } gl = null; atlas = null; panel = null; panelText = '';
    ctx.onClose && ctx.onClose();
  }
  return { open, close, get on() { return !!el; } };
}
