// Chalk Talk on a page: mount(element, options) draws the whole board inside one element, so
// it runs full screen on its own site and inside a host app (CourtIQ Labs) alike, for any sport.
//
// Two layers: aurora particles are the light (the field, glowing marks, routes that draw
// themselves), and a crisp SVG "ink" layer on top is the exact whiteboard: O's and X's with
// their numbers or letters, the ball, and routes in standard line language.

import AuroraField from 'aurora-field';
import { playShape, view, particleBudget } from './engine/field.js';
import { normalize, compile, life } from './engine/sim.js';
import { getSport, sports, sportFor } from './sports/index.js';
import { listener, say, hush, understand, prefetch, voiceKey, voiceKind, voiceErrors, localVoiceName } from './voice.js';
import { drawPlay, smartPlayers, setApi, key, keyKind, NAMES } from './ai.js';
import { CSS } from './style.js';
import { ROUTE_TREE, routeNamed, applyRoute, applyCoverage, coverages, coverageNamed, zoneRect, progression, readStart, READ_STEP, separation, openness, findOpen, throwTo } from './engine/football.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z"/></svg>';
const TEMPLATE = `
<div class="ct-stage"><canvas class="ct-court" aria-label="The field drawn in light, with the play's X's and O's"></canvas><svg class="ct-ink" data-r="ink"></svg><div class="ct-labels" data-r="labels"></div></div>
<header class="ct-top">
  <div class="ct-word">Chalk <i>Talk</i> <small>Say the play. Watch it draw.</small></div>
  <div class="ct-sports" data-r="sports" role="tablist" aria-label="Sport"></div>
  <span class="ct-sp"></span>
  <button class="ct-pill" data-r="viewBtn" title="Orbit, zoom and lock the view">View</button>
  <button class="ct-pill" data-r="namesBtn" title="Show your players' names (saved on this device only)" hidden>Names</button>
  <button class="ct-pill" data-r="sketchBtn" title="Draw it yourself (or just use a pencil), then let the AI take over">Sketch</button>
  <button class="ct-pill" data-r="defBtn" title="Add defenders who guard on their own">Defense</button>
  <button class="ct-pill" data-r="infoBtn">About this play</button>
  <button class="ct-pill" data-r="narrate" aria-pressed="true" title="The broadcaster calls each step">Call it</button>
  <button class="ct-pill ct-keypill" data-r="keyBtn" title="Your AI key">AI</button>
</header>
<div class="ct-view" data-r="viewPop" hidden>
  <div class="ct-vrow"><span>View</span><button data-p="coach">Coach</button><button data-p="top">Top-down</button><button data-p="side">Sideline</button></div>
  <div class="ct-vrow"><span>Zoom</span><button data-z="-1">−</button><button data-z="0">Fit</button><button data-z="1">+</button></div>
  <button class="ct-lock" data-r="lockBtn">Lock this view</button>
  <p class="ct-fine">Drag the field to orbit, scroll or pinch to zoom, then lock it. Saved for each sport on this device.</p>
</div>
<div class="ct-sketchbar" data-r="sketchbar">
  <span data-r="sketchHint">Drag from a player to draw · tap the field to add one</span>
  <button data-r="addO" class="on">+ O</button><button data-r="addX">+ X</button>
  <button data-r="undo">Undo</button><button data-r="wipe">Clear</button>
  <button class="go" data-r="done">Done</button>
</div>
<nav class="ct-lib" data-r="lib" aria-label="Concepts"></nav>
<aside class="ct-card" aria-live="polite">
  <div class="ct-eyebrow" data-r="concept"></div>
  <h1 data-r="title"></h1>
  <p data-r="summary"></p>
  <div class="ct-ai" data-r="aiCard" hidden></div>
  <h2>Say it like this</h2>
  <ul class="ct-cues" data-r="cues"></ul>
  <h2 data-r="readsHead">Options</h2>
  <ul class="ct-reads" data-r="reads"></ul>
</aside>
<div class="ct-legend" data-r="legend"></div>
<div class="ct-fb" data-r="fb" hidden>
  <div class="ct-fbrow"><span>Routes</span><button data-r="routeBtn">Route tree</button></div>
  <div class="ct-fbrow"><span>Coverage</span><div data-r="covs"></div></div>
  <div class="ct-fbrow"><span>QB eyes</span><div data-r="eyes"><button data-v="off" class="on">Off</button><button data-v="half">Half field</button><button data-v="full">Full field</button><button data-v="side" title="Which side the QB reads first">→</button></div></div>
  <button class="ct-open" data-r="openBtn">Find the open man</button>
</div>
<div class="ct-dock">
  <div class="ct-caption" data-r="caption" aria-live="polite"></div>
  <div class="ct-transport">
    <button data-r="prev" aria-label="Previous step">◀︎</button>
    <button data-r="playBtn" aria-label="Play or pause">❚❚</button>
    <div class="ct-dots" data-r="dots"></div>
    <button data-r="next" aria-label="Next step">▶︎</button>
    <button class="ct-speed" data-r="speed" aria-label="Speed">1×</button>
  </div>
  <div class="ct-talk">
    <button class="ct-mic" data-r="mic" aria-label="Talk: tap, say the play, tap again">${MIC}</button>
    <div class="ct-said">
      <div class="ct-heard" data-r="heard"></div>
      <form data-r="ask"><input data-r="askText" autocomplete="off" enterkeyhint="go"></form>
      <div class="ct-status" data-r="status"></div>
    </div>
  </div>
</div>
<div class="ct-toast" data-r="toast" role="status"></div>
<dialog class="ct-dlg" data-r="keyDlg">
  <form data-r="keyForm" method="dialog">
    <h3>Bring your own key</h3>
    <p data-r="keyWhy"></p>
    <label>Play key <span class="ct-badge" data-r="keyBadge"></span></label>
    <input data-r="keyInput" type="password" placeholder="paste it here: sk-ant-… or sk-…" autocomplete="off" spellcheck="false">
    <p class="ct-fine">Draws plays from your own words and sketches. Get one from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">Claude</a> or <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI</a>; we can tell which. It stays in this browser and goes only to them.</p>
    <label>Broadcaster voice key <span class="ct-badge" data-r="voiceBadge"></span></label>
    <input data-r="voiceInput" type="password" placeholder="optional: OpenAI sk-… or ElevenLabs sk_…" autocomplete="off" spellcheck="false">
    <p class="ct-fine" data-r="voiceFine"></p>
    <menu><button type="button" data-r="keyClear">Forget keys</button><button type="button" data-r="keyCancel">Cancel</button><button value="save">Save</button></menu>
  </form>
</dialog>`;

const HINTS = {
  basketball: ['Tap the mic (or hold space) and say a play: “1 dribbles to the right wing, 5 sets the ball screen…”', '…or type it: run Spain pick and roll'],
  flag5: ['Tap the mic (or hold space) and say a play: “Z runs a slant, Y runs to the flat, QB reads the flat defender…”', '…or type it: show me mesh'],
  flag7: ['Tap the mic (or hold space) and say a play: “Trips right, X runs a post, the slot runs a dig…”', '…or type it: show me four verticals']
};

let styled = false;
export function mount(root, options) {
  const opts = Object.assign({ sport: 'basketball', sports: null, play: null, narrate: true, fullscreen: false, title: true, glossary: '', api: null, team: 'default' }, options || {});
  if (opts.api) setApi(opts.api);
  if (!styled && !document.querySelector('style[data-chalk-talk]')) { const s = document.createElement('style'); s.dataset.chalkTalk = ''; s.textContent = CSS; document.head.appendChild(s); styled = true; }
  root.classList.add('ct'); if (opts.fullscreen) root.classList.add('ct-full');
  root.innerHTML = TEMPLATE;
  if (!opts.title) root.querySelector('.ct-word').remove();
  const R = {}; root.querySelectorAll('[data-r]').forEach(el => { R[el.dataset.r] = el; });
  const canvas = root.querySelector('.ct-court');
  const allowed = (opts.sports || sports().map(s => s.id)).map(id => getSport(id)).filter((s, i, a) => a.indexOf(s) === i);
  const state = { sport: sportFor(opts.sport), play: null, raw: null, sim: null, loads: 0, narrate: opts.narrate, defense: false, readsOn: false, busy: null, sketch: null, libKey: null, vision: { mode: 'off', side: 1 }, routeMode: false, view: { pose: null, zoom: 1, locked: false } };
  if (allowed.indexOf(state.sport) < 0) state.sport = allowed[0];
  let field = null, raf = 0, dead = false, toShape = view(state.sport);
  const speak = (t, local) => { if (state.narrate) say(t, key.get(), { local }); };
  // the play read aloud: cloud voices only ever hear positions; the on-device voice may use names
  const speakBeat = text => speak(spoken(text, false), state.showNames ? spoken(text, true) : null);
  voiceErrors(m => toast(m));

  // ---- your players' names: on this device only, never sent anywhere ----
  const namesKey = () => 'chalktalk.names.' + opts.team + '.' + state.sport.id;
  const names = {
    all() { try { return JSON.parse(localStorage.getItem(namesKey()) || '{}'); } catch (e) { return {}; } },
    set(id, n) { const a = names.all(); n = String(n || '').trim().slice(0, 24); if (n) a[id] = n; else delete a[id]; try { localStorage.setItem(namesKey(), JSON.stringify(a)); } catch (e) {} },
    any() { return Object.keys(names.all()).length > 0; }
  };
  try { state.showNames = localStorage.getItem('chalktalk.showNames') === '1'; } catch (e) { state.showNames = false; }

  // ---- the field ----
  function makeField(name) {
    if (field) field.destroy();
    field = AuroraField.create(canvas, {
      container: root.querySelector('.ct-stage'), shapes: [name], initial: name,
      count: particleBudget, cycle: 0, intro: 900, stars: 60, autonomy: 0.35, depth: 3.4, interactive: true, blank: true, seed: 7,
      palette: { preset: 'ice', accent: [255, 142, 58], signal: [255, 190, 120] }, maxDpr: 2, quality: 'auto',
      radius: (w, h) => (w < 700 ? Math.min(w * 0.6, h * 0.42) : Math.min(w * 0.4, h * 0.5))
    });
    state.loads = 0;
    applyView();
  }

  // ---- loading a play onto the board ----
  function load(raw, o) {
    o = o || {};
    const sport = state.sport, n = normalize(raw, sport);
    if (!n.ok) { toast(n.errors[0] || 'That play did not make sense.'); return false; }
    const play = n.play, sim = compile(play, sport, { defense: state.defense });
    const name = 'chalk:' + sport.id + ':' + Math.random().toString(36).slice(2);
    sim.onBeat(onBeat);
    AuroraField.register(name, playShape(sim, { trace: !field }));
    // a field keeps every shape it has shown; start a fresh one now and then so long sessions stay light
    if (!field || state.loads > 24) makeField(name);
    else { field.add([name]); field.setShape(name, { pin: 1e9 }); }
    state.loads++;
    state.play = sim.play; state.raw = raw; state.sim = sim; state.readsOn = false; state.libKey = o.key || null;
    buildInk(); renderPlay(); renderDots(); renderFootball();
    R.lib.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.key === o.key));
    if (o.at != null) { sim.seek(o.at); sim.playing(false); renderDots(); }
    if (!o.quiet && state.narrate) prefetch([o.say].concat(play.beats.map(b => b.say)).map(spoken), key.get());
    if (o.say && !o.quiet) speak(spoken(o.say));
    if (!o.keepAI) R.aiCard.hidden = true;
    opts.onLoad && opts.onLoad(sim.play, sport);
    return true;
  }

  function setSport(s) {
    if (s === state.sport) return;
    state.sport = s; toShape = view(s); state.sketch = null; root.classList.remove('ct-sketch'); R.sketchBtn.classList.remove('on');
    state.routeMode = false; state.vision.mode = 'off'; state.view = loadView();
    renderSports(); renderLibrary(); renderLegend(); renderHints();
    const first = s.plays[0]; load(first, { key: first.key, say: s.name + '. ' + first.title + '.' }); applyView();
    opts.onSport && opts.onSport(s.id);
  }

  function onBeat(k) {
    const sim = state.sim; if (!sim || state.sketch) return;
    const info = sim.beatInfo(k);
    if (info) { R.caption.innerHTML = `<span class="ct-n">${k + 1}</span>${mark(info.say)}`; R.caption.classList.remove('end'); if (sim.playing()) speakBeat(info.say); }
    else { R.caption.innerHTML = `<span class="ct-n">✓</span>${state.play.reads.length ? 'Options on this play' : 'That\'s the play.'}`; R.caption.classList.add('end'); }
    state.readsOn = !info;
    renderDots(); renderReads(); renderThoughts(k);
  }
  // what players are thinking this beat: AI players' reads, and the autonomous ones' decisions
  function renderThoughts(k) {
    if (!ink) return;
    const sim = state.sim, info = sim.beatInfo(k), say = {};
    if (info) {
      info.actions.forEach(a => { if (a.thought) say[a.who] = a.thought; });
      Object.assign(say, info.thoughts || {});
      sim.notes.forEach(n => { if (n.beat === k && !say[n.who]) say[n.who] = n.why; });
      const pass = info.actions.find(a => state.sport.kinds[a.kind].type === 'pass' && a.kind !== 'snap');
      if (pass && ink.hasD) {
        const tc = k + 0.94, ri = sim.idx[pass.target];
        if (sim.space(tc, ri) < state.sport.open) {
          let best = -1, bs = state.sport.open;
          sim.players.forEach((p, i) => { if (p.side === 'O' && i !== ri && p.id !== pass.who && p.role !== 'C') { const v = sim.space(tc, i); if (v > bs) { bs = v; best = i; } } });
          if (best >= 0) {
            const who = sim.players[best].id;
            say[who] = "I'm open!";
            R.caption.insertAdjacentHTML('beforeend', ` <span class="ct-wrong">Wrong read: ${esc(nameOf(who))} was open.</span>`);
          }
        }
      }
    }
    ink.thinks.forEach((el, i) => { const t = say[sim.players[i].id]; el.textContent = t || ''; el.classList.toggle('on', !!t); });
  }

  // names the way the board shows them: "O4" reads as "4" in basketball, "Z" in football
  const byId = id => state.play && state.play.players.find(p => p.id === id);
  const posName = id => { const p = byId(id); return p ? state.sport.notation.name(p) : id; };
  const nameOf = id => (state.showNames && names.all()[id]) || posName(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mark = s => esc(s).replace(/\b([OX])([1-9])\b/g, (m, side, n) => byId(m) ? `<b class="ct-m ${side}">${esc(nameOf(m))}</b>` : m);
  const spoken = (s, withNames) => String(s || '').replace(/\b([OX])([1-9])\b/g, (m, side) => {
    const p = byId(m); if (!p) return m;
    if (withNames && names.all()[m]) return names.all()[m];
    const nm = state.sport.notation.name(p);
    return state.sport.id === 'basketball' ? (side === 'O' ? 'the ' + nm : 'X ' + m[1]) : nm === 'QB' ? 'the quarterback' : nm === 'C' ? 'the center' : nm;
  });

  function renderPlay() {
    const p = state.play;
    R.title.textContent = p.title; R.concept.textContent = (p.concept || 'Your play') + ' · ' + state.sport.short;
    R.summary.innerHTML = mark(p.summary || '');
    R.cues.innerHTML = p.cues.map(c => `<li>${esc(c)}</li>`).join('');
    renderReads();
  }
  function renderReads() {
    const p = state.play;
    R.reads.innerHTML = p.reads.map((r, i) => `<li class="${state.readsOn ? 'lit' : ''}" style="--i:${i}"><b class="ct-m ${r.who[0]}">${esc(nameOf(r.who))}</b>${esc(r.text)}</li>`).join('');
    R.readsHead.hidden = !p.reads.length;
    R.labels.querySelectorAll('.ct-lbl').forEach(el => el.classList.toggle('read', state.readsOn && p.reads.some(r => r.who === el.dataset.id)));
  }
  function renderDots() {
    const sim = state.sim, k = sim.beatAt();
    R.dots.innerHTML = Array.from({ length: sim.beats }, (_, i) => `<button class="${i < k ? 'past' : i === k ? 'now' : ''}" data-i="${i}" aria-label="Step ${i + 1}"></button>`).join('');
    R.playBtn.textContent = sim.playing() ? '❚❚' : '▶';
    R.speed.textContent = sim.speed() + '×';
  }
  R.dots.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    state.sim.seek(+b.dataset.i); state.sim.playing(false); renderDots(); onBeat(+b.dataset.i); speakBeat(state.sim.beatInfo(+b.dataset.i).say);
  });

  // ---- the ink: exact marks, routes and ball, re-projected every frame ----
  let ink = null;
  const el = (tag, cls, parent) => { const e = document.createElementNS(SVGNS, tag); if (cls) e.setAttribute('class', cls); parent.appendChild(e); return e; };
  function buildInk() {
    const svg = R.ink, sim = state.sim, nt = state.sport.notation;
    svg.innerHTML = '';
    const gZ = el('g', 'zones', svg), gV = el('g', 'vision', svg), gR = el('g', '', svg), gP = el('g', '', svg);
    const zones = sim.players.map(p => p.cover && p.cover.type === 'zone' ? { rect: zoneRect(p.cover.zone, state.sport, sim.play.los), poly: el('path', 'zone', gZ), label: Object.assign(el('text', 'zl', gZ), { textContent: p.cover.zone.label }) } : null).filter(Boolean);
    const dim = el('path', 'dim', gV), cone = el('path', 'cone', gV);
    const fb = !!state.sport.kinds.route, V = state.vision;
    const order = fb && V.mode !== 'off' ? progression(sim, V.mode, V.side) : [];
    const badges = order.map((pi, n) => { const g = el('g', 'rd', gP); const c = el('circle', '', g); const tx = el('text', '', g); tx.textContent = n + 1; return { pi, g, c, tx }; });
    const routes = sim.routes.map(r => el('path', 'r ' + r.side + ' ' + r.kind + ' ' + r.type, gR));
    const shadow = el('ellipse', 'shadow', svg), ball = el('circle', 'ball', svg);
    const marks = sim.players.map(p => {
      const g = el('g', '', gP), shape = nt.shape(p);
      const glyph = el('path', 'g ' + p.side + (shape === 'square' ? ' sq' : '') + (p.smart ? ' smart' : ''), g), eye = el('path', 'eye ' + p.side, g), text = el('text', 'n ' + p.side, g), hot = el('circle', 'hot', g);
      text.textContent = nt.inside(p);
      hot.addEventListener('pointerdown', e => {
        if (state.sketch) return; e.stopPropagation();
        if (state.routeMode && p.side === 'O' && p.id !== 'O1') pickRoute(p.id); else editRole(p.id);
      });
      return { p, shape, glyph, eye, text, hot };
    });
    const stroke = el('path', 'stroke', svg);
    const nm = names.all();
    R.labels.innerHTML = sim.players.map(p => {
      const name = state.showNames && nm[p.id], txt = name || (state.sport.id === 'basketball' ? p.role : '') || '';
      return `<div class="ct-lbl ${p.side}${name ? ' name' : ''}${txt || p.smart ? '' : ' empty'}" data-id="${p.id}">${p.smart ? '<i class="ct-brain" title="Played by the AI"></i>' : ''}${esc(txt)}</div>`;
    }).join('') + sim.players.map(p => `<div class="ct-think ${p.side}"></div>`).join('');
    const kids = Array.from(R.labels.children);
    ink = { hasD: sim.players.some(p => p.side === 'D'), guarded: sim.players.map((p, i) => p.side === 'O' && (sim.match.some(m => m === i) || (!!state.sport.kinds.route && sim.players.some(q => q.side === 'D') && p.role !== 'QB' && p.role !== 'C'))),   // in football every receiver is reading the coverage routes, marks, ball, shadow, stroke, lbls: kids.slice(0, sim.players.length), thinks: kids.slice(sim.players.length), zones, dim, cone, order, badges, t0: order.length ? readStart(sim) : 0 };
    R.namesBtn.hidden = !names.any(); R.namesBtn.classList.toggle('on', state.showNames);
  }
  const tmp = [0, 0, 0];
  const proj = (x, y, h) => field.project(toShape(x, y, h || 0, tmp));
  function drawInk() {
    const sim = state.sim, t = sim.time(), P0 = sim.posAt(t), B0 = sim.ballAt(t), RS = sim.routeState(t), U = state.sport.mark;
    const k = Math.floor(t), holder = sim.holderAt(t), sec = performance.now() / 1000, lo = [0, 0];
    // players breathe: a ready stance, active feet. The engine's positions stay exact; this is only how they look.
    const P = P0.map((p, i) => { life(state.sport, sim.players[i].side, i, sec, lo); return [p[0] + lo[0], p[1] + lo[1]]; });
    const Bp = holder >= 0 ? [B0[0] + P[holder][0] - P0[holder][0], B0[1] + P[holder][1] - P0[holder][1], B0[2]] : B0;
    sim.routes.forEach((r, i) => {
      const rs = RS[i], path = ink.routes[i];
      if (!rs.drawn) { path.setAttribute('d', ''); return; }
      const pts = sim.routeSlice(i, rs.drawn);
      let d = ''; for (let j = 0; j < pts.length; j++) { const s = proj(pts[j][0], pts[j][1], 0); d += (j ? 'L' : 'M') + s.x.toFixed(1) + ' ' + s.y.toFixed(1); }
      // history fades: this beat bold, the last one a ghost, the one before that footprints, then gone;
      // the closing recap shows the whole play faintly
      const age = rs.age || 0, cls = age === 0 ? '' : age === 1 ? ' a1' : age === 2 ? ' a2' : ' recap';
      path.setAttribute('d', d); path.setAttribute('class', 'r ' + r.side + ' ' + r.kind + ' ' + r.type + (r.auto ? ' auto' : '') + cls);
      path.setAttribute('stroke-width', (r.type === 'move' ? 2.6 : 2) * (age === 0 ? 1 : 0.7));
    });
    ink.marks.forEach((m, i) => {
      const [x, y] = P[i], c = proj(x, y, 0.15 * U), e = proj(x + U, y, 0.15 * U), rpx = Math.max(7, Math.hypot(e.x - c.x, e.y - c.y));
      let d = '';
      if (m.shape === 'x') { const a = proj(x - 0.72 * U, y - 0.72 * U, 0.1), b = proj(x + 0.72 * U, y + 0.72 * U, 0.1), c2 = proj(x - 0.72 * U, y + 0.72 * U, 0.1), d2 = proj(x + 0.72 * U, y - 0.72 * U, 0.1); d = `M${a.x} ${a.y}L${b.x} ${b.y}M${c2.x} ${c2.y}L${d2.x} ${d2.y}`; }
      else if (m.shape === 'square') { const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => proj(x + a * 0.85 * U, y + b * 0.85 * U, 0.15 * U)); d = 'M' + q.map(s => s.x.toFixed(1) + ' ' + s.y.toFixed(1)).join('L') + 'Z'; }
      else { for (let j = 0; j <= 20; j++) { const a = j / 20 * Math.PI * 2, s = proj(x + Math.cos(a) * U, y + Math.sin(a) * U, 0.15 * U); d += (j ? 'L' : 'M') + s.x.toFixed(1) + ' ' + s.y.toFixed(1); } d += 'Z'; }
      m.glyph.setAttribute('d', d); m.glyph.classList.toggle('hold', i === holder);
      m.glyph.classList.toggle('open', ink.guarded[i] && i !== holder && sim.space(t, i) >= state.sport.open * 1.15);   // open = beat your defender
      const tx = m.shape === 'x' ? c.x + rpx * 0.95 : c.x, ty = m.shape === 'x' ? c.y + rpx * 0.75 : c.y;
      const fs = (m.text.textContent.length > 1 ? 0.95 : 1.25) * rpx;
      m.text.setAttribute('x', tx.toFixed(1)); m.text.setAttribute('y', ty.toFixed(1)); m.text.setAttribute('font-size', (m.shape === 'x' ? fs * 0.75 : fs).toFixed(1));
      m.hot.setAttribute('cx', c.x); m.hot.setAttribute('cy', c.y); m.hot.setAttribute('r', rpx * 1.3);
      const lb = ink.lbls[i]; if (lb) lb.style.transform = `translate(${c.x}px, ${(c.y + rpx * 1.25).toFixed(1)}px)`;
      const th = ink.thinks[i]; if (th && th.classList.contains('on')) th.style.transform = `translate(${c.x}px, ${(c.y - rpx * 1.5).toFixed(1)}px)`;
      // eyes: offense off the ball watches the ball, the ball handler looks at the goal, defense splits man and ball
      const pl = sim.players[i], goal = state.sport.field.goal;
      let fx, fy;
      if (pl.side === 'O') { const tg = i === holder ? goal : Bp; fx = tg[0] - x; fy = tg[1] - y; }
      else { const mm = sim.match[i] >= 0 ? P[sim.match[i]] : Bp; fx = (mm[0] + Bp[0]) / 2 - x; fy = (mm[1] + Bp[1]) / 2 - y; }
      const fl = Math.hypot(fx, fy) || 1; fx /= fl; fy /= fl;
      const r0 = pl.side === 'O' ? 1.05 : 1.0, e1 = proj(x + fx * U * r0, y + fy * U * r0, 0.15 * U), e2 = proj(x + fx * U * (r0 + 0.55), y + fy * U * (r0 + 0.55), 0.15 * U);
      m.eye.setAttribute('d', `M${e1.x.toFixed(1)} ${e1.y.toFixed(1)}L${e2.x.toFixed(1)} ${e2.y.toFixed(1)}`);
    });
    const b = proj(Bp[0], Bp[1], Bp[2]), g = proj(Bp[0], Bp[1], 0), be = proj(Bp[0] + state.sport.ball.r, Bp[1], Bp[2]);
    const br = Math.max(3.5, Math.hypot(be.x - b.x, be.y - b.y));
    ink.ball.setAttribute('cx', b.x); ink.ball.setAttribute('cy', b.y); ink.ball.setAttribute('r', br);
    ink.shadow.setAttribute('cx', g.x); ink.shadow.setAttribute('cy', g.y); ink.shadow.setAttribute('rx', br * 1.1); ink.shadow.setAttribute('ry', br * 0.45);
    // coverage zones, shaded on the field
    ink.zones.forEach(z => {
      const [x0, y0, x1, y1] = z.rect, q = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(p => proj(p[0], p[1], 0));
      z.poly.setAttribute('d', 'M' + q.map(s => s.x.toFixed(1) + ' ' + s.y.toFixed(1)).join('L') + 'Z');
      const c = proj((x0 + x1) / 2, y0 + 1.2, 0); z.label.setAttribute('x', c.x); z.label.setAttribute('y', c.y);
    });
    // the QB's eyes: the other half dims on a half-field read, a cone sweeps the progression,
    // and every read is numbered and lit by how open that receiver is right now
    const V = state.vision;
    if (!ink.order.length) { ink.dim.setAttribute('d', ''); ink.cone.setAttribute('d', ''); return; }
    const F = state.sport.field;
    if (V.mode === 'half') { const xa = V.side > 0 ? F.x[0] : 0, xb = V.side > 0 ? 0 : F.x[1], q = [[xa, F.y[0]], [xb, F.y[0]], [xb, F.y[1]], [xa, F.y[1]]].map(p => proj(p[0], p[1], 0)); ink.dim.setAttribute('d', 'M' + q.map(s => s.x.toFixed(1) + ' ' + s.y.toFixed(1)).join('L') + 'Z'); }
    else ink.dim.setAttribute('d', '');
    const qb = sim.idx.O1, n = Math.floor((t - ink.t0) / READ_STEP);
    if (qb != null && t >= ink.t0 && n < ink.order.length && holder === qb) {
      const a = P[qb], r = P[ink.order[n]], ang = Math.atan2(r[1] - a[1], r[0] - a[0]), len = Math.hypot(r[1] - a[1], r[0] - a[0]) + 3, w = 0.2;
      const p1 = proj(a[0], a[1], 0.2), p2 = proj(a[0] + Math.cos(ang - w) * len, a[1] + Math.sin(ang - w) * len, 0), p3 = proj(a[0] + Math.cos(ang + w) * len, a[1] + Math.sin(ang + w) * len, 0);
      ink.cone.setAttribute('d', `M${p1.x} ${p1.y}L${p2.x} ${p2.y}L${p3.x} ${p3.y}Z`);
    } else ink.cone.setAttribute('d', '');
    ink.badges.forEach((b, j) => {
      const p = P[b.pi], c = proj(p[0] + U * 1.1, p[1] - U * 1.1, 0.2), live = t >= ink.t0 - 0.3;
      const o = live ? openness(separation(sim, t, b.pi)) : 'idle';
      b.g.setAttribute('class', 'rd ' + o + (j === n && t >= ink.t0 ? ' now' : ''));
      b.c.setAttribute('cx', c.x); b.c.setAttribute('cy', c.y); b.c.setAttribute('r', 9);
      b.tx.setAttribute('x', c.x); b.tx.setAttribute('y', c.y);
    });
  }

  (function loop(now) {
    if (dead) return;
    if (state.sim && field && ink) { state.sim.tick(now); drawInk(); }
    raf = requestAnimationFrame(loop);
  })(0);

  // ---- labels: tap a player (or say "label 5 the big") to tag a role ----
  function editRole(id) {
    closeEditor();
    const p = byId(id); if (!p) return;
    const i = state.play.players.indexOf(p), lb = ink.lbls[i];
    const box = document.createElement('form'); box.className = 'ct-edit';
    const chips = (state.sport.ai.roles || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 4);
    box.innerHTML = `<input value="${esc(p.role || '')}" placeholder="Label ${esc(posName(id))}" maxlength="18" aria-label="Label"><div class="chips">${chips.map(c => `<button type="button">${esc(c)}</button>`).join('')}</div><button>Set</button>` +
      `<div class="ct-edrow"><input data-n value="${esc(names.all()[id] || '')}" placeholder="Player's name (this device only)" maxlength="24" aria-label="Name, saved on this device only" autocomplete="off"></div>` +
      `<div class="ct-edrow"><button type="button" data-s="1">🧠 ${p.smart ? 'Ask the AI again' : 'Smart (AI) plays ' + esc(posName(id))}</button><button type="button" data-s="all">🧠 Whole team smart</button></div>`;
    const r = lb.getBoundingClientRect(), host = root.getBoundingClientRect();
    box.style.left = (r.left + r.width / 2 - host.left) + 'px'; box.style.top = (r.top - host.top + 4) + 'px';
    root.appendChild(box);
    const input = box.querySelector('input'); input.focus(); input.select();
    box.querySelectorAll('.chips button').forEach(b => b.onclick = () => { input.value = b.textContent; box.requestSubmit(); });
    const nameIn = box.querySelector('[data-n]');
    box.onsubmit = e => {
      e.preventDefault();
      const nm = nameIn.value.trim(); if (nm !== (names.all()[id] || '')) { names.set(id, nm); if (nm) { state.showNames = true; try { localStorage.setItem('chalktalk.showNames', '1'); } catch (er) {} } }
      setRole(id, input.value); closeEditor();
    };
    box.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
      closeEditor();
      const team = state.play.players.filter(q => q.side === p.side && q.id !== state.play.ball && !(state.sport.autonomy && state.sport.autonomy.skip && state.sport.autonomy.skip(q))).map(q => q.id);
      makeSmart(b.dataset.s === 'all' ? team : [id]);
    });
    setTimeout(() => document.addEventListener('pointerdown', outside), 0);
    function outside(e) { if (!box.contains(e.target)) closeEditor(); }
    box._off = () => document.removeEventListener('pointerdown', outside);
  }
  function closeEditor() { const b = root.querySelector('.ct-edit'); if (b) { b._off && b._off(); b.remove(); } }
  function setRole(id, role) {
    role = String(role || '').trim().slice(0, 18);
    const raw = JSON.parse(JSON.stringify(state.raw));
    let hit = (raw.players || []).find(q => String(q.id).toUpperCase() === id);
    if (!hit) { const p = byId(id); if (!p) return; hit = { id, side: p.side, at: { x: p.x, y: p.y } }; raw.players.push(hit); }   // an auto defender, made real
    hit.role = role;
    const t = state.sim.time();
    load(raw, { key: state.libKey, quiet: true, at: t, keepAI: true });
    if (role) toast(`${posName(id)} is now “${role}”.`);
  }
  // the AI plays these positions: a real read every beat, with what they were thinking
  async function makeSmart(ids) {
    if (!ids.length) return;
    if (state.busy) state.busy.abort();
    const ctl = state.busy = new AbortController(), sport = state.sport;
    root.classList.add('ct-drawing'); R.status.textContent = `The AI is taking over ${ids.map(posName).join(', ')}…`;
    const pulse = setInterval(() => field && field.signal(), 500);
    try {
      const res = await smartPlayers(strip(state.play), ids, { sport, signal: ctl.signal });
      if (ctl !== state.busy || dead || sport !== state.sport) return;
      load(res.play, { key: state.libKey, quiet: true, keepAI: true }); state.sim.seek(0); state.sim.playing(true);
      R.status.textContent = res.reply || ''; speak(res.reply || 'Smart players are in.');
    } catch (e) { if (e.name !== 'AbortError') { toast(e.message); R.status.textContent = ''; } }
    finally { clearInterval(pulse); if (ctl === state.busy) { state.busy = null; root.classList.remove('ct-drawing'); } }
  }

  // ---- controls ----
  function act(c) {
    const sim = state.sim; if (!sim) return;
    const k = sim.beatAt();
    if (c === 'next') { sim.seek(Math.min(sim.beats, k + 1)); sim.playing(false); }
    if (c === 'back') { sim.seek(Math.max(0, k - 1)); sim.playing(false); }
    if (c === 'again') { sim.seek(0); sim.playing(true); }
    if (c === 'pause') sim.playing(false);
    if (c === 'play') sim.playing(true);
    if (c === 'toggle') sim.playing(!sim.playing());
    if (c === 'slower') sim.speed(sim.speed() / 1.5 < 0.3 ? 0.25 : +(sim.speed() / 1.5).toFixed(2));
    if (c === 'faster') sim.speed(+(sim.speed() * 1.5).toFixed(2));
    if (c === 'defense-on' || c === 'defense-off' || c === 'defense') {
      state.defense = c === 'defense' ? !state.defense : c === 'defense-on';
      R.defBtn.classList.toggle('on', state.defense);
      load(state.raw, { key: state.libKey, quiet: true, keepAI: true });
      toast(state.defense ? 'Defense on: each X guards its man on its own.' : 'Defense off.');
      return;
    }
    if (c === 'sketch') { toggleSketch(); return; }
    if (c === 'clear') { load(blank(), { quiet: true }); return; }
    if (c === 'next' || c === 'back') { onBeat(sim.beatAt()); const b = sim.beatInfo(sim.beatAt()); if (b) speakBeat(b.say); }
    renderDots();
  }
  function blank() {
    const s = state.sport;
    return { title: 'Blank board', concept: 'Your play', summary: 'Say a play, or sketch one.', beats: [], ball: 'O' + (s.id === 'basketball' ? 1 : 2), los: s.los,
      players: s.starter.map((at, i) => ({ id: 'O' + (i + 1), side: 'O', at })) };
  }
  R.playBtn.onclick = () => act('toggle');
  R.prev.onclick = () => act('back');
  R.next.onclick = () => act('next');
  R.speed.onclick = () => { const s = state.sim.speed(); state.sim.speed(s >= 2 ? 0.5 : s >= 1 ? 2 : 1); renderDots(); };
  R.narrate.onclick = () => { state.narrate = !state.narrate; if (!state.narrate) hush(); R.narrate.classList.toggle('off', !state.narrate); R.narrate.setAttribute('aria-pressed', state.narrate); };
  R.infoBtn.onclick = () => root.classList.toggle('ct-info');
  R.defBtn.onclick = () => act('defense');
  R.sketchBtn.onclick = () => act('sketch');

  // ---- sports, library, legend ----
  function renderSports() {
    R.sports.hidden = allowed.length < 2;
    R.sports.innerHTML = allowed.map(s => `<button role="tab" class="ct-pill${s === state.sport ? ' on' : ''}" aria-selected="${s === state.sport}" data-id="${s.id}">${esc(s.short)}</button>`).join('');
  }
  R.sports.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setSport(getSport(b.dataset.id)); });
  function renderLibrary() {
    R.lib.innerHTML = state.sport.plays.map(p => `<button data-key="${esc(p.key)}"><span>${esc(p.concept)}</span>${esc(p.title)}</button>`).join('');
  }
  R.lib.addEventListener('click', e => { const b = e.target.closest('button'); if (b) teach(b.dataset.key); });
  function teach(k) { const p = state.sport.plays.find(x => x.key === k); if (p) load(p, { key: k, say: p.title + '. ' + p.summary }); }
  function renderLegend() {
    const fb = state.sport.id !== 'basketball';
    const row = (svg, t) => `<span><svg viewBox="-10 -10 20 20">${svg}</svg>${t}</span>`;
    R.legend.innerHTML = [
      row('<circle r="7" fill="none" stroke="#ff8e3a" stroke-width="2"/><text y="3.5" text-anchor="middle" font-size="9" font-weight="900" fill="#ff8e3a">' + (fb ? 'Q' : '1') + '</text>', fb ? 'Offense, by position' : 'Offense, 1–5 by position'),
      row('<path d="M-6 -6L6 6M-6 6L6 -6" stroke="#a9d4ff" stroke-width="2.4" stroke-linecap="round"/>', 'Defense'),
      row('<path d="M-9 0H7M3 -4L7 0L3 4" fill="none" stroke="#ff8e3a" stroke-width="2"/>', fb ? 'Route / run' : 'Cut'),
      fb ? '' : row('<path d="M-9 0l3 -3l3 6l3 -6l3 6l3 -3" fill="none" stroke="#ff8e3a" stroke-width="2"/>', 'Dribble'),
      row('<path d="M-9 0H9" stroke="#eef4ff" stroke-width="2" stroke-dasharray="4 3"/>', fb ? 'Throw' : 'Pass'),
      fb ? '' : row('<path d="M-9 0H5M5 -5V5" fill="none" stroke="#ff8e3a" stroke-width="2"/>', 'Screen')
    ].join('');
  }
  function renderHints() { const h = HINTS[state.sport.id] || HINTS.basketball; R.heard.textContent = h[0]; R.askText.placeholder = h[1]; }

  // ---- football: route tree, coverages, the QB's eyes ----
  function renderFootball() {
    const fb = !!state.sport.kinds.route;
    R.fb.hidden = !fb; root.classList.toggle('ct-football', fb);
    if (!fb) return;
    const C = coverages(state.sport);
    R.covs.innerHTML = Object.keys(C).map(k => `<button data-c="${k}" class="${state.play && state.play.coverage === k ? 'on' : ''}">${esc(C[k].name)}</button>`).join('');
    R.eyes.querySelectorAll('button').forEach(b => { if (b.dataset.v !== 'side') b.classList.toggle('on', b.dataset.v === state.vision.mode); });
    R.eyes.querySelector('[data-v=side]').textContent = state.vision.side > 0 ? 'Reading right ⇄' : 'Reading left ⇄';
    R.routeBtn.classList.toggle('on', state.routeMode);
  }
  R.covs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) cover(b.dataset.c); });
  function cover(k) {
    const raw = applyCoverage(state.raw, state.sport, k), C = coverages(state.sport)[k];
    load(raw, { key: state.libKey, quiet: true, keepAI: true });
    speak(C.name + '. ' + C.jobs.filter(j => j[1] === 'zone').length + ' in zones' + (C.jobs.some(j => j[1] === 'rush') ? ', one rusher.' : '.'));
    toast(C.name + ': zone defenders play whoever enters their area.');
  }
  R.eyes.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.v === 'side') state.vision.side = -state.vision.side; else state.vision.mode = b.dataset.v;
    vision();
  });
  function vision() {
    buildInk(); renderFootball();
    if (state.vision.mode !== 'off') { const sim = state.sim; sim.seek(Math.max(0, readStart(sim) - 0.6)); sim.playing(true); renderDots(); }
  }
  R.routeBtn.onclick = () => { state.routeMode = !state.routeMode; renderFootball(); if (state.routeMode) toast('Tap a receiver, then pick a route.'); else closeEditor(); };
  function pickRoute(id) {
    closeEditor();
    const p = byId(id), i = state.play.players.indexOf(p), lb = ink.lbls[i];
    const box = document.createElement('div'); box.className = 'ct-edit ct-tree';
    box.innerHTML = `<div class="ct-treehead">${esc(nameOf(id))} runs…</div>` + ROUTE_TREE.map(r => `<button data-r="${r.name}">${r.n != null ? '<i>' + r.n + '</i>' : ''}${r.name}</button>`).join('');
    const rc = lb.getBoundingClientRect(), host = root.getBoundingClientRect();
    box.style.left = clampN(rc.left + rc.width / 2 - host.left, 140, host.width - 140) + 'px'; box.style.top = clampN(rc.top - host.top + 4, 60, host.height - 240) + 'px';
    root.appendChild(box);
    box.onclick = e => { const b = e.target.closest('button'); if (b) { closeEditor(); setRoute(id, b.dataset.r); } };
    setTimeout(() => document.addEventListener('pointerdown', outside), 0);
    function outside(e) { if (!box.contains(e.target)) closeEditor(); }
    box._off = () => document.removeEventListener('pointerdown', outside);
  }
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  function setRoute(id, name) {
    const p = byId(id); if (!p) return;
    // routes start from where the receiver lines up
    const raw = applyRoute(state.raw, state.sport, id, name, [p.x, p.y]);
    load(raw, { key: state.libKey, quiet: true, keepAI: true });
    state.sim.seek(0); state.sim.playing(true);
    speak(`${nameOf(id)} runs ${routeNamed(name).say}.`);
  }
  R.openBtn.onclick = () => openMan();
  function openMan() {
    if (state.vision.mode === 'off') { state.vision.mode = 'full'; }
    const pick = findOpen(state.sim, state.vision.mode, state.vision.side);
    if (!pick) { toast('No receivers to read yet: give someone a route.'); return; }
    const raw = throwTo(state.raw, state.sim, pick, state.sport);
    load(raw, { key: state.libKey, quiet: true, keepAI: true });
    buildInk(); renderFootball(); state.sim.seek(Math.max(0, readStart(state.sim) - 0.6)); state.sim.playing(true);
    speak(`Read ${pick.n + 1}. ${nameOf(pick.id)} is ${pick.s >= 3 ? 'wide open' : 'the best look'}. Throw it!`);
  }
  // "Z runs a post" · "cover 2" · "half field left" · "find the open man"
  function footballWords(text) {
    if (!state.sport.kinds.route) return false;
    const t = text.toLowerCase();
    const cv = /\bcover\b|quarters|\bman to man\b|\bman coverage\b/.test(t) && coverageNamed(state.sport, t);
    if (cv && coverages(state.sport)[cv]) { cover(cv); return true; }
    if (/open (man|guy|receiver)|who'?s open/.test(t)) { openMan(); return true; }
    const vm = t.match(/\b(half|full)[ -]?field\b(?:.*\b(left|right)\b)?/);
    if (vm) { state.vision.mode = vm[1]; if (vm[2]) state.vision.side = vm[2] === 'left' ? -1 : 1; vision(); return true; }
    const rm = t.match(/\b(o\s?\d|x|y|z|h|rb|center|the center|slot|running back)\s+(?:runs?|run|on|goes|go)\s+(?:a |an |the |on a )?([a-z]+(?: cross| route)?)/);
    if (rm) {
      const who = rm[1].replace(/\s/g, '').replace('thecenter', 'c').replace('center', 'c').replace('runningback', 'rb');
      const p = state.play.players.find(q => q.side === 'O' && (q.id.toLowerCase() === who || (q.role || '').toLowerCase() === who));
      const tree = routeNamed(rm[2].replace(/ route$/, ''));
      if (p && tree) { setRoute(p.id, tree.name); return true; }
    }
    return false;
  }

  // ---- the coach talks ----
  async function heard(text, o) {
    text = String(text || '').trim(); o = o || {};
    if (!text && !o.sketch) return;
    if (text) R.heard.textContent = '“' + text + '”';
    if (!o.sketch) {
      const u = understand(text, state.sport.aliases);
      if (u.cmd) { act(u.cmd); return; }
      if (u.concept) { teach(u.concept); return; }
      if (u.label) { if (byId(u.label.id)) setRole(u.label.id, u.label.role); else toast(`There's no ${u.label.id} on the board.`); return; }
      if (footballWords(text)) return;
    }
    if (!keyKind(key.get())) {
      if (o.sketch) return;
      openKey('To draw a play from your own words, add a Claude or OpenAI key. The concepts, sketching and voice commands work without one.'); return;
    }
    if (state.busy) state.busy.abort();
    const ctl = state.busy = new AbortController(), sport = state.sport;
    root.classList.add('ct-drawing'); R.status.textContent = o.sketch ? 'The AI is taking over your sketch…' : 'Drawing your play…';
    const pulse = setInterval(() => field && field.signal(), 500);
    try {
      const raw = await drawPlay(text, state.play ? strip(state.play) : null, { signal: ctl.signal, glossary: opts.glossary || sport.glossary, sport, library: sport.plays, sketch: !!o.sketch });
      if (ctl !== state.busy || dead || sport !== state.sport) return;
      if (o.sketch) { offer(raw, o.mine); R.status.textContent = raw.reply || ''; return; }
      load(raw, { say: raw.reply, keepAI: true });
      showAI(raw, null);
      R.status.textContent = raw.reply || '';
    } catch (e) {
      if (e.name !== 'AbortError') { toast(e.message); if (e.code === 'nokey') openKey(); R.status.textContent = ''; }
    } finally {
      clearInterval(pulse);
      if (ctl === state.busy) { state.busy = null; root.classList.remove('ct-drawing'); }
    }
  }
  // what leaves the device: X's and O's, roles and the plan. Never names (they aren't in the play at all).
  const strip = p => ({ title: p.title, los: p.los, coverage: p.coverage || undefined,
    players: p.players.map(q => Object.assign({ id: q.id, side: q.side, role: q.role, at: { x: +q.x.toFixed(1), y: +q.y.toFixed(1) } }, q.smart ? { smart: true } : {}, q.cover ? { cover: q.cover } : {})),
    ball: p.ball, beats: p.beats.map(b => Object.assign({ say: b.say, actions: b.actions.map(a => Object.assign({ kind: a.kind, who: a.who, to: a.to, via: a.via, path: a.path, target: a.target }, a.thought ? { thought: a.thought } : {}, a.tree ? { tree: a.tree } : {})) }, b.thoughts ? { thoughts: b.thoughts } : {})), reads: p.reads });

  // what the AI (or the local matcher) recognised, its suggestions, and for sketches: use it or keep mine
  function showAI(raw, mine) {
    const lib = state.sport.plays.find(p => p.key === raw.recognized);
    const sug = (raw.suggestions || []).filter(Boolean).slice(0, 3);
    if (!lib && !sug.length && !mine) { R.aiCard.hidden = true; return; }
    R.aiCard.innerHTML = (lib ? `<div class="ct-like">Looks like <button data-k="${esc(lib.key)}">${esc(lib.title)}</button></div>` : '') +
      (sug.length ? `<ul>${sug.map(s => `<li>${mark(s)}</li>`).join('')}</ul>` : '') +
      (mine ? '<div class="ct-row"><button class="go" data-a="use">Use the AI version</button><button data-a="mine">Keep mine</button></div>' : '');
    R.aiCard.hidden = false;
    R.aiCard.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.k) teach(b.dataset.k);
      if (b.dataset.a === 'use') { load(raw, { say: raw.reply, keepAI: true }); showAI(Object.assign({}, raw), null); }
      if (b.dataset.a === 'mine') { load(mine, { quiet: true, keepAI: true }); R.aiCard.hidden = true; }
    };
  }
  function offer(raw, mine) { showAI(raw, mine); speak(raw.reply || 'Here is a cleaner version.'); root.classList.add('ct-info'); }

  // ---- sketch: draw it rough, it plays at once, then the AI takes over ----
  function toggleSketch() {
    if (state.sketch) { finishSketch(); return; }
    const base = state.play && state.sim ? strip(state.play) : blank();
    base.beats = []; base.title = 'My sketch'; base.concept = 'Sketch'; base.summary = 'Drawn by hand.'; base.reads = []; base.cues = [];
    if (state.sim) { const P = state.sim.posAt(0); base.players = state.play.players.map((p, i) => ({ id: p.id, side: p.side, role: p.role, at: { x: P[i][0], y: P[i][1] } })); }
    state.sketch = { raw: base, strokes: [], add: 'O', lastAt: 0 };
    root.classList.add('ct-sketch'); R.sketchBtn.classList.add('on'); R.aiCard.hidden = true;
    R.addO.classList.add('on'); R.addX.classList.remove('on');
    R.caption.innerHTML = 'Sketch: drag from a player to draw what they do. Draw two strokes quickly and they happen together.';
    loadSketch();
  }
  function loadSketch() {
    const sk = state.sketch;
    load(sk.raw, { quiet: true });
    state.sim.seek(state.sim.beats); state.sim.playing(false);   // everyone where the sketch leaves them
    renderDots();
  }
  function finishSketch() {
    const sk = state.sketch; state.sketch = null;
    root.classList.remove('ct-sketch'); R.sketchBtn.classList.remove('on');
    if (!sk.raw.beats.length) { R.caption.textContent = ''; return; }
    const mine = JSON.parse(JSON.stringify(sk.raw));
    load(mine, { quiet: true }); state.sim.seek(0); state.sim.playing(true);
    const like = recognize(mine);
    if (like) showAI({ recognized: like.key, suggestions: [] }, null);
    heard('', { sketch: true, mine });
  }
  R.done.onclick = () => finishSketch();
  R.undo.onclick = () => { const sk = state.sketch; if (!sk) return; const last = sk.strokes.pop(); if (last) { sk.raw = last.before; loadSketch(); } };
  R.wipe.onclick = () => { if (!state.sketch) return; state.sketch.raw = Object.assign(blank(), { title: 'My sketch', concept: 'Sketch', summary: 'Drawn by hand.' }); state.sketch.strokes = []; loadSketch(); };
  R.addO.onclick = () => { state.sketch.add = 'O'; R.addO.classList.add('on'); R.addX.classList.remove('on'); };
  R.addX.onclick = () => { state.sketch.add = 'D'; R.addX.classList.add('on'); R.addO.classList.remove('on'); };

  // screen → field: invert the projection with a few Newton steps (the view is smooth and nearly flat)
  function unproject(sx, sy) {
    const F = state.sport.field; let x = 0, y = (F.y[0] + F.y[1]) / 2;
    for (let i = 0; i < 8; i++) {
      const p = proj(x, y, 0), e = 0.5, px = proj(x + e, y, 0), py = proj(x, y + e, 0);
      const a = (px.x - p.x) / e, b = (py.x - p.x) / e, c = (px.y - p.y) / e, d = (py.y - p.y) / e, det = a * d - b * c || 1e-9;
      const rx = sx - p.x, ry = sy - p.y; x += (d * rx - b * ry) / det; y += (-c * rx + a * ry) / det;
    }
    return [x, y];
  }
  let drag = null;
  R.ink.addEventListener('pointerdown', e => {
    if (!state.sketch) return;
    const host = R.ink.getBoundingClientRect(), sx = e.clientX - host.left, sy = e.clientY - host.top, pt = unproject(sx, sy);
    const F = state.sport.field; if (pt[0] < F.x[0] || pt[0] > F.x[1] || pt[1] < F.y[0] || pt[1] > F.y[1]) return;
    const P = state.sim.posAt(state.sim.time());
    let best = -1, bd = 1.8 * state.sport.mark;
    P.forEach((p, i) => { const d = Math.hypot(p[0] - pt[0], p[1] - pt[1]); if (d < bd) { bd = d; best = i; } });
    drag = { i: best, pts: [pt], screen: [[sx, sy]], t: performance.now() };
    R.ink.setPointerCapture(e.pointerId); e.preventDefault();
  });
  R.ink.addEventListener('pointermove', e => {
    if (!drag) return;
    const host = R.ink.getBoundingClientRect(), sx = e.clientX - host.left, sy = e.clientY - host.top, last = drag.screen[drag.screen.length - 1];
    if (Math.hypot(sx - last[0], sy - last[1]) < 4) return;
    drag.screen.push([sx, sy]); drag.pts.push(unproject(sx, sy));
    ink.stroke.setAttribute('d', 'M' + drag.screen.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'));
    if (e.pointerType === 'pen') ink.stroke.setAttribute('stroke-width', (1.6 + (e.pressure || 0.5) * 4).toFixed(1));   // the pencil's pressure
  });
  const endDrag = () => {
    if (!drag) return; const d = drag; drag = null; ink.stroke.setAttribute('d', '');
    const sk = state.sketch; if (!sk) return;
    const moved = d.pts.length > 2 && Math.hypot(d.pts[d.pts.length - 1][0] - d.pts[0][0], d.pts[d.pts.length - 1][1] - d.pts[0][1]) > state.sport.mark;
    if (!moved) { if (d.i < 0) addPlayer(d.pts[0]); else editRole(state.play.players[d.i].id); return; }
    if (d.i < 0) return;
    strokeToAction(d);
  };
  R.ink.addEventListener('pointerup', endDrag); R.ink.addEventListener('pointercancel', () => { drag = null; ink && ink.stroke.setAttribute('d', ''); });

  function addPlayer(pt) {
    const sk = state.sketch, per = state.sport.roster.perSide, side = sk.add, letter = side === 'O' ? 'O' : 'X';
    const used = new Set(sk.raw.players.map(p => String(p.id).toUpperCase()));
    let n = 1; while (n <= per && used.has(letter + n)) n++;
    if (n > per) { toast(`All ${per} ${side === 'O' ? 'O' : 'X'}'s are on the field.`); return; }
    const before = JSON.parse(JSON.stringify(sk.raw));
    sk.raw.players.push({ id: letter + n, side, at: { x: +pt[0].toFixed(1), y: +pt[1].toFixed(1) } });
    if (!sk.raw.ball && side === 'O') sk.raw.ball = letter + n;
    sk.strokes.push({ before }); loadSketch();
  }

  // a rough stroke → one action, by what it starts on and where it ends
  function strokeToAction(d) {
    const sk = state.sketch, sport = state.sport, sim = state.sim, U = sport.mark;
    const P = sim.posAt(sim.time()), who = state.play.players[d.i], holderI = sim.holderAt(sim.time());
    const hasBall = d.i === holderI, end = d.pts[d.pts.length - 1];
    let mate = -1, md = 2.2 * U;
    P.forEach((p, i) => { if (i !== d.i && state.play.players[i].side === who.side) { const dd = Math.hypot(p[0] - end[0], p[1] - end[1]); if (dd < md) { md = dd; mate = i; } } });
    const pick = (...names) => names.find(n => sport.kinds[n]);
    const passKind = pick('throw', 'pass'), carryKind = pick('dribble', 'run'), cutKind = pick('route', 'cut'), defKind = pick('cover', 'slide'), screenKind = pick('screen');
    const corners = simplify(d.pts, 0.7 * U).slice(1, -1).slice(0, 4).map(p => ({ x: +p[0].toFixed(1), y: +p[1].toFixed(1) }));
    const to = { x: +end[0].toFixed(1), y: +end[1].toFixed(1) };
    const before = JSON.parse(JSON.stringify(sk.raw));
    const actions = [];
    // football: the center has it before the snap; the first stroke snaps it to the QB
    if (sport.kinds.snap && sk.raw.beats.length === 0 && byId('O1') && byId('O2') && sk.raw.ball === 'O2') {
      sk.raw.beats.push({ say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] });
    }
    const target = mate >= 0 ? state.play.players[mate].id : null;
    if (who.side === 'D') actions.push({ kind: defKind, who: who.id, to, path: corners });
    else if (hasBall && target) actions.push({ kind: passKind, who: who.id, target });
    else if (hasBall) actions.push({ kind: carryKind, who: who.id, to, path: corners });
    else if (target && screenKind) actions.push({ kind: screenKind, who: who.id, to, target });
    else actions.push({ kind: cutKind, who: who.id, to, path: sport.kinds.route ? corners : [], via: !sport.kinds.route && corners.length === 1 ? corners[0] : null });
    const a = actions[0], label = nameOf(who.id);
    const words = { pass: `${who.id} passes to ${target}`, throw: `${who.id} throws to ${target}`, dribble: `${who.id} dribbles`, run: `${who.id} runs with it`, screen: `${who.id} screens for ${target}`, cut: `${who.id} cuts`, route: `${who.id} runs a route`, slide: `${who.id} slides`, cover: `${who.id} covers` };
    // two quick strokes by different players happen together
    const lastBeat = sk.raw.beats[sk.raw.beats.length - 1], quick = performance.now() - sk.lastAt < 1400;
    if (lastBeat && quick && !lastBeat.actions.some(x => x.who === who.id) && !(sport.kinds[a.kind].type !== 'move' && lastBeat.actions.some(x => sport.kinds[x.kind].type !== 'move'))) {
      lastBeat.actions.push(a); lastBeat.say += '. ' + words[a.kind] + '.';
    } else sk.raw.beats.push({ say: words[a.kind] + '.', actions: [a] });
    sk.lastAt = performance.now();
    sk.strokes.push({ before }); loadSketch();
    R.caption.innerHTML = mark(sk.raw.beats[sk.raw.beats.length - 1].say) + ` <span class="ct-hint">(${label})</span>`;
  }
  // Ramer–Douglas–Peucker: the corners of a hand-drawn route
  function simplify(pts, eps) {
    if (pts.length < 3) return pts.slice();
    const a = pts[0], b = pts[pts.length - 1]; let idx = -1, dmax = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const dd = Math.abs((b[1] - a[1]) * p[0] - (b[0] - a[0]) * p[1] + b[0] * a[1] - b[1] * a[0]) / l;
      if (dd > dmax) { dmax = dd; idx = i; }
    }
    if (dmax <= eps) return [a, b];
    return simplify(pts.slice(0, idx + 1), eps).slice(0, -1).concat(simplify(pts.slice(idx), eps));
  }
  // no key needed: the library play whose actions look most like the sketch
  function recognize(raw) {
    const sig = r => { const m = {}; (r.beats || []).forEach(b => b.actions.forEach(a => { m[a.kind] = (m[a.kind] || 0) + 1; })); return m; };
    const a = sig(raw); let best = null, bs = 0;
    state.sport.plays.forEach(p => {
      const b = sig(p); let inter = 0, uni = 0;
      new Set(Object.keys(a).concat(Object.keys(b))).forEach(k => { inter += Math.min(a[k] || 0, b[k] || 0); uni += Math.max(a[k] || 0, b[k] || 0); });
      const s = uni ? inter / uni : 0; if (s > bs) { bs = s; best = p; }
    });
    return bs >= 0.6 ? best : null;
  }

  // ---- the view: orbit, zoom, presets, lock ----
  const viewKey = () => 'chalktalk.view.' + state.sport.id;
  const PRESETS = { coach: { yaw: 0, pitch: -0.04 }, top: { yaw: 0, pitch: 0.55 }, side: { yaw: -0.62, pitch: -0.12 } };
  function loadView() { try { return JSON.parse(localStorage.getItem(viewKey()) || 'null') || { pose: null, zoom: 1, locked: false }; } catch (e) { return { pose: null, zoom: 1, locked: false }; } }
  function saveView() { try { localStorage.setItem(viewKey(), JSON.stringify(state.view)); } catch (e) {} }
  function applyView() {
    if (!field) return;
    const v = state.view;
    field.setPose(v.pose ? { yaw: v.pose.yaw, pitch: v.pose.pitch, roll: 0 } : null);
    field.set({ interactive: !v.locked, radius: (w, h) => (w < 700 ? Math.min(w * 0.6, h * 0.42) : Math.min(w * 0.4, h * 0.5)) * v.zoom });
    R.lockBtn.textContent = v.locked ? '🔒 Locked · tap to unlock' : 'Lock this view';
    R.lockBtn.classList.toggle('on', v.locked); R.viewBtn.classList.toggle('on', v.locked);
    R.viewBtn.textContent = v.locked ? '🔒 View' : 'View';
  }
  R.viewBtn.onclick = () => { R.viewPop.hidden = !R.viewPop.hidden; };
  R.viewPop.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.p) state.view.pose = Object.assign({}, PRESETS[b.dataset.p]);
    if (b.dataset.z) state.view.zoom = b.dataset.z === '0' ? 1 : Math.max(0.6, Math.min(2.4, state.view.zoom * (b.dataset.z === '1' ? 1.15 : 1 / 1.15)));
    if (b === R.lockBtn) { state.view.locked = !state.view.locked; if (state.view.locked && !state.view.pose) capturePose(); toast(state.view.locked ? 'View locked. It stays exactly here.' : 'View unlocked: drag to orbit.'); }
    saveView(); applyView();
  });
  // after a drag, hold the field where it was left (no drifting back)
  function capturePose() {
    const v = field.view(), TAU = Math.PI * 2;
    state.view.pose = { yaw: v.yaw - Math.round(v.yaw / TAU) * TAU, pitch: v.pitch + 0.06 };
  }
  const stage = root.querySelector('.ct-stage');
  stage.addEventListener('pointerup', e => { if (e.pointerType !== 'pen' && !state.view.locked && !state.sketch && e.target === canvas) { capturePose(); saveView(); applyView(); } });
  stage.addEventListener('wheel', e => {
    if (state.view.locked) return;
    e.preventDefault();
    state.view.zoom = Math.max(0.6, Math.min(2.4, state.view.zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))));
    saveView(); applyView();
  }, { passive: false });
  // two fingers: pinch to zoom
  const touches = new Map(); let pinch0 = 0, zoom0 = 1;
  stage.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { touches.set(e.pointerId, [e.clientX, e.clientY]); if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); zoom0 = state.view.zoom; } } });
  stage.addEventListener('pointermove', e => {
    if (!touches.has(e.pointerId)) return; touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 2 && pinch0 && !state.view.locked) { const [a, b] = [...touches.values()]; state.view.zoom = Math.max(0.6, Math.min(2.4, zoom0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0)); applyView(); }
  });
  const untouch = e => { touches.delete(e.pointerId); if (touches.size < 2 && pinch0) { pinch0 = 0; saveView(); } };
  stage.addEventListener('pointerup', untouch); stage.addEventListener('pointercancel', untouch);

  // ---- names toggle ----
  R.namesBtn.onclick = () => {
    state.showNames = !state.showNames; try { localStorage.setItem('chalktalk.showNames', state.showNames ? '1' : '0'); } catch (e) {}
    buildInk(); renderPlay(); renderThoughts(state.sim.beatAt());
    toast(state.showNames ? 'Names on. They stay on this device and are never sent to the AI.' : 'Names off.');
  };

  // ---- pencil and peripherals: the pencil draws, fingers move the view ----
  let lastPen = 0;
  stage.addEventListener('pointerdown', e => {
    if (e.pointerType === 'pen') {
      lastPen = performance.now();
      if (!state.sketch) { e.preventDefault(); e.stopPropagation(); toggleSketch(); R.ink.dispatchEvent(new PointerEvent('pointerdown', e)); }
    } else if (e.pointerType === 'touch' && state.sketch && performance.now() - lastPen < 2500) { e.stopPropagation(); e.preventDefault(); }   // palm rejection
  }, true);
  // pencil hover: show which player a stroke would start from
  R.ink.addEventListener('pointermove', e => {
    if (e.pointerType !== 'pen' || e.buttons || !ink) return;
    const host = R.ink.getBoundingClientRect(), x = e.clientX - host.left, y = e.clientY - host.top;
    ink.marks.forEach(m => { const cx = +m.hot.getAttribute('cx'), cy = +m.hot.getAttribute('cy'), r = +m.hot.getAttribute('r'); m.glyph.classList.toggle('hover', Math.hypot(cx - x, cy - y) < r); });
  });
  R.ink.addEventListener('pointerleave', () => ink && ink.marks.forEach(m => m.glyph.classList.remove('hover')));

  // ---- ears ----
  const ear = listener(t => heard(t), (st, text) => {
    R.mic.dataset.state = st;
    if (st === 'hearing') R.heard.textContent = text;
    if (st === 'listening') { hush(); R.heard.textContent = 'Listening…'; }
    if (st === 'error' && text) toast(text);
  });
  if (!ear) { R.mic.disabled = true; R.mic.title = 'This browser cannot hear you. Type instead.'; }
  R.mic.onclick = () => { if (!ear) return; ear.on ? ear.stop() : ear.start(); };
  let spaceDown = false;
  const typing = e => e.target.closest && e.target.closest('input, textarea, [contenteditable]');
  const visible = () => root.isConnected && root.getBoundingClientRect().height > 0;
  const kd = e => {
    if (typing(e) || !visible() || R.keyDlg.open) return;
    if (e.code === 'Space' && !e.repeat && ear) { e.preventDefault(); spaceDown = true; ear.start(); }
    if (e.key === 'ArrowRight') act('next');
    if (e.key === 'ArrowLeft') act('back');
    if (e.key === 'Escape') { closeEditor(); R.viewPop.hidden = true; if (state.sketch) finishSketch(); }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && state.sketch) { e.preventDefault(); R.undo.click(); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k2 = e.key.toLowerCase();
    if (k2 === 's') act('sketch');
    if (k2 === 'd') act('defense');
    if (k2 === 'l') { state.view.locked = !state.view.locked; if (state.view.locked && !state.view.pose) capturePose(); saveView(); applyView(); toast(state.view.locked ? 'View locked.' : 'View unlocked.'); }
    if (k2 === 'n' && names.any()) R.namesBtn.click();
    if (k2 === '=' || k2 === '+') { state.view.zoom = Math.min(2.4, state.view.zoom * 1.15); saveView(); applyView(); }
    if (k2 === '-') { state.view.zoom = Math.max(0.6, state.view.zoom / 1.15); saveView(); applyView(); }
    if (k2 === 'p' || k2 === 'k') act('toggle');
  };
  const ku = e => { if (e.code === 'Space' && spaceDown) { spaceDown = false; ear && ear.stop(); } };
  addEventListener('keydown', kd); addEventListener('keyup', ku);
  R.ask.onsubmit = e => { e.preventDefault(); heard(R.askText.value); R.askText.value = ''; R.askText.blur(); };

  // ---- the keys ----
  function badge(el2, kind) { el2.textContent = kind ? '✓ ' + kind : ''; el2.className = 'ct-badge' + (kind ? ' ok' : ''); }
  function openKey(why) {
    R.keyWhy.textContent = why || 'Plays from your own words, the AI taking over your sketches and the broadcaster voice all use your own AI account.';
    R.keyInput.value = key.get(); R.voiceInput.value = voiceKey.get();
    R.keyInput.oninput(); R.voiceInput.oninput();
    R.keyDlg.showModal();
  }
  R.keyInput.oninput = () => { const v = R.keyInput.value.trim(), k = keyKind(v); badge(R.keyBadge, k && NAMES[k]); if (v && !k) { R.keyBadge.textContent = 'that isn’t a key yet'; R.keyBadge.className = 'ct-badge bad'; } R.voiceInput.oninput && R.voiceInput.oninput(); };
  R.voiceInput.oninput = () => {
    const v = R.voiceInput.value.trim(), k = voiceKind(v);
    badge(R.voiceBadge, k === 'openai' ? 'OpenAI voice' : k === 'elevenlabs' ? 'ElevenLabs' : '');
    const reuse = keyKind(R.keyInput.value.trim()) === 'openai';
    R.voiceFine.textContent = k ? 'A play-by-play broadcaster calls every step.' : reuse ? 'Your OpenAI play key already gives you the broadcaster voice.'
      : 'Without one, steps are read by this device\'s most natural voice' + (localVoiceName() ? ' (' + localVoiceName() + ')' : '') + '. With an OpenAI or ElevenLabs key, a play-by-play broadcaster calls them.';
  };
  R.keyBtn.onclick = () => openKey();
  R.keyCancel.onclick = () => R.keyDlg.close();
  R.keyForm.onsubmit = e => {
    e.preventDefault();
    key.set(R.keyInput.value); voiceKey.set(R.voiceInput.value); R.keyDlg.close(); refreshKey();
    toast(keyKind(key.get()) ? 'Saved. Say any play.' : 'Keys saved.');
    if (state.play && state.narrate) prefetch(state.play.beats.map(b => spoken(b.say)), key.get());
  };
  R.keyClear.onclick = () => { key.set(''); voiceKey.set(''); R.keyInput.value = ''; R.voiceInput.value = ''; R.keyInput.oninput(); refreshKey(); };
  function refreshKey() { const k = keyKind(key.get()); R.keyBtn.classList.toggle('set', !!k); R.keyBtn.textContent = k ? NAMES[k] : 'AI'; }
  refreshKey();

  let toastT = 0;
  function toast(msg) { R.toast.textContent = msg; R.toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => R.toast.classList.remove('on'), 4200); }

  state.view = loadView();
  renderSports(); renderLibrary(); renderLegend(); renderHints();
  const first = state.sport.plays.find(p => p.key === opts.play) || state.sport.plays[0];
  load(first, { key: first.key, quiet: true });

  return {
    load: raw => load(raw), teach, heard, act, setSport: id => setSport(sportFor(id)),
    get field() { return field; }, get play() { return state.play; }, get sport() { return state.sport.id; },
    destroy() {
      dead = true; cancelAnimationFrame(raf); hush(); closeEditor(); if (ear) ear.stop(); if (state.busy) state.busy.abort();
      removeEventListener('keydown', kd); removeEventListener('keyup', ku);
      if (field) field.destroy(); root.innerHTML = ''; root.classList.remove('ct', 'ct-full', 'ct-info', 'ct-drawing', 'ct-sketch');
    }
  };
}
