// CourtIQ / FieldIQ: every question is answerable from the engine's own read, ratings move the right
// way, and the likeness card matches the profile's shape.
import assert from 'node:assert/strict';
import { sports } from '../src/sports/index.js';
import { candidates, quiz, grade, record, blank, level, likeness, explain, playFor, AGES, mirror, DAILY, dayNumber, LEAD } from '../src/engine/iq.js';
import { normalize } from '../src/engine/sim.js';

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

// variety: every kind of question, and a player who keeps playing doesn't see a question again for a long time
for (const sport of sports()) {
  const types = new Set(sport.plays.flatMap(p => candidates(p, sport).map(q => q.type)));
  ['pass', 'spot', 'read', 'next', 'name'].forEach(t => assert.ok(types.has(t), `${sport.id} asks ${t}`));
  let prof = blank(), ids = new Set(), repeats = 0;
  for (let s = 0; s < 5; s++) {
    const Q = quiz(sport, { age: '12-14', seed: 100 + s, n: 5, iq: prof.iq, seen: prof.seen });
    assert.ok(Q.length >= 4, sport.id + ' session ' + s);
    assert.equal(new Set(Q.map(q => q.key)).size, Q.length, 'one question per play in a session');
    Q.forEach(q => { if (ids.has(q.id)) repeats++; ids.add(q.id); prof = record(prof, q, grade(q, q.answer, 1500, '12-14'), '12-14'); });
  }
  assert.equal(repeats, 0, `${sport.id}: 25 questions over 5 sessions, none repeated`);
}
// every question: clips start close to the decision, choices hold the answer once, nothing true among the wrong ones
for (const sport of sports()) for (const raw of sport.plays) for (const m of [false, true]) for (const q of candidates(raw, sport, { mirror: m })) {
  assert.ok(q.from <= q.at && q.from >= 0, raw.key);
  if (q.type !== 'name' && q.type !== 'coverage' && q.type !== 'next') assert.ok(q.at - q.from <= LEAD + 1e-9, `${raw.key} ${q.type}: a short clip`);
  if (q.type === 'next') { assert.ok(q.pool.length >= 2, `${raw.key} next has wrong answers`); assert.ok(q.pool.indexOf(q.answer) < 0); }
  if (q.type === 'read' || q.type === 'defense') assert.ok(q.options.indexOf(q.answer) >= 0, raw.key);
}
// mirrored plays: x flips, left and right swap in the words, the reads stay the reads
{
  const hoops = sports().find(s => s.id === 'basketball'), raw = hoops.plays.find(p => /wing|right|left/i.test(JSON.stringify(p.beats)));
  const a = normalize(raw, hoops).play, b = normalize(mirror(raw, hoops), hoops).play;
  a.players.forEach((p, i) => { assert.equal(b.players[i].x, -p.x); assert.equal(b.players[i].y, p.y); });
  const said = a.beats.map(x => x.say).join(' '), flip = b.beats.map(x => x.say).join(' ');
  if (/\bright\b/.test(said)) assert.ok(/\bleft\b/.test(flip), 'right becomes left');
  assert.equal(candidates(raw, hoops).filter(q => q.type === 'pass').length, candidates(raw, hoops, { mirror: true }).filter(q => q.type === 'pass').length);
}
// the daily: the same five for everyone on a day, a different five tomorrow
{
  const hoops = sports().find(s => s.id === 'basketball'), day = dayNumber(new Date(2026, 10, 3));
  const one = quiz(hoops, { seed: day * 7919, n: DAILY.n, iq: DAILY.iq, age: DAILY.age, mix: DAILY.mix }), two = quiz(hoops, { seed: day * 7919, n: DAILY.n, iq: DAILY.iq, age: DAILY.age, mix: DAILY.mix });
  const next = quiz(hoops, { seed: (day + 1) * 7919, n: DAILY.n, iq: DAILY.iq, age: DAILY.age, mix: DAILY.mix });
  assert.deepEqual(one.map(q => q.id), two.map(q => q.id)); assert.notDeepEqual(one.map(q => q.id), next.map(q => q.id));
  assert.equal(one.length, 5); assert.ok(new Set(one.map(q => q.type)).size >= 3, 'the daily mixes kinds of reads');
  assert.equal(dayNumber(new Date(2026, 9, 31)), 1); assert.equal(dayNumber(new Date(2026, 10, 1)), 2);
}
console.log(`ok: ${count} IQ questions cut from the plays; ratings, levels and likeness behave`);

// the bank: the engine's own situations, every answer a clear open read
{
  const { situations } = await import('../src/engine/situations.js');
  const { compile, normalize: norm } = await import('../src/engine/sim.js');
  const { bank } = await import('../src/engine/iq.js');
  const hoops = sports().find(s => s.id === 'basketball'), S = situations(hoops);
  assert.ok(S.length >= 150, 'a deep bank of situations (' + S.length + ')');
  assert.ok(new Set(S.map(x => x.title + x.concept)).size >= 20, 'many formations × actions');
  assert.deepEqual(situations(hoops).map(x => x.key), S.map(x => x.key), 'seeded: the same everywhere');
  for (const raw of S.slice(0, 60)) {
    const n = norm(raw, hoops); assert.ok(n.ok, raw.key);
    const sim = compile(n.play, hoops, { defense: true }), k = raw.beats.length - 2, pass = raw.beats[k].actions[0];
    assert.equal(pass.kind, 'pass'); assert.ok(sim.space(k - 0.06, sim.idx[pass.target]) >= hoops.open * 1.3, raw.key + ': the answer is open');
  }
  const qs = bank(hoops).flatMap(p => candidates(p, hoops));
  assert.ok(qs.length > 3000, 'thousands of questions (' + qs.length + ')');
  assert.ok(!qs.some(q => q.type === 'name' && /^sit-/.test(q.key)), 'no "name that play" for a made-up situation');
  assert.equal(situations(sports().find(s => s.id === 'flag5')).length, 0, 'only sports that ask for them');
}
// coming back: badges from what's stored, the share line, the countdown
{
  const { BADGES, earned, shareText, untilTomorrow } = await import('../src/iqmode.js');
  assert.deepEqual(earned({ dailies: 0, perfect: 0, streak: 0, run: 0, reads: 0, level: 0 }), []);
  assert.ok(earned({ dailies: 3, perfect: 1, streak: 7, run: 12, reads: 120, level: 1 }).length === 7);
  assert.equal(new Set(BADGES.map(b => b.id)).size, BADGES.length);
  const t = shareText('CourtIQ', 4, [{ right: true, quick: true }, { right: true }, { partial: true }, {}, { right: true, quick: true }], 52.4, 3, 'flag5');
  assert.match(t, /CourtIQ Daily #4 {2}3\/5 {2}🟩🟨🟧⬛🟩 {2}52s {2}🔥3/); assert.match(t, /\?iq=daily&sport=flag5$/);
  assert.equal(untilTomorrow(new Date(2026, 10, 1, 22, 30)), '1h 30m'); assert.equal(untilTomorrow(new Date(2026, 10, 1, 23, 59, 30)), '1m');
}
console.log('ok: a deep bank (library + situations, mirrored), badges, share line, countdown');
