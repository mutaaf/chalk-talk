// Every sport's library compiles cleanly; every position the field asks for is a real number on
// the field; garbage in is refused, never thrown; and a frame stays cheap.
import assert from 'node:assert/strict';
import { sports } from '../src/sports/index.js';
import { normalize, compile } from '../src/engine/sim.js';
import { playShape } from '../src/engine/field.js';

const inField = (s, p) => p[0] >= s.field.x[0] - 0.01 && p[0] <= s.field.x[1] + 0.01 && p[1] >= s.field.y[0] - 0.01 && p[1] <= s.field.y[1] + 0.01;
let total = 0;
for (const sport of sports()) {
  assert.ok(sport.plays.length, sport.id + ' has no plays');
  const keys = new Set();
  for (const raw of sport.plays) {
    assert.ok(!keys.has(raw.key), sport.id + ' duplicate key ' + raw.key); keys.add(raw.key);
    const r = normalize(raw, sport);
    assert.ok(r.ok, sport.id + '/' + raw.key + ': ' + r.errors.join(', '));
    assert.deepEqual(r.errors, [], sport.id + '/' + raw.key + ' has errors: ' + r.errors.join(', '));
    for (const defense of [false, true]) {
      const sim = compile(r.play, sport, { defense });
      for (let t = 0; t < sim.beats + 1.5; t += 0.05) {
        for (const p of sim.posAt(t)) { assert.ok(isFinite(p[0]) && isFinite(p[1]), raw.key + ' player NaN at ' + t); assert.ok(inField(sport, p), raw.key + ' player off the field at ' + t + ': ' + p); }
        const b = sim.ballAt(t); assert.ok(b.every(isFinite), raw.key + ' ball NaN at ' + t);
        sim.routeState(t).forEach((s, i) => { if (s.drawn > 0) assert.ok(sim.routePoint(i, s.drawn, [0, 0, 0]).every(isFinite)); });
      }
      const shape = playShape(sim)(4000, Math.random);
      assert.equal(shape.points.length, 4000, raw.key + ' point budget');
      for (let i = 0; i < 4000; i += 5) { const q = shape.flow(i) || shape.points[i]; assert.ok(q.every(isFinite), raw.key + ' shape NaN at ' + i); }
    }
    // the ball only moves from whoever has it
    const sim = compile(r.play, sport);
    let holder = sim.idx[r.play.ball];
    r.play.beats.forEach((b, k) => b.actions.forEach(a => {
      const K = sport.kinds[a.kind];
      if (K.type === 'pass' || K.type === 'handoff' || K.type === 'shot') { assert.equal(sim.idx[a.who], holder, `${sport.id}/${raw.key} beat ${k + 1}: ${a.who} ${a.kind}s without the ball`); holder = K.type === 'shot' ? -1 : sim.idx[a.target]; }
      if (K.dribble) assert.equal(sim.idx[a.who], holder, `${sport.id}/${raw.key} beat ${k + 1}: ${a.who} dribbles without the ball`);
    }));
    total++;
  }
  // fuzz: random junk never throws
  for (let i = 0; i < 300; i++) {
    const junk = JSON.parse(JSON.stringify({ players: [{ id: ['O1', 'X9', 3, null][i % 4], at: [i % 3 ? 'top' : { x: i * 7 - 900, y: 'a' }, null][i % 2] }, { id: 'O2', at: { x: 1e9, y: -1e9 } }],
      beats: [{ actions: [{ kind: ['pass', 'throw', 'route', 'zz', null][i % 5], who: 'O1', target: ['O2', 'O7', null][i % 3], to: [null, 'end zone', { x: NaN, y: 1 }][i % 3], path: [[1, 2], 'x', null] }] }, null, 7], ball: 'O9', los: 'x' }));
    const r = normalize(junk, sport);
    if (r.ok) { const s = compile(r.play, sport, { defense: !!(i % 2) }); for (let t = 0; t < s.beats + 1; t += 0.25) { s.posAt(t); s.ballAt(t); s.routeState(t); } }
  }
}
// a frame costs well under a millisecond
{
  const sport = sports()[0], sim = compile(normalize(sport.plays[0], sport).play, sport, { defense: true });
  const t0 = performance.now(); let f = 0;
  for (let t = 0; t < 4; t += 1 / 60, f++) { sim.posAt(t); sim.ballAt(t); sim.routeState(t); }
  const ms = (performance.now() - t0) / f;
  assert.ok(ms < 0.5, 'frame cost ' + ms.toFixed(3) + ' ms');
  console.log(`frame cost ${ms.toFixed(3)} ms`);
}
console.log(`ok: ${total} plays across ${sports().length} sports compile, stay on the field and keep the ball honest`);

// the voice still talking holds the play at the end of the step, never past it; released, it carries on
{
  const sport = sports()[0], sim = compile(normalize(sport.plays[0], sport).play, sport);
  let talking = true, now = 1000;
  sim.hold(() => talking); sim.tick(now);
  for (let i = 0; i < 400; i++) sim.tick(now += 16);
  assert.equal(sim.beatAt(), 0, 'held at the end of step 1');
  assert.ok(sim.time() > 0.99, 'waits at the very end of the step');
  talking = false; for (let i = 0; i < 10; i++) sim.tick(now += 16);
  assert.equal(sim.beatAt(), 1, 'moves on once the line is done');
  console.log('ok: the play waits for the voice');
}
