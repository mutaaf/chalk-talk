// The field as aurora particles: lines, players, the ball and routes, for any sport pack.
// Positions are the sport's units (feet, yards); the view leans the field back like a table
// seen from a seat behind the play, with the goal at the far end.

import { measured, walk } from './geom.js';
import { life } from './sim.js';

export function view(sport) {
  const v = sport.view, S = v.scale, C = v.center, cb = Math.cos(v.tilt), sb = Math.sin(v.tilt), lift = v.lift || 0;
  return function toShape(x, y, h, out) {
    out = out || [0, 0, 0];
    const Y = -h * S, Z = -(y - C) * S;
    out[0] = x * S; out[1] = Y * cb - Z * sb + lift; out[2] = Y * sb + Z * cb;
    return out;
  };
}

// how many particles this device should run: phones, small or busy machines get fewer
export function particleBudget(width) {
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const cores = nav.hardwareConcurrency || 4, mem = nav.deviceMemory || 4;
  let n = width < 700 ? 3000 : width < 1200 ? 4800 : 6400;
  if (cores <= 4 || mem <= 3) n = Math.round(n * 0.7);
  if (/Mobi|Android/i.test(nav.userAgent || '')) n = Math.min(n, 3200);
  return n;
}

export function playShape(sim, opts) {
  opts = opts || {};
  const sport = sim.sport, toShape = view(sport), U = sport.mark;
  return function (n, rand) {
    const lines = sport.field.lines(sim.play), np = sim.players.length, routes = sim.routes;
    // budget: field 44%, players 34%, ball 3%, routes the rest
    const nBall = Math.max(30, Math.round(n * 0.03));
    const nPer = Math.floor(n * 0.34 / Math.max(sport.roster.perSide, np));
    const nRoute = routes.length ? Math.floor(n * 0.19) : 0;
    const nField = n - nBall - nPer * np - nRoute;
    const pts = [], tone = [], alpha = [], order = [], links = [], linkTone = [];
    const kind = new Int8Array(n), grp = new Int16Array(n), loc = new Float32Array(n * 3), sArr = new Float32Array(n);
    const tmp = [0, 0, 0];

    // field: points spread along the lines by length × weight, plus crisp links
    const ms = lines.map(l => measured(l.p)), wl = lines.map((l, i) => Math.max(0.01, ms[i].len * l.w)), wsum = wl.reduce((a, b) => a + b, 0);
    let made = 0, ordBase = 0;
    lines.forEach((l, li) => {
      const cnt = li === lines.length - 1 ? nField - made : Math.floor(nField * wl[li] / wsum);
      for (let k = 0; k < cnt; k++) {
        const t = cnt > 1 ? k / (cnt - 1) : 0; walk(ms[li], t, tmp);
        const j = 0.05 * U;
        pts.push(toShape(tmp[0] + (rand() - 0.5) * j, tmp[1] + (rand() - 0.5) * j, tmp[2]));
        tone.push(l.hot ? 1 : l.warm ? 0.3 : 0); alpha.push(l.w < 0.6 ? 0.55 : 1);
        order.push(0.62 * (ordBase + t * wl[li]) / wsum);
      }
      ordBase += wl[li]; made += cnt;
      if (!l.dots) for (let k = 1; k < l.p.length; k++) {
        const a = l.p[k - 1], b = l.p[k];
        links.push([toShape(a[0], a[1], a[2] || 0), toShape(b[0], b[1], b[2] || 0)]); linkTone.push(l.hot ? 1 : 0);
      }
    });

    // players: whiteboard marks drawn in light on the floor, an O for offense, an X for defense
    const P0 = sim.posAt(0);
    sim.players.forEach((pl, pi) => {
      const off = pl.side === 'O';
      for (let k = 0; k < nPer; k++) {
        const i = pts.length, u = k / nPer; let dx, dy;
        if (off) { const a = u * Math.PI * 2, r = U * (1 + (k % 3 - 1) * 0.07); dx = Math.cos(a) * r; dy = Math.sin(a) * r; }
        else { const arm = k % 2 ? 1 : -1, r2 = (u * 2 - 1) * 0.9 * U; dx = r2 + (rand() - 0.5) * 0.06 * U; dy = r2 * arm; }
        const dh = 0.2 * U;
        kind[i] = 1; grp[i] = pi; loc[i * 3] = dx; loc[i * 3 + 1] = dy; loc[i * 3 + 2] = dh;
        pts.push(toShape(P0[pi][0] + dx, P0[pi][1] + dy, dh));
        tone.push(off ? 1 : 0.15); alpha.push(0.75); order.push(0.66 + 0.3 * (pi + u) / np);
      }
    });

    // the ball: a small sphere
    const B0 = sim.ballAt(0), R = sport.ball.r;
    for (let k = 0; k < nBall; k++) {
      const i = pts.length, z = 1 - 2 * (k + 0.5) / nBall, r = Math.sqrt(1 - z * z), a = k * 2.39996;
      kind[i] = 2; loc[i * 3] = Math.cos(a) * r * R * sport.ball.stretch; loc[i * 3 + 1] = Math.sin(a) * r * R; loc[i * 3 + 2] = z * R;
      pts.push(toShape(B0[0], B0[1], B0[2])); tone.push(1); alpha.push(1); order.push(0.99);
    }

    // routes: spread over each route by its length; they wait inside their player until drawn
    const rl = routes.map(r => Math.max(2 * U, r.len)), rsum = rl.reduce((a, b) => a + b, 0);
    let rmade = 0;
    routes.forEach((r, ri) => {
      const cnt = ri === routes.length - 1 ? nRoute - rmade : Math.floor(nRoute * rl[ri] / rsum);
      for (let k = 0; k < cnt; k++) {
        const i = pts.length; kind[i] = 3; grp[i] = ri; sArr[i] = cnt > 1 ? k / (cnt - 1) : 1;
        const p0 = P0[r.p]; pts.push(toShape(p0[0], p0[1], 0.1 * U));
        tone.push(r.type === 'move' ? (r.side === 'O' ? 1 : 0.15) : 0.55); alpha.push(0.8); order.push(0.99);
      }
      rmade += cnt;
    });

    const out = [0, 0, 0], at = [0, 0, 0], L = sim.players.map(() => [0, 0]), sides = sim.players.map(p => p.side);
    let cacheT = -1, cacheS = -1, P = null, Bp = null, RS = null, H = -1;
    function frame() {
      const t = sim.time(), sec = Math.round(performance.now() / 33) / 30;   // life moves on real time, even when paused
      if (t !== cacheT) { cacheT = t; P = sim.posAt(t); Bp = sim.ballAt(t); RS = sim.routeState(t); H = sim.holderAt(t); }
      if (sec !== cacheS) { cacheS = sec; for (let i = 0; i < L.length; i++) life(sport, sides[i], i, sec, L[i]); }
    }
    return {
      points: pts, tone, alpha, links, linkTone, lineArt: true, still: true, facing: true, kick: 0.05,
      trace: opts.trace ? { order, ms: 3200 } : undefined,
      flow(i) {
        const k = kind[i]; if (!k) return null;
        frame();
        if (k === 1) { const p = P[grp[i]], l = L[grp[i]]; return toShape(p[0] + l[0] + loc[i * 3], p[1] + l[1] + loc[i * 3 + 1], loc[i * 3 + 2], out); }
        if (k === 2) { const l = H >= 0 ? L[H] : [0, 0]; return toShape(Bp[0] + l[0] + loc[i * 3], Bp[1] + l[1] + loc[i * 3 + 1], Bp[2] + loc[i * 3 + 2], out); }
        const rs = RS[grp[i]], s = sArr[i];
        if (!rs || rs.drawn <= 0 || s > rs.drawn) { const h = rs && rs.home ? rs.home : [0, 0, 0]; return toShape(h[0], h[1], h[2], out); }
        sim.routePoint(grp[i], s, at);
        return toShape(at[0], at[1], at[2], out);
      }
    };
  };
}
