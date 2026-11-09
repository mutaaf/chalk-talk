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

// every sport says its reads its own way: no basketball words on a pickleball court or a soccer pitch, and in a
// net sport a shot always crosses the net (nobody "passes" to a partner)
import { bestReads } from '../src/engine/reads.js';
const WRONG = { pickleball: /rim|paint|defender|guard|pass to|close out|show your hands|cut\b/i, soccer: /rim|paint|show your hands|bounce it|close out|drive the lane/i };
let said = 0; const wrong = [];
for (const sport of sports()) {
  const bad = WRONG[sport.rally ? 'pickleball' : sport.pitch ? 'soccer' : ''];
  if (!bad) continue;
  for (const raw of sport.plays) {
    const sim = compile(normalize(raw, sport).play, sport, { defense: true });
    for (let t = 0.25; t < sim.beats; t += 0.5) sim.players.forEach((p, i) => bestReads(sim, sport, t, i).forEach(r => {
      said++;
      if (bad.test(r.text + ' ' + r.why)) wrong.push(`${sport.id}/${raw.key} t=${t} ${p.id}: ${r.text} — ${r.why}`);
      if (sport.rally && r.kind === 'pass' && typeof r.to === 'number' && (sim.posAt(t)[r.to][1] > sport.court.net) === (sim.posAt(t)[i][1] > sport.court.net)) wrong.push(`${sport.id}/${raw.key} t=${t} ${p.id}: a shot to a partner`);
    }));
  }
}
assert.deepEqual(wrong.slice(0, 8), [], wrong.length + ' reads in the wrong sport');
console.log(`ok: ${said} pickleball and soccer reads in their own sport's words`);

// and the Analyst narration: no basketball lines in a net sport or on a pitch
import { analyze } from '../src/analyst.js';
const lines = [];
for (const sport of sports().filter(s => s.rally || s.pitch)) for (const raw of sport.plays)
  analyze(compile(normalize(raw, sport).play, sport, { defense: true }), sport).forEach(l => { if (/\brim\b|paint|man to man|weak side|spacing buys|bounce pass|chest pass/i.test(l)) lines.push(`${sport.id}/${raw.key}: ${l}`); });
assert.deepEqual(lines.slice(0, 5), [], lines.length + ' analyst lines in the wrong sport');
console.log('ok: the analyst speaks pickleball and soccer');
