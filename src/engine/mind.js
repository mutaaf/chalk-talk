// The mind view's numbers: what every player is doing, seeing and deciding at beat-time t, read straight
// from the compiled play (sim). Pure: no DOM. Built for a live overlay, so the work is split three ways:
//   facts(sim, sport)        once per play (cached on the sim): brains, jobs, a sampled track of every
//                            player for speed, heading and distance, route lengths, the QB's progression
//   frame(sim, sport, t)     once per tick, shared by every player: positions (the sim's per-frame memo),
//                            the holder, the ball in the air, the help defender
//   telemetry(sim, sport, t, i, F, fr)   one player, O(players)
// bestReads (engine/reads.js) is O(players²) and stays with the caller, for the players it's showing.

import { SPANS } from './sim.js';
import { progression, readStart, READ_STEP, openness as fbOpenness, zoneRect } from './football.js';

export const BEAT_S = 2.4;   // seconds a beat lasts at 1× (sim.tick)
const H = 0.05;              // the track's sample step, in beats
const cache = new WeakMap();
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// distance from p to the middle of the lane a → b (the passer's own defender at the start doesn't block it), as in reads.js
const seg = (p, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, u = Math.max(0.25, Math.min(0.72, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
  return Math.hypot(a[0] + dx * u - p[0], a[1] + dy * u - p[1]);
};

// ---- once per play ----
export function facts(sim, sport) {
  let F = cache.get(sim); if (F) return F;
  const n = sim.players.length, beats = sim.beats, steps = Math.max(1, Math.ceil(beats / H)), K = sport.kinds;
  // the track: every player sampled every H beats over the play (the end holds still), and the running distance
  // A step longer than anyone can run in a sample (4 marks in 0.12 s) is the engine re-placing a player at a
  // beat's seam (a beaten defender's new spot), not running: it's counted as a snap, not as distance or speed.
  const track = sim.players.map(() => new Float32Array((steps + 1) * 2)), cum = sim.players.map(() => new Float32Array(steps + 1));
  const warp = sim.players.map(() => new Uint8Array(steps + 1)), snaps = sim.players.map(() => 0), far = 4 * sport.mark;
  for (let s = 0; s <= steps; s++) {
    const P = sim.posAt(Math.min(beats, s * H));
    for (let i = 0; i < n; i++) {
      track[i][s * 2] = P[i][0]; track[i][s * 2 + 1] = P[i][1];
      if (!s) continue;
      const d = Math.hypot(P[i][0] - track[i][s * 2 - 2], P[i][1] - track[i][s * 2 - 1]);
      if (d > far) { warp[i][s] = 1; snaps[i]++; cum[i][s] = cum[i][s - 1]; } else cum[i][s] = cum[i][s - 1] + d;
    }
  }
  // top speed over the play (units per beat), for the sparkline's scale
  const vmax = sim.players.map((_, i) => { let m = 0; for (let s = 1; s <= steps; s++) m = Math.max(m, (cum[i][s] - cum[i][s - 1]) / H); return m; });
  const routes = sim.players.map((_, i) => sim.routes.map((r, ri) => ri).filter(ri => sim.routes[ri].p === i && sim.routes[ri].type === 'move'));
  const acts = sim.players.map(p => sim.play.beats.map((b, k) => b.actions.some(a => a.who === p.id) ? k : -1).filter(k => k >= 0));
  const fb = !!K.route, los = sim.play.los != null ? sim.play.los : sport.los;
  F = {
    steps, track, cum, warp, snaps, vmax, routes, acts, fb, los,
    brain: sim.players.map(p => (sport.brains ? sport.brains(p) : null) || { name: 'Player brain', instincts: '' }),
    shown: sim.players.map(p => sport.notation.inside(p)),
    job: sim.players.map((p, i) => jobOf(sim, sport, i)),
    zone: sim.players.map((p, i) => sim.job[i] && sim.job[i].type === 'zone' ? zoneRect(sim.job[i].zone, sport, los) : null),
    t0: fb ? readStart(sim) : 0, orders: {}
  };
  cache.set(sim, F);
  return F;
}
// a defender's standing job, in words
function jobOf(sim, sport, i) {
  const p = sim.players[i], c = sim.job[i], m = sim.match[i];
  if (p.side !== 'D') return null;
  if (c && c.type === 'zone') return { type: 'zone', label: c.zone.label || 'Zone', text: 'Zone · ' + (c.zone.label || 'area') };
  if (c && c.type === 'rush') return { type: 'rush', label: 'Rush', text: 'Rush the QB' };
  if (m >= 0) return { type: 'man', on: m, label: 'Man', text: (c ? 'Man on ' : 'Guards ') + sim.players[m].id };
  return { type: 'free', label: 'Free', text: 'No assignment' };
}
// the QB's reads, in order (cached per eyes setting; progression() costs a posAt)
export function orderFor(sim, F, mode, side) {
  if (!F.fb) return [];
  const key = (mode && mode !== 'off' ? mode : 'full') + side;
  if (!F.orders[key]) F.orders[key] = progression(sim, mode && mode !== 'off' ? mode : 'full', side || 1);
  return F.orders[key];
}

// the track at time t: position, velocity (units per beat), distance so far
function sampled(F, i, t) {
  const s = Math.max(0, Math.min(F.steps, t / H)), a = Math.min(F.steps - 1, Math.floor(s)), w = s - a, T = F.track[i], C = F.cum[i];
  const still = s >= F.steps || F.warp[i][a + 1];
  const vx = still ? 0 : (T[a * 2 + 2] - T[a * 2]) / H, vy = still ? 0 : (T[a * 2 + 3] - T[a * 2 + 1]) / H;
  return { vx, vy, d: C[a] + (C[a + 1] - C[a]) * w };
}
// speed over the whole play, n points (for a sparkline): units per beat
export function speedProfile(F, i, n) {
  const out = new Float32Array(n), C = F.cum[i];
  for (let j = 0; j < n; j++) { const s = Math.min(F.steps - 1, Math.floor(j / (n - 1) * (F.steps - 1))); out[j] = (C[s + 1] - C[s]) / H; }
  return out;
}

// ---- once per tick, shared ----
export function frame(sim, sport, t) {
  const P = sim.posAt(t), k = Math.min(sim.beats - 1, Math.floor(t)), f = t - k, done = t >= sim.beats, n = sim.players.length;
  const holder = sim.holderAt(t), info = done ? null : sim.beatInfo(k), K = sport.kinds;
  const D = [], O = [];
  for (let i = 0; i < n; i++) (sim.players[i].side === 'D' ? D : O).push(i);
  // the ball this beat: a pass, handoff or shot, and where it is in its flight
  let ball = null;
  if (info) {
    const a = info.actions.find(x => K[x.kind] && (K[x.kind].type === 'pass' || K[x.kind].type === 'handoff' || K[x.kind].type === 'shot'));
    if (a) {
      const type = K[a.kind].type, sp = SPANS[type];
      ball = { kind: a.kind, type, from: sim.idx[a.who], to: a.target ? sim.idx[a.target] : -1, release: k + sp[0], arrive: k + sp[1], phase: f < sp[0] ? 'coming' : f < sp[1] ? 'air' : 'done' };
    }
  }
  // the help: replicates sim.js helperOf (a real drive, deep enough: the man defender whose man is farthest from the ball)
  let helper = -1;
  const Hh = sport.help;
  if (Hh && holder >= 0 && !done && sim.holderAt(k) === holder && sim.routes.some(r => r.p === holder && r.beat === k && K[r.kind] && K[r.kind].dribble) && dist(P[holder], sport.field.goal) <= Hh.at) {
    let bd = -1;
    D.forEach(d => {
      const m = sim.match[d], j = sim.job[d];
      if (m < 0 || m === holder || (j && j.type !== 'man')) return;
      const v = dist(P[m], P[holder]); if (v > bd) { bd = v; helper = d; }
    });
  }
  return { t, k, f, done, P, holder, info, ball, helper, D, O, RS: sim.routeState(t), speed: sim.speed ? sim.speed() : 1 };
}

// ---- one player ----
export function telemetry(sim, sport, t, i, F, fr) {
  F = F || facts(sim, sport); fr = fr || frame(sim, sport, t);
  const p = sim.players[i], P = fr.P, me = P[i], K = sport.kinds, open = sport.open || 3, secs = BEAT_S / (fr.speed || 1);
  const tr = sampled(F, i, t), sp = Math.hypot(tr.vx, tr.vy);
  const out = {
    id: p.id, side: p.side, role: p.role || '', shown: F.shown[i], smart: !!p.smart, brain: F.brain[i],
    x: me[0], y: me[1], unit: sport.unit,
    speed: sp / BEAT_S,                     // units per second at 1×
    heading: sp > 0.05 ? Math.atan2(tr.vx, -tr.vy) * 180 / Math.PI : null,   // 0° = toward the goal end, + to the right
    vx: tr.vx, vy: tr.vy,
    dist: tr.d, total: F.cum[i][F.steps],
    beat: fr.done ? null : fr.k, action: null, actions: [], auto: null, route: null, thought: null,
    ball: null, def: null, off: null, fb: null
  };
  // what they're doing right now: this beat's actions (theirs, and the ones aimed at them)
  const info = fr.info;
  if (info) {
    info.actions.forEach(a => {
      if (a.who === p.id) out.actions.push({ kind: a.kind, type: K[a.kind] ? K[a.kind].type : '', target: a.target || null, to: a.to ? [a.to.x, a.to.y] : null, tree: a.tree || null });
      else if (a.target === p.id) out.actions.push({ kind: a.kind, type: K[a.kind] ? K[a.kind].type : '', from: a.who, incoming: true });
    });
    out.action = out.actions.find(a => !a.incoming) || out.actions[0] || null;
    const note = sim.notes.find(nn => nn.beat === fr.k && nn.who === p.id);
    if (note) out.auto = note.why;
    const th = info.actions.find(a => a.who === p.id && a.thought);
    out.thought = (th && th.thought) || (info.thoughts && info.thoughts[p.id]) || null;
  }
  // the route they're on this beat, and how far along it they are
  const ri = F.routes[i].find(r => sim.routes[r].beat === fr.k);
  if (ri != null && !fr.done) out.route = { kind: sim.routes[ri].kind, len: sim.routes[ri].len, done: fr.RS[ri] ? fr.RS[ri].drawn || 0 : 0, auto: !!sim.routes[ri].auto, n: F.routes[i].indexOf(ri) + 1, of: F.routes[i].length };
  // the ball
  const b = fr.ball;
  if (fr.holder === i) out.ball = { state: 'holding', text: b && b.from === i && b.phase === 'coming' ? (b.type === 'shot' ? 'shooting' : b.kind + ' to ' + sim.players[b.to].id) + ' in ' + ((b.release - t) * secs).toFixed(1) + 's' : 'has the ball' };
  else if (b && b.to === i && b.phase !== 'done') out.ball = { state: b.phase === 'air' ? 'air' : 'coming', from: sim.players[b.from].id, eta: (b.arrive - t) * secs, text: (b.phase === 'air' ? 'ball in the air' : b.kind + ' coming') + ' · catch in ' + ((b.arrive - t) * secs).toFixed(1) + 's' };
  else if (b && b.from === i && b.phase === 'air') out.ball = { state: 'released', text: b.type === 'shot' ? 'shot is up' : 'just threw it' };
  // defense: the job, the man, screens, beaten, help, reaction
  if (p.side === 'D') {
    const m = sim.match[i], k = fr.k, j = F.job[i];
    const scr = !fr.done && sim.screened[k] ? sim.screened[k][i] : null;
    out.def = {
      job: j, zone: j && j.type === 'zone' ? j.label : null, zoneRect: F.zone[i],
      man: m >= 0 ? sim.players[m].id : null, toMan: m >= 0 ? dist(me, P[m]) : null,
      manHasBall: m >= 0 && fr.holder === m,
      screenedBy: scr != null ? sim.players[scr].id : null,
      beaten: !fr.done && !!(sim.beaten[k] && sim.beaten[k][i]),
      help: fr.helper === i, auto: fr.done ? false : sim.isAuto(k, i),
      react: sport.react || 0.3, reactS: (sport.react || 0.3) * secs,
      toBall: fr.holder >= 0 ? dist(me, P[fr.holder]) : null
    };
  } else {
    // offense: space to the nearest defender, how open, the lane from the ball, who guards them
    let near = -1, space = 99;
    fr.D.forEach(d => { const v = dist(P[d], me); if (v < space) { space = v; near = d; } });
    let lane = null;
    if (fr.holder >= 0 && fr.holder !== i && fr.D.length) { lane = 99; fr.D.forEach(d => { lane = Math.min(lane, seg(P[d], P[fr.holder], me)); }); }
    const guards = fr.D.filter(d => sim.match[d] === i).map(d => sim.players[d].id);
    out.off = {
      space: fr.D.length ? space : null, nearest: near >= 0 ? sim.players[near].id : null,
      open: fr.D.length ? (space >= open ? 'open' : space >= open / 2 ? 'tight' : 'covered') : null, ratio: fr.D.length ? space / open : null,
      lane, laneOk: lane == null ? null : lane >= open, guards, toBall: fr.holder >= 0 && fr.holder !== i ? dist(me, P[fr.holder]) : null
    };
  }
  // football: the QB's progression, and where this receiver sits in it
  if (F.fb && p.side === 'O') {
    const order = fr.order || orderFor(sim, F, 'full', 1), n = Math.floor((t - F.t0) / READ_STEP), m = order.indexOf(i), live = t >= F.t0 && n < order.length;
    if (p.role === 'QB') out.fb = { qb: true, order: order.map(o => sim.players[o].id), now: live ? n : -1, reading: live ? sim.players[order[n]].id : null, startsIn: t < F.t0 ? (F.t0 - t) * secs : 0 };
    else if (m >= 0) out.fb = { read: m + 1, of: order.length, now: live && n === m, past: live && n > m, sep: out.off.space, open: out.off.space == null ? null : fbOpenness(out.off.space) };
  }
  return out;
}

// every player at once (the table, the chips): one frame, n telemetries
export function telemetryAll(sim, sport, t, F, opts) {
  F = F || facts(sim, sport);
  const fr = frame(sim, sport, t);
  if (F.fb) fr.order = orderFor(sim, F, opts && opts.mode, opts && opts.side);
  return sim.players.map((_, i) => telemetry(sim, sport, t, i, F, fr));
}

// one short line for what a player is doing: the chip's headline
export function doing(T, nameOf) {
  const nm = nameOf || (id => id);
  if (T.ball && T.ball.state !== 'released' && T.ball.state !== 'holding') return T.ball.text;
  const a = T.action && !T.action.incoming ? T.action : null;
  if (a) {
    if (a.type === 'pass' || a.type === 'handoff') return a.kind + ' → ' + nm(a.target);
    if (a.type === 'shot') return a.kind + '!';
    const pct = T.route ? ' ' + Math.round(T.route.done * 100) + '%' : '';
    return (a.tree || a.kind) + (a.target ? ' for ' + nm(a.target) : '') + pct;
  }
  if (T.auto) return T.auto;
  if (T.ball && T.ball.state === 'holding') return T.ball.text;
  if (T.def) {
    const d = T.def;
    if (d.beaten) return 'beaten · trailing ' + (d.man ? nm(d.man) : '');
    if (d.screenedBy) return 'screened by ' + nm(d.screenedBy);
    if (d.help) return 'helping on the drive';
    if (d.job && d.job.type === 'zone') return 'zone · ' + d.zone;
    if (d.job && d.job.type === 'rush') return 'rushing';
    if (d.man) return (d.manHasBall ? 'on the ball · ' : 'guarding ') + nm(d.man);
    return 'reading';
  }
  if (T.action && T.action.incoming) return T.action.kind + ' from ' + nm(T.action.from);
  if (T.beat == null) return 'set';
  return T.speed > 0.4 ? 'moving' : 'spacing';
}
