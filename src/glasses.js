// Chalk Talk Trace for Meta Ray-Ban Display (glasses.html): pick a sport, a play and your position, then step
// through your path as light on a heads-up radar. You are the gold arrow at the bottom, facing up the way your
// eyes look in the play; your move glows gold with light running along it, the ring is where it ends,
// teammates are orange, defenders blue X's, the ball gold. Built for the 600 × 600 additive display (black is
// see-through), arrow keys and Enter from the Neural Band, and the speaker (speechSynthesis; no microphone).
// Also works in any browser: arrows, Enter, Esc.

import { sports, getSport } from './sports/index.js';
import { normalize, compile } from './engine/sim.js';
import { trace, lookAt, positions, busiest, bounceIn, flightIn } from './engine/trace.js';

const app = document.getElementById('app');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const BEAT_MS = 1700;
let screen = 'sport', sport = null, sim = null, tr = null, who = -1, k = 0, t0 = 0, north = false, raf = 0, head = null, ppu = 0, bz = [], fl = [];
const nameOf = id => { const p = sim.play.players.find(q => q.id === id); return p ? sport.notation.name(p) : id; };
const say = text => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 1.05; speechSynthesis.speak(u); } catch (e) {} };

// ---- lists (sport, play, position): focusable buttons, arrows move, Enter picks ----
function list(title, sub, items, onPick, back) {
  cancelAnimationFrame(raf);
  app.innerHTML = `<h1>${esc(title)}</h1><p class="sub">${esc(sub)}</p><div class="list">${items.map((it, i) => `<button type="button" data-i="${i}" class="${it.cls || ''}">${esc(it.t)}${it.s ? `<small>${esc(it.s)}</small>` : ''}</button>`).join('')}</div>`;
  const bs = [...app.querySelectorAll('.list button')];
  bs.forEach((b, i) => { b.onclick = () => onPick(i); b.onfocus = () => b.scrollIntoView({ block: 'nearest' }); });
  (bs[0] || app).focus();
  keys = e => {
    const i = bs.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); bs[Math.min(bs.length - 1, i + 1)].focus(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); bs[Math.max(0, i - 1)].focus(); }
    else if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); back ? back() : history.back(); }
  };
}
let keys = () => {};
addEventListener('keydown', e => keys(e));

function pickSport() {
  screen = 'sport';
  const S = sports();
  list('Chalk Talk Trace', 'Pick your sport', S.map(s => ({ t: s.name, s: s.roster ? s.roster.label : '' })), i => pickPlay(S[i]));
}
function pickPlay(s) {
  sport = s; screen = 'play';
  const plays = s.plays.map(raw => ({ raw, n: normalize(raw, s) })).filter(p => p.n && p.n.play);
  list(s.short || s.name, 'Pick a play', plays.map(p => ({ t: p.n.play.title || p.raw.key, s: p.n.play.concept || '' })), i => {
    sim = compile(plays[i].n.play, s, { defense: true }); pickWho();
  }, pickSport);
}
function pickWho() {
  screen = 'who';
  const P = positions(sim, sport, nameOf), best = busiest(sim);
  P.sort((a, b) => (b.i === best) - (a.i === best));
  list(sim.play.title || 'Your position', 'Who are you?', P.map(p => ({ t: (p.side === 'D' ? (sport.sides ? sport.sides.D : 'Defense') + ': ' : '') + p.label, s: p.i === best ? 'Busiest in this play' : p.side === 'D' ? (sport.rally ? '' : 'Guard') : '', cls: p.side === 'D' ? 'd' : '' })), i => start(P[i].i), () => pickPlay(sport));
}

// ---- the trace: a heads-up radar of your path ----
function start(i) {
  who = i; tr = trace(sim, i, sport, nameOf); bz = sim.play.beats.map((_, j) => bounceIn(sim, sport, j)); fl = sim.play.beats.map((_, j) => flightIn(sim, sport, j)); k = 0; t0 = performance.now(); head = null; ppu = 0; screen = 'trace';
  app.innerHTML = '<canvas width="600" height="600"></canvas><div class="hint">◀ ▶ steps · Enter replays · ▲ turns the map</div>';
  keys = e => {
    const n = tr.steps.length;
    if (e.key === 'ArrowRight') { e.preventDefault(); k = Math.min(n - 1, k + 1); t0 = performance.now(); speakStep(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); k = Math.max(0, k - 1); t0 = performance.now(); speakStep(); }
    else if (e.key === 'Enter') { e.preventDefault(); t0 = performance.now(); speakStep(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); north = !north; head = null; }
    else if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); speechSynthesis && speechSynthesis.cancel(); pickWho(); }
  };
  speakStep();
  cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
}
const speakStep = () => say(`Step ${k + 1}. ${tr.steps[k].job}.`);

function draw(now) {
  raf = requestAnimationFrame(draw);
  const cv = app.querySelector('canvas'); if (!cv) return;
  const c = cv.getContext('2d'), u = Math.max(0, Math.min(1, (now - t0) / BEAT_MS)), t = k + u, P = sim.posAt(t), me = P[who];
  const want = north ? 0 : lookAt(sim, who, t, sport);
  if (head == null) head = want; let d = want - head; d = Math.atan2(Math.sin(d), Math.cos(d)); head += d * 0.08;
  const f = [Math.sin(head), -Math.cos(head)], r = [Math.cos(head), Math.sin(head)], cx = 300, cy = 392;
  // zoom so this step's move, the ball and the next ring all fit
  const step = tr.steps[k], B = sim.ballAt(t);
  let far = sport.mark * 4; for (const q of step.pts.concat([step.to, B ? [B[0], B[1]] : me])) far = Math.max(far, Math.hypot(q[0] - me[0], q[1] - me[1]));
  const want2 = 230 / far; ppu = ppu ? ppu + (want2 - ppu) * 0.08 : want2;
  const S = q => { const dx = q[0] - me[0], dy = q[1] - me[1]; return [cx + (dx * r[0] + dy * r[1]) * ppu, cy - (dx * f[0] + dy * f[1]) * ppu]; };
  c.globalCompositeOperation = 'source-over'; c.fillStyle = '#000'; c.fillRect(0, 0, 600, 600);
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
  const line = (pts, w, col, blur) => { if (pts.length < 2) return; c.beginPath(); pts.forEach((q, j) => { const s = S(q); j ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.lineWidth = w; c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = blur; c.stroke(); };
  // the field, faint
  for (const l of sport.field.lines({ los: sim.play.los })) if (l.p && l.p.length > 1 && !(l.p[0][2] > 0.1)) line(l.p, l.hot ? 4 : 1.5, l.hot ? 'rgba(238,244,255,.7)' : 'rgba(140,188,255,.28)', 0);
  // a net sport: the kitchens faint red (no volleys in there), and where the ball bounces this step
  const C = sport.court;
  if (C) {
    c.fillStyle = 'rgba(255,107,107,.13)'; c.shadowBlur = 0;
    for (const [y0, y1] of [[C.net - C.nvz, C.net], [C.net, C.net + C.nvz]]) { c.beginPath(); [[-C.W / 2, y0], [C.W / 2, y0], [C.W / 2, y1], [-C.W / 2, y1]].forEach((q, j) => { const s2 = S(q); j ? c.lineTo(s2[0], s2[1]) : c.moveTo(s2[0], s2[1]); }); c.fill(); }
    if (bz[k] && u > 0.2) { const s2 = S(bz[k]); c.beginPath(); c.arc(s2[0], s2[1], 12, 0, Math.PI * 2); c.lineWidth = 3; c.strokeStyle = 'rgba(169,212,255,.9)'; c.shadowColor = '#a9d4ff'; c.shadowBlur = 10; c.stroke(); }
  }
  // your path: done faint, to come dim, now bright with light running along it, and the ring where it ends
  tr.steps.forEach(s => { if (s.k !== k) line(s.pts, 6, s.k < k ? 'rgba(255,199,90,.22)' : 'rgba(255,199,90,.38)', 6); });
  if (step.pts.length > 1) {
    line(step.pts, 12, 'rgba(255,199,90,.95)', 18);
    c.setLineDash([4, 18]); c.lineDashOffset = -now / 25; line(step.pts, 6, 'rgba(255,255,230,1)', 10); c.setLineDash([]);
  }
  if (step.moved) { const e = S(step.to), pulse = 0.6 + 0.4 * Math.sin(now / 180); c.beginPath(); c.arc(e[0], e[1], 22, 0, Math.PI * 2); c.lineWidth = 5; c.strokeStyle = `rgba(255,199,90,${pulse})`; c.shadowColor = '#ffc75a'; c.shadowBlur = 16; c.stroke(); }
  // the goal you attack: a target, held at the edge at the edge when it's off the radar
  if (!sport.rally && sim.play.players[who].side === 'O') { let g2 = S(sport.field.goal); const dx = g2[0] - cx, dy = g2[1] - cy, m = Math.max(Math.abs(dx) / 270, Math.abs(dy) / 250, 1); g2 = [cx + dx / m, cy + dy / m]; c.beginPath(); c.arc(g2[0], g2[1], 10, 0, Math.PI * 2); c.moveTo(g2[0] + 18, g2[1]); c.arc(g2[0], g2[1], 18, 0, Math.PI * 2); c.lineWidth = 3; c.strokeStyle = 'rgba(238,244,255,.75)'; c.shadowColor = '#eef4ff'; c.shadowBlur = 8; c.stroke(); }
  // the ball's real flight this step: gold when it's coming to you
  const F = fl[k];
  if (F) { const mine = F.target === tr.id; c.setLineDash(mine ? [] : [10, 10]); line(F.pts, mine ? 5 : 3, mine ? 'rgba(255,199,90,.9)' : 'rgba(238,244,255,.6)', mine ? 14 : 6); c.setLineDash([]); if (mine) { const e = S(F.pts[F.pts.length - 1]); c.beginPath(); c.arc(e[0], e[1], 16, 0, Math.PI * 2); c.lineWidth = 3; c.strokeStyle = 'rgba(255,199,90,.9)'; c.stroke(); } }
  // everyone else
  c.font = '800 20px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  sim.play.players.forEach((p, i) => {
    if (i === who) return; const s = S(P[i]); if (s[0] < -20 || s[0] > 620 || s[1] < -20 || s[1] > 620) return;
    if (p.side === 'D') { c.beginPath(); c.moveTo(s[0] - 9, s[1] - 9); c.lineTo(s[0] + 9, s[1] + 9); c.moveTo(s[0] + 9, s[1] - 9); c.lineTo(s[0] - 9, s[1] + 9); c.lineWidth = 4; c.strokeStyle = '#a9d4ff'; c.shadowColor = '#a9d4ff'; c.shadowBlur = 8; c.stroke(); }
    else { c.beginPath(); c.arc(s[0], s[1], 13, 0, Math.PI * 2); c.lineWidth = 4; c.strokeStyle = '#ff8e3a'; c.shadowColor = '#ff8e3a'; c.shadowBlur = 10; c.stroke(); c.shadowBlur = 0; c.fillStyle = '#ffd2b0'; c.fillText(sport.notation.inside(p), s[0], s[1] + 1); }
  });
  if (B) { const s = S(B); c.beginPath(); c.arc(s[0], s[1], 8, 0, Math.PI * 2); c.fillStyle = '#ffe2a0'; c.shadowColor = '#ffc75a'; c.shadowBlur = 20; c.fill(); }
  // you: the gold arrow, facing up
  c.beginPath(); c.moveTo(cx, cy - 20); c.lineTo(cx + 14, cy + 14); c.lineTo(cx, cy + 6); c.lineTo(cx - 14, cy + 14); c.closePath(); c.fillStyle = '#ffc75a'; c.shadowColor = '#ffc75a'; c.shadowBlur = 18; c.fill();
  // words: the step, your job
  c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillStyle = '#ffc75a'; c.font = '800 20px system-ui, sans-serif'; c.fillText(`STEP ${k + 1}/${tr.steps.length} · YOU ARE ${tr.name.toUpperCase()}${north ? ' · MAP' : ''}`, 28, 42, 544);
  c.fillStyle = '#ffffff'; c.font = '800 30px system-ui, sans-serif';
  const words = tr.steps[k].job.split(' '); let ln = '', y = 84;
  for (const w of words) { if (c.measureText(ln + w).width > 540 && ln) { c.fillText(ln.trim(), 28, y); ln = ''; y += 36; if (y > 130) break; } ln += w + ' '; }
  if (y <= 130) c.fillText(ln.trim(), 28, y);
}

// a link can skip the lists: glasses.html?sport=flag5&play=slant-flat&who=Z
const q = new URLSearchParams(location.search);
if (q.get('sport')) {
  const s = getSport(q.get('sport')), raw = s.plays.find(p => p.key === q.get('play')) || s.plays[0], n = normalize(raw, s);
  sport = s; sim = compile(n.play, s, { defense: true });
  const w = q.get('who') ? sim.play.players.findIndex(p => p.id === q.get('who').toUpperCase() || sport.notation.inside(p) === q.get('who').toUpperCase()) : -1;
  start(w >= 0 ? w : busiest(sim));
} else pickSport();
