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
    // where the ball can be (concept.way.x is the distance from the middle, .y the depth) and what to say about it
    const W = concept.way, s = r() < 0.5 ? -1 : 1, ball = round([s * (W.x[0] + r() * (W.x[1] - W.x[0])), W.y[0] + r() * (W.y[1] - W.y[0])]);
    return { kind, ball, side: s, ask: W.ask, why: level === 'kids' ? W.kids : Math.abs(ball[0]) < W.mid ? W.middle : W.why };
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
    if ((concept.quiz[L.id] || []).includes('way') && !(concept.way && concept.way.ask && concept.way.why && concept.way.kids)) errs.push('way questions need concept.way');
    if ((concept.quiz[L.id] || []).includes('help') && concept.sport !== 'basketball') errs.push('help questions are basketball only');
  }
  for (const [k, d] of Object.entries(concept.demos || {})) d.actors.forEach(a => a.path.forEach(p => { if (!inCourt(p)) errs.push(`demo ${k}: off the court at ${p}`); }));
  return errs;
}

// ---- a concept's defense, played by the engine: the rules a concept declares (concept.defense) applied to where
// the basic defense would stand. Basketball rules: forceSideline (on the ball, a step to its middle side, so the
// only way is out), splitLine (the far side, two passes away, sinks to the split line), frontPost (a post on the
// ball side gets fronted, between the ball and the post). Each rule is a number: how far, in feet.
export function defenseSystem(concept) {
  const D = concept && concept.defense; if (!D) return null;
  const sign = v => v < 0 ? -1 : 1;
  return function ({ o, ball, onBall, help, base, goal }) {
    if (help || !o || !ball) return base;
    const g = goal || [0, 5.25];
    if (onBall) {
      if (D.forceSideline && Math.abs(o[0]) > 0.6) return [base[0] - sign(o[0]) * D.forceSideline, base[1]];
      return base;
    }
    const toRim = Math.hypot(o[0] - g[0], o[1] - g[1]), ballDeep = Math.hypot(ball[0] - g[0], ball[1] - g[1]) < 9;
    // the post, ball side, ball above it and outside the paint: in front of the post, toward the ball
    if (D.frontPost && toRim < 11 && o[1] < 13 && !ballDeep && ball[1] > o[1] + 2 && (sign(o[0]) === sign(ball[0]) || Math.abs(o[0]) < 3)) {
      const dx = ball[0] - o[0], dy = ball[1] - o[1], L = Math.hypot(dx, dy) || 1;
      return [o[0] + dx / L * D.frontPost, o[1] + dy / L * D.frontPost];
    }
    // two passes away: ball on one side of the split line, my man well over on the other
    if (D.splitLine && Math.abs(ball[0]) > 4 && Math.abs(o[0]) > 7 && sign(o[0]) !== sign(ball[0])) {
      const y = Math.max(6, Math.min(24, (o[1] + ball[1]) / 2 - 2));
      return [sign(o[0]) * D.splitLine, y];
    }
    return base;
  };
}

// ---- what the concept would say about a play: one call-out per step, from where the ball really went in the
// engine (the booth adds it when the system is on). Only what a coach of this system would point at.
export function systemNotes(sim, concept, nameOf) {
  const nm = nameOf || (id => id), K = sim.sport ? sim.sport.kinds : null, play = sim.play, out = [];
  let farSaid = false;
  const ballAt = t => { const h = sim.holderAt(t); return h >= 0 ? { h, p: sim.posAt(t)[h] } : null; };
  const zid = p => { const z = zoneAt(concept, p); return z ? z.id.replace(/[LR]$/, '') : null; };
  play.beats.forEach((b, k) => {
    const a = ballAt(k + 0.05), e = ballAt(k + 0.95);
    let say = '';
    if (a && e) {
      const z0 = zid(a.p), z1 = zid(e.p), same = a.h === e.h;
      const catchPost = !same && z1 === 'post';
      if (catchPost) say = `${nm(sim.players[e.h].id)} catches it in the post. Against a full front that pass shouldn’t get there; it has to be a lob over the top.`;
      else if (z1 !== z0) {
        if (z1 === 'middle') say = 'The ball gets into the middle alley. That’s the one place this defense says to take away.';
        else if (z1 === 'red') say = 'The ball is in the red zone now. No easy baskets: somebody has to be there.';
        else if (z1 === 'elbow') say = 'Penetration at the elbow: the defender has to beat the ball to that spot.';
        else if (z1 === 'pp') say = 'That’s a pressure point: the sideline and half court do half the guarding. Trap chance.';
        else if ((z1 === 'force' || z1 === 'side') && z0 === 'middle') say = 'Good: the ball’s been turned out of the middle, toward the sideline.';
      }
    }
    if (!say && !farSaid && e && Math.abs(e.p[0]) > 6) {
      const P = sim.posAt(k + 0.95), d = sim.players.findIndex((p, i) => p.side === 'D' && sim.match && sim.match[i] >= 0 && Math.abs(P[i][0]) <= 2 && Math.sign(P[sim.match[i]][0]) !== Math.sign(e.p[0]) && Math.abs(P[sim.match[i]][0]) > 7);
      if (d >= 0) { say = `Watch the far side: ${nm(sim.players[d].id)} sinks to the split line, ready to help.`; farSaid = true; }
    }
    out.push(say);
  });
  return out;
}
