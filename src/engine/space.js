// Concepts as geometry (src/concepts/*): which zone a spot is in, where a demo actor is at a time, and quiz
// questions made up on the spot from the zones, so every answer is the concept's own, never a guess.
// check() is the gate every concept file passes (test/concepts.test.mjs). Pure: no DOM.

export const LEVELS = [
  { id: 'kids', name: 'Kids', age: '6–9' },
  { id: 'starter', name: 'Starter', age: '10–13' },
  { id: 'varsity', name: 'Varsity', age: '14+' },
  { id: 'coach', name: 'Coach', age: 'Teach it' }
];

const AREA = { rect: 1, circle: 1 };
export function inside(z, [x, y]) {
  if (z.kind === 'rect') return x >= z.x[0] && x <= z.x[1] && y >= z.y[0] && y <= z.y[1];
  if (z.kind === 'circle') return Math.hypot(x - z.c[0], y - z.c[1]) <= z.r;
  return false;
}
// the most specific zone with a rule: a small circle (an elbow, a pressure point) beats the alley it sits in
export function zoneAt(concept, pt) {
  const hits = concept.zones.filter(z => AREA[z.kind] && z.rule && inside(z, pt));
  hits.sort((a, b) => size(a) - size(b));
  return hits[0] || null;
}
const size = z => z.kind === 'circle' ? Math.PI * z.r * z.r : (z.x[1] - z.x[0]) * (z.y[1] - z.y[0]);

// a demo actor's spot at time u (0..1 of the loop), eased along its path; holds the end for the last fifth
export function actorAt(actor, u) {
  const p = actor.path, n = p.length - 1;
  if (n <= 0) return p[0].slice();
  const v = Math.min(1, u / 0.8), e = v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
  const f = e * n, i = Math.min(n - 1, Math.floor(f)), w = f - i;
  return [p[i][0] + (p[i + 1][0] - p[i][0]) * w, p[i][1] + (p[i + 1][1] - p[i][1]) * w];
}

const pick = (a, r) => a[Math.floor(r() * a.length)];
function pointIn(z, r) {
  if (z.kind === 'circle') { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * z.r * 0.8; return [z.c[0] + Math.cos(a) * d, z.c[1] + Math.sin(a) * d]; }
  const m = 0.8;   // stay off the edges, so the answer is never a coin flip on a line
  return [z.x[0] + m + r() * (z.x[1] - z.x[0] - 2 * m), z.y[0] + m + r() * (z.y[1] - z.y[0] - 2 * m)];
}
const round = p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];

// one question. kinds: way (tap the side you push it to), rule (what's the job here), help (tap your help spot)
export function question(concept, level, r = Math.random, kind) {
  const kinds = concept.quiz[level] || concept.quiz.starter;
  kind = kind || pick(kinds, r);
  if (kind === 'way') {
    const s = r() < 0.5 ? -1 : 1, ball = round([s * (2.5 + r() * 12), 22 + r() * 21]);
    return { kind, ball, side: s, ask: 'You’re guarding the ball. Which way do you push it?',
      why: level === 'kids' ? 'Push it to the side lane, the one closest to the ball. The sideline helps you!' : Math.abs(ball[0]) < 7 ? 'Turn it out of the middle, toward the nearest sideline.' : 'Force it to the nearest sideline: it’s the extra defender.' };
  }
  if (kind === 'help') {
    const s = r() < 0.5 ? -1 : 1, ball = round([s * (15 + r() * 6), 17 + r() * 10]), man = round([-s * (17 + r() * 4), 15 + r() * 8]);
    return { kind, ball, man, side: -s, ask: 'You guard the player on the far side, away from the ball. Tap where you help from.',
      ok: pt => Math.abs(pt[0]) <= 4.5 && pt[1] >= 4 && pt[1] <= 26,
      spot: [-s * 1.5, Math.min(18, Math.max(9, (ball[1] + man[1]) / 2 - 3))],
      why: 'Sink to the split line, one foot on it, where you can see your player and the ball.' };
  }
  // rule: a spot in one of the zones that carries a rule, and four different rules to choose from
  const zones = concept.zones.filter(z => z.rule && AREA[z.kind]);
  const z = pick(zones, r), ball = round(pointIn(z, r)), at = zoneAt(concept, ball) || z;
  const rules = Array.from(new Set(zones.map(q => q.rule))).filter(x => x !== at.rule);
  const wrong = [];
  while (wrong.length < 3 && rules.length) wrong.push(rules.splice(Math.floor(r() * rules.length), 1)[0]);
  const options = wrong.concat(at.rule);
  for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
  return { kind, ball, zone: at.id, ask: at.ask + ' What’s the rule?', options, answer: at.rule, why: at.rule + '.' };
}

// the gate: every concept file is checked before it ships
export function check(concept, sport) {
  const errs = [], ids = new Set(concept.zones.map(z => z.id)), F = sport.field;
  const inCourt = ([x, y]) => x >= F.x[0] - 0.01 && x <= F.x[1] + 0.01 && y >= F.y[0] - 0.01 && y <= F.y[1] + 0.01;
  if (!concept.id || !concept.title || !concept.line) errs.push('needs id, title and line');
  for (const z of concept.zones) {
    const pts = z.kind === 'rect' ? [[z.x[0], z.y[0]], [z.x[1], z.y[1]]] : z.kind === 'circle' ? [z.c] : z.pts || [];
    if (!pts.length) errs.push(z.id + ': no geometry');
    pts.concat(z.at ? [z.at] : []).forEach(p => { if (!inCourt(p)) errs.push(z.id + ': off the court at ' + p); });
    if (z.rule && !z.ask) errs.push(z.id + ': a rule needs an ask');
  }
  for (const L of LEVELS) {
    const steps = concept.levels[L.id];
    if (!steps || !steps.length) { errs.push('no steps for ' + L.id); continue; }
    steps.forEach((s, i) => {
      if (!s.t || !s.say) errs.push(`${L.id} ${i + 1}: needs t and say`);
      (s.show || []).concat(s.hot || []).forEach(id => { if (!ids.has(id)) errs.push(`${L.id} ${i + 1}: unknown zone ${id}`); });
      if (s.demo && !concept.demos[s.demo]) errs.push(`${L.id} ${i + 1}: unknown demo ${s.demo}`);
    });
    if (!concept.quiz[L.id] || !concept.quiz[L.id].length) errs.push('no quiz for ' + L.id);
  }
  for (const [k, d] of Object.entries(concept.demos || {})) d.actors.forEach(a => a.path.forEach(p => { if (!inCourt(p)) errs.push(`demo ${k}: off the court at ${p}`); }));
  return errs;
}
