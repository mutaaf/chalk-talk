// Make a Short: the pure parts (frame layout and safe zones, caption words and pages, the timeline, the format).
import assert from 'node:assert/strict';
import { OUT, SAFE, CARD, BEAT, frameLayout, inSafe, captionTokens, wrapTokens, pagesOf, wordAt, planShort, pickMime, fileName, speechSec, readSec } from '../src/shorts.js';
import { getSport } from '../src/sports/index.js';
import { normalize, compile } from '../src/engine/sim.js';
import { analyze } from '../src/analyst.js';

// every piece of text sits inside the Shorts safe zone: out of the bottom 20% and the right 12%
const L = frameLayout();
assert.equal(L.w, 1080); assert.equal(L.h, 1920); assert.equal(OUT.fps, 30);
assert.ok(SAFE.bottom <= 0.8 && SAFE.right <= 0.88);
assert.ok(inSafe(L.caption), 'caption box in the safe zone');
assert.ok(L.caption.y + L.caption.h <= 1920 * 0.8, 'captions stay above the bottom 20%');
assert.ok(L.caption.x + L.caption.w <= 1080 * 0.88, 'captions stay left of the right 12%');
assert.ok(L.counter.x <= 1080 * 0.88, 'step counter left of the right 12%');
assert.ok(L.mark.y - L.mark.size >= 1920 * SAFE.top - 1 && L.head.y < L.field.y * 1920, 'wordmark and title above the field');
assert.ok(L.caption.pad * 2 + L.caption.line * L.caption.lines <= L.caption.h + 1, 'three caption lines fit the box');
assert.ok(L.field.y * 1920 + L.field.h * 1920 <= L.caption.y + 1, 'the field ends where the captions begin');
assert.ok(!inSafe({ x: 100, y: 1600, w: 200, h: 50 }), 'the bottom 20% is out');
assert.ok(!inSafe({ x: 900, y: 600, w: 120, h: 50 }), 'the right 12% is out');
const half = frameLayout(540, 960); assert.equal(half.u, 0.5); assert.ok(Math.abs(half.caption.size - 27) < 1e-9);

// caption words: positions, or names only when the board shows them; punctuation kept
const pos = id => ({ O1: '1', O5: '5', X5: 'X5' }[id] || id);
let tk = captionTokens('O1 comes off O5’s screen, (X5) drops.', pos);
assert.deepEqual(tk.map(t => t.t), ['1', 'comes', 'off', '5’s', 'screen,', '(X5)', 'drops.']);
assert.deepEqual(tk.map(t => t.side), ['O', '', '', 'O', '', 'X', '']);
assert.equal(captionTokens('O1 drives', id => (id === 'O1' ? 'Maya' : id))[0].t, 'Maya');
assert.equal(captionTokens('OX1 and O10', pos).map(t => t.side).join(','), ',,');
assert.deepEqual(captionTokens('', pos), []);

// wrapping and pages (a monospace measure: 10 px a character)
const m = s => s.length * 10;
tk = captionTokens('one two three four five six seven eight nine ten eleven twelve thirteen', null);
const lines = wrapTokens(tk, m, 140);
lines.forEach(l => assert.ok(l.map(i => tk[i].t).join(' ').length * 10 <= 140 || l.length === 1));
assert.deepEqual(lines.flat(), tk.map((_, i) => i), 'every word once, in order');
assert.deepEqual(wrapTokens([{ t: 'supercalifragilistic' }], m, 50), [[0]], 'a long word gets its own line');
const pages = pagesOf(lines, 3);
assert.ok(pages.every(p => p.length <= 3)); assert.deepEqual(pages.flat(2), lines.flat());
assert.deepEqual(pagesOf([1, 2, 3, 4], 3).map(p => p.length), [2, 2], 'balanced pages, no orphan line');
assert.deepEqual(pagesOf([1, 2, 3], 3).map(p => p.length), [3]); assert.deepEqual(pagesOf([], 3), []);

// word-by-word: monotonic, from the first word to past the last
let last = -1;
for (let p = 0; p <= 1.0001; p += 0.01) { const w = wordAt(tk, p); assert.ok(w >= last); last = w; }
assert.equal(wordAt(tk, 0), 0); assert.equal(wordAt(tk, 1), tk.length); assert.equal(wordAt([], 0.5), -1);

// the timeline
assert.ok(speechSec('a b c d e') > 2 && readSec('a') >= 1.6);
const short = planShort({ title: 'Pick and Roll', steps: [{ pbp: '1 dribbles to the wing.' }, { pbp: '5 sets the ball screen.' }, { pbp: '5 rolls; 1 hits him.' }], voice: true });
assert.equal(short.style, 'analyst'); assert.equal(short.speed, 0.75, 'short lines: teaching pace'); assert.ok(short.fits);
assert.ok(Math.abs(short.total - (short.head + short.per.reduce((a, b) => a + b, 0) + CARD.recap + CARD.end)) < 0.06);
short.per.forEach((p, i) => assert.ok(p >= BEAT / short.speed - 1e-9 && p >= speechSec(short.lines[i]) - 1e-9));
const wordy = Array.from({ length: 40 }, () => 'word').join(' ');
const long = planShort({ title: 'X', steps: Array.from({ length: 4 }, () => ({ pbp: 'short line here.', analyst: wordy })), voice: true });
assert.equal(long.style, 'pbp', 'analyst lines too long for a Short: play-by-play instead'); assert.ok(long.fits);
const many = planShort({ title: 'X', steps: Array.from({ length: 20 }, () => ({ pbp: 'short line.' })), voice: false });
assert.ok(many.speed > 0.75, 'many steps: faster between lines'); assert.ok(many.fits);
const huge = planShort({ title: 'X', steps: Array.from({ length: 12 }, () => ({ pbp: wordy })), voice: true });
assert.ok(!huge.fits && huge.lines.length === 12, 'too long either way: the shortest plan, flagged');
assert.equal(planShort({ steps: [{ pbp: 'a', analyst: 'b' }], prefer: 'pbp' }).lines[0], 'a', 'the coach’s play-by-play choice is kept');

// every library play gets a plan, captions only and with a voice, defense off and on
let over = 0, all = 0;
for (const id of ['basketball', 'flag5', 'flag7']) {
  const sport = getSport(id);
  for (const p of sport.plays) {
    for (const defense of [false, true]) {
      const n = normalize(p, sport); assert.ok(n.ok, p.key);
      const sim = compile(n.play, sport, { defense }), booth = analyze(sim, sport);
      const steps = n.play.beats.map((b, k) => ({ pbp: b.say, analyst: booth[k] }));
      for (const voice of [false, true]) {
        const plan = planShort({ title: n.play.title, steps, voice });
        assert.equal(plan.lines.length, n.play.beats.length);
        assert.ok(plan.lines.every(Boolean), 'a line for every step');
        all++; if (!plan.fits) over++;
      }
    }
  }
}
assert.ok(over / all < 0.1, `nearly every library play fits under a minute (${over}/${all} over)`);

// the format: H.264 MP4 first, WebM after
assert.deepEqual(pickMime(t => t.startsWith('video/mp4;codecs=avc1.640028')), { mime: 'video/mp4;codecs=avc1.640028,mp4a.40.2', ext: 'mp4' });
assert.equal(pickMime(t => t.startsWith('video/webm')).ext, 'webm');
assert.equal(pickMime(t => t === 'video/webm;codecs=vp8,opus').mime, 'video/webm;codecs=vp8,opus');
assert.equal(pickMime(() => false), null);
assert.equal(pickMime(() => { throw new Error('no'); }), null);
assert.equal(fileName('Pick and Roll', 'mp4'), 'chalk-talk-pick-and-roll.mp4');
assert.equal(fileName('', 'webm'), 'chalk-talk-play.webm');
assert.equal(fileName('Spain P&R / 2!', 'mp4'), 'chalk-talk-spain-p-r-2.mp4');

console.log(`ok: shorts (layout, safe zones, captions, timeline, format; ${all - over}/${all} library plans under a minute)`);
