// Reading a hand-drawn stroke: what the coach meant by it. Pure (field units in, actions out),
// so it's tested in node and shared by mouse, finger and Apple Pencil alike.
//
//   zigzag from the ball handler   → dribble (or run, in football)
//   ends on a teammate, with ball  → pass (throw)
//   ends in a short flick ⊥        → screen (a T, the way coaches draw it)
//   ends on a teammate, no ball    → screen for them (basketball)
//   bends round                    → curl
//   football receiver              → a route, named from the route tree when it matches
//   defender                       → slide / cover / close out
// Ends snap to a nearby teammate or a named spot so the play comes out clean.

import { ROUTE_TREE, routeFor } from './football.js';

const pick = (sport, ...names) => names.find(n => sport.kinds[n]);

export function simplify(pts, eps) {
  if (pts.length < 3) return pts.slice();
  const a = pts[0], b = pts[pts.length - 1]; let idx = -1, dmax = 0;
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], d = Math.abs((b[1] - a[1]) * p[0] - (b[0] - a[0]) * p[1] + b[0] * a[1] - b[1] * a[0]) / l;
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax <= eps) return [a, b];
  return simplify(pts.slice(0, idx + 1), eps).slice(0, -1).concat(simplify(pts.slice(idx), eps));
}
const len = p => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; };
const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
const turn = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

// how many times the stroke swings across its own chord: a zigzag
export function swings(pts, amp) {
  if (pts.length < 6) return 0;
  const a = pts[0], b = pts[pts.length - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  let side = 0, n = 0;
  for (const p of pts) {
    const d = ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) / l;
    if (Math.abs(d) < amp) continue;
    const s = Math.sign(d); if (side && s !== side) n++; side = s;
  }
  return n;
}
// a short final stroke roughly at right angles to the one before: the bar of a T
export function flick(simple, total, U) {
  if (simple.length < 3) return null;
  const n = simple.length, a = simple[n - 3], b = simple[n - 2], c = simple[n - 1];
  const last = Math.hypot(c[0] - b[0], c[1] - b[1]);
  if (last > Math.max(0.35 * total, 2.6 * U) || last < 0.35 * U) return null;
  const t = Math.abs(turn(ang(a, b), ang(b, c)));
  return t > 0.95 && t < 2.3 ? b : null;
}

// which named route this looks like (football), by comparing to the tree from the same start
export function nameRoute(sport, start, simple, los) {
  let best = null, bs = Infinity;
  const end = simple[simple.length - 1], brk = simple.length > 2 ? simple[1] : null;
  ROUTE_TREE.forEach(tree => {
    const r = routeFor(tree, start, sport, los), rbrk = r.path[0];
    let e = Math.hypot(r.to.x - end[0], r.to.y - end[1]);
    if (brk && rbrk) e += 0.6 * Math.hypot(rbrk.x - brk[0], rbrk.y - brk[1]);
    else if (brk || rbrk) e += 3;
    if (e < bs) { bs = e; best = tree; }
  });
  return bs < 6 ? best : null;
}

// ctx: { who (player), holder (bool), players, P (positions now), spots (sport.spots), los }
export function readStroke(sport, raw, ctx) {
  const U = sport.mark, pts = raw.filter((p, i) => i === 0 || Math.hypot(p[0] - raw[i - 1][0], p[1] - raw[i - 1][1]) > 0.08 * U);
  const total = len(pts), simple = simplify(pts, 0.55 * U), who = ctx.who;
  const i0 = ctx.players.indexOf(who), start = ctx.P[i0];
  const zig = swings(pts, 0.3 * U) >= 3, bar = flick(simple, total, U);
  let end = (bar || pts[pts.length - 1]).slice();
  // snap the end: a teammate (for passes and screens) or a named spot
  let mate = -1, md = 2.3 * U;
  ctx.P.forEach((p, i) => { if (i !== i0 && ctx.players[i].side === who.side) { const d = Math.hypot(p[0] - end[0], p[1] - end[1]); if (d < md) { md = d; mate = i; } } });
  let snapped = null;
  if (mate < 0 && !zig) {
    let sd = 2.4 * U; for (const k in ctx.spots) { const s = ctx.spots[k], d = Math.hypot(s[0] - end[0], s[1] - end[1]); if (d < sd) { sd = d; snapped = k; end = s.slice(); } }
  }
  const to = { x: +end[0].toFixed(1), y: +end[1].toFixed(1) };
  const corners = simplify(pts, 0.7 * U).slice(1, -1).slice(0, 4).map(p => ({ x: +p[0].toFixed(1), y: +p[1].toFixed(1) }));
  const target = mate >= 0 ? ctx.players[mate] : null, fb = !!sport.kinds.route;
  const where = snapped ? ' to the ' + snapped : '';
  let a, label;
  if (who.side === 'D') {
    const k = target ? pick(sport, 'closeout', 'cover') : pick(sport, 'slide', 'cover');
    a = { kind: k, who: who.id, to, path: fb ? corners : [] }; label = k === 'closeout' ? 'closes out' : (fb ? 'covers' : 'slides') + where;
  } else if (ctx.holder && target && !zig) {
    a = { kind: pick(sport, 'throw', 'pass'), who: who.id, target: target.id }; label = (fb ? 'throws to ' : 'passes to ') + target.id;
  } else if (ctx.holder) {
    a = { kind: pick(sport, 'dribble', 'run'), who: who.id, to, path: fb ? corners : [] }; label = (fb ? 'runs with it' : 'dribbles') + where;
  } else if ((bar || (target && !fb)) && sport.kinds.screen) {
    // the screen is set for the nearest teammate to the bar (or the one it ends on)
    let tg = target; if (!tg) { let td = 6 * U; ctx.P.forEach((p, i) => { if (i !== i0 && ctx.players[i].side === who.side) { const d = Math.hypot(p[0] - end[0], p[1] - end[1]); if (d < td) { td = d; tg = ctx.players[i]; } } }); }
    const at = target ? { x: +((ctx.P[mate][0] + start[0]) / 2).toFixed(1), y: +((ctx.P[mate][1] + start[1]) / 2).toFixed(1) } : to;
    a = { kind: 'screen', who: who.id, to: target ? { x: +(ctx.P[mate][0] + (start[0] - ctx.P[mate][0]) * 0.25).toFixed(1), y: +(ctx.P[mate][1] + (start[1] - ctx.P[mate][1]) * 0.25).toFixed(1) } : at, target: tg ? tg.id : null };
    label = 'screens' + (tg ? ' for ' + tg.id : '');
  } else if (fb) {
    const tree = nameRoute(sport, start, simplify(pts, 0.9 * U), ctx.los);
    a = { kind: 'route', who: who.id, to, path: corners }; if (tree) a.tree = tree.name;
    label = tree ? 'runs ' + tree.say : 'runs a route';
  } else {
    let t = 0; for (let i = 2; i < simple.length; i++) t += turn(ang(simple[i - 2], simple[i - 1]), ang(simple[i - 1], simple[i]));
    const curved = Math.abs(t) > 1.6 && simple.length >= 3;
    a = { kind: curved && sport.kinds.curl ? 'curl' : 'cut', who: who.id, to, via: corners.length === 1 || curved ? corners[Math.floor(corners.length / 2)] || null : null, path: [] };
    if (corners.length > 1 && !curved) a.via = corners[0];
    label = (a.kind === 'curl' ? 'curls' : 'cuts') + where;
  }
  return { action: a, label, target: target ? target.id : (a.target || null), snapped, zig, bar: !!bar };
}
