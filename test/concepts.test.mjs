// Concepts: every file passes the engine's gate, every spot on the half court has a job, and the quiz only
// ever asks questions it can answer.
import assert from 'node:assert/strict';
import { allConcepts } from '../src/concepts/index.js';
import { check, zoneAt, question, actorAt, LEVELS } from '../src/engine/space.js';
import { getSport } from '../src/sports/index.js';

let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
let asked = 0;
for (const c of allConcepts()) {
  const sport = getSport(c.sport);
  assert.deepEqual(check(c, sport), [], c.id + ' fails the gate');
  // every spot on the court has a rule (no holes between the alleys)
  const F = sport.field;
  for (let x = F.x[0]; x <= F.x[1]; x += 0.5) for (let y = F.y[0]; y <= F.y[1]; y += 0.5) assert.ok(zoneAt(c, [x, y]), `${c.id}: no zone at ${x},${y}`);
  // the specific beats the general: an elbow is an elbow, not the middle
  if (c.id === 'space') {
    assert.equal(zoneAt(c, [-8, 19]).id, 'elbowL'); assert.equal(zoneAt(c, [11.5, 42]).id, 'ppR');
    assert.equal(zoneAt(c, [0, 40]).id, 'middle'); assert.equal(zoneAt(c, [-21, 30]).id, 'sideL'); assert.equal(zoneAt(c, [0, 6]).id, 'red');
  }
  for (const L of LEVELS) for (let i = 0; i < 300; i++) {
    const q = question(c, L.id, r); asked++;
    assert.ok(q.ask && q.why, 'every question explains itself');
    if (q.kind === 'rule') {
      assert.equal(q.options.length, 4); assert.equal(new Set(q.options).size, 4); assert.ok(q.options.includes(q.answer));
      assert.equal(zoneAt(c, q.ball).rule, q.answer, 'the answer is the rule where the ball is');
    }
    if (q.kind === 'way') { assert.equal(Math.sign(q.ball[0]), q.side); assert.ok(Math.abs(q.ball[0]) >= 2.5, 'never on the split line'); }
    if (q.kind === 'help') { assert.ok(q.ok(q.spot), 'the shown answer passes'); assert.ok(!q.ok(q.man), 'staying home fails'); }
    if (L.id === 'kids') assert.equal(q.kind, 'way', 'kids only get which-way');
  }
  for (const d of Object.values(c.demos)) for (const a of d.actors) { assert.deepEqual(actorAt(a, 0), a.path[0]); const e = actorAt(a, 1); assert.ok(Math.hypot(e[0] - a.path.at(-1)[0], e[1] - a.path.at(-1)[1]) < 1e-9); }
}
console.log(`ok: concepts pass the gate, cover the court, and ${asked} quiz questions answer themselves`);
