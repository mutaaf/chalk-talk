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
    if (q.kind === 'way') { assert.equal(Math.sign(q.ball[0]), q.side); assert.ok(Math.abs(q.ball[0]) >= c.way.x[0] - 0.05, 'never on the middle line'); }
    if (q.kind === 'help') { assert.ok(q.ok(q.spot), 'the shown answer passes'); assert.ok(!q.ok(q.man), 'staying home fails'); }
    assert.ok(c.quiz[L.id].includes(q.kind), 'only the kinds this level gets');
    if (c.id === 'space' && L.id === 'kids') assert.equal(q.kind, 'way', 'little ones only get which-way');
  }
  for (const d of Object.values(c.demos)) for (const a of d.actors) { assert.deepEqual(actorAt(a, 0), a.path[0]); const e = actorAt(a, 1); assert.ok(Math.hypot(e[0] - a.path.at(-1)[0], e[1] - a.path.at(-1)[1]) < 1e-9); }
}
console.log(`ok: ${allConcepts().length} concepts (${allConcepts().map(c => c.sport + ' ' + c.title).join(', ')}) pass the gate, cover the field, and ${asked} quiz questions answer themselves`);

// the defense follows the concept: in real library plays, compiled with the system on
{
  const { compile, normalize } = await import('../src/engine/sim.js');
  const { defenseSystem } = await import('../src/engine/space.js');
  const { concept } = await import('../src/concepts/index.js');
  const sport = getSport('basketball'), sys = defenseSystem(concept('space'));
  // the rules on their own
  const base = [5, 20];
  assert.ok(sys({ o: [-10, 30], ball: [-10, 30], onBall: true, base: [-9, 27] })[0] > -9, 'on the ball: a step to the middle side');
  assert.ok(sys({ o: [12, 30], ball: [12, 30], onBall: true, base: [11, 27] })[0] < 11, 'mirrored');
  assert.equal(Math.abs(sys({ o: [19, 19], ball: [-19, 22], onBall: false, base })[0]), 1.5, 'far side sinks to the split line');
  const f = sys({ o: [-9, 7], ball: [-20, 22], onBall: false, base: [-8, 6] });
  assert.ok(Math.hypot(f[0] - -9, f[1] - 7) < 2.3 && f[1] > 7, 'the post is fronted, toward the ball');
  assert.deepEqual(sys({ o: [-9, 7], ball: [-20, 22], onBall: false, help: true, base }), base, 'help rotation is left alone');
  // in every library play: some moment shows the split line and no defender ends up off the court
  let split = 0, plays = 0;
  for (const p of sport.plays) {
    const n = normalize(p, sport); if (!n || !n.play) continue;
    const a = compile(n.play, sport, { defense: true }), b = compile(n.play, sport, { defense: true, system: sys });
    plays++;
    for (let t = 0; t <= b.play.beats.length; t += 0.25) {
      const P = b.posAt(t), h = b.holderAt(t), ball = h >= 0 ? P[h] : null;
      b.play.players.forEach((q, i) => {
        assert.ok(Math.abs(P[i][0]) <= 25.01 && P[i][1] >= -0.01 && P[i][1] <= 47.01, `${p.key}: ${q.id} off the court`);
        if (q.side === 'D' && ball && Math.abs(P[i][0]) <= 2 && Math.abs(ball[0]) > 6) split++;
      });
    }
    assert.equal(a.play.beats.length, b.play.beats.length);
  }
  assert.ok(split > 0, 'somebody sits on the split line somewhere');
  // the booth's call-outs: one string per step, and the system has something to say about most plays
  const { systemNotes } = await import('../src/engine/space.js');
  let said = 0, kinds = new Set();
  for (const p of sport.plays) {
    const n = normalize(p, sport); if (!n || !n.play) continue;
    const b = compile(n.play, sport, { defense: true, system: sys }), notes = systemNotes(b, concept('space'));
    assert.equal(notes.length, b.play.beats.length);
    notes.forEach(t => { assert.equal(typeof t, 'string'); if (t) { said++; kinds.add(t.split(' ').slice(0, 3).join(' ')); } });
  }
  assert.ok(said >= 10 && kinds.size >= 3, `the system calls out plays (${said} lines, ${kinds.size} kinds)`);
  console.log(`ok: ${said} system call-outs across the library, ${kinds.size} kinds`);
  console.log(`ok: the defense follows Guard the space in ${plays} plays (${split} split-line moments)`);
}
