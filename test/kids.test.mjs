// Kids view words: every step of every library play, in every sport, is one short plain sentence.
import assert from 'node:assert/strict';
import { sports } from '../src/sports/index.js';
import { normalize } from '../src/engine/sim.js';
import { kidLines } from '../src/engine/kids.js';

let n = 0, longest = 0;
for (const sport of sports()) for (const raw of sport.plays) {
  const p = normalize(raw, sport); if (!p.ok) continue;
  const lines = kidLines(p.play, sport, id => id.replace(/^[OX]/, ''));
  assert.equal(lines.length, p.play.beats.length, raw.key + ': a line per step');
  lines.forEach((l, k) => {
    n++;
    const words = l.split(/\s+/).length; longest = Math.max(longest, words);
    assert.ok(words <= 18, `${raw.key} step ${k + 1} is short: "${l}"`);
    assert.ok(!/\b[OX][1-9]\b/.test(l), `${raw.key}: no X/O codes: "${l}"`);
    assert.ok(!/\b(beat|screen|leverage|coverage|help side|closeout|read)\b/i.test(l), `${raw.key}: plain words: "${l}"`);
    assert.match(l, /^[A-Z0-9★E]/, `${raw.key}: starts like a sentence: "${l}"`);
    assert.ok(/[.!]$|\p{Extended_Pictographic}$/u.test(l) && !/\p{Extended_Pictographic}\.$/u.test(l) && !/\.\.$/.test(l), `${raw.key}: ends cleanly: "${l}"`);
  });
}
const hoops = sports().find(s => s.id === 'basketball'), pnr = normalize(hoops.plays.find(p => /pick and roll/i.test(p.title)), hoops).play;
const L = kidLines(pnr, hoops, id => id.slice(1));
assert.ok(L.some(l => /like a wall/.test(l)), 'a screen is a wall'); assert.ok(L.some(l => /shoots!/.test(l)), 'a shot is a shot');
assert.deepEqual(kidLines({ players: [], beats: [{ actions: [] }] }, hoops), ['Everybody gets ready.']);
console.log(`ok: kids view lines for ${n} steps across ${sports().length} sports (longest ${longest} words)`);

// the way out of Kids view shows on phones too (2026-11-02: a coach was stuck in it; the touch header hid every pill)
{
  const fs = await import('node:fs');
  const css = fs.readFileSync(new URL('../src/style.js', import.meta.url), 'utf8');
  assert.ok(css.includes('.ct.ct-kids.ct-touch .ct-top > .ct-pill.ct-kidspill[data-r="kidsBtn"]'), 'the Grown-up view pill outranks the touch header rule');
  const mm = fs.readFileSync(new URL('../src/minimap.js', import.meta.url), 'utf8');
  assert.ok(/data-m="grow"/.test(mm) && /\.ct-mm\.big/.test(mm), 'the mini map can be expanded');
  console.log('ok: Kids view always has its way out, and the mini map expands');
}
