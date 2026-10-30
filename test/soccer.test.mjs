// Soccer 7v7 and 9v9: every library play compiles with and without defense, stays on the pitch,
// keeps the ball honest and passes only to open players; the positions guide, PitchIQ, coaching
// lenses, glossary and AI briefing are all there. Imports the packs directly, so it runs before the
// packs are registered in src/sports/index.js.
import assert from 'node:assert/strict';
import { soccer7, soccer9, shirtOf } from '../src/sports/soccer.js';
import { normalize, compile, kindsOf } from '../src/engine/sim.js';
import { playShape } from '../src/engine/field.js';
import { candidates, quiz, explain, playFor, likeness, blank, AGES } from '../src/engine/iq.js';
import { miniBoard, playerFor } from '../src/guide.js';
import { system, schemaFor } from '../src/ai.js';

const REQUIRED = ['id', 'name', 'roster', 'field', 'view', 'mark', 'ball', 'spots', 'kinds', 'guard', 'plays', 'ai'];
const inField = (s, p) => p[0] >= s.field.x[0] - 0.01 && p[0] <= s.field.x[1] + 0.01 && p[1] >= s.field.y[0] - 0.01 && p[1] <= s.field.y[1] + 0.01;
let plays = 0, passes = 0, questions = 0;

for (const sport of [soccer7, soccer9]) {
  for (const k of REQUIRED) assert.ok(sport[k] != null, `${sport.id} is missing ${k}`);
  assert.equal(sport.los, null, 'soccer has no line of scrimmage');
  assert.ok(sport.open >= 2.5 && sport.open <= 4, 'open distance in yards');
  // the vocabulary: move, pass and shot kinds, and the ones sketching falls back on
  for (const k of ['pass', 'dribble', 'cut', 'cover', 'through', 'cross', 'shot', 'overlap', 'underlap', 'press', 'track', 'run', 'ready']) assert.ok(sport.kinds[k], `${sport.id} kind ${k}`);
  assert.ok(kindsOf(sport, 'shot').length === 1 && kindsOf(sport, 'pass').length >= 6, 'pass and shot kinds');
  for (const [name, s] of Object.entries(sport.spots)) assert.ok(inField(sport, s), `${sport.id} spot "${name}" off the pitch: ${s}`);
  assert.equal(sport.starter.length, sport.roster.perSide);
  sport.starter.forEach(s => assert.ok(sport.spots[s], `${sport.id} starter spot ${s}`));
  // the pitch drawing: every line finite, the goals stand up off the grass
  const L = sport.field.lines({});
  assert.ok(L.length > 15 && L.every(l => l.p.every(p => p.every(Number.isFinite))), sport.id + ' lines');
  assert.ok(L.some(l => l.p.some(p => p[2] > 2)), sport.id + ' goals have a crossbar');
  assert.equal(L.some(l => l.dots), sport.id === 'soccer7', 'only 7v7 draws build-out lines');

  // ---- every play ----
  const keys = new Set();
  for (const raw of sport.plays) {
    assert.ok(!keys.has(raw.key), sport.id + ' duplicate key ' + raw.key); keys.add(raw.key);
    assert.ok(raw.summary && raw.cues.length === 3 && raw.reads.length >= 2, `${sport.id}/${raw.key} teaching text`);
    const r = normalize(raw, sport);
    assert.ok(r.ok, sport.id + '/' + raw.key + ': ' + r.errors.join(', '));
    assert.deepEqual(r.errors, [], sport.id + '/' + raw.key + ' has errors: ' + r.errors.join(', '));
    assert.equal(r.play.players.filter(p => p.side === 'O').length, sport.roster.perSide, `${sport.id}/${raw.key} fields a full team`);
    for (const defense of [false, true]) {
      const sim = compile(r.play, sport, { defense });
      if (defense) assert.equal(sim.players.filter(p => p.side === 'D').length, sport.roster.perSide, `${raw.key}: a full defense with a keeper`);
      for (let t = 0; t < sim.beats + 1.5; t += 0.05) {
        for (const p of sim.posAt(t)) { assert.ok(isFinite(p[0]) && isFinite(p[1]), raw.key + ' player NaN at ' + t); assert.ok(inField(sport, p), `${sport.id}/${raw.key} player off the pitch at ${t.toFixed(2)}: ${p}`); }
        assert.ok(sim.ballAt(t).every(isFinite), raw.key + ' ball NaN at ' + t);
        sim.routeState(t).forEach((s, i) => { if (s.drawn > 0) assert.ok(sim.routePoint(i, s.drawn, [0, 0, 0]).every(isFinite)); });
      }
      const shape = playShape(sim)(3000, Math.random);
      assert.equal(shape.points.length, 3000, raw.key + ' point budget');
    }
    // the ball only moves from whoever has it
    const sim = compile(r.play, sport);
    let holder = sim.idx[r.play.ball];
    r.play.beats.forEach((b, k) => b.actions.forEach(a => {
      const K = sport.kinds[a.kind];
      if (K.type === 'pass' || K.type === 'shot') { assert.equal(sim.idx[a.who], holder, `${sport.id}/${raw.key} beat ${k + 1}: ${a.who} ${a.kind}s without the ball`); holder = K.type === 'shot' ? -1 : sim.idx[a.target]; }
      if (K.dribble) assert.equal(sim.idx[a.who], holder, `${sport.id}/${raw.key} beat ${k + 1}: ${a.who} dribbles without the ball`);
    }));
    // teach the right read: with defense on, every pass reaches a player with sport.open yards of space
    const sd = compile(r.play, sport, { defense: true });
    r.play.beats.forEach((b, k) => b.actions.forEach(a => {
      if (sport.kinds[a.kind].type !== 'pass') return;
      passes++;
      const sp = sd.space(k + 0.94, sd.idx[a.target]);
      if (r.play.lesson !== 'defense') assert.ok(sp >= sport.open, `${sport.id}/${raw.key} beat ${k + 1}: ${a.who} → ${a.target} has ${sp.toFixed(1)} yd (needs ${sport.open})`);
    }));
    // the aliases name every play
    assert.ok(sport.aliases[raw.key] && sport.aliases[raw.key].length >= 5, `${sport.id}/${raw.key} has aliases`);
    plays++;
  }
  assert.ok(sport.plays.length >= 12, sport.id + ' has a dozen plays');
  assert.ok(sport.plays.filter(p => p.lesson === 'defense').length >= 2, sport.id + ' has defending lessons');
  Object.keys(sport.aliases).forEach(k => assert.ok(keys.has(k), `${sport.id} alias for a missing play ${k}`));

  // the 7v7 build-out line: while the keeper has it, nobody on the other team is past the line
  if (sport.id === 'soccer7') {
    const sim = compile(normalize(sport.plays.find(p => p.key === 'build-out'), sport).play, sport, { defense: true }), line = sport.field.y[1] - sport.pitch.buildOut;
    sim.players.forEach((p, i) => { if (p.side === 'D') assert.ok(sim.posAt(0.9)[i][1] <= line + 0.01, `${p.id} retreats behind the build-out line`); });
  }
  // the defending keeper stays in goal
  { const sim = compile(normalize(sport.plays[0], sport).play, sport, { defense: true }), k = sim.idx.X1;
    for (let t = 0; t < sim.beats; t += 0.25) { const q = sim.posAt(t)[k]; assert.ok(q[1] < 5 && Math.abs(q[0]) < 5, 'keeper in goal at ' + t + ': ' + q); } }

  // ---- notation: shirt numbers in, X's with their man's number ----
  const n = normalize(sport.plays[0], sport).play;
  const shirts = n.players.filter(p => p.side === 'O').map(p => sport.notation.inside(p));
  assert.deepEqual([...shirts].sort((a, b) => a - b), Object.values(sport.pitch.ids).sort((a, b) => a - b), sport.id + ' shirts');
  assert.equal(sport.notation.shape(n.players.find(p => p.id === 'O1')), 'square', 'the keeper is a square');
  assert.equal(shirtOf('striker'), '9'); assert.equal(shirtOf('left wing'), '11'); assert.equal(shirtOf('CDM'), '6'); assert.equal(shirtOf('10'), '10');
  n.players.forEach(p => assert.ok(sport.brains(p).instincts.length > 20, 'a brain for ' + p.id));

  // ---- positions guide ----
  assert.ok(sport.positions.length >= 7, sport.id + ' positions');
  const full = compile(n, sport, { defense: true });
  for (const pos of sport.positions) {
    for (const k of ['id', 'side', 'num', 'name', 'nick', 'cue', 'job']) assert.ok(pos[k], `${pos.name} ${k}`);
    assert.ok(pos.sees.length === 3 && pos.does.length === 3 && pos.donts.length === 2, pos.name + ' lists');
    assert.ok(pos.ages.young && pos.ages.mid && pos.ages.older && pos.drill.name && pos.drill.how, pos.name + ' ages and drill');
    assert.ok(inField(sport, pos.home) && pos.paths.every(p => p.pts.every(q => inField(sport, q))), pos.name + ' on the pitch');
    Object.values(pos.mates).forEach(q => assert.ok(inField(sport, q), pos.name + ' mate on the pitch'));
    assert.match(miniBoard(sport, pos, { anim: true }), /^<svg/);
    if (pos.side === 'O') assert.equal(sport.notation.inside(n.players.find(p => p.id === pos.id)), pos.num, `${pos.name} is ${pos.id} on the board`);
    assert.ok(playerFor(sport, { players: full.players }, pos), pos.name + ' found on the board');
  }

  // ---- PitchIQ ----
  assert.equal(sport.iq.name, 'PitchIQ');
  assert.equal(sport.iq.levels.length, 6);
  assert.deepEqual(Object.keys(sport.iq.dims), ['vision', 'spacing', 'recognition', 'speed']);
  assert.ok(sport.iq.archetypes.length >= 7 && sport.iq.archetypes.every(a => a.v.length === 4 && a.name && a.style && a.why));
  for (const raw of sport.plays) for (const q of candidates(raw, sport)) {
    questions++;
    if (q.type === 'pass') assert.ok(q.answer && q.who !== q.answer, raw.key);
    assert.ok(typeof explain(q.type === 'name' ? Object.assign({}, q, { answer: raw.title }) : q, sport, raw) === 'string');
  }
  for (const a of AGES) {
    const Q = quiz(sport, { age: a.id, seed: 11, n: 6 });
    assert.ok(Q.length >= 4, `${sport.id} ${a.id} gets a quiz (${Q.length})`);
    Q.forEach(q => { assert.ok(playFor(q, sport)); if (q.choices) { assert.ok(q.choices.indexOf(q.answer) >= 0); assert.equal(new Set(q.choices).size, q.choices.length); } });
  }
  const runner = Object.assign(blank(), { n: 10, dims: { vision: 80, spacing: 90, recognition: 82, speed: 98 } });
  assert.match(likeness(runner, sport).name, /Mbapp/);

  // ---- coaching lenses, glossary, the AI briefing ----
  assert.ok(sport.coaches.length >= 6 && sport.coaches[0].id === 'youth');
  sport.coaches.slice(1).forEach(c => assert.match(c.note, /^Inspired by /, c.id));
  assert.ok(sport.glossary.split('\n').length >= 40 && /heard as/.test(sport.glossary));
  const brief = system(sport, sport.glossary, sport.plays);
  assert.ok(/yards/.test(brief) && !/NaN|undefined/.test(brief), sport.id + ' briefing');
  const schema = schemaFor(sport, sport.plays.map(p => p.key));
  assert.ok(!schema.properties.los && schema.properties.beats.items.properties.actions.items.properties.kind.enum.includes('overlap'));
}

console.log(`ok: ${plays} soccer plays (7v7 + 9v9) compile, stay on the pitch, keep the ball honest; ${passes} passes to open players; ${questions} PitchIQ questions; positions, lenses and glossary present`);
