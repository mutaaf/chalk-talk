// Mind view: a translucent layer over the board that shows what every player is thinking, doing and
// processing, live, while the play runs underneath. A tiny chip rides next to each player; tap one for
// the full card (body, job, reads, the brain behind it), or open the table of everyone, sortable.
//
// Built to cost nothing when it's off and very little when it's on (see CLAUDE.md → Mind view):
//   every frame   only the chips' and leader lines' positions move (transform writes, read from the ink)
//   ~9 Hz         the numbers: one shared frame + O(players) per player (engine/mind.js), text written only
//                 when it changed, into nodes made once (no innerHTML per tick)
//   ~3 Hz         best reads (O(players²)), and only for the players with an open card
//   once a play   facts (brains, jobs, the sampled track for speed and distance), cached on the sim

import { facts, telemetryAll, doing, speedProfile, orderFor } from './engine/mind.js';
import { bestReads } from './engine/reads.js';

const TEXT_MS = 110, READS_MS = 330, MAX_CARDS = 3;
const SVGNS = 'http://www.w3.org/2000/svg';
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Martian+Mono:wght@400;600;800&display=swap');
.ct-mind { position: absolute; inset: 0; pointer-events: none; --mono: 'Martian Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  --mo: rgba(255, 142, 58, .9); --mx: rgba(169, 212, 255, .9); --mglass: rgba(4, 8, 16, .34); --mcard: rgba(6, 11, 22, .72); --mline: rgba(140, 188, 255, .2); }
.ct.ct-light .ct-mind { --mo: #c2410c; --mx: #1e4b91; --mglass: rgba(255, 253, 248, .5); --mcard: rgba(255, 253, 248, .86); --mline: rgba(20, 38, 70, .18); }
.ct-mind[hidden] { display: none !important; }
.ct-mlead { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; z-index: 2; }
.ct-mlead path { fill: none; stroke-width: 1; stroke-dasharray: 2 4; opacity: .7; }
.ct-mlead path.O { stroke: var(--mo); } .ct-mlead path.D { stroke: var(--mx); }
.ct-mchips { position: absolute; inset: 0; z-index: 2; }
.ct .ct-mc { position: absolute; left: 0; top: 0; pointer-events: auto; translate: 0 -50%; display: grid; grid-template-columns: auto 1fr; column-gap: 5px; align-items: baseline;
  max-width: 150px; padding: 3px 6px 3px 5px; border-radius: 2px 7px 7px 7px; text-align: left; font-family: var(--mono); font-size: 8.5px; line-height: 1.3; letter-spacing: -.01em;
  background: var(--mglass); border-left: 2px solid var(--mo); color: var(--paper); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); opacity: .9; transition: opacity .2s, background .2s; will-change: transform; }
.ct .ct-mc.D { border-left-color: var(--mx); }
.ct .ct-mc:hover, .ct .ct-mc.pin { opacity: 1; background: var(--mcard); }
.ct-mc .k { grid-row: span 2; font-family: var(--display); font-weight: 900; font-size: 13px; line-height: 1; color: var(--mo); }
.ct-mc.D .k { color: var(--mx); }
.ct-mc .d { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
.ct-mc .m { grid-column: 2; color: var(--mute); white-space: nowrap; display: flex; gap: 4px; align-items: center; }
.ct-mc .hd { display: inline-block; width: 8px; text-align: center; color: var(--paper); transition: rotate .1s linear; }
.ct-mc .hd.still { opacity: .25; }
.ct-mc.ball .k::after { content: '●'; font-size: 7px; vertical-align: top; margin-left: 1px; color: var(--hi); }
.ct-mc.open { box-shadow: inset 0 0 0 1px rgba(74, 222, 128, .6); } .ct-mc.open .m b { color: var(--good); }
.ct-mc.beaten, .ct-mc.screened { box-shadow: inset 0 0 0 1px rgba(255, 120, 100, .7); }
.ct-mc.smart .k { text-shadow: 0 0 8px rgba(160, 120, 255, .9); }
.ct-mc.pin { box-shadow: inset 0 0 0 1px var(--mo); } .ct-mc.D.pin { box-shadow: inset 0 0 0 1px var(--mx); }

.ct-mbar { position: absolute; z-index: 6; top: 62px; left: 50%; translate: -50% 0; pointer-events: auto; display: flex; align-items: center; gap: 2px; max-width: calc(100% - 24px);
  padding: 3px 3px 3px 10px; border-radius: 10px; background: var(--mcard); border: 1px solid var(--mline); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  font-family: var(--mono); font-size: 9.5px; color: var(--mute); white-space: nowrap; box-shadow: 0 8px 24px rgba(0, 0, 0, .25); animation: ct-mind-in .35s cubic-bezier(.2, .8, .2, 1) both; }
.ct-mbar b { color: var(--paper); font-weight: 800; letter-spacing: .12em; margin-right: 6px; }
.ct-mbar b i { font-style: normal; color: var(--violet); }
.ct-mbar span { overflow: hidden; text-overflow: ellipsis; margin-right: 6px; }
.ct-mbar button { height: 24px; padding: 0 8px; border-radius: 7px; font-size: 9.5px; font-family: var(--mono); color: var(--paper); }
.ct-mbar button:hover, .ct-mbar button.on { background: var(--ice-dim); }
.ct-mbar .x { font-size: 13px; padding: 0 7px; }

.ct-mdock { position: absolute; z-index: 6; left: 14px; top: 100px; bottom: 150px; width: 272px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; scrollbar-width: none; pointer-events: none; }
.ct-mcard { pointer-events: auto; flex: none; padding: 10px 11px 9px; border-radius: 12px; background: var(--mcard); border: 1px solid var(--mline); border-top: 2px solid var(--mo);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); font-family: var(--mono); font-size: 9.5px; line-height: 1.45; box-shadow: 0 12px 34px rgba(0, 0, 0, .3); animation: ct-mind-in .3s cubic-bezier(.2, .8, .2, 1) both; }
.ct-mcard.D { border-top-color: var(--mx); }
.ct-mcard header { display: grid; grid-template-columns: auto 1fr auto; gap: 9px; align-items: center; }
.ct-mcard .big { font-family: var(--display); font-weight: 900; font-size: 30px; line-height: .9; color: var(--mo); min-width: 22px; text-align: center; }
.ct-mcard.D .big { color: var(--mx); }
.ct-mcard h5 { margin: 0; font-family: var(--display); font-size: 15px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--paper); }
.ct-mcard h5 em { font-style: normal; font-size: 9px; letter-spacing: .1em; padding: 1px 5px; margin-left: 5px; border-radius: 4px; background: rgba(160, 120, 255, .25); color: var(--violet); vertical-align: middle; }
.ct-mcard header small { color: var(--mute); font-size: 9px; }
.ct-mcard .x { width: 22px; height: 22px; border-radius: 6px; font-size: 13px; color: var(--mute); }
.ct-mcard .x:hover { background: var(--ice-dim); color: var(--paper); }
.ct-mcard .inst { margin: 7px 0 6px; font-family: var(--body); font-style: italic; font-size: 11px; line-height: 1.35; color: var(--mute); }
.ct-mcard .spark { display: block; width: 100%; height: 26px; margin: 2px 0 4px; overflow: visible; }
.ct-mcard .spark path { fill: none; stroke: var(--mo); stroke-width: 1.2; opacity: .8; } .ct-mcard.D .spark path { stroke: var(--mx); }
.ct-mcard .spark line { stroke: var(--paper); stroke-width: 1; opacity: .7; }
.ct-mcard .spark text { font-size: 7px; fill: var(--mute); font-family: var(--mono); }
.ct-mcard dl { display: grid; grid-template-columns: 74px 1fr; gap: 1px 8px; margin: 0; }
.ct-mcard dt { color: var(--mute); text-transform: uppercase; letter-spacing: .06em; font-size: 8px; padding-top: 1px; }
.ct-mcard dd { margin: 0; color: var(--paper); overflow-wrap: anywhere; }
.ct-mcard dd.hot { color: var(--hi); } .ct-mcard dd.good { color: var(--good); } .ct-mcard dd.bad { color: var(--bad); }
.ct-mcard h6 { margin: 8px 0 3px; font-size: 8px; letter-spacing: .14em; text-transform: uppercase; color: var(--mute); font-weight: 600; display: flex; justify-content: space-between; }
.ct-mcard ol { margin: 0; padding: 0; list-style: none; display: grid; gap: 3px; }
.ct-mcard ol li { position: relative; padding: 2px 5px 3px 7px; border-radius: 5px; overflow: hidden; }
.ct-mcard ol li i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--ice-dim); z-index: -1; transition: width .3s; }
.ct-mcard ol li b { display: flex; justify-content: space-between; gap: 6px; color: var(--paper); font-weight: 600; }
.ct-mcard ol li b span { color: var(--mute); font-weight: 400; }
.ct-mcard ol li small { display: block; color: var(--mute); font-size: 8.5px; }
.ct-mcard ol li:first-child b { color: var(--good); }

.ct-mtable { position: absolute; z-index: 6; right: 14px; top: 100px; max-height: calc(100% - 260px); width: min(640px, calc(100% - 28px)); overflow: auto; pointer-events: auto; border-radius: 12px;
  background: var(--mcard); border: 1px solid var(--mline); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); font-family: var(--mono); font-size: 9.5px; animation: ct-mind-in .3s both; }
.ct-mtable table { border-collapse: collapse; width: 100%; }
.ct-mtable th { position: sticky; top: 0; background: var(--mcard); text-align: left; padding: 6px 7px; font-size: 8px; letter-spacing: .1em; text-transform: uppercase; color: var(--mute); font-weight: 600; cursor: pointer; user-select: none; white-space: nowrap; }
.ct-mtable th.on { color: var(--paper); } .ct-mtable th.on::after { content: ' ↓'; } .ct-mtable th.on.up::after { content: ' ↑'; }
.ct-mtable td { padding: 3px 7px; border-top: 1px solid var(--mline); color: var(--paper); white-space: nowrap; max-width: 170px; overflow: hidden; text-overflow: ellipsis; }
.ct-mtable td:first-child { font-family: var(--display); font-weight: 900; font-size: 13px; color: var(--mo); cursor: pointer; }
.ct-mtable tr.D td:first-child { color: var(--mx); }
.ct-mtable tr.ball td:first-child::after { content: ' ●'; font-size: 8px; color: var(--hi); }
.ct-mtable td.n { text-align: right; font-variant-numeric: tabular-nums; }
@keyframes ct-mind-in { from { opacity: 0; transform: translateY(-6px); } }

/* phones and narrow hosts: smaller chips (just who and what), the card as a sheet, one at a time */
@container (max-width: 640px) {
  .ct .ct-mc { font-size: 7.5px; max-width: 96px; padding: 2px 4px; }
  .ct-mc .m { display: none; } .ct-mc .k { font-size: 11px; grid-row: auto; }
  .ct-mbar { top: calc(max(10px, env(safe-area-inset-top)) + 88px); font-size: 8.5px; } .ct-mbar span { display: none; }
  .ct-mdock { left: 6px; right: 6px; top: auto; bottom: calc(66px + env(safe-area-inset-bottom)); width: auto; max-height: 50cqh; z-index: 9; }
  .ct-mcard { border-radius: 16px; font-size: 10px; flex: 1 1 auto; overflow-y: auto; scrollbar-width: none; }
  .ct-mcard:not(:last-child) { display: none; }
  .ct-mlead { display: none; }
  .ct-mtable { left: 8px; right: 8px; width: auto; top: calc(max(10px, env(safe-area-inset-top)) + 122px); max-height: 50cqh; }
}
@media (prefers-reduced-motion: reduce) { .ct-mbar, .ct-mcard, .ct-mtable { animation: none; } }
`;

const f1 = v => (v == null ? '—' : v >= 50 ? '50+' : v.toFixed(1));
const deg = v => (v == null ? '—' : Math.round(v) + '°');
// the table's columns: [label, value from telemetry for sorting, text]
const COLS = [
  ['Player', null], ['Side', T => T.side], ['Doing', null], ['x, y', T => T.x], ['Speed', T => T.speed], ['Dist', T => T.dist],
  ['Space / man', T => (T.off ? T.off.space : T.def ? T.def.toMan : null)], ['Lane', T => (T.off ? T.off.lane : null)], ['Ball', T => (T.ball ? 1 : 0)]
];

let styled = false;
export function createMind(o) {
  if (!styled && typeof document !== 'undefined' && !document.querySelector('style[data-chalk-talk-mind]')) { const s = document.createElement('style'); s.dataset.chalkTalkMind = ''; s.textContent = CSS; document.head.appendChild(s); styled = true; }
  const { root } = o, esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const layer = document.createElement('div'); layer.className = 'ct-mind'; layer.hidden = true;
  layer.innerHTML = `<svg class="ct-mlead" aria-hidden="true"></svg><div class="ct-mchips"></div>
    <div class="ct-mbar" role="toolbar" aria-label="Mind view"><b>MIND<i>·</i>VIEW</b><span data-m="clock"></span><span data-m="cost"></span>
      <button type="button" data-m="table" title="Every player in one sortable table">Table</button><button type="button" data-m="fold" title="Close every card">Fold</button><button type="button" class="x" data-m="off" aria-label="Close the mind view (V)">×</button></div>
    <div class="ct-mdock" aria-live="off"></div><div class="ct-mtable" hidden></div>`;
  root.appendChild(layer);
  const $ = s => layer.querySelector(s), lead = $('.ct-mlead'), chipsEl = $('.ct-mchips'), dock = $('.ct-mdock'), tableEl = $('.ct-mtable');
  const clockEl = $('[data-m=clock]'), costEl = $('[data-m=cost]'), tableBtn = $('[data-m=table]');

  let on = false, sim = null, F = null, chips = [], cards = new Map(), table = null, last = [], lastText = 0, lastReads = 0, dirty = true, rects = true;
  const cost = { frame: 0, text: 0, max: 0, n: 0 };
  const sort = { col: 4, up: false };
  const nameAt = i => o.nameOf(sim.players[i].id), nm = id => o.nameOf(id);

  // ---- building: once per play (or when the view opens) ----
  function build() {
    sim = o.sim(); dirty = false;
    if (!sim) return;
    const sport = o.sport(); F = facts(sim, sport);
    chipsEl.textContent = '';
    chips = sim.players.map((p, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ct-mc ' + p.side + (p.smart ? ' smart' : ''); b.dataset.i = i;
      b.innerHTML = `<b class="k"></b><span class="d"></span><span class="m"><i class="hd">↑</i><span class="v"></span></span>`;
      b.querySelector('.k').textContent = nm(p.id);
      b.setAttribute('aria-label', 'Open the mind of ' + nm(p.id));
      chipsEl.appendChild(b);
      return { el: b, d: b.querySelector('.d'), v: b.querySelector('.v'), hd: b.querySelector('.hd'), x: NaN, y: NaN, s: {}, cls: '' };
    });
    // cards survive a reload of the same players (defense on/off, an AI brain taking over)
    const keep = Array.from(cards.keys()).filter(id => sim.idx[id] != null);
    cards.forEach(c => c.el.remove()); cards = new Map(); lead.textContent = '';
    keep.forEach(id => openCard(sim.idx[id], true));
    if (table) buildTable();
    last = []; lastText = 0; lastReads = 0;
  }
  chipsEl.addEventListener('click', e => { const b = e.target.closest('.ct-mc'); if (b) toggleCard(+b.dataset.i); });

  // ---- the full card: what one player sees and thinks ----
  const ROWS_ALL = [['pos', 'Position'], ['vel', 'Speed'], ['dist', 'Distance'], ['now', 'Doing'], ['route', 'Route'], ['auto', 'Decided'], ['ball', 'Ball'], ['thought', 'Thinking']];
  const ROWS_D = [['job', 'Job'], ['man', 'Man'], ['zone', 'Zone'], ['screen', 'Screened'], ['beaten', 'Beaten'], ['help', 'Help'], ['react', 'Reaction'], ['toBall', 'To ball']];
  const ROWS_O = [['space', 'Space'], ['open', 'Openness'], ['lane', 'Lane'], ['guards', 'Guarded by'], ['toBall', 'To ball'], ['qb', 'Progression'], ['read', 'QB read']];
  function toggleCard(i) { const id = sim.players[i].id; if (cards.has(id)) closeCard(id); else openCard(i); }
  function openCard(i, quiet) {
    const p = sim.players[i], sport = o.sport(), br = F.brain[i];
    if (cards.size >= MAX_CARDS) closeCard(cards.keys().next().value);
    const el = document.createElement('section'); el.className = 'ct-mcard ' + p.side; el.setAttribute('aria-label', 'Mind of ' + nm(p.id));
    const rows = ROWS_ALL.concat(p.side === 'D' ? ROWS_D : ROWS_O);
    el.innerHTML = `<header><span class="big">${esc(nm(p.id))}</span><div><h5>${esc(br.name)}${p.smart ? '<em>AI</em>' : ''}</h5>
      <small>${esc(p.id)} · ${p.side === 'O' ? 'offense' : 'defense'}${p.role ? ' · ' + esc(p.role) : ''} · ${esc(sport.unit)}</small></div><button type="button" class="x" aria-label="Close">×</button></header>
      ${br.instincts ? `<p class="inst">${esc(br.instincts)}</p>` : ''}
      <svg class="spark" viewBox="0 0 240 26" preserveAspectRatio="none" aria-hidden="true"><path></path><line y1="0" y2="24"></line><text x="0" y="7"></text></svg>
      <dl>${rows.map(([k, l]) => `<dt data-k="${k}">${l}</dt><dd data-k="${k}"></dd>`).join('')}</dl>
      <h6><span>Best reads right now</span><span data-k="rt"></span></h6><ol>${[0, 1, 2].map(() => '<li><i></i><b><em></em><span></span></b><small></small></li>').join('')}</ol>`;
    el.querySelector('.x').onclick = () => closeCard(p.id);
    // speed over the whole play, drawn once; a cursor rides it
    const prof = speedProfile(F, i, 60), top = Math.max(0.01, F.vmax[i]);
    el.querySelector('.spark path').setAttribute('d', 'M' + Array.from(prof, (v, j) => (j / 59 * 240).toFixed(1) + ' ' + (24 - Math.min(1, v / top) * 22).toFixed(1)).join('L'));
    el.querySelector('.spark text').textContent = 'top ' + (F.vmax[i] / 2.4).toFixed(1) + ' ' + sport.unit + '/s';
    const kv = {}; el.querySelectorAll('dd').forEach(d => { kv[d.dataset.k] = { dd: d, dt: d.previousElementSibling, v: undefined, c: '' }; });
    const reads = Array.from(el.querySelectorAll('ol li')).map(li => ({ li, bar: li.querySelector('i'), t: li.querySelector('em'), s: li.querySelector('b span'), w: li.querySelector('small') }));
    dock.appendChild(el);
    const path = document.createElementNS(SVGNS, 'path'); path.setAttribute('class', p.side); lead.appendChild(path);
    cards.set(p.id, { i, el, kv, reads, cursor: el.querySelector('.spark line'), rt: el.querySelector('[data-k=rt]'), path, rect: null });
    chips[i] && chips[i].el.classList.add('pin');
    rects = true; lastText = 0; lastReads = 0;
    if (!quiet) o.track && o.track('mind_card', { side: p.side });
  }
  function closeCard(id) {
    const c = cards.get(id); if (!c) return;
    c.el.remove(); c.path.remove(); cards.delete(id); rects = true;
    chips[c.i] && chips[c.i].el.classList.remove('pin');
  }
  const set = (row, text, cls) => {
    if (!row) return;
    const hide = text == null;
    if (row.v !== text) { row.v = text; if (!hide) row.dd.textContent = text; row.dd.hidden = row.dt.hidden = hide; }
    if (cls !== undefined && row.c !== cls) { row.c = cls; row.dd.className = cls; }
  };
  function fillCard(c, T, t) {
    const k = c.kv, u = T.unit, b = T.ball, sp = o.sport();
    set(k.pos, `${T.x.toFixed(1)}, ${T.y.toFixed(1)} ${u}`);
    set(k.vel, `${T.speed.toFixed(1)} ${u}/s · ${T.heading == null ? 'still' : deg(T.heading) + ' (0° = to goal)'}`);
    set(k.dist, `${T.dist.toFixed(1)} of ${T.total.toFixed(1)} ${u} this play`);
    set(k.now, doing(T, nm) + (T.beat != null ? ` · step ${T.beat + 1}` : ''));
    set(k.route, T.route ? `${T.route.auto ? 'auto ' : ''}${T.route.kind} ${Math.round(T.route.done * 100)}% of ${T.route.len.toFixed(0)} ${u} · leg ${T.route.n}/${T.route.of}` : null);
    set(k.auto, T.auto, 'hot');
    set(k.ball, b ? b.text : null, b ? 'hot' : '');
    set(k.thought, T.thought ? '“' + T.thought + '”' : null);
    const d = T.def, f = T.off;
    if (d) {
      set(k.job, (d.job ? d.job.text.replace(/\b([OX][1-9])\b/g, m => nm(m)) : '—') + (d.auto ? ' · on its own' : ' · scripted move'));
      set(k.man, d.man ? `${nm(d.man)} · ${f1(d.toMan)} ${u} away${d.manHasBall ? ' · has the ball' : ''}` : null);
      set(k.zone, d.zoneRect ? `${d.zone}: x ${d.zoneRect[0].toFixed(0)}…${d.zoneRect[2].toFixed(0)}, y ${d.zoneRect[1].toFixed(0)}…${d.zoneRect[3].toFixed(0)}` : null);
      set(k.screen, d.screenedBy ? 'stuck on ' + nm(d.screenedBy) : 'no', d.screenedBy ? 'bad' : '');
      set(k.beaten, d.beaten ? 'yes: trailing, the pass is open' : 'no', d.beaten ? 'bad' : '');
      set(k.help, d.help ? 'rotating to stop the drive' : null, 'hot');
      set(k.react, `${d.react} beat lag (${d.reactS.toFixed(2)} s): guards what it saw`);
      set(k.toBall, d.toBall == null ? null : f1(d.toBall) + ' ' + u);
    } else if (f) {
      set(k.space, f.space == null ? 'no defense' : `${f1(f.space)} ${u} · nearest ${nm(f.nearest)}`);
      set(k.open, f.open ? `${f.open} (${(f.ratio * 100).toFixed(0)}% of the ${sp.open} ${u} it takes)` : null, f.open === 'open' ? 'good' : f.open === 'covered' ? 'bad' : '');
      set(k.lane, f.lane == null ? null : `${f1(f.lane)} ${u} from the ball · ${f.laneOk ? 'clear' : 'tight'}`, f.laneOk ? 'good' : f.laneOk === false ? 'bad' : '');
      set(k.guards, f.guards.length ? f.guards.map(nm).join(', ') : null);
      set(k.toBall, f.toBall == null ? null : f1(f.toBall) + ' ' + u);
      const q = T.fb;
      set(k.qb, q && q.qb ? q.order.map((id, n) => (n === q.now ? '[' + nm(id) + ']' : nm(id))).join(' › ') + (q.startsIn ? ` · eyes up in ${q.startsIn.toFixed(1)} s` : q.now < 0 ? ' · done' : '') : null);
      set(k.read, q && !q.qb ? `#${q.read} of ${q.of}${q.now ? ' · the QB is reading you now' : q.past ? ' · passed over' : ''} · ${q.open}` : null, q && q.now ? 'hot' : '');
    }
    const span = Math.max(0.001, sim.beats);
    c.cursor.setAttribute('x1', (Math.min(1, t / span) * 240).toFixed(1)); c.cursor.setAttribute('x2', (Math.min(1, t / span) * 240).toFixed(1));
  }
  function fillReads(c, t) {
    const R = bestReads(sim, o.sport(), t, c.i, nameAt);
    c.reads.forEach((r, n) => {
      const x = R[n];
      r.li.hidden = !x; if (!x) return;
      if (r.t.textContent !== x.text) r.t.textContent = x.text;
      const sc = x.score.toFixed(2); if (r.s.textContent !== sc) r.s.textContent = sc;
      if (r.w.textContent !== x.why) r.w.textContent = x.why;
      r.bar.style.width = Math.max(4, Math.min(100, x.score / 3.5 * 100)).toFixed(0) + '%';
    });
    c.rt.textContent = 'step ' + (Math.min(sim.beats, Math.floor(t)) + 1);
  }

  // ---- the table of everyone ----
  function buildTable() {
    tableEl.innerHTML = `<table><thead><tr>${COLS.map(([l], j) => `<th data-c="${j}" class="${j === sort.col ? 'on' + (sort.up ? ' up' : '') : ''}">${l}</th>`).join('')}</tr></thead><tbody></tbody></table>`;
    const body = tableEl.querySelector('tbody');
    table = { body, order: '', rows: sim.players.map((p, i) => {
      const tr = document.createElement('tr'); tr.className = p.side; tr.dataset.i = i;
      tr.innerHTML = COLS.map((c, j) => `<td class="${j >= 3 && j !== 8 ? 'n' : ''}"></td>`).join('');
      tr.firstChild.textContent = nm(p.id); tr.children[1].textContent = p.side === 'O' ? 'O' : 'D';
      body.appendChild(tr);
      return { tr, td: Array.from(tr.children), s: [], key: 0 };
    }) };
  }
  tableEl.addEventListener('click', e => {
    const th = e.target.closest('th');
    if (th) { const j = +th.dataset.c; if (sort.col === j) sort.up = !sort.up; else { sort.col = j; sort.up = false; } tableEl.querySelectorAll('th').forEach((h, n) => { h.className = n === sort.col ? 'on' + (sort.up ? ' up' : '') : ''; }); table.order = ''; lastText = 0; return; }
    const tr = e.target.closest('tr[data-i]'); if (tr && e.target.closest('td:first-child')) toggleCard(+tr.dataset.i);
  });
  function fillTable(all) {
    const u = o.sport().unit;
    all.forEach((T, i) => {
      const r = table.rows[i], f = T.off, d = T.def;
      const txt = [null, null, doing(T, nm), `${T.x.toFixed(1)}, ${T.y.toFixed(1)}`, T.speed.toFixed(1) + ' ' + u + '/s', T.dist.toFixed(1), f ? (f.space == null ? '—' : f1(f.space) + ' ' + (f.open || '')) : d && d.man ? f1(d.toMan) + ' → ' + nm(d.man) : d && d.job ? d.job.label : '—', f && f.lane != null ? f1(f.lane) : '—', T.ball ? T.ball.state : ''];
      for (let j = 2; j < txt.length; j++) if (r.s[j] !== txt[j]) { r.s[j] = txt[j]; r.td[j].textContent = txt[j]; }
      const ball = !!(T.ball && T.ball.state === 'holding'); if (r.ball !== ball) { r.ball = ball; r.tr.classList.toggle('ball', ball); }
      const get = COLS[sort.col][1]; r.key = get ? get(T) : sort.col === 2 ? txt[2] : T.id;
    });
    // re-order the rows only when the order changes
    const ord = table.rows.slice().sort((a, b) => {
      const x = a.key, y = b.key, nx = x == null, ny = y == null;
      if (nx || ny) return nx - ny;
      const v = typeof x === 'string' ? x.localeCompare(y) : x - y; return sort.up ? v : -v;
    });
    const sig = ord.map(r => r.tr.dataset.i).join(',');
    if (sig !== table.order) { table.order = sig; ord.forEach(r => table.body.appendChild(r.tr)); }
  }

  // ---- every frame: follow the players; ~9 Hz: the numbers; ~3 Hz: the reads ----
  function tick(now) {
    if (!on) return;
    const t0 = performance.now();
    const hide = root.classList.contains('ct-quiz') || root.classList.contains('ct-sketch') || root.classList.contains('ct-present-on');   // no hints in the game; out of the way while sketching or presenting
    if (layer.hidden !== hide) layer.hidden = hide;
    if (hide) return;
    if (dirty || o.sim() !== sim) build();
    const marks = o.marks(); if (!sim || !marks) return;
    // chips ride next to each mark (read from the ink this frame drew: the drawn, eased-apart spots)
    for (let i = 0; i < chips.length; i++) {
      const m = marks[i], c = chips[i]; if (!m) continue;
      const x = m.hot.cx.baseVal.value, y = m.hot.cy.baseVal.value, r = m.hot.r.baseVal.value;
      const cx = x + r * 0.95, cy = y;
      // (NaN at first: always placed)
      if (!(Math.abs(cx - c.x) <= 0.3 && Math.abs(cy - c.y) <= 0.3)) { c.x = cx; c.y = cy; c.el.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`; }
    }
    const t = sim.time();
    if (now - lastText >= TEXT_MS) {
      lastText = now;
      const t1 = performance.now(), sport = o.sport(), V = o.vision ? o.vision() : null;
      last = telemetryAll(sim, sport, t, F, V ? { mode: V.mode, side: V.side } : null);
      for (let i = 0; i < chips.length; i++) {
        const T = last[i], c = chips[i], s = c.s;
        const d = doing(T, nm);
        if (s.d !== d) { s.d = d; c.d.textContent = d; }
        const v = T.speed.toFixed(1) + (T.off && T.off.space != null ? ' · sp ' + f1(T.off.space) : T.def && T.def.man ? ' · ' + f1(T.def.toMan) + '→' + nm(T.def.man) : '');
        if (s.v !== v) { s.v = v; c.v.textContent = v; }
        // heading on screen: the field direction, projected (the view can be orbited)
        let rot = null;
        if (T.heading != null && o.project) { const a = o.project(T.x, T.y), b = o.project(T.x + T.vx * 0.2, T.y + T.vy * 0.2); rot = Math.round(Math.atan2(b.x - a.x, a.y - b.y) * 180 / Math.PI); }
        if (s.rot !== rot) { s.rot = rot; c.hd.classList.toggle('still', rot == null); if (rot != null) c.hd.style.rotate = rot + 'deg'; }
        const cls = (T.ball && T.ball.state === 'holding' ? ' ball' : '') + (T.off && T.off.open === 'open' && last.some(x => x.def) ? ' open' : '') + (T.def && T.def.beaten ? ' beaten' : '') + (T.def && T.def.screenedBy ? ' screened' : '');
        if (c.cls !== cls) { ['ball', 'open', 'beaten', 'screened'].forEach(k => c.el.classList.toggle(k, cls.indexOf(' ' + k) >= 0)); c.cls = cls; }
      }
      cards.forEach(c => fillCard(c, last[c.i], t));
      if (table) fillTable(last);
      clockEl.textContent = `t ${t.toFixed(2)} · step ${Math.min(sim.beats, Math.floor(t) + 1)}/${sim.beats} · ${sim.players.length} players`;
      cost.text = cost.text * 0.8 + (performance.now() - t1) * 0.2;
      costEl.textContent = `${cost.frame.toFixed(2)} ms/frame avg · ${cost.text.toFixed(2)} ms/update · max ${cost.max.toFixed(1)}`;
    }
    if (cards.size && now - lastReads >= READS_MS) { lastReads = now; cards.forEach(c => fillReads(c, t)); }
    // leader lines from each open card to its player (card rects are read only when cards change)
    if (cards.size) {
      if (rects) { rects = false; const h = root.getBoundingClientRect(); cards.forEach(c => { const r = c.el.getBoundingClientRect(); c.rect = { x: r.right - h.left, y: r.top - h.top + 20 }; }); }
      cards.forEach(c => {
        const ch = chips[c.i]; if (!ch || !c.rect) return;
        const a = c.rect, bx = ch.x, by = ch.y, mx = (a.x + bx) / 2;
        c.path.setAttribute('d', `M${a.x.toFixed(0)} ${a.y.toFixed(0)}C${mx.toFixed(0)} ${a.y.toFixed(0)} ${mx.toFixed(0)} ${by.toFixed(0)} ${bx.toFixed(0)} ${by.toFixed(0)}`);
      });
    }
    const ms = performance.now() - t0;
    cost.frame = cost.frame * 0.95 + ms * 0.05; cost.n++; if (cost.n > 30) cost.max = Math.max(cost.max * 0.999, ms);
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { rects = true; }) : null;
  if (ro) { ro.observe(dock); ro.observe(root); }
  dock.addEventListener('scroll', () => { rects = true; }, { passive: true });

  function toggle(v) {
    on = v == null ? !on : !!v;
    layer.hidden = !on;
    if (on) { dirty = true; lastText = 0; cost.max = 0; cost.n = 0; } else { cards.forEach((c, id) => closeCard(id)); }
    o.onChange && o.onChange(on);
    o.track && o.track('mind', { on: on ? 1 : 0 });
    return on;
  }
  layer.querySelector('.ct-mbar').addEventListener('click', e => {
    const b = e.target.closest('[data-m]'); if (!b) return;
    const k = b.dataset.m;
    if (k === 'off') toggle(false);
    if (k === 'fold') Array.from(cards.keys()).forEach(closeCard);
    if (k === 'table') { const show = tableEl.hidden; tableEl.hidden = !show; tableBtn.classList.toggle('on', show); if (show) { buildTable(); lastText = 0; } else { table = null; tableEl.textContent = ''; } }
  });

  return {
    get on() { return on; },
    toggle, tick,
    rebuild() { dirty = true; },     // a new play is on the board: rebuilt on the next tick, if the view is on
    stats: () => Object.assign({}, cost),
    destroy() { ro && ro.disconnect(); layer.remove(); }
  };
}
