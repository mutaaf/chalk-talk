// CourtIQ / FieldIQ: quiz questions cut from the library plays themselves (so the answer is always
// the engine's right read), an Elo-style rating per player, levels, and the pro whose game the
// profile reads like. Pure: no DOM, no storage.

import { normalize, compile } from './sim.js';
import { coverages, applyCoverage } from './football.js';

// how the game adapts to age: playback speed, the clock, how many choices, how forgiving a tap is
export const AGES = [
  { id: '6-8', label: '6–8', band: 'young', speed: 0.6, time: 15, choices: 3, tol: 1.6, mix: { pass: 0.65, spot: 0.35 } },
  { id: '9-11', label: '9–11', band: 'young', speed: 0.8, time: 11, choices: 3, tol: 1.3, mix: { pass: 0.5, spot: 0.3, name: 0.2 } },
  { id: '12-14', label: '12–14', band: 'mid', speed: 1, time: 8, choices: 4, tol: 1.1, mix: { pass: 0.4, spot: 0.25, name: 0.15, coverage: 0.2 } },
  { id: '15+', label: '15+', band: 'older', speed: 1.2, time: 6, choices: 4, tol: 1, mix: { pass: 0.35, spot: 0.2, name: 0.2, coverage: 0.25 } }
];
export const ageOf = id => AGES.find(a => a.id === id) || AGES[1];
export const DIMS = ['vision', 'spacing', 'recognition', 'speed'];
const TYPE_DIM = { pass: 'vision', spot: 'spacing', name: 'recognition', coverage: 'recognition' };
export const START = 84;   // everyone starts a Rookie; the first level-up comes quickly

// a play's difficulty on the IQ scale: more beats, more passes, screens and handoffs read harder
export function difficulty(raw, sport) {
  const beats = raw.beats || [];
  let passes = 0, tricky = 0;
  beats.forEach(b => (b.actions || []).forEach(a => {
    const K = sport.kinds[a.kind]; if (!K) return;
    if (K.type === 'pass' && a.kind !== 'snap') passes++;
    if (a.kind === 'screen' || K.type === 'handoff' || a.kind === 'motion') tricky++;
  }));
  return Math.round(Math.max(70, Math.min(140, 66 + beats.length * 5 + passes * 4 + tricky * 5 + (raw.players || []).length)));
}

// a small seeded random, so a session can be replayed in tests
export function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const pick = (r, a) => a[Math.floor(r() * a.length)];
const shuffle = (r, a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// every question one play can ask
export function candidates(raw, sport) {
  const n = normalize(raw, sport); if (!n.ok) return [];
  const sim = compile(n.play, sport, { defense: true }), out = [], D = difficulty(raw, sport), U = sport.mark;
  sim.play.beats.forEach((b, k) => b.actions.forEach(a => {
    const K = sport.kinds[a.kind];
    if (K.type === 'pass' && a.kind !== 'snap' && sim.play.lesson !== 'defense') {
      const also = sim.players.map((p, i) => i).filter(i => {
        const p = sim.players[i];
        return p.side === 'O' && p.id !== a.who && p.id !== a.target && p.role !== 'C' && sim.space(k + 0.94, i) >= sport.open * 1.6;
      }).map(i => sim.players[i].id);
      out.push({ type: 'pass', key: raw.key, beat: k, at: k + 0.46, who: a.who, answer: a.target, also, d: D });
    }
    if (K.type === 'move' && sim.players[sim.idx[a.who]].side === 'O' && k > 0) {
      const i = sim.idx[a.who], s = sim.posAt(k)[i], e = sim.posAt(k + 0.999)[i];
      if (Math.hypot(e[0] - s[0], e[1] - s[1]) >= 6 * U) out.push({ type: 'spot', key: raw.key, beat: k, at: k + 0.02, who: a.who, answer: [e[0], e[1]], tol: 3.2 * U, d: D - 4 });
    }
  }));
  out.push({ type: 'name', key: raw.key, at: sim.play.beats.length, d: D + 6 });
  if (sport.kinds.route && sport.los != null && !sim.play.lesson) out.push({ type: 'coverage', key: raw.key, at: sim.play.beats.length - 0.6, d: D + 10 });
  return out;
}

// a set of questions pitched at this player: plays near their rating, the mix for their age
export function quiz(sport, opts) {
  const o = Object.assign({ n: 6, iq: START, age: '9-11', seed: Date.now() }, opts), r = rng(o.seed), A = ageOf(o.age);
  const all = sport.plays.flatMap(p => candidates(p, sport));
  const types = Object.keys(A.mix).filter(t => all.some(q => q.type === t));
  const titles = sport.plays.map(p => p.title), C = sport.kinds.route ? coverages(sport) : null;
  const out = [], used = {};
  for (let i = 0; i < o.n; i++) {
    let x = r(), type = types[0];
    for (const t of types) { x -= A.mix[t] / types.reduce((s, u) => s + A.mix[u], 0); if (x <= 0) { type = t; break; } }
    let pool = all.filter(q => q.type === type && !used[q.key + q.type + q.beat]);
    const near = pool.filter(q => Math.abs(q.d - o.iq) <= 18 + i * 3);
    pool = near.length ? near : pool;
    if (!pool.length) continue;
    const q = Object.assign({}, pick(r, pool));
    used[q.key + q.type + q.beat] = 1;
    if (type === 'name') {
      const right = sport.plays.find(p => p.key === q.key).title;
      q.choices = shuffle(r, [right].concat(shuffle(r, titles.filter(t => t !== right)).slice(0, A.choices - 1)));
      q.answer = right;
    }
    if (type === 'coverage') {
      const keys = Object.keys(C).filter((k, j, a) => a.findIndex(z => C[z].name === C[k].name) === j);
      q.cover = pick(r, keys); q.answer = C[q.cover].name;
      q.choices = shuffle(r, [q.answer].concat(shuffle(r, keys.map(k => C[k].name).filter(nm => nm !== q.answer)).slice(0, A.choices - 1)));
    }
    out.push(q);
  }
  return out;
}

// the play a question runs on (coverage questions line the defense up first)
export function playFor(q, sport) {
  const raw = sport.plays.find(p => p.key === q.key);
  return q.type === 'coverage' ? applyCoverage(raw, sport, q.cover) : raw;
}

// how good an answer was: 1 right and quick, less when slow, half for another open player
export function grade(q, given, ms, age) {
  const A = ageOf(age), slow = Math.max(0, Math.min(1, ms / 1000 / A.time));
  let right = false, partial = false;
  if (q.type === 'pass') { right = given === q.answer; partial = !right && q.also.indexOf(given) >= 0; }
  else if (q.type === 'spot') right = !!given && Math.hypot(given[0] - q.answer[0], given[1] - q.answer[1]) <= q.tol * A.tol;
  else right = given === q.answer;
  const score = right ? 1 - 0.3 * slow : partial ? 0.5 : 0;
  return { right, partial, score, quick: right && slow < 0.35, slow };
}

// Elo against the play's difficulty; young players gain faster so the first sessions feel good
export function rate(rating, q, g, age) {
  const k = ageOf(age).band === 'young' ? 10 : 8;
  const E = 1 / (1 + Math.pow(10, (q.d - rating) / 40));
  return Math.round((rating + k * (g.score - E)) * 10) / 10;
}

export function blank() { return { iq: START, dims: { vision: START, spacing: START, recognition: START, speed: 50 }, n: 0, right: 0, best: 0, streak: 0, history: [] }; }

// fold one answer into a profile (returns a new one)
export function record(prof, q, g, age) {
  const p = JSON.parse(JSON.stringify(prof || blank())), dim = TYPE_DIM[q.type];
  p.iq = rate(p.iq, q, g, age);
  p.dims[dim] = rate(p.dims[dim], q, g, age);
  if (g.right) p.dims.speed = Math.round((p.dims.speed * 0.8 + (1 - g.slow) * 100 * 0.2) * 10) / 10;
  p.n++; if (g.right) { p.right++; p.streak++; p.best = Math.max(p.best, p.streak); } else p.streak = 0;
  return p;
}

// the ladder: Rookie under 88, then every 10 points
export function level(iq, sport) {
  const L = sport.iq.levels, i = Math.max(0, Math.min(L.length - 1, Math.floor((iq - 78) / 10)));
  const lo = 78 + i * 10, hi = lo + 10;
  return { i, name: L[i], next: L[i + 1] || null, progress: i === L.length - 1 ? 1 : Math.max(0, Math.min(1, (iq - lo) / (hi - lo))), floor: i ? lo : 0, to: i === L.length - 1 ? null : hi };
}

// whose game this reads like: the shape of the profile (what's strongest relative to the rest),
// matched against each archetype; two close matches make a hybrid
export function likeness(prof, sport) {
  const d = prof.dims, speedIQ = START + (d.speed - 50) * 0.6;
  const v = [d.vision, d.spacing, d.recognition, speedIQ], m = v.reduce((a, b) => a + b, 0) / 4;
  const z = v.map(x => x - m), zl = Math.hypot(...z) || 1;
  const scored = sport.iq.archetypes.map(a => { const al = Math.hypot(...a.v) || 1; return { a, s: z.reduce((s, x, i) => s + x * a.v[i], 0) / zl / al }; }).sort((x, y) => y.s - x.s);
  const top = scored[0], two = scored[1];
  if (prof.n < 4) return { name: null, why: 'Answer a few more and your style shows up.', hybrid: false };
  const last = a => a.name.split(' ').pop();
  if (two && top.s - two.s < 0.08) return { name: top.a.name + ' × ' + two.a.name, style: top.a.style + ' meets ' + two.a.style.toLowerCase(), why: `${last(top.a)} ${top.a.why}; ${last(two.a)} ${two.a.why}. Your game has both.`, hybrid: true };
  return { name: top.a.name, style: top.a.style, why: `${last(top.a)} ${top.a.why}. That's your game.`, hybrid: false };
}

// what the tutor says without the AI: built from the play itself
export function explain(q, sport, raw, given) {
  const n = normalize(raw, sport).play, name = id => { const p = n.players.find(x => x.id === id); return p ? sport.notation.name(p) : id; };
  const read = (n.reads || []).find(r => r.who === q.answer);
  if (q.type === 'pass') return `${name(q.answer)} was open${read ? ': ' + read.text.toLowerCase() : ''}.` + (given && q.also.indexOf(given) >= 0 ? ` ${name(given)} was open too. Good eyes.` : '');
  if (q.type === 'spot') return `${name(q.who)} goes there to ${n.beats[q.beat].say.replace(/^[^.]*?\b(to|and)\b/i, '').replace(/\.$/, '').trim() || 'make the play work'}.`;
  if (q.type === 'name') return `That was ${n.title}. ${(n.cues || [])[0] || ''}`.trim();
  return `That's ${q.answer}. Count the deep defenders: ${/2/.test(q.answer) ? 'two deep halves' : /3/.test(q.answer) ? 'three deep thirds' : /1/.test(q.answer) ? 'one deep in the middle' : 'nobody deep, everyone on a man'}.`;
}
