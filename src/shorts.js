// Make a Short: the play on the board recorded as a vertical video (1080×1920, 30 fps) for YouTube Shorts,
// TikTok and Reels, ready to post with no editing: a title card, the play at teaching pace with big captions of
// each step's line (word by word), a step counter, the wordmark, and an end card.
//
// How a frame is made (see CLAUDE.md → Shorts):
//   - while it records, the board's stage is a fixed 540×960 portrait box (the aurora canvas is 1080×1920 at
//     DPR 2), hidden under the preview, with the field framed in the middle of the frame;
//   - on the field's own 'frame' event (right after the WebGL draw, same task, so no preserveDrawingBuffer),
//     the 2D canvas gets: the background, the aurora canvas, the ink layer redrawn from the live SVG (each path's
//     `d`, circle, text; styles read once per class change), the labels, then the captions and cards;
//   - the 2D canvas is captureStream'd; the narration <audio> (sound.js `player`) goes through Web Audio
//     (MediaElementSource → destination + MediaStreamDestination), the chimes are tapped into the same mix.
// The pure parts (layout and safe zones, caption tokens and pages, the timeline plan, the format) are exported
// for test/shorts.test.mjs.

import { say, hush, speaking, ready as voiceReady, cloudVoice } from './voice.js';
import { player, audioContext, tapCues, chime } from './sound.js';
import { frame as diagramFrame } from './playbook.js';

export const OUT = { w: 1080, h: 1920, fps: 30 };
// Shorts / Reels / TikTok put their own UI over the bottom ~20% and the right ~12%: no text there
export const SAFE = { top: 0.06, bottom: 0.8, left: 0.055, right: 0.88 };
export const CARD = { title: 1.2, recap: 1.4, end: 2.6 };
export const BEAT = 2.4;   // seconds a beat takes at 1× (engine/sim.js)
export const STAGE = { w: 540, h: 960 };   // the board while it records, in CSS px (×2 = the frame)

// ---- pure helpers ----
export function frameLayout(w = OUT.w, h = OUT.h) {
  const u = w / 1080, L = w * SAFE.left, R = w * SAFE.right, T = h * SAFE.top, B = h * SAFE.bottom;
  const field = { x: 0.03, y: 0.178, w: 0.94, h: 0.429 };   // the board's box, as fractions of the frame
  const capTop = h * (field.y + field.h) + 8 * u, cap = { size: 52 * u, line: 64 * u, pad: 24 * u, lines: 2 };
  const capH = cap.pad * 2 + cap.line * cap.lines, chipTop = capTop + capH + 14 * u, chipH = 62 * u, artTop = chipTop + chipH + 22 * u;
  return {
    w, h, u,
    safe: { x: L, y: T, w: R - L, h: B - T },
    mark: { x: L, y: T + 42 * u, size: 38 * u },              // the wordmark, top left (baseline)
    counter: { x: R, y: T + 42 * u, size: 30 * u },           // STEP 2 / 5, right-aligned inside the safe zone
    head: { x: L, y: T + 116 * u, w: R - L, eyebrow: 30 * u, title: 78 * u },
    field,
    caption: Object.assign({ x: L, y: capTop, w: R - L, h: capH }, cap),
    // under the captions, in the safe zone: the step's actions as chips, each with its own little diagram
    chips: { x: L, y: chipTop, w: R - L, h: chipH, gap: 12 * u, word: 30 * u },
    // the rest of the frame (the platforms' title and buttons may sit over its lower part; nothing there needs
    // reading): the whole play as a chalk diagram, this step lit, and every step as its own small diagram
    art: { x: w * 0.055, y: artTop, w: w * 0.89, h: h * 0.978 - artTop, gap: 14 * u },
    card2: { title: 150 * u, eyebrow: 40 * u, cta: 170 * u, url: 50 * u }
  };
}
export const inSafe = (r, w = OUT.w, h = OUT.h) => r.x >= w * SAFE.left - 0.5 && r.y >= h * SAFE.top - 0.5 && r.x + r.w <= w * SAFE.right + 0.5 && r.y + r.h <= h * SAFE.bottom + 0.5;

const wordsOf = s => String(s || '').trim().split(/\s+/).filter(Boolean);
export const speechSec = s => wordsOf(s).length / 2.5 + 0.4;            // a broadcaster's pace
export const readSec = s => Math.max(1.6, wordsOf(s).length / 3.2 + 0.6);   // captions alone: time to read them

// a step's line as caption words: O4 / X2 become what the board shows (positions, or names when they're on)
export function captionTokens(text, nameOf) {
  return wordsOf(text).map(t => {
    const m = t.match(/^([^A-Za-z0-9]*)([OX])([1-9])(?![A-Za-z0-9])(.*)$/);
    if (m) { const nm = nameOf ? nameOf(m[2] + m[3]) : m[2] + m[3]; return { t: m[1] + nm + m[4], side: m[2] }; }
    return { t, side: '' };
  });
}
// greedy lines under maxW (measure(text) → width), as token indexes
export function wrapTokens(tokens, measure, maxW) {
  const lines = [], sp = measure(' ');
  let cur = [], w = 0;
  tokens.forEach((tk, i) => {
    const tw = measure(tk.t);
    if (cur.length && w + sp + tw > maxW) { lines.push(cur); cur = []; w = 0; }
    w += (cur.length ? sp : 0) + tw; cur.push(i);
  });
  if (cur.length) lines.push(cur);
  return lines;
}
// pages of at most `per` lines, balanced (4 lines → 2 + 2, not 3 + an orphan)
export function pagesOf(lines, per = 3) { const n = Math.ceil(lines.length / per), size = Math.ceil(lines.length / Math.max(1, n)), out = []; for (let i = 0; i < lines.length; i += size) out.push(lines.slice(i, i + size)); return out; }
// which word is being said at progress p (0..1), weighted by length so long words take longer
export function wordAt(tokens, p) {
  if (!tokens.length) return -1;
  if (p <= 0) return 0;
  if (p >= 1) return tokens.length;
  const wt = tokens.map(t => t.t.length + 2), total = wt.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < wt.length; i++) { acc += wt[i]; if (acc / total > p) return i; }
  return tokens.length - 1;
}
// the timeline: the coach's style first (the analyst explains the read), at teaching pace; faster between lines,
// then the shorter play-by-play lines, until it fits in max seconds (Shorts are under 60 s)
// a step's actions as chips: what happens, who does it, and which little diagram goes with it (offense first, ≤3)
const CHIP = { pass: ['PASS', 'pass'], throw: ['THROW', 'pass'], pitch: ['PITCH', 'pass'], snap: ['SNAP', 'pass'], handoff: ['HANDOFF', 'handoff'], shot: ['SHOT', 'shot'],
  dribble: ['DRIVE', 'dribble'], screen: ['SCREEN', 'screen'], cut: ['CUT', 'cut'], curl: ['CURL', 'cut'], roll: ['ROLL', 'cut'], pop: ['POP', 'cut'], route: ['ROUTE', 'cut'],
  motion: ['MOTION', 'cut'], run: ['RUN', 'cut'], move: ['MOVE', 'cut'], drift: ['DRIFT', 'cut'], lift: ['LIFT', 'cut'], boxout: ['BOX OUT', 'cut'] };
export function stepChips(play, k, nameOf, defense) {
  const nm = nameOf || (id => id), beat = play.beats[k], out = [];
  if (!beat) return out;
  const sideOf = id => { const p = (play.players || []).find(q => q.id === id); return p ? p.side : id[0] === 'X' ? 'D' : 'O'; };
  const acts = (beat.actions || []).filter(a => a.kind !== 'ready').sort((a, b) => (sideOf(a.who) === 'D') - (sideOf(b.who) === 'D'));
  for (const a of acts) {
    const side = sideOf(a.who);
    if (side === 'D' && !defense) continue;
    const c = CHIP[a.kind] || [a.kind.toUpperCase(), side === 'D' ? 'def' : 'cut'];
    const to = a.target ? (a.kind === 'screen' ? ' for ' : ' → ') + nm(a.target) : '';
    out.push({ kind: a.kind, icon: side === 'D' ? 'def' : c[1], word: c[0], text: nm(a.who) + to, side });
  }
  return out.length > 3 ? out.slice(0, 2).concat([{ kind: 'more', icon: 'more', word: '+' + (out.length - 2), text: 'more', side: 'O' }]) : out;
}
// the whole play in a few chips, for the recap: 3 PASSES · 2 SCREENS · 1 DRIVE
export function recapChips(play) {
  const n = {}, order = [];
  for (const b of play.beats) for (const a of b.actions || []) { const c = CHIP[a.kind], p = (play.players || []).find(q => q.id === a.who); if (!c || (p && p.side === 'D')) continue; if (!n[c[0]]) { n[c[0]] = { icon: c[1], n: 0 }; order.push(c[0]); } n[c[0]].n++; }
  return order.sort((a, b) => n[b].n - n[a].n).slice(0, 3).map(w => ({ icon: n[w].icon, word: String(n[w].n), text: n[w].n === 1 ? w.toLowerCase() : w.toLowerCase().replace(/(s|x|h)$/, '$1e') + 's', side: 'O' }));
}

export function planShort({ title = '', steps = [], voice = false, prefer = 'analyst', max = 59 } = {}) {
  const styles = prefer === 'pbp' ? ['pbp'] : ['analyst', 'pbp'], SPEEDS = [0.75, 1, 1.25, 1.5, 2];
  let best = null;
  for (const style of styles) {
    const lines = steps.map(s => (style === 'analyst' && s.analyst) || s.pbp || '');
    const sec = lines.map(l => (voice ? speechSec : readSec)(l));
    const head = Math.max(CARD.title, voice && title ? speechSec(title) : 0);
    for (const speed of SPEEDS) {
      const per = sec.map(x => Math.max(BEAT / speed, x));
      const total = head + per.reduce((a, b) => a + b, 0) + CARD.recap + CARD.end;
      const plan = { style, lines, speed, per, head, total: Math.round(total * 10) / 10, fits: total <= max };
      if (plan.fits) return plan;
      if (!best || total < best.total) best = plan;
    }
  }
  return best;
}
// H.264/AAC MP4 where the browser can (Safari, recent Chrome), else WebM
export const MIMES = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1.4d0028,mp4a.40.2', 'video/mp4;codecs=avc1.42E01F,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/mp4;codecs=avc1,opus', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
export function pickMime(supported) {
  for (const m of MIMES) { let ok = false; try { ok = supported(m); } catch (e) {} if (ok) return { mime: m, ext: m.startsWith('video/mp4') ? 'mp4' : 'webm' }; }
  return null;
}
export const fileName = (title, ext) => 'chalk-talk-' + (String(title || 'play').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'play') + '.' + ext;
const clock = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

// the narration element and the chimes, mixed into one stream; made once (an element can be routed only once)
let G = null;
function graph() {
  if (G) return G;
  const ac = audioContext(); if (!ac || !ac.createMediaStreamDestination) return null;
  const dest = ac.createMediaStreamDestination();
  let voiceIn = false;
  if (player) try { const src = ac.createMediaElementSource(player); src.connect(ac.destination); src.connect(dest); voiceIn = true; } catch (e) {}
  G = { ac, dest, voiceIn };
  return G;
}


// ---- the DOM ----
const FIELD = frameLayout().field;
const CSS = `
.ct-shorts { position: absolute; inset: 0; z-index: 60; background: radial-gradient(60% 50% at 50% 42%, rgba(14, 24, 44, .94), rgba(4, 7, 12, .985)); animation: ct-fadein .25s both; }
.ct-shprev { position: absolute; border-radius: 16px; background: #04070c; box-shadow: 0 0 0 1px rgba(140, 188, 255, .22), 0 30px 80px rgba(0, 0, 0, .6), 0 0 140px rgba(255, 142, 58, .1); }
.ct-shbar { position: absolute; left: 50%; bottom: 14px; translate: -50% 0; width: min(520px, calc(100% - 24px)); display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center;
  padding: 10px 10px 10px 12px; border-radius: 18px; background: var(--glass-regular, rgba(10, 16, 28, .8)); border: 1px solid var(--line); box-shadow: 0 16px 40px rgba(0, 0, 0, .45); }
.ct-shorb { position: relative; width: 34px; height: 34px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ff8a8a, #ff4d4d); box-shadow: 0 0 24px rgba(255, 77, 77, .5); }
.ct-shorb i { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(255, 110, 110, .7); animation: ct-ripple 2.1s ease-out infinite; }
.ct-shorb i + i { animation-delay: 1.05s; }
.ct-shorts[data-ph=prep] .ct-shorb { background: radial-gradient(circle at 35% 30%, #ffb067, var(--o)); box-shadow: 0 0 24px rgba(255, 142, 58, .5); }
.ct-shorts[data-ph=prep] .ct-shorb i { border-color: rgba(255, 142, 58, .7); }
.ct-shtxt { min-width: 0; display: grid; gap: 5px; }
.ct-shtxt b { font-family: var(--display); font-weight: 900; font-size: 17px; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-shtxt small { font-size: 12px; color: var(--mute); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-shtrack { height: 5px; border-radius: 3px; background: rgba(140, 188, 255, .14); overflow: hidden; }
.ct-shtrack i { display: block; height: 100%; width: 0; border-radius: 3px; background: linear-gradient(90deg, var(--o), var(--hi), var(--ice)); transition: width .25s linear; }
.ct-shorts[data-ph=prep] .ct-shtrack i { width: 35% !important; animation: ct-shscan 1.2s ease-in-out infinite alternate; }
@keyframes ct-shscan { from { translate: -100% 0; } to { translate: 290% 0; } }
.ct .ct-shbar button, .ct .ct-shres button, .ct .ct-shres a { height: 40px; padding: 0 16px; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; text-decoration: none; }
.ct .ct-shbar button { border: 1px solid var(--line); }
.ct .ct-shbar button:hover { background: var(--ice-dim); }
.ct.ct-shorting .ct-stage { position: absolute !important; inset: auto !important; left: 0 !important; top: 0 !important; width: ${STAGE.w}px !important; height: ${STAGE.h}px !important; transform: none !important; z-index: 0 !important; }
.ct.ct-shorting .ct-boardbox { position: absolute !important; inset: auto !important; left: ${FIELD.x * 100}% !important; top: ${FIELD.y * 100}% !important; width: ${FIELD.w * 100}% !important; height: ${FIELD.h * 100}% !important; transform: none !important; --ct-fit: .5 .62 !important; }
.ct.ct-shorting .ct-mind { display: none !important; }
.ct-shres { position: absolute; z-index: 45; right: 18px; bottom: 18px; width: min(340px, calc(100% - 24px)); padding: 14px; border-radius: 20px; display: grid; gap: 10px;
  background: var(--glass-regular, rgba(10, 16, 28, .86)); backdrop-filter: var(--glass-blur, blur(18px)); -webkit-backdrop-filter: var(--glass-blur, blur(18px)); border: 1px solid var(--line); box-shadow: 0 20px 50px rgba(0, 0, 0, .45); animation: ct-rise .3s both; }
.ct-shres header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.ct-shres h4 { margin: 0; font-family: var(--display); font-weight: 900; font-size: 20px; letter-spacing: .05em; text-transform: uppercase; }
.ct-shres h4 small { display: block; font-family: var(--body); font-weight: 400; font-size: 12px; letter-spacing: 0; text-transform: none; color: var(--mute); }
.ct-shres video { width: 100%; max-height: min(46vh, 420px); aspect-ratio: 9 / 16; object-fit: contain; border-radius: 12px; background: #04070c; }
.ct-shres p { margin: 0; font-size: 12.5px; color: var(--mute); }
.ct-shres p button { height: auto !important; padding: 0 !important; display: inline !important; color: var(--o); text-decoration: underline; font-weight: 700; font-size: inherit !important; }
.ct-shrow { display: flex; gap: 8px; }
.ct-shrow > * { flex: 1; }
.ct .ct-shres .go { background: var(--o); color: var(--night); }
.ct .ct-shres .ghost { border: 1px solid var(--line); }
.ct-shres .ct-x { position: static; }
.ct-shstart { display: grid; gap: 4px; }
.ct-shstart dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 13px; }
.ct-shstart dt { color: var(--mute); }
.ct-shstart dd { margin: 0; }
.ct.ct-light .ct-shorts { background: radial-gradient(60% 50% at 50% 42%, rgba(30, 40, 60, .94), rgba(10, 14, 22, .985)); }
@media (max-width: 520px) { .ct-shres { left: 12px; right: 12px; width: auto; bottom: calc(12px + env(safe-area-inset-bottom)); } .ct-shres video { max-height: 36vh; } }
`;

export function createShorts(ctx) {
  const { root } = ctx;
  let styleEl = null, cur = null, res = null, keyBlock = null;
  const L = frameLayout();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const style = () => { if (!styleEl) { styleEl = document.createElement('style'); styleEl.dataset.chalkTalkShorts = ''; styleEl.textContent = CSS; document.head.appendChild(styleEl); } };
  const supported = () => typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream;
  const format = () => pickMime(m => MediaRecorder.isTypeSupported(m));

  function stepsNow() {
    const sim = ctx.sim(), play = ctx.play();
    return play.beats.map((b, k) => ({ pbp: b.say || '', analyst: ctx.analystLine(k) || '' }));
  }
  function planNow(voice) { const play = ctx.play(); return planShort({ title: play.title, steps: stepsNow(), voice, prefer: ctx.style() === 'pbp' ? 'pbp' : 'analyst' }); }

  // ---- the start card: what the Short will be, and whether the voice can be in it ----
  function open() {
    if (cur) return;
    if (ctx.busy()) { ctx.toast('Finish what you’re doing on the board first, then make a Short.'); return; }
    if (!supported() || !format()) { ctx.toast('This browser can’t record video. Try Chrome or Safari.'); return; }
    style(); closeRes();
    const play = ctx.play(), voice = cloudVoice(ctx.playKey()), plan = planNow(voice), fmt = format();
    res = document.createElement('div'); res.className = 'ct-shres'; res.setAttribute('role', 'dialog'); res.setAttribute('aria-label', 'Make a Short');
    res.innerHTML = `<header><h4>Make a Short<small>${esc(play.title)} · vertical video for Shorts, Reels and TikTok</small></h4><button type="button" class="ct-x" data-a="close" aria-label="Close">✕</button></header>
      <div class="ct-shstart"><dl><dt>Size</dt><dd>1080 × 1920, 30 fps, ${fmt.ext.toUpperCase()}</dd><dt>Length</dt><dd>about ${clock(plan.total)}${plan.fits ? '' : ' (a long play)'}</dd>
      <dt>Voice</dt><dd>${voice ? 'Your broadcaster voice, with captions' : 'Captions only'}</dd></dl></div>
      ${voice ? '' : '<p>The device’s own voice can’t be recorded. <button type="button" data-a="key">Add a voice key</button> (OpenAI or ElevenLabs) and the narration goes in the video.</p>'}
      <p>It plays the whole play once at teaching pace. Keep this tab open while it records.</p>
      <div class="ct-shrow"><button type="button" class="ghost" data-a="close">Cancel</button><button type="button" class="go" data-a="rec">● Record</button></div>`;
    res.onclick = e => { const a = e.target.closest('[data-a]'); if (!a) return; if (a.dataset.a === 'close') closeRes(); if (a.dataset.a === 'key') { closeRes(); ctx.openKey('Add a broadcaster voice key (OpenAI or ElevenLabs) and your Shorts get the narration, not just captions.'); } if (a.dataset.a === 'rec') { closeRes(); start(); } };
    root.appendChild(res);
    res.querySelector('[data-a=rec]').focus();
  }
  function closeRes() { if (res) { const v = res.querySelector('video'); if (v) { v.pause(); v.removeAttribute('src'); } res.remove(); res = null; } }

  // ---- recording ----
  async function start() {
    if (cur) return;
    const field = ctx.field(), sim = ctx.sim(), play = ctx.play(), sport = ctx.sport();
    if (!field || !sim || !play) return;
    style();
    const fmt = format(), playKey = ctx.playKey();
    let voice = cloudVoice(playKey);
    // the audio graph first, inside the tap (iOS needs a gesture to start audio)
    const g = graph(); if (g) try { g.ac.resume(); } catch (e) {}
    const c = cur = { ph: 'prep', field, sim, play, sport, fmt, voice, cancel: false, chunks: [], t0: 0, frames: 0, cost: 0, costN: 0, costMax: 0, light: root.classList.contains('ct-light'), narrate: ctx.narrate() };
    c.ui = overlay();
    c.ui.text('Getting it ready', voice ? 'Warming up the voice for every line…' : 'Loading the fonts…');
    keyBlock = e => { if (!cur) return; e.stopImmediatePropagation(); if (e.key === 'Escape') { e.preventDefault(); cancel(); } };
    addEventListener('keydown', keyBlock, true);
    c.vis = () => { if (document.hidden && cur && cur.ph !== 'prep') { cancel(); ctx.toast('Recording stopped: keep the tab open while a Short records.'); } };
    document.addEventListener('visibilitychange', c.vis);
    ctx.narrate(false); hush();   // the board stays quiet; the Short speaks for itself

    const fonts = document.fonts ? Promise.all(['900 80px "Big Shoulders Display"', '700 80px "Big Shoulders Display"', '700 40px "Atkinson Hyperlegible"', '400 40px "Atkinson Hyperlegible"'].map(f => document.fonts.load(f).catch(() => null))) : Promise.resolve();
    c.plan = planNow(voice);
    c.spoken = c.plan.lines.map(l => ctx.spoken(l));
    c.titleLine = play.title + '.';
    let ok = true;
    if (voice) ok = await Promise.race([voiceReady([c.titleLine].concat(c.spoken), playKey).catch(() => false), new Promise(r => setTimeout(() => r(false), 30000))]);
    await fonts;
    if (c !== cur || c.cancel) return;
    if (voice && !ok) { voice = c.voice = false; c.plan = planNow(false); c.voiceFailed = true; ctx.toast('The voice didn’t load, so this Short has captions only.'); }

    // the board becomes a portrait stage under the preview, dark, in its own frame
    root.classList.remove('ct-light'); root.classList.add('ct-shorting');
    field.set({ quality: 'high', maxDpr: 2 });
    sim.playing(false); sim.seek(0); sim.speed(c.plan.speed);
    sim.hold(() => cur === c && c.ph === 'play' && gate(c, performance.now()));
    c.out = document.createElement('canvas'); c.out.width = OUT.w; c.out.height = OUT.h; c.out.className = 'ct-shprev';
    c.g = c.out.getContext('2d', { alpha: false });
    c.bg = backdrop();
    c.ui.preview(c.out);
    c.court = root.querySelector('.ct-court'); c.ink = root.querySelector('.ct-ink'); c.labels = root.querySelector('.ct-labels');
    c.defense = sim.players.some(p => p.side === 'D');
    try { arts(c); } catch (e) { console.error('[chalk-talk] short diagrams', e); }
    c.tokens = c.plan.lines.map(l => captionTokens(l, ctx.nameOf));
    c.capPages = c.tokens.map(t => { c.g.font = capFont(); return pagesOf(wrapTokens(t, s => c.g.measureText(s).width, L.caption.w - L.caption.pad * 2 - 74 * L.u), L.caption.lines); });

    // the stream: the canvas at 30 fps (frames pushed by hand), plus the narration and the chimes
    const vs = c.out.captureStream(0), vt = vs.getVideoTracks()[0];
    c.push = vt && vt.requestFrame ? () => vt.requestFrame() : null;
    if (!c.push) { vs.getTracks().forEach(t => t.stop()); c.stream = c.out.captureStream(OUT.fps); } else c.stream = vs;
    const tracks = c.stream.getVideoTracks().slice();
    if (g) { tracks.push(...g.dest.stream.getAudioTracks()); c.untap = tapCues(g.dest); }
    c.vtracks = c.stream.getVideoTracks();
    try { c.rec = new MediaRecorder(new MediaStream(tracks), { mimeType: fmt.mime, videoBitsPerSecond: 6e6, audioBitsPerSecond: 128e3 }); }
    catch (e) { try { c.rec = new MediaRecorder(new MediaStream(tracks)); } catch (e2) { ctx.toast('This browser can’t record this video.'); finish(c, false); return; } }
    c.rec.ondataavailable = e => { if (e.data && e.data.size) c.chunks.push(e.data); };
    c.rec.onstop = () => done(c);

    // two frames for the stage to lay out, then roll
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (c !== cur || c.cancel) return;
    c.onFrame = () => frame(c, false);
    field.on('frame', c.onFrame);
    c.lastField = 0;
    c.rec.start(1000);
    c.ph = 'title'; c.t0 = c.tPh = performance.now(); c.next = c.t0;
    c.ui.ph('rec');
    if (c.voice) say(c.titleLine, playKey);
    // if the field isn't animating (reduced motion), draw it ourselves each frame
    const watch = () => { if (cur !== c) return; if (performance.now() - c.lastField > 120) { try { field.set({}); } catch (e) {} frame(c, true); } c.raf = requestAnimationFrame(watch); };
    c.raf = requestAnimationFrame(watch);
  }

  // the step's line holds the play at the end of the step: the voice has to finish (or, captions only, there has
  // to be time to read it), never more than 20 s
  function gate(c, now) {
    const el = now - c.lineAt;
    if (el > 20000) return false;
    return c.voice ? speaking() || el < 600 : el < readSec(c.plan.lines[c.line] || '') * 1000;
  }

  function frame(c, fallback) {
    if (cur !== c || c.ph === 'prep' || c.ph === 'done') return;
    const now = performance.now();
    if (!fallback) c.lastField = now;
    advance(c, now);
    if (now < c.next - 6) return;   // 30 fps out of the field's 60
    c.next = Math.max(c.next + 1000 / OUT.fps, now - 1000 / OUT.fps);
    const t0 = performance.now();
    try { compose(c, now); } catch (e) { if (!c.err) { c.err = true; console.error('[chalk-talk] short frame', e); } }
    if (c.push) c.push();
    const ms = performance.now() - t0; c.cost += ms; c.costN++; c.costMax = Math.max(c.costMax, ms); c.frames++;
    if (c.frames % 8 === 0) c.ui.progress(c, now);
  }

  // the timeline: title card → each step (its line said, captioned) → the recap → the end card
  function advance(c, now) {
    const sim = c.sim;
    if (c.ph === 'title' && now - c.tPh >= CARD.title * 1000 && !(c.voice && speaking() && now - c.tPh < 6000)) {
      c.ph = 'play'; c.tPh = now; c.line = -1; sim.seek(0); sim.playing(true);
    }
    if (c.ph === 'play') {
      const k = sim.beatAt();
      if (k !== c.line) {
        if (k >= sim.beats || k < c.line) { c.ph = 'recap'; c.tPh = now; }
        else { c.line = k; c.lineAt = now; c.audioFrom = player ? player.src : ''; if (c.voice) say(c.spoken[k], ctx.playKey()); }
      }
    }
    if (c.ph === 'recap' && now - c.tPh >= CARD.recap * 1000) { c.ph = 'end'; c.tPh = now; sim.playing(false); chime('done'); }
    if (c.ph === 'end' && now - c.tPh >= CARD.end * 1000) { c.ph = 'done'; finish(c, true); }
  }

  // how far through the line the words are: the real audio when there's a voice, else reading pace
  function progress(c, now) {
    const line = c.plan.lines[c.line] || '', el = (now - c.lineAt) / 1000;
    if (!c.voice) return Math.min(1, el / Math.max(0.5, readSec(line) - 0.5));
    if (player && player.src && player.src !== c.audioFrom && player.duration > 0 && isFinite(player.duration)) return player.ended ? 1 : Math.min(1, player.currentTime / player.duration);
    return speaking() ? 0 : el > 0.6 ? 1 : 0;
  }

  // ---- drawing ----
  const capFont = () => `700 ${L.caption.size}px 'Atkinson Hyperlegible', system-ui, sans-serif`;
  const disp = (w, px) => `${w} ${px}px 'Big Shoulders Display', Impact, sans-serif`;
  function backdrop() {
    const b = document.createElement('canvas'); b.width = OUT.w; b.height = OUT.h;
    const g = b.getContext('2d'); g.fillStyle = '#04070c'; g.fillRect(0, 0, OUT.w, OUT.h);
    const glow = (x, y, rx, ry, col) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore(); };
    glow(OUT.w / 2, OUT.h * 0.43, OUT.w * 0.75, OUT.h * 0.36, 'rgba(60, 110, 200, .2)');
    glow(OUT.w / 2, OUT.h * 0.06, OUT.w * 0.5, OUT.h * 0.16, 'rgba(255, 142, 58, .08)');
    // grain, once
    const n = g.getImageData(0, 0, OUT.w, OUT.h), d = n.data;
    for (let i = 0; i < d.length; i += 4) { const v = (Math.random() - 0.5) * 9; d[i] += v; d[i + 1] += v; d[i + 2] += v; }
    g.putImageData(n, 0, 0);
    return b;
  }
  function compose(c, now) {
    const g = c.g, S = OUT.w / STAGE.w;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.shadowBlur = 0;
    g.drawImage(c.bg, 0, 0);
    g.drawImage(c.court, 0, 0, OUT.w, OUT.h);
    g.setTransform(S, 0, 0, S, 0, 0);
    drawSvg(g, c.ink, 1, S);
    drawLabels(g, c.labels, S);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.shadowBlur = 0; g.shadowColor = 'transparent';
    overlayLayer(c, g, now);
  }

  // the ink, redrawn from the live SVG: geometry every frame, styles only when an element's class changes
  const styles = new WeakMap();
  const num = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
  function styleOf(el, key) {
    let s = styles.get(el);
    if (s && s.key === key) return s;
    const cs = getComputedStyle(el), sh = /drop-shadow\((.+?\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px\)/.exec(cs.filter || '') || /drop-shadow\((-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px\s+(.+?\))\)/.exec(cs.filter || '');
    let shadow = null;
    if (sh) shadow = /^-?[\d.]/.test(sh[1]) ? { x: num(sh[1]), y: num(sh[2]), blur: num(sh[3]), color: sh[4] } : { color: sh[1], x: num(sh[2]), y: num(sh[3]), blur: num(sh[4]) };
    const dash = cs.strokeDasharray && cs.strokeDasharray !== 'none' ? cs.strokeDasharray.split(/[\s,]+/).map(num).filter(x => x >= 0) : [];
    s = { key, fill: cs.fill, stroke: cs.stroke, sw: num(cs.strokeWidth) || 1, dash: dash.some(x => x > 0) ? dash : null, op: cs.opacity === '' ? 1 : +cs.opacity, fop: cs.fillOpacity === '' ? 1 : +cs.fillOpacity, sop: cs.strokeOpacity === '' ? 1 : +cs.strokeOpacity,
      hide: cs.display === 'none' || cs.visibility === 'hidden', cap: cs.strokeLinecap || 'butt', join: cs.strokeLinejoin || 'miter', shadow,
      font: [cs.fontStyle === 'italic' ? 'italic' : '', cs.fontWeight, '%SIZE%px', cs.fontFamily].filter(Boolean).join(' '), fs: num(cs.fontSize) || 12, anchor: cs.textAnchor, upper: cs.textTransform === 'uppercase', ls: cs.letterSpacing, strokeFirst: /^stroke/.test(cs.paintOrder || '') };
    styles.set(el, s);
    return s;
  }
  const paint = v => v && v !== 'none' && !/^url\(/.test(v) && !/rgba\(0, 0, 0, 0\)|transparent/.test(v);
  function drawSvg(g, node, alpha, S) {
    const svgKey = node.getAttribute('class') || '';
    for (let el = node.firstElementChild; el; el = el.nextElementSibling) drawEl(g, el, alpha, S, svgKey);
  }
  function drawEl(g, el, alpha, S, svgKey) {
    const tag = el.tagName, cls = el.getAttribute('class') || '';
    if (/\bhot\b/.test(cls)) return;
    if (el.getAttribute('visibility') === 'hidden' || el.getAttribute('display') === 'none') return;
    const s = styleOf(el, cls + '|' + svgKey);
    if (s.hide) return;
    const opA = el.getAttribute('opacity'), a = alpha * s.op * (opA != null ? num(opA) : 1);
    if (a <= 0.003) return;
    if (tag === 'g') {
      const tr = el.getAttribute('transform');
      if (tr) { g.save(); const m = /translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)/.exec(tr), r = /rotate\(\s*(-?[\d.]+)/.exec(tr); if (m) g.translate(+m[1], +m[2]); if (r) g.rotate(+r[1] * Math.PI / 180); }
      for (let k = el.firstElementChild; k; k = k.nextElementSibling) drawEl(g, k, a, S, svgKey);
      if (tr) g.restore();
      return;
    }
    let shape = null;
    if (tag === 'path') { const d = el.getAttribute('d'); if (!d) return; shape = new Path2D(d); }
    else if (tag === 'circle') { const r = num(el.getAttribute('r')); if (r <= 0) return; shape = new Path2D(); shape.arc(num(el.getAttribute('cx')), num(el.getAttribute('cy')), r, 0, Math.PI * 2); }
    else if (tag === 'ellipse') { const rx = num(el.getAttribute('rx')), ry = num(el.getAttribute('ry')); if (rx <= 0 || ry <= 0) return; shape = new Path2D(); shape.ellipse(num(el.getAttribute('cx')), num(el.getAttribute('cy')), rx, ry, 0, 0, Math.PI * 2); }
    else if (tag === 'text') { drawText(g, el, s, a, S); return; }
    else return;
    const swA = el.getAttribute('stroke-width'), sw = swA != null ? num(swA) : s.sw;
    if (s.shadow) { g.shadowColor = s.shadow.color; g.shadowBlur = s.shadow.blur * S; g.shadowOffsetX = s.shadow.x * S; g.shadowOffsetY = s.shadow.y * S; }
    if (paint(s.fill)) { g.globalAlpha = a * s.fop; g.fillStyle = s.fill; g.fill(shape); }
    if (paint(s.stroke) && sw > 0) {
      g.globalAlpha = a * s.sop; g.strokeStyle = s.stroke; g.lineWidth = sw; g.lineCap = s.cap; g.lineJoin = s.join; g.setLineDash(s.dash || []); g.stroke(shape);
    }
    if (s.shadow) { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = g.shadowOffsetY = 0; }
  }
  function drawText(g, el, s, a, S) {
    let t = el.textContent; if (!t) return; if (s.upper) t = t.toUpperCase();
    const fsA = el.getAttribute('font-size'), fs = fsA != null ? num(fsA) : s.fs;
    g.font = s.font.replace('%SIZE%', fs.toFixed(1));
    g.textAlign = s.anchor === 'middle' ? 'center' : s.anchor === 'end' ? 'right' : 'left'; g.textBaseline = 'middle';
    if ('letterSpacing' in g) g.letterSpacing = s.ls && s.ls !== 'normal' ? s.ls : '0px';
    const x = num(el.getAttribute('x')), y = num(el.getAttribute('y'));
    const st = () => { if (paint(s.stroke) && s.sw > 0) { g.globalAlpha = a * s.sop; g.strokeStyle = s.stroke; g.lineWidth = s.sw; g.lineJoin = 'round'; g.setLineDash([]); g.strokeText(t, x, y); } };
    const fi = () => { if (paint(s.fill)) { g.globalAlpha = a * s.fop; g.fillStyle = s.fill; g.fillText(t, x, y); } };
    if (s.strokeFirst) { st(); fi(); } else { fi(); st(); }
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  }
  // the role / name tags under the marks and the players' thought bubbles (HTML on the board)
  const xy = el => { const m = /translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(el.style.transform || ''); return m ? [+m[1], +m[2]] : null; };
  function drawLabels(g, box, S) {
    for (let el = box.firstElementChild; el; el = el.nextElementSibling) {
      const think = el.classList.contains('ct-think');
      if (think ? !el.classList.contains('on') : el.classList.contains('empty') && !el.classList.contains('read')) continue;
      const p = xy(el), t = el.textContent.trim(); if (!p || !t) continue;
      const s = labelStyle(el), text = s.upper ? t.toUpperCase() : t;
      g.font = s.font; if ('letterSpacing' in g) g.letterSpacing = s.ls;
      g.textBaseline = 'middle'; g.textAlign = 'center';
      if (think) {
        const lines = wrapTokens(wordsOf(text).map(w => ({ t: w })), q => g.measureText(q).width, 170).map(l => l.map(i => wordsOf(text)[i]).join(' '));
        const lh = s.fs * 1.3, w = Math.max(...lines.map(l => g.measureText(l).width)) + 18, h = lines.length * lh + 10;
        g.globalAlpha = 1; g.fillStyle = s.bg; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 20 * S / 2;
        g.beginPath(); g.roundRect(p[0] - w / 2, p[1] - h, w, h, [10, 10, 10, 2]); g.fill(); g.shadowBlur = 0; g.shadowColor = 'transparent';
        g.fillStyle = s.color; lines.forEach((l, i) => g.fillText(l, p[0], p[1] - h + 5 + lh * (i + 0.5)));
      } else {
        const w = g.measureText(text).width + 14, h = s.fs + 8;
        g.globalAlpha = 1; g.fillStyle = s.bg; g.beginPath(); g.roundRect(p[0] - w / 2, p[1], w, h, 6); g.fill();
        if (paint(s.border)) { g.strokeStyle = s.border; g.lineWidth = 1; g.setLineDash([]); g.stroke(); }
        g.fillStyle = s.color; g.fillText(text, p[0], p[1] + h / 2 + 0.5);
      }
      if ('letterSpacing' in g) g.letterSpacing = '0px';
    }
  }
  function labelStyle(el) {
    const key = el.className;
    let s = styles.get(el); if (s && s.key === key) return s;
    const cs = getComputedStyle(el);
    s = { key, bg: cs.backgroundColor, border: cs.borderTopColor, color: cs.color, font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, fs: num(cs.fontSize) || 11, upper: cs.textTransform === 'uppercase', ls: cs.letterSpacing && cs.letterSpacing !== 'normal' ? cs.letterSpacing : '0px' };
    styles.set(el, s); return s;
  }

  // the broadcast layer: wordmark, step counter, play name, captions, title and end cards
  const ease = x => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
  function wordmark(g, x, y, size, align) {
    g.font = disp(900, size); g.textBaseline = 'alphabetic'; if ('letterSpacing' in g) g.letterSpacing = (size * 0.06).toFixed(1) + 'px';
    const w1 = g.measureText('CHALK ').width, w2 = g.measureText('TALK').width, x0 = align === 'center' ? x - (w1 + w2) / 2 : x;
    g.textAlign = 'left'; g.fillStyle = '#eef4ff'; g.fillText('CHALK ', x0, y); g.fillStyle = '#ff8e3a'; g.fillText('TALK', x0 + w1, y);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  }
  function fitText(g, text, font, size, maxW, min) { let s = size; g.font = font(s); while (s > min && g.measureText(text).width > maxW) { s -= 4; g.font = font(s); } return s; }
  function overlayLayer(c, g, now) {
    const play = c.play, sport = c.sport, n = c.sim.beats, ph = c.ph, u = L.u;
    const sinceTitle = c.ph === 'title' ? 0 : now - (c.playAt || (c.playAt = now));
    // chrome, on through the play: wordmark, step counter, the play's name
    const chromeA = ph === 'title' ? 0 : ph === 'end' ? 1 - ease((now - c.tPh) / 350) : ease(sinceTitle / 400);
    if (chromeA > 0) {
      g.globalAlpha = chromeA * 0.92; wordmark(g, L.mark.x, L.mark.y, L.mark.size, 'left');
      const k = ph === 'play' ? Math.max(0, c.line) + 1 : n;
      g.globalAlpha = chromeA; g.font = disp(700, L.counter.size); g.textAlign = 'right'; g.fillStyle = '#8a9bb5';
      if ('letterSpacing' in g) g.letterSpacing = '3px';
      g.fillText(`STEP ${k} / ${n}`, L.counter.x, L.counter.y);
      if ('letterSpacing' in g) g.letterSpacing = '0px';
      const dw = 18 * u, gap = 8 * u, dy = L.counter.y + 22 * u;
      for (let i = 0; i < n; i++) { const x = L.counter.x - (n - i) * (dw + gap) + gap; g.fillStyle = i < k - 1 ? 'rgba(255,142,58,.55)' : i === k - 1 ? '#ff8e3a' : 'rgba(140,188,255,.22)'; g.beginPath(); g.roundRect(x, dy, dw, 6 * u, 3 * u); g.fill(); }
      const eb = ((play.concept || 'Play') + ' · ' + sport.short).toUpperCase();
      g.textAlign = 'left'; g.fillStyle = '#ff8e3a'; if ('letterSpacing' in g) g.letterSpacing = '4px';
      fitText(g, eb, s => disp(700, s), L.head.eyebrow, L.head.w, 18 * u);
      g.fillText(eb, L.head.x, L.head.y);
      if ('letterSpacing' in g) g.letterSpacing = '0px';
      const ts = fitText(g, play.title.toUpperCase(), s => disp(900, s), L.head.title, L.head.w, 44 * u);
      g.fillStyle = '#eef4ff'; g.fillText(play.title.toUpperCase(), L.head.x, L.head.y + ts * 0.95);
    }
    // captions
    if (ph === 'play' && c.line >= 0) caption(c, g, now, chromeA);
    if (ph === 'recap') captionText(g, '✓', 'That’s the play.', 1, '#ff8e3a');
    diagrams(c, g, now, ph === 'play' ? chromeA : ph === 'recap' ? 1 : ph === 'end' ? chromeA : 0);
    // the title card
    const titleA = ph === 'title' ? 1 : ph === 'play' ? 1 - ease(sinceTitle / 300) : 0;
    if (titleA > 0) titleCard(c, g, now, titleA);
    if (ph === 'end') endCard(c, g, ease((now - c.tPh) / 450));
    g.globalAlpha = 1;
  }
  // the caption panel hugs its lines (one to three), hanging from the same top edge
  function captionBox(g, a, lines) {
    const C = L.caption, h = C.h;
    g.globalAlpha = a; g.fillStyle = 'rgba(8, 14, 26, .74)'; g.beginPath(); g.roundRect(C.x, C.y, C.w, h, 30 * L.u); g.fill();
    g.strokeStyle = 'rgba(140, 188, 255, .22)'; g.lineWidth = 2; g.stroke();
    g.strokeStyle = 'rgba(255, 255, 255, .1)'; g.beginPath(); g.moveTo(C.x + 30 * L.u, C.y + 1.5); g.lineTo(C.x + C.w - 30 * L.u, C.y + 1.5); g.stroke();
  }
  function badge(g, txt, bg) {
    const C = L.caption, r = 26 * L.u, x = C.x + C.pad + r, y = C.y + C.h / 2;
    g.fillStyle = bg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#04070c'; g.font = disp(900, 32 * L.u); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, x, y + 1);
  }
  function captionText(g, b, text, a, bg) {
    const C = L.caption; captionBox(g, a, 1); badge(g, b, bg);
    g.font = capFont(); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#eef4ff';
    g.fillText(text, C.x + C.pad + 74 * L.u, C.y + C.h / 2);
  }
  function caption(c, g, now, a) {
    const C = L.caption, tokens = c.tokens[c.line] || [], pages = c.capPages[c.line] || [];
    const p = progress(c, now), wi = wordAt(tokens, p);
    let pi = pages.findIndex(pg => pg[pg.length - 1][pg[pg.length - 1].length - 1] >= Math.min(wi, tokens.length - 1)); if (pi < 0) pi = pages.length - 1;
    captionBox(g, a, Math.max(...pages.map(p => p.length), 1)); badge(g, String(c.line + 1), '#eef4ff');
    g.font = capFont(); g.textAlign = 'left'; g.textBaseline = 'middle';
    const x0 = C.x + C.pad + 74 * L.u, sp = g.measureText(' ').width, pg = pages[pi] || [];
    const pageIn = c.pageAt && c.pageAt.line === c.line && c.pageAt.pi === pi ? ease((now - c.pageAt.t) / 220) : (c.pageAt = { line: c.line, pi, t: now }, 0);
    pg.forEach((ln, li) => {
      let x = x0; const y = C.y + C.pad + C.line * (li + 0.5 + (C.lines - pg.length) / 2) + (1 - pageIn) * 10 * L.u;
      ln.forEach(i => {
        const tk = tokens[i], w = g.measureText(tk.t).width, said = i < wi, now2 = i === wi;
        if (now2) { g.globalAlpha = a; g.fillStyle = 'rgba(255, 142, 58, .9)'; g.beginPath(); g.roundRect(x - 6 * L.u, y - C.size * 0.62, w + 12 * L.u, C.size * 1.24, 10 * L.u); g.fill(); }
        g.globalAlpha = a * pageIn * (said || now2 ? 1 : 0.42);
        g.fillStyle = now2 ? '#04070c' : tk.side === 'O' ? '#ff8e3a' : tk.side === 'X' ? '#a9d4ff' : '#eef4ff';
        g.fillText(tk.t, x, y); x += w + sp;
      });
    });
    g.globalAlpha = 1;
  }
  function titleCard(c, g, now, a) {
    const play = c.play, u = L.u, t = (now - c.t0) / 1000, cx = OUT.w * (SAFE.left + SAFE.right) / 2, mid = OUT.h * 0.4;
    g.globalAlpha = a * 0.78; g.fillStyle = '#04070c'; g.fillRect(0, 0, OUT.w, OUT.h);
    const gr = g.createRadialGradient(cx, mid, 0, cx, mid, OUT.w * 0.7); gr.addColorStop(0, 'rgba(255, 142, 58, .16)'); gr.addColorStop(1, 'rgba(255, 142, 58, 0)');
    g.globalAlpha = a; g.fillStyle = gr; g.fillRect(0, 0, OUT.w, OUT.h);
    const k = ease(t / 0.45), maxW = OUT.w * (SAFE.right - SAFE.left);
    g.globalAlpha = a * k; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const eb = ((play.concept || 'Play') + ' · ' + c.sport.name).toUpperCase();
    if ('letterSpacing' in g) g.letterSpacing = '8px';
    fitText(g, eb, s => disp(700, s), L.card2.eyebrow, maxW, 22 * u); g.fillStyle = '#ff8e3a';
    g.fillText(eb, cx, mid - 140 * u + (1 - k) * 20);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    // the name, one or two lines, as big as fits
    const words = play.title.toUpperCase().split(/\s+/);
    let lines = [words.join(' ')], size = L.card2.title;
    g.font = disp(900, size);
    if (g.measureText(lines[0]).width > maxW && words.length > 1) { const h = Math.ceil(words.length / 2); lines = [words.slice(0, h).join(' '), words.slice(h).join(' ')]; }
    while (size > 70 * u && Math.max(...lines.map(l => g.measureText(l).width)) > maxW) { size -= 6; g.font = disp(900, size); }
    g.fillStyle = '#eef4ff'; g.shadowColor = 'rgba(255, 142, 58, .45)'; g.shadowBlur = 40;
    lines.forEach((l, i) => g.fillText(l, cx, mid + (i - (lines.length - 1) / 2) * size * 0.95 + size * 0.32 + (1 - k) * 40));
    g.shadowBlur = 0; g.shadowColor = 'transparent';
    const lw = 160 * u * ease((t - 0.15) / 0.5); g.fillStyle = '#ff8e3a'; g.fillRect(cx - lw / 2, mid + lines.length * size * 0.55 + 30 * u, lw, 6 * u);
    g.globalAlpha = a * k * 0.9; wordmark(g, cx, mid + lines.length * size * 0.55 + 120 * u, 42 * u, 'center');
    g.globalAlpha = 1;
  }
  function endCard(c, g, a) {
    const u = L.u, cx = OUT.w * (SAFE.left + SAFE.right) / 2, mid = OUT.h * 0.42;
    g.globalAlpha = a * 0.86; g.fillStyle = '#04070c'; g.fillRect(0, 0, OUT.w, OUT.h);
    const gr = g.createRadialGradient(cx, mid, 0, cx, mid, OUT.w * 0.8); gr.addColorStop(0, 'rgba(60, 110, 200, .22)'); gr.addColorStop(1, 'rgba(60, 110, 200, 0)');
    g.globalAlpha = a; g.fillStyle = gr; g.fillRect(0, 0, OUT.w, OUT.h);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    wordmark(g, cx, mid - 230 * u, 48 * u, 'center');
    g.textAlign = 'center';
    g.fillStyle = '#eef4ff'; g.font = disp(900, L.card2.cta); g.shadowColor = 'rgba(140, 188, 255, .45)'; g.shadowBlur = 40;
    g.fillText('DRAW YOURS', cx, mid + (1 - a) * 30); g.shadowBlur = 0; g.shadowColor = 'transparent';
    const url = 'mutaafaziz.com/chalktalk'; g.font = `700 ${L.card2.url}px 'Atkinson Hyperlegible', system-ui, sans-serif`;
    const w = g.measureText(url).width + 64 * u, h = L.card2.url * 1.9, y = mid + 70 * u;
    g.fillStyle = '#ff8e3a'; g.beginPath(); g.roundRect(cx - w / 2, y, w, h, h / 2); g.fill();
    g.fillStyle = '#04070c'; g.textBaseline = 'middle'; g.fillText(url, cx, y + h / 2 + 2);
    g.fillStyle = '#8a9bb5'; g.font = `400 ${36 * u}px 'Atkinson Hyperlegible', system-ui, sans-serif`; g.fillText('Say the play. Watch it draw.', cx, y + h + 70 * u);
    // the whole play once more, under the link: the screenshot people pause on
    if (c.bigAll) {
      const art = c.bigAll, top = y + h + 120 * u, room = OUT.h * 0.97 - top, k = Math.min(1.5, room / art.height, (OUT.w * 0.7) / art.width), w = art.width * k, h2 = art.height * k, x = cx - w / 2;
      panel(g, x, top + (1 - a) * 30 * u, w, h2, 26 * u, a, false);
      g.save(); g.beginPath(); g.roundRect(x, top + (1 - a) * 30 * u, w, h2, 26 * u); g.clip(); g.globalAlpha = a; g.drawImage(art, x, top + (1 - a) * 30 * u, w, h2); g.restore();
    }
    g.globalAlpha = 1;
  }

  // ---- the chalk diagrams: drawn once per Short, top-down like the playbook (src/playbook.js), in light ----
  // focus: the step that's lit (null = every step); all: every step's routes (the others faint), else just focus
  function stepArt(c, focus, all, w, h) {
    const sport = c.sport, sim = c.sim, play = sim.play, U = sport.mark, pad = U * 1.8;
    const [x0, y0, x1, y1] = diagramFrame(sport, play), fw = x1 - x0 + pad * 2, fh = y1 - y0 + pad * 2, s = Math.min(w / fw, h / fh);
    const cv = document.createElement('canvas'); cv.width = Math.round(w); cv.height = Math.round(h);
    const g = cv.getContext('2d');
    g.translate((w - fw * s) / 2 + (pad - x0) * s, (h - fh * s) / 2 + (pad - y0) * s); g.scale(s, s);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const poly = pts => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); };
    for (const l of sport.field.lines({ los: play.los })) {
      if (!l.p || l.p.length < 2) continue;
      poly(l.p); g.globalAlpha = 1; g.strokeStyle = l.hot ? 'rgba(238, 244, 255, .5)' : l.warm ? 'rgba(255, 142, 58, .55)' : 'rgba(140, 188, 255, .28)';
      g.lineWidth = 0.1 + (l.w || 1) * 0.1; g.setLineDash(l.dots ? [0.5, 0.6] : []); g.stroke();
    }
    g.setLineDash([]);
    const k0 = focus == null ? 0 : focus, tags = [];
    sim.routes.forEach(r => {
      if (r.auto || (r.side === 'D' && !c.defense)) return;
      const lit = focus == null || r.beat === focus;
      if (!lit && (!all || r.side === 'D')) return;
      const a = lit ? 1 : r.beat < focus ? 0.3 : 0.13, pts = r.pts;
      g.globalAlpha = a; g.shadowColor = 'transparent'; g.shadowBlur = 0;
      if (r.side === 'D') { g.strokeStyle = '#a9d4ff'; g.lineWidth = 0.28; g.globalAlpha = a * 0.7; }
      else if (r.dashed) { g.strokeStyle = '#eef4ff'; g.lineWidth = 0.4; g.setLineDash([0.9, 0.7]); }
      else { g.strokeStyle = '#ff8e3a'; g.lineWidth = 0.45; if (lit) { g.shadowColor = 'rgba(255, 142, 58, .7)'; g.shadowBlur = 6; } }
      poly(pts); g.stroke(); g.setLineDash([]); g.shadowBlur = 0;
      if (r.dashed && pts.length > 1) {   // a pass ends in an arrowhead
        const e = pts[pts.length - 1], q = pts[Math.max(0, pts.length - 4)], L2 = Math.hypot(e[0] - q[0], e[1] - q[1]) || 1, dx = (e[0] - q[0]) / L2, dy = (e[1] - q[1]) / L2, hs = U * 0.6;
        g.fillStyle = '#eef4ff'; g.beginPath(); g.moveTo(e[0], e[1]); g.lineTo(e[0] - dx * hs - dy * hs * 0.6, e[1] - dy * hs + dx * hs * 0.6); g.lineTo(e[0] - dx * hs + dy * hs * 0.6, e[1] - dy * hs - dx * hs * 0.6); g.fill();
      }
      if (all && r.side === 'O' && pts.length > 1) { const m = pts[Math.floor(pts.length * (r.dashed ? 0.5 : 0.4))]; tags.push([m, r.beat, a]); }
    });
    const P = sim.posAt(Math.min(sim.beats - 0.001, k0 + 0.001)), holder = sim.holderAt(k0 + 0.01);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    sim.players.forEach((p, i) => {
      if (p.side === 'D' && !c.defense) return;
      const [x, y] = P[i], label = String(sport.notation.inside(p)); g.globalAlpha = 1;
      if (sport.notation.shape(p) === 'x') { const r = 0.65 * U; g.strokeStyle = '#a9d4ff'; g.lineWidth = 0.32; g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x + r, y + r); g.moveTo(x - r, y + r); g.lineTo(x + r, y - r); g.stroke(); return; }
      const ball = i === holder;
      g.fillStyle = ball ? '#ff8e3a' : '#0b1220'; g.strokeStyle = '#ff8e3a'; g.lineWidth = 0.3;
      g.beginPath(); g.arc(x, y, U * 0.9, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = ball ? '#04070c' : '#eef4ff'; g.font = `700 ${(label.length > 1 ? 0.85 : 1.15) * U}px 'Atkinson Hyperlegible', system-ui, sans-serif`; g.fillText(label, x, y + U * 0.05);
    });
    tags.forEach(([m, b, a]) => {   // the step numbers, on their routes
      g.globalAlpha = Math.max(a, 0.5); g.fillStyle = b === focus ? '#ff8e3a' : '#1a2438'; g.beginPath(); g.arc(m[0], m[1], U * 0.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = b === focus ? '#04070c' : '#c7d6ee'; g.font = `700 ${U * 0.8}px 'Atkinson Hyperlegible', system-ui, sans-serif`; g.fillText(String(b + 1), m[0], m[1] + U * 0.04);
    });
    return cv;
  }
  // the Short's diagrams: the big one (the whole play, each step lit in turn, all lit for the recap) and the
  // steps in a grid beside it, laid out as big as the frame allows
  function arts(c) {
    const n = c.sim.beats, A = L.art, [x0, y0, x1, y1] = diagramFrame(c.sport, c.sim.play), pad = c.sport.mark * 3.6;
    const aspect = (x1 - x0 + pad) / (y1 - y0 + pad), bh = A.h, bw = Math.min(bh * aspect, A.w * 0.5);
    const gx = A.x + bw + A.gap * 1.5, gw = A.x + A.w - gx;
    let best = null;
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols), tw = Math.min((gw - (cols - 1) * A.gap) / cols, ((bh - (rows - 1) * A.gap) / rows) * aspect);
      if (!best || tw > best.tw) best = { cols, rows, tw };
    }
    const tw = best.tw, th = tw / aspect, gridH = best.rows * th + (best.rows - 1) * A.gap;
    c.big = { x: A.x, y: A.y, w: bw, h: bh };
    c.grid = { x: gx + (gw - (best.cols * tw + (best.cols - 1) * A.gap)) / 2, y: A.y + (bh - gridH) / 2, cols: best.cols, w: tw, h: th };
    c.bigArt = Array.from({ length: n }, (_, k) => stepArt(c, k, true, bw, bh));
    c.bigAll = stepArt(c, null, true, bw, bh);
    c.thumbs = Array.from({ length: n }, (_, k) => stepArt(c, k, false, tw, th));
    c.chips = Array.from({ length: n }, (_, k) => stepChips(c.sim.play, k, ctx.nameOf, c.defense));
    c.recapChips = recapChips(c.sim.play);
  }
  function panel(g, x, y, w, h, r, a, lit) {
    g.globalAlpha = a; g.fillStyle = 'rgba(8, 14, 26, .74)'; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
    g.strokeStyle = lit ? 'rgba(255, 142, 58, .9)' : 'rgba(140, 188, 255, .22)'; g.lineWidth = lit ? 3 : 2; g.stroke();
  }
  // a chip's little diagram, in a box s wide at (x, y)
  function icon(g, kind, x, y, s, a) {
    g.save(); g.translate(x, y); g.scale(s / 40, s / 40); g.globalAlpha = a; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 3.4;
    const O = '#ff8e3a', W = '#eef4ff', I = '#a9d4ff', head = (x2, y2, ang, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 9 * Math.cos(ang - 0.5), y2 - 9 * Math.sin(ang - 0.5)); g.lineTo(x2 - 9 * Math.cos(ang + 0.5), y2 - 9 * Math.sin(ang + 0.5)); g.fill(); };
    g.strokeStyle = O; g.beginPath();
    if (kind === 'pass') { g.strokeStyle = W; g.setLineDash([5, 5]); g.moveTo(4, 30); g.lineTo(31, 11); g.stroke(); g.setLineDash([]); head(36, 8, Math.atan2(-19, 27), W); }
    else if (kind === 'dribble') { g.moveTo(4, 32); for (let i = 1; i <= 6; i++) g.lineTo(4 + i * 4.5, 32 - i * 3.6 + (i % 2 ? -5 : 5)); g.stroke(); head(36, 7, Math.atan2(-14, 8), O); }
    else if (kind === 'screen') { g.moveTo(8, 34); g.quadraticCurveTo(10, 16, 22, 12); g.stroke(); g.beginPath(); g.moveTo(14, 5); g.lineTo(30, 19); g.lineWidth = 4.4; g.stroke(); }
    else if (kind === 'handoff') { g.moveTo(4, 26); g.lineTo(18, 20); g.stroke(); g.beginPath(); g.moveTo(36, 30); g.lineTo(22, 16); g.stroke(); g.fillStyle = O; g.beginPath(); g.arc(20, 18, 4.5, 0, Math.PI * 2); g.fill(); head(36, 6, -Math.PI / 2.4, O); g.beginPath(); g.moveTo(22, 16); g.quadraticCurveTo(30, 12, 34, 9); g.stroke(); }
    else if (kind === 'shot') { g.strokeStyle = W; g.setLineDash([4, 4]); g.moveTo(5, 34); g.quadraticCurveTo(14, -2, 28, 14); g.stroke(); g.setLineDash([]); g.strokeStyle = O; g.beginPath(); g.ellipse(31, 17, 6, 2.5, 0, 0, Math.PI * 2); g.stroke(); }
    else if (kind === 'def') { g.strokeStyle = I; g.moveTo(5, 8); g.lineTo(17, 20); g.moveTo(17, 8); g.lineTo(5, 20); g.stroke(); g.beginPath(); g.moveTo(14, 28); g.lineTo(31, 28); g.stroke(); head(36, 28, 0, I); }
    else if (kind === 'more') { g.fillStyle = W; [10, 20, 30].forEach(cx => { g.beginPath(); g.arc(cx, 20, 3, 0, Math.PI * 2); g.fill(); }); }
    else { g.moveTo(5, 34); g.bezierCurveTo(8, 18, 18, 22, 30, 10); g.stroke(); head(35, 6, Math.atan2(-4, 5), O); }
    g.restore();
  }
  // a chip: its little diagram, the action, who; returns its width
  function chipW(g, chip, h) {
    g.font = disp(700, L.chips.word); if ('letterSpacing' in g) g.letterSpacing = '2px';
    const ww = g.measureText(chip.word).width; if ('letterSpacing' in g) g.letterSpacing = '0px';
    g.font = `700 ${32 * L.u}px 'Atkinson Hyperlegible', system-ui, sans-serif`;
    return h * 0.3 + h * 0.66 + 12 * L.u + ww + 12 * L.u + g.measureText(chip.text).width + h * 0.42;
  }
  function chip(g, chip, x, y, w, h, a) {
    panel(g, x, y, w, h, h / 2, a * 0.95, false);
    const s = h * 0.66; icon(g, chip.icon, x + h * 0.3, y + (h - s) / 2, s, a);
    let tx = x + h * 0.3 + s + 12 * L.u; g.globalAlpha = a; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = disp(700, L.chips.word); if ('letterSpacing' in g) g.letterSpacing = '2px';
    g.fillStyle = chip.side === 'D' ? '#a9d4ff' : '#ff8e3a'; g.fillText(chip.word, tx, y + h / 2 + 1);
    tx += g.measureText(chip.word).width + 12 * L.u; if ('letterSpacing' in g) g.letterSpacing = '0px';
    g.font = `700 ${32 * L.u}px 'Atkinson Hyperlegible', system-ui, sans-serif`; g.fillStyle = '#eef4ff'; g.fillText(chip.text, tx, y + h / 2 + 1);
  }
  // under the captions: the step's chips; below them the whole play (this step lit) and every step
  function diagrams(c, g, now, a) {
    if (!c.bigArt || a <= 0) return;
    const u = L.u, recap = c.ph === 'recap' || c.ph === 'end', k = recap ? -1 : Math.max(0, c.line);
    const since = recap ? now - c.tPh : now - (c.lineAt || now), lit = ease(since / 380);
    // the chips, sliding in one after another, shrunk together if they'd run past the safe zone
    const C = L.chips, list = recap ? c.recapChips : c.chips[k] || [];
    if (list.length) {
      const ws = list.map(ch => chipW(g, ch, C.h)), total = ws.reduce((p, q) => p + q, 0) + C.gap * (list.length - 1), f = Math.min(1, C.w / total);
      let x = C.x;
      list.forEach((ch, i) => { const e = ease((since - 120 - i * 110) / 320), w = ws[i] * f; if (e > 0) { g.save(); if (f < 1) { g.translate(x, C.y + C.h / 2); g.scale(f, f); g.translate(-x, -(C.y + C.h / 2)); } chip(g, ch, x + (1 - e) * 30 * u, C.y, ws[i], C.h, a * e); g.restore(); } x += w + C.gap; });
    } else { g.globalAlpha = a * 0.75; g.font = disp(700, C.word); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#8a9bb5'; if ('letterSpacing' in g) g.letterSpacing = '3px'; g.fillText('SET UP · READ THE DEFENSE', C.x + 6 * u, C.y + C.h / 2); if ('letterSpacing' in g) g.letterSpacing = '0px'; }
    // the whole play, this step lit (a cross-fade from the last one)
    const B = c.big, r = 26 * u;
    panel(g, B.x, B.y, B.w, B.h, r, a, false);
    g.save(); g.beginPath(); g.roundRect(B.x, B.y, B.w, B.h, r); g.clip();
    const art = recap ? c.bigAll : c.bigArt[k], prev = recap ? c.bigArt[c.bigArt.length - 1] : c.bigArt[k - 1];
    if (prev && lit < 1) { g.globalAlpha = a * (1 - lit); g.drawImage(prev, B.x, B.y); }
    g.globalAlpha = a * (prev ? lit : 1); g.drawImage(art, B.x, B.y);
    g.restore();
    g.globalAlpha = a * 0.85; g.font = disp(700, 24 * u); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#8a9bb5';
    if ('letterSpacing' in g) g.letterSpacing = '3px'; g.fillText('THE WHOLE PLAY', B.x + 18 * u, B.y + B.h - 16 * u); if ('letterSpacing' in g) g.letterSpacing = '0px';
    // every step: the one playing now lit and lifted, the ones done checked
    const G = c.grid;
    c.thumbs.forEach((t, i) => {
      const on = i === k, done = recap || i < k, x = G.x + (i % G.cols) * (G.w + L.art.gap), y = G.y + Math.floor(i / G.cols) * (G.h + L.art.gap), lift = on ? ease(since / 300) * 8 * u : 0;
      panel(g, x, y - lift, G.w, G.h, 16 * u, a * (on ? 1 : done ? 0.8 : 0.55), on);
      g.globalAlpha = a * (on ? 1 : done ? 0.6 : 0.3); g.drawImage(t, x, y - lift);
      const rr = Math.max(12 * u, Math.min(20 * u, G.w * 0.11)); g.globalAlpha = a * (on || done ? 1 : 0.55);
      g.fillStyle = on ? '#ff8e3a' : done ? 'rgba(255, 142, 58, .55)' : 'rgba(140, 188, 255, .3)'; g.beginPath(); g.arc(x + rr + 8 * u, y - lift + rr + 8 * u, rr, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#04070c'; g.font = disp(900, rr * 1.3); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(done && !on ? '✓' : String(i + 1), x + rr + 8 * u, y - lift + rr + 9 * u);
    });
    g.globalAlpha = 1;
  }

  // ---- the overlay while it records ----
  function overlay() {
    const o = document.createElement('div'); o.className = 'ct-shorts'; o.dataset.ph = 'prep'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Recording a Short');
    o.innerHTML = `<div class="ct-shbar"><span class="ct-shorb"><i></i><i></i></span><div class="ct-shtxt"><b data-s="t"></b><small data-s="s"></small><div class="ct-shtrack"><i data-s="bar"></i></div></div><button type="button" data-s="x">Cancel</button></div>`;
    root.appendChild(o);
    const q = s => o.querySelector(`[data-s=${s}]`);
    q('x').onclick = () => cancel();
    let prev = null;
    const place = () => {
      if (!prev) return;
      const bar = o.querySelector('.ct-shbar'), avH = o.clientHeight - bar.offsetHeight - 42, avW = o.clientWidth - 24;
      let h = Math.max(160, avH), w = h * 9 / 16; if (w > avW) { w = avW; h = w * 16 / 9; }
      prev.style.width = w + 'px'; prev.style.height = h + 'px'; prev.style.left = (o.clientWidth - w) / 2 + 'px'; prev.style.top = Math.max(12, (avH - h) / 2 + 14) + 'px';
    };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null; if (ro) ro.observe(o);
    return {
      el: o,
      text(t, s) { q('t').textContent = t; q('s').textContent = s; },
      ph(p) { o.dataset.ph = p; },
      preview(cv) { prev = cv; o.insertBefore(cv, o.firstChild); place(); },
      progress(c, now) {
        const el = (now - c.t0) / 1000, total = Math.max(c.plan.total, el + (c.ph === 'end' ? 0 : 1));
        const k = c.ph === 'play' ? Math.max(0, c.line) + 1 : c.ph === 'title' ? 0 : c.sim.beats;
        this.text(c.ph === 'end' ? 'Finishing your Short' : 'Recording your Short', `${c.ph === 'title' ? 'Title card' : c.ph === 'end' ? 'End card' : 'Step ' + k + ' of ' + c.sim.beats} · ${clock(el)} of ~${clock(total)}`);
        q('bar').style.width = Math.min(100, el / total * 100).toFixed(1) + '%';
      },
      remove() { if (ro) ro.disconnect(); o.remove(); }
    };
  }

  function cancel() { const c = cur; if (!c) return; c.cancel = true; finish(c, false); }
  function finish(c, keep) {
    if (c.finished) return; c.finished = true; c.keep = keep; c.lastT = performance.now();
    if (c.rec && c.rec.state !== 'inactive') { try { c.rec.stop(); } catch (e) { done(c); } } else done(c);
    restore(c);
  }
  // the board is back the moment recording ends, whatever happens next
  function restore(c) {
    if (cur === c) cur = null;
    cancelAnimationFrame(c.raf);
    if (c.onFrame) c.field.off('frame', c.onFrame);
    if (keyBlock) { removeEventListener('keydown', keyBlock, true); keyBlock = null; }
    document.removeEventListener('visibilitychange', c.vis);
    if (c.untap) c.untap();
    if (c.vtracks) c.vtracks.forEach(t => t.stop());
    hush();
    root.classList.remove('ct-shorting'); if (c.light) root.classList.add('ct-light');
    try { c.field.set({ quality: 'auto', maxDpr: 2 }); } catch (e) {}
    ctx.narrate(c.narrate);
    const sim = ctx.sim();
    if (sim === c.sim) { sim.hold(ctx.hold); sim.speed(ctx.speed()); sim.seek(0); sim.playing(true); }
    c.ui.remove();
  }
  function done(c) {
    if (c.shown) return; c.shown = true;
    if (!c.keep || !c.chunks.length) { if (c.keep) ctx.toast('Nothing was recorded. Try again.'); return; }
    const type = (c.rec.mimeType || c.fmt.mime).split(';')[0] || 'video/webm', ext = /mp4/.test(type) ? 'mp4' : 'webm';
    const blob = new Blob(c.chunks, { type }), name = fileName(c.play.title, ext), url = URL.createObjectURL(blob);
    const avg = c.costN ? c.cost / c.costN : 0, secs = (c.lastT || performance.now()) - c.t0;
    lastShort = { blob, name, type, frames: c.frames, seconds: Math.round(secs) / 1000, avgMs: Math.round(avg * 100) / 100, maxMs: Math.round(c.costMax * 100) / 100, fps: Math.round(c.frames / (secs / 1000) * 10) / 10, voice: c.voice, plan: c.plan };
    ctx.track && ctx.track('short', { ext, voice: c.voice ? 1 : 0 });
    showResult(c, blob, name, url);
  }
  let lastShort = null;
  function showResult(c, blob, name, url) {
    closeRes(); style();
    const file = typeof File !== 'undefined' ? new File([blob], name, { type: blob.type }) : null;
    const canShare = !!(file && navigator.canShare && navigator.share && (() => { try { return navigator.canShare({ files: [file] }); } catch (e) { return false; } })());
    res = document.createElement('div'); res.className = 'ct-shres'; res.setAttribute('role', 'dialog'); res.setAttribute('aria-label', 'Your Short');
    res.innerHTML = `<header><h4>Your Short<small>${esc(c.play.title)} · ${(blob.size / 1048576).toFixed(1)} MB · ${blob.type.includes('mp4') ? 'MP4' : 'WebM'}</small></h4><button type="button" class="ct-x" data-a="close" aria-label="Close">✕</button></header>
      <video src="${url}" controls playsinline loop></video>
      ${c.voice ? '' : `<p>${c.voiceFailed ? 'The voice didn’t load, so it has captions only.' : 'Captions only: the device’s voice can’t be recorded.'} <button type="button" data-a="key">Add a voice key</button> for narration in the video.</p>`}
      <div class="ct-shrow"><a class="${canShare ? 'ghost' : 'go'}" href="${url}" download="${esc(name)}" data-a="save">Save</a>${canShare ? '<button type="button" class="go" data-a="share">Share</button>' : ''}</div>`;
    res.onclick = e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'close') { closeRes(); URL.revokeObjectURL(url); }
      if (a.dataset.a === 'key') ctx.openKey('Add a broadcaster voice key (OpenAI or ElevenLabs) and your Shorts get the narration, not just captions.');
      if (a.dataset.a === 'share') navigator.share({ files: [file], title: c.play.title + ' · Chalk Talk', text: 'Draw yours: mutaafaziz.com/chalktalk' }).catch(() => {});
    };
    res.dataset.stats = JSON.stringify(Object.assign({}, lastShort, { blob: undefined, plan: undefined, style: c.plan.style, speed: c.plan.speed, est: c.plan.total }));   // measured cost, for checks
    root.appendChild(res);
  }

  return {
    open, cancel,
    get on() { return !!cur; },
    get last() { return lastShort; },
    destroy() { if (cur) cancel(); closeRes(); }
  };
}
