// Trace your path: the play from one player's spot. Pick a sport and a position and this says, step by step, where
// you go (sampled from the compiled play, so it is exactly what the board runs), what you do, and where your eyes
// are. src/trace.js draws it as aurora light on the floor (WebXR glasses and headsets, or first person on a
// screen); glasses.html draws it as a heads-up radar. Pure: no DOM.

export const UNIT_M = { ft: 0.3048, yd: 0.9144, m: 1 };
export const metersPer = sport => UNIT_M[sport.unit] || 1;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// one player's job in step k, in plain words
export function jobIn(sim, i, k, sport, name = id => id) {
  const me = sim.play.players[i], b = sim.play.beats[k]; if (!b) return 'That’s the play.';
  const K = sport.kinds, said = [];
  for (const a of b.actions) {
    if (a.who !== me.id) continue;
    const T = (K[a.kind] || {}).type;
    if ((K[a.kind] || {}).job) said.push(K[a.kind].job.replace('{t}', () => name(a.target)));   // the kind says it (pickleball: "Dink it to C")
    else if (a.kind === 'snap') said.push('Snap it');
    else if (T === 'pass') said.push(`Pass to ${name(a.target)}`);
    else if (T === 'handoff') said.push(`Hand it to ${name(a.target)}`);
    else if (T === 'shot') said.push('Shoot it');
    else if (T === 'ready') said.push('Hands ready');
    else if (a.tree) said.push(`Run your ${a.tree}`);
    else if (a.kind === 'screen' && a.target) said.push(`Set a screen for ${name(a.target)}`);
    else if (a.target && /cover|guard|mark|deny|rush/.test(a.kind)) said.push(`${cap(a.kind)} ${name(a.target)}`);
    else said.push(a.kind === 'move' ? 'Move to your next spot' : a.kind === 'route' ? 'Run your route' : `${cap(a.kind)} to your next spot`);
  }
  const incoming = b.actions.find(a => a.target === me.id && /pass|handoff|hit/.test((K[a.kind] || {}).type || ''));
  if (incoming && K[incoming.kind].recv) said.push(K[incoming.kind].recv.replace('{w}', name(incoming.who)));   // over the net to you
  else if (incoming && incoming.kind === 'snap' && !said.length) said.push('Take the snap');
  else if (incoming && !said.length) said.push(`Get open: ${name(incoming.who)} is passing to you`);
  else if (incoming) said.push('then catch it');
  if (!said.length) return sport.rally ? 'Paddle up, watch the ball' : me.side === 'D' ? 'Stay with your player, see the ball' : 'Hold your spot, eyes on the ball';
  return said.join(', ');
}

// every step: where you start and end, the path between (sampled from the engine), whether you move, and the job
export function trace(sim, i, sport, name = id => id) {
  const play = sim.play, me = play.players[i], n = play.beats.length, steps = [];
  for (let k = 0; k < n; k++) {
    const pts = [];
    for (let j = 0; j <= 16; j++) {
      const p = sim.posAt(k + j / 16)[i], q = pts[pts.length - 1];
      if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.05) pts.push([p[0], p[1]]);
    }
    let len = 0; for (let j = 1; j < pts.length; j++) len += Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]);
    const end = sim.posAt(k + 1)[i];
    steps.push({ k, pts, from: pts[0], to: [end[0], end[1]], len, moved: len > sport.mark * 0.6, job: jobIn(sim, i, k, sport, name),
      ball: sim.holderAt(k + 0.02) === i, say: (play.beats[k].say || '') });
  }
  return { i, id: me.id, side: me.side, name: name(me.id), steps, start: steps[0] ? steps[0].from : [me.x, me.y] };
}

// where your eyes are at time t, as a heading in the field's frame: 0 faces the goal you attack (−y), +π/2 faces +x.
// With the ball you look at the goal; without it, at the ball, leaning toward where you're running.
export function lookAt(sim, i, t, sport) {
  const P = sim.posAt(t), me = P[i], goal = sim.play.players[i].side === 'D' && sport.field.goalD ? sport.field.goalD : sport.field.goal, ball = sim.ballAt(t), h = sim.holderAt(t);   // a net sport: the other side looks at our court
  const tgt = h === i || !ball ? goal : ball;
  let dx = tgt[0] - me[0], dy = tgt[1] - me[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
  const Q = sim.posAt(t + 0.08)[i], mx = Q[0] - me[0], my = Q[1] - me[1], ml = Math.hypot(mx, my);
  if (ml > sport.mark * 0.05) { dx = dx * 0.6 + mx / ml; dy = dy * 0.6 + my / ml; }
  return Math.atan2(dx, -dy);
}

// a scale that fits your whole path into a room this many meters across (never bigger than life)
export function roomScale(tr, sport, room = 3.5) {
  const m = metersPer(sport); let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const s of tr.steps) for (const p of s.pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const ext = Math.max(x1 - x0, y1 - y0, 0) * m;
  return ext > room ? room / ext : 1;
}

// positions worth picking in a play: the offense first, then the defense, labelled the way the board labels them
export const positions = (sim, sport, name = id => id) => sim.play.players.map((p, i) => ({ i, id: p.id, side: p.side, label: name(p.id), short: sport.notation.inside(p) }))
  .sort((a, b) => (a.side === b.side ? 0 : a.side === 'O' ? -1 : 1));

// the position worth tracing first: the offensive player with the most to do (moves, then touches)
export function busiest(sim) {
  const score = sim.play.players.map(p => p.side !== 'O' ? -1 : sim.play.beats.reduce((n, b) => n + b.actions.filter(a => a.who === p.id).length * 2 + b.actions.filter(a => a.target === p.id).length, 0));
  return score.indexOf(Math.max(...score));
}

// net sports: where the ball bounces in step k (a serve, a drop, a dink lands a few steps in front of the player who
// plays it), or null when it's taken out of the air. Sampled from the engine's own ball, so it is what the board shows.
export function bounceIn(sim, sport, k) {
  if (!sport.rally) return null;
  const r = sport.ball.r; let best = null;
  for (let f = 0.3; f < 0.96; f += 0.004) { const b = sim.ballAt(k + f); if (b && b[2] <= r + sport.mark * 0.3 && (!best || b[2] < best[2])) best = b; }
  return best ? [best[0], best[1]] : null;
}


// the ball's real flight in step k when it's passed, thrown, hit or shot: who lets it go, who it's for, and the path
// it flies (sampled from the engine's own ball while nobody holds it, a sample either side so it starts in a hand and
// ends in one), or null when the ball stays in someone's hands all step
export function flightIn(sim, sport, k) {
  const b = sim.play.beats[k]; if (!b) return null;
  const a = b.actions.find(x => x.kind === 'snap' || /^(pass|hit|shot)$/.test((sport.kinds[x.kind] || {}).type || '')); if (!a) return null;
  const pts = []; let prev = null, air = false;
  for (let j = 0; j <= 60; j++) {
    const t = k + j / 60, B = sim.ballAt(t); if (!B) continue;
    const p = [B[0], B[1], B[2] || 0], free = sim.holderAt(t) < 0;
    if (free && !air && prev) pts.push(prev);
    if (free || air) pts.push(p);
    if (air && !free) break;
    air = free; prev = p;
  }
  if (pts.length < 3) return null;
  const T = (sport.kinds[a.kind] || {}).type;
  return { who: a.who, target: a.target || null, kind: a.kind, shot: T === 'shot', pts };
}

// which way you face when you stand on your spot on a real field before it starts (a heading in the field frame,
// like lookAt): a net sport faces the net, the attack faces the goal it attacks, a defender faces the ball
export function faceHeading(sim, i, sport) {
  const me = sim.play.players[i], s = sim.posAt(0)[i];
  if (sport.rally) return me.side === 'D' ? Math.PI : 0;
  const B = sim.ballAt(0), tgt = me.side === 'D' ? (B && Math.hypot(B[0] - s[0], B[1] - s[1]) > sport.mark ? B : [s[0], s[1] + 10]) : sport.field.goal;
  const dx = tgt[0] - s[0], dy = tgt[1] - s[1];
  return Math.hypot(dx, dy) < 1e-6 ? 0 : Math.atan2(dx, -dy);
}
export const faceWords = (sim, i, sport) => (sim.play.players[i].side === 'D' && !sport.rally ? 'the ball' : (sport.trace && sport.trace.face) || 'the goal');

// a rep scored: for each of your moves, how many seconds the play had to wait for you to reach the ring (0 = there
// on time, null = skipped). Three stars for every move on time.
export function repScore(lates, tol = 0.35) {
  const L = lates.filter(v => v !== undefined), moves = L.length, onTime = L.filter(v => v != null && v <= tol).length;
  const got = L.filter(v => v != null), avg = got.length ? got.reduce((a, b) => a + b, 0) / got.length : 0;
  const r = moves ? onTime / moves : 0;
  return { moves, onTime, avg, stars: !moves ? 0 : r === 1 ? 3 : r >= 0.6 ? 2 : r > 0 ? 1 : 0 };
}
