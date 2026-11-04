// Trace: every position in every library play, in every sport, gets a path the engine really runs, a job in plain
// words for every step, a look that is a real heading, and a room fit that never makes it bigger than life.
// Also the Meta Ray-Ban Display page keeps the platform's contract (600 × 600, the capable meta, no SVG icon).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sports } from '../src/sports/index.js';
import { normalize, compile } from '../src/engine/sim.js';
import { trace, lookAt, roomScale, positions, busiest, metersPer, flightIn, faceHeading, faceWords, repScore } from '../src/engine/trace.js';

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
console.log(`ok: trace for ${paths} positions, ${steps} steps (${moved} moves), ${flights} ball flights, every job in words, rep scores; the glasses page keeps its contract`);
