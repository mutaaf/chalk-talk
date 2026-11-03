// Pickleball: every shot in every library point (and its mirror) obeys the rules the lessons teach. The ball goes
// over the net to the other side and clears it; the serve is cross-court and lands past the kitchen in the
// diagonal service court; the serve and the return bounce (two-bounce rule); dinks, drops and resets land in the
// other kitchen; nobody volleys with their feet in the kitchen; a put-away is ours. Plus the words, the welcome and
// the Trace bits (bounce rings, facing the net on a real court).
import assert from 'node:assert/strict';
import { getSport, sportFor } from '../src/sports/index.js';
import { normalize, compile } from '../src/engine/sim.js';
import { trace, bounceIn, lookAt } from '../src/engine/trace.js';
import { kidLines } from '../src/engine/kids.js';
import { candidates, quiz, AGES } from '../src/engine/iq.js';
import { conceptsFor } from '../src/concepts/index.js';

const S = getSport('pickleball'), C = S.court, half = C.W / 2;
assert.equal(sportFor('pickleball'), S); assert.equal(sportFor('Pickleball doubles'), S);
const side = y => (y < C.net ? 'D' : 'O');
const inKitchen = p => Math.abs(p[0]) <= half && p[1] > C.net - C.nvz && p[1] < C.net + C.nvz;
const mirror = raw => JSON.parse(JSON.stringify(raw), (k, v) => (v && typeof v === 'object' && typeof v.x === 'number' && typeof v.y === 'number' ? Object.assign({}, v, { x: -v.x }) : v));

let hits = 0, points = 0;
for (const base of S.plays) for (const raw of [base, mirror(base)]) {
  const n = normalize(raw, S); assert.ok(n.ok && !n.errors.length, base.key + ': ' + n.errors.join(', '));
  const sim = compile(n.play, S, { defense: true }); points++;
  const by = id => sim.play.players[sim.idx[id]];
  let first = true, k2 = 0;
  sim.play.beats.forEach((b, k) => b.actions.forEach(a => {
    const K = S.kinds[a.kind];
    if (K.type === 'shot') { assert.equal(by(a.who).side, 'O', `${base.key}: only we put it away`); return; }
    if (K.type !== 'hit') return;
    hits++; k2++;
    const from = sim.posAt(k + 0.3)[sim.idx[a.who]], to = sim.posAt(k + 0.96)[sim.idx[a.target]];
    assert.notEqual(by(a.who).side, by(a.target).side, `${base.key} step ${k + 1}: ${a.kind} goes over the net`);
    assert.notEqual(side(from[1]), side(to[1]), `${base.key} step ${k + 1}: hitter and receiver on opposite sides`);
    // over the net, never through it
    let cleared = null;
    for (let f = 0.3; f < 0.96; f += 0.002) { const p = sim.ballAt(k + f), q = sim.ballAt(k + f + 0.002); if ((p[1] - C.net) * (q[1] - C.net) <= 0) cleared = p[2]; }
    assert.ok(cleared != null && cleared >= C.netH, `${base.key} step ${k + 1}: ${a.kind} clears the net (${cleared && cleared.toFixed(2)} ft)`);
    // where it lands, when it bounces
    const bz = bounceIn(sim, S, k);
    assert.equal(!!bz, !!K.bounce, `${base.key} step ${k + 1}: ${a.kind} ${K.bounce ? 'bounces' : 'is taken out of the air'}`);
    if (bz) {
      assert.equal(side(bz[1]), by(a.target).side, `${base.key} step ${k + 1}: it lands on the other side`);
      // soft shots land in the kitchen, or at the feet of a player still back in the transition zone
      const back = Math.abs(to[1] - C.net) > C.nvz + 3, short = Math.abs(bz[1] - C.net) < Math.abs(to[1] - C.net);
      if (/^(dink|drop|reset)$/.test(a.kind)) assert.ok(inKitchen(bz) || (back && short), `${base.key} step ${k + 1}: a ${a.kind} lands in the kitchen or at the feet (${bz.map(v => v.toFixed(1))})`);
      if (/^(serve|return)$/.test(a.kind)) assert.ok(!inKitchen(bz) && Math.abs(bz[1] - C.net) > C.nvz, `${base.key} step ${k + 1}: a ${a.kind} lands deep`);
    }
    if (a.kind === 'serve') {
      assert.ok(first, base.key + ': the serve comes first');
      assert.ok(Math.sign(from[0]) !== Math.sign(bz[0]) && Math.abs(bz[0]) <= half && bz[1] >= -0.01 && bz[1] <= C.L + 0.01, `${base.key}: the serve is cross-court and in`);
      const back = by(a.who).side === 'O' ? from[1] >= C.L : from[1] <= 0;
      assert.ok(back, `${base.key}: served from behind the baseline`);
    }
    if (first && a.kind === 'serve') { const nb = sim.play.beats[k + 1]; const r = nb && nb.actions.find(x => S.kinds[x.kind].type === 'hit'); assert.ok(r && S.kinds[r.kind].bounce, base.key + ': the return bounces (two-bounce rule)'); }
    if (!K.bounce) assert.ok(!inKitchen(sim.posAt(k + 0.3)[sim.idx[a.who]]), `${base.key} step ${k + 1}: no volley from the kitchen`);
    first = false;
  }));
  // words: Trace jobs, Kids lines
  const nm = id => S.notation.name(by(id));
  sim.play.players.forEach((p, i) => trace(sim, i, S, nm).steps.forEach(s => assert.ok(!/\bX\d|\bO\d|Stay with your player|Get open/.test(s.job), `${base.key} ${p.id}: "${s.job}"`)));
  kidLines(sim.play, S, nm).forEach(l => assert.ok(!/\b[OX]\d\b/.test(l), l));
  // the other side looks at our court with the ball, we look at theirs
  const h0 = sim.holderAt(0.02); if (h0 >= 0) { const L = lookAt(sim, h0, 0.02, S); assert.ok(Math.abs(Math.cos(L)) > 0.5 && Math.sign(Math.cos(L)) === (by(sim.play.players[h0].id).side === 'O' ? 1 : -1), base.key + ': eyes over the net'); }
}
// IQ: "which shot?" from the shot vocabulary; every age gets a game
const reads = S.plays.flatMap(p => candidates(p, S)).filter(q => q.type === 'read');
assert.ok(reads.length >= 10 && reads.every(q => q.options.length === 4 && q.options.includes(q.answer)), 'which-shot questions');
for (const a of AGES) assert.ok(quiz(S, { age: a.id, seed: 3, n: 6 }).length >= 4, a.id + ' gets a PickleIQ game');
// quick start: the five rules lesson exists and the welcome points at real things
const cs = conceptsFor('pickleball');
assert.equal(cs[0].id, 'rules'); assert.ok(cs.some(c => c.kind === 'offense') && cs.some(c => c.kind === 'defense'));
for (const w of S.welcome.steps) {
  if (w.go === 'lesson') assert.ok(cs.find(c => c.id === w.id) && cs.find(c => c.id === w.id).levels[w.level], w.t);
  if (w.go === 'play') assert.ok(S.plays.find(p => p.key === w.key), w.t);
}
console.log(`ok: ${points} pickleball points (library + mirrored), ${hits} shots over the net and in by the rules; words, PickleIQ and the quick start`);
