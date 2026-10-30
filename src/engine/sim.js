// A play, compiled into a timeline for one sport: where every player, the ball and every
// route is at beat-time t (beat k runs from t = k to k + 1). Pure: no DOM, no field, any sport.
//
// A sport pack (src/sports/*) supplies the field, the units, named spots, the roster size, the
// action vocabulary and how defenders guard. Nothing here knows basketball from football.

import { clamp, ease, route, measured, walk, slice, toward } from './geom.js';

const HOLD = 1.6;   // beats of stillness at the end before it plays again
export const SPANS = { move: [0, 0.82], pass: [0.52, 0.94], handoff: [0.55, 0.8], shot: [0.35, 0.95] };
// screens are a sequence, not a crowd: the screener arrives and sets (stops, wide base) before the teammate
// uses it; the teammate waits, sets up their defender, then comes off shoulder to shoulder
export const TIMING = { set: [0, 0.42], wait: [0.36, 0.86] };

// players are never statues: offense sways in a ready stance, defense has active feet
export function life(sport, side, i, seconds, out) {
  const A = sport.mark * 0.16, ph = i * 1.7;
  if (side === 'D') { out[0] = Math.sin(seconds * 4.6 + ph) * A * 0.9; out[1] = Math.sin(seconds * 2.3 + ph) * A * 0.3; }
  else { out[0] = Math.sin(seconds * 1.9 + ph) * A * 0.6; out[1] = Math.cos(seconds * 1.4 + ph) * A * 0.45; }
  return out;
}

export const kindsOf = (sport, type) => Object.keys(sport.kinds).filter(k => !type || sport.kinds[k].type === type);
export const rosterIds = sport => {
  const n = sport.roster.perSide, ids = [];
  for (let i = 1; i <= n; i++) ids.push('O' + i);
  for (let i = 1; i <= n; i++) ids.push('X' + i);
  return ids;
};

// Anything goes in (a hand-written play, an AI's, a sketch, an edit); a safe play comes out, or an error.
export function normalize(raw, sport) {
  const errors = [], F = sport.field, kinds = sport.kinds, per = sport.roster.perSide;
  if (!raw || typeof raw !== 'object') return { ok: false, errors: ['not a play'] };
  const num = v => typeof v === 'number' && isFinite(v);
  const xy = v => {
    if (!v) return null;
    if (typeof v === 'string') { const s = sport.spots[v.toLowerCase().trim()]; return s ? { x: s[0], y: s[1] } : null; }
    if (Array.isArray(v) && num(v[0]) && num(v[1])) return xy({ x: v[0], y: v[1] });
    if (num(v.x) && num(v.y)) return { x: clamp(v.x, F.x[0] + 0.5, F.x[1] - 0.5), y: clamp(v.y, F.y[0] + 0.5, F.y[1] - 0.5) };
    if (v.spot) return xy(v.spot);
    return null;
  };
  const valid = id => new RegExp('^[OX]([1-9])$').test(id) && +id.slice(1) <= per;
  const players = [], ids = {};
  (Array.isArray(raw.players) ? raw.players : []).forEach(p => {
    if (!p || typeof p !== 'object') return;
    const id = String(p.id || '').trim().toUpperCase(), at = xy(p.at || p.spot || p);
    if (!valid(id) || ids[id] || !at) { errors.push('skipped player ' + (id || '?')); return; }
    const side = id[0] === 'X' ? 'D' : 'O';
    const pl = { id, side, role: String(p.role || '').trim().slice(0, 18), x: at.x, y: at.y };
    if (p.smart) pl.smart = true;   // an AI plays this position
    const c = p.cover;   // a defender's job: man on a receiver, a zone, or rush
    if (side === 'D' && c && typeof c === 'object') {
      if (c.type === 'rush') pl.cover = { type: 'rush' };
      else if (c.type === 'man' && valid(String(c.on || '').toUpperCase()) && String(c.on).toUpperCase()[0] === 'O') pl.cover = { type: 'man', on: String(c.on).toUpperCase() };
      else if (c.type === 'zone' && c.zone && ['x0', 'x1', 'd0', 'd1'].every(k => num(c.zone[k]))) pl.cover = { type: 'zone', zone: { x0: clamp(c.zone.x0, -1, 1), x1: clamp(c.zone.x1, -1, 1), d0: c.zone.d0, d1: c.zone.d1, label: String(c.zone.label || '').slice(0, 16) } };
    }
    ids[id] = true; players.push(pl);
  });
  if (!players.some(p => p.side === 'O')) return { ok: false, errors: ['a play needs offensive players'] };
  const ballId = raw.ball && ids[String(raw.ball).toUpperCase()] ? String(raw.ball).toUpperCase() : (players.find(p => p.side === 'O') || {}).id;
  const beats = [];
  (Array.isArray(raw.beats) ? raw.beats : []).slice(0, 14).forEach(b => {
    if (!b || typeof b !== 'object') return;
    const actions = [], busy = {};
    (Array.isArray(b.actions) ? b.actions : []).slice(0, 10).forEach(a => {
      if (!a || typeof a !== 'object') return;
      const kind = String(a.kind || '').toLowerCase().trim(), who = String(a.who || '').toUpperCase();
      if (!kinds[kind]) { errors.push('unknown action ' + kind); return; }
      if (!ids[who]) { errors.push('unknown player ' + who); return; }
      const K = kinds[kind];
      const target = a.target != null && ids[String(a.target).toUpperCase()] ? String(a.target).toUpperCase() : null;
      if ((K.type === 'pass' || K.type === 'handoff') && !target) { errors.push(kind + ' with no receiver'); return; }
      if (K.type === 'move') { if (busy[who]) { errors.push(who + ' has two moves in one beat'); return; } busy[who] = 1; }
      const path = (Array.isArray(a.path) ? a.path : []).slice(0, 6).map(xy).filter(Boolean);
      const act = { kind, who, to: xy(a.to), via: xy(a.via), path, target };
      if (a.tree) act.tree = String(a.tree).slice(0, 16);
      if (a.thought) act.thought = String(a.thought).slice(0, 120);   // why a smart (AI) player did it
      actions.push(act);
    });
    const nb = { say: String(b.say || '').slice(0, 220), actions };
    if (b.thoughts && typeof b.thoughts === 'object') { nb.thoughts = {}; Object.keys(b.thoughts).forEach(id => { if (ids[id]) nb.thoughts[id] = String(b.thoughts[id]).slice(0, 120); }); }
    beats.push(nb);
  });
  if (!beats.length) beats.push({ say: 'Everyone in their spots.', actions: [] });
  const los = num(raw.los) ? clamp(raw.los, F.y[0], F.y[1]) : sport.los;
  if (sport.autoRoles) sport.autoRoles(players, los);
  return {
    ok: true, errors,
    play: {
      sport: sport.id, title: String(raw.title || 'Untitled play').slice(0, 60), concept: String(raw.concept || '').slice(0, 40),
      summary: String(raw.summary || '').slice(0, 420), players, ball: ballId, beats, los, coverage: raw.coverage ? String(raw.coverage).slice(0, 12) : null,
      lesson: raw.lesson === 'defense' ? 'defense' : null,   // a defense lesson may show the offense making the wrong read, on purpose
      reads: (Array.isArray(raw.reads) ? raw.reads : []).filter(r => r && ids[String(r.who).toUpperCase()]).slice(0, 5).map(r => ({ who: String(r.who).toUpperCase(), text: String(r.text || '').slice(0, 90) })),
      cues: (Array.isArray(raw.cues) ? raw.cues : []).slice(0, 5).map(c => String(c).slice(0, 40))
    }
  };
}

// add an X for every O that has none, a step toward the goal; they guard on their own
export function withDefense(play, sport) {
  const have = {}; play.players.forEach(p => { have[p.id] = 1; });
  const add = play.players.filter(p => p.side === 'O' && !have['X' + p.id.slice(1)] && !(sport.unguarded && sport.unguarded(p, play))).map(p => {
    const g = sport.guard({ o: [p.x, p.y], ball: [p.x, p.y], onBall: false, sport, los: play.los, start: true });
    return { id: 'X' + p.id.slice(1), side: 'D', role: '', x: g[0], y: g[1] };
  });
  return add.length ? Object.assign({}, play, { players: play.players.concat(add) }) : play;
}

export function compile(play, sport, options) {
  options = options || {};
  if (options.defense) play = withDefense(play, sport);
  const K = sport.kinds, F = sport.field, goal = F.goal;
  const idx = {}; play.players.forEach((p, i) => { idx[p.id] = i; });
  const np = play.players.length, beats = play.beats;
  const starts = [play.players.map(p => [p.x, p.y])], paths = [], routes = [];
  const holders = [idx[play.ball]];   // who has the ball at the start of each beat (−1: loose / scored)
  const ballEv = [], notes = [];   // notes: what autonomous players decided, and why
  // defenders guard on their own: an X with no job this beat shadows its O (X3 ↔ O3)
  // …or plays the job a coverage gave it: man on a receiver, a zone, or the rush
  const job = play.players.map(p => p.cover || null);
  const match = play.players.map((p, i) => {
    if (p.side !== 'D') return -1;
    const c = job[i];
    if (c && c.type === 'man') return idx[c.on] != null ? idx[c.on] : -1;
    if (c) return -1;
    return idx['O' + p.id.slice(1)] != null ? idx['O' + p.id.slice(1)] : -1;
  });
  const guards = i => match[i] >= 0 || (job[i] && job[i].type !== 'man');
  const screened = beats.map(() => ({})), beaten = beats.map(() => ({})), react = sport.react || 0.3;
  // when and where a defender is hung up: { at: the screen's spot (or null: on the screener), f0, f1 (release, or null) }
  const hung = beats.map(() => ({}));
  // where the offense was a moment ago: defenders react to what they saw, not what's happening now
  function lagged(time) {
    const tt = Math.max(0, time - react), kk = Math.min(Math.floor(tt), beats.length), ff = tt - kk;
    if (kk >= paths.length) return (starts[kk] || starts[starts.length - 1]).map(p => p.slice());
    return play.players.map((_, pi) => posIn(kk, ff, pi));
  }
  // an auto defender's spot at beat k, fraction f: guard what they saw, stuck on a screen, or beaten
  function defSpot(d, k, f, time, P) {
    const Pl = lagged(time); Pl[d] = P[d];
    const h0 = holders[k], h1 = holders[k + 1] != null ? holders[k + 1] : h0, shift = ease((f - 0.55) / 0.35);
    const a = guard(Pl, d, h0, time), b2 = h1 === h0 ? a : guard(Pl, d, h1, time);
    let g = [a[0] + (b2[0] - a[0]) * shift, a[1] + (b2[1] - a[1]) * shift];
    const si = screened[k] && screened[k][d];
    if (si != null) {
      // hung up on the screener's near side: the body they run into, then (released) they chase
      const h = hung[k][d] || { f0: 0.12, f1: null }, pin = h.at || P[si];
      const w = ease((f - h.f0) / 0.3) * (h.f1 == null ? 1 : 1 - ease((f - h.f1) / 0.25)), stuck = toward(pin, g, 1.15 * sport.mark);
      g = [g[0] + (stuck[0] - g[0]) * w, g[1] + (stuck[1] - g[1]) * w];
    }
    if (beaten[k] && beaten[k][d]) {
      // beaten: they trail, a step and a half off the receiver on the side they were (late on the cut,
      // ball-watching, caught helping), which is how the pass gets open
      const r = P[match[d]] || g, vx = g[0] - r[0], vy = g[1] - r[1], len = Math.hypot(vx, vy) || 1, need = (sport.open || 3) * 1.45, w = ease((f - 0.15) / 0.35);
      const ux = len > 0.01 ? vx / len : 0, uy = len > 0.01 ? vy / len : 1;
      const sag = [r[0] + ux * Math.max(len, need), r[1] + uy * Math.max(len, need)];
      g = [g[0] + (sag[0] - g[0]) * w, g[1] + (sag[1] - g[1]) * w];
    }
    g = onSide(d, g, time);
    return [clamp(g[0], F.x[0] + 0.5, F.x[1] - 0.5), clamp(g[1], F.y[0] + 0.5, F.y[1] - 0.5)];
  }
  // football: nobody crosses the line before the snap is made, and the rusher holds his depth (7 yd in NFL FLAG)
  // until a short count after the QB has the ball (sport.rush = { depth, delay } in beats)
  const RUSH = sport.rush, losY = play.los != null ? play.los : sport.los;
  const snapK = RUSH ? beats.findIndex(b => b.actions.some(a => a.kind === 'snap')) : -1;
  const rushOpen = snapK >= 0 ? snapK + SPANS.pass[1] + (RUSH.delay || 0) : -1;
  const rusher = d => play.players[d].role === 'R' || (job[d] && job[d].type === 'rush') || beats.some(b => b.actions.some(a => a.who === play.players[d].id && a.kind === 'rush'));
  function onSide(d, g, time) {
    if (rushOpen < 0 || time >= rushOpen || play.players[d].side !== 'D' || losY == null) return g;
    return [g[0], Math.min(g[1], losY - (rusher(d) ? RUSH.depth : 1))];
  }
  const auto = beats.map(b => play.players.map((p, i) => guards(i) && !b.actions.some(a => a.who === p.id && K[a.kind].type === 'move')));
  const origin = play.players.map(p => [p.x, p.y]);
  const offense = play.players.map((p, i) => i).filter(i => play.players[i].side === 'O');
  const guard = (P, d, holder, time) => {
    const ball = holder >= 0 ? P[holder] : goal, c = job[d];
    let g;
    if (c && c.type === 'zone') g = zoneSpot(P, d, c.zone, holder);
    else if (c && c.type === 'rush') {   // get to the ball, at a sprint from a start 7 yards off
      const tgt = toward(ball, [ball[0], ball[1] - 3], 1.2), o = origin[d], reach = Math.max(0, (time == null ? 9 : time) - 0.15) * 3.2;
      const dd = Math.hypot(tgt[0] - o[0], tgt[1] - o[1]); g = dd <= reach ? tgt : toward(o, tgt, reach);
    } else g = sport.guard({ o: P[match[d]], ball, onBall: holder === match[d], sport, los: play.los, help: holder >= 0 && helperOf(P, holder, time) === d, carrier: holder >= 0 && holder !== qbIdx && settled(holder, time) ? P[holder] : null });
    return [clamp(g[0], F.x[0] + 0.5, F.x[1] - 0.5), clamp(g[1], F.y[0] + 0.5, F.y[1] - 0.5)];
  };
  // the help: when the ball gets deep (sport.help.at from the goal), the man defender whose man is
  // farthest from the ball (the weak-side "low man") rotates to stop it
  const qbIdx = play.players.findIndex(p => p.role === 'QB');
  const kOf = time => Math.max(0, Math.min(beats.length - 1, Math.floor(time == null ? 0 : time)));
  const settled = (holder, time) => holders[kOf(time)] === holder;   // had it when the beat began (caught, not in the air)
  function helperOf(P, holder, time) {
    const H = sport.help; if (!H) return -1;
    const k = kOf(time), drive = paths[k] && paths[k][holder] && K[paths[k][holder].kind] && K[paths[k][holder].kind].dribble;
    if (!drive || holders[k] !== holder) return -1;   // only a real drive: the ball handler dribbling at the rim
    const ball = P[holder]; if (Math.hypot(ball[0] - goal[0], ball[1] - goal[1]) > H.at) return -1;
    let best = -1, bd = -1;
    play.players.forEach((p, d) => {
      if (p.side !== 'D' || match[d] < 0 || match[d] === holder || (job[d] && job[d].type !== 'man')) return;
      const m = P[match[d]], v = Math.hypot(m[0] - ball[0], m[1] - ball[1]); if (v > bd) { bd = v; best = d; }
    });
    return best;
  }
  // a zone defender sits at home and plays whoever comes into the zone: over the top if it's deep, underneath if not
  function zoneSpot(P, d, z, holder) {
    const h = F.x[1], los = play.los != null ? play.los : 0;
    const x0 = Math.min(z.x0, z.x1) * h, x1 = Math.max(z.x0, z.x1) * h, y0 = Math.max(1, los - z.d1), y1 = los - z.d0, deep = z.d0 >= 6;
    const home = [(x0 + x1) / 2, deep ? Math.max(y0 + 2, los - z.d0 - 6) : los - Math.min(6, (z.d0 + z.d1) / 2)];
    let threat = -1, score = Infinity;
    offense.forEach(i => {
      if (i === holder) return;
      const p = P[i]; if (p[0] < x0 - 1.5 || p[0] > x1 + 1.5 || p[1] < y0 - 1.5 || p[1] > y1 + 2) return;
      const s = deep ? p[1] : Math.hypot(p[0] - home[0], p[1] - home[1]);
      if (s < score) { score = s; threat = i; }
    });
    if (threat < 0) return home;
    const r = P[threat], spot = deep ? [r[0], r[1] - 2] : [r[0] + (home[0] - r[0]) * 0.25, r[1] + 1.2];
    return [clamp(spot[0], x0, x1), clamp(spot[1], y0, Math.max(y0, y1))];
  }

  // hit them in stride: a receiver who cuts in one beat and catches in the next doesn't stop and wait.
  // The cut spills into the catch beat: they accelerate through the first part of it, and run the rest
  // at full speed right into the catch, with the ball thrown to where they will be.
  const LEAD = 0.4, carry = beats.map(() => ({})), screens = [], screenRoute = {};
  // where a path is at fraction u of its length, and whether it comes within r of a point
  const at = (mm, u) => { const o = [0, 0, 0]; walk(mm.m, u, o); return [o[0], o[1]]; };
  const passes = (mm, p, r) => { for (let s = 0; s <= 16; s++) { const q = at(mm, s / 16); if (Math.hypot(q[0] - p[0], q[1] - p[1]) < r) return true; } return false; };
  // who runs off a screen at p: the teammate whose path this beat comes closest to it (within 5.5)
  const user = (mv, si, p) => {
    let best = -1, bd = 5.5;
    mv.forEach((mm, j) => {
      if (!mm || j === si || play.players[j].side !== play.players[si].side) return;
      for (let s = 0; s <= 16; s++) { const q = at(mm, s / 16), d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = j; } }
    });
    return best;
  };
  // a handoff happens where the two players meet, on the move. When the sport hands it off off the dribble
  // (sport.dho) and the receiver has nothing planned, they run by the giver hip to hip and take it at speed,
  // then the giver's body is a screen on the receiver's defender.
  function handoffMoment(k, S, E, mv, ev) {
    const gi = ev.from, ri = ev.to, G = E[gi];
    if (sport.dho && !mv[ri]) {
      const R = S[ri], prev = k > 0 ? starts[k - 1][ri] : R;
      let v = [R[0] - prev[0], R[1] - prev[1]];
      if (Math.hypot(v[0], v[1]) < 1) v = [G[0] - R[0], G[1] - R[1]];
      const vl = Math.hypot(v[0], v[1]) || 1; v = [v[0] / vl, v[1] / vl];
      let n = [-v[1], v[0]]; if (n[0] * (R[0] - G[0]) + n[1] * (R[1] - G[1]) < 0) n = [-n[0], -n[1]];
      // take it and turn the corner: downhill, toward the rim, off the giver's hip
      const C = [G[0] + n[0] * 1.3, G[1] + n[1] * 1.3], run = 7, tg = toward([0, 0], [goal[0] - C[0], goal[1] - C[1]], 1);
      let dir = [v[0] * 0.55 + tg[0], v[1] * 0.55 + tg[1]]; const dl = Math.hypot(dir[0], dir[1]) || 1; dir = [dir[0] / dl, dir[1] / dl];
      let end = [C[0] + dir[0] * run, C[1] + dir[1] * run];
      end = [clamp(end[0], F.x[0] + 1, F.x[1] - 1), clamp(end[1], F.y[0] + 1, F.y[1] - 1)];
      const line = route(R, [C], end, true, 24);
      mv[ri] = { m: measured(line.map(p => [p[0], p[1], 0])), kind: 'cut', tm: 'dho' };
      E[ri] = end;
      routes.push(makeRoute(ri, k, 'cut', line)); routes[routes.length - 1].mv = mv[ri];
    }
    // the exchange: the moment of the beat they're closest (hands meet), the ball moves hand to hand
    let fb = 0.6, bd = Infinity;
    for (let s = 0; s <= 40; s++) {
      const f = 0.12 + s / 40 * 0.8, a = mv[gi] ? at(mv[gi], along(mv[gi], f)) : G, b = mv[ri] ? at(mv[ri], along(mv[ri], f)) : E[ri];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d < bd - 1e-6) { bd = d; fb = f; }
    }
    ev.sp = [Math.max(0.1, fb - 0.07), Math.min(0.95, fb + 0.03)];
    if (sport.dho) {
      play.players.forEach((_, d) => { if (match[d] === ri) { screened[k][d] = gi; hung[k][d] = { at: null, f0: fb, f1: null }; } });
      ev.wall = gi;   // the giver plants: drawn as a screen once the ball is handed over
    }
  }
  const catchNext = (k, pi) => {
    const nb = beats[k + 1]; if (!nb) return false;
    const pass = nb.actions.find(a => K[a.kind].type === 'pass' && a.kind !== 'snap' && idx[a.target] === pi);
    return !!pass && !nb.actions.some(a => idx[a.who] === pi && K[a.kind].type === 'move');
  };
  beats.forEach((b, k) => {
    const S = starts[k], E = S.map(p => p.slice()), mv = new Array(np).fill(null);
    let ev = null, holder = holders[k];
    Object.keys(carry[k]).forEach(pi => { mv[pi] = carry[k][pi]; E[pi] = carry[k][pi].end; });
        b.actions.forEach(a => {
      const pi = idx[a.who], spec = K[a.kind];
      if (spec.type === 'move') {
        let to = a.to ? [a.to.x, a.to.y] : null;
        if (!to && a.target != null) {   // a screen or block with no spot: a step off the teammate, toward the goal
          to = toward(S[idx[a.target]], goal, sport.screenGap || 3);
        }
        if (!to && spec.seal) to = toward(S[pi], goal, sport.screenGap || 2.5);   // a box out: a step toward the rim
        if (!to && spec.chase && holder >= 0) to = E[holder] || S[holder];    // a flag pull or a rush: go get the ball
        if (!to) return;
        const way = a.path.map(p => [p.x, p.y]);
        if (a.via) way.push([a.via.x, a.via.y]);
        if (!way.length && spec.curve) way.push(bend(S[pi], to));
        const line = route(S[pi], way, to, !!spec.curve && way.length === 1, 28);
        mv[pi] = { m: measured(line.map(p => [p[0], p[1], 0])), kind: a.kind };
        E[pi] = to.slice();
        if (!spec.style && !spec.seal && !spec.chase && !spec.dribble && catchNext(k, pi) && mv[pi].m.len > 3 * sport.mark) {
          const cut = splitAt(line, LEAD);
          mv[pi] = { m: measured(cut[0].map(p => [p[0], p[1], 0])), kind: a.kind, ease: 'in' };
          carry[k + 1][pi] = { m: measured(cut[1].map(p => [p[0], p[1], 0])), kind: a.kind, ease: 'through', end: to.slice() };
          E[pi] = cut[0][cut[0].length - 1].slice();
        }
        if (spec.style === 'screen') screenRoute[k + ':' + pi] = routes.length;
        routes.push(makeRoute(pi, k, a.kind, line));
        routes[routes.length - 1].mv = mv[pi];
      } else if (spec.type === 'pass' || spec.type === 'handoff') {
        ev = { kind: a.kind, type: spec.type, from: pi, to: idx[a.target], arc: spec.arc == null ? 1 : spec.arc }; holder = idx[a.target];
      } else if (spec.type === 'shot') {
        ev = { kind: a.kind, type: 'shot', from: pi }; holder = -1;
      }
    });
    if (ev && ev.type === 'handoff') handoffMoment(k, S, E, mv, ev);
    if (options.smart !== false) offBall(k, b, S, E, mv, holder);
    // screens hold defenders: the defender of the player being screened for gets stuck on the screener
    b.actions.forEach(a => {
      if (K[a.kind].style !== 'screen') return;
      const si = idx[a.who], at = E[si];
      let ti = a.target != null ? idx[a.target] : -1;
      if (ti == null || ti < 0) ti = user(mv, si, at);   // no target named: whoever runs off it this beat
      if (ti < 0) { screens.push({ k, si, ti: -1, at: at.slice(), route: screenRoute[k + ':' + si] }); return; }
      const uses = !!(mv[ti] && passes(mv[ti], at, 5.5));
      if (uses && mv[si] && !mv[si].ease) { mv[si].tm = 'set'; if (!mv[ti].ease) mv[ti].tm = 'wait'; }
      screens.push({ k, si, ti, at: at.slice(), route: screenRoute[k + ':' + si] });
      play.players.forEach((_, d) => { if (match[d] === ti) { screened[k][d] = si; hung[k][d] = { at: null, f0: uses ? 0.3 : 0.12, f1: null }; } });
    });
    paths.push(mv); starts.push(E); holders.push(holder); ballEv.push(ev);
    const endPos = () => play.players.map((_, pi) => posIn(k, 1, pi));
    play.players.forEach((_, d) => { if (guards(d) && auto[k][d]) E[d] = defSpot(d, k, 1, k + 1, endPos()); });
    // the pass goes to the open player: if the receiver's own defender would be on them at the catch,
    // that defender makes the mistake that opens the pass (ball-watching, helping on the drive)
    if (ev && ev.type === 'pass') {
      const fc = SPANS.pass[1], at = play.players.map((_, pi) => posIn(k, fc, pi));
      play.players.forEach((_, d) => {
        if (match[d] !== ev.to || !auto[k][d]) return;
        const dp = defSpot(d, k, fc, k + fc, at), rp = at[ev.to];
        if (Math.hypot(dp[0] - rp[0], dp[1] - rp[1]) < (sport.open || 3)) { beaten[k][d] = true; E[d] = defSpot(d, k, 1, k + 1, endPos()); }
      });
    }
  });
  // a screen set this beat and used the next: the defender is hung up on its spot while the teammate comes off
  // it, then fights through. And every screen's bar is the screener's shoulders, square to the path the teammate
  // runs past it (the defender trailing on that path runs into the chest).
  screens.forEach(s => {
    const nx = paths[s.k + 1];
    let ti = s.ti, uses = null;
    if (nx) {
      if (ti < 0) ti = user(nx, s.si, s.at);
      if (ti >= 0 && nx[ti] && passes(nx[ti], s.at, 6) && !(paths[s.k][ti] && passes(paths[s.k][ti], s.at, 5.5))) {
        uses = nx[ti];
        play.players.forEach((_, d) => { if (match[d] === ti && screened[s.k + 1][d] == null) { screened[s.k + 1][d] = s.si; hung[s.k + 1][d] = { at: s.at, f0: 0, f1: 0.45 }; } });
      }
    }
    if (ti >= 0 && paths[s.k][ti] && passes(paths[s.k][ti], s.at, 5.5)) uses = paths[s.k][ti];
    let dir = null;
    if (uses) {   // the runner's heading where they pass closest
      let bu = 0, bd = Infinity;
      for (let j = 0; j <= 24; j++) { const q = at(uses, j / 24), d = Math.hypot(q[0] - s.at[0], q[1] - s.at[1]); if (d < bd) { bd = d; bu = j / 24; } }
      const a = at(uses, Math.max(0, bu - 0.08)), b = at(uses, Math.min(1, bu + 0.08)); dir = [b[0] - a[0], b[1] - a[1]];
    } else if (ti >= 0) {
      const t0 = starts[s.k][ti]; dir = [t0[0] - s.at[0], t0[1] - s.at[1]];   // facing the man they screen for
    }
    const r = s.route != null ? routes[s.route] : null;
    if (r && dir && Math.hypot(dir[0], dir[1]) > 0.2) { const nr = makeRoute(r.p, r.beat, r.kind, r.line, dir); nr.mv = r.mv; routes[s.route] = nr; }
  });
  // ball routes are drawn from where the ball really goes, so they need the movement first
  ballEv.forEach((ev, k) => {
    if (!ev) return;
    const sp = ev.sp || SPANS[ev.type];
    const p0 = posIn(k, sp[0], ev.from), p1 = ev.type === 'shot' ? [goal[0], goal[1]] : posIn(k, sp[1], ev.to);
    let line;
    if (ev.type === 'handoff') {
      // drawn the way playbooks draw a handoff: two short bars across the gap where the hands meet
      const m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], dl = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1, ux = (p1[0] - p0[0]) / dl, uy = (p1[1] - p0[1]) / dl;
      const h = 0.7 * sport.mark, g = 0.22 * sport.mark;
      line = [[m[0] + ux * g - uy * h, m[1] + uy * g + ux * h], [m[0] + ux * g + uy * h, m[1] + uy * g - ux * h], [m[0] - ux * g + uy * h, m[1] - uy * g - ux * h], [m[0] - ux * g - uy * h, m[1] - uy * g + ux * h]];
    } else line = route(p0, [], p1, false, 20);
    routes.push(makeRoute(ev.from, k, ev.kind, line)); routes[routes.length - 1].span = sp;
    ev.p0 = p0; ev.p1 = p1;
    if (ev.wall != null && K.screen) {   // the giver plants and becomes a screen on the receiver's defender
      const G = posIn(k, sp[1], ev.from), a = posIn(k, sp[0], ev.to), b = posIn(k, Math.min(1, sp[1] + 0.12), ev.to), v = [b[0] - a[0], b[1] - a[1]];
      if (Math.hypot(v[0], v[1]) > 0.3) {
        const r = makeRoute(ev.from, k, 'screen', [[G[0] - v[0] * 0.02, G[1] - v[1] * 0.02], G], v);
        r.span = [sp[1], Math.min(1, sp[1] + 0.12)]; r.wall = true; routes.push(r);
      }
    }
    // passing style, where the sport says passes are thrown low (basketball: chest or bounce, never a lob):
    // a bounce pass to a cutter or roller going to the rim, or past a defender in the lane; else a chest pass
    if (sport.ball.passes && ev.type === 'pass') {
      const toRim = [paths[k], paths[k - 1]].some(mv => mv && mv[ev.to] && /^(cut|roll|curl|dive)$/.test(mv[ev.to].kind) && Math.hypot(p1[0] - goal[0], p1[1] - goal[1]) < 14);
      const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], at = play.players.map((_, pi) => posIn(k, 0.7, pi));
      const inLane = play.players.some((p, d) => p.side === 'D' && Math.hypot(at[d][0] - mid[0], at[d][1] - mid[1]) < 3.5);
      ev.style = toRim || inLane ? 'bounce' : 'chest';
    }
  });

  // Off-ball offense with nothing to do still plays: crowded by a teammate's cut or screen, or in
  // the way of a drive, they relocate to the best open spot (fill, drift, lift, find space).
  function offBall(k, b, S, E, mv, holder) {
    const A = sport.autonomy; if (!A) return;
    if (A.afterSnap && !beats.slice(0, k).some(bb => bb.actions.some(a => a.kind === A.afterSnap))) return;   // nobody moves before the snap
    const acting = new Set(b.actions.map(a => idx[a.who]).concat(b.actions.filter(a => a.target).map(a => idx[a.target])));
    const O = play.players.map((p, i) => i).filter(i => play.players[i].side === 'O');
    const D = play.players.map((p, i) => i).filter(i => play.players[i].side === 'D');
    const driver = holder >= 0 && mv[holder] ? holder : -1;
    O.forEach(i => {
      if (acting.has(i) || i === holder || A.skip && A.skip(play.players[i])) return;
      const id = play.players[i].id, next = beats[k + 1], prev = beats[k - 1];
      if (next && next.actions.some(a => a.who === id)) return;   // their next job is planned: hold for it
      if (prev && prev.actions.some(a => a.who === id && K[a.kind].style === 'screen')) return;   // a screener about to roll or pop
      const me = E[i];
      // crowded only by a teammate who CUT into my space this beat (not a screen for me, not a set)
      const crowd = O.some(j => {
        if (j === i || !mv[j]) return false;
        const a = b.actions.find(x => idx[x.who] === j);
        if (a && (a.target === play.players[i].id || K[a.kind].style === 'screen')) return false;
        return Math.hypot(E[j][0] - me[0], E[j][1] - me[1]) < A.crowd && Math.hypot(S[j][0] - me[0], S[j][1] - me[1]) >= A.crowd;
      });
      const drive = driver >= 0 && Math.hypot(E[driver][0] - me[0], E[driver][1] - me[1]) < A.drive;
      const pressed = D.some(j => Math.hypot(E[j][0] - me[0], E[j][1] - me[1]) < A.pressed) && A.findSpace;
      if (!crowd && !drive && !pressed) return;
      const cand = A.spots(play, me, sport);
      const score = c => {
        let near = 99; O.forEach(j => { if (j !== i) near = Math.min(near, Math.hypot(E[j][0] - c[0], E[j][1] - c[1])); });
        let dnear = 99; D.forEach(j => { dnear = Math.min(dnear, Math.hypot(E[j][0] - c[0], E[j][1] - c[1])); });
        return Math.min(near, A.crowd * 1.6) + (A.findSpace ? Math.min(dnear, 6) * 0.6 : 0) - 0.12 * Math.hypot(c[0] - me[0], c[1] - me[1]);
      };
      let best = null, bs = score(me) + 0.8;
      cand.forEach(c => { const v = score(c); if (v > bs) { bs = v; best = c; } });
      if (!best) return;
      const why = drive ? A.why.drive : pressed ? A.why.space : A.why.fill;
      const line = route(S[i], [], best, false, 16);
      mv[i] = { m: measured(line.map(p => [p[0], p[1], 0])), kind: A.kind };
      E[i] = best.slice();
      const r = makeRoute(i, k, A.kind, line); r.auto = true; routes.push(r);
      notes.push({ beat: k, who: play.players[i].id, why });
    });
  }
  function splitAt(line, frac) {   // a polyline cut at a fraction of its length
    let L = 0; for (let i = 1; i < line.length; i++) L += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
    let want = L * frac;
    for (let i = 1; i < line.length; i++) {
      const d = Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
      if (d >= want) { const u = d ? want / d : 0, p = [line[i - 1][0] + (line[i][0] - line[i - 1][0]) * u, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * u]; return [line.slice(0, i).concat([p]), [p].concat(line.slice(i))]; }
      want -= d;
    }
    return [line, [line[line.length - 1]]];
  }
  function bend(a, b) {   // a curl bends toward the goal
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return toward(m, goal, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.25);
  }
  function posIn(k, f, pi) {
    const m = paths[k] && paths[k][pi];
    if (!m) return (starts[k] || starts[starts.length - 1])[pi].slice();
    const o = [0, 0, 0];
    walk(m.m, along(m, f), o); return [o[0], o[1]];
  }
  // how far along its path a mover is at fraction f of the beat
  function along(m, f) {
    if (m.ease === 'in') return 1 - Math.cos(Math.min(1, f / SPANS.move[1]) * Math.PI / 2);   // speeding up into the next beat
    if (m.ease === 'through') return Math.min(1, f / SPANS.pass[1]);                           // full speed, into the catch
    if (m.tm === 'dho') return clamp((f - 0.08) / 0.8, 0, 1) ** 1.15;                             // already moving: through the handoff at speed
    const w = m.tm && TIMING[m.tm];
    return w ? ease((f - w[0]) / (w[1] - w[0])) : ease(f / SPANS.move[1]);
  }
  function makeRoute(pi, k, kind, line, bar) {
    const spec = K[kind], u = sport.mark;
    let pts = line.map(p => [p[0], p[1], 0.05 * u]);
    if (spec.style === 'zigzag') {   // a dribble is drawn as a zigzag
      const m0 = measured(pts), waves = Math.max(3, Math.round(m0.len / (1.3 * u))), z = [], a = [0, 0, 0], b = [0, 0, 0];
      for (let i = 0; i <= waves * 6; i++) {
        const t = i / (waves * 6); walk(m0, t, a); walk(m0, Math.min(1, t + 0.01), b);
        let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
        const w = Math.sin(t * waves * Math.PI * 2) * 0.42 * u * Math.min(1, (1 - t) * 6);
        z.push([a[0] - dy * w, a[1] + dx * w, a[2]]);
      }
      pts = z;
    }
    const e = pts[pts.length - 1], q = pts[Math.max(0, pts.length - 3)];
    let dx = e[0] - q[0], dy = e[1] - q[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    if (spec.style === 'screen' && bar) {   // shoulders square to the runner's path: the bar lies across it
      const bl = Math.hypot(bar[0], bar[1]) || 1; dx = bar[0] / bl; dy = bar[1] / bl;
    }
    if (spec.style === 'screen') {   // a screen or block ends in a bar: the body the defender runs into
      pts = pts.concat([[e[0] - dy * 1.05 * u, e[1] + dx * 1.05 * u, e[2]], [e[0] + dy * 1.05 * u, e[1] - dx * 1.05 * u, e[2]]]);
    } else if (spec.type === 'move' && pts.length > 2) {   // everything else ends in an arrowhead
      const back = [e[0] - dx * 0.75 * u, e[1] - dy * 0.75 * u];
      pts = pts.concat([[back[0] - dy * 0.48 * u, back[1] + dx * 0.48 * u, e[2]], e.slice(), [back[0] + dy * 0.48 * u, back[1] - dx * 0.48 * u, e[2]]]);
    }
    const m = measured(pts);
    return { p: pi, beat: k, kind, side: play.players[pi].side, type: spec.type, pts, m, len: m.len, line, dashed: spec.type === 'pass' || spec.type === 'shot' };
  }

  // ---- the clock, and a per-frame memo so every consumer of a frame shares one computation ----
  let t = 0, playing = true, speed = 1, last = 0, onBeat = null, beatNow = -1, gate = null;
  const span = beats.length + HOLD, B = sport.ball;
  const memo = { pt: NaN, P: null, bt: NaN, Bp: null, rt: NaN, R: null };
  const sim = {
    sport, play, players: play.players, routes, beats: beats.length, idx, match, job, notes, beaten, screened,
    // how open a player is right now: distance to the nearest defender
    space(time, i) { const P = sim.posAt(time); let best = Infinity; play.players.forEach((p, j) => { if (p.side === 'D') best = Math.min(best, Math.hypot(P[j][0] - P[i][0], P[j][1] - P[i][1])); }); return best; },
    time: () => t,
    tick(now) {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
      if (playing) {
        const nt = t + dt * speed / 2.4;   // a beat is ~2.4 s at 1×
        // a host can hold the play at the end of a beat (the voice still talking): it waits there, never cut off
        t = Math.floor(nt) > Math.floor(t) && gate && gate() ? Math.max(t, Math.floor(nt) - 1e-4) : nt;
      }
      if (t >= span) t = 0;
      const b = Math.min(beats.length, Math.floor(t));
      if (b !== beatNow) { beatNow = b; onBeat && onBeat(b); }
      return t;
    },
    onBeat(fn) { onBeat = fn; },
    hold(fn) { gate = fn; },
    seek(v) { t = clamp(v, 0, span - 0.001); },
    playing: v => (v == null ? playing : (playing = v)),
    speed: v => (v == null ? speed : (speed = clamp(v, 0.25, 3))),
    beatAt: () => Math.min(beats.length, Math.floor(t)),
    posAt(time) {
      if (time === memo.pt) return memo.P;
      const k = Math.floor(time), f = time - k;
      let P;
      if (k >= beats.length) P = starts[beats.length];
      else {
        P = play.players.map((_, pi) => posIn(k, f, pi));
        const into = ease(f / 0.45);
        play.players.forEach((_, d) => {
          if (!guards(d) || !auto[k][d]) return;
          const g = defSpot(d, k, f, time, P), s0 = starts[k][d];
          P[d] = [s0[0] + (g[0] - s0[0]) * into, s0[1] + (g[1] - s0[1]) * into];   // from where they really were, never a jump
        });
      }
      memo.pt = time; memo.P = P; return P;
    },
    ballAt(time) {
      if (time === memo.bt) return memo.Bp;
      memo.bt = time; memo.Bp = ballAt(time); return memo.Bp;
    },
    routeState(time) {
      if (time === memo.rt) return memo.R;
      const k = Math.floor(time), f = time - k, P = sim.posAt(time), Bp = sim.ballAt(time);
      memo.rt = time;
      memo.R = routes.map(r => {
        if (k < r.beat) return { drawn: 0, home: [P[r.p][0], P[r.p][1], 0.2 * sport.mark] };
        if (k > r.beat) {
          const age = k - r.beat;
          if (k < beats.length && age >= 3) return { drawn: 0, age, home: [P[r.p][0], P[r.p][1], 0.2 * sport.mark] };   // long gone: back into the player
          return { drawn: 1, age: k >= beats.length ? 9 : age };
        }
        const ball = r.type !== 'move', home = ball ? Bp : [P[r.p][0], P[r.p][1], 0.2 * sport.mark];
        if (!ball && r.mv && !r.span) return { drawn: along(r.mv, f), age: 0, home };   // the line grows with the player, whatever their timing
        const sp = r.span || SPANS[r.type] || SPANS.move, d = clamp((f - sp[0]) / (sp[1] - sp[0]), 0, 1);
        return { drawn: ball ? d : ease(d), age: 0, home };
      });
      return memo.R;
    },
    routePoint(ri, s, out) {
      const r = routes[ri];
      if (r.dashed) { const D = Math.max(4, Math.round(r.len / (1.2 * sport.mark))), seg = Math.min(D - 1, Math.floor(s * D)), fr = s * D - seg; s = (seg + fr * 0.55) / D; }
      return walk(r.m, s, out);
    },
    routeSlice: (ri, frac) => slice(routes[ri].m, frac),
    isAuto: (k, d) => !!(auto[Math.min(k, beats.length - 1)] || [])[d],
    beatInfo: k => beats[k] || null,
    passStyle: k => (ballEv[k] && ballEv[k].style) || null,
    holderAt: time => {   // who has the ball right now (−1 in the air or gone)
      const k = Math.floor(time), f = time - k;
      if (k >= beats.length) return holders[beats.length];
      const ev = ballEv[k]; if (!ev) return holders[k];
      const sp = SPANS[ev.type]; return f < sp[0] ? holders[k] : f < sp[1] ? -1 : holders[k + 1];
    }
  };

  function ballAt(time) {
    const k = Math.floor(time), f = time - k, P = sim.posAt(time);
    const held = (pi, bouncing) => {
      const p = P[pi];
      const h = bouncing ? B.held * 0.2 + B.held * 0.78 * Math.abs(Math.sin(time * Math.PI * 7)) : B.held;
      return [p[0] + B.offset[0], p[1] + B.offset[1], h];
    };
    const loose = () => [goal[0], goal[1] + 1.5 * sport.mark, B.r];
    if (k >= beats.length) { const h = holders[beats.length]; return h >= 0 ? held(h, false) : loose(); }
    const ev = ballEv[k], hk = holders[k];
    const bouncing = pi => !!(B.bounce && paths[k][pi] && K[paths[k][pi].kind].dribble);
    if (ev) {
      const sp = ev.sp || SPANS[ev.type];
      if (f >= sp[0] && f < sp[1]) {
        const u = (f - sp[0]) / (sp[1] - sp[0]);
        const a = ev.p0, b = ev.type === 'shot' ? goal : ev.type === 'handoff' ? P[ev.to] : ev.p1;   // thrown to where the receiver will be
        const h0 = B.held, h1 = ev.type === 'shot' ? goal[2] + B.r : B.held;
        const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (ev.style === 'bounce') {   // down to the floor two-thirds of the way, up into the hands at the waist
          const hit = 0.62, h = u < hit ? h0 * (1 - u / hit) + B.r : B.r + (B.held * 0.8 - B.r) * ((u - hit) / (1 - hit));
          return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, h];
        }
        if (ev.style === 'chest') return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, h0 + 0.35 * Math.sin(Math.PI * u) * Math.min(1, dist / 20)];   // flat, on a line
        const peak = ev.type === 'shot' ? goal[2] * 0.7 : ev.type === 'handoff' ? 0.15 * sport.mark : Math.min(B.maxArc, dist * 0.18) * ev.arc;
        return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, h0 + (h1 - h0) * u + 4 * peak * u * (1 - u)];
      }
      if (f >= sp[1]) {
        if (ev.type === 'shot') { const u = clamp((f - sp[1]) / 0.05, 0, 1); return [goal[0], goal[1] - u * 1.5, goal[2] + 0.2 - u * (goal[2] - B.r)]; }
        return held(ev.to, bouncing(ev.to));
      }
    }
    if (hk < 0) return loose();
    return held(hk, bouncing(hk));
  }
  return sim;
}
