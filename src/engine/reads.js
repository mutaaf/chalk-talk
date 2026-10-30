// The best read for any player at any moment: what the engine sees right now, ranked. Pure: positions come from
// the compiled play (sim) at time t; nothing here guesses beyond the field.
//   ball handler: pass to the open man (how open, how clean the lane), drive the lane, take the open shot
//   off the ball: cut when your defender is watching the ball, relocate to the open spot, or stay and show hands
//   defense: pressure the ball, deny one pass away, help on a drive, close out to an open shooter, hold your zone
// Each read: { kind, text, why, to: player index or [x, y], score }.

const seg = (p, a, b) => {   // distance from point p to the middle of segment a–b (the passer's own defender at the start doesn't block the lane)
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, u = Math.max(0.25, Math.min(0.72, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
  return Math.hypot(a[0] + dx * u - p[0], a[1] + dy * u - p[1]);
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function bestReads(sim, sport, t, i, nameOf) {
  const nm = nameOf || (k => sim.players[k].id), P = sim.posAt(t), me = sim.players[i], open = sport.open, unit = sport.unit;
  const D = sim.players.map((p, k) => k).filter(k => sim.players[k].side === 'D'), O = sim.players.map((p, k) => k).filter(k => sim.players[k].side === 'O');
  const goal = sport.field.goal, fb = !!sport.kinds.route, los = sim.play.los != null ? sim.play.los : sport.los;
  let holder = sim.holderAt(t); if (holder < 0) holder = sim.holderAt(Math.min(sim.beats, Math.floor(t) + 1));
  const space = k => (D.length ? Math.min(...D.map(d => dist(P[d], P[k]))) : 99);
  // a pass leads the receiver: judge them where they'll be when the ball gets there
  const kNow = Math.floor(t), tc = t < kNow + 0.94 ? kNow + 0.94 : t + 0.5;   // the catch of this beat
  const F = sim.posAt(Math.min(sim.beats - 0.001, tc));
  const spaceAt = k => (D.length ? Math.min(...D.map(d => dist(F[d], F[k]))) : 99);
  const lane = (a, b) => (D.length ? Math.min(...D.map(d => seg(P[d], a, b))) : 99);
  const fmt = v => (v >= 50 ? 'nobody near' : v.toFixed(0) + ' ' + unit);
  const reads = [];

  if (me.side === 'O' && i === holder) {
    // pass: everyone who could catch it, by how open they are, how clean the lane is, what a catch there is
    // worth (the rim over a long swing; yards downfield), and the play's own read
    const k0 = Math.floor(t), next = sim.play.beats.slice(k0).flatMap(b => b.actions).find(a => a.who === me.id && sport.kinds[a.kind].type === 'pass' && a.kind !== 'snap');
    const designed = next ? sim.idx[next.target] : -1;
    const worth = k => {
      if (fb) return los != null ? Math.max(0, (P[i][1] - F[k][1]) / 10) * 0.6 : 0;
      const dr = dist(F[k], goal); return dr < 8 ? 1.2 : dr > 22 ? 0.55 : 0.15;
    };
    for (const k of O) {
      if (k === i || (fb && (sim.players[k].role === 'QB'))) continue;
      const sp = spaceAt(k), ln = D.length ? Math.min(...D.map(d => seg(F[d], P[i], F[k]))) : 99, far = dist(P[i], F[k]);
      if (fb && los != null && P[i][1] > los && sim.players[k].role === 'C' && sport.roster.perSide >= 7) continue;   // 7v7 center stays home
      const score = Math.min(sp, open * 2.2) / open + Math.min(ln, open * 2) / open * 0.6 - far / (fb ? 40 : 45) + worth(k) + (k === designed && sp >= open ? 1 : 0);
      reads.push({ kind: 'pass', to: k, score, text: `${fb ? 'Throw' : 'Pass'} to ${nm(k)}` + (k === designed ? ' · the play’s read' : ''), why: `${fmt(sp)} from a defender, ` + (ln >= open ? 'lane clear' : ln < 1.5 ? (fb ? 'a defender is in the lane: throw it over him' : 'a defender is in the lane: bounce it under him') : 'lane tight (' + fmt(ln) + ')') + (sp >= open ? '' : ': covered') });
    }
    if (!fb) {
      const toRim = [goal[0], goal[1] + 3], lnR = lane(P[i], toRim), dr = dist(P[i], goal);
      reads.push({ kind: 'drive', to: toRim, score: Math.min(lnR, open * 2) / open * 1.1 - 0.2, text: 'Drive the lane', why: lnR >= open ? `the lane is open (nearest defender ${fmt(lnR)} off it)` : 'the lane is crowded' });
      if (dr <= 24) { const sp = space(i); reads.push({ kind: 'shot', to: [goal[0], goal[1]], score: Math.min(sp, open * 2) / open * 1.2 - dr / 30, text: 'Take the shot', why: sp >= open ? `open look from ${dr.toFixed(0)} ft` : `contested: ${fmt(sp)} of space` }); }
    }
  } else if (me.side === 'O') {
    const sp = space(i), d = D.find(k => sim.match[k] === i), ball = holder >= 0 ? P[holder] : null;
    if (ball && d != null) {
      const watching = dist(P[d], ball) < dist(P[d], P[i]) * 0.9 && sp >= open * 0.6;
      if (watching) {
        const cut = fb ? [P[i][0] + Math.sign(goal[0] - P[i][0] || 1) * 4, P[i][1] - 6] : [goal[0] + Math.sign(P[i][0] || 1) * 2, goal[1] + 2];
        reads.push({ kind: 'cut', to: cut, score: 2.4, text: fb ? 'Break open now' : 'Cut to the rim', why: `${nm(d)} is watching the ball, not you` });
      }
    }
    const spots = (sport.autonomy && sport.autonomy.spots ? sport.autonomy.spots(sim.play, P[i], sport) : []) || [];
    let best = null, bs = -1;
    for (const s of spots) {
      if (dist(s, P[i]) < 3) continue;
      const sp2 = D.length ? Math.min(...D.map(k => dist(P[k], s))) : 20, mates = Math.min(...O.filter(k => k !== i).map(k => dist(P[k], s)));
      const v = Math.min(sp2, open * 3) + Math.min(mates, 15) * 0.4 + (ball ? Math.min(lane(ball, s), open * 2) * 0.5 : 0) - dist(s, P[i]) * 0.08;
      if (v > bs) { bs = v; best = s; }
    }
    if (best) {
      const gain = (D.length ? Math.min(...D.map(k => dist(P[k], best))) : 20) - sp;
      reads.push({ kind: 'move', to: best, score: gain > 2 ? 1.6 + gain / 10 : 0.4, text: 'Relocate to open space', why: gain > 2 ? `${fmt(gain)} more room than where you are` : 'a small step for a better angle' });
    }
    reads.push({ kind: 'stay', to: i, score: sp >= open ? 2 : 0.5, text: sp >= open ? 'Stay: you’re open, show your hands' : 'Get open: you’re covered', why: `${fmt(sp)} from the nearest defender` });
  } else {
    const m = sim.match[i], job = sim.job[i], ball = holder >= 0 ? P[holder] : null;
    if (job && job.type === 'zone') {
      reads.push({ kind: 'zone', to: i, score: 2, text: `Hold your zone (${job.zone.label})`, why: 'eyes on the quarterback, break on the throw' });
    } else if (job && job.type === 'rush') {
      reads.push({ kind: 'rush', to: holder >= 0 ? holder : i, score: 2, text: 'Rush the quarterback', why: 'go after the snap: hands up at his throwing arm' });
    } else if (m >= 0) {
      const sp = dist(P[m], P[i]);
      if (m === holder) reads.push({ kind: 'press', to: m, score: 3, text: `Pressure ${nm(m)}`, why: fb ? 'stay on his hip, play through the hands' : 'stay between him and the rim, active hands' });
      else if (ball) {
        const fromBall = dist(P[m], ball), oneAway = fromBall < (fb ? 15 : 22);
        if (!fb && dist(ball, goal) < 14 && dist(P[i], goal) < dist(P[m], goal)) reads.push({ kind: 'help', to: holder, score: 2.6, text: 'Help on the drive', why: `the ball is in the paint: stop it, then recover to ${nm(m)}` });
        if (sp > open * 1.4) reads.push({ kind: 'closeout', to: m, score: 2.4, text: `Close out to ${nm(m)}`, why: `he’s ${fmt(sp)} away: high hand, short steps` });
        reads.push(oneAway ? { kind: 'deny', to: m, score: 1.8, text: `Deny the pass to ${nm(m)}`, why: 'one pass away: hand and foot in the lane' }
          : { kind: 'sink', to: [P[i][0] * 0.6, (goal[1] + P[i][1]) / 2], score: 1.6, text: 'Sink and see both', why: `two passes away: help position, see the ball and ${nm(m)}` });
      }
    } else reads.push({ kind: 'stay', to: i, score: 1, text: 'Find your man', why: 'match up with the nearest open player' });
  }
  return reads.sort((a, b) => b.score - a.score).slice(0, 3);
}
