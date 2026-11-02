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
    if (a.kind === 'snap') said.push('Snap it');
    else if (T === 'pass') said.push(`Pass to ${name(a.target)}`);
    else if (T === 'handoff') said.push(`Hand it to ${name(a.target)}`);
    else if (T === 'shot') said.push('Shoot it');
    else if (T === 'ready') said.push('Hands ready');
    else if (a.tree) said.push(`Run your ${a.tree}`);
    else if (a.kind === 'screen' && a.target) said.push(`Set a screen for ${name(a.target)}`);
    else if (a.target && /cover|guard|mark|deny|rush/.test(a.kind)) said.push(`${cap(a.kind)} ${name(a.target)}`);
    else said.push(a.kind === 'move' ? 'Move to your next spot' : a.kind === 'route' ? 'Run your route' : `${cap(a.kind)} to your next spot`);
  }
  const incoming = b.actions.find(a => a.target === me.id && /pass|handoff/.test((K[a.kind] || {}).type || ''));
  if (incoming && incoming.kind === 'snap' && !said.length) said.push('Take the snap');
  else if (incoming && !said.length) said.push(`Get open: ${name(incoming.who)} is passing to you`);
  else if (incoming) said.push('then catch it');
  if (!said.length) return me.side === 'D' ? 'Stay with your player, see the ball' : 'Hold your spot, eyes on the ball';
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
  const P = sim.posAt(t), me = P[i], goal = sport.field.goal, ball = sim.ballAt(t), h = sim.holderAt(t);
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
