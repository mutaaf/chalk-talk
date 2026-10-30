#!/usr/bin/env node
// Pre-fill the shared answer cache with what coaches ask most: every library play's film room (each position's
// brain, defense off and on) and its analyst lines. The requests are built exactly as the board builds them
// (same strip, same order), so the board's next identical request is a cache hit. Already-cached ones are free.
//   CT_PREWARM_TOKEN=$(cat .stats-token) node scripts/prewarm-cache.mjs [https://mutaafaziz.com/chalktalk/api]
const store = {}; globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
const { sports } = await import('../src/sports/index.js');
const { normalize, compile } = await import('../src/engine/sim.js');
const { strip } = await import('../src/engine/strip.js');
const { analyze } = await import('../src/analyst.js');

const API = process.argv[2] || 'https://mutaafaziz.com/chalktalk/api', token = process.env.CT_PREWARM_TOKEN;
if (!token) { console.error('Set CT_PREWARM_TOKEN (the stats token)'); process.exit(1); }
const jobs = [];
for (const sport of sports()) for (const raw of sport.plays) for (const defense of [false, true]) {
  const sim = compile(normalize(raw, sport).play, sport, { defense }), play = strip(sim.play);
  const nameOf = id => { const p = sim.play.players.find(q => q.id === id); return p ? sport.notation.name(p) : id; };
  // the film room: the same players the board picks (filmroom.js)
  const ids = sim.play.players.filter((p, i) => p.side === 'O' || sim.match[i] >= 0 || sim.job[i]).map(p => p.id).slice(0, 10);
  for (const id of ids) jobs.push(['brain', { sport: sport.id, play, id, mode: 'film' }]);
  jobs.push(['analyst', { sport: sport.id, play, facts: analyze(sim, sport, nameOf) }]);
}
let hit = 0, made = 0, fail = 0, i = 0;
async function worker() {
  while (i < jobs.length) {
    const [task, body] = jobs[i++];
    try {
      const r = await fetch(`${API}/${task}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ct-prewarm': token }, body: JSON.stringify(body) });
      if (!r.ok) { fail++; continue; }
      if (r.headers.get('x-ct-cache') === 'hit') hit++; else made++;
    } catch (e) { fail++; }
    if ((hit + made + fail) % 50 === 0) console.log(`${hit + made + fail}/${jobs.length}: ${made} new, ${hit} already cached, ${fail} failed`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log(`done: ${jobs.length} answers, ${made} new, ${hit} already cached, ${fail} failed`);
