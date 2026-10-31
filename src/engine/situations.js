// Situations: game moments made up on the spot for the IQ game, so the bank never runs dry. A formation
// (5-out, 4-out 1-in, horns, 1-4 high, box), an action (drive and kick, ball screen, pass and cut, handoff,
// skip, post entry), then the decision: the engine plays the action against its own defense and the pass goes
// to whoever it says is open. Only clear reads are kept (the best pass well ahead of the next), so every
// answer is the engine's, never a guess. Seeded: the same seed gives the same situations everywhere.
// Pure: no DOM. Basketball for now (sports without `situations: true` get none).

import { normalize, compile } from './sim.js';
import { bestReads } from './reads.js';
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

// a bank of them, cached per sport and size
const banks = new Map();
export function situations(sport, n = 160, seed = 9001) {
  if (!sport.situations) return [];
  const id = sport.id + ':' + n + ':' + seed;
  if (banks.has(id)) return banks.get(id);
  const out = [];
  for (let i = 0; out.length < n && i < n * 6; i++) { let s = null; try { s = situation(sport, seed + i * 101); } catch (e) { s = null; } if (s) out.push(s); }
  banks.set(id, out);
  return out;
}
