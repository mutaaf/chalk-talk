// A play, compiled into a timeline for one sport: where every player, the ball and every
// route is at beat-time t (beat k runs from t = k to k + 1). Pure: no DOM, no field, any sport.
//
// A sport pack (src/sports/*) supplies the field, the units, named spots, the roster size, the
// action vocabulary and how defenders guard. Nothing here knows basketball from football.

import { clamp, ease, route, measured, walk, slice, toward } from './geom.js';

const HOLD = 1.6;   // beats of stillness at the end before it plays again
const SPANS = { move: [0, 0.82], pass: [0.52, 0.94], handoff: [0.55, 0.8], shot: [0.35, 0.95] };

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
      actions.push(act);
    });
    beats.push({ say: String(b.say || '').slice(0, 220), actions });
  });
  if (!beats.length) beats.push({ say: 'Everyone in their spots.', actions: [] });
  const los = num(raw.los) ? clamp(raw.los, F.y[0], F.y[1]) : sport.los;
  if (sport.autoRoles) sport.autoRoles(players, los);
  return {
    ok: true, errors,
    play: {
      sport: sport.id, title: String(raw.title || 'Untitled play').slice(0, 60), concept: String(raw.concept || '').slice(0, 40),
      summary: String(raw.summary || '').slice(0, 420), players, ball: ballId, beats, los, coverage: raw.coverage ? String(raw.coverage).slice(0, 12) : null,
      reads: (Array.isArray(raw.reads) ? raw.reads : []).filter(r => r && ids[String(r.who).toUpperCase()]).slice(0, 5).map(r => ({ who: String(r.who).toUpperCase(), text: String(r.text || '').slice(0, 90) })),
      cues: (Array.isArray(raw.cues) ? raw.cues : []).slice(0, 5).map(c => String(c).slice(0, 40))
    }
  };
}

// add an X for every O that has none, a step toward the goal; they guard on their own
export function withDefense(play, sport) {
  const have = {}; play.players.forEach(p => { have[p.id] = 1; });
  const add = play.players.filter(p => p.side === 'O' && !have['X' + p.id.slice(1)]).map(p => {
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
  const ballEv = [];
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
    } else g = sport.guard({ o: P[match[d]], ball, onBall: holder === match[d], sport, los: play.los });
    return [clamp(g[0], F.x[0] + 0.5, F.x[1] - 0.5), clamp(g[1], F.y[0] + 0.5, F.y[1] - 0.5)];
  };
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

  beats.forEach((b, k) => {
    const S = starts[k], E = S.map(p => p.slice()), mv = new Array(np).fill(null);
    let ev = null, holder = holders[k];
    if (k > 0) play.players.forEach((_, d) => { if (guards(d) && auto[k - 1][d]) S[d] = guard(S, d, holder, k); });
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
        routes.push(makeRoute(pi, k, a.kind, line));
      } else if (spec.type === 'pass' || spec.type === 'handoff') {
        ev = { kind: a.kind, type: spec.type, from: pi, to: idx[a.target], arc: spec.arc == null ? 1 : spec.arc }; holder = idx[a.target];
      } else if (spec.type === 'shot') {
        ev = { kind: a.kind, type: 'shot', from: pi }; holder = -1;
      }
    });
    play.players.forEach((_, d) => { if (guards(d) && auto[k][d]) E[d] = guard(E, d, holder, k + 1); });
    paths.push(mv); starts.push(E); holders.push(holder); ballEv.push(ev);
  });
  // ball routes are drawn from where the ball really goes, so they need the movement first
  ballEv.forEach((ev, k) => {
    if (!ev) return;
    const sp = SPANS[ev.type];
    const p0 = posIn(k, sp[0], ev.from), p1 = ev.type === 'shot' ? [goal[0], goal[1]] : posIn(k, sp[1], ev.to);
    const line = ev.type === 'handoff' ? route(p0, [[(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 1.2]], p1, true, 10) : route(p0, [], p1, false, 20);
    routes.push(makeRoute(ev.from, k, ev.kind, line));
    ev.p0 = p0; ev.p1 = p1;
  });

  function bend(a, b) {   // a curl bends toward the goal
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return toward(m, goal, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.25);
  }
  function posIn(k, f, pi) {
    const m = paths[k] && paths[k][pi];
    if (!m) return (starts[k] || starts[starts.length - 1])[pi].slice();
    const o = [0, 0, 0]; walk(m.m, ease(f / SPANS.move[1]), o); return [o[0], o[1]];
  }
  function makeRoute(pi, k, kind, line) {
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
    if (spec.style === 'screen') {   // a screen or block ends in a bar: the body the defender runs into
      pts = pts.concat([[e[0] - dy * 1.05 * u, e[1] + dx * 1.05 * u, e[2]], [e[0] + dy * 1.05 * u, e[1] - dx * 1.05 * u, e[2]]]);
    } else if (spec.type === 'move' && pts.length > 2) {   // everything else ends in an arrowhead
      const back = [e[0] - dx * 0.75 * u, e[1] - dy * 0.75 * u];
      pts = pts.concat([[back[0] - dy * 0.48 * u, back[1] + dx * 0.48 * u, e[2]], e.slice(), [back[0] + dy * 0.48 * u, back[1] - dx * 0.48 * u, e[2]]]);
    }
    const m = measured(pts);
    return { p: pi, beat: k, kind, side: play.players[pi].side, type: spec.type, pts, m, len: m.len, dashed: spec.type === 'pass' || spec.type === 'shot' };
  }

  // ---- the clock, and a per-frame memo so every consumer of a frame shares one computation ----
  let t = 0, playing = true, speed = 1, last = 0, onBeat = null, beatNow = -1;
  const span = beats.length + HOLD, B = sport.ball;
  const memo = { pt: NaN, P: null, bt: NaN, Bp: null, rt: NaN, R: null };
  const sim = {
    sport, play, players: play.players, routes, beats: beats.length, idx, match, job,
    time: () => t,
    tick(now) {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
      if (playing) t += dt * speed / 2.4;   // a beat is ~2.4 s at 1×
      if (t >= span) t = 0;
      const b = Math.min(beats.length, Math.floor(t));
      if (b !== beatNow) { beatNow = b; onBeat && onBeat(b); }
      return t;
    },
    onBeat(fn) { onBeat = fn; },
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
        const h0 = holders[k], h1 = holders[k + 1], shift = ease((f - 0.55) / 0.35), into = ease(f / 0.3);
        play.players.forEach((_, d) => {
          if (!guards(d) || !auto[k][d]) return;
          const a = guard(P, d, h0, time), b = h1 === h0 ? a : guard(P, d, h1, time);
          const gx = a[0] + (b[0] - a[0]) * shift, gy = a[1] + (b[1] - a[1]) * shift, s0 = starts[k][d];
          const lag = k === 0 || !auto[k - 1][d] ? into : 1;   // coming off a job (or the opening spot): ease into guarding
          P[d] = [s0[0] + (gx - s0[0]) * lag, s0[1] + (gy - s0[1]) * lag];
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
        if (k > r.beat) return { drawn: 1 };
        const sp = SPANS[r.type] || SPANS.move, d = clamp((f - sp[0]) / (sp[1] - sp[0]), 0, 1), ball = r.type !== 'move';
        return { drawn: ball ? d : ease(d), home: ball ? Bp : [P[r.p][0], P[r.p][1], 0.2 * sport.mark] };
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
      const sp = SPANS[ev.type];
      if (f >= sp[0] && f < sp[1]) {
        const u = (f - sp[0]) / (sp[1] - sp[0]);
        const a = ev.p0, b = ev.type === 'shot' ? goal : P[ev.to];
        const h0 = B.held, h1 = ev.type === 'shot' ? goal[2] + B.r : B.held;
        const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
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
