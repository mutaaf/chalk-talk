// Concept lessons: the board becomes the classroom. A concept (src/concepts/*) is drawn on the real court in
// light, one idea at a time (zones fade in, the step's zones glow), with a little looping demo, at four levels:
// Kids, Starter, Varsity, Coach. "Quiz me" asks the engine's own questions (src/engine/space.js): which way you
// push the ball, what the rule is here, where you help from. Own SVG layer and scoped <style>; ui.js hooks:
// createLesson(...), tick() every frame, open(id, level), close(), and .ct-lessonon on the root while it's up.

import { LEVELS, actorAt, question, zoneAt } from './engine/space.js';
import { concept as getConcept } from './concepts/index.js';
import { icon } from './icons.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NS = 'http://www.w3.org/2000/svg';
const LV = 'chalktalk.lesson.level', BEST = 'chalktalk.lesson.best';
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

const CSS = `
.ct-stage { transition: transform .45s cubic-bezier(.2, .8, .2, 1); }
.ct-lsvg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; overflow: visible; }
.ct-lsvg.tap { pointer-events: auto; cursor: crosshair; }
.ct-lsvg .lz { opacity: 0; transition: opacity .45s, fill-opacity .45s, stroke-opacity .45s; fill-opacity: .1; stroke-opacity: .55; stroke-width: 1.4; stroke-linejoin: round; }
.ct-lsvg .lz.on { opacity: 1; }
.ct-lsvg .lz.hot { fill-opacity: .26; stroke-opacity: 1; stroke-width: 2.2; filter: drop-shadow(0 0 8px currentColor); }
.ct-lsvg .lz.dim { opacity: .35; }
.ct-lsvg .lz.line, .ct-lsvg .lz.arrow { fill: none; }
.ct-lsvg .lz.line { stroke-width: 2.4; stroke-dasharray: 9 7; } .ct-lsvg .lz.line.hot { stroke-width: 3.4; }
.ct-lsvg .lz.arrow { stroke-width: 3.2; stroke-linecap: round; marker-end: url(#ct-lsnhead); stroke-dasharray: 1 0; }
.ct-lsvg .lz.arrow.on { animation: ct-lsnflow 1.6s linear infinite; stroke-dasharray: 14 8; }
@keyframes ct-lsnflow { to { stroke-dashoffset: -44; } }
.ct-lsvg [data-tone=ice] { color: #8cbcff; stroke: #8cbcff; fill: #8cbcff; }
.ct-lsvg [data-tone=good] { color: #6ee7a8; stroke: #6ee7a8; fill: #6ee7a8; }
.ct-lsvg [data-tone=warn] { color: #ffb86b; stroke: #ffb86b; fill: #ffb86b; }
.ct-lsvg [data-tone=red] { color: #ff6b6b; stroke: #ff6b6b; fill: #ff6b6b; }
.ct-lsvg [data-tone=hot] { color: #ff8e8e; stroke: #ff8e8e; fill: #ff8e8e; }
.ct-lsvg [data-tone=gold] { color: #ffc75a; stroke: #ffc75a; fill: #ffc75a; }
.ct-lsvg [data-tone=o] { color: #ff8e3a; stroke: #ff8e3a; fill: #ff8e3a; }
.ct-lsvg .ll { opacity: 0; transition: opacity .45s; font: 700 10.5px/1 var(--body, system-ui), sans-serif; letter-spacing: .08em; text-transform: uppercase; text-anchor: middle; paint-order: stroke; stroke: rgba(4, 7, 12, .85); stroke-width: 2.5px; stroke-linejoin: round; }
.ct-lsvg .ll.on { opacity: .85; } .ct-lsvg .ll.hot { opacity: 1; font-size: 12px; font-weight: 800; }
.ct-lsvg .la .o { fill: rgba(4, 7, 12, .6); stroke: #eef4ff; stroke-width: 2.4; }
.ct-lsvg .la .x { stroke: #ff8e3a; stroke-width: 3.4; stroke-linecap: round; fill: none; }
.ct-lsvg .la text { font: 900 11px/1 var(--display, Impact), sans-serif; text-anchor: middle; dominant-baseline: central; fill: #eef4ff; }
.ct-lsvg .la .xt { fill: #ff8e3a; }
.ct-lsvg .lb { fill: #ff8e3a; stroke: #04070c; stroke-width: 1.5; filter: drop-shadow(0 0 6px rgba(255, 142, 58, .8)); }
.ct-lsvg .lmark { fill: none; stroke: #eef4ff; stroke-width: 3; stroke-linecap: round; }
.ct-lsvg .lmark.ok { stroke: #6ee7a8; } .ct-lsvg .lmark.no { stroke: #ff6b6b; }
.ct-lsvg .lspot { fill: rgba(110, 231, 168, .18); stroke: #6ee7a8; stroke-width: 2; stroke-dasharray: 4 4; }
.ct.ct-lessonon :is(.ct-ink, .ct-labels, .ct-dock, .ct-card, .ct-lib, .ct-legend, .ct-fb, .ct-tabbar, .ct-playchip, .ct-fab, .ct-mm, .ct-rail, .ct-edge, .ct-pbar) { opacity: 0 !important; pointer-events: none !important; }
.ct-lsn { position: absolute; z-index: 12; right: 18px; bottom: 18px; width: 380px; max-height: calc(100% - 96px); display: flex; flex-direction: column; border-radius: 22px; background: var(--glass-regular, rgba(8, 14, 26, .82)); border: 1px solid var(--line); backdrop-filter: blur(22px) saturate(1.3); -webkit-backdrop-filter: blur(22px) saturate(1.3); box-shadow: 0 24px 60px rgba(0, 0, 0, .45); color: var(--paper); animation: ct-rise .35s both; overflow: hidden; }
.ct-lsn > header { display: flex; align-items: flex-start; gap: 10px; padding: 14px 12px 6px 18px; }
.ct-lsn > header span { flex: 1; display: grid; gap: 3px; }
.ct-lsn > header small { font: 800 10.5px/1 var(--display); letter-spacing: .2em; text-transform: uppercase; color: var(--gold, #ffc75a); }
.ct-lsn > header b { font: 900 26px/.95 var(--display); text-transform: uppercase; letter-spacing: .01em; }
.ct-lsn > header button { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: rgba(140, 188, 255, .08); }
.ct-lsn > header .ct-i { width: 18px; height: 18px; }
.ct-lsnlv { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin: 6px 14px 4px; padding: 4px; border-radius: 14px; background: rgba(140, 188, 255, .06); }
.ct-lsnlv button { display: grid; gap: 1px; padding: 6px 2px; border-radius: 10px; font-size: 13px; font-weight: 700; color: var(--mute); }
.ct-lsnlv button small { font-size: 10.5px; font-weight: 400; opacity: .8; }
.ct-lsnlv button.on { background: var(--o); color: var(--night); box-shadow: 0 4px 14px rgba(255, 142, 58, .35); }
.ct-lsnb { overflow: auto; padding: 10px 18px 6px; min-height: 120px; }
.ct-lsnb > small { font: 700 11px/1 var(--display); letter-spacing: .16em; text-transform: uppercase; color: var(--mute); }
.ct-lsnb h3 { margin: 6px 0 6px; font: 900 22px/1.02 var(--display); text-transform: uppercase; letter-spacing: .01em; }
.ct-lsnb p { margin: 0; font-size: 15px; line-height: 1.42; }
.ct-lsnb .cue { display: inline-block; margin-top: 10px; padding: 5px 12px; border-radius: 12px; background: rgba(255, 142, 58, .14); color: var(--o); font: 800 15px/1.2 var(--marker, cursive); }
.ct-lsnlinks { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 12px; }
.ct-lsnwatch { display: flex; align-items: center; gap: 7px; padding: 0; font-size: 13.5px; font-weight: 700; color: var(--ice, #8cbcff); }
.ct-lsnwatch .ct-i { width: 16px; height: 16px; }
.ct.ct-light .ct-lsnwatch { color: #2f6fca; }
.ct-lsnb .opts { display: grid; gap: 7px; margin-top: 10px; }
.ct-lsnb .opts button { padding: 11px 14px; border-radius: 13px; text-align: left; font-size: 14.5px; font-weight: 700; background: rgba(140, 188, 255, .07); border: 1px solid rgba(140, 188, 255, .16) !important; }
.ct-lsnb .opts.way { grid-template-columns: 1fr 1fr; } .ct-lsnb .opts.way button { text-align: center; font-size: 17px; padding: 14px; }
.ct-lsnb .opts button.ok { background: rgba(110, 231, 168, .2); border-color: #6ee7a8 !important; }
.ct-lsnb .opts button.no { background: rgba(255, 107, 107, .16); border-color: #ff6b6b !important; }
.ct-lsnb .opts button:disabled { cursor: default; }
.ct-lsnb .fb { margin-top: 10px; padding: 10px 12px; border-radius: 12px; font-size: 14px; }
.ct-lsnb .fb.ok { background: rgba(110, 231, 168, .12); } .ct-lsnb .fb.no { background: rgba(255, 107, 107, .1); }
.ct-lsnb .fb b { display: block; margin-bottom: 2px; }
.ct-lsnb .tapme { margin-top: 10px; display: flex; align-items: center; gap: 8px; color: var(--gold, #ffc75a); font-weight: 700; font-size: 14px; }
.ct-lsnb .tapme::before { content: ''; width: 10px; height: 10px; border-radius: 50%; background: currentColor; animation: ct-lsnping 1.2s infinite; }
@keyframes ct-lsnping { 50% { transform: scale(1.6); opacity: .4; } }
.ct-lsn > footer { display: flex; align-items: center; gap: 8px; padding: 10px 14px 12px; }
.ct-lsn > footer .nav { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; font-size: 15px; background: rgba(140, 188, 255, .1); }
.ct-lsn > footer .nav:disabled { opacity: .3; }
.ct-lsn > footer .dots { flex: 1; display: flex; justify-content: center; gap: 5px; }
.ct-lsn > footer .dots i { width: 7px; height: 7px; border-radius: 4px; background: rgba(140, 188, 255, .25); transition: width .2s, background .2s; }
.ct-lsn > footer .dots i.on { width: 20px; background: var(--o); }
.ct-lsn > footer .go { height: 44px; padding: 0 16px; border-radius: 22px; background: var(--o); color: var(--night); font-weight: 800; font-size: 14px; white-space: nowrap; }
.ct-lsn > footer .go.ghost { background: rgba(140, 188, 255, .1); color: var(--paper); }
.ct-lsn .credit { margin: 0; padding: 0 18px 12px; font-size: 11.5px; color: var(--mute); }
.ct.ct-light .ct-lsvg .ll { stroke: rgba(255, 253, 248, .95); stroke-width: 2.5px; }
.ct.ct-light .ct-lsvg .ll.on { opacity: 1; }
.ct.ct-light .ct-lsvg [data-tone=ice] { color: #2f6fca; stroke: #2f6fca; fill: #2f6fca; }
.ct.ct-light .ct-lsvg [data-tone=good] { color: #138a52; stroke: #138a52; fill: #138a52; }
.ct.ct-light .ct-lsvg [data-tone=warn] { color: #c25e0c; stroke: #c25e0c; fill: #c25e0c; }
.ct.ct-light .ct-lsvg [data-tone=red], .ct.ct-light .ct-lsvg [data-tone=hot] { color: #c62f2f; stroke: #c62f2f; fill: #c62f2f; }
.ct.ct-light .ct-lsvg [data-tone=gold] { color: #a86a00; stroke: #a86a00; fill: #a86a00; }
.ct.ct-light .ct-lsvg .lz.hot { filter: none; }
.ct.ct-light .ct-lsvg .la .o { fill: rgba(255, 253, 248, .8); stroke: #10203a; } .ct.ct-light .ct-lsvg .la text { fill: #10203a; }
@container (min-width: 701px) { .ct.ct-lessonon .ct-stage { transform: translateX(calc(-1 * min(200px, 15%))); } }
@container (max-width: 700px) {
  .ct.ct-lessonon .ct-stage { transform: translateY(calc(-1 * min(24%, 190px))); }
  .ct-lsn { left: 8px; right: 8px; bottom: calc(8px + env(safe-area-inset-bottom)); width: auto; max-height: 48%; border-radius: 22px; }
  .ct-lsn > header b { font-size: 22px; }
  .ct-lsnb h3 { font-size: 19px; } .ct-lsnb p { font-size: 14.5px; }
  .ct-lsn .credit { display: none; }
}
@media (prefers-reduced-motion: reduce) { .ct-lsvg .lz.arrow.on { animation: none; } .ct-lsn { animation: none; } }
`;

export function createLesson(ctx) {
  let styleEl = null, svg = null, panel = null, C = null, level = 'starter', step = 0, mode = 'learn', t0 = 0;
  let paths = {}, labels = {}, actors = [], ball = null, mark = null, spot = null, Q = null, answered = null, streak = 0;
  const style = () => { if (!styleEl) { styleEl = document.createElement('style'); styleEl.dataset.chalkTalkLesson = ''; styleEl.textContent = CSS; document.head.appendChild(styleEl); } };
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };

  // the court drawing: every zone once, re-projected each frame (the court is tilted and can be orbited)
  function build() {
    svg && svg.remove(); paths = {}; labels = {};
    svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'ct-lsvg'); svg.setAttribute('aria-hidden', 'true');
    const defs = el('defs', {}, svg), m = el('marker', { id: 'ct-lsnhead', viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0L10 5L0 10z', fill: 'context-stroke' }, m);
    const gZ = el('g', {}, svg), gL = el('g', {}, svg);
    for (const z of C.zones) {
      paths[z.id] = el('path', { class: 'lz ' + z.kind, 'data-tone': z.tone }, gZ);
      if (z.label) { const t = el('text', { class: 'll', 'data-tone': z.tone }, gL); z.label.forEach((w, i) => { const s = el('tspan', { x: 0, dy: i ? '1.1em' : 0 }, t); s.textContent = w; }); labels[z.id] = t; }
    }
    actors = []; ball = el('circle', { class: 'lb', r: 0 }, svg);
    spot = el('circle', { class: 'lspot', r: 0 }, svg); mark = el('path', { class: 'lmark', d: '' }, svg);
    svg.addEventListener('pointerdown', onTap);
    ctx.stage().appendChild(svg);
  }
  function setActors(list) {
    actors.forEach(a => a.g.remove());
    actors = list.map(a => {
      const g = el('g', { class: 'la' }, svg);
      if (a.side === 'ball') return { a, g, shape: null, t: null };   // a pass: the ball on its own path
      const shape = a.side === 'D' ? el('path', { class: 'x' }, g) : el('circle', { class: 'o' }, g), t = el('text', { class: a.side === 'D' ? 'xt' : '' }, g);
      t.textContent = a.label || ''; return { a, g, shape, t };
    });
    svg.appendChild(ball); svg.appendChild(mark);
  }
  const P = (x, y) => ctx.proj(x, y, 0);
  const poly = pts => 'M' + pts.map(p => { const s = P(p[0], p[1]); return s.x.toFixed(1) + ' ' + s.y.toFixed(1); }).join('L');
  function dense(pts, n = 10) { const out = []; for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < n; j++) { const w = j / n; out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * w, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * w]); } out.push(pts[pts.length - 1]); return out; }
  function shapeOf(z) {
    if (z.kind === 'rect') return poly(dense([[z.x[0], z.y[0]], [z.x[1], z.y[0]], [z.x[1], z.y[1]], [z.x[0], z.y[1]], [z.x[0], z.y[0]]])) + 'Z';
    if (z.kind === 'circle') return poly(Array.from({ length: 33 }, (_, i) => [z.c[0] + Math.cos(i / 32 * Math.PI * 2) * z.r, z.c[1] + Math.sin(i / 32 * Math.PI * 2) * z.r])) + 'Z';
    return poly(dense(z.pts, 6));
  }

  // what this step (or this question) shows on the court
  function scene() {
    const s = mode === 'learn' ? C.levels[level][step] : null;
    const show = new Set(s ? s.show || [] : Q ? (Q.kind === 'rule' ? [] : Q.kind === 'help' ? ['split'] : ['split']) : []);
    const hot = new Set(s ? s.hot || [] : []);
    if (answered && Q && Q.zone) { show.add(Q.zone); hot.add(Q.zone); }
    if (answered && Q && Q.kind === 'way') { const sd = Q.side < 0 ? 'L' : 'R'; ['side' + sd, 'down' + sd].forEach(k => { show.add(k); hot.add(k); }); }
    for (const z of C.zones) {
      const on = show.has(z.id);
      paths[z.id].setAttribute('class', 'lz ' + z.kind + (on ? ' on' : '') + (hot.has(z.id) ? ' hot' : hot.size && on ? ' dim' : ''));
      if (labels[z.id]) labels[z.id].setAttribute('class', 'll' + (on ? ' on' : '') + (hot.has(z.id) ? ' hot' : ''));
    }
    if (s) setActors(s.demo ? C.demos[s.demo].actors : []);
    else if (Q) setActors(Q.kind === 'help' ? [{ side: 'O', label: '', ball: true, path: [Q.ball] }, { side: 'O', label: '', path: [Q.man] }] : [{ side: 'O', label: '', ball: true, path: [Q.ball] }]);
    svg.classList.toggle('tap', !!(Q && !answered && (Q.kind === 'help' || Q.kind === 'way')));
    t0 = performance.now();
  }
  function tick() {
    if (!svg || !C) return;
    for (const z of C.zones) {
      paths[z.id].setAttribute('d', shapeOf(z));
      if (labels[z.id]) { const a = P(z.at[0], z.at[1]); labels[z.id].setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})`); }
    }
    const s = mode === 'learn' ? C.levels[level][step] : null, d = s && s.demo ? C.demos[s.demo] : null;
    const u = d ? Math.min(1, ((performance.now() - t0) / 1000 % (d.dur + 1.2)) / d.dur) : 1;
    const [cx, cy] = mid(), U = ctx.sport().mark || 1.5, r0 = P(cx, cy), r1 = P(cx + U, cy), rpx = Math.max(8, Math.hypot(r1.x - r0.x, r1.y - r0.y));
    let bAt = null;
    actors.forEach(A => {
      const [x, y] = actorAt(A.a, u), c = P(x, y);
      if (A.a.side === 'ball') { bAt = c; return; }
      if (A.a.side === 'D') { const k = rpx * 0.75; A.shape.setAttribute('d', `M${c.x - k} ${c.y - k}L${c.x + k} ${c.y + k}M${c.x - k} ${c.y + k}L${c.x + k} ${c.y - k}`); A.t.setAttribute('x', c.x + k + 6); A.t.setAttribute('y', c.y + k); }
      else { A.shape.setAttribute('cx', c.x); A.shape.setAttribute('cy', c.y); A.shape.setAttribute('r', rpx); A.t.setAttribute('x', c.x); A.t.setAttribute('y', c.y); }
      if (A.a.ball && !bAt) bAt = P(x + U * 0.7, y - U * 0.6);
    });
    if (bAt) { ball.setAttribute('cx', bAt.x); ball.setAttribute('cy', bAt.y); ball.setAttribute('r', Math.max(4.5, rpx * 0.45)); } else ball.setAttribute('r', 0);
    if (answered && answered.tap) { const c = P(answered.tap[0], answered.tap[1]), k = 8; mark.setAttribute('d', `M${c.x - k} ${c.y - k}L${c.x + k} ${c.y + k}M${c.x - k} ${c.y + k}L${c.x + k} ${c.y - k}`); mark.setAttribute('class', 'lmark ' + (answered.ok ? 'ok' : 'no')); } else mark.setAttribute('d', '');
    if (answered && Q && Q.spot && !answered.ok) { const c = P(Q.spot[0], Q.spot[1]), e = P(Q.spot[0] + 3, Q.spot[1]); spot.setAttribute('cx', c.x); spot.setAttribute('cy', c.y); spot.setAttribute('r', Math.abs(e.x - c.x)); } else spot.setAttribute('r', 0);
  }

  // ---- the panel ----
  const mid = () => { const F = ctx.sport().field; return [(F.x[0] + F.x[1]) / 2, (F.y[0] + F.y[1]) / 2, (F.x[1] - F.x[0]) * 0.35]; };
  const leftIsNeg = () => { const [cx, cy, w] = mid(); return P(cx - w, cy).x < P(cx + w, cy).x; };   // which way "left" is on screen, wherever the camera is
  function render() {
    const steps = C.levels[level], s = steps[step];
    const lv = `<div class="ct-lsnlv" role="tablist">${LEVELS.map(L => `<button type="button" role="tab" aria-selected="${L.id === level}" data-lv="${L.id}" class="${L.id === level ? 'on' : ''}">${esc(L.name)}<small>${esc(L.age)}</small></button>`).join('')}</div>`;
    let body, foot;
    if (mode === 'learn') {
      body = `<small>Step ${step + 1} of ${steps.length}</small><h3>${esc(s.t)}</h3><p>${esc(s.say)}</p>${s.cue ? `<span class="cue">“${esc(s.cue)}”</span>` : ''}`
        + `<div class="ct-lsnlinks">${C.defense && ctx.watch ? `<button type="button" class="ct-lsnwatch" data-watch>${icon('play')}Watch it in a real play</button>` : ''}${ctx.print ? `<button type="button" class="ct-lsnwatch" data-print>${icon('book')}Print all four levels</button>` : ''}</div>`;
      foot = `<button type="button" class="nav" data-nav="-1" aria-label="Previous step"${step ? '' : ' disabled'}>◀︎</button><div class="dots">${steps.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>`
        + (step < steps.length - 1 ? `<button type="button" class="nav" data-nav="1" aria-label="Next step">▶︎</button><button type="button" class="go ghost" data-quiz>Quiz me</button>` : `<button type="button" class="go" data-quiz>Quiz me</button>`);
    } else {
      const best = store.get(BEST, {})[C.id + '.' + level] || 0;
      const L = leftIsNeg();
      let opts = '';
      if (Q.kind === 'rule') opts = `<div class="opts">${Q.options.map(o => { const c = answered ? (o === Q.answer ? ' ok' : o === answered.pick ? ' no' : '') : ''; return `<button type="button" data-opt="${esc(o)}" class="${c}"${answered ? ' disabled' : ''}>${esc(o)}</button>`; }).join('')}</div>`;
      if (Q.kind === 'way') {
        const right = (Q.side < 0) === L ? 'l' : 'r', cls = k => answered ? (k === right ? ' ok' : k === answered.pick ? ' no' : '') : '';
        opts = `<div class="opts way"><button type="button" data-way="l" class="${cls('l')}"${answered ? ' disabled' : ''}>◀︎ This way</button><button type="button" data-way="r" class="${cls('r')}"${answered ? ' disabled' : ''}>That way ▶︎</button></div>${answered ? '' : '<div class="tapme">Or tap the court</div>'}`;
      }
      if (Q.kind === 'help' && !answered) opts = '<div class="tapme">Tap the court</div>';
      const fb = answered ? `<div class="fb ${answered.ok ? 'ok' : 'no'}"><b>${answered.ok ? (streak > 2 ? `Yes! ${streak} in a row` : 'Yes!') : 'Not quite.'}</b>${esc(Q.why)}</div>` : '';
      body = `<small>Quiz · ${streak ? streak + ' in a row' : 'start a streak'}${best ? ' · best ' + best : ''}</small><h3>${esc(Q.ask)}</h3>${opts}${fb}`;
      foot = `<button type="button" class="go ghost" data-learn>Back to the lesson</button><div class="dots"></div>${answered ? '<button type="button" class="go" data-next>Next ›</button>' : ''}`;
    }
    panel.innerHTML = `<header><span><small>${esc(C.kind === 'defense' ? 'Defense concept' : C.kind === 'offense' ? 'Offense concept' : 'Concept')}</small><b>${esc(C.title)}</b></span><button type="button" data-close aria-label="Close the lesson">${icon('close')}</button></header>${lv}<div class="ct-lsnb" aria-live="polite">${body}</div><footer>${foot}</footer>${C.credit ? `<p class="credit">${esc(C.credit)}</p>` : ''}`;
  }
  function onPanel(e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.close != null) { close(); return; }
    if (b.dataset.print != null) { ctx.track('lesson_print', { id: C.id }); ctx.print(C.id); return; }
    if (b.dataset.watch != null) { const id = C.id; ctx.track('lesson_watch', { id, level }); close(); ctx.watch(id); return; }
    if (b.dataset.lv) { level = b.dataset.lv; store.set(LV, level); step = 0; if (mode === 'quiz') ask(); else show(); ctx.track('lesson_level', { id: C.id, level }); return; }
    if (b.dataset.nav) { step = Math.max(0, Math.min(C.levels[level].length - 1, step + +b.dataset.nav)); show(); return; }
    if (b.dataset.quiz != null) { mode = 'quiz'; streak = 0; ask(); ctx.track('lesson_quiz', { id: C.id, level }); return; }
    if (b.dataset.learn != null) { mode = 'learn'; Q = null; answered = null; show(); return; }
    if (b.dataset.next != null) { ask(); return; }
    if (b.dataset.opt != null && !answered) grade(b.dataset.opt === Q.answer, { pick: b.dataset.opt });
    if (b.dataset.way && !answered) { const right = (Q.side < 0) === leftIsNeg() ? 'l' : 'r'; grade(b.dataset.way === right, { pick: b.dataset.way }); }
  }
  function onTap(e) {
    if (!Q || answered) return;
    const host = svg.getBoundingClientRect(), pt = ctx.unproject(e.clientX - host.left, e.clientY - host.top);
    e.preventDefault(); e.stopPropagation();
    if (Q.kind === 'help') grade(Q.ok(pt), { tap: pt });
    if (Q.kind === 'way') { const ok = Math.sign(pt[0]) === Q.side, right = (Q.side < 0) === leftIsNeg() ? 'l' : 'r'; grade(ok, { tap: pt, pick: ok ? right : right === 'l' ? 'r' : 'l' }); }
  }
  function grade(ok, how) {
    answered = Object.assign({ ok }, how); streak = ok ? streak + 1 : 0;
    const best = store.get(BEST, {}), k = C.id + '.' + level;
    if (streak > (best[k] || 0)) { best[k] = streak; store.set(BEST, best); }
    ok && ctx.chime && ctx.chime('yes');
    ctx.track('lesson_answer', { id: C.id, level, kind: Q.kind, ok: ok ? 1 : 0 });
    if (ctx.narrate()) ctx.speak((ok ? 'Yes. ' : 'Not quite. ') + Q.why);
    scene(); render();
  }
  function ask() { answered = null; Q = question(C, level); scene(); render(); }
  function show() { const s = C.levels[level][step]; scene(); render(); if (ctx.narrate()) ctx.speak(s.t + '. ' + s.say); }

  function open(id, lv, o) {
    const c = getConcept(id, ctx.sport().id); if (!c) return false;
    style(); C = c; mode = 'learn'; Q = null; answered = null; step = 0;
    level = lv && LEVELS.some(L => L.id === lv) ? lv : ctx.kids() ? 'kids' : store.get(LV, 'starter');
    build();
    panel && panel.remove(); panel = document.createElement('div'); panel.className = 'ct-lsn'; panel.setAttribute('role', 'region'); panel.setAttribute('aria-label', C.title + ' lesson');
    panel.addEventListener('click', onPanel); ctx.root.appendChild(panel);
    ctx.root.classList.add('ct-lessonon'); ctx.enter();
    if (o && o.quiz) { mode = 'quiz'; streak = 0; ask(); } else show();
    ctx.track('lesson_open', { id, level, quiz: o && o.quiz ? 1 : 0 });
    return true;
  }
  function close() {
    if (!C) return;
    svg && svg.remove(); panel && panel.remove(); svg = panel = null; C = null; Q = null;
    ctx.root.classList.remove('ct-lessonon'); ctx.leave();
  }
  // the court can change under us (another sport): the lesson only makes sense on its own sport
  return { open, close, tick, get on() { return !!C; }, get id() { return C && C.id; }, zoneAt: pt => C ? zoneAt(C, pt) : null, destroy() { close(); styleEl && styleEl.remove(); styleEl = null; } };
}
