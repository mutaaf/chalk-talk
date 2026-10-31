// The mini map: the active play, top-down like a playbook page, always in a corner of the board for every sport.
// Every route is there (the step playing now lit, the ones done dimmed, the ones to come faint), with the players
// and the ball moving on it live, so a glance says what's happening and what should happen next. Tap a step
// number to jump there; collapse it to a pill (remembered on this device). Hidden in the IQ game (it would give
// the answers away), while a Short records, in presenter mode and in whiteboard-only.
// Pure parts (the window, the route layers, the classes) are exported for test/minimap.test.mjs.

import { frame as fieldWindow } from './playbook.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pathD = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('');
const KEY = 'chalktalk.minimap';

// which state a route is in at step k: playing now, done, or still to come
export const routeState = (beat, k, ended) => (ended || beat < k ? 'done' : beat === k ? 'now' : 'next');

// the map's SVG: field lines, every route by step, a numbered tag per step, then a mark per player and the ball
export function mapSVG(sim, sport) {
  const play = sim.play, [x0, y0, x1, y1] = fieldWindow(sport, play), U = sport.mark, pad = U * 1.4;
  const vb = [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2].map(v => v.toFixed(2)).join(' ');
  const lines = sport.field.lines({ los: play.los }).map(l => {
    const pts = l.p; if (!pts || pts.length < 2) return '';
    return `<path class="mm-l${l.hot ? ' hot' : l.warm ? ' warm' : ''}" d="${pathD(pts)}" stroke-width="${(0.12 + (l.w || 1) * 0.12).toFixed(2)}"/>`;
  }).join('');
  const tags = {};
  const routes = sim.routes.map(r => {
    if (r.auto && r.side === 'D') return '';
    const cls = 'mm-r ' + (r.side === 'D' ? 'd' : r.dashed ? 'p' : 'm');
    if (r.side === 'O' && tags[r.beat] == null && r.pts.length > 1) tags[r.beat] = r.pts[Math.floor(r.pts.length * (r.dashed ? 0.5 : 0.45))];
    return `<path class="${cls}" data-b="${r.beat}" d="${pathD(r.pts)}"${r.dashed ? ' marker-end="url(#mmh)"' : ''}/>`;
  }).join('');
  const steps = Object.keys(tags).map(b => { const m = tags[b]; return `<g class="mm-t" data-b="${b}" data-seek="${b}"><circle cx="${m[0].toFixed(2)}" cy="${m[1].toFixed(2)}" r="${(U * 0.75).toFixed(2)}"/><text x="${m[0].toFixed(2)}" y="${(m[1] + U * 0.05).toFixed(2)}" font-size="${(U * 0.95).toFixed(2)}">${+b + 1}</text></g>`; }).join('');
  const marks = sim.players.map((p, i) => {
    const r = U * 0.8, label = esc(sport.notation.inside(p));
    if (p.side === 'D') return `<g class="mm-p d" data-i="${i}"><path d="M${-r} ${-r}L${r} ${r}M${-r} ${r}L${r} ${-r}"/></g>`;
    return `<g class="mm-p o" data-i="${i}"><circle r="${r.toFixed(2)}"/><text font-size="${(U * (label.length > 1 ? 0.8 : 1.05)).toFixed(2)}" y="${(U * 0.04).toFixed(2)}">${label}</text></g>`;
  }).join('');
  return `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><marker id="mmh" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="3.6" markerHeight="3.6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="mm-ah"/></marker></defs>
    <g class="mm-lines">${lines}</g><g class="mm-routes">${routes}</g><g class="mm-tags">${steps}</g><g class="mm-marks">${marks}</g><circle class="mm-ball" r="${(U * 0.42).toFixed(2)}"/></svg>`;
}

const CSS = `
.ct-mm { position: absolute; right: 22px; bottom: 18px; z-index: 4; width: 280px; border-radius: 16px; background: var(--glass, rgba(8, 14, 26, .78)); border: 1px solid var(--line); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: 0 14px 40px rgba(0, 0, 0, .35); overflow: hidden; transition: width .25s, opacity .2s; }
.ct-mm header { display: flex; align-items: center; gap: 8px; padding: 7px 8px 5px 12px; }
.ct-mm header b { flex: 1; min-width: 0; font: 900 11.5px/1.1 var(--display); letter-spacing: .14em; text-transform: uppercase; color: var(--mute); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-mm header b span { color: var(--o, #ff8e3a); }
.ct-mm header button { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 8px; border: 0; background: transparent; color: var(--mute); cursor: pointer; font: 700 14px/1 system-ui; }
.ct-mm header button:hover { color: var(--paper); background: rgba(140, 188, 255, .1); }
.ct-mm .mm-box { padding: 0 8px 8px; }
.ct-mm svg { display: block; width: 100%; height: auto; max-height: 230px; }
@container (max-height: 720px) { .ct-mm svg { max-height: 170px; } }
.ct-mm .mm-l { fill: none; stroke: rgba(140, 188, 255, .3); stroke-linecap: round; stroke-linejoin: round; } .ct-mm .mm-l.hot { stroke: rgba(238, 244, 255, .5); } .ct-mm .mm-l.warm { stroke: rgba(255, 142, 58, .5); }
.ct-mm .mm-r { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: .5; transition: opacity .25s; }
.ct-mm .mm-r.m { stroke: #ff8e3a; } .ct-mm .mm-r.p { stroke: #eef4ff; stroke-dasharray: .9 .7; } .ct-mm .mm-r.d { stroke: #a9d4ff; stroke-width: .32; }
.ct-mm .mm-ah { fill: #eef4ff; }
.ct-mm .mm-r.next { opacity: .2; } .ct-mm .mm-r.done { opacity: .38; } .ct-mm .mm-r.now { opacity: 1; filter: drop-shadow(0 0 .6px rgba(255, 142, 58, .9)); }
.ct-mm .mm-r.d.next { opacity: 0; } .ct-mm .mm-r.d.done { opacity: .2; }
.ct-mm .mm-t { cursor: pointer; } .ct-mm .mm-t circle { fill: #1a2438; stroke: rgba(140, 188, 255, .4); stroke-width: .15; } .ct-mm .mm-t text { fill: #c7d6ee; font-weight: 700; text-anchor: middle; dominant-baseline: middle; font-family: var(--body, system-ui), sans-serif; }
.ct-mm .mm-t.now circle { fill: #ff8e3a; stroke: none; } .ct-mm .mm-t.now text { fill: #04070c; } .ct-mm .mm-t.next { opacity: .55; }
.ct-mm .mm-p.o circle { fill: #0b1220; stroke: #ff8e3a; stroke-width: .3; } .ct-mm .mm-p.o text { fill: #eef4ff; font-weight: 700; text-anchor: middle; dominant-baseline: middle; font-family: var(--body, system-ui), sans-serif; }
.ct-mm .mm-p.o.ball circle { fill: #ff8e3a; } .ct-mm .mm-p.o.ball text { fill: #04070c; }
.ct-mm .mm-p.d path { stroke: #a9d4ff; stroke-width: .35; stroke-linecap: round; }
.ct-mm .mm-ball { fill: #ffc75a; filter: drop-shadow(0 0 .8px #ffc75a); }
.ct-mm.off { width: auto; } .ct-mm.off .mm-box { display: none; } .ct-mm.off header { padding: 4px 6px 4px 12px; }
.ct-mm .mm-cap { margin: 2px 4px 0; font-size: 11.5px; line-height: 1.3; color: var(--mute); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.6em; }
.ct-mm .mm-cap b { color: var(--o, #ff8e3a); }
.ct.ct-quiz .ct-mm, .ct.ct-shorting .ct-mm, .ct.ct-present-on .ct-mm, .ct.ct-board .ct-mm, .ct.ct-sketch .ct-mm { display: none; }
@container (max-width: 900px) {
  .ct-mm { right: 10px; bottom: auto; top: 104px; width: 150px; border-radius: 12px; }
  .ct-mm header { padding: 4px 4px 2px 9px; } .ct-mm header b { font-size: 10px; } .ct-mm svg { max-height: 104px; } .ct-mm .mm-cap { display: none; } .ct-mm .mm-box { padding: 0 5px 5px; }
}
@container (max-width: 640px) { .ct-mm { top: 104px; width: 132px; } .ct-mm svg { max-height: 96px; } }
@container (max-width: 300px) { .ct-mm { display: none; } }
.ct.ct-light .ct-mm .mm-l { stroke: rgba(16, 26, 43, .28); } .ct.ct-light .ct-mm .mm-p.o circle { fill: #fffdf8; } .ct.ct-light .ct-mm .mm-p.o text { fill: #101a2b; } .ct.ct-light .ct-mm .mm-r.p { stroke: #101a2b; } .ct.ct-light .ct-mm .mm-ah { fill: #101a2b; }
@media (prefers-reduced-motion: reduce) { .ct-mm, .ct-mm .mm-r { transition: none; } }
`;

export function createMinimap(ctx) {
  const style = document.createElement('style'); style.dataset.chalkTalkMinimap = ''; style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('aside'); el.className = 'ct-mm'; el.setAttribute('aria-label', 'Mini map of the play');
  let off = false; try { off = localStorage.getItem(KEY) === 'off'; } catch (e) {}
  el.classList.toggle('off', off);
  el.innerHTML = `<header><b data-m="title">The play</b><button type="button" data-m="fold" aria-label="Collapse the mini map" aria-expanded="${!off}">${off ? '▸' : '▾'}</button></header><div class="mm-box"><div data-m="svg"></div><p class="mm-cap" data-m="cap"></p></div>`;
  ctx.root.appendChild(el);
  const M = {}; el.querySelectorAll('[data-m]').forEach(e => { M[e.dataset.m] = e; });
  let sim = null, marks = [], routes = [], tags = [], ball = null, lastK = -2, lastHold = -2;
  const fold = v => { off = v; el.classList.toggle('off', off); M.fold.textContent = off ? '▸' : '▾'; M.fold.setAttribute('aria-expanded', String(!off)); M.fold.setAttribute('aria-label', off ? 'Show the mini map' : 'Collapse the mini map'); try { localStorage.setItem(KEY, off ? 'off' : 'on'); } catch (e) {} };
  M.fold.onclick = e => { e.stopPropagation(); fold(!off); ctx.track && ctx.track('minimap', { on: off ? 0 : 1 }); };
  el.querySelector('header b').onclick = () => { if (off) fold(false); };
  el.addEventListener('click', e => { const t = e.target.closest('[data-seek]'); if (t && ctx.seek) ctx.seek(+t.dataset.seek); });
  // a new play (or the same one with defense on/off): draw it once; the frame loop only moves the marks
  function rebuild() {
    sim = ctx.sim(); const sport = ctx.sport(); if (!sim || !sport) return;
    M.svg.innerHTML = mapSVG(sim, sport);
    marks = [...M.svg.querySelectorAll('.mm-p')]; routes = [...M.svg.querySelectorAll('.mm-r')]; tags = [...M.svg.querySelectorAll('.mm-t')]; ball = M.svg.querySelector('.mm-ball');
    M.title.innerHTML = `<span>Map</span> · ${esc(sim.play.title || 'The play')}`;
    lastK = -2; lastHold = -2;
  }
  function tick(t) {
    if (!sim || off || el.offsetParent === null) return;
    const P = sim.posAt(t);
    for (const g of marks) { const p = P[+g.dataset.i]; if (p) g.setAttribute('transform', `translate(${p[0].toFixed(2)} ${p[1].toFixed(2)})`); }
    const b = sim.ballAt ? sim.ballAt(t) : null; if (ball && b) { ball.setAttribute('cx', b[0].toFixed(2)); ball.setAttribute('cy', b[1].toFixed(2)); }
    const ended = t >= sim.beats - 1e-3, k = Math.min(sim.beats - 1, Math.floor(t)), key = ended ? -1 : k;
    if (key !== lastK) {
      lastK = key;
      routes.forEach(r => { const s = routeState(+r.dataset.b, k, ended); r.classList.toggle('now', s === 'now'); r.classList.toggle('done', s === 'done'); r.classList.toggle('next', s === 'next'); });
      tags.forEach(g => { const s = routeState(+g.dataset.b, k, ended); g.classList.toggle('now', s === 'now'); g.classList.toggle('next', s === 'next'); });
      const info = !ended && sim.beatInfo ? sim.beatInfo(k) : null;
      M.cap.innerHTML = ended ? '<b>✓</b> That’s the play. Tap a number to see a step again.' : info ? `<b>Step ${k + 1} ·</b> ${esc(ctx.line ? ctx.line(info.say || '') : info.say || '')}` : '';
    }
    const h = sim.holderAt(t);
    if (h !== lastHold) { lastHold = h; marks.forEach(g => g.classList.toggle('ball', +g.dataset.i === h)); }
  }
  return { rebuild, tick, fold, el, destroy() { el.remove(); style.remove(); } };
}
