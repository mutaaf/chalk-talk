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
import { drawPlay, smartPlayers, filmRoom, setApi, setAuth, ownApi, plan as aiPlan, transcribe, key, keyKind, NAMES } from './ai.js';
import { CSS } from './style.js';
import { readStroke } from './engine/sketch.js';
import { icon } from './icons.js';
import { VERSION, TOUR, RELEASES, SHORTCUTS, seen, hasNews } from './tour.js';
import { openGuide } from './guide.js';
import { createIQ } from './iqmode.js';
import { openStats } from './stats.js';
import { openFilm } from './filmroom.js';
import { analyze } from './analyst.js';
import { analyst } from './ai.js';
import { heal, recall, teach as learnPhrase, correct, log as logVoice, mark as markVoice, vocabulary, share, sharing, setSharing, refreshLexicon } from './learn.js';
import { chime, soundOn, setSound } from './sound.js';
import { startTracking, track } from './track.js';
import { history, hash as hashOf } from './history.js';
import { ROUTE_TREE, routeNamed, applyRoute, applyCoverage, coverages, coverageNamed, zoneRect, progression, readStart, READ_STEP, separation, openness, findOpen, throwTo } from './engine/football.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z"/></svg>';
const TEMPLATE = `
<div class="ct-stage"><canvas class="ct-court" aria-label="The field drawn in light, with the play's X's and O's"></canvas><svg class="ct-ink" data-r="ink"></svg><div class="ct-labels" data-r="labels"></div></div>
<header class="ct-top">
  <div class="ct-word">Chalk <i>Talk</i> <small>Say the play. Watch it draw.</small></div>
  <div class="ct-sports" data-r="sports" role="tablist" aria-label="Sport"></div>
  <span class="ct-sp"></span>
  <button class="ct-pill" data-r="viewBtn" title="Orbit, zoom and lock the view (L locks)">${icon('view')}<span>View</span></button>
  <button class="ct-pill" data-r="namesBtn" title="Show your players' names (saved on this device only)" hidden>${icon('names')}<span>Names</span></button>
  <button class="ct-pill" data-r="sketchBtn" title="Draw it yourself (or just use a pencil), then let the AI take over (S)">${icon('sketch')}<span>Sketch</span></button>
  <button class="ct-pill ct-switch" data-r="defBtn" role="switch" aria-checked="false" title="Defense on or off: X's that guard, help and react on their own (D)">${icon('shield')}<span>Defense</span><i class="ct-sw"></i></button>
  <button class="ct-pill ct-filmpill" data-r="filmTop" title="Film room: every position's brain breaks down the play; tap a player for the full breakdown (R)">${icon('film')}<span>Film room</span></button>
  <button class="ct-pill" data-r="guideBtn" title="Every position in depth, the play player by player, and sideline cards (G)">${icon('book')}<span>Guide</span></button>
  <button class="ct-pill ct-iqpill" data-r="iqBtn" title="The game: read real plays, build your IQ, level up (I)">${icon('trophy')}<span data-r="iqLabel">IQ</span></button>
  <button class="ct-pill" data-r="statsBtn" title="Stats: the play's numbers, and AI tokens, time and cost">${icon('chart')}<span>Stats</span></button>
  <button class="ct-pill" data-r="presentBtn" title="Presenter mode for a TV: AirPlay, Cast or any mirroring (F)">${icon('cast')}<span>Present</span></button>
  <button class="ct-pill" data-r="boardBtn" title="Whiteboard only: full screen, panels away, icons only (W)">${icon('expand')}<span>Board only</span></button>
  <button class="ct-pill" data-r="themeBtn" title="Light, dark, or follow the device">${icon('moon')}<span>Theme</span></button>
  <button class="ct-pill" data-r="infoBtn">${icon('info')}<span>About</span></button>
  <button class="ct-pill off" data-r="narrate" aria-pressed="false" title="The voice: an analyst who explains the read, or play-by-play">${icon('mute')}<span>Narrate</span></button>
  <button class="ct-pill ct-morepill" data-r="moreBtn" title="Everything else: view, stats, presenter, whiteboard only, theme, voice (M)">${icon('grid')}<span>More</span></button>
  <button class="ct-pill ct-keypill" data-r="keyBtn" title="AI settings and your own keys">${icon('sparkle')}<span>AI</span></button>
  <button class="ct-pill ct-help" data-r="helpBtn" title="Tour, what's new and shortcuts" aria-label="Help">?<i class="ct-dot" data-r="newsDot" hidden></i></button>
</header>
<div class="ct-sketchbar" data-r="sketchbar">
  <div class="ct-tools" data-r="tools">
    <button data-t="draw" class="on" title="Draw from a player: what they do (D)">${icon('draw')}<span>Draw</span></button><button data-t="move" title="Drag a player to a new spot (M)">${icon('move')}<span>Move</span></button>
    <button data-t="erase" title="Tap a line or a player to erase it (E)">${icon('erase')}<span>Erase</span></button><button data-t="ball" title="Tap a player to give them the ball (B)">${icon('ball')}<span>Ball</span></button>
    <button data-t="O" title="Tap the field to add an O (O)">${icon('plusO')}</button><button data-t="X" title="Tap the field to add an X (X)">${icon('plusX')}</button>
  </div>
  <label class="ct-together" title="The next strokes happen at the same time (T)"><input type="checkbox" data-r="together"> Same time</label>
  <div class="ct-steps" data-r="steps"></div>
  <div class="ct-skend"><button data-r="undo" title="Undo (⌘Z)">${icon('undo')}</button><button data-r="wipe">Clear</button><button class="go" data-r="done" title="Done: play it, and let the AI take over (Esc)">${icon('check')}<span>Done</span></button></div>
</div>
<div class="ct-sklabel" data-r="sklabel"></div>
<nav class="ct-lib" data-r="lib" aria-label="Concepts"></nav>
<button type="button" class="ct-edge ct-edgel" data-r="libToggle" aria-label="Collapse the plays list ([)">‹</button>
<button type="button" class="ct-edge ct-edger" data-r="cardToggle" aria-label="Collapse the play card (])">›</button>
<aside class="ct-card" aria-live="polite"><button type="button" class="ct-x ct-cardx" data-r="cardX" aria-label="Close">${icon('close')}</button>
  <div class="ct-eyebrow" data-r="concept"></div>
  <h1 data-r="title"></h1>
  <p data-r="summary"></p>
  <div class="ct-ai" data-r="aiCard" hidden></div>
  <h2>Say it like this</h2>
  <ul class="ct-cues" data-r="cues"></ul>
  <h2 data-r="readsHead">Options</h2>
  <ul class="ct-reads" data-r="reads"></ul>
  <button class="ct-filmbtn" data-r="filmBtn" title="Each position's own AI brain watches the play">${icon('film')}<span>Film room</span></button>
  <ul class="ct-film" data-r="film"></ul>
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
<button type="button" class="ct-playchip" data-r="playChip" aria-label="About this play"><small data-r="chipK"></small><b data-r="chipT"></b>${icon('info')}</button>
<button type="button" class="ct-fab" data-r="tbSketch" aria-label="Sketch a play">${icon('sketch')}</button>
<nav class="ct-rail" aria-label="Whiteboard controls">
  <button type="button" data-rl="mic" data-r="rlMic" aria-label="Talk">${MIC}</button>
  <button type="button" data-rl="sketch" data-r="rlSketch" aria-label="Sketch">${icon('sketch')}</button>
  <button type="button" data-rl="defense" data-r="rlDef" aria-label="Defense on or off">${icon('shield')}</button>
  <button type="button" data-rl="plays" aria-label="Plays">${icon('book')}</button>
  <i></i>
  <button type="button" data-rl="back" aria-label="Previous step">${icon('prev')}</button>
  <button type="button" data-rl="toggle" data-r="rlPlay" aria-label="Play or pause">${icon('pause')}</button>
  <button type="button" data-rl="next" aria-label="Next step">${icon('next')}</button>
  <i></i>
  <button type="button" data-rl="exit" aria-label="Leave whiteboard only">${icon('shrink')}</button>
</nav>
<nav class="ct-tabbar" aria-label="Board">
  <button type="button" data-tb="plays">${icon('book')}<span>Plays</span></button>
  <button type="button" data-tb="guide">${icon('book')}<span>Guide</span></button>
  <button type="button" data-tb="mic" class="ct-tbmic" data-r="tbMic" aria-label="Talk: tap, say the play, tap again">${MIC}</button>
  <button type="button" data-tb="film">${icon('film')}<span>Film room</span></button>
  <button type="button" data-tb="more">${icon('grid')}<span>More</span><i class="ct-dot" data-r="tbDot" hidden></i></button>
</nav>
<div class="ct-live" data-r="live" hidden role="dialog" aria-live="polite" aria-label="Your play">
  <div class="ct-livecard">
    <div class="ct-liveorb" data-r="liveOrb">${MIC}<i></i><i></i><i></i></div>
    <div class="ct-livek" data-r="liveK">Listening</div>
    <p class="ct-livesaid" data-r="liveSaid"></p>
    <ol class="ct-livesteps" data-r="liveSteps"></ol>
    <div class="ct-livefoot"><span data-r="liveTime"></span><button type="button" data-r="liveStop">Done</button><button type="button" class="ghost" data-r="liveCancel">Cancel</button></div>
  </div>
</div>
<div class="ct-toast" data-r="toast" role="status"></div>
<button type="button" class="ct-focus" data-r="focusChip" hidden></button>
<div class="ct-coach" data-r="coach" hidden role="dialog" aria-label="Your first sketch"></div>
<div class="ct-present" data-r="presentBar" hidden>
  <div class="ct-l3" data-r="lower"><span class="ct-l3k" data-r="lowerK"></span><div><b data-r="lowerT"></b><p data-r="lowerS"></p></div></div>
  <div class="ct-pbar" data-r="pbar">
    <button type="button" data-p="back" aria-label="Previous step">${icon('prev')}</button><button type="button" data-p="toggle" aria-label="Play or pause" data-r="pPlay">${icon('pause')}</button><button type="button" data-p="next" aria-label="Next step">${icon('next')}</button>
    <span class="ct-psep"></span>
    <button type="button" data-p="defense" class="ct-switch" role="switch" data-r="pDef">${icon('shield')}<span>Defense</span><i class="ct-sw"></i></button>
    <button type="button" data-p="laser" data-r="pLaser" aria-pressed="false">${icon('laser')}<span>Laser</span></button>
    <button type="button" data-p="voice" data-r="pVoice">${icon('speaker')}<span>Analyst</span></button>
    <button type="button" data-p="lib" aria-label="Plays">${icon('book')}<span>Plays</span></button>
    <span class="ct-psep"></span>
    <button type="button" data-p="exit">${icon('close')}<span>Exit</span></button>
  </div>
</div>
<div class="ct-scrim" data-r="scrim"></div>
<div class="ct-spot" data-r="spot" hidden></div>
<div class="ct-tip" data-r="tip" role="tooltip" hidden></div>
<dialog class="ct-dlg" data-r="keyDlg">
  <form data-r="keyForm" method="dialog">
    <header class="ct-dlghead"><h3>AI settings</h3><button type="button" class="ct-x" data-r="keyX" aria-label="Close">${icon('close')}</button></header>
    <p data-r="keyWhy"></p>
    <label>Play key <span class="ct-badge" data-r="keyBadge"></span></label>
    <input data-r="keyInput" type="password" placeholder="paste it here: sk-ant-… or sk-…" autocomplete="off" spellcheck="false">
    <p class="ct-fine">Without a key, plays are drawn by the free open-source AI (a daily limit applies). With your own key they use Claude or OpenAI. Get one from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">Claude</a> or <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI</a>; we can tell which. It stays in this browser and goes only to them.</p>
    <label>Broadcaster voice key <span class="ct-badge" data-r="voiceBadge"></span></label>
    <input data-r="voiceInput" type="password" placeholder="optional: OpenAI sk-… or ElevenLabs sk_…" autocomplete="off" spellcheck="false">
    <p class="ct-fine" data-r="voiceFine"></p>
    <label class="ct-share"><input type="checkbox" data-r="shareVoice"><span><b>Help the voice get better for every coach</b><small>Off unless you turn it on. Shares only the words of plays you keep and words you fix, with your players' names removed on this device first. Never audio, never names. A phrase reaches other coaches only after three of them confirm it.</small></span></label>
    <div class="ct-ciq" data-r="ciq" hidden></div>
    <button type="button" class="ct-keypro" data-r="keyPro" hidden></button>
    <menu><button type="button" data-r="keyClear">Forget keys</button><button type="button" data-r="keyCancel">Cancel</button><button value="save">Save</button></menu>
  </form>
</dialog>`;

const HINTS = {
  basketball: ['Tap the mic (or hold space) and say a play: “1 dribbles to the right wing, 5 sets the ball screen…”', '…or type it: run Spain pick and roll'],
  flag5: ['Tap the mic (or hold space) and say a play: “Z runs a slant, Y runs to the flat, QB reads the flat defender…”', '…or type it: show me mesh'],
  flag7: ['Tap the mic (or hold space) and say a play: “Trips right, X runs a post, the slot runs a dig…”', '…or type it: show me four verticals']
};

// how big the field is drawn: the whole field fits with every player on screen, leaving room for the header and dock
const fitR = (w, h) => (w < 700 ? Math.min(w * 0.5, h * 0.36) : w < 1100 ? Math.min(w * 0.44, h * 0.42) : Math.min(w * 0.4, h * 0.5));

let styled = false;
export function mount(root, options) {
  const opts = Object.assign({ upgrade: null, sport: 'basketball', sports: null, play: null, narrate: false, fullscreen: false, title: true, glossary: '', api: null, team: 'default' }, options || {});
  if (opts.api) setApi(opts.api);
  // Chalk Talk AI is sold through CourtIQ. On the standalone board a coach can connect their CourtIQ account
  // (a link token comes back in the URL fragment), and the upgrade goes to CourtIQ's Chalk Talk AI page.
  const COURTIQ = opts.courtiq || 'https://youthsportsiq.com', LINK = 'chalktalk.link', standalone = !opts.api;
  let link = null;
  try {
    const m = location.hash.match(/ct-link=([\w.-]+)/);
    if (m && standalone) { localStorage.setItem(LINK, m[1]); history.replaceState(null, '', location.pathname + location.search); }
    link = standalone ? localStorage.getItem(LINK) : null;
  } catch (e) {}
  if (link) { setApi(COURTIQ + '/api/labs/chalk-talk'); setAuth(link); }
  if (standalone && !opts.upgrade) opts.upgrade = { label: 'Get Chalk Talk AI · $4.99/mo', href: COURTIQ + '/labs/chalk-talk/ai', note: 'Launch price (regularly $9.99), through CourtIQ. Have it, or any CourtIQ plan? Use “Connect CourtIQ” below.' };
  if (!styled && !document.querySelector('style[data-chalk-talk]')) { const s = document.createElement('style'); s.dataset.chalkTalk = ''; s.textContent = CSS; document.head.appendChild(s); styled = true; }
  root.classList.add('ct'); if (opts.fullscreen) root.classList.add('ct-full');
  // touch-first (a phone, or an iPad without a trackpad): the tab bar and control center at any width
  const touchMq = typeof matchMedia !== 'undefined' ? matchMedia('(hover: none) and (pointer: coarse)') : null;
  const setTouch = () => root.classList.toggle('ct-touch', !!(touchMq && touchMq.matches));
  setTouch(); if (touchMq && touchMq.addEventListener) touchMq.addEventListener('change', setTouch);
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
  // the booth: the analyst explains the read (default), or straight play-by-play
  try { state.style = localStorage.getItem('chalktalk.voiceStyle') || 'analyst'; } catch (e) { state.style = 'analyst'; }
  const lineFor = (k, text) => state.style === 'analyst' && state.booth ? ((state.booth.ai && state.booth.ai[k]) || state.booth.lines[k] || text) : text;
  const speakBeat = (text, k) => { const t = k == null ? text : lineFor(k, text); speak(spoken(t, false), state.showNames ? spoken(t, true) : null); };
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
      count: particleBudget, cycle: 0, intro: 900, stars: 60, autonomy: 0.12, depth: 3.4, interactive: true, blank: true, seed: 7,
      palette: { preset: 'ice', accent: [255, 142, 58], signal: [255, 190, 120] }, maxDpr: 2, quality: 'auto',
      radius: fitR
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
    state.booth = { lines: analyze(sim, sport, posName), ai: null }; state.focus = null; state.reveal = null; R.focusChip.hidden = true;
    buildInk(); renderPlay(); renderDots(); renderFootball(); renderPresent();
    if (!o.quiet && state.narrate && state.style === 'analyst' && !state.quiz) boothAI();
    R.lib.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.key === o.key));
    if (o.at != null) { sim.seek(o.at); sim.playing(false); renderDots(); }
    if (!o.quiet && state.narrate) prefetch([o.say].concat(play.beats.map((b, k) => lineFor(k, b.say))).map(t => spoken(t)), key.get());
    if (o.say && !o.quiet) speak(spoken(o.say));
    if (!o.keepAI) R.aiCard.hidden = true;
    if (!o.keepFilm) R.film.innerHTML = '';
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
    if (info) { R.caption.innerHTML = `<span class="ct-n">${k + 1}</span>${mark(info.say)}`; R.caption.classList.remove('end'); if (sim.playing()) speakBeat(info.say, k); }
    else { R.caption.innerHTML = `<span class="ct-n">✓</span>${state.play.reads.length ? 'Options on this play' : 'That\'s the play.'}`; R.caption.classList.add('end'); }
    state.readsOn = !info;
    renderDots(); renderReads(); renderThoughts(k); renderPresent(); if (root.classList.contains('ct-board')) renderRail();
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
    R.chipK.textContent = p.concept || state.sport.short; R.chipT.textContent = p.title;
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
    state.sim.seek(+b.dataset.i); state.sim.playing(false); renderDots(); onBeat(+b.dataset.i); speakBeat(state.sim.beatInfo(+b.dataset.i).say, +b.dataset.i);
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
        if (state.quiz) { if (iq.wantsTap() && p.side === 'O') iq.answer(p.id); return; }
        if (state.routeMode && p.side === 'O' && p.id !== 'O1') pickRoute(p.id); else editRole(p.id);
      });
      return { p, shape, glyph, eye, text, hot, g };
    });
    const stroke = el('path', 'stroke', svg);
    const target = el('circle', 'iqtarget', svg), tapX = el('path', 'iqtap', svg), ghost = el('path', 'ghost', svg), finger = el('circle', 'finger', svg), laser = el('path', 'laser', svg), laserDot = el('circle', 'laserdot', svg);
    const nm = names.all();
    R.labels.innerHTML = sim.players.map(p => {
      const name = state.showNames && nm[p.id], txt = name || (state.sport.id === 'basketball' ? p.role : '') || '';
      return `<div class="ct-lbl ${p.side}${name ? ' name' : ''}${txt || p.smart ? '' : ' empty'}" data-id="${p.id}">${p.smart ? '<i class="ct-brain" title="Played by the AI"></i>' : ''}${esc(txt)}</div>`;
    }).join('') + sim.players.map(p => `<div class="ct-think ${p.side}"></div>`).join('');
    const kids = Array.from(R.labels.children);
    // guarded: who has a defender to beat (in football, every receiver reads the coverage)
    ink = { hasD: sim.players.some(p => p.side === 'D'), guarded: sim.players.map((p, i) => p.side === 'O' && (sim.match.some(m => m === i) || (!!state.sport.kinds.route && sim.players.some(q => q.side === 'D') && p.role !== 'QB' && p.role !== 'C'))),
      routes, marks, ball, shadow, stroke, target, tapX, ghost, finger, laser, laserDot, lbls: kids.slice(0, sim.players.length), thinks: kids.slice(sim.players.length), zones, dim, cone, order, badges, t0: order.length ? readStart(sim) : 0 };
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
      m.glyph.classList.toggle('open', !(state.quiz && !state.reveal) && ink.guarded[i] && i !== holder && sim.space(t, i) >= state.sport.open * 1.15);   // no hints while a question is up   // open = beat your defender
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
    drawExtras(P, U);
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

  // focus ("watch only 5"), IQ reveals, the first-sketch ghost strokes and the presenter's laser
  function drawExtras(P, U) {
    const sim = state.sim, f = state.focus, rv = state.reveal;
    R.ink.classList.toggle('focus', !!f);
    ink.marks.forEach((m, i) => {
      const id = sim.players[i].id;
      m.g.classList.toggle('me', id === f);
      m.glyph.classList.toggle('ans', !!(rv && rv.right && rv.right.indexOf(id) >= 0));
      m.glyph.classList.toggle('miss', !!(rv && rv.wrong && rv.wrong.indexOf(id) >= 0));
      m.glyph.classList.toggle('hint', !!(rv && rv.hint && rv.hint.indexOf(id) >= 0));
    });
    if (f) ink.routes.forEach((r, i) => r.classList.toggle('me', sim.players[sim.routes[i].p].id === f));
    const at = (pt, el2, r) => { const c = proj(pt[0], pt[1], 0.05); el2.setAttribute('cx', c.x); el2.setAttribute('cy', c.y); el2.setAttribute('r', r); };
    if (rv && rv.spot) { const e = proj(rv.spot[0] + rv.tol, rv.spot[1], 0), c = proj(rv.spot[0], rv.spot[1], 0); at(rv.spot, ink.target, Math.max(10, Math.abs(e.x - c.x))); } else ink.target.setAttribute('r', 0);
    if (rv && rv.tap) { const c = proj(rv.tap[0], rv.tap[1], 0.05), k = 7; ink.tapX.setAttribute('d', `M${c.x - k} ${c.y - k}L${c.x + k} ${c.y + k}M${c.x - k} ${c.y + k}L${c.x + k} ${c.y - k}`); } else ink.tapX.setAttribute('d', '');
    const gh = state.ghost;
    if (gh) {
      const pts = gh.pts.map(p => proj(p[0], p[1], 0.05)); ink.ghost.setAttribute('d', 'M' + pts.map(q => q.x.toFixed(1) + ' ' + q.y.toFixed(1)).join('L'));
      const u = (performance.now() / 1600) % 1, n = pts.length - 1, j = Math.min(n - 1, Math.floor(u * n)), w = u * n - j, a = pts[j], b2 = pts[j + 1] || a;
      ink.finger.setAttribute('cx', a.x + (b2.x - a.x) * w); ink.finger.setAttribute('cy', a.y + (b2.y - a.y) * w); ink.finger.setAttribute('r', 11);
    } else { ink.ghost.setAttribute('d', ''); ink.finger.setAttribute('r', 0); }
    // the laser: a smoothed trail through every raw pointer sample that fades in a third of a second,
    // and a dot exactly under the pointer
    const L = laserPts, now = performance.now();
    while (L.length && now - L[0][2] > 340) L.shift();
    let d = '';
    if (L.length > 1) { d = 'M' + L[0][0].toFixed(1) + ' ' + L[0][1].toFixed(1); for (let i = 1; i < L.length - 1; i++) { const mx = (L[i][0] + L[i + 1][0]) / 2, my = (L[i][1] + L[i + 1][1]) / 2; d += `Q${L[i][0].toFixed(1)} ${L[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`; } const z = L[L.length - 1]; d += `L${z[0].toFixed(1)} ${z[1].toFixed(1)}`; }
    ink.laser.setAttribute('d', d);
    const lp = state.laser && state.laserAt;
    if (lp) { ink.laserDot.setAttribute('cx', lp[0]); ink.laserDot.setAttribute('cy', lp[1]); ink.laserDot.setAttribute('r', state.lasing ? 6 : 5); } else ink.laserDot.setAttribute('r', 0);
  }
  const laserPts = [];

  let loopErr = false;
  (function loop(now) {
    if (dead) return;
    if (state.sim && field && ink) try {
      const t = state.sim.tick(now);
      if (state.quiz) {
        const q = state.quizStop;
        if (iq.tick(t)) { state.sim.playing(false); renderDots(); }
        else if (q != null && t >= q) { state.sim.seek(q); state.sim.playing(false); state.quizStop = null; renderDots(); }
      }
      drawInk();
    } catch (err) { if (!loopErr) { loopErr = true; console.error('[chalk-talk] frame', err); } }   // one bad frame never stops the board
    raf = requestAnimationFrame(loop);
  })(0);

  // ---- panels: every popup opens inside the board, has a title and a close, and closes on Esc or a tap outside.
  // On phones and narrow hosts they're bottom sheets.
  function openPanel(anchor, title, body, onMount, cls) {
    closePanel();
    const host = root.getBoundingClientRect(), el2 = document.createElement('div');
    el2.className = 'ct-panel' + (cls ? ' ' + cls : ''); el2.setAttribute('role', 'dialog'); el2.setAttribute('aria-label', title);
    el2.innerHTML = `<header><h4>${esc(title)}</h4><button type="button" class="ct-x" aria-label="Close">${icon('close')}</button></header><div class="ct-pbody">${body}</div>`;
    el2.style.visibility = 'hidden'; root.appendChild(el2);
    const sheet = host.width < 640;
    if (sheet) el2.classList.add('sheet');
    else if (/ct-xl/.test(cls || '') || (anchor.getClientRects && !anchor.getClientRects().length)) {   // the big ones (guide, IQ, stats) sit in the middle of the board
      const w = el2.offsetWidth, h = Math.min(el2.offsetHeight, host.height - 32);
      el2.style.left = Math.max(12, (host.width - w) / 2) + 'px'; el2.style.top = Math.max(16, (host.height - h) / 2) + 'px'; el2.style.maxHeight = (host.height - 32) + 'px';
    }
    else {
      const a = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { left: host.left + anchor.x, right: host.left + anchor.x, top: host.top + anchor.y, bottom: host.top + anchor.y, width: 0 };
      const w = el2.offsetWidth, h = Math.min(el2.offsetHeight, host.height - 24), cx = a.left + a.width / 2 - host.left;
      let x = Math.max(12, Math.min(host.width - w - 12, cx - w / 2)), y = a.bottom - host.top + 10;
      if (y + h > host.height - 12) y = a.top - host.top - h - 10;
      if (y < 12) y = Math.max(12, host.height - h - 12);
      el2.style.left = x + 'px'; el2.style.top = y + 'px'; el2.style.maxHeight = (host.height - 24) + 'px';
    }
    el2.style.visibility = '';
    if (sheet || /ct-xl/.test(cls || '')) R.scrim.classList.add('on');   // the big ones and sheets dim the board; a tap on it closes
    el2.querySelector('.ct-x').onclick = closePanel;
    const outside = e => { if (!el2.contains(e.target) && !(anchor.contains && anchor.contains(e.target))) closePanel(); };
    setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
    el2._off = () => document.removeEventListener('pointerdown', outside, true);
    onMount && onMount(el2.querySelector('.ct-pbody'), el2);
    const first = el2.querySelector('.ct-pbody input, .ct-pbody button'); if (first && !sheet) first.focus();
    return el2;
  }
  // closing: the panel and its scrim fade and slide away rather than vanish
  function closePanel() {
    root.querySelectorAll('.ct-panel:not(.out)').forEach(p => { p._off && p._off(); p.classList.add('out'); p.setAttribute('aria-hidden', 'true'); setTimeout(() => p.remove(), 200); });
    R.scrim.classList.remove('on');
    if (R.spot && !root.querySelector('.ct-panel:not(.out).ct-tourcard')) R.spot.hidden = true;
  }
  const markAnchor = i => { const m = ink.marks[i]; return { x: +m.hot.getAttribute('cx'), y: +m.hot.getAttribute('cy') + (+m.hot.getAttribute('r') || 10) }; };

  // ---- labels: tap a player (or say "label 5 the big") to tag a role ----
  function editRole(id) {
    const p = byId(id); if (!p) return;
    const i = state.play.players.indexOf(p);
    const chips = (state.sport.ai.roles || '').split(',').map(c => c.trim()).filter(Boolean).slice(0, 6);
    const body = `<form class="ct-form"><label>Label</label><div class="ct-row"><input data-role value="${esc(p.role || '')}" placeholder="e.g. ${esc(chips[0] || 'Shooter')}" maxlength="18" autocomplete="off"><button class="go">Save</button></div>
      <div class="ct-chips">${chips.map(c => `<button type="button" data-chip>${esc(c)}</button>`).join('')}</div>
      <label>Name <small>saved on this device only, never sent to the AI</small></label><input data-n value="${esc(names.all()[id] || '')}" placeholder="Player's first name" maxlength="24" autocomplete="off"></form>
      <div class="ct-brains"><button type="button" data-s="1">${icon('brain')}<span>${p.smart ? 'Ask this brain again' : 'Let the AI play ' + esc(posName(id))}</span></button><button type="button" data-s="all">${icon('brain')}<span>Every ${p.side === 'O' ? 'teammate' : 'defender'} thinks</span></button></div>`;
    openPanel(markAnchor(i), (p.side === 'O' ? 'Offense ' : 'Defense ') + posName(id), body, pb => {
      const form = pb.querySelector('form'), roleIn = pb.querySelector('[data-role]'), nameIn = pb.querySelector('[data-n]');
      pb.querySelectorAll('[data-chip]').forEach(b => b.onclick = () => { roleIn.value = b.textContent; form.requestSubmit(); });
      form.onsubmit = e => {
        e.preventDefault();
        const nm = nameIn.value.trim(); if (nm !== (names.all()[id] || '')) { names.set(id, nm); if (nm) { state.showNames = true; try { localStorage.setItem('chalktalk.showNames', '1'); } catch (er) {} } }
        closePanel(); setRole(id, roleIn.value);
      };
      pb.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
        closePanel();
        const team = state.play.players.filter(q => q.side === p.side && q.id !== state.play.ball && !(state.sport.autonomy && state.sport.autonomy.skip && state.sport.autonomy.skip(q))).map(q => q.id);
        makeSmart(b.dataset.s === 'all' ? team : [id]);
      });
    });
  }
  const closeEditor = closePanel;
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
    const ctl = state.busy = new AbortController(), sport = state.sport, board = boardKey();
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
      state.defense = c === 'defense' ? !state.defense : c === 'defense-on'; track('defense', { on: state.defense ? 1 : 0 });
      renderDefense(); if (R.rlDef) R.rlDef.classList.toggle('on', state.defense);
      load(state.raw, { key: state.libKey, quiet: true, keepAI: true });
      toast(state.defense ? 'Defense on: each X guards its man on its own.' : 'Defense off.');
      return;
    }
    if (c === 'sketch') { toggleSketch(); return; }
    if (c === 'clear') { load(blank(), { quiet: true }); return; }
    if (c === 'next' || c === 'back') { onBeat(sim.beatAt()); const b = sim.beatInfo(sim.beatAt()); if (b) speakBeat(b.say, sim.beatAt()); }
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
  function renderNarrate() { R.narrate.classList.toggle('off', !state.narrate); R.narrate.classList.toggle('on', state.narrate); R.narrate.setAttribute('aria-pressed', state.narrate); R.narrate.innerHTML = icon(state.narrate ? 'speaker' : 'mute') + '<span>' + (state.narrate ? (state.style === 'analyst' ? 'Analyst' : 'Play-by-play') : 'Voice') + '</span>'; }
  R.narrate.onclick = () => voiceMenu();
  renderNarrate();
  R.infoBtn.onclick = () => root.classList.toggle('ct-info');
  R.cardX.onclick = () => root.classList.remove('ct-info');
  R.defBtn.onclick = () => act('defense');
  R.sketchBtn.onclick = () => act('sketch');

  // ---- sports, library, legend ----
  function renderSports() {
    if (R.iqLabel) R.iqLabel.textContent = state.sport.iq ? state.sport.iq.name : 'IQ';
    R.sports.hidden = allowed.length < 2;
    R.sports.innerHTML = allowed.map(s => `<button role="tab" class="ct-pill${s === state.sport ? ' on' : ''}" aria-selected="${s === state.sport}" data-id="${s.id}">${esc(s.short)}</button>`).join('');
  }
  R.sports.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setSport(getSport(b.dataset.id)); });
  function renderLibrary() {
    R.lib.innerHTML = `<button data-mine="1" class="ct-mine">${icon('film')}<span>Saved by you</span>My plays</button>` + recentHTML() + `<div class="ct-libhead">Concepts</div>` + state.sport.plays.map(p => `<button data-key="${esc(p.key)}"><span>${esc(p.concept)}</span>${esc(p.title)}</button>`).join('');
  }
  // your last three plays, one tap away
  function recentHTML() {
    const r = history.all().filter(e => e.sport === state.sport.id).slice(0, 3);
    return r.length ? `<div class="ct-recent">${r.map(e => `<button type="button" data-hist="${esc(e.id)}" title="${esc(e.said || '')}"><b>${esc(e.name || e.title || 'Your play')}</b><small>${esc(e.said && e.source !== 'sketch' ? '“' + e.said + '”' : e.concept || 'Sketched')}</small></button>`).join('')}</div>` : '';
  }
  function runHistory(id) {
    const entry = history.all().find(x => x.id === id); if (!entry) return;
    closePanel(); history.touch(id); track('history_play'); load(entry.raw, { say: entry.raw.reply || entry.title, keepAI: true }); showAI(entry.raw, null);
    R.status.textContent = 'From My plays · instant, no AI used';
  }
  R.lib.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.mine) myPlays(); else if (b.dataset.hist) runHistory(b.dataset.hist); else if (b.dataset.key) teach(b.dataset.key); });
  function teach(k) { const p = state.sport.plays.find(x => x.key === k); if (p) track('play', { key: k }); if (p) load(p, { key: k, say: p.title + '. ' + p.summary }); }
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
    const p = byId(id), i = state.play.players.indexOf(p);
    const body = `<div class="ct-tree">${ROUTE_TREE.map(r => `<button data-route="${r.name}">${r.n != null ? '<i>' + r.n + '</i>' : '<i>·</i>'}${r.name}</button>`).join('')}</div>`;
    openPanel(markAnchor(i), nameOf(id) + ' runs…', body, pb => {
      pb.onclick = e => { const b = e.target.closest('[data-route]'); if (b) { closePanel(); setRoute(id, b.dataset.route); } };
    }, 'ct-wide');
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

  // ---- the film room: every position's brain watches the play ----
  // the film room: a card per player, a full breakdown per position (filmroom.js)
  // the host's AI subscription, if it offers one: mount({ upgrade: { label, href, note } or { label, onClick } })
  function upgradeAI() {
    const u = opts.upgrade; if (!u) return;
    track('upgrade_click');
    if (u.onClick) u.onClick(); else if (u.href) location.assign(u.href);
  }
  function openFilmRoom(id) {
    track('film_open', { one: id ? 1 : 0 });
    openFilm({ sport: state.sport, play: state.play, sim: state.sim, raw: state.raw, strip: strip(state.play), openPanel: panelAt(R.filmTop), posName, mark, watch, band,
      booth: state.booth ? (state.booth.ai || state.booth.lines) : null, say: t => say(spoken(t), key.get()),
      upgrade: opts.upgrade, connectAI: () => { closePanel(); openKey('Connect AI and every position gets its own brain in the film room.'); }, upgradeAI }, id);
  }
  R.filmBtn.onclick = () => openFilmRoom();
  R.filmTop.onclick = () => openFilmRoom();
  async function film() {
    const play = strip(state.play), sport = state.sport;
    const ids = state.play.players.filter((p, i) => p.side === 'O' || sim0().match[i] >= 0 || sim0().job[i]).map(p => p.id).slice(0, 10);   // every O, and every X with a job
    R.film.innerHTML = ids.map(id => `<li class="wait"><b class="ct-m ${id[0]}">${esc(nameOf(id))}</b><span>watching…</span></li>`).join('');
    R.filmBtn.disabled = true;
    try {
      const notes = await filmRoom(play, ids, { sport });
      if (sport !== state.sport) return;
      R.film.innerHTML = notes.map(n => `<li><b class="ct-m ${n.id[0]}">${esc(nameOf(n.id))}</b><div><i>${esc(n.brain)}</i>${esc(n.read)}<small>⚠ ${esc(n.risk)} · <em>${esc(n.tip)}</em></small></div></li>`).join('') || '<li>No brains answered. Try again.</li>';
    } catch (e) { R.film.innerHTML = ''; toast(e.message); }
    finally { R.filmBtn.disabled = false; }
  }
  const sim0 = () => state.sim;

  // ---- the explainer: a broadcast-style tour, what's new, shortcuts, and real tooltips ----
  const targetOf = at => at === 'ink' ? { x: root.clientWidth / 2, y: root.clientHeight * 0.45 } : (R[at] && !R[at].hidden && R[at].offsetParent !== null ? R[at] : null);
  function spotlight(steps, i, eyebrow) {
    closePanel();
    const st = steps[i]; if (!st) { endTour(); return; }
    const t = st.at ? targetOf(st.at) : null;
    if (st.at && !t) { spotlight(steps, i + 1, eyebrow); return; }   // a feature this sport doesn't show: skip it
    const host = root.getBoundingClientRect();
    const place = () => {   // the ring around the feature (after the card opens, which would clear it)
      if (t && t.getBoundingClientRect) {
        const r = t.getBoundingClientRect(), pad = 6;
        Object.assign(R.spot.style, { left: (r.left - host.left - pad) + 'px', top: (r.top - host.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
        R.spot.hidden = false; R.spot.classList.remove('round');
      } else if (t) {
        Object.assign(R.spot.style, { left: (t.x - 130) + 'px', top: (t.y - 90) + 'px', width: '260px', height: '180px' }); R.spot.hidden = false; R.spot.classList.add('round');
      } else R.spot.hidden = true;
    };
    const last = i === steps.length - 1;
    const body = `<p class="ct-call">${esc(st.call)}</p>
      <div class="ct-tourrow"><span class="ct-count">${esc(eyebrow ? eyebrow(i) : (i + 1) + ' of ' + steps.length)}</span>
      ${i ? '<button type="button" data-b="back">Back</button>' : ''}<button type="button" class="go" data-b="next">${last ? 'Done' : 'Next'}</button></div>`;
    const anchor = t ? (t.getBoundingClientRect ? t : { x: t.x, y: t.y + 90 }) : { x: host.width / 2, y: host.height * 0.35 };
    openPanel(anchor, st.title, body, pb => {
      pb.onclick = e => { const b = e.target.closest('[data-b]'); if (!b) return; spotlight(steps, i + (b.dataset.b === 'next' ? 1 : -1), eyebrow); };
    }, 'ct-tourcard');
    const card = root.querySelector('.ct-panel:not(.out).ct-tourcard'); if (card) { card._step = { steps, i, eyebrow }; card.querySelector('.ct-x').onclick = endTour; }
    place();
    if (state.narrate) say(st.call, key.get());
  }
  function endTour() { track('tour_done'); R.spot.hidden = true; closePanel(); hush(); seen.set('tour', VERSION); seen.set('version', VERSION); R.newsDot.hidden = true; }
  const startTour = () => spotlight(TOUR, 0);
  function whatsNew() {
    seen.set('version', VERSION); R.newsDot.hidden = true; R.tbDot.hidden = true;
    const body = RELEASES.map((r, ri) => `<section class="ct-rel"><h5>${esc(r.title)}<small>v${esc(r.version)} · ${esc(r.date)}</small></h5>
      <ul>${r.items.map((it, ii) => `<li><b>${esc(it.title)}</b><span>${esc(it.call)}</span>${it.show && targetOf(it.show) ? `<button type="button" data-show="${ri}:${ii}">Show me</button>` : ''}</li>`).join('')}</ul></section>`).join('');
    openPanel(R.helpBtn, "What's new", body, pb => {
      pb.onclick = e => {
        const b = e.target.closest('[data-show]'); if (!b) return;
        const [ri, ii] = b.dataset.show.split(':').map(Number), it = RELEASES[ri].items[ii];
        spotlight([{ at: it.show, title: it.title, call: it.call }], 0, () => 'New in v' + RELEASES[ri].version);
      };
    }, 'ct-wide');
    if (state.narrate) say('Here\'s what\'s new. ' + RELEASES[0].title + '.', key.get());
  }
  function shortcuts() {
    openPanel(R.helpBtn, 'Keyboard shortcuts', `<dl class="ct-keys">${SHORTCUTS.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`, null, 'ct-wide');
  }
  R.helpBtn.onclick = () => {
    if (root.querySelector('.ct-panel:not(.out).ct-helpm')) { closePanel(); return; }
    openPanel(R.helpBtn, 'Help', `<div class="ct-menu"><button type="button" data-h="tour">${icon('sparkle')}<span>Take the tour</span></button>
      <button type="button" data-h="news">${icon('film')}<span>What's new in v${VERSION}</span>${hasNews() ? '<i class="ct-new">New</i>' : ''}</button>
      <button type="button" data-h="keys">${icon('key')}<span>Keyboard shortcuts</span></button></div>`, pb => {
      pb.onclick = e => { const b = e.target.closest('[data-h]'); if (!b) return; ({ tour: startTour, news: whatsNew, keys: shortcuts })[b.dataset.h](); };
    }, 'ct-helpm');
  };
  addEventListener('resize', () => { const c = root.querySelector('.ct-panel:not(.out).ct-tourcard'); if (c && c._step) spotlight(c._step.steps, c._step.i, c._step.eyebrow); });

  // tooltips: the board's own, styled and instant on hover or focus (long-press on touch)
  function tipify(scope) { scope.querySelectorAll('[title]').forEach(el2 => { if (el2.closest('.ct-dlg')) return; el2.dataset.tip = el2.getAttribute('title'); el2.removeAttribute('title'); if (!el2.getAttribute('aria-label') && !el2.textContent.trim()) el2.setAttribute('aria-label', el2.dataset.tip); }); }
  let tipT = 0, pressT = 0;
  function showTip(el2) {
    const text = el2.dataset.tip; if (!text) return;
    R.tip.textContent = text; R.tip.hidden = false;
    const host = root.getBoundingClientRect(), r = el2.getBoundingClientRect(), w = R.tip.offsetWidth, h = R.tip.offsetHeight;
    let x = r.left + r.width / 2 - host.left - w / 2, y = r.bottom - host.top + 8;
    if (y + h > host.height - 8) y = r.top - host.top - h - 8;
    R.tip.style.left = Math.max(8, Math.min(host.width - w - 8, x)) + 'px'; R.tip.style.top = Math.max(8, y) + 'px';
  }
  const hideTip = () => { clearTimeout(tipT); R.tip.hidden = true; };
  root.addEventListener('pointerover', e => { const el2 = e.target.closest('[data-tip]'); if (!el2 || e.pointerType === 'touch') return; clearTimeout(tipT); tipT = setTimeout(() => showTip(el2), 350); });
  root.addEventListener('pointerout', e => { if (e.target.closest('[data-tip]')) hideTip(); });
  root.addEventListener('focusin', e => { const el2 = e.target.closest('[data-tip]'); if (el2 && el2.matches(':focus-visible')) showTip(el2); });
  root.addEventListener('focusout', hideTip);
  root.addEventListener('pointerdown', e => { hideTip(); const el2 = e.target.closest('[data-tip]'); if (el2 && e.pointerType === 'touch') pressT = setTimeout(() => showTip(el2), 500); });
  root.addEventListener('pointerup', () => clearTimeout(pressT));

  // ---- the coach talks ----
  async function heard(text, o) {
    o = o || {};
    const t0 = performance.now(), said = String(text || '').trim();
    text = o.sketch ? said : heal(said);   // fix what speech-to-text gets wrong about coaching talk
    if (!text && !o.sketch) return;
    if (text) { R.heard.textContent = '“' + text + '”'; R.heard.dataset.said = text; R.heard.classList.add('fix'); }
    if (state.quiz) return;
    if (!o.sketch) {
      const u = understand(text, state.sport.aliases);
      const done = (path, extra) => { const ms = performance.now() - t0; if (live.mode) live.done(path === 'command' ? 'Done ✓' : `Instant ✓ ${Math.max(1, Math.round(ms))} ms`); track('voice', { path, ms: Math.round(ms), ok: 1 }); logVoice(Object.assign({ sport: state.sport.id, path, ms, ok: true, text: text.slice(0, 200) }, extra)); R.status.textContent = `Instant · understood on this device in ${Math.max(1, Math.round(ms))} ms`; };
      if (u.cmd) { act(u.cmd); done('command'); return; }
      if (u.concept) { teach(u.concept); done('library'); return; }
      const learned = recall(state.sport.id, text);   // a phrase this coach taught it before
      if (learned && state.sport.plays.some(p => p.key === learned)) { teach(learned); done('learned'); return; }
      // asked before (the same words on the same board, or a fresh request asked before): instant, no AI
      const hit = history.find(state.sport.id, text, boardKey());
      if (hit && hit.raw) { history.touch(hit.id); load(hit.raw, { say: hit.raw.reply, keepAI: true }); showAI(hit.raw, null); done('history'); R.status.textContent = 'From My plays · instant, no AI used'; return; }
      if (u.label) { if (byId(u.label.id)) setRole(u.label.id, u.label.role); else toast(`There's no ${u.label.id} on the board.`); return; }
      if (footballWords(text)) return;
    }

    if (state.busy) state.busy.abort();
    const ctl = state.busy = new AbortController(), sport = state.sport;
    root.classList.add('ct-drawing'); live.draw(o.sketch ? '' : text, !!o.sketch); R.status.textContent = o.sketch ? 'The AI is taking over your sketch…' : 'Drawing your play…';
    const pulse = setInterval(() => field && field.signal(), 500);
    try {
      const raw = await drawPlay(text, state.play ? strip(state.play) : null, { signal: ctl.signal, glossary: opts.glossary || sport.glossary, sport, library: sport.plays, sketch: !!o.sketch });
      if (ctl !== state.busy || dead || sport !== state.sport) return;
      const ms = performance.now() - t0, secs = (ms / 1000).toFixed(1) + ' s';
      live.done(`${o.sketch ? 'Taken over' : 'Drawn'} in ${secs} ✓`);
      if (o.sketch) { history.add({ sport: sport.id, said: 'Sketch: ' + (raw.title || 'my play'), board: hashOf(JSON.stringify(o.mine && o.mine.beats)), source: 'sketch', raw, title: raw.title, concept: raw.concept, ms: Math.round(ms) }); offer(raw, o.mine); R.status.textContent = (raw.reply || '') + ` · the AI took over in ${secs}`; logVoice({ sport: sport.id, path: 'sketch', ms, ok: true }); film(); return; }
      load(raw, { say: raw.reply, keepAI: true });
      showAI(raw, null);
      R.status.textContent = (raw.reply || '') + ` · drawn in ${secs}`;
      // learn: if the coach keeps what was drawn for this phrase, it becomes instant next time
      track('voice', { path: 'ai', ms: Math.round(ms), ok: 1 });
      history.add({ sport: sport.id, said: text, board, source: o.source || 'text', raw, title: raw.title, concept: raw.concept, ms: Math.round(ms) }); renderLibrary();
      const li = logVoice({ sport: sport.id, path: 'ai', ms, ok: true, text: text.slice(0, 200), recognized: raw.recognized || null });
      const shown = state.raw;
      clearTimeout(state.keepT);
      state.keepT = setTimeout(() => {
        const kept = state.raw === shown; markVoice(li, { kept });
        if (raw.recognized && sport.plays.some(p => p.key === raw.recognized)) {
          if (kept) learnPhrase(sport.id, text, raw.recognized);
          share(ownApi(), { kind: 'phrase', sport: sport.id, text, concept: raw.recognized, kept });   // only if the coach opted in
        }
      }, 20000);
    } catch (e) {
      live.hide();
      if (e.name !== 'AbortError') { toast(e.message); if (e.code === 'nokey' || e.code === 'upgrade' || (e.status === 429 && opts.upgrade)) openKey(e.message); R.status.textContent = ''; logVoice({ sport: state.sport.id, path: o.sketch ? 'sketch' : 'ai', ms: performance.now() - t0, ok: false, error: String(e.message).slice(0, 120) }); track('voice', { path: o.sketch ? 'sketch' : 'ai', ok: 0, status: e.status || e.code || 'err' }); }
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
    if (!state.coach && !seen.get().sketchIntro && opts.tour !== false) { sketchCoach(); return; }
    const base = state.play && state.sim ? strip(state.play) : blank();
    base.beats = []; base.title = 'My sketch'; base.concept = 'Sketch'; base.summary = 'Drawn by hand.'; base.reads = []; base.cues = [];
    if (state.sim) { const P = state.sim.posAt(0); base.players = state.play.players.map((p, i) => ({ id: p.id, side: p.side, role: p.role, at: { x: P[i][0], y: P[i][1] } })); }
    state.sketch = { raw: base, strokes: [], tool: 'draw', lastAt: 0 };
    root.classList.add('ct-sketch'); R.sketchBtn.classList.add('on'); R.tbSketch.classList.add('on'); R.aiCard.hidden = true;
    setTool('draw'); R.together.checked = false;
    R.caption.innerHTML = 'Sketch: draw from a player. Zigzag = dribble, end on a teammate = pass, finish with a short T = screen. Strokes drawn quickly (or with “Same time”) happen together.';
    loadSketch();
  }
  function loadSketch() {
    const sk = state.sketch;
    load(sk.raw, { quiet: true });
    state.sim.seek(state.sim.beats); state.sim.playing(false);   // everyone where the sketch leaves them
    renderDots(); renderSteps();
  }
  function finishSketch() {
    if (state.coach) { state.coach = null; state.ghost = null; R.coach.hidden = true; seen.set('sketchIntro', VERSION); }
    const sk = state.sketch; state.sketch = null;
    root.classList.remove('ct-sketch'); R.sketchBtn.classList.remove('on'); R.tbSketch.classList.remove('on');
    if (!sk.raw.beats.length) { R.caption.textContent = ''; return; }
    track('sketch_done', { beats: sk.raw.beats.length });
    const mine = JSON.parse(JSON.stringify(sk.raw));
    load(mine, { quiet: true }); state.sim.seek(0); state.sim.playing(true);
    const like = recognize(mine);
    if (like) showAI({ recognized: like.key, suggestions: [] }, null);
    heard('', { sketch: true, mine });
  }
  R.done.onclick = () => finishSketch();
  R.undo.onclick = () => { const sk = state.sketch; if (!sk) return; const last = sk.strokes.pop(); if (last) { sk.raw = last.before; loadSketch(); } };
  R.wipe.onclick = () => { if (!state.sketch) return; const sk = state.sketch; sk.strokes.push({ before: JSON.parse(JSON.stringify(sk.raw)) }); sk.raw = Object.assign(blank(), { title: 'My sketch', concept: 'Sketch', summary: 'Drawn by hand.' }); loadSketch(); };
  R.tools.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTool(b.dataset.t); });
  function setTool(t) {
    if (!state.sketch) return;
    state.sketch.tool = t;
    R.tools.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    root.dataset.tool = t;
  }
  // the steps so far, each one deletable
  function renderSteps() {
    const sk = state.sketch; if (!sk) { R.steps.innerHTML = ''; return; }
    R.steps.innerHTML = sk.raw.beats.map((b, k) => `<span class="ct-step"><b>${k + 1}</b>${mark(b.say)}<button data-del="${k}" aria-label="Delete step ${k + 1}">×</button></span>`).join('') || '<span class="ct-step empty">Your steps show up here</span>';
  }
  R.steps.addEventListener('click', e => {
    const b = e.target.closest('[data-del]'); if (!b || !state.sketch) return;
    const sk = state.sketch; sk.strokes.push({ before: JSON.parse(JSON.stringify(sk.raw)) });
    sk.raw.beats.splice(+b.dataset.del, 1); loadSketch();
  });
  const snapshot = () => { const sk = state.sketch; sk.strokes.push({ before: JSON.parse(JSON.stringify(sk.raw)) }); };

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
  const inField = pt => { const F = state.sport.field; return pt[0] >= F.x[0] && pt[0] <= F.x[1] && pt[1] >= F.y[0] && pt[1] <= F.y[1]; };
  function nearestPlayer(pt, within) {
    const P = state.sim.posAt(state.sim.time()); let best = -1, bd = within * state.sport.mark;
    P.forEach((p, i) => { const d = Math.hypot(p[0] - pt[0], p[1] - pt[1]); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  // what the sketch means if the stroke ended here (shared by the live label and the commit)
  function interpret(d) {
    const sim = state.sim, P = sim.posAt(sim.time()), who = state.play.players[d.i];
    return readStroke(state.sport, d.pts, { who, holder: d.i === sim.holderAt(sim.time()), players: state.play.players, P, spots: state.sport.spots, los: state.play.los });
  }
  let drag = null;
  R.ink.addEventListener('pointerdown', e => {
    if (!state.sketch) return;
    const host = R.ink.getBoundingClientRect(), sx = e.clientX - host.left, sy = e.clientY - host.top, pt = unproject(sx, sy);
    if (!inField(pt)) return;
    drag = { i: nearestPlayer(pt, 1.8), pts: [pt], screen: [[sx, sy]], t: performance.now(), tool: state.sketch.tool, n: 0 };
    R.ink.setPointerCapture(e.pointerId); e.preventDefault();
  });
  R.ink.addEventListener('pointermove', e => {
    if (!drag) return;
    const host = R.ink.getBoundingClientRect(), sx = e.clientX - host.left, sy = e.clientY - host.top, last = drag.screen[drag.screen.length - 1];
    if (Math.hypot(sx - last[0], sy - last[1]) < 4) return;
    drag.screen.push([sx, sy]); drag.pts.push(unproject(sx, sy));
    ink.stroke.setAttribute('d', 'M' + drag.screen.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'));
    if (e.pointerType === 'pen') ink.stroke.setAttribute('stroke-width', (1.6 + (e.pressure || 0.5) * 4).toFixed(1));   // the pencil's pressure
    // say what it means while it's being drawn, and light up who it's for
    if (drag.tool === 'draw' && drag.i >= 0 && ++drag.n % 3 === 0 && drag.pts.length > 3) {
      const r = interpret(drag);
      R.sklabel.innerHTML = `${mark(drag.i >= 0 ? state.play.players[drag.i].id : '')} ${mark(r.label)}`;
      R.sklabel.style.transform = `translate(${sx + 16}px, ${sy - 30}px)`; R.sklabel.classList.add('on');
      ink.marks.forEach(m => m.glyph.classList.toggle('target', !!r.target && m.p.id === r.target));
    }
  });
  const clearLive = () => { ink && ink.stroke.setAttribute('d', ''); R.sklabel.classList.remove('on'); ink && ink.marks.forEach(m => m.glyph.classList.remove('target')); };
  const endDrag = () => {
    if (!drag) return; const d = drag; drag = null; clearLive();
    const sk = state.sketch; if (!sk) return;
    const end = d.pts[d.pts.length - 1], moved = d.pts.length > 2 && Math.hypot(end[0] - d.pts[0][0], end[1] - d.pts[0][1]) > state.sport.mark;
    const tool = d.tool;
    if (tool === 'O' || tool === 'X') { if (d.i < 0) addPlayer(d.pts[0], tool === 'O' ? 'O' : 'D'); return; }
    if (tool === 'ball') { if (d.i >= 0) giveBall(state.play.players[d.i]); return; }
    if (tool === 'erase') { erase(d.pts[0], d.i); return; }
    if (tool === 'move') { if (d.i >= 0 && moved && inField(end)) movePlayer(state.play.players[d.i].id, end); return; }
    if (!moved) { if (d.i < 0) addPlayer(d.pts[0], 'O'); else editRole(state.play.players[d.i].id); return; }
    if (d.i >= 0) commitStroke(d);
  };
  R.ink.addEventListener('pointerup', endDrag); R.ink.addEventListener('pointercancel', () => { drag = null; clearLive(); });

  function addPlayer(pt, side) {
    const sk = state.sketch, per = state.sport.roster.perSide, letter = side === 'O' ? 'O' : 'X';
    const used = new Set(sk.raw.players.map(p => String(p.id).toUpperCase()));
    let n = 1; while (n <= per && used.has(letter + n)) n++;
    if (n > per) { toast(`All ${per} ${letter}'s are on the field.`); return; }
    snapshot();
    sk.raw.players.push({ id: letter + n, side, at: { x: +pt[0].toFixed(1), y: +pt[1].toFixed(1) } });
    if (!sk.raw.ball && side === 'O') sk.raw.ball = letter + n;
    loadSketch();
  }
  function giveBall(p) {
    const sk = state.sketch;
    if (p.side !== 'O') { toast('Only an O can have the ball.'); return; }
    if (sk.raw.beats.length) { toast('Give the ball before drawing, or draw a pass to them.'); return; }
    snapshot(); sk.raw.ball = p.id; loadSketch(); toast(`${nameOf(p.id)} has the ball.`);
  }
  // move a player: their starting spot, or where their last move ends
  function movePlayer(id, end) {
    const sk = state.sketch; snapshot();
    const to = { x: +end[0].toFixed(1), y: +end[1].toFixed(1) };
    for (let k = sk.raw.beats.length - 1; k >= 0; k--) {
      const a = sk.raw.beats[k].actions.find(x => x.who === id && state.sport.kinds[x.kind].type === 'move');
      if (a) { a.to = to; a.path = []; a.via = null; loadSketch(); return; }
    }
    const p = sk.raw.players.find(q => String(q.id).toUpperCase() === id); if (p) p.at = to;
    loadSketch();
  }
  // erase: a player (and everything they do), or the line under the finger
  function erase(pt, pi) {
    const sk = state.sketch, sim = state.sim, U = state.sport.mark;
    if (pi >= 0) {
      const id = state.play.players[pi].id;
      if (id === sk.raw.ball && sk.raw.beats.length) { toast('That player has the ball. Erase their lines instead, or Clear.'); return; }
      snapshot();
      sk.raw.players = sk.raw.players.filter(q => String(q.id).toUpperCase() !== id);
      sk.raw.beats = sk.raw.beats.map(b => Object.assign(b, { actions: b.actions.filter(a => a.who !== id && a.target !== id) })).filter(b => b.actions.length);
      if (sk.raw.ball === id) sk.raw.ball = (sk.raw.players.find(q => q.side === 'O') || {}).id;
      loadSketch(); return;
    }
    let best = -1, bd = 1.3 * U;
    sim.routes.forEach((r, i) => { if (r.auto) return; sim.routeSlice(i, 1).forEach(q => { const d = Math.hypot(q[0] - pt[0], q[1] - pt[1]); if (d < bd) { bd = d; best = i; } }); });
    if (best < 0) return;
    const r = sim.routes[best], who = sim.players[r.p].id, beat = sk.raw.beats[r.beat];
    if (!beat) return;
    snapshot();
    beat.actions = beat.actions.filter(a => !(a.who === who && a.kind === r.kind));
    if (!beat.actions.length) sk.raw.beats.splice(r.beat, 1);
    loadSketch();
  }

  // a rough stroke → an action, read the way a coach means it (engine/sketch.js)
  function commitStroke(d) {
    const t0 = performance.now(), sk = state.sketch, sport = state.sport, r = interpret(d), a = r.action, who = state.play.players[d.i], readMs = performance.now() - t0;
    snapshot();
    // football: the center has it before the snap; the first stroke snaps it to the QB
    if (sport.kinds.snap && sk.raw.beats.length === 0 && byId('O1') && byId('O2') && sk.raw.ball === 'O2') {
      sk.raw.beats.push({ say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] });
    }
    const say = `${who.id} ${r.label}`;
    // together: the "Same time" switch, or two quick strokes by different players
    const lastBeat = sk.raw.beats[sk.raw.beats.length - 1], quick = performance.now() - sk.lastAt < 1200;
    const ballish = x => sport.kinds[x.kind].type !== 'move';
    const fits = lastBeat && !lastBeat.actions.some(x => x.who === who.id) && !(ballish(a) && lastBeat.actions.some(ballish)) && !(lastBeat.actions.some(x => x.kind === 'snap'));
    if (fits && (R.together.checked || quick)) { lastBeat.actions.push(a); lastBeat.say = lastBeat.say.replace(/\.$/, '') + ', ' + say + '.'; }
    else sk.raw.beats.push({ say: say + '.', actions: [a] });
    sk.lastAt = performance.now();
    loadSketch();
    coachStroke(a, readMs);
    R.caption.innerHTML = `<span class="ct-n">${sk.raw.beats.length}</span>${mark(say)}${r.snapped ? ` <span class="ct-hint">(snapped to the ${esc(r.snapped)})</span>` : ''}`;
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
  // a view is always the right way up: yaw within about 70° of the coach's side, pitch between a low sideline
  // angle and top-down. Anything else (an old saved flip, a NaN) resets to the coach view.
  function sanePose(p) {
    if (!p || !isFinite(p.yaw) || !isFinite(p.pitch)) return null;
    const TAU = Math.PI * 2, yaw = p.yaw - Math.round(p.yaw / TAU) * TAU;
    return { yaw: Math.max(-1.25, Math.min(1.25, yaw)), pitch: Math.max(-0.3, Math.min(0.8, p.pitch)) };
  }
  function loadView() {
    const fresh = { pose: null, zoom: 1, locked: false };
    try {
      const v = JSON.parse(localStorage.getItem(viewKey()) || 'null'); if (!v) return fresh;
      const pose = sanePose(v.pose), bad = v.pose && (!pose || Math.abs(pose.yaw - v.pose.yaw) > 0.01 || Math.abs(pose.pitch - v.pose.pitch) > 0.01);
      return bad ? fresh : { pose, zoom: isFinite(v.zoom) ? Math.max(0.6, Math.min(2.4, v.zoom)) : 1, locked: !!v.locked };
    } catch (e) { return fresh; }
  }
  function resetView() { state.view = { pose: null, zoom: 1, locked: false }; saveView(); applyView(); toast('View reset.'); }
  function saveView() { try { localStorage.setItem(viewKey(), JSON.stringify(state.view)); } catch (e) {} }
  function applyView() {
    if (!field) return;
    const v = state.view;
    field.setPose(v.pose ? { yaw: v.pose.yaw, pitch: v.pose.pitch, roll: 0 } : null);
    field.set({ interactive: !v.locked, radius: (w, h) => fitR(w, h) * v.zoom });
    R.viewBtn.classList.toggle('on', v.locked);
    R.viewBtn.innerHTML = icon(v.locked ? 'lock' : 'view') + '<span>View</span>';
  }
  R.viewBtn.onclick = () => {
    if (root.querySelector('.ct-panel:not(.out).ct-viewp')) { closePanel(); return; }
    const v = state.view;
    const body = `<div class="ct-seg"><span>Angle</span><button data-p="coach">Coach</button><button data-p="top">Top-down</button><button data-p="side">Sideline</button></div>
      <div class="ct-seg"><span>Zoom</span><button data-z="-1" aria-label="Zoom out">−</button><button data-z="0">Fit</button><button data-z="1" aria-label="Zoom in">+</button></div>
      <button class="ct-lock" data-reset>${icon('undo')}<span>Reset to the coach view</span></button>
      <button class="ct-lock${v.locked ? ' on' : ''}" data-lock>${icon(v.locked ? 'lock' : 'unlock')}<span>${v.locked ? 'Locked. Tap to unlock' : 'Lock this view'}</span></button>
      <p class="ct-fine">Drag the field to orbit, scroll or pinch to zoom, then lock it. Saved for each sport on this device.</p>`;
    openPanel(R.viewBtn, 'View', body, pb => {
      pb.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.p) state.view.pose = Object.assign({}, PRESETS[b.dataset.p]);
        if (b.dataset.z) state.view.zoom = b.dataset.z === '0' ? 1 : Math.max(0.6, Math.min(2.4, state.view.zoom * (b.dataset.z === '1' ? 1.15 : 1 / 1.15)));
        if (b.hasAttribute('data-lock')) { toggleLock(); closePanel(); R.viewBtn.click(); return; }
        if (b.hasAttribute('data-reset')) { closePanel(); resetView(); return; }
        saveView(); applyView();
      };
    }, 'ct-viewp');
  };
  function toggleLock() {
    state.view.locked = !state.view.locked; if (state.view.locked && !state.view.pose) capturePose();
    saveView(); applyView(); toast(state.view.locked ? 'View locked.' : 'View unlocked. Drag to orbit.');
  }
  // after a drag, hold the field where it was left (no drifting back)
  function capturePose() {
    const v = field.view(), TAU = Math.PI * 2;
    state.view.pose = sanePose({ yaw: v.yaw - Math.round(v.yaw / TAU) * TAU, pitch: v.pitch + 0.06 });
  }
  const stage = root.querySelector('.ct-stage');
  // the court stays still under the players: aurora-field pushes particles away from a hovering pointer,
  // which bent the lines out from under the X's and O's. Only drags (orbit) and pens reach it.
  root.addEventListener('pointermove', e => {
    if (e.buttons || e.pointerType === 'pen' || state.laser || !stage.contains(e.target)) return;
    if (e.target === canvas) e.stopPropagation();
  }, true);
  // while dragging, never let the orbit pass the safe range (it would show the field upside down)
  stage.addEventListener('pointermove', e => {
    if (!e.buttons || !field || state.view.locked || state.sketch || e.target !== canvas) return;
    const v = field.view(), s2 = sanePose(v);
    if (s2 && (Math.abs(s2.yaw - (v.yaw - Math.round(v.yaw / (Math.PI * 2)) * Math.PI * 2)) > 0.001 || Math.abs(s2.pitch - v.pitch) > 0.001)) field.setPose({ yaw: s2.yaw, pitch: s2.pitch, roll: 0 });
  });
  stage.addEventListener('dblclick', e => { if (e.target === canvas && !state.sketch) resetView(); });   // double-tap the field: back to the coach view
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

  // tap what it heard to fix it: the fix is learned, and the play is redrawn from the corrected words
  R.heard.addEventListener('click', () => {
    const was = R.heard.dataset.said; if (!was || R.heard.querySelector('input')) return;
    R.heard.innerHTML = `<input class="ct-fixin" value="${esc(was)}" aria-label="Fix what it heard" enterkeyhint="go">`;
    const inp = R.heard.querySelector('input'); inp.focus(); inp.select();
    const done = commit => {
      const v = inp.value.trim(); R.heard.textContent = '“' + (commit && v ? v : was) + '”';
      if (!commit || !v || v === was) return;
      const learned = correct(was, v);
      if (learned.length) toast(`Got it. Next time “${learned[0][0]}” means “${learned[0][1]}”.`);
      learned.forEach(([a, b]) => share(ownApi(), { kind: 'word', a, b }));
      heard(v);
    };
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); done(true); } if (e.key === 'Escape') { e.stopPropagation(); done(false); } };
    inp.onblur = () => done(false);
  });

  // ---- ears ----
  const ear = listener(t => heard(t, { source: 'voice' }), (st, text) => {
    R.mic.dataset.state = st; R.tbMic.dataset.state = st; R.rlMic.dataset.state = st;
    if (st === 'hearing') { R.heard.textContent = text; live.hear(text); }
    if (st === 'idle' && !text && live.mode === 'listen') live.hide();
    if (st === 'error') live.hide();
    if (st === 'listening') { hush(); live.listen(); R.heard.textContent = 'Listening…'; R.heard.classList.remove('fix'); chime('ask'); }
    if (st === 'error' && text) toast(text);
  }, blob => transcribe(blob, state.sport.id), () => vocabulary(state.sport));
  if (!ear) { R.mic.disabled = true; R.mic.title = 'This browser cannot hear you. Type instead.'; }
  R.mic.onclick = () => { if (!ear) return; ear.on ? ear.stop() : ear.start(); };
  let spaceDown = false;
  const typing = e => e.target.closest && e.target.closest('input, textarea, [contenteditable]');
  const visible = () => root.isConnected && root.getBoundingClientRect().height > 0;
  const kd = e => {
    if (typing(e) || !visible() || R.keyDlg.open) return;
    if (root.classList.contains('ct-present-on')) poke();
    if (e.code === 'Space' && !e.repeat && ear) { e.preventDefault(); spaceDown = true; ear.start(); }
    if (e.key === 'ArrowRight') act('next');
    if (e.key === 'ArrowLeft') act('back');
    if (e.key === 'Escape') {
      if (!R.spot.hidden) { endTour(); return; } if (root.querySelector('.ct-panel:not(.out)')) { closePanel(); return; }
      if (state.coach) { endCoach(false); return; } if (state.quiz) { iq.stop(); return; } if (state.focus) { R.focusChip.click(); return; }
      if (root.classList.contains('ct-present-on')) { present(false); return; } if (state.sketch) { finishSketch(); return; } if (root.classList.contains('ct-board')) boardOnly(false);
    }
    const tc = root.querySelector('.ct-panel:not(.out).ct-tourcard');
    if (tc && tc._step && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); spotlight(tc._step.steps, tc._step.i + (e.key === 'ArrowRight' ? 1 : -1), tc._step.eyebrow); return; }
    if (e.key === '?') { R.helpBtn.click(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && state.sketch) { e.preventDefault(); R.undo.click(); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k2 = e.key.toLowerCase();
    if (state.sketch) {
      const tools = { d: 'draw', m: 'move', e: 'erase', b: 'ball', o: 'O', x: 'X' };
      if (tools[k2]) { setTool(tools[k2]); return; }
      if (k2 === 't') { R.together.checked = !R.together.checked; return; }
    }
    if (state.quiz) return;
    if (k2 === 'g') guide();
    if (k2 === 'r') openFilmRoom();
    if (k2 === 'i') iq.open();
    if (k2 === 'f') present();
    if (k2 === 'w') boardOnly();
    if (k2 === 'h') myPlays();
    if (e.key === '[') flipSide('lib');
    if (e.key === ']') flipSide('card');
    if (k2 === 'm' && !state.sketch) R.moreBtn.click();
    if (k2 === '0') resetView();
    if (k2 === 's') act('sketch');
    if (k2 === 'd') act('defense');
    if (k2 === 'l') toggleLock();
    if (k2 === 'n' && names.any()) R.namesBtn.click();
    if (k2 === '=' || k2 === '+') { state.view.zoom = Math.min(2.4, state.view.zoom * 1.15); saveView(); applyView(); }
    if (k2 === '-') { state.view.zoom = Math.max(0.6, state.view.zoom / 1.15); saveView(); applyView(); }
    if (k2 === 'p' || k2 === 'k') act('toggle');
  };
  const ku = e => { if (e.code === 'Space' && spaceDown) { spaceDown = false; ear && ear.stop(); } };
  addEventListener('keydown', kd); addEventListener('keyup', ku);
  R.ask.onsubmit = e => { e.preventDefault(); heard(R.askText.value, { source: 'text' }); R.askText.value = ''; R.askText.blur(); };


  // ---- the guide, CourtIQ / FieldIQ, stats ----
  const panelAt = anchor => (title, body, onMount, cls) => openPanel(anchor, title, body, onMount, cls);
  let band = 'young'; try { band = localStorage.getItem('chalktalk.band') || 'young'; } catch (e) {}
  const guide = start => (track('guide_open'), openGuide({ sport: state.sport, play: state.play, openPanel: panelAt(R.guideBtn), mark, band,
    setBand: b => { band = b; try { localStorage.setItem('chalktalk.band', b); } catch (e) {} },
    say: t => say(t, key.get()), watch }, start));
  R.guideBtn.onclick = () => guide();
  // watch one player: everyone else dims, their routes light up, and the play runs from their first move
  function watch(id, beat) {
    closePanel();
    const sim = state.sim, k = beat != null ? beat : Math.max(0, sim.play.beats.findIndex(b => b.actions.some(a => a.who === id)));
    state.focus = id; R.focusChip.hidden = false; R.focusChip.innerHTML = `${icon('view')}<span>Watching <b>${esc(nameOf(id))}</b></span>${icon('close')}`;
    sim.seek(Math.max(0, k - 0.15)); sim.playing(true); renderDots();
  }
  R.focusChip.onclick = () => { state.focus = null; R.focusChip.hidden = true; };

  const iq = createIQ({
    root, team: opts.team, track, sport: () => state.sport, openPanel: panelAt(R.iqBtn), closePanel, toast, posName, strip,
    speak: t => speak(spoken(t)),
    enter() { closePanel(); hush(); state.quiz = { defense: state.defense, raw: state.raw, key: state.libKey }; root.classList.add('ct-quiz'); },
    exit() {
      const q = state.quiz; state.quiz = null; state.quizStop = null; state.reveal = null; root.classList.remove('ct-quiz');
      if (q) { state.defense = q.defense; renderDefense(); load(q.raw, { key: q.key, quiet: true }); }
    },
    loadQuiz(raw, speed) { state.defense = true; renderDefense(); load(raw, { quiet: true }); state.reveal = null; state.quizStop = null; state.sim.speed(speed); state.sim.seek(0); state.sim.playing(true); renderDots(); },
    reveal(q, given, g) {
      state.reveal = { right: q.type === 'pass' ? [q.answer] : [], wrong: q.type === 'pass' && given && !g.right ? [given] : [], spot: q.type === 'spot' ? q.answer : null, tol: q.tol, tap: q.type === 'spot' ? given : null };
      if (q.type === 'pass' || q.type === 'spot') { state.quizStop = q.beat + (q.type === 'pass' ? 1.2 : 0.99); state.sim.playing(true); }
    },
    hint(q) { if (q.type === 'pass') state.reveal = { hint: [q.answer].concat(q.also) }; else if (q.type === 'spot') state.reveal = { spot: q.answer, tol: q.tol * 1.6 }; }
  });
  R.iqBtn.onclick = () => iq.open();
  R.ink.addEventListener('pointerdown', e => {   // IQ: tap the spot
    if (!state.quiz || !iq.wantsSpot()) return;   // player taps go on to the player's own handler
    e.stopPropagation(); e.preventDefault();
    const host = R.ink.getBoundingClientRect(), pt = unproject(e.clientX - host.left, e.clientY - host.top);
    iq.answer(pt);
  }, true);
  R.statsBtn.onclick = () => (track('stats_open'), openStats({ sport: state.sport, sim: state.sim, openPanel: panelAt(R.statsBtn), posName, mark, toast }));

  // ---- the booth: the AI analyst rewrites the engine's read with colour (once per play, when narrating) ----
  const boothCache = new Map();
  function boothAI() {
    const play = strip(state.play), id = JSON.stringify(play.beats.map(b => b.actions)) + state.defense, booth = state.booth;
    if (boothCache.has(id)) { booth.ai = boothCache.get(id); return; }
    analyst({ sport: state.sport, play, facts: booth.lines }).then(r => { if (r && Array.isArray(r.lines) && r.lines.length === booth.lines.length) { boothCache.set(id, r.lines); booth.ai = r.lines; if (state.narrate) prefetch(r.lines.map(t => spoken(t)), key.get()); } }).catch(() => {});
  }

  // ---- presenter mode: the board full screen for a TV (AirPlay, Cast, any mirroring) ----
  let wake = null, idleT = 0;
  function renderDefense() {
    R.defBtn.classList.toggle('on', state.defense); R.defBtn.setAttribute('aria-checked', state.defense);
    R.pDef.classList.toggle('on', state.defense); R.pDef.setAttribute('aria-checked', state.defense);
  }
  function renderPresent() {
    if (!root.classList.contains('ct-present-on') || !state.play) return;
    const k = state.sim.beatAt(), info = state.sim.beatInfo(k);
    R.lowerK.textContent = state.play.concept || state.sport.short;
    R.lowerT.textContent = state.play.title;
    R.lowerS.innerHTML = info ? `<span class="ct-n">${k + 1}</span>` + mark(lineFor(k, info.say)) : 'That’s the play.';
    R.pPlay.innerHTML = icon(state.sim.playing() ? 'pause' : 'play');
    R.pVoice.querySelector('span').textContent = state.narrate ? (state.style === 'analyst' ? 'Analyst' : 'Play-by-play') : 'Voice off';
    R.pVoice.classList.toggle('on', state.narrate);
  }
  async function present(on) {
    on = on == null ? !root.classList.contains('ct-present-on') : on;
    root.classList.toggle('ct-present-on', on); R.presentBar.hidden = !on; R.presentBtn.classList.toggle('on', on);
    closePanel();
    if (on) {
      track('present');
      try { if (!document.fullscreenElement && root.requestFullscreen) await root.requestFullscreen({ navigationUI: 'hide' }); } catch (e) {}
      try { wake = navigator.wakeLock ? await navigator.wakeLock.request('screen') : null; } catch (e) {}
      toast('Presenter mode. Mirror this screen with AirPlay or Cast; ← → step, P plays, Esc exits.');
      poke(); renderPresent();
    } else {
      state.laser = false; root.classList.remove('ct-laser'); R.pLaser.classList.remove('on');
      try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) {}
      try { wake && wake.release(); } catch (e) {} wake = null;
    }
    setTimeout(() => { applyView(); }, 120);
  }
  const poke = () => { root.classList.remove('ct-idle'); clearTimeout(idleT); idleT = setTimeout(() => root.classList.contains('ct-present-on') && root.classList.add('ct-idle'), 3200); };
  root.addEventListener('pointermove', () => { if (root.classList.contains('ct-present-on')) poke(); });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && root.classList.contains('ct-present-on')) present(false); });
  R.presentBtn.onclick = () => present();
  R.pbar.addEventListener('click', e => {
    const b = e.target.closest('[data-p]'); if (!b) return; const c = b.dataset.p;
    if (c === 'exit') return present(false);
    if (c === 'laser') { state.laser = !state.laser; root.classList.toggle('ct-laser', state.laser); b.classList.toggle('on', state.laser); b.setAttribute('aria-pressed', state.laser); toast(state.laser ? 'Laser: drag on the board to point.' : 'Laser off.'); return; }
    if (c === 'voice') { if (!state.narrate) { state.narrate = true; state.style = 'analyst'; } else if (state.style === 'analyst') state.style = 'pbp'; else { state.narrate = false; hush(); } saveStyle(); renderNarrate(); renderPresent(); if (state.narrate && state.style === 'analyst') boothAI(); return; }
    if (c === 'lib') { openPanel(b, 'Plays', `<div class="ct-menu ct-plays">${state.sport.plays.map(p => `<button type="button" data-k="${esc(p.key)}"><span>${esc(p.title)}</span><small>${esc(p.concept)}</small></button>`).join('')}</div>`, pb => { pb.onclick = e2 => { const x = e2.target.closest('[data-k]'); if (x) { closePanel(); teach(x.dataset.k); } }; }); return; }
    act(c); renderPresent();
  });
  // the laser: drag on the board and a glowing trail follows, then fades
  stage.addEventListener('pointerdown', e => { if (state.laser && root.classList.contains('ct-present-on')) { e.stopPropagation(); e.preventDefault(); state.lasing = true; const h = R.ink.getBoundingClientRect(); state.laserAt = [e.clientX - h.left, e.clientY - h.top]; laserPts.push([state.laserAt[0], state.laserAt[1], performance.now()]); } }, true);
  stage.addEventListener('pointermove', e => {
    if (!state.laser || !root.classList.contains('ct-present-on')) return;
    const h = R.ink.getBoundingClientRect(), evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e], now = performance.now();
    const last = evs[evs.length - 1] || e; state.laserAt = [last.clientX - h.left, last.clientY - h.top];
    if (state.lasing) evs.forEach(c => laserPts.push([c.clientX - h.left, c.clientY - h.top, now]));
  }, true);
  stage.addEventListener('pointerleave', () => { state.laserAt = null; });
  addEventListener('pointerup', () => { state.lasing = false; });

  // narration: off, the analyst (explains the read), or play-by-play
  const saveStyle = () => { try { localStorage.setItem('chalktalk.voiceStyle', state.style); } catch (e) {} };
  function voiceMenu() {
    openPanel(R.narrate, 'Voice', `<div class="ct-menu ct-voices">
      <button type="button" data-v="off" class="${!state.narrate ? 'on' : ''}">${icon('mute')}<span>Off<small>Quiet board</small></span></button>
      <button type="button" data-v="analyst" class="${state.narrate && state.style === 'analyst' ? 'on' : ''}">${icon('speaker')}<span>Analyst<small>Explains the read: the coverage, the defender who moves, why the ball goes there</small></span></button>
      <button type="button" data-v="pbp" class="${state.narrate && state.style === 'pbp' ? 'on' : ''}">${icon('film')}<span>Play-by-play<small>Calls each step as it happens</small></span></button>
      <label class="ct-check"><input type="checkbox" data-v="sound" ${soundOn() ? 'checked' : ''}> Sound effects</label></div>`, pb => {
      pb.onclick = e => {
        const b = e.target.closest('[data-v]'); if (!b) return; const v = b.dataset.v;
        if (v === 'sound') { setSound(b.checked); return; }
        state.narrate = v !== 'off'; if (v !== 'off') state.style = v; saveStyle(); if (!state.narrate) hush();
        renderNarrate(); renderPresent(); closePanel();
        if (state.narrate) { if (state.style === 'analyst') { boothAI(); if (!state.defense) toast('Analyst on. Turn on Defense to hear the reads against it.'); } const k = state.sim.beatAt(), b2 = state.sim.beatInfo(k); speakBeat(b2 ? b2.say : state.play.title, b2 ? k : null); }
      };
    });
  }

  // ---- first sketch: trace three ghost strokes, see each one read on the device instantly, then the AI takes over ----
  const COACH = {
    basketball: [
      { who: 'O1', type: 'dribble', path: [[0, 27], [5, 25.5], [10, 23]], say: 'Trace the glowing line from 1 in a <b>zigzag</b>. Zigzag means dribble.' },
      { who: 'O2', type: 'move', path: [[19, 19], [12, 12], [4, 6]], say: 'Now draw a straight line from 2 to the rim: a <b>cut</b>.' },
      { who: 'O1', type: 'pass', path: [[10, 23], [4, 7]], say: 'Last one: draw from 1 and <b>end on 2</b>. That’s a pass.' }
    ],
    // football: relative to the player (dx, dy in yards; dy < 0 is downfield), so it fits 5v5 and 7v7
    football: [
      { role: 'Z', type: 'route', rel: [[0, 0], [0, -6], [-7, -10]], say: 'Trace the glowing line from Z: up 6 yards and break in. A <b>slant</b>.' },
      { role: 'slot', type: 'route', rel: [[0, 0], [0, -4.5], [5, -4.5]], say: 'Now from the slot: up and out to the sideline. An <b>out</b>.' },
      { role: 'QB', type: 'pass', to: 0, say: 'Now draw from the QB and <b>end on Z</b>. That’s the throw.' }
    ]
  };
  function sketchCoach() {
    const fb = !!state.sport.kinds.route, steps = COACH[fb ? 'football' : 'basketball'];
    state.coach = { i: 0, steps, times: [] };
    load(blank(), { quiet: true });
    if (!state.sketch) toggleSketch(); else loadSketch();
    // where a football step's ghost goes, from where the players really stand
    const P0 = state.sim.posAt(0), at = q => P0[state.sim.idx[q.id]];
    const find = role => role === 'slot' ? state.play.players.filter(q => q.role === 'H' || q.role === 'Y').sort((a, b) => b.x - a.x)[0] : state.play.players.find(q => q.role === role);
    const pathOf = st => {
      if (!fb) return st.path;
      if (st.rel) { const q = find(st.role), o = q ? at(q) : [0, state.sport.los]; return st.rel.map(([dx, dy]) => [o[0] + dx, o[1] + dy]); }
      const q = find(st.role), z = pathOf(steps[st.to]); return [q ? at(q) : [0, state.sport.los + 5], z[z.length - 1]];
    };
    const show = () => {
      const c = state.coach; if (!c) return;
      const st = c.steps[c.i];
      if (!st) {
        state.ghost = null;
        R.coach.innerHTML = `<div class="ct-coachk">Your first play</div><p>That’s a play, drawn in seconds. Every stroke was read right here on the device in about <b>${Math.max(1, Math.round(c.times.reduce((a, b) => a + b, 0) / Math.max(1, c.times.length)))} ms</b>.</p><p>Now tap <b>Done</b>: the AI cleans it up, names the concept and suggests the next read.</p><div class="ct-coachrow"><button type="button" class="go" data-c="done">${icon('check')}<span>Done: let the AI take over</span></button></div>`;
        return;
      }
      state.ghost = { pts: pathOf(st) };
      R.coach.innerHTML = `<div class="ct-coachk">First sketch · ${c.i + 1} of ${c.steps.length}</div><p>${st.say}</p><div class="ct-coachrow"><span class="ct-coachdots">${c.steps.map((_, j) => `<i class="${j < c.i ? 'done' : j === c.i ? 'now' : ''}"></i>`).join('')}</span><span class="ct-coachms" data-r="cms"></span><button type="button" data-c="skip">Skip</button></div>`;
    };
    state.coach.show = show; R.coach.hidden = false; show();
  }
  function coachStroke(a, ms) {
    const c = state.coach; if (!c) return;
    const st = c.steps[c.i], K = state.sport.kinds[a.kind], type = a.kind === 'dribble' ? 'dribble' : K.type === 'pass' ? 'pass' : K.type === 'move' ? (a.kind === 'route' ? 'route' : 'move') : K.type;
    const ok = st && (type === st.type || (st.type === 'move' && K.type === 'move' && a.kind !== 'dribble') || (st.type === 'route' && K.type === 'move'));
    c.times.push(ms); chime(ok ? 'yes' : 'stroke');
    const msEl = R.coach.querySelector('[data-r=cms]');
    if (ok) { c.i++; c.show(); const m2 = R.coach.querySelector('[data-r=cms]'); if (m2) m2.textContent = `✓ read in ${Math.max(1, Math.round(ms))} ms`; }
    else if (msEl) msEl.textContent = `That read as a ${a.kind}. Try the glowing line.`;
  }
  function endCoach(go) {
    if (!state.coach) return;
    state.coach = null; state.ghost = null; R.coach.hidden = true; seen.set('sketchIntro', VERSION);
    if (go && state.sketch) finishSketch();
  }
  R.coach.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; endCoach(b.dataset.c === 'done'); });


  // ---- phones and tablets: a tab bar (Plays, Sketch, the mic, Defense, More) and a control center ----
  const isTouchLayout = () => getComputedStyle(root.querySelector('.ct-tabbar')).display !== 'none';
  function playsSheet() {
    const groups = {};
    state.sport.plays.forEach(p => { (groups[p.concept] = groups[p.concept] || []).push(p); });
    openPanel(R.playChip, state.sport.name + ' plays', `<button type="button" class="ct-minebar" data-mine="1">${icon('film')}<span><b>My plays</b><small>${history.all().filter(e => e.sport === state.sport.id).length} you’ve drawn · instant, no AI</small></span>›</button>${recentHTML()}<div class="ct-playgrid">${state.sport.plays.map(p => `<button type="button" data-k="${esc(p.key)}" class="${p.key === state.libKey ? 'on' : ''}"><small>${esc(p.concept)}</small><b>${esc(p.title)}</b></button>`).join('')}</div>`, pb => {
      pb.onclick = e => { if (e.target.closest('[data-mine]')) { myPlays(); return; } const hb = e.target.closest('[data-hist]'); if (hb) { runHistory(hb.dataset.hist); return; } const b = e.target.closest('[data-k]'); if (b) { closePanel(); teach(b.dataset.k); } };
    }, 'ct-xl');
  }
  // the control center: destinations as tiles, and every on/off as a stock switch row that flips in place
  function controlCenter() {
    const fb = !!state.sport.kinds.route;
    const tiles = [
      ['mine', 'film', 'My plays', 'Everything you’ve drawn'],
      ['guide', 'book', 'Guide', 'Positions in depth'],
      ['iq', 'trophy', state.sport.iq ? state.sport.iq.name : 'IQ', 'Read plays, level up'],
      ['present', 'cast', 'Present', 'TV, AirPlay, Cast'],
      ['stats', 'chart', 'Stats', 'Play numbers, AI cost'],
      ['view', 'view', 'Angles', 'Coach, top-down, sideline'],
      ['ai', 'sparkle', 'AI', keyKind(key.get()) ? NAMES[keyKind(key.get())] : opts.api ? 'Included' : 'Free AI'],
      ['voicestyle', 'speaker', 'Voice', state.narrate ? (state.style === 'analyst' ? 'Analyst' : 'Play-by-play') : 'Off'],
      ['help', 'info', 'Help', hasNews() ? 'What’s new' : 'Tour, shortcuts']
    ];
    const switches = () => [
      ['defense', 'shield', 'Defense', 'X’s guard, help and react on their own', state.defense],
      ['voice', 'speaker', 'Analyst voice', 'Explains the read as the play runs', state.narrate],
      fb ? ['fb', 'draw', 'Routes & coverage', 'Route tree, Cover 2 / 3, QB eyes', root.classList.contains('ct-fbopen')] : null,
      names.any() ? ['names', 'names', 'Show names', 'Kept on this device only', !!state.showNames] : null,
      ['board', 'expand', 'Whiteboard only', 'Full screen, panels away, icons only', root.classList.contains('ct-board')],
      ['lock', 'lock', 'Lock the view', 'Keep the field where you set it', !!state.view.locked],
      ['light', 'sun', 'Light mode', 'For a bright sideline', root.classList.contains('ct-light')],
      ['sound', 'speaker', 'Sound effects', 'Quiet chimes for reads and levels', soundOn()],
      ['share', 'brain', 'Help the voice learn', 'Share kept plays and fixed words, names removed', sharing()]
    ].filter(Boolean);
    const rows = () => switches().map(([k, ic, t, sub, on]) => `<button type="button" class="ct-row" role="switch" aria-checked="${!!on}" data-sw="${k}">${icon(ic)}<span><b>${esc(t)}</b><small>${esc(sub)}</small></span><i class="ct-ios${on ? ' on' : ''}"></i></button>`).join('');
    openPanel(isTouchLayout() ? R.playChip : R.moreBtn, 'Control center', `<div class="ct-cc">${tiles.map(([k, ic, t, sub], i) => `<button type="button" data-cc="${k}" style="--i:${i}">${icon(ic)}<b>${esc(t)}</b><small>${esc(sub)}</small></button>`).join('')}</div>
      <div class="ct-rows" data-r="ccRows">${rows()}</div>`, pb => {
      pb.onclick = e => {
        const sw = e.target.closest('[data-sw]');
        if (sw) {
          const k = sw.dataset.sw;
          if (k === 'defense') act('defense');
          if (k === 'voice') { state.narrate = !state.narrate; if (state.narrate) { state.style = 'analyst'; saveStyle(); boothAI(); } else hush(); renderNarrate(); renderPresent(); }
          if (k === 'fb') root.classList.toggle('ct-fbopen');
          if (k === 'names') R.namesBtn.click();
          if (k === 'lock') toggleLock();
          if (k === 'board') { closePanel(); boardOnly(); return; }
          if (k === 'light') setTheme(root.classList.contains('ct-light') ? 'dark' : 'light');
          if (k === 'sound') { setSound(!soundOn()); if (soundOn()) chime('yes'); }
          if (k === 'share') setSharing(!sharing());
          pb.querySelector('[data-r=ccRows]').innerHTML = rows();   // flip in place, the sheet stays open
          return;
        }
        const b = e.target.closest('[data-cc]'); if (!b) return; const k = b.dataset.cc; closePanel();
        ({ mine: () => myPlays(), guide: () => guide(), iq: () => iq.open(), view: () => R.viewBtn.click(), present: () => present(true), stats: () => R.statsBtn.click(),
          ai: () => openKey(), help: () => R.helpBtn.click(), voicestyle: () => voiceMenu() })[k]();
      };
    }, 'ct-xl ct-ccp');
  }
  root.querySelector('.ct-tabbar').addEventListener('click', e => {
    const b = e.target.closest('[data-tb]'); if (!b) return;
    ({ plays: playsSheet, guide: () => guide(), mic: () => R.mic.click(), film: () => openFilmRoom(), more: controlCenter })[b.dataset.tb]();
  });
  R.playChip.onclick = () => root.classList.toggle('ct-info');

  // ---- side panels collapse like an editor's: the plays list on the left, the play card on the right ----
  let side = { lib: false, card: false };
  try { side = Object.assign(side, JSON.parse(localStorage.getItem('chalktalk.panels') || '{}')); } catch (e) {}
  function renderSides() {
    root.classList.toggle('ct-libx', !!side.lib); root.classList.toggle('ct-cardx', !!side.card);
    R.libToggle.textContent = side.lib ? '›' : '‹'; R.libToggle.setAttribute('aria-label', (side.lib ? 'Show' : 'Collapse') + ' the plays list ([)');
    R.cardToggle.textContent = side.card ? '‹' : '›'; R.cardToggle.setAttribute('aria-label', (side.card ? 'Show' : 'Collapse') + ' the play card (])');
    R.libToggle.dataset.tip = side.lib ? 'Plays' : 'Collapse'; R.cardToggle.dataset.tip = side.card ? 'Play card' : 'Collapse';
  }
  const flipSide = k => { side[k] = !side[k]; try { localStorage.setItem('chalktalk.panels', JSON.stringify(side)); } catch (e) {} renderSides(); };
  R.libToggle.onclick = () => flipSide('lib');
  R.cardToggle.onclick = () => flipSide('card');
  renderSides();
  R.moreBtn.onclick = () => { if (root.querySelector('.ct-panel:not(.out).ct-ccp')) closePanel(); else controlCenter(); };
  R.tbSketch.onclick = () => act('sketch');

  // ---- whiteboard only: full screen, every panel collapsed, a slim rail of icons ----
  async function boardOnly(on) {
    on = on == null ? !root.classList.contains('ct-board') : on;
    if (on && root.classList.contains('ct-present-on')) present(false);
    root.classList.toggle('ct-board', on); R.boardBtn.classList.toggle('on', on); closePanel(); root.classList.remove('ct-info');
    if (on) { track('board_only'); try { if (!document.fullscreenElement && root.requestFullscreen) await root.requestFullscreen({ navigationUI: 'hide' }); } catch (e) {} }
    else { try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) {} }
    renderRail(); setTimeout(applyView, 120);
  }
  function renderRail() {
    R.rlDef.classList.toggle('on', state.defense); R.rlSketch.classList.toggle('on', !!state.sketch);
    if (state.sim) R.rlPlay.innerHTML = icon(state.sim.playing() ? 'pause' : 'play');
  }
  R.boardBtn.onclick = () => boardOnly();
  root.querySelector('.ct-rail').addEventListener('click', e => {
    const b = e.target.closest('[data-rl]'); if (!b) return; const c = b.dataset.rl;
    if (c === 'exit') return boardOnly(false);
    if (c === 'mic') return R.mic.click();
    if (c === 'plays') return playsSheet();
    act(c); renderRail();
  });
  // whiteboard only ends when the coach says so (Exit, Esc, W), never because the browser left full screen:
  // on iPad, editing a label or sketching can drop full screen, and the board must stay as it was


  // ---- light and dark: dark by default (the light glows), light for a bright sideline, or follow the device ----
  let theme = 'dark'; try { theme = localStorage.getItem('chalktalk.theme') || 'dark'; } catch (e) {}
  const mq = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: light)') : null;
  function applyTheme() {
    const light = theme === 'light' || (theme === 'auto' && mq && mq.matches);
    root.classList.toggle('ct-light', light);
    R.themeBtn.innerHTML = icon(light ? 'sun' : 'moon') + '<span>' + (theme === 'auto' ? 'Auto' : light ? 'Light' : 'Dark') + '</span>';
    const meta = document.querySelector('meta[name=theme-color]'); if (meta && opts.fullscreen) meta.setAttribute('content', light ? '#f3efe6' : '#04070c');
  }
  function setTheme(t) { track('theme', { t }); theme = t; try { localStorage.setItem('chalktalk.theme', t); } catch (e) {} applyTheme(); }
  function themeMenu(anchor) {
    openPanel(anchor || R.themeBtn, 'Appearance', `<div class="ct-menu ct-voices">${[['dark', 'moon', 'Dark', 'The board glows. Best indoors and on a TV.'], ['light', 'sun', 'Light', 'High contrast for a bright sideline.'], ['auto', 'view', 'Auto', 'Follows this device.']].map(([k, ic, t, sub]) => `<button type="button" data-t="${k}" class="${theme === k ? 'on' : ''}">${icon(ic)}<span>${t}<small>${sub}</small></span></button>`).join('')}</div>`, pb => {
      pb.onclick = e => { const b = e.target.closest('[data-t]'); if (b) { setTheme(b.dataset.t); closePanel(); } };
    });
  }
  R.themeBtn.onclick = () => themeMenu();
  if (mq && mq.addEventListener) mq.addEventListener('change', applyTheme);
  applyTheme();


  // ---- CourtIQ connection (standalone board): the plan, what's left this month, connect / disconnect ----
  let fellBack = false;
  aiPlan.onFallback = msg => { if (fellBack) return; fellBack = true; toast((msg || 'This month’s AI is used up.') + ' Using the free AI until the 1st.'); };
  aiPlan.onUnlinked = () => { try { localStorage.removeItem(LINK); } catch (e) {} link = null; setAuth(null); setApi(ownApi()); toast('Your CourtIQ connection expired. Connect again in AI settings.'); };
  function renderCourtIQ() {
    if (!standalone) { R.ciq.hidden = true; return; }
    R.ciq.hidden = false;
    if (!link) {
      R.ciq.innerHTML = `<div><b>Chalk Talk AI with CourtIQ</b><small>Have Chalk Talk AI or any CourtIQ plan? Connect it and this board uses it. No key needed.</small></div><button type="button" data-c="connect">Connect CourtIQ</button>`;
      return;
    }
    const L = aiPlan.last;
    R.ciq.innerHTML = `<div><b>Connected to CourtIQ</b><small data-r="ciqUse">${L ? (L.plan === 'ai_plan' ? 'Chalk Talk AI' : 'Included with your plan') + (L.left != null ? ` · $${(+L.left).toFixed(2)} of AI left this month` : '') : 'Checking your plan…'}</small></div><button type="button" data-c="unlink">Disconnect</button>`;
    fetch(COURTIQ + '/api/labs/chalk-talk/usage', { headers: { authorization: 'Bearer ' + link } }).then(r => r.ok ? r.json() : null).then(u => {
      const el = R.ciq.querySelector('[data-r=ciqUse]'); if (!el || !u) return;
      el.textContent = !u.plan ? 'No Chalk Talk AI on this account yet.' : (u.plan === 'ai_plan' ? 'Chalk Talk AI' : 'Included with your CourtIQ plan') + ` · ${Math.max(0, Math.round(100 - (u.usedUSD / u.capUSD) * 100))}% left this month`;
    }).catch(() => {});
  }
  R.ciq.addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    if (b.dataset.c === 'connect') { track('courtiq_connect'); location.href = COURTIQ + '/labs/chalk-talk/connect?return=' + encodeURIComponent(location.origin + location.pathname); }
    if (b.dataset.c === 'unlink') { try { localStorage.removeItem(LINK); } catch (e2) {} link = null; setAuth(null); setApi(ownApi()); renderCourtIQ(); toast('Disconnected from CourtIQ.'); }
  });


  // ---- My plays: every play the AI drew for this coach, on this device ----
  const boardKey = () => state.play ? hashOf(JSON.stringify(strip(state.play))) : '-';
  function myPlays(start) {
    let q = '', f = start || 'all';
    const SRC = { voice: 'Said', text: 'Typed', sketch: 'Sketched' };
    const when = t => { const d = (Date.now() - t) / 864e5; return d < 1 ? new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : d < 7 ? new Date(t).toLocaleDateString([], { weekday: 'short' }) : new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' }); };
    const list = () => {
      const all = history.all().filter(e => e.sport === state.sport.id);
      const rows = all.filter(e => (f === 'all' || (f === 'fav' ? e.fav : e.source === f)) && (!q || (e.name || e.title || '').toLowerCase().includes(q) || (e.said || '').toLowerCase().includes(q) || (e.concept || '').toLowerCase().includes(q)));
      if (!all.length) return `<p class="ct-empty">Plays you say, type or sketch show up here, with the words that made them. Asking for one again is instant and uses no AI.</p>`;
      return rows.length ? `<ul class="ct-hist">${rows.map(e => `<li data-id="${esc(e.id)}"><button type="button" class="ct-hplay" data-a="play"><small>${esc(e.concept || 'Your play')} · ${esc(SRC[e.source] || 'Typed')} · ${when(e.at)}${e.uses > 1 ? ' · used ' + e.uses + '×' : ''}</small><b>${esc(e.name || e.title || 'Untitled play')}</b>${e.said && e.source !== 'sketch' ? `<span>“${esc(e.said)}”</span>` : ''}</button>
        <button type="button" data-a="fav" class="${e.fav ? 'on' : ''}" aria-label="${e.fav ? 'Unfavorite' : 'Favorite'}">${e.fav ? '★' : '☆'}</button><button type="button" data-a="name" aria-label="Rename">${icon('draw')}</button><button type="button" data-a="del" aria-label="Delete">${icon('close')}</button></li>`).join('')}</ul>` : '<p class="ct-empty">Nothing matches.</p>';
    };
    const body = `<div class="ct-histbar"><input type="search" data-r="hq" placeholder="Search your plays and the words you used" autocomplete="off"><div class="ct-seg">${[['all', 'All'], ['fav', '★'], ['voice', 'Said'], ['text', 'Typed'], ['sketch', 'Sketched']].map(([k, l]) => `<button type="button" data-f="${k}" class="${k === f ? 'on' : ''}">${l}</button>`).join('')}</div></div><div data-r="hlist">${list()}</div>`;
    openPanel(R.playChip, 'My plays · ' + state.sport.short, body, pb => {
      const L = pb.querySelector('[data-r=hlist]'), redraw = () => { L.innerHTML = list(); };
      pb.querySelector('[data-r=hq]').oninput = e => { q = e.target.value.trim().toLowerCase(); redraw(); };
      pb.onclick = e => {
        const fb = e.target.closest('[data-f]'); if (fb) { f = fb.dataset.f; pb.querySelectorAll('[data-f]').forEach(b => b.classList.toggle('on', b === fb)); redraw(); return; }
        const a = e.target.closest('[data-a]'), li = e.target.closest('[data-id]'); if (!a || !li) return;
        const id = li.dataset.id, entry = history.all().find(x => x.id === id); if (!entry) return;
        if (a.dataset.a === 'play') { runHistory(id); return; }
        if (a.dataset.a === 'fav') { history.update(id, { fav: !entry.fav }); redraw(); return; }
        if (a.dataset.a === 'del') { history.remove(id); redraw(); return; }
        if (a.dataset.a === 'name') {
          const b = li.querySelector('.ct-hplay b'); b.innerHTML = `<input class="ct-fixin" value="${esc(entry.name || entry.title || '')}" aria-label="Name this play">`;
          const inp = b.querySelector('input'); inp.focus(); inp.select();
          const save = () => { const v = inp.value.trim().slice(0, 60); history.update(id, { name: v || null }); redraw(); };
          inp.onkeydown = ev => { if (ev.key === 'Enter') save(); if (ev.key === 'Escape') { ev.stopPropagation(); redraw(); } }; inp.onblur = save; inp.onclick = ev => ev.stopPropagation();
        }
      };
    }, 'ct-xl ct-histp');
  }


  // ---- the live moment, front and center: listening (your words, big, as you say them), then drawing (the
  // steps it's working through, a clock), then the result. Tap Done to stop listening, Cancel to stop either.
  const live = (() => {
    let mode = null, t0 = 0, tick = 0, hideT = 0;
    const steps = ['Hearing your play', 'Placing the players', 'Drawing every move', 'Checking the read'];
    const clock = () => { R.liveTime.textContent = mode === 'draw' || mode === 'listen' ? ((performance.now() - t0) / 1000).toFixed(1) + ' s' : ''; if (mode === 'draw') { const k = Math.min(steps.length - 1, Math.floor((performance.now() - t0) / 2600)); R.liveSteps.querySelectorAll('li').forEach((li, i) => { li.className = i < k ? 'done' : i === k ? 'now' : ''; }); } };
    const open = m => { clearTimeout(hideT); mode = m; R.live.hidden = false; R.live.dataset.mode = m; root.classList.add('ct-liveon'); clearInterval(tick); t0 = performance.now(); tick = setInterval(clock, 100); clock(); };
    return {
      listen() { open('listen'); R.liveK.textContent = 'Listening'; R.liveSaid.textContent = 'Say the play: who has the ball, who moves, where it goes.'; R.liveSaid.classList.add('hint'); R.liveSteps.innerHTML = ''; R.liveStop.hidden = false; },
      hear(text) { if (mode !== 'listen') return; R.liveSaid.textContent = '“' + text + '”'; R.liveSaid.classList.remove('hint'); R.liveOrb.classList.remove('beat'); void R.liveOrb.offsetWidth; R.liveOrb.classList.add('beat'); },
      draw(text, sketch) {
        open('draw'); R.liveK.textContent = sketch ? 'The AI is taking over your sketch' : 'Drawing your play'; R.liveStop.hidden = true;
        if (text) { R.liveSaid.textContent = '“' + text + '”'; R.liveSaid.classList.remove('hint'); } else R.liveSaid.textContent = '';
        R.liveSteps.innerHTML = steps.map(x => `<li>${x}</li>`).join('');
      },
      done(msg) { if (!mode) return; mode = 'done'; R.live.dataset.mode = 'done'; clearInterval(tick); R.liveK.textContent = msg; R.liveSteps.querySelectorAll('li').forEach(li => { li.className = 'done'; }); R.liveTime.textContent = ''; R.liveStop.hidden = true; hideT = setTimeout(() => this.hide(), 1100); },
      hide() { mode = null; clearInterval(tick); clearTimeout(hideT); R.live.hidden = true; root.classList.remove('ct-liveon'); },
      get mode() { return mode; }
    };
  })();
  R.liveStop.onclick = () => { if (ear && ear.on) ear.stop(); };
  R.liveCancel.onclick = () => { if (ear && ear.on) { ear.stop(); } if (state.busy) state.busy.abort(); live.hide(); };

  // ---- the keys ----
  function badge(el2, kind) { el2.textContent = kind ? '✓ ' + kind : ''; el2.className = 'ct-badge' + (kind ? ' ok' : ''); }
  function openKey(why) {
    R.keyWhy.textContent = why || 'Plays from your own words, the AI taking over your sketches and the broadcaster voice all use your own AI account.';
    R.keyInput.value = key.get(); R.voiceInput.value = voiceKey.get();
    R.shareVoice.checked = sharing();
    renderCourtIQ();
    R.keyPro.hidden = !opts.upgrade; if (opts.upgrade) R.keyPro.innerHTML = `${icon('sparkle')}<span><b>${esc(opts.upgrade.label || 'Get unlimited AI')}</b><small>${esc(opts.upgrade.note || 'No key needed.')}</small></span>`;
    R.keyInput.oninput(); R.voiceInput.oninput();
    R.keyDlg.showModal();
  }
  R.keyInput.oninput = () => { const v = R.keyInput.value.trim(), k = keyKind(v); badge(R.keyBadge, k && NAMES[k]); if (v && !k) { R.keyBadge.textContent = 'that isn’t a key yet'; R.keyBadge.className = 'ct-badge bad'; } R.voiceInput.oninput && R.voiceInput.oninput(); };
  R.voiceInput.oninput = () => {
    const v = R.voiceInput.value.trim(), k = voiceKind(v);
    badge(R.voiceBadge, k === 'openai' ? 'OpenAI voice' : k === 'elevenlabs' ? 'ElevenLabs' : '');
    const reuse = keyKind(R.keyInput.value.trim()) === 'openai';
    R.voiceFine.textContent = k ? 'A broadcast analyst explains every step.' : reuse ? 'Your OpenAI play key already gives you the broadcaster voice.'
      : 'Without one, steps are read by this device\'s most natural voice' + (localVoiceName() ? ' (' + localVoiceName() + ')' : '') + '. With an OpenAI or ElevenLabs key, a broadcast analyst explains them.';
  };
  R.keyBtn.onclick = () => openKey();
  R.keyPro.onclick = () => { R.keyDlg.close(); upgradeAI(); };
  R.shareVoice.onchange = () => { setSharing(R.shareVoice.checked); track('share', { on: R.shareVoice.checked ? 1 : 0 }); toast(R.shareVoice.checked ? 'Thanks, coach. Kept plays and fixed words will help every coach (names stay here).' : 'Voice sharing off. Learning stays on this device.'); };
  R.keyCancel.onclick = () => R.keyDlg.close();
  R.keyX.onclick = () => R.keyDlg.close();
  R.keyDlg.addEventListener('click', e => { if (e.target === R.keyDlg) R.keyDlg.close(); });   // a tap on the backdrop closes it
  R.keyForm.onsubmit = e => {
    e.preventDefault();
    key.set(R.keyInput.value); voiceKey.set(R.voiceInput.value); track('key_saved', { kind: keyKind(key.get()) || 'none', voice: voiceKey.get() ? 1 : 0 }); R.keyDlg.close(); refreshKey();
    toast(keyKind(key.get()) ? 'Saved. Say any play.' : 'Keys saved.');
    if (state.play && state.narrate) prefetch(state.play.beats.map(b => spoken(b.say)), key.get());
  };
  R.keyClear.onclick = () => { key.set(''); voiceKey.set(''); R.keyInput.value = ''; R.voiceInput.value = ''; R.keyInput.oninput(); refreshKey(); };
  function refreshKey() { const k = keyKind(key.get()); R.keyBtn.classList.toggle('set', !!k); R.keyBtn.innerHTML = icon('sparkle') + '<span>' + (k ? NAMES[k] : 'AI') + '</span>'; }
  refreshKey();

  let toastT = 0;
  function toast(msg) { R.toast.textContent = msg; R.toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => R.toast.classList.remove('on'), 4200); }

  state.view = loadView();
  renderDefense();
  renderSports(); renderLibrary(); renderLegend(); renderHints();
  const first = state.sport.plays.find(p => p.key === opts.play) || state.sport.plays[0];
  load(first, { key: first.key, quiet: true });
  tipify(root);
  refreshLexicon(ownApi());
  // anonymous usage analytics (track.js): never names, words, keys or IPs. Off in development and when the host says so.
  const dev = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const refHost = (() => { try { const r = new URL(document.referrer).hostname; return r && r !== location.hostname ? r : null; } catch (e) { return null; } })();
  startTracking(ownApi(), opts.analytics !== false && !dev, {
    host: typeof location !== 'undefined' ? location.hostname : '', ref: refHost, v: VERSION,
    device: root.clientWidth < 640 ? 'phone' : root.clientWidth < 1100 || (matchMedia && matchMedia('(pointer: coarse)').matches) ? 'tablet' : 'desktop',
    pwa: !!(window.matchMedia && matchMedia('(display-mode: standalone)').matches),
    live: () => ({ sport: state.sport.id, ai: keyKind(key.get()) || (opts.api ? 'host' : 'free'), theme: root.classList.contains('ct-light') ? 'light' : 'dark' })
  });
  track('view', { lang: (navigator.language || '').slice(0, 5) });   // what other coaches taught it (no one's data, just confirmed phrases)
  if (opts.tour !== false) {
    if (!seen.get().tour) setTimeout(() => { if (!dead) startTour(); }, 1600);
    else if (hasNews()) { R.newsDot.hidden = false; R.tbDot.hidden = false; setTimeout(() => { if (!dead) toast(`New in v${VERSION}: ${RELEASES[0].title}. Tap ? to see it.`); }, 1800); }
  }

  return {
    load: raw => load(raw), teach, heard, act, guide: start => guide(start), film: id => openFilmRoom(id), iq: () => iq.open(), stats: () => R.statsBtn.click(), present: on => present(on), setSport: id => setSport(sportFor(id)), tour: () => startTour(), whatsNew: () => whatsNew(),
    get field() { return field; }, get play() { return state.play; }, get sport() { return state.sport.id; },
    destroy() {
      dead = true; cancelAnimationFrame(raf); hush(); closeEditor(); iq.destroy(); clearTimeout(state.keepT); try { wake && wake.release(); } catch (e) {} if (ear) ear.stop(); if (state.busy) state.busy.abort();
      removeEventListener('keydown', kd); removeEventListener('keyup', ku);
      if (field) field.destroy(); root.innerHTML = ''; root.classList.remove('ct-touch', 'ct-board', 'ct-laser', 'ct-light', 'ct', 'ct-full', 'ct-info', 'ct-drawing', 'ct-sketch', 'ct-quiz', 'ct-present-on', 'ct-idle');
    }
  };
}
