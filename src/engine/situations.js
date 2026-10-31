// Situations: game moments made up on the spot for the IQ game, so the bank never runs dry. A formation
// (5-out, 4-out 1-in, horns, 1-4 high, box), an action (drive and kick, ball screen, pass and cut, handoff,
// skip, post entry), then the decision: the engine plays the action against its own defense and the pass goes
// to whoever it says is open. Only clear reads are kept (the best pass well ahead of the next), so every
// answer is the engine's, never a guess. Seeded: the same seed gives the same situations everywhere.
// Football: a real alignment from the playbook, a route for every receiver, a coverage, and the QB's own
// progression read (football.js findOpen) picks who gets it. Soccer (and any other sport): a real play cut at a
// moment, players nudged, and the engine's best pass from there. Pure: no DOM. Sports opt in with `situations: true`.

import { normalize, compile } from './sim.js';
import { bestReads } from './reads.js';
import { ROUTE_TREE, applyRoute, applyCoverage, coverages, findOpen, throwTo } from './football.js';
const rng = seed => { let s = (seed >>> 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

const FORMS = {
  '5-out': { top: [0, 27], lw: [-19, 19], rw: [19, 19], lc: [-21.5, 3], rc: [21.5, 3], big: ['lc', 'rc'] },
  '4-out 1-in': { top: [0, 27], lw: [-19, 19], rw: [19, 19], rc: [21.5, 3], lb: [-6, 7], big: ['lb', 'rc'] },
  horns: { top: [0, 27], le: [-8, 19], re: [8, 19], lc: [-21.5, 3], rc: [21.5, 3], big: ['le', 're'] },
  '1-4 high': { top: [0, 27], lw: [-19, 19], rw: [19, 19], le: [-8, 19], re: [8, 19], big: ['le', 're'] },
  box: { top: [0, 27], le: [-8, 19], re: [8, 19], lb: [-6, 7], rb: [6, 7], big: ['lb', 'rb'] }
};
const WHERE = { top: 'up top', lw: 'on the left wing', rw: 'on the right wing', lc: 'in the left corner', rc: 'in the right corner', lb: 'on the left block', rb: 'on the right block', le: 'at the left elbow', re: 'at the right elbow' };
const ACTIONS = ['drive', 'screen', 'cut', 'handoff', 'skip', 'post'];
const NAME = { drive: 'Drive and kick', screen: 'Ball screen read', cut: 'Pass and cut', handoff: 'Handoff read', skip: 'Swing and skip', post: 'Post entry' };

// one situation from a seed, or null when the read isn't clear enough to ask about
export function situation(sport, seed) {
  const r = rng(seed), pick = a => a[Math.floor(r() * a.length)];
  const formName = pick(Object.keys(FORMS)), F = FORMS[formName], spots = Object.keys(F).filter(k => k !== 'big');
  const jit = p => [Math.round((p[0] + (r() - 0.5) * 3) * 10) / 10, Math.round((p[1] + (r() - 0.5) * 3) * 10) / 10];
  // O1 up top; the bigs (O4, O5) on the formation's inside spots; the rest anywhere left
  const order = ['top'].concat(F.big), rest = spots.filter(s => order.indexOf(s) < 0);
  const at = { O1: 'top', O4: F.big[0], O5: F.big[1] };
  ['O2', 'O3'].forEach((id, i) => { at[id] = rest[i]; });
  const P = {}; Object.keys(at).forEach(id => { P[id] = jit(F[at[id]]); });
  const players = Object.keys(at).sort().map(id => ({ id, side: 'O', role: { O1: 'point', O2: 'guard', O3: 'wing', O4: 'big', O5: 'big' }[id], at: { x: P[id][0], y: P[id][1] } }));
  const side = id => Math.sign(P[id][0] || (r() < 0.5 ? -1 : 1));
  const wings = ['O2', 'O3'], near = id => wings.slice().sort((a, b) => Math.hypot(P[a][0] - P[id][0], P[a][1] - P[id][1]) - Math.hypot(P[b][0] - P[id][0], P[b][1] - P[id][1]))[0];
  const kind = pick(ACTIONS), beats = [];
  let holder = 'O1';
  const lane = s => ({ x: s * (3 + r() * 3), y: 9 + r() * 4 });
  if (kind === 'drive') {
    const s = r() < 0.5 ? -1 : 1;
    beats.push({ say: `O1 attacks the ${s < 0 ? 'left' : 'right'} side of the lane.`, actions: [{ kind: 'dribble', who: 'O1', to: lane(s) }] });
  } else if (kind === 'screen') {
    const big = pick(['O4', 'O5']), s = side(big), roll = r() < 0.6;
    beats.push({ say: `O${big[1]} sets the ball screen for O1.`, actions: [{ kind: 'screen', who: big, to: { x: s * 3, y: 25 }, target: 'O1' }] });
    beats.push({ say: `O1 comes off it downhill; O${big[1]} ${roll ? 'rolls to the rim' : 'pops'}.`, actions: [{ kind: 'dribble', who: 'O1', to: { x: s * 7, y: 15 } }, roll ? { kind: 'roll', who: big, to: { x: s * 2, y: 8 } } : { kind: 'pop', who: big, to: { x: -s * 4, y: 24 } }] });
  } else if (kind === 'cut') {
    const w = pick(wings);
    beats.push({ say: `O1 passes to O${w[1]} ${WHERE[at[w]]}.`, actions: [{ kind: 'pass', who: 'O1', target: w }] });
    beats.push({ say: 'O1 cuts hard to the rim.', actions: [{ kind: 'cut', who: 'O1', to: { x: side(w) * 2, y: 7 }, via: { x: -side(w) * 2, y: 20 } }] });
    holder = w;
  } else if (kind === 'handoff') {
    const w = near('O1');
    beats.push({ say: `O1 dribbles at O${w[1]}.`, actions: [{ kind: 'dribble', who: 'O1', to: { x: P[w][0] * 0.55, y: (P[w][1] + 27) / 2 } }] });
    beats.push({ say: `O1 hands it off to O${w[1]}, who turns the corner.`, actions: [{ kind: 'handoff', who: 'O1', target: w }, { kind: 'dribble', who: w, to: { x: side(w) * 6, y: 13 } }] });
    holder = w;
  } else if (kind === 'skip') {
    const w = pick(wings), s = side(w);
    beats.push({ say: `O1 swings it to O${w[1]}.`, actions: [{ kind: 'pass', who: 'O1', target: w }] });
    beats.push({ say: `O${w[1]} rips and drives baseline.`, actions: [{ kind: 'dribble', who: w, to: { x: s * 11, y: 5 } }] });
    holder = w;
  } else {
    const big = F.big.map(b => Object.keys(at).find(id => at[id] === b)).find(id => /lb|rb|le|re/.test(at[id])) || 'O5', w = near(big);
    beats.push({ say: `O1 to O${w[1]}; O${big[1]} seals.`, actions: [{ kind: 'pass', who: 'O1', target: w }, { kind: 'move', who: big, to: { x: side(w) * 6, y: 8 } }] });
    beats.push({ say: `Into the post: O${big[1]} has it with a defender on the back.`, actions: [{ kind: 'pass', who: w, target: big }, { kind: 'cut', who: 'O1', to: { x: -side(w) * 15, y: 20 } }] });
    holder = big;
  }
  const raw = { key: 'sit-' + seed, situation: true, title: NAME[kind], concept: 'Situation · ' + formName, summary: '', players, ball: 'O1', beats };
  // the decision: play it out, then ask the engine who's open at the end of the action
  const n = normalize(Object.assign({}, raw, { beats: beats.concat([{ say: '', actions: [{ kind: 'ready', who: holder }] }]) }), sport);
  if (!n.ok) return null;
  const sim = compile(n.play, sport, { defense: true }), t = beats.length - 0.06, h = sim.idx[holder];
  if (sim.holderAt(t) !== h) return null;
  const all = bestReads(sim, sport, t, h), best = all[0];
  if (!best || best.kind !== 'pass') return null;
  const second = all[1], to = sim.players[best.to].id, space = sim.space(t, best.to);
  if ((second && best.score - second.score < 0.3) || space < sport.open * 1.3) return null;
  const toName = 'O' + to[1];
  beats.push({ say: `O${holder[1]} finds ${toName}: ${space >= 50 ? 'nobody near' : Math.round(space) + ' feet of space'}.`, actions: [{ kind: 'pass', who: holder, target: to }] });
  beats.push({ say: `${toName} shoots.`, actions: [{ kind: 'shot', who: to }] });
  raw.reads = [{ who: to, text: 'Open: ' + (space >= 50 ? 'nobody near' : Math.round(space) + ' ft of space') }];
  return raw;
}

// flag football: routes against a coverage; the ball goes to the first open receiver in the QB's progression
const FB_ROUTES = ['hitch', 'flat', 'slant', 'out', 'dig', 'corner', 'post', 'go', 'drag', 'curl', 'seam', 'wheel', 'comeback'];
export function fieldSituation(sport, seed) {
  const r = rng(seed), pick = a => a[Math.floor(r() * a.length)];
  const base = pick(sport.plays.filter(p => !p.lesson)), n0 = normalize(base, sport); if (!n0.ok) return null;
  const P = n0.play, los = P.los != null ? P.los : sport.los;
  if (!P.players.some(p => p.id === 'O2') || !P.players.some(p => p.id === 'O1')) return null;
  let raw = { key: 'sit-' + seed, situation: true, title: '', concept: '', summary: '', los, ball: 'O2',
    players: P.players.filter(p => p.side === 'O').map(p => ({ id: p.id, side: 'O', role: p.role, at: { x: +(p.x + (r() - 0.5) * 2).toFixed(1), y: p.y } })), beats: [] };
  const used = {};
  for (const p of raw.players) {
    if (p.id === 'O1' || (p.id === 'O2' && r() < 0.6)) continue;
    const side = Math.sign(p.at.x || 1); let name = pick(FB_ROUTES), n = 0;
    while (used[side + name] && n++ < 6) name = pick(FB_ROUTES);
    used[side + name] = 1;
    raw = applyRoute(raw, sport, p.id, name, [p.at.x, p.at.y]);
  }
  const C = coverages(sport), cov = pick(Object.keys(C));
  raw = applyCoverage(raw, sport, cov);
  const n = normalize(raw, sport); if (!n.ok) return null;
  const sim = compile(n.play, sport, { defense: true }), got = findOpen(sim, 'full', r() < 0.5 ? -1 : 1);
  if (!got || got.s < 3) return null;
  raw = throwTo(raw, sim, got, sport);
  raw.title = 'Beat ' + C[cov].name; raw.concept = 'Situation · ' + C[cov].name;
  return raw;
}
// soccer and the rest: a real play up to a moment (players nudged), then the engine's best pass and a finish
export function branchSituation(sport, seed) {
  const r = rng(seed), pool = sport.plays.filter(p => p.lesson !== 'defense'), base = pool[Math.floor(r() * pool.length)];
  const n0 = normalize(base, sport); if (!n0.ok || n0.play.beats.length < 2) return null;
  const k = 1 + Math.floor(r() * (n0.play.beats.length - 1));
  const players = n0.play.players.filter(p => p.side === 'O' || r() < 0.5).map(p => Object.assign({}, p, { x: +(p.x + (r() - 0.5) * 3).toFixed(1), y: +(p.y + (r() - 0.5) * 3).toFixed(1) }));
  const ids = new Set(players.map(p => p.id));
  const beats = n0.play.beats.slice(0, k).map(b => Object.assign({}, b, { actions: b.actions.filter(a => ids.has(a.who) && (!a.target || ids.has(a.target))) }));
  if (beats.some(b => !b.actions.length)) return null;
  const raw = { key: 'sit-' + seed, situation: true, title: base.title + ', live', concept: 'Situation · ' + (base.concept || sport.short), summary: '', players, ball: n0.play.ball, beats };
  const n = normalize(Object.assign({}, raw, { beats: beats.concat([{ say: '', actions: [] }]) }), sport); if (!n.ok) return null;
  const sim = compile(n.play, sport, { defense: true }), t = k - 0.06, h = sim.holderAt(t); if (h < 0) return null;
  const keeper = i => /^GK$/i.test(sim.players[i].role || '') || (sport.pitch && sim.players[i].id === 'O1');
  const all = bestReads(sim, sport, t, h).filter(x => !(x.kind === 'pass' && keeper(x.to))), best = all[0];
  if (!best || best.kind !== 'pass') return null;
  const second = all[1], space = sim.space(t, best.to), to = sim.players[best.to].id, from = sim.players[h].id;
  if ((second && best.score - second.score < 0.3) || space < sport.open * 1.3) return null;
  const pass = Object.keys(sport.kinds).find(x => x === 'pass') || 'pass', fin = sport.kinds.shot ? 'shot' : null;
  raw.beats = beats.concat([{ say: `${from} finds ${to}: ${Math.round(space)} ${sport.unit} of space.`, actions: [{ kind: pass, who: from, target: to }] }]);
  // a finish only from shooting range; otherwise the pass is the read
  const g = sport.field.goal, at = sim.posAt(t)[best.to];
  if (fin && Math.hypot(at[0] - g[0], at[1] - g[1]) <= (sport.pitch ? 22 : 24)) raw.beats.push({ say: `${to} shoots.`, actions: [{ kind: fin, who: to }] });
  raw.reads = [{ who: to, text: 'Open: ' + Math.round(space) + ' ' + sport.unit + ' of space' }];
  return raw;
}

// a bank of them, cached per sport and size
const banks = new Map();
export function situations(sport, n = 160, seed = 9001) {
  if (!sport.situations) return [];
  const id = sport.id + ':' + n + ':' + seed;
  if (banks.has(id)) return banks.get(id);
  const out = [];
  const make = sport.kinds.route ? fieldSituation : sport.id === 'basketball' ? situation : branchSituation;
  for (let i = 0; out.length < n && i < n * 6; i++) { let s = null; try { s = make(sport, seed + i * 101); } catch (e) { s = null; } if (s) out.push(s); }
  banks.set(id, out);
  return out;
}
