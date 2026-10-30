// Football tools: the route tree, coverages, and the quarterback's reads.
// Field coordinates are the flag packs' (yards, attacking toward y 0, offense at y > los).

import { clamp } from './geom.js';

// the classic route tree (0–9; odd numbers break outside, even inside) plus the routes every
// youth playbook adds. Each is a stem and its breaks, mirrored by the side the receiver is on.
export const ROUTE_TREE = [
  { name: 'hitch', n: 0, legs: [[0, 6], [0, 5]], say: 'a hitch' },
  { name: 'flat', n: 1, legs: [[0, 2], [7, 3]], say: 'to the flat' },
  { name: 'slant', n: 2, legs: [[0, 2], [-6, 7]], say: 'a slant' },
  { name: 'comeback', n: 3, legs: [[0, 12], [3, 9]], say: 'a comeback' },
  { name: 'curl', n: 4, legs: [[0, 10], [-2, 8]], say: 'a curl' },
  { name: 'out', n: 5, legs: [[0, 6], [9, 6]], say: 'an out' },
  { name: 'dig', n: 6, legs: [[0, 8], [-10, 8]], say: 'a dig', also: ['in', 'in route'] },
  { name: 'corner', n: 7, legs: [[0, 8], [8, 16]], say: 'a corner' },
  { name: 'post', n: 8, legs: [[0, 8], [-7, 17]], say: 'a post' },
  { name: 'go', n: 9, legs: [[0, 20]], say: 'a go route', also: ['fly', 'streak', 'fade', 'vertical'] },
  { name: 'drag', legs: [[0, 2], [-15, 3]], say: 'a drag', also: ['shallow', 'shallow cross'] },
  { name: 'seam', legs: [[0, 18]], say: 'a seam' },
  { name: 'wheel', legs: [[5, 1], [7, 16]], say: 'a wheel' }
];
export const routeNamed = name => {
  const n = String(name || '').toLowerCase().trim();
  return ROUTE_TREE.find(r => r.name === n || (r.also || []).indexOf(n) >= 0 || String(r.n) === n) || null;
};

// a route for one receiver: [dx outward, dy downfield] legs → waypoints in field yards
export function routeFor(tree, start, sport, los) {
  const [x0, y0] = start, h = sport.field.x[1], out = x0 >= 0 ? 1 : -1, base = Math.min(y0, los + 1.5);
  const pts = tree.legs.map(([dx, dy]) => [clamp(x0 + out * dx, -h + 1, h - 1), clamp(base - dy, 1, sport.field.y[1] - 1)]);
  const to = pts.pop();
  return { path: pts.map(p => ({ x: +p[0].toFixed(1), y: +p[1].toFixed(1) })), to: { x: +to[0].toFixed(1), y: +to[1].toFixed(1) } };
}

// ---- coverages: alignments with jobs (man on a receiver, a zone to defend, or rush) ----
// zones are [x0, y0, x1, y1] in fractions: x of the half-width (−1 … 1), y yards off the line (+ is deeper)
const Z = (x0, d0, x1, d1, label) => ({ x0, d0, x1, d1, label });
const COV5 = {
  man: { name: 'Man', jobs: [['R', 'rush'], ['LB', 'man', 'O2'], ['CB', 'man', 'O3'], ['CB', 'man', 'O4'], ['S', 'man', 'O5']] },
  cover1: { name: 'Cover 1', jobs: [['R', 'rush'], ['S', 'zone', Z(-0.55, 9, 0.55, 30, 'Deep middle')], ['CB', 'man', 'O3'], ['CB', 'man', 'O4'], ['LB', 'man', 'O5']] },
  cover2: { name: 'Cover 2', jobs: [['R', 'rush'], ['S', 'zone', Z(-1, 8, 0, 30, 'Deep half')], ['S', 'zone', Z(0, 8, 1, 30, 'Deep half')], ['CB', 'zone', Z(-1, 0, 0, 8, 'Under')], ['CB', 'zone', Z(0, 0, 1, 8, 'Under')]] },
  cover3: { name: 'Cover 3', jobs: [['R', 'rush'], ['CB', 'zone', Z(-1, 7, -0.33, 30, 'Deep third')], ['S', 'zone', Z(-0.33, 7, 0.33, 30, 'Deep third')], ['CB', 'zone', Z(0.33, 7, 1, 30, 'Deep third')], ['LB', 'zone', Z(-0.6, 0, 0.6, 7, 'Hook')]] }
};
const COV7 = {
  man: { name: 'Cover 1', jobs: [['S', 'zone', Z(-0.5, 10, 0.5, 35, 'Deep middle')], ['LB', 'zone', Z(-0.4, 0, 0.4, 9, 'Robber')], ['CB', 'man', 'O3'], ['CB', 'man', 'O4'], ['N', 'man', 'O5'], ['LB', 'man', 'O6'], ['LB', 'man', 'O7']] },
  cover2: { name: 'Cover 2', jobs: [['S', 'zone', Z(-1, 10, 0, 35, 'Deep half')], ['S', 'zone', Z(0, 10, 1, 35, 'Deep half')], ['CB', 'zone', Z(-1, 0, -0.55, 10, 'Flat')], ['LB', 'zone', Z(-0.55, 0, 0, 10, 'Hook')],
    ['CB', 'zone', Z(0.55, 0, 1, 10, 'Flat')], ['LB', 'zone', Z(0, 0, 0.55, 10, 'Hook')], ['LB', 'man', 'O7']] },
  cover3: { name: 'Cover 3', jobs: [['CB', 'zone', Z(-1, 9, -0.33, 35, 'Deep third')], ['S', 'zone', Z(-0.33, 9, 0.33, 35, 'Deep third')], ['CB', 'zone', Z(0.33, 9, 1, 35, 'Deep third')],
    ['N', 'zone', Z(-1, 0, -0.5, 9, 'Flat')], ['LB', 'zone', Z(-0.5, 0, 0, 9, 'Hook')], ['LB', 'zone', Z(0, 0, 0.5, 9, 'Hook')], ['N', 'zone', Z(0.5, 0, 1, 9, 'Flat')]] },
  cover4: { name: 'Cover 4', jobs: [['CB', 'zone', Z(-1, 9, -0.5, 35, 'Deep quarter')], ['S', 'zone', Z(-0.5, 9, 0, 35, 'Deep quarter')], ['S', 'zone', Z(0, 9, 0.5, 35, 'Deep quarter')], ['CB', 'zone', Z(0.5, 9, 1, 35, 'Deep quarter')],
    ['N', 'zone', Z(-1, 0, -0.35, 9, 'Flat')], ['LB', 'zone', Z(-0.35, 0, 0.35, 9, 'Hook')], ['N', 'zone', Z(0.35, 0, 1, 9, 'Flat')]] }
};
export const coverages = sport => (sport.roster.perSide >= 7 ? COV7 : COV5);
export const coverageNamed = (sport, said) => {
  const s = String(said || '').toLowerCase().replace(/\s+/g, '');
  const C = coverages(sport);
  if (/cover(0|zero)|^man|manto/.test(s)) return 'man';
  if (/cover(1|one)/.test(s)) return C.cover1 ? 'cover1' : 'man';
  if (/cover(2|two|to|too)|tampa/.test(s)) return 'cover2';
  if (/cover(3|three|tree)/.test(s)) return 'cover3';
  if (/cover(4|four|for)|quarters/.test(s)) return C.cover4 ? 'cover4' : 'cover3';
  return null;
};

// a zone in field yards, from its fractions and the line of scrimmage
export function zoneRect(z, sport, los) {
  const h = sport.field.x[1];
  return [z.x0 * h, Math.max(1, los - z.d1), z.x1 * h, los - z.d0];
}

// replace the defense with a coverage: X1… get jobs, align, and play it on their own
export function applyCoverage(raw, sport, key) {
  const C = coverages(sport)[key]; if (!C) return raw;
  const los = raw.los != null ? raw.los : sport.los, out = JSON.parse(JSON.stringify(raw));
  const offense = (out.players || []).filter(p => String(p.id).toUpperCase()[0] === 'O');
  const where = id => { const p = offense.find(q => String(q.id).toUpperCase() === id); if (!p) return null; const s = typeof p.at === 'string' ? sport.spots[p.at] : p.at && [p.at.x, p.at.y]; return s; };
  out.players = offense.concat(C.jobs.map(([role, job, arg], i) => {
    const id = 'X' + (i + 1); let at;
    if (job === 'rush') at = { x: 0, y: los - 7 };
    else if (job === 'man') { const w = where(arg) || [0, los + 1]; at = { x: w[0], y: los - 5 }; }
    else { const r = zoneRect(arg, sport, los); at = { x: (r[0] + r[2]) / 2, y: arg.d0 >= 7 ? los - Math.min(arg.d0 + 5, 14) : los - 5 }; }
    const cover = job === 'man' ? { type: 'man', on: arg } : job === 'zone' ? { type: 'zone', zone: arg } : { type: 'rush' };
    return { id, side: 'D', role, at: { x: +at.x.toFixed(1), y: +at.y.toFixed(1) }, cover };
  }));
  // explicit defensive moves belonged to the old defense
  out.beats = (out.beats || []).map(b => Object.assign({}, b, { actions: (b.actions || []).filter(a => String(a.who).toUpperCase()[0] !== 'X') }));
  out.coverage = key;
  return out;
}

// set (or replace) one receiver's route in the play's route beat (the beat after the snap)
export function applyRoute(raw, sport, id, treeName, startXY) {
  const tree = routeNamed(treeName); if (!tree) return raw;
  const out = JSON.parse(JSON.stringify(raw)), los = out.los != null ? out.los : sport.los;
  out.beats = out.beats || [];
  if (!out.beats.length || !out.beats[0].actions.some(a => a.kind === 'snap')) {
    if (out.ball === 'O2' || !out.ball) { out.ball = 'O2'; out.beats.unshift({ say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] }); }
  }
  let rb = out.beats[1];
  if (!rb) { rb = { say: '', actions: [] }; out.beats.splice(1, 0, rb); }
  rb.actions = rb.actions.filter(a => a.who !== id);
  const r = routeFor(tree, startXY, sport, los);
  rb.actions.push({ kind: 'route', who: id, path: r.path, to: r.to, tree: tree.name });
  rb.say = rb.actions.filter(a => a.kind === 'route').map(a => `${a.who} runs ${a.tree ? routeNamed(a.tree).say : 'a route'}`).join(', ') + '.';
  return out;
}

// ---- the quarterback's eyes ----
// receivers in the order the QB reads them: half field = one side, short-to-deep high–low;
// full field = sweep from the most open-looking side across
export function progression(sim, mode, side) {
  const t0 = readStart(sim), P = sim.posAt(t0 + 1);
  const runs = i => sim.routes.some(r => r.p === i && r.kind === 'route');
  const rs = sim.players.map((p, i) => ({ p, i })).filter(({ p, i }) => p.side === 'O' && p.role !== 'QB' && p.id !== 'O1' && (p.role !== 'C' || runs(i)));
  const ofSide = rs.filter(({ i }) => mode === 'full' || Math.sign(P[i][0] || 0.01) === side);
  if (mode === 'full') return ofSide.sort((a, b) => side * (b.p.x - a.p.x)).map(r => r.i);   // sweep from the call side across
  return ofSide.sort((a, b) => P[b.i][1] - P[a.i][1]).map(r => r.i);   // high–low on one side: deepest last
}
export function readStart(sim) {
  // the reads start once the routes are out: the beat after the snap, halfway through
  const k = sim.play.beats.findIndex(b => b.actions.some(a => a.kind === 'snap'));
  return (k >= 0 ? k + 1 : 0) + 0.45;
}
export const READ_STEP = 0.5;   // beats per read
export function separation(sim, t, i) {
  const P = sim.posAt(t); let best = 99;
  sim.players.forEach((p, j) => { if (p.side === 'D') best = Math.min(best, Math.hypot(P[j][0] - P[i][0], P[j][1] - P[i][1])); });
  return best;
}
export const openness = sep => (sep >= 3 ? 'open' : sep >= 1.5 ? 'tight' : 'covered');

// run the reads against the coverage: the first open receiver gets the ball
export function findOpen(sim, mode, side) {
  const order = progression(sim, mode, side), t0 = readStart(sim);
  let pick = null;
  order.forEach((i, n) => { if (pick) return; const t = t0 + n * READ_STEP, s = separation(sim, t, i); if (s >= 3) pick = { i, n, t, s }; });
  if (!pick && order.length) { let bs = -1; order.forEach((i, n) => { const t = t0 + n * READ_STEP, s = separation(sim, t, i); if (s > bs) { bs = s; pick = { i, n, t, s }; } }); }
  return pick ? Object.assign(pick, { id: sim.players[pick.i].id, order }) : null;
}
export function throwTo(raw, sim, pick, sport) {
  const out = JSON.parse(JSON.stringify(raw)), P = sim.posAt(pick.t + 0.5), p = P[pick.i];
  out.beats = (out.beats || []).filter(b => !b.actions.some(a => a.kind === 'throw' || a.kind === 'run'));
  const n = pick.n + 1, id = pick.id;
  out.beats.push({ say: `Read ${n}: ${id} is open. O1 throws it.`, actions: [{ kind: 'throw', who: 'O1', target: id }] });
  out.beats.push({ say: `${id} runs for the end zone.`, actions: [{ kind: 'run', who: id, to: { x: +clamp(p[0] * 0.8, sport.field.x[0] + 1, sport.field.x[1] - 1).toFixed(1), y: 5 } }] });
  out.reads = [{ who: id, text: `Read ${n}: ${pick.s >= 3 ? 'open' : 'best look'} (${pick.s.toFixed(1)} yd of space)` }];
  return out;
}
