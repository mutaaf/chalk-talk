// Trace: every position in every library play, in every sport, gets a path the engine really runs, a job in plain
// words for every step, a look that is a real heading, and a room fit that never makes it bigger than life.
// Also the Meta Ray-Ban Display page keeps the platform's contract (600 × 600, the capable meta, no SVG icon).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sports } from '../src/sports/index.js';
import { normalize, compile } from '../src/engine/sim.js';
import { trace, lookAt, roomScale, positions, busiest, metersPer } from '../src/engine/trace.js';

let paths = 0, steps = 0, moved = 0;
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
  }
}
assert.ok(moved > steps * 0.15, 'plenty of steps have a move to trace');
assert.equal(metersPer({ unit: 'ft' }), 0.3048); assert.equal(metersPer({ unit: 'yd' }), 0.9144);

const g = readFileSync(new URL('../glasses.html', import.meta.url), 'utf8');
assert.match(g, /<meta name="viewport" content="width=600, height=600, initial-scale=1\.0, user-scalable=no">/);
assert.match(g, /<meta name="mrbd-web-app-capable" content="yes">/);
assert.ok(!/<link rel="icon"[^>]*svg/.test(g), 'no SVG icon on the glasses');
assert.match(readFileSync(new URL('../scripts/build.mjs', import.meta.url), 'utf8'), /glasses\.html/, 'the build ships it');
console.log(`ok: trace for ${paths} positions, ${steps} steps (${moved} moves), every job in words; the glasses page keeps its contract`);
