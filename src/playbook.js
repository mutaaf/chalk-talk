// Playbooks: any set of plays as a printable document (Save as PDF from the print dialog, on any device).
// Each play gets a top-down diagram drawn from the engine's own routes (so it matches the board exactly:
// zigzag dribbles, dashed passes, T-bar screens, numbered steps), step-by-step frames, the kid version, the
// cues and the reads. Ink on white, one play per page, readable from a clipboard.

import { normalize, compile } from './engine/sim.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// players named the way the board shows them: "5" in basketball, position letters in football
const namer = (sport, play) => id => { const p = play.players.find(q => q.id === id); return p ? (p.side === 'D' ? (sport.los == null ? 'X' + id.slice(1) : sport.notation.name(p)) : sport.notation.name(p)) : id; };
const words = (s, nm) => esc(s).replace(/\b([OX])([1-9])\b/g, m => '<b>' + esc(nm ? nm(m) : m) + '</b>');

// the field window a diagram shows: the half court, or the area around the line of scrimmage
export function frame(sport, play) {
  const F = sport.field, los = play.los != null ? play.los : sport.los;
  return los == null ? [F.x[0], F.y[0], F.x[1], F.y[1]] : [F.x[0], Math.max(F.y[0], los - 24), F.x[1], Math.min(F.y[1], los + 9)];
}
const pathD = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('');

// one diagram: the lines, every player where they start (or where beat k starts), their routes; `only` limits
// the routes to one beat (the step-by-step frames)
export function diagram(sport, sim, o) {
  o = o || {};
  const play = sim.play, [x0, y0, x1, y1] = frame(sport, play), U = sport.mark, pad = U * 1.8;
  const W = x1 - x0 + pad * 2, H = y1 - y0 + pad * 2;
  const at = o.only != null ? o.only : 0, P = sim.posAt(at), show = r => (o.only == null || r.beat === o.only) && (o.defense || r.side === 'O') && !(r.auto && o.only == null && !o.defense);
  const lines = sport.field.lines({ los: play.los }).map(l => {
    const pts = l.p.map(p => [p[0], p[1]]);
    if (pts.length < 2 || (Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 0.01 && pts.length < 3)) return '';
    return `<path class="fl${l.hot ? ' hot' : l.warm ? ' warm' : ''}${l.dots ? ' dots' : ''}" d="${pathD(pts)}" stroke-width="${(0.12 + (l.w || 1) * 0.1).toFixed(2)}"/>`;
  }).join('');
  const routes = sim.routes.map((r, i) => {
    if (!show(r)) return '';
    const pts = r.pts.map(p => [p[0], p[1]]);
    const cls = 'rt ' + (r.dashed ? 'pass' : r.side === 'D' ? 'def' : 'mv') + (o.only != null && r.beat !== o.only ? ' faint' : '');
    // the step number, on the route
    const mid = pts[Math.floor(pts.length * (r.dashed ? 0.5 : 0.4))];
    const tag = o.only == null && r.side === 'O' && mid ? `<g class="step"><circle cx="${mid[0]}" cy="${mid[1]}" r="${U * 0.62}"/><text x="${mid[0]}" y="${mid[1]}" font-size="${U * 0.8}">${r.beat + 1}</text></g>` : '';
    return `<path class="${cls}" d="${pathD(pts)}"/>` + tag;
  }).join('');
  const marks = sim.players.map((p, i) => {
    if (p.side === 'D' && !o.defense) return '';
    const [x, y] = P[i], shape = sport.notation.shape(p), label = esc(sport.notation.inside(p));
    const fs = (label.length > 1 ? 0.95 : 1.25) * U;
    if (shape === 'x') { const r = 0.7 * U; return `<g class="pl d"><path d="M${x - r} ${y - r}L${x + r} ${y + r}M${x - r} ${y + r}L${x + r} ${y - r}"/><text x="${x + U * 0.95}" y="${y + U * 0.75}" font-size="${fs * 0.7}">${label}</text></g>`; }
    const body = shape === 'square' ? `<rect x="${x - 0.85 * U}" y="${y - 0.85 * U}" width="${1.7 * U}" height="${1.7 * U}"/>` : `<circle cx="${x}" cy="${y}" r="${U}"/>`;
    return `<g class="pl o${sim.holderAt(at + 0.01) === i ? ' ball' : ''}">${body}<text x="${x}" y="${y}" font-size="${fs}">${label}</text></g>`;
  }).join('');
  const id = 'a' + Math.random().toString(36).slice(2, 7);
  return `<svg class="dg" viewBox="${(x0 - pad).toFixed(2)} ${(y0 - pad).toFixed(2)} ${W.toFixed(2)} ${H.toFixed(2)}" role="img" aria-label="${esc(play.title)} diagram">
    <defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#111"/></marker></defs>
    ${lines}${routes.replace(/class="rt pass/g, `marker-end="url(#${id})" class="rt pass`)}${marks}</svg>`;
}

// the whole book: a cover with the contents, then one page per play
export function buildPlaybook(sport, raws, opts) {
  opts = Object.assign({ title: 'Playbook', team: '', steps: true, defense: false }, opts);
  const pages = raws.map((raw, n) => {
    const nrm = normalize(raw, sport); if (!nrm.ok) return '';
    const sim = compile(nrm.play, sport, { defense: !!opts.defense }), play = sim.play;
    const nm = namer(sport, play);
    const steps = play.beats.map((b, k) => `<li><span>${k + 1}</span><p>${words(b.say, nm)}</p></li>`).join('');
    const frames = opts.steps && play.beats.length > 1 ? `<div class="frames">${play.beats.map((b, k) => `<figure>${diagram(sport, sim, { only: k, defense: opts.defense })}<figcaption><span>${k + 1}</span><p>${words(b.say, nm)}</p></figcaption></figure>`).join('')}</div>` : '';
    return `<section class="play">
      <header><div class="num">${n + 1}</div><div><small>${esc(play.concept || sport.short)}</small><h2>${esc(play.title)}</h2></div></header>
      <div class="main">${diagram(sport, sim, { defense: opts.defense })}
        <div class="side">
          ${play.summary ? `<p class="kid">${words(play.summary, nm)}</p>` : ''}
          ${play.cues && play.cues.length ? `<h3>Say it</h3><ul class="cues">${play.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
          <h3>Step by step</h3><ol class="steps">${steps}</ol>
          ${play.reads && play.reads.length ? `<h3>Options</h3><ul class="reads">${play.reads.map(r => `<li><b>${esc(sport.notation.name(play.players.find(p => p.id === r.who) || { id: r.who }))}</b> ${esc(r.text)}</li>`).join('')}</ul>` : ''}
        </div></div>
      ${frames}
    </section>`;
  }).join('');
  const toc = raws.map((r, n) => `<li><span>${n + 1}</span>${esc(r.title || 'Untitled play')}<em>${esc(r.concept || '')}</em></li>`).join('');
  const legend = sport.kinds.route
    ? '<li><i class="lg mv"></i>Route or run</li><li><i class="lg pass"></i>Throw</li><li><i class="lg o"></i>Offense by position (Q, C, X, Z, Y/H, RB)</li><li><i class="lg x"></i>Defense</li>'
    : '<li><i class="lg mv"></i>Cut</li><li><i class="lg zz"></i>Dribble</li><li><i class="lg pass"></i>Pass</li><li><i class="lg sc"></i>Screen</li><li><i class="lg o"></i>Offense by position (1 point guard … 5 center)</li><li><i class="lg x"></i>Defense</li>';
  const date = new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc((opts.team ? opts.team + ' · ' : '') + opts.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;900&family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet">
<style>
@page { size: letter; margin: 0.5in; }
* { box-sizing: border-box; }
body { margin: 0; font: 11pt/1.4 'Atkinson Hyperlegible', system-ui, sans-serif; color: #111; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.bar { position: sticky; top: 0; display: flex; gap: 10px; align-items: center; padding: 10px 16px; background: #111; color: #fff; font-size: 14px; z-index: 2; }
.bar button { font: inherit; font-weight: 700; padding: 8px 16px; border-radius: 18px; border: 0; background: #f97316; color: #111; cursor: pointer; }
.bar span { flex: 1; opacity: .8; }
@media print { .bar { display: none; } }
.page { max-width: 7.5in; margin: 0 auto; padding: 0.3in 0; }
.cover { min-height: 9.4in; display: flex; flex-direction: column; justify-content: center; page-break-after: always; break-after: page; }
.cover small { font: 900 14pt 'Big Shoulders Display', sans-serif; letter-spacing: .2em; text-transform: uppercase; color: #f97316; }
.cover h1 { font: 900 54pt/0.95 'Big Shoulders Display', sans-serif; text-transform: uppercase; margin: 6px 0 4px; }
.cover .meta { color: #555; margin-bottom: 28px; }
.toc { list-style: none; padding: 0; margin: 0; border-top: 2px solid #111; }
.toc li { display: flex; gap: 12px; align-items: baseline; padding: 8px 0; border-bottom: 1px solid #ddd; font-weight: 700; }
.toc span { font: 900 14pt 'Big Shoulders Display', sans-serif; color: #f97316; min-width: 26px; }
.toc em { margin-left: auto; font-style: normal; font-weight: 400; color: #666; font-size: 10pt; }
.legend { list-style: none; padding: 0; margin: 22px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; font-size: 10pt; color: #333; }
.lg { display: inline-block; width: 34px; height: 12px; margin-right: 8px; vertical-align: middle; background-repeat: no-repeat; background-position: center; }
.lg.mv { background-image: linear-gradient(#111, #111); background-size: 100% 2px; }
.lg.pass { background-image: repeating-linear-gradient(90deg, #111 0 5px, transparent 5px 9px); background-size: 100% 2px; }
.lg.zz { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 12'%3E%3Cpath d='M0 6l4-4 4 8 4-8 4 8 4-8 4 8 4-8 4 8 2-4' fill='none' stroke='%23111' stroke-width='1.6'/%3E%3C/svg%3E"); }
.lg.sc { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 12'%3E%3Cpath d='M0 6h30M30 1v10' fill='none' stroke='%23111' stroke-width='2'/%3E%3C/svg%3E"); }
.lg.o { width: 14px; height: 14px; border: 2px solid #111; border-radius: 50%; }
.lg.x { width: 14px; height: 14px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'%3E%3Cpath d='M2 2l10 10M12 2L2 12' stroke='%23666' stroke-width='2'/%3E%3C/svg%3E"); }
.play { page-break-before: always; break-before: page; }
.play:first-of-type { page-break-before: auto; break-before: auto; }
.play header { display: flex; gap: 14px; align-items: center; border-bottom: 3px solid #111; padding-bottom: 8px; margin-bottom: 12px; }
.num { font: 900 30pt/1 'Big Shoulders Display', sans-serif; color: #fff; background: #f97316; min-width: 52px; height: 52px; display: grid; place-items: center; border-radius: 10px; }
.play small { font: 700 10pt 'Big Shoulders Display', sans-serif; letter-spacing: .16em; text-transform: uppercase; color: #f97316; }
.play h2 { font: 900 28pt/1 'Big Shoulders Display', sans-serif; text-transform: uppercase; margin: 2px 0 0; }
.main { display: grid; grid-template-columns: 1.15fr 1fr; gap: 18px; align-items: start; }
.dg { width: 100%; height: auto; display: block; background: #fff; border: 1.5px solid #111; border-radius: 6px; }
.fl { fill: none; stroke: #9aa3ad; stroke-linecap: round; stroke-linejoin: round; } .fl.hot { stroke: #111; } .fl.warm { stroke: #f97316; } .fl.dots { stroke-dasharray: .5 .6; }
.rt { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: .42; }
.rt.mv { stroke: #111; } .rt.pass { stroke: #111; stroke-dasharray: .9 .7; } .rt.def { stroke: #888; stroke-width: .3; } .rt.faint { opacity: .15; }
.pl.o circle, .pl.o rect { fill: #fff; stroke: #111; stroke-width: .3; } .pl.o.ball circle, .pl.o.ball rect { fill: #fde7d6; stroke: #f97316; stroke-width: .42; }
.pl text { font-family: 'Big Shoulders Display', sans-serif; font-weight: 900; text-anchor: middle; dominant-baseline: central; fill: #111; }
.pl.d path { stroke: #666; stroke-width: .36; stroke-linecap: round; } .pl.d text { fill: #666; }
.step circle { fill: #f97316; } .step text { fill: #fff; font-family: 'Big Shoulders Display', sans-serif; font-weight: 900; text-anchor: middle; dominant-baseline: central; }
.side h3 { font: 900 11pt 'Big Shoulders Display', sans-serif; letter-spacing: .14em; text-transform: uppercase; margin: 12px 0 5px; color: #333; }
.kid { margin: 0; padding: 10px 12px; background: #f6f6f6; border-left: 4px solid #f97316; border-radius: 4px; }
.cues { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px; } .cues li { padding: 4px 10px; border: 1.5px solid #111; border-radius: 14px; font-weight: 700; font-size: 10pt; }
.steps { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; } .steps li { display: flex; gap: 8px; align-items: flex-start; } .steps p, figcaption p { margin: 0; }
.steps span, figcaption span { flex: none; display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: #f97316; color: #fff; font: 900 10pt 'Big Shoulders Display', sans-serif; }
.reads { padding-left: 0; list-style: none; margin: 0; display: grid; gap: 4px; } .reads b { display: inline-block; min-width: 26px; }
.frames { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 16px; break-inside: avoid; }
figure { margin: 0; break-inside: avoid; } figcaption { display: flex; gap: 6px; font-size: 8.5pt; margin-top: 4px; line-height: 1.3; }
.foot { margin-top: 28px; font-size: 9pt; color: #777; }
</style></head><body>
<div class="bar"><span>${raws.length} play${raws.length === 1 ? '' : 's'} · on a computer, choose “Save as PDF” in the print dialog; on iPhone or iPad, tap Share, then Print or Save to Files</span><button onclick="print()">Save as PDF</button></div>
<div class="page">
  <section class="cover"><small>${esc(sport.name)}</small><h1>${esc(opts.team || opts.title)}</h1><div class="meta">${opts.team ? esc(opts.title) + ' · ' : ''}${esc(date)} · ${raws.length} play${raws.length === 1 ? '' : 's'}</div>
    <ol class="toc">${toc}</ol><ul class="legend">${legend}</ul>
    <p class="foot">Made with Chalk Talk · mutaafaziz.com/chalktalk</p></section>
  ${pages}
</div>
<script>document.fonts && document.fonts.ready.then(() => { if (location.hash === '#print') setTimeout(() => print(), 300); });</script>
</body></html>`;
}

// open the book in a new tab (a user's tap, so it isn't blocked); the coach saves it as a PDF from there
export function openPlaybook(html) {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const w = window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return !!w;
}
