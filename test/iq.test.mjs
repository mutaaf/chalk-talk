// CourtIQ / FieldIQ: every question is answerable from the engine's own read, ratings move the right
// way, and the likeness card matches the profile's shape.
import assert from 'node:assert/strict';
import { sports } from '../src/sports/index.js';
import { candidates, quiz, grade, record, blank, level, likeness, explain, playFor, AGES } from '../src/engine/iq.js';

let count = 0;
for (const sport of sports()) {
  assert.ok(sport.positions && sport.positions.length >= 5, sport.id + ' has a positions guide');
  assert.ok(sport.iq && sport.iq.archetypes.length >= 5, sport.id + ' has IQ archetypes');
  for (const raw of sport.plays) {
    for (const q of candidates(raw, sport)) {
      count++;
      if (q.type === 'pass') assert.ok(q.answer && q.who !== q.answer, raw.key);
      if (q.type === 'spot') assert.ok(q.answer.every(Number.isFinite), raw.key);
      assert.ok(typeof explain(q.type === 'name' ? Object.assign({}, q, { answer: raw.title }) : q, sport, raw) === 'string');
    }
  }
  for (const a of AGES) {
    const Q = quiz(sport, { age: a.id, seed: 7, n: 6 });
    assert.ok(Q.length >= 4, `${sport.id} ${a.id} gets a quiz (${Q.length})`);
    Q.forEach(q => { assert.ok(playFor(q, sport)); if (q.choices) { assert.ok(q.choices.indexOf(q.answer) >= 0); assert.equal(new Set(q.choices).size, q.choices.length); } });
  }
}
// right answers raise the rating, wrong ones lower it; a quick right answer beats a slow one
const q = { type: 'pass', answer: 'O3', also: ['O2'], d: 95 };
let p = blank();
const g1 = grade(q, 'O3', 1000, '12-14'), g2 = grade(q, 'O3', 7000, '12-14'), g3 = grade(q, 'O4', 1000, '12-14'), g4 = grade(q, 'O2', 1000, '12-14');
assert.ok(g1.score > g2.score && g2.score > g4.score && g4.score > g3.score);
const up = record(p, q, g1, '12-14'), down = record(p, q, g3, '12-14');
assert.ok(up.iq > p.iq && down.iq < p.iq && up.dims.vision > p.dims.vision);
// levels climb; likeness follows the strongest read
assert.equal(level(80, sports()[0]).name, sports()[0].iq.levels[0]);
assert.equal(level(200, sports()[0]).next, null);
const seer = Object.assign(blank(), { n: 10, dims: { vision: 125, spacing: 85, recognition: 112, speed: 30 } });
assert.match(likeness(seer, sports()[0]).name, /Joki/);
console.log(`ok: ${count} IQ questions cut from the plays; ratings, levels and likeness behave`);
