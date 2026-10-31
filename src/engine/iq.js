// CourtIQ / FieldIQ: quiz questions cut from the library plays themselves (so the answer is always
// the engine's right read), an Elo-style rating per player, levels, and the pro whose game the
// profile reads like. Pure: no DOM, no storage.

import { normalize, compile } from './sim.js';
import { coverages, applyCoverage } from './football.js';
import { bestReads } from './reads.js';
import { situations } from './situations.js';
// everything a question can come from: the library, then the engine's own situations
export const bank = sport => sport.plays.concat(situations(sport));

// how the game adapts to age: playback speed, the clock, how many choices, how forgiving a tap is
export const AGES = [
  { id: '6-8', label: '6–8', band: 'young', speed: 0.7, time: 15, choices: 3, tol: 1.6, mix: { pass: 0.45, spot: 0.2, read: 0.25, next: 0.1 } },
  { id: '9-11', label: '9–11', band: 'young', speed: 0.85, time: 11, choices: 3, tol: 1.3, mix: { pass: 0.3, spot: 0.15, read: 0.2, next: 0.15, name: 0.1, defense: 0.1 } },
  { id: '12-14', label: '12–14', band: 'mid', speed: 1, time: 8, choices: 4, tol: 1.1, mix: { pass: 0.25, spot: 0.12, read: 0.18, next: 0.15, name: 0.08, defense: 0.12, coverage: 0.1 } },
  { id: '15+', label: '15+', band: 'older', speed: 1.2, time: 6, choices: 4, tol: 1, mix: { pass: 0.22, spot: 0.1, read: 0.16, next: 0.16, name: 0.08, defense: 0.14, coverage: 0.14 } }
];
export const ageOf = id => AGES.find(a => a.id === id) || AGES[1];
export const DIMS = ['vision', 'spacing', 'recognition', 'speed'];
const TYPE_DIM = { pass: 'vision', read: 'vision', spot: 'spacing', defense: 'spacing', name: 'recognition', next: 'recognition', coverage: 'recognition' };
// the daily challenge: the same five reads for everyone, every type in play
export const DAILY = { n: 5, iq: 96, age: '12-14', mix: { pass: 0.24, read: 0.2, next: 0.18, defense: 0.14, spot: 0.1, name: 0.07, coverage: 0.07 } };
export const dayNumber = (d = new Date()) => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 9, 31)) / 864e5) + 1;
// how far back a clip starts before the question: about a beat of context, never the whole play
export const LEAD = 1.15;
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

// a play, mirrored: the same reads on the other side of the floor (left and right swap in the words too)
const LR = s => String(s || '').replace(/\b(left|right)\b/gi, w => { const o = /left/i.test(w) ? 'right' : 'left'; return w[0] === w[0].toUpperCase() ? o[0].toUpperCase() + o.slice(1) : o; });
export function mirror(raw, sport) {
  const n = normalize(raw, sport); if (!n.ok) return raw;
  const f = v => (v && typeof v.x === 'number' ? Object.assign({}, v, { x: -v.x }) : v), P = n.play;
  return Object.assign({}, P, {
    key: raw.key, mirrored: true, summary: LR(P.summary), cues: (P.cues || []).map(LR), reads: (P.reads || []).map(r => Object.assign({}, r, { text: LR(r.text) })),
    players: P.players.map(p => { const q = Object.assign({}, p, { x: -p.x }); if (p.cover && p.cover.zone) q.cover = Object.assign({}, p.cover, { zone: Object.assign({}, p.cover.zone, { x0: -p.cover.zone.x1, x1: -p.cover.zone.x0 }) }); return q; }),
    beats: P.beats.map(b => Object.assign({}, b, { say: LR(b.say), actions: b.actions.map(a => Object.assign({}, a, { to: f(a.to), via: f(a.via), path: (a.path || []).map(f) })) }))
  });
}

// what the ball handler does next, as the answer to "pass, drive or shoot?"
const READ = { pass: 'Pass', throw: 'Throw', dribble: 'Drive', shot: 'Shoot', handoff: 'Hand off', run: 'Run it', pitch: 'Pitch' };
// a defender's job right now (engine/reads.js), as a choice
const DJOB = { press: 'Pressure the ball', deny: 'Deny the pass', closeout: 'Close out', sink: 'Sink and help', help: 'Stop the drive' };
// "what happens next": one action, said plainly
const NEXT = { pass: (a, t) => `${a} passes to ${t}`, throw: (a, t) => `${a} throws to ${t}`, dribble: a => `${a} drives`, shot: a => `${a} shoots`, handoff: (a, t) => `${a} hands off to ${t}`,
  screen: (a, t) => (t ? `${a} screens for ${t}` : `${a} sets a screen`), cut: a => `${a} cuts`, curl: a => `${a} curls off the screen`, roll: a => `${a} rolls to the rim`, pop: a => `${a} pops out`, route: a => `${a} runs a route`,
  run: a => `${a} runs with it`, pitch: (a, t) => `${a} pitches to ${t}`, motion: a => `${a} goes in motion` };

// every question one play can ask (each with an id, so a player isn't asked the same thing twice soon)
export function candidates(raw, sport, opts) {
  const m = !!(opts && opts.mirror), src = m ? mirror(raw, sport) : raw;
  const n = normalize(src, sport); if (!n.ok) return [];
  const sim = compile(n.play, sport, { defense: true }), out = [], D = difficulty(raw, sport), U = sport.mark, nb = sim.play.beats.length;
  const fb = !!sport.kinds.route, nm = id => { const p = sim.players[sim.idx[id]]; return p ? sport.notation.name(p) : id; };
  const add = q => { q.key = raw.key; q.mirror = m; q.from = Math.max(0, (q.from != null ? q.from : q.at - LEAD)); q.id = [raw.key, q.type, q.beat != null ? q.beat : '', q.who || '', m ? 'm' : ''].join('|'); out.push(q); };
  sim.play.beats.forEach((b, k) => b.actions.forEach(a => {
    const K = sport.kinds[a.kind];
    if (K.type === 'pass' && a.kind !== 'snap' && sim.play.lesson !== 'defense') {
      const also = sim.players.map((p, i) => i).filter(i => {
        const p = sim.players[i];
        return p.side === 'O' && p.id !== a.who && p.id !== a.target && p.role !== 'C' && sim.space(k + 0.94, i) >= sport.open * 1.6;
      }).map(i => sim.players[i].id);
      add({ type: 'pass', beat: k, at: k + 0.46, who: a.who, answer: a.target, also, d: D });
    }
    if (K.type === 'move' && sim.players[sim.idx[a.who]].side === 'O' && k > 0) {
      const i = sim.idx[a.who], s = sim.posAt(k)[i], e = sim.posAt(k + 0.999)[i];
      if (Math.hypot(e[0] - s[0], e[1] - s[1]) >= 6 * U) add({ type: 'spot', beat: k, at: k + 0.02, who: a.who, answer: [e[0], e[1]], tol: 3.2 * U, d: D - 4 });
    }
  }));
  // the ball handler's read: what the play does with the ball this step
  sim.play.beats.forEach((b, k) => {
    const h = sim.holderAt(k + 0.02); if (h < 0) return;
    const who = sim.players[h].id, a = b.actions.find(x => x.who === who && READ[x.kind]);
    if (!a || sim.play.lesson === 'defense') return;
    const opts2 = fb ? ['Throw', 'Run it', 'Hand off', 'Pitch'] : ['Pass', 'Drive', 'Shoot', 'Hand off'];
    add({ type: 'read', beat: k, at: k + 0.03, who, answer: READ[a.kind], options: opts2.filter(o => o === READ[a.kind] || o !== 'Pitch'), d: D - 2 });
  });
  // what happens next: the step's main action, against things that could have happened
  sim.play.beats.forEach((b, k) => {
    if (k === 0 && nb > 1 && fb) return;
    const acts = b.actions.filter(a => NEXT[a.kind] && sim.players[sim.idx[a.who]] && sim.players[sim.idx[a.who]].side === 'O');
    const a = acts.find(x => sport.kinds[x.kind].type !== 'move') || acts[0]; if (!a) return;
    const line = NEXT[a.kind](nm(a.who), a.target ? nm(a.target) : '');
    // wrong answers: what this same player could have done instead (other targets, other moves), never
    // something that happens in this step or the next
    const said = x => NEXT[x.kind](nm(x.who), x.target ? nm(x.target) : '');
    const truth = new Set(sim.play.beats.slice(k, k + 2).flatMap(bb => bb.actions.filter(x => NEXT[x.kind]).map(said)));
    const O = sim.players.filter(p => p.side === 'O' && p.role !== 'C' && p.id !== a.who).map(p => p.id);
    const ballKinds = Object.keys(NEXT).filter(x => sport.kinds[x] && (sport.kinds[x].type !== 'move' || x === 'dribble' || x === 'run') && x !== 'snap');
    const moveKinds = Object.keys(NEXT).filter(x => sport.kinds[x] && sport.kinds[x].type === 'move' && x !== 'dribble' && x !== 'run');
    const hasBall = sim.holderAt(k + 0.02) === sim.idx[a.who], fakes = [];
    for (const kind of hasBall ? ballKinds : moveKinds) for (const t of NEXT[kind].length > 1 ? O : [null]) {
      const f = NEXT[kind](nm(a.who), t ? nm(t) : ''); if (!truth.has(f) && fakes.indexOf(f) < 0) fakes.push(f);
    }
    if (fakes.length < 3) for (const w of O.filter(id => sim.players[sim.idx[id]].role !== 'QB')) for (const kind of moveKinds) { const f = NEXT[kind](nm(w), ''); if (!truth.has(f) && fakes.indexOf(f) < 0 && fakes.length < 6) fakes.push(f); }
    add({ type: 'next', beat: k, at: k + 0.01, from: Math.max(0, k - 0.9), answer: line, pool: fakes, d: D + 2 });
  });
  // defense: a defender's job at the moment, when the engine's read is clear
  if (!fb && sim.players.some(p => p.side === 'D')) sim.play.beats.forEach((b, k) => {
    sim.players.forEach((p, i) => {
      if (p.side !== 'D') return;
      const r = bestReads(sim, sport, k + 0.5, i); if (!r.length || !DJOB[r[0].kind]) return;
      const o = r.find(x => x.kind !== r[0].kind); if (o && r[0].score - o.score < 0.4) return;
      add({ type: 'defense', beat: k, at: k + 0.5, who: p.id, answer: DJOB[r[0].kind], options: Object.values(DJOB), d: D + 4 });
    });
  });
  // name it before it finishes: two steps in (library plays only: a situation has no name to know)
  if (!raw.situation) add({ type: 'name', at: Math.min(nb - 0.15, 2.1), from: 0, d: D + 6 });
  if (sport.kinds.route && sport.los != null && !sim.play.lesson && !m) add({ type: 'coverage', at: Math.min(nb - 0.6, 0.6), from: 0, d: D + 10 });
  return out;
}

// a set of questions pitched at this player: plays near their rating, the mix for their age, nothing they've
// seen lately (seen: question id → when), each answer kind about as likely as the next, mirrored half the time
let cache = new WeakMap();
function allFor(sport) {
  let all = cache.get(sport);
  if (!all) { all = bank(sport).flatMap(p => candidates(p, sport).concat(candidates(p, sport, { mirror: true }))); cache.set(sport, all); }
  return all;
}
export function quiz(sport, opts) {
  const o = Object.assign({ n: 5, iq: START, age: '9-11', seed: Date.now(), seen: {} }, opts), r = rng(o.seed), A = ageOf(o.age), mix = o.mix || A.mix;
  const all = allFor(sport);
  const types = Object.keys(mix).filter(t => all.some(q => q.type === t));
  const titles = sport.plays.map(p => p.title), C = sport.kinds.route ? coverages(sport) : null;
  const out = [], used = {}, keys = {}, last = {};
  for (let i = 0; i < o.n; i++) {
    // a type by the mix, never three of a kind in a row
    let type = types[0];
    for (let tries = 0; tries < 6; tries++) {
      let x = r(); const tot = types.reduce((s, u) => s + mix[u], 0);
      for (const t of types) { x -= mix[t] / tot; if (x <= 0) { type = t; break; } }
      if (!(out.length >= 2 && out[out.length - 1].type === type && out[out.length - 2].type === type)) break;
    }
    const base = all.filter(q => q.type === type && !used[q.id] && !used[q.key + q.type + q.beat] && !keys[q.key]);
    let pool = base.filter(q => !o.seen[q.id]);
    if (!pool.length) { const oldest = Math.min(...base.map(q => o.seen[q.id] || 0)); pool = base.filter(q => (o.seen[q.id] || 0) <= oldest + 1); }
    const near = pool.filter(q => Math.abs(q.d - o.iq) <= 18 + i * 3);
    pool = near.length ? near : pool;
    if (!pool.length) continue;
    // spread the answers: pick an answer first for the multiple-choice reads
    if (type === 'read' || type === 'defense') { const ans = [...new Set(pool.map(q => q.answer))]; const a = pick(r, ans); pool = pool.filter(q => q.answer === a); }
    const q = Object.assign({}, pick(r, pool));
    used[q.id] = used[q.key + q.type + q.beat] = 1; keys[q.key] = 1;
    if (type === 'name') {
      const right = sport.plays.find(p => p.key === q.key).title;
      q.choices = shuffle(r, [right].concat(shuffle(r, titles.filter(t => t !== right)).slice(0, A.choices - 1)));
      q.answer = right;
    }
    if (type === 'coverage') {
      const ks = Object.keys(C).filter((k, j, a) => a.findIndex(z => C[z].name === C[k].name) === j);
      const fresh = ks.filter(k => !o.seen[q.id + '|' + k]);
      q.cover = pick(r, fresh.length ? fresh : ks); q.answer = C[q.cover].name; q.id += '|' + q.cover;
      q.choices = shuffle(r, [q.answer].concat(shuffle(r, ks.map(k => C[k].name).filter(nm => nm !== q.answer)).slice(0, A.choices - 1)));
    }
    if (type === 'read' || type === 'defense') q.choices = shuffle(r, [q.answer].concat(shuffle(r, q.options.filter(x => x !== q.answer)).slice(0, A.choices - 1)));
    if (type === 'next') q.choices = shuffle(r, [q.answer].concat(shuffle(r, q.pool).slice(0, A.choices - 1)));
    q.n = (last[type] = (last[type] || 0) + 1) - 1;   // which phrasing to use
    out.push(q);
  }
  return out;
}

// the play a question runs on (coverage questions line the defense up first)
export function playFor(q, sport) {
  const raw = bank(sport).find(p => p.key === q.key);
  return q.type === 'coverage' ? applyCoverage(raw, sport, q.cover) : q.mirror ? mirror(raw, sport) : raw;
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

export function blank() { return { iq: START, dims: { vision: START, spacing: START, recognition: START, speed: 50 }, n: 0, right: 0, best: 0, streak: 0, history: [], seen: {} }; }

// fold one answer into a profile (returns a new one)
export function record(prof, q, g, age) {
  const p = JSON.parse(JSON.stringify(prof || blank())), dim = TYPE_DIM[q.type];
  p.iq = rate(p.iq, q, g, age);
  p.dims[dim] = rate(p.dims[dim], q, g, age);
  if (g.right) p.dims.speed = Math.round((p.dims.speed * 0.8 + (1 - g.slow) * 100 * 0.2) * 10) / 10;
  p.n++; if (g.right) { p.right++; p.streak++; p.best = Math.max(p.best, p.streak); } else p.streak = 0;
  if (q.id) { p.seen = p.seen || {}; p.seen[q.id] = p.n; const ids = Object.keys(p.seen); if (ids.length > 400) ids.sort((a, b) => p.seen[a] - p.seen[b]).slice(0, ids.length - 400).forEach(k => delete p.seen[k]); }
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
  const n = (normalize(raw, sport).ok ? normalize(raw, sport) : normalize(bank(sport).find(p => p.key === q.key) || raw, sport)).play, name = id => { const p = n.players.find(x => x.id === id); return p ? sport.notation.name(p) : id; };
  const read = (n.reads || []).find(r => r.who === q.answer);
  if (q.type === 'pass') return `${name(q.answer)} was open${read ? ': ' + read.text.toLowerCase() : ''}.` + (given && q.also.indexOf(given) >= 0 ? ` ${name(given)} was open too. Good eyes.` : '');
  if (q.type === 'spot') return `${name(q.who)} goes there to ${n.beats[q.beat].say.replace(/^[^.]*?\b(to|and)\b/i, '').replace(/\.$/, '').trim() || 'make the play work'}.`;
  if (q.type === 'name') return `That was ${n.title}. ${(n.cues || [])[0] || ''}`.trim();
  if (q.type === 'read' || q.type === 'next') { const say = (n.beats[q.beat] || {}).say || ''; return (q.type === 'read' ? `${q.answer}. ` : '') + (say ? say : ''); }
  if (q.type === 'defense') return `${q.answer}. ` + ({ 'Pressure the ball': 'Your man has it: stay between him and the rim, active hands.', 'Deny the pass': 'One pass away: hand and foot in the lane.', 'Close out': 'Your man is open: sprint, then short steps, high hand.', 'Sink and help': 'Two passes away: sink to the paint and see ball and man.', 'Stop the drive': 'The ball is coming downhill: stop it, then recover.' }[q.answer] || '');
  return `That's ${q.answer}. Count the deep defenders: ${/2/.test(q.answer) ? 'two deep halves' : /3/.test(q.answer) ? 'three deep thirds' : /1/.test(q.answer) ? 'one deep in the middle' : 'nobody deep, everyone on a man'}.`;
}
