// The positions guide: every spot on the floor or field, tap to go deep. Each position gets its own
// mini board (the real court or field lines, top-down) with its signature move animated, what it reads,
// do and don't, how to coach it at each age, a drill, its AI brain, and what it does in the play on
// the board, with "Watch it". The Sideline tab is the same thing as huge cue cards for game day.

import { icon } from './icons.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let uid = 0;

// the field window a mini board shows: the half court, or the 30 yards around the line in football
function frame(sport) {
  const F = sport.field;
  return sport.los == null ? [F.x[0], F.y[0], F.x[1], F.y[1]] : [F.x[0], sport.los - 21, F.x[1], sport.los + 8];
}
const pathD = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('');
function zigzag(pts, amp, step) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(L / step)), nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    for (let j = 1; j < n; j++) { const t = j / n, s = j % 2 ? amp : -amp; out.push([a[0] + (b[0] - a[0]) * t + nx * s, a[1] + (b[1] - a[1]) * t + ny * s]); }
    out.push(b);
  }
  return out;
}
function glyph(sport, side, label, x, y, cls, square) {
  const U = sport.mark, fs = (label.length > 1 ? 0.95 : 1.25) * U;
  if (side === 'D') {
    const r = 0.72 * U;
    return `<g class="mb-p D ${cls}"><path d="M${x - r} ${y - r}L${x + r} ${y + r}M${x - r} ${y + r}L${x + r} ${y - r}"/><text x="${x + U * 0.95}" y="${y + U * 0.8}" font-size="${fs * 0.7}">${esc(label)}</text></g>`;
  }
  const shape = square ? `<rect x="${x - 0.85 * U}" y="${y - 0.85 * U}" width="${1.7 * U}" height="${1.7 * U}"/>` : `<circle cx="${x}" cy="${y}" r="${U}"/>`;
  return `<g class="mb-p O ${cls}">${shape}<text x="${x}" y="${y}" font-size="${fs}">${esc(label)}</text></g>`;
}
const mateLabel = (sport, id) => sport.los == null ? (id[0] === 'O' ? id.slice(1) : 'X') : id === 'QB' ? 'Q' : id;

// one position, drawn: lines, teammates faint, this position lit, its move animated
export function miniBoard(sport, pos, o) {
  o = o || {};
  const [x0, y0, x1, y1] = frame(sport), pad = sport.mark * 1.6, W = x1 - x0 + pad * 2, H = y1 - y0 + pad * 2, U = sport.mark, id = 'mb' + (++uid);
  const lines = sport.field.lines({ los: sport.los }).map(l => {
    const pts = l.p.map(p => [p[0], p[1]]);
    if (Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 0.01 && pts.length < 3) return '';
    return `<path class="mb-l${l.hot ? ' hot' : l.warm ? ' warm' : ''}${l.dots ? ' dots' : ''}" d="${pathD(pts)}" stroke-width="${(0.14 + (l.w || 1) * 0.12).toFixed(2)}"/>`;
  }).join('');
  const mates = Object.entries(pos.mates || {}).map(([k, p]) => glyph(sport, k[0] === 'X' && sport.los == null ? 'D' : ['R', 'CB', 'S', 'LB', 'N'].indexOf(k) >= 0 ? 'D' : 'O', mateLabel(sport, k), p[0], p[1], 'mate', k === 'C')).join('');
  const moves = pos.paths.map(p => {
    const pts = p.kind === 'dribble' ? zigzag(p.pts, U * 0.45, U * 0.9) : p.pts, d = pathD(pts);
    let extra = '';
    if (p.kind === 'screen') { const a = p.pts[p.pts.length - 2], b = p.pts[p.pts.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L * U, ny = (b[0] - a[0]) / L * U; extra = `<path class="mb-m screen" d="M${b[0] + nx} ${b[1] + ny}L${b[0] - nx} ${b[1] - ny}"/>`; }
    const arrow = p.kind === 'screen' ? '' : ` marker-end="url(#${id}a${p.kind === 'pass' ? 'p' : ''})"`;
    return `<path class="mb-m ${p.kind}" d="${d}" pathLength="1"${arrow}/>` + extra;
  }).join('');
  const runs = pos.paths.filter(p => p.kind !== 'pass'), pass = pos.paths.find(p => p.kind === 'pass');
  const runD = runs.length ? pathD(runs.flatMap(p => p.pts)) : '';
  let anim = '';
  if (o.anim && runD) anim += `<g class="mb-ghost">${glyph(sport, pos.side, pos.num, 0, 0, 'me', pos.shape === 'square')}<animateMotion dur="3.6s" repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;0.12;0.6;1" calcMode="linear" path="${runD}"/></g>`;
  if (o.anim && pass) anim += `<circle class="mb-ball" r="${U * 0.45}"><animateMotion dur="3.6s" repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;0.6;0.82;1" calcMode="linear" path="${pathD(pass.pts)}"/></circle>`;
  const zoneR = U * 5;
  return `<svg class="ct-mb${o.anim ? ' anim' : ''}" viewBox="${(x0 - pad).toFixed(2)} ${(y0 - pad).toFixed(2)} ${W.toFixed(2)} ${H.toFixed(2)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(pos.name)}: where they play and their signature move">
    <defs><marker id="${id}a" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="mb-ah"/></marker>
    <marker id="${id}ap" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="mb-ah p"/></marker>
    <radialGradient id="${id}g"><stop offset="0" stop-color="currentColor" stop-opacity=".38"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>
    ${lines}<circle class="mb-zone" cx="${pos.home[0]}" cy="${pos.home[1]}" r="${zoneR}" fill="url(#${id}g)"/>${mates}${moves}
    ${glyph(sport, pos.side, pos.num, pos.home[0], pos.home[1], 'me' + (o.anim && runD ? ' home' : ''), pos.shape === 'square')}${anim}</svg>`;
}

// which player on the board plays this position
export function playerFor(sport, play, pos) {
  if (!play) return null;
  if (sport.los == null) {
    if (pos.side === 'O') return play.players.find(p => p.id === pos.id) || null;
    const ds = play.players.filter(p => p.side === 'D');
    return pos.id === 'X1' ? ds.find(p => p.id === 'X1') || null : ds.find(p => p.id !== 'X1') || null;
  }
  const roles = pos.id === 'H' ? ['H', 'Y'] : [pos.id];
  return play.players.find(p => roles.indexOf(p.role) >= 0) || null;
}
const VERBS = { move: 'moves to a new spot', cut: 'cuts', drift: 'drifts to open space', lift: 'lifts up', pop: 'pops out', roll: 'rolls to the rim', slide: 'slides with the ball', closeout: 'closes out', help: 'helps on the ball',
  dribble: 'dribbles', screen: 'screens for', boxout: 'boxes out', route: 'runs the route', motion: 'goes in motion', run: 'runs with it', rush: 'rushes the QB', cover: 'covers', zone: 'drops to the zone', pull: 'goes for the flag',
  pass: 'passes to', throw: 'throws to', handoff: 'hands off to', pitch: 'pitches to', snap: 'snaps to', shot: 'shoots', ready: 'gets ready' };
// what a player does in the play, beat by beat, in the play's own words
export function storyOf(play, id) {
  const out = [];
  play.beats.forEach((b, k) => {
    const mine = (b.actions || []).filter(a => a.who === id || a.target === id);
    if (!mine.length) return;
    const lines = String(b.say || '').split(/(?<=\.)\s+/).filter(s => new RegExp('\\b' + id + '\\b').test(s));
    out.push({ beat: k, text: lines.join(' ') || mine.map(a => a.who !== id ? `gets it from ${a.who}` : (VERBS[a.kind] || 'moves') + (a.target ? ' ' + a.target : '')).join(', then ') });
  });
  return out;
}

const AGE_TABS = [['young', '6–11'], ['mid', '12–14'], ['older', '15+']];

// the guide panel. ctx: { sport, play, openPanel, say(text), watch(id), mark(html) , band }
export function openGuide(ctx, start) {
  const S = ctx.sport, P = S.positions || [];
  let tab = start && start.tab || 'positions', band = ctx.band || 'young';
  const tile = (p, i) => `<button type="button" class="ct-gtile ${p.side}" data-pos="${i}" style="--i:${i}">${miniBoard(S, p)}<span class="ct-gnum ${p.side}">${esc(p.num)}</span><b>${esc(p.name)}</b><small>${esc(p.cue)}</small></button>`;
  const grid = () => `<p class="ct-glede">Tap any position to go deep: the job, the read, how to coach it at every age, and its move on the board.</p><div class="ct-ggrid">${P.map(tile).join('')}</div>`;
  const detail = i => {
    const p = P[i], pl = playerFor(S, ctx.play, p), brain = pl && S.brains ? S.brains(pl) : null, story = pl ? storyOf(ctx.play, pl.id) : [];
    return `<div class="ct-gdeep ${p.side}">
      <button type="button" class="ct-gback" data-b="back">${icon('undo')}<span>All positions</span></button>
      <div class="ct-ghero">${miniBoard(S, p, { anim: true })}
        <div><div class="ct-gkick"><span class="ct-gnum ${p.side}">${esc(p.num)}</span>${esc(p.nick)}</div><h5>${esc(p.name)}</h5>
          <p class="ct-gcue">“${esc(p.cue)}” <button type="button" class="ct-gsay" data-b="say" aria-label="Say the cue">${icon('speaker')}</button></p>
          <p>${esc(p.job)}</p>
          ${pl ? `<button type="button" class="ct-gwatch" data-b="watch" data-id="${esc(pl.id)}">${icon('view')}<span>Watch ${esc(S.notation.name(pl))} in “${esc(ctx.play.title)}”</span></button>` : ''}</div></div>
      <div class="ct-gcols">
        <section><h6>What you read</h6><ol class="ct-gsee">${p.sees.map(x => `<li>${esc(x)}</li>`).join('')}</ol></section>
        <section><h6>Do this</h6><ul class="ct-gdo">${p.does.map(x => `<li>${esc(x)}</li>`).join('')}</ul><h6>Not that</h6><ul class="ct-gdont">${p.donts.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>
      </div>
      <section class="ct-gage"><h6>Coach it by age</h6><div class="ct-seg" role="tablist">${AGE_TABS.map(([k, l]) => `<button type="button" role="tab" data-band="${k}" class="${k === band ? 'on' : ''}">${l}</button>`).join('')}</div><p data-r="ageText">${esc(p.ages[band])}</p></section>
      <div class="ct-gcols">
        <section class="ct-gdrill"><h6>${icon('check')} Drill: ${esc(p.drill.name)}</h6><p>${esc(p.drill.how)}</p></section>
        ${brain ? `<section class="ct-gbrain"><h6>${icon('brain')} ${esc(brain.name)}</h6><p>${esc(brain.instincts)}</p></section>` : ''}
      </div>
      ${story.length ? `<section class="ct-gstory"><h6>In this play</h6><ol>${story.map(s => `<li><button type="button" data-b="beat" data-k="${s.beat}" data-id="${esc(pl.id)}"><span class="ct-n">${s.beat + 1}</span>${ctx.mark(s.text)}</button></li>`).join('')}</ol></section>` : ''}
      <nav class="ct-gnav">${i > 0 ? `<button type="button" data-pos="${i - 1}">← ${esc(P[i - 1].name)}</button>` : '<span></span>'}${i < P.length - 1 ? `<button type="button" data-pos="${i + 1}">${esc(P[i + 1].name)} →</button>` : ''}</nav>
    </div>`;
  };
  const playTab = () => {
    const pl = ctx.play;
    return `<p class="ct-glede"><b>${esc(pl.title)}</b>: who does what, beat by beat. Tap a player to watch only them.</p><ul class="ct-gplay">${pl.players.map(q => {
      const st = storyOf(pl, q.id); if (!st.length) return '';
      return `<li><button type="button" class="ct-gwho" data-b="watch" data-id="${esc(q.id)}"><b class="ct-m ${q.side}">${esc(S.notation.name(q))}</b></button><div>${st.map(s => `<p><span class="ct-n">${s.beat + 1}</span>${ctx.mark(s.text)}</p>`).join('')}</div></li>`;
    }).join('')}</ul>`;
  };
  const sideline = () => `<p class="ct-glede">Game-day cards: one cue per spot, big enough to read from the bench. Swipe.</p><div class="ct-cards">${P.map(p => `<article class="ct-scard ${p.side}"><span class="ct-gnum ${p.side}">${esc(p.num)}</span><small>${esc(p.name)}</small><b>${esc(p.cue)}</b><p>Look for: ${esc(p.sees[0])}</p></article>`).join('')}</div>`;

  let view = start && start.pos != null ? start.pos : -1;
  const body = () => `<div class="ct-seg ct-gtabs" role="tablist">${[['positions', 'Positions'], ['play', 'This play'], ['sideline', 'Sideline cards']].map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div class="ct-gbody">${tab === 'positions' ? (view >= 0 ? detail(view) : grid()) : tab === 'play' ? playTab() : sideline()}</div>`;
  const panel = ctx.openPanel(S.name + ' guide', body(), (pb, el) => {
    const redraw = () => { pb.innerHTML = body(); pb.scrollTop = 0; };
    pb.onclick = e => {
      const t = e.target.closest('[data-tab],[data-pos],[data-b],[data-band]'); if (!t) return;
      if (t.dataset.tab) { tab = t.dataset.tab; view = -1; redraw(); return; }
      if (t.dataset.pos != null) { view = +t.dataset.pos; tab = 'positions'; redraw(); return; }
      if (t.dataset.band) { band = t.dataset.band; ctx.setBand && ctx.setBand(band); pb.querySelectorAll('[data-band]').forEach(b => b.classList.toggle('on', b === t)); pb.querySelector('[data-r=ageText]').textContent = P[view].ages[band]; return; }
      const b = t.dataset.b;
      if (b === 'back') { view = -1; redraw(); }
      if (b === 'say') ctx.say(P[view].name + '. ' + P[view].cue + ' ' + P[view].job);
      if (b === 'watch') ctx.watch(t.dataset.id);
      if (b === 'beat') ctx.watch(t.dataset.id, +t.dataset.k);
    };
  }, 'ct-xl ct-guide');
  return panel;
}
