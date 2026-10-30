#!/usr/bin/env node
// How accurately does the AI draw what a coach said? Runs research/eval/plays.json through drawPlay with a real
// key and scores each case: every expected action, in order (who, kind, target), the concept, and a clean play.
//   CT_EVAL_KEY=sk-ant-… node scripts/eval-plays.mjs [label]
// Results go to research/eval/results-<label>.json so runs can be compared.
import { readFileSync, writeFileSync } from 'node:fs';
const store = {}; globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
const { drawPlay, setModelOverride } = await import('../src/ai.js');
setModelOverride(process.env.CT_EVAL_MODEL);
const { getSport } = await import('../src/sports/index.js');
const { normalize, compile } = await import('../src/engine/sim.js');

const key = process.env.CT_EVAL_KEY, label = process.argv[2] || 'run', only = process.env.CT_EVAL_ONLY;
if (!key) { console.error('Set CT_EVAL_KEY'); process.exit(1); }
const cases = JSON.parse(readFileSync(new URL('../research/eval/plays.json', import.meta.url))).filter(c => !only || only.split(',').includes(c.id));

function score(c, raw) {
  const sport = getSport(c.sport), n = normalize(raw, sport);
  if (!n.ok) return { score: 0, notes: ['did not normalize: ' + n.errors.join('; ')] };
  const play = n.play, roleOf = id => (play.players.find(p => p.id === id) || {}).role || '';
  const acts = []; play.beats.forEach((b, k) => b.actions.forEach(a => acts.push(Object.assign({ beat: k }, a))));
  const notes = []; let got = 0, i = 0;
  for (const e of c.expect) {
    const ok = a => (!e.who || a.who === e.who) && (!e.role || new RegExp('^(' + e.role + ')$').test(roleOf(a.who))) && e.kind.includes(a.kind)
      && (!e.target || a.target === e.target) && (!e.targetRole || new RegExp('^(' + e.targetRole + ')$').test(roleOf(a.target)));
    const j = acts.findIndex((a, x) => x >= i && ok(a));
    if (j >= 0) { got++; i = j + 1; } else notes.push('missing ' + JSON.stringify(e));
  }
  let total = c.expect.length + 1, pts = got + (n.errors.length ? 0.5 : 1);
  for (const f of c.forbid || []) { total++; if (acts.some(a => a.who === f.who && f.kind.includes(a.kind))) notes.push('should not have ' + JSON.stringify(f)); else pts++; }
  if (c.needDefense) { total++; if (play.players.filter(p => p.side === 'D').length >= c.needDefense.length) pts++; else notes.push('no defenders drawn'); }
  // geometry: where players start and end up (named spots, within tolerance), and route depths
  const G = c.geo || {}, tol = sport.los == null ? 5 : 3, sp = name => name.split('|').map(x => sport.spots[x]).filter(Boolean);
  const near = (pt, name) => sp(name).some(s => Math.hypot(pt[0] - s[0], pt[1] - s[1]) <= tol);
  const sim = compile(play, sport, { defense: false }), P0 = sim.posAt(0), PE = sim.posAt(sim.beats - 0.001);
  for (const [id, name] of Object.entries(G.start || {})) { total++; const i2 = sim.idx[id]; if (i2 != null && near(P0[i2], name)) pts++; else notes.push(`${id} starts at ${i2 == null ? '?' : P0[i2].map(v => v.toFixed(0))}, not ${name}`); }
  for (const [id, name] of G.ends || []) {
    total++; const i2 = sim.idx[id];
    // anywhere along the way counts: the spot the coach named is where they went, even if they moved on after
    let hit = false; if (i2 != null) for (let t = 0; t <= sim.beats; t += 0.05) if (near(sim.posAt(Math.min(t, sim.beats - 0.001))[i2], name)) { hit = true; break; }
    if (hit) pts++; else notes.push(`${id} never reaches ${name} (ends ${i2 == null ? '?' : PE[i2].map(v => v.toFixed(0))})`);
  }
  for (const [what, yards] of G.depth || []) {
    total++; const los = play.los != null ? play.los : sport.los;
    const routes = acts.filter(a => a.kind === 'route'), depths = routes.map(a => { const pts2 = (a.path || []).concat(a.to ? [a.to] : []); return pts2.map(q => los - q.y); });
    const ok2 = what === 'slotdig' ? depths.some(d => d.some(v => Math.abs(v - yards) <= 2.5)) : depths.filter(d => d.some(v => Math.abs(v - yards) <= 2.5)).length >= 2;
    if (ok2) pts++; else notes.push(`no ${what} at ${yards} yd (depths ${depths.map(d => d.map(v => v.toFixed(0)).join('/')).join(', ')})`);
  }
  if (c.concept) { total++; if (c.concept.includes(raw.recognized)) pts++; else notes.push('concept ' + raw.recognized + ' (wanted ' + c.concept.join('|') + ')'); }
  return { score: pts / total, notes };
}

const results = [];
for (let k = 0; k < cases.length; k += 3) {
  await Promise.all(cases.slice(k, k + 3).map(async c => {
    const t0 = Date.now();
    try {
      const sport = getSport(c.sport);
      const cur = c.current ? JSON.parse(JSON.stringify(sport.plays.find(p => p.key === c.current))) : null;
      const raw = await drawPlay(c.said, cur, { key, sport, library: sport.plays, coach: process.env.CT_EVAL_COACH });
      const s = score(c, raw);
      results.push({ id: c.id, ms: Date.now() - t0, score: s.score, notes: s.notes, title: raw.title, recognized: raw.recognized });
    } catch (e) { results.push({ id: c.id, ms: Date.now() - t0, score: 0, notes: ['error: ' + e.message] }); }
  }));
}
results.sort((a, b) => cases.findIndex(c => c.id === a.id) - cases.findIndex(c => c.id === b.id));
const avg = results.reduce((s, r) => s + r.score, 0) / results.length, perfect = results.filter(r => r.score === 1).length;
for (const r of results) console.log(`${(r.score * 100).toFixed(0).padStart(4)}%  ${(r.ms / 1000).toFixed(1).padStart(5)}s  ${r.id.padEnd(12)} ${r.notes.join(' | ').slice(0, 220)}`);
console.log(`\n${label}: ${(avg * 100).toFixed(1)}% average, ${perfect}/${results.length} perfect, median ${(results.map(r => r.ms).sort((a, b) => a - b)[Math.floor(results.length / 2)] / 1000).toFixed(1)} s`);
writeFileSync(new URL(`../research/eval/results-${label}.json`, import.meta.url), JSON.stringify({ label, avg, perfect, results }, null, 2));
