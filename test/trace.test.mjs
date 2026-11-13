// Trace: every position in every library play, in every sport, gets a path the engine really runs, a job in plain
// words for every step, a look that is a real heading, and a room fit that never makes it bigger than life.
// Also the Meta Ray-Ban Display page keeps the platform's contract (600 × 600, the capable meta, no SVG icon).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sports } from '../src/sports/index.js';
import { normalize, compile } from '../src/engine/sim.js';
import { trace, lookAt, roomScale, positions, busiest, metersPer, flightIn, faceHeading, faceWords, repScore, hudFit, pressWord, earPace, thin, resStep } from '../src/engine/trace.js';
import { qr, qrSvg } from '../src/qr.js';

let paths = 0, steps = 0, moved = 0, flights = 0;
for (const sport of sports()) for (const raw of sport.plays) {
  const n = normalize(raw, sport); if (!n || !n.play) continue;
  const sim = compile(n.play, sport, { defense: true }), F = sport.field, name = id => sport.notation.name(sim.play.players.find(p => p.id === id));
  const P = positions(sim, sport, name);
  assert.equal(P.length, sim.play.players.length); assert.equal(P[0].side, 'O', 'offense first');
  assert.equal(sim.play.players[busiest(sim)].side, 'O', `${raw.key}: the default position is on offense`);
  for (const p of P) {
    const tr = trace(sim, p.i, sport, name); paths++;
    assert.equal(tr.steps.length, sim.play.beats.length);
    for (const s of tr.steps) {
      steps++; if (s.moved) moved++;
      assert.ok(s.job && !/undefined|null|NaN/.test(s.job), `${raw.key} ${p.id} step ${s.k + 1}: "${s.job}"`);
      assert.ok(s.pts.length >= 1);
      for (const q of s.pts) assert.ok(q[0] >= F.x[0] - 3 && q[0] <= F.x[1] + 3 && q[1] >= F.y[0] - 3 && q[1] <= F.y[1] + 3, `${raw.key} ${p.id}: on the field`);
      const e = sim.posAt(s.k + 1)[p.i]; assert.ok(Math.hypot(e[0] - s.to[0], e[1] - s.to[1]) < 1e-6, 'the ring is where the engine ends the step');
    }
    for (let t = 0; t <= sim.play.beats.length; t += 0.5) assert.ok(Number.isFinite(lookAt(sim, p.i, t, sport)));
    const k = roomScale(tr, sport); assert.ok(k > 0 && k <= 1);
    // on a real field you face somewhere real before it starts: the net, the goal you attack, or the ball
    const h = faceHeading(sim, p.i, sport); assert.ok(Number.isFinite(h)); assert.ok(/^the /.test(faceWords(sim, p.i, sport)));
    if (sport.rally) assert.equal(h, p.side === 'D' ? Math.PI : 0);
  }
  // every pass, throw, hit and shot has the ball's real flight, and it ends with the player it's for
  sim.play.beats.forEach((b, k) => {
    if (!b.actions.some(a => a.kind === 'snap' || /^(pass|hit|shot)$/.test((sport.kinds[a.kind] || {}).type || ''))) return;
    const f = flightIn(sim, sport, k); assert.ok(f && f.pts.length >= 3, `${raw.key} step ${k + 1}: the ball's flight`); flights++;
    assert.ok(f.pts.every(q => q.every(Number.isFinite)));
    if (f.target) { const e = f.pts[f.pts.length - 1], ti = sim.idx[f.target]; let best = Infinity; for (let u = 0; u <= 1; u += 0.02) { const q = sim.posAt(k + u)[ti]; best = Math.min(best, Math.hypot(q[0] - e[0], q[1] - e[1])); } assert.ok(best < sport.mark, `${raw.key} step ${k + 1}: the flight ends with ${f.target}`); }
  });
}
// every sport says where you stand on a real field, and what you face
for (const sport of sports()) assert.ok(sport.trace && /^(court|field)$/.test(sport.trace.place) && /^the /.test(sport.trace.face), sport.id + ': trace place and face');
// the hoop in Trace is life size: the rim 10 ft up, 18 in across
const bb = sports().find(s => s.id === 'basketball'), rim = bb.trace.props().find(l => l.hot);
assert.ok(rim.p.every(q => q[2] === 10)); assert.ok(Math.abs(Math.max(...rim.p.map(q => q[0])) - 0.75) < 0.01);
// a rep's score
assert.deepEqual(repScore([0, undefined, 0.2, 0]), { moves: 3, onTime: 3, avg: 0.06666666666666667, stars: 3 });
assert.equal(repScore([0, 1.5, 0]).stars, 2); assert.equal(repScore([2, null]).stars, 0); assert.equal(repScore([]).stars, 0);
assert.ok(moved > steps * 0.15, 'plenty of steps have a move to trace');
assert.equal(metersPer({ unit: 'ft' }), 0.3048); assert.equal(metersPer({ unit: 'yd' }), 0.9144);

const g = readFileSync(new URL('../glasses.html', import.meta.url), 'utf8');
assert.match(g, /<meta name="viewport" content="width=600, height=600, initial-scale=1\.0, user-scalable=no">/);
assert.match(g, /<meta name="mrbd-web-app-capable" content="yes">/);
assert.ok(!/<link rel="icon"[^>]*svg/.test(g), 'no SVG icon on the glasses');
assert.match(readFileSync(new URL('../scripts/build.mjs', import.meta.url), 'utf8'), /glasses\.html/, 'the build ships it');
// every headset: the step card fits the view. Wide headsets keep the 0.9 m card low and ahead; narrow glasses
// (Snap Specs, ~46° diagonal) get a smaller card that follows the gaze and stays inside the view, top and bottom
const quest = hudFit(Math.tan(0.9), Math.tan(0.85)), specs = hudFit(Math.tan(0.33), Math.tan(0.22)), phoneAR = hudFit(Math.tan(0.3), Math.tan(0.55));
assert.equal(quest.w, 0.9); assert.equal(quest.drop, 0.45); assert.equal(quest.follow, false);
assert.ok(specs.follow && specs.w < 0.9);
for (const f of [quest, specs, phoneAR]) {
  assert.ok(f.drop + f.h / 2 <= 1.4 * (f === quest ? Math.tan(0.85) : f === specs ? Math.tan(0.22) : Math.tan(0.55)) + 1e-9, 'the card stays inside the view');
  assert.ok(f.w / 2 <= 1.4 * (f === quest ? Math.tan(0.9) : f === specs ? Math.tan(0.33) : Math.tan(0.3)), 'and inside it side to side');
  assert.ok(f.edge > 0 && f.edge <= 0.35);
}
assert.equal(pressWord([{ targetRayMode: 'screen' }]), 'Tap the screen');
assert.equal(pressWord([{ targetRayMode: 'transient-pointer' }]), 'Pinch');
assert.equal(pressWord([{ targetRayMode: 'tracked-pointer', hand: {} }]), 'Pinch');
assert.equal(pressWord([{ targetRayMode: 'tracked-pointer', gamepad: {} }]), 'Pull the trigger');
assert.equal(pressWord([]), 'Pinch');
assert.equal(earPace('Hold'), 1.7); assert.ok(earPace('Cut hard to the elbow and look for the pass from the point') > 5); assert.equal(earPace('Hold', 0.5), 3.4);
// the QR code for a handed play: the right size, finder patterns in three corners, the timing row
for (const [text, v] of [['https://mutaafaziz.com/chalktalk/?hand=4821', 4], ['HELLO', 1], ['x'.repeat(150), 8]]) {
  const q = qr(text); assert.equal(q.version, v); assert.equal(q.size, v * 4 + 17);
  for (const [cx, cy] of [[3, 3], [q.size - 4, 3], [3, q.size - 4]]) { assert.ok(q.at(cx, cy)); assert.ok(!q.at(cx + 2, cy)); assert.ok(q.at(cx + 3, cy)); }
  for (let i = 8; i < q.size - 8; i++) assert.equal(q.at(i, 6), i % 2 === 0);
}
assert.match(qrSvg('x'), /^<svg[^>]*viewBox="0 0 29 29"/); assert.throws(() => qr('x'.repeat(300)));
// your track walking it: a point every gap, never more than max, the last point kept
{ const tk = []; for (let i = 0; i <= 100; i++) thin(tk, [i * 0.05, 0], 0.12, 500); assert.ok(tk.length >= 33 && tk.length <= 35, String(tk.length));
  const big = []; for (let i = 0; i < 2000; i++) thin(big, [i * 0.2, Math.sin(i)], 0.12, 300); assert.ok(big.length <= 300); assert.deepEqual(big[big.length - 1], [1999 * 0.2, Math.sin(1999)]); }
// the render scale: long frames drop it fast, short ones win it back slowly, within [0.5, 1]
assert.equal(resStep(1, 40), 0.9); assert.equal(resStep(0.55, 40), 0.5); assert.equal(resStep(0.5, 60), 0.5); assert.equal(resStep(0.9, 16.6), 0.92); assert.equal(resStep(1, 10), 1); assert.equal(resStep(0.8, 20), 0.8);
// the renderer: no per-frame JS arrays (typed buffers, uploaded once per frame), rings drawn by the shader in one quad
{ const src = readFileSync(new URL('../src/trace.js', import.meta.url), 'utf8');
  assert.ok(!/new Float32Array\(arr\)/.test(src), 'no per-draw copies'); assert.match(src, /bufferSubData/); assert.match(src, /vF < -1\.5/, 'ring mode in the glow shader');
  assert.match(src, /'hit-test'/); assert.match(src, /'dom-overlay'/); assert.match(src, /fixedFoveation/); }
// the glasses page: auto (hands-free) on ▼, and it rests the display when nothing moves
{ const gs = readFileSync(new URL('../src/glasses.js', import.meta.url), 'utf8'); assert.match(gs, /ArrowDown[^\n]*auto = !auto/); assert.match(gs, /calm && now - drawn/); }
// the beta landing page: the install CTA up top, shipped by the build, never in the app's cache
{ const bp = readFileSync(new URL('../beta/index.html', import.meta.url), 'utf8'), bd = readFileSync(new URL('../scripts/build.mjs', import.meta.url), 'utf8'), sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(bp, /manifest\.webmanifest/); assert.match(bp, /beforeinstallprompt/); { const hero = bp.slice(bp.indexOf('<body'), bp.indexOf('<section class="duo"')); assert.match(hero, /data-install[^>]*>Get the beta/, 'the install CTA is in the top bar'); assert.match(hero, /class="hero"[\s\S]*Get the beta/, 'and in the hero'); }
  assert.match(bd, /cpSync\('beta'/); assert.match(bd, /!f\.startsWith\('\.\/beta\/'\)/); assert.match(sw, /\\\/beta\(/); }
// one tap in: /xr goes to Trace with go=auto, a handed code lands on the same button, the launch card exists
{ const xp = readFileSync(new URL('../xr/index.html', import.meta.url), 'utf8'), src = readFileSync(new URL('../src/trace.js', import.meta.url), 'utf8'), ui = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
  assert.match(xp, /trace=1&amp;go=auto/); assert.match(xp, /q\.set\('go', 'auto'\)/); assert.match(readFileSync(new URL('../scripts/build.mjs', import.meta.url), 'utf8'), /xr\/index\.html/);
  assert.match(readFileSync(new URL('../go.html', import.meta.url), 'utf8'), /&go=auto/); assert.match(src, /function launch\(go/); assert.match(ui, /openTrace\(h\.who \|\| null, opts\.go \|\| 'auto'\)/);
  assert.match(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), /go: q\.get\('go'\)/); }
// the code page a headset opens: big keys, the board on a good code
const go = readFileSync(new URL('../go.html', import.meta.url), 'utf8');
assert.match(go, /api\/hand\//); assert.match(go, /\?hand=/); assert.match(readFileSync(new URL('../scripts/build.mjs', import.meta.url), 'utf8'), /go\.html/, 'the build ships the code page');
console.log(`ok: trace for ${paths} positions, ${steps} steps (${moved} moves), ${flights} ball flights, every job in words, rep scores, every headset's card fit, the QR and code pages; the glasses page keeps its contract`);
