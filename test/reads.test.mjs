// Teach the right read: in every library play, with defense on, every pass and throw goes to a
// player who is open at the catch (nearest defender at least the sport's "open" distance away).
// Defense lessons (a defender breaking on a bad throw) are the exception; the board calls out the open man there.
import assert from 'node:assert/strict';
import { sports } from '../src/sports/index.js';
import { normalize, compile } from '../src/engine/sim.js';

const SPAN_END = 0.94, bad = [];
let passes = 0;
for (const sport of sports()) for (const raw of sport.plays) {
  const sim = compile(normalize(raw, sport).play, sport, { defense: true });
  sim.play.beats.forEach((b, k) => b.actions.forEach(a => {
    const K = sport.kinds[a.kind];
    if (K.type !== 'pass' || a.kind === 'snap') return;
    passes++;
    const sp = sim.space(k + SPAN_END, sim.idx[a.target]);
    if (sp < sport.open && sim.play.lesson !== 'defense') bad.push(`${sport.id}/${raw.key} beat ${k + 1}: ${a.who} → ${a.target} has ${sp.toFixed(1)} ${sport.unit} of space (needs ${sport.open})`);
  }));
}
if (bad.length) console.log(bad.join('\n'));
assert.equal(bad.length, 0, `${bad.length} of ${passes} passes go to a covered player`);
console.log(`ok: all ${passes} passes go to an open player`);
