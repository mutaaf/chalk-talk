// The player card: for every player in every library play of every sport, at every half step, the card has
// a status, at most four chips in its sport's words, a step per beat, and (where the sport has a guide) a position.
import assert from 'node:assert/strict';
import { sports } from '../src/sports/index.js';
import { normalize, compile } from '../src/engine/sim.js';
import { cardModel, statsOf } from '../src/card.js';

const WRONG = { rally: /guard|marking|marked|lane|rim|paint|on the ball|zone ·/i };
let cards = 0; const bad = [];
for (const sport of sports()) for (const raw of sport.plays) for (const defense of [true, false]) {
  const play = normalize(raw, sport).play, sim = compile(play, sport, { defense });
  for (let t = 0; t <= sim.beats; t += 0.5) sim.players.forEach(p => {
    const m = cardModel(sim, sport, sim.play, t, p.id);
    cards++;
    const where = `${sport.id}/${raw.key} ${defense ? 'D' : '-'} t=${t} ${p.id}`;
    if (typeof m.status !== 'string' || !m.status) bad.push(where + ': no status');
    if (m.stats.length > 4) bad.push(where + ': too many chips');
    if (m.steps.length !== sim.beats) bad.push(where + ': steps');
    if (sport.positions && sport.positions.length && !m.pos) bad.push(where + ': no position');
    const words = m.status + ' ' + m.stats.map(s => s.k + ' ' + s.v).join(' ');
    if (sport.rally && WRONG.rally.test(words)) bad.push(where + ': ' + words);
    if (sport.rally && !m.stats.some(s => s.k === 'Court')) bad.push(where + ': no court chip');
  });
}
if (bad.length) console.log([...new Set(bad.map(b => b.split("/")[0] + " " + b.split(" ").pop() + " " + b.split(" ")[3].replace(/[0-9]+/g,"#") ))].join('\n'));
assert.equal(bad.length, 0, `${bad.length} bad cards of ${cards}`);
// chips read the numbers the way a coach would
const ch = statsOf({ net: { zone: 'kitchen line', toNet: 7.2, mate: 'O2', gap: 16 }, speed: 0 }, { unit: 'ft', court: { W: 20 } }, id => ({ O2: 'B' })[id]);
assert.deepEqual(ch.map(c => c.v), ['kitchen line', '7 ft', '16 ft from B']);
assert.equal(ch[2].tone, 'bad');
console.log(`ok: ${cards} player cards`);
