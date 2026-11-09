// The best read for any player at any moment: what the engine sees right now, ranked. Pure: positions come from
// the compiled play (sim) at time t; nothing here guesses beyond the field.
//   ball handler: pass to the open man (how open, how clean the lane), drive the lane, take the open shot
//   off the ball: cut when your defender is watching the ball, relocate to the open spot, or stay and show hands
//   defense: pressure the ball, deny one pass away, help on a drive, close out to an open shooter, hold your zone
// Soccer says it the soccer way (carry it, run in behind, shoot, goal-side, close down); a net sport (rally)
// has its own reads: nobody guards anybody, every shot crosses the net (rallyReads below).
// Each read: { kind, text, why, to: player index or [x, y], score }.

const seg = (p, a, b) => {   // distance from point p to the middle of segment a–b (the passer's own defender at the start doesn't block the lane)
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, u = Math.max(0.25, Math.min(0.72, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
  return Math.hypot(a[0] + dx * u - p[0], a[1] + dy * u - p[1]);
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function bestReads(sim, sport, t, i, nameOf) {
  if (sport.rally) return rallyReads(sim, sport, t, i, nameOf);
  const nm = nameOf || (k => sim.players[k].id), P = sim.posAt(t), me = sim.players[i], open = sport.open, unit = sport.unit;
  const D = sim.players.map((p, k) => k).filter(k => sim.players[k].side === 'D'), O = sim.players.map((p, k) => k).filter(k => sim.players[k].side === 'O');
  const goal = sport.field.goal, fb = !!sport.kinds.route, soc = !!sport.pitch, los = sim.play.los != null ? sim.play.los : sport.los;
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
      const score = (soc && sim.players[k].role === 'GK' ? -0.8 : 0) + Math.min(sp, open * 2.2) / open + Math.min(ln, open * 2) / open * 0.6 - far / (fb ? 40 : 45) + worth(k) + (k === designed && sp >= open ? 1 : 0);
      reads.push({ kind: 'pass', to: k, score, text: `${fb ? 'Throw' : 'Pass'} to ${nm(k)}` + (k === designed ? ' · the play’s read' : ''), why: `${fmt(sp)} from a defender, ` + (ln >= open ? 'lane clear' : ln < 1.5 ? (fb ? 'a defender is in the lane: throw it over him' : soc ? 'a defender is in the lane: play it around him' : 'a defender is in the lane: bounce it under him') : 'lane tight (' + fmt(ln) + ')') + (sp >= open ? '' : ': covered') });
    }
    if (soc && me.role === 'GK') {
      // the keeper plays it out: the passes above are the read
    } else if (soc) {
      const ahead = [P[i][0] * 0.85, Math.max(goal[1] + 2, P[i][1] - 10)], lnA = lane(P[i], ahead), dg = dist(P[i], goal), box = sport.pitch.box + 4;
      reads.push({ kind: 'drive', to: ahead, score: Math.min(lnA, open * 2) / open * 1.05 - 0.25, text: 'Carry it forward', why: lnA >= open ? `space in front of you (nearest defender ${fmt(lnA)} off the line)` : 'the space in front is closed' });
      if (dg <= box) { const ln = lane(P[i], goal); reads.push({ kind: 'shot', to: [goal[0], goal[1]], score: Math.min(ln, open * 2) / open * 1.3 - dg / box * 0.6, text: 'Shoot', why: ln >= open * 0.6 ? `a clear look at goal from ${dg.toFixed(0)} yd` : `blocked: a defender is in the way` }); }
    } else if (!fb) {
      const toRim = [goal[0], goal[1] + 3], lnR = lane(P[i], toRim), dr = dist(P[i], goal);
      reads.push({ kind: 'drive', to: toRim, score: Math.min(lnR, open * 2) / open * 1.1 - 0.2, text: 'Drive the lane', why: lnR >= open ? `the lane is open (nearest defender ${fmt(lnR)} off it)` : 'the lane is crowded' });
      if (dr <= 24) { const sp = space(i); reads.push({ kind: 'shot', to: [goal[0], goal[1]], score: Math.min(sp, open * 2) / open * 1.2 - dr / 30, text: 'Take the shot', why: sp >= open ? `open look from ${dr.toFixed(0)} ft` : `contested: ${fmt(sp)} of space` }); }
    }
  } else if (me.side === 'O' && soc && me.role === 'GK') {
    reads.push({ kind: 'stay', to: i, score: 2, text: 'Be the outlet', why: 'stay behind your back line: the safe pass back when the ball is under pressure' });
    reads.push({ kind: 'stay', to: i, score: 1.4, text: 'Talk to your back line', why: 'you see the whole field: tell them who to pick up' });
  } else if (me.side === 'O') {
    const sp = space(i), d = D.find(k => sim.match[k] === i), ball = holder >= 0 ? P[holder] : null;
    if (ball && d != null) {
      const watching = dist(P[d], ball) < dist(P[d], P[i]) * 0.9 && sp >= open * 0.6;
      if (watching) {
        const cut = fb ? [P[i][0] + Math.sign(goal[0] - P[i][0] || 1) * 4, P[i][1] - 6] : soc ? [P[i][0] * 0.8, Math.max(goal[1] + 3, P[i][1] - 10)] : [goal[0] + Math.sign(P[i][0] || 1) * 2, goal[1] + 2];
        reads.push({ kind: 'cut', to: cut, score: 2.4, text: fb ? 'Break open now' : soc ? 'Run in behind' : 'Cut to the rim', why: `${nm(d)} is watching the ball, not you` });
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
    reads.push({ kind: 'stay', to: i, score: sp >= open ? 2 : 0.5, text: sp >= open ? (soc ? 'Stay: you’re open, show for it' : 'Stay: you’re open, show your hands') : (soc ? 'Get open: check away, then come back' : 'Get open: you’re covered'), why: `${fmt(sp)} from the nearest defender` });
  } else {
    const m = sim.match[i], job = sim.job[i], ball = holder >= 0 ? P[holder] : null;
    if (soc && (me.role === 'GK' || me.id === 'X1')) {   // X1 is the defending side's keeper
      const at = ball || goal, post = sport.pitch.goalW / 2, spot = [Math.max(-post, Math.min(post, at[0] * 0.25)), goal[1] + Math.min(4, 1 + dist(at, goal) * 0.08)];
      reads.push({ kind: 'move', to: spot, score: 2, text: 'Set your angle', why: 'on the line between the ball and the middle of the goal' });
    } else if (job && job.type === 'zone') {
      reads.push({ kind: 'zone', to: i, score: 2, text: `Hold your zone (${job.zone.label})`, why: 'eyes on the quarterback, break on the throw' });
    } else if (job && job.type === 'rush') {
      reads.push({ kind: 'rush', to: holder >= 0 ? holder : i, score: 2, text: 'Rush the quarterback', why: 'go after the snap: hands up at his throwing arm' });
    } else if (m >= 0) {
      const sp = dist(P[m], P[i]);
      if (m === holder) reads.push({ kind: 'press', to: m, score: 3, text: `Pressure ${nm(m)}`, why: fb ? 'stay on his hip, play through the hands' : soc ? 'goal-side, show him outside, don’t dive in' : 'stay between him and the rim, active hands' });
      else if (ball) {
        const fromBall = dist(P[m], ball), oneAway = fromBall < (fb ? 15 : 22);
        if (!fb && !soc && dist(ball, goal) < 14 && dist(P[i], goal) < dist(P[m], goal)) reads.push({ kind: 'help', to: holder, score: 2.6, text: 'Help on the drive', why: `the ball is in the paint: stop it, then recover to ${nm(m)}` });
        if (soc) {
          if (sp > open * 1.4) reads.push({ kind: 'closeout', to: m, score: 2.4, text: `Close down ${nm(m)}`, why: `he’s ${fmt(sp)} off you: get goal-side before the ball gets there` });
          reads.push(fromBall < 20 ? { kind: 'deny', to: m, score: 1.8, text: `Mark ${nm(m)} tight`, why: 'goal-side and ball-side: see the ball and your player' }
            : { kind: 'sink', to: [P[i][0] * 0.6, (goal[1] + P[i][1]) / 2], score: 1.6, text: 'Tuck in and see both', why: `far from the ball: get compact, cover the middle, keep ${nm(m)} in view` });
        } else {
        if (sp > open * 1.4) reads.push({ kind: 'closeout', to: m, score: 2.4, text: `Close out to ${nm(m)}`, why: `he’s ${fmt(sp)} away: high hand, short steps` });
        reads.push(oneAway ? { kind: 'deny', to: m, score: 1.8, text: `Deny the pass to ${nm(m)}`, why: 'one pass away: hand and foot in the lane' }
          : { kind: 'sink', to: [P[i][0] * 0.6, (goal[1] + P[i][1]) / 2], score: 1.6, text: 'Sink and see both', why: `two passes away: help position, see the ball and ${nm(m)}` });
        }
      }
    } else reads.push({ kind: 'stay', to: i, score: 1, text: 'Find your man', why: 'match up with the nearest open player' });
  }
  return reads.sort((a, b) => b.score - a.score).slice(0, 3);
}

// ---- a net sport (pickleball doubles): where you stand and what the other side is doing decide the shot ----
// The court runs y 0 (their baseline) … the net … our baseline; both teams are judged by their distance from the
// net, so the same reads work from either side. Nobody guards anybody, so there's no space-to-defender here.
export function courtZone(sport, y) {
  const C = sport.court, d = Math.abs(y - C.net);
  return d <= C.nvz + 1.8 ? 'kitchen line' : d >= C.L / 2 - 3 ? 'baseline' : 'transition zone';
}
function rallyReads(sim, sport, t, i, nameOf) {
  const nm = nameOf || (k => sim.players[k].id), P = sim.posAt(t), me = sim.players[i], C = sport.court, K = sport.kinds;
  const mine = k => (P[k][1] > C.net) === (P[i][1] > C.net);
  const mates = sim.players.map((p, k) => k).filter(k => k !== i && mine(k)), opp = sim.players.map((p, k) => k).filter(k => !mine(k));
  const zone = k => courtZone(sport, P[k][1]), myZone = zone(i), mate = mates[0];
  const toLine = k => [P[k][0], C.net + Math.sign(P[k][1] - C.net) * (C.nvz + 1.5)];   // a step behind your own kitchen line
  const k0 = Math.min(sim.beats - 1, Math.floor(t)), fmt = v => v.toFixed(0) + ' ' + sport.unit;
  const fill = (s, w, tg) => String(s || '').replace(/\{w\}/g, w).replace(/\{t\}/g, tg);
  // who served, so the two-bounce rule can be read: the serve and the return both bounce
  const first = (sim.play.beats[0] && sim.play.beats[0].actions || []).find(a => a.kind === 'serve'), servers = first ? sim.idx[first.who] : -1;
  const twoBounce = servers >= 0 && k0 <= 1;
  let holder = sim.holderAt(t); if (holder < 0) holder = sim.holderAt(Math.min(sim.beats, Math.floor(t) + 1));
  const next = sim.play.beats.slice(k0).flatMap(b => b.actions).find(a => K[a.kind] && (K[a.kind].type === 'hit' || K[a.kind].type === 'shot'));
  const reads = [];
  if (i === holder) {
    // the play's own shot first, then the shot this spot calls for against where they stand
    const mineNext = sim.play.beats.slice(k0).flatMap(b => b.actions).find(a => a.who === me.id && K[a.kind] && (K[a.kind].type === 'hit' || K[a.kind].type === 'shot'));
    if (mineNext) reads.push({ kind: 'pass', to: mineNext.target ? sim.idx[mineNext.target] : [0, C.net], score: 2.6, text: fill(K[mineNext.kind].job, nm(i), mineNext.target ? nm(sim.idx[mineNext.target]) : '') + ' · the play’s shot', why: K[mineNext.kind].desc.replace(/^"who" /, '').replace(/"target"/g, mineNext.target ? nm(sim.idx[mineNext.target]) : 'them').replace(/^./, c => c.toUpperCase()) });
    if (!opp.length) return reads;
    const cross = opp.slice().sort((a, b) => Math.abs(P[b][0] - P[i][0]) - Math.abs(P[a][0] - P[i][0]))[0];
    const back = opp.filter(k => zone(k) !== 'kitchen line'), atNet = opp.filter(k => zone(k) === 'kitchen line');
    if (twoBounce && k0 === 0 && !mine(servers)) {
      reads.push({ kind: 'pass', to: cross, score: 2.4, text: 'Return it deep, then come in', why: 'let the serve bounce; high and deep buys you time to reach the kitchen line' });
      reads.push({ kind: 'pass', to: cross, score: 1.2, text: 'Aim at the backhand', why: 'deep, down the middle or to the weaker side' });
    } else if (myZone === 'kitchen line') {
      reads.push({ kind: 'pass', to: cross, score: 2, text: `Dink cross-court to ${nm(cross)}`, why: 'soft and low into their kitchen: make them hit up' });
      if (back.length) reads.push({ kind: 'pass', to: back[0], score: 2.3, text: `Hit at ${nm(back[0])}’s feet`, why: `${nm(back[0])} is ${zone(back[0]) === 'baseline' ? 'back at the baseline' : 'in the transition zone'}: a low ball at the feet is the hardest shot to hit` });
      if (atNet.length === opp.length) reads.push({ kind: 'pass', to: atNet[0], score: 1.1, text: `Lob over ${nm(atNet[0])}`, why: 'both of them are crowding the net: only if you can get it deep' });
      reads.push({ kind: 'pass', to: atNet[0] != null ? atNet[0] : cross, score: 0.9, text: 'Speed it up', why: 'only a ball that sits up above the net: at the shoulder or the hip' });
    } else {
      if (atNet.length) reads.push({ kind: 'pass', to: cross, score: 2.2, text: `Drop it into their kitchen`, why: `they’re at the line: a soft drop lets you walk up behind it` });
      reads.push({ kind: 'pass', to: back[0] != null ? back[0] : cross, score: back.length ? 2.1 : 1.2, text: `Drive it at ${nm(back[0] != null ? back[0] : cross)}`, why: back.length ? `${nm(back[0])} is back: drive it deep, then come in` : 'they’re at the line: a drive gets blocked back soft' });
      reads.push({ kind: 'pass', to: cross, score: 1.3, text: 'Deep and down the middle', why: 'the safe ball: it keeps them back and splits them' });
    }
    // the play's shot already says it: drop the same shot said again
    if (mineNext) { const w = reads[0].text.split(' ')[0]; return [reads[0]].concat(reads.slice(1).filter(r => r.text.split(' ')[0] !== w).sort((a, b) => b.score - a.score)).slice(0, 3); }
  } else if (holder >= 0 && mine(holder)) {
    // your partner is hitting: move together
    if (twoBounce && sim.players[servers] && mine(servers) && myZone !== 'kitchen line')
      reads.push({ kind: 'stay', to: i, score: 2.6, text: 'Stay back', why: 'the return has to bounce (the two-bounce rule): wait for it at the baseline' });
    else if (myZone !== 'kitchen line')
      reads.push({ kind: 'move', to: toLine(i), score: 2.4, text: 'Move up to the kitchen line', why: `your partner is hitting: walk up together, split-step as they hit` });
    if (mate != null) { const gap = dist(P[i], P[mate]); reads.push({ kind: 'move', to: [P[mate][0] + Math.sign(P[i][0] - P[mate][0] || 1) * 9, P[mate][1]], score: gap > 13 ? 2 : 1.2, text: gap > 13 ? `Close the gap to ${nm(mate)}` : `Stay level with ${nm(mate)}`, why: `${fmt(gap)} apart: move like you’re tied together with a rope` }); }
    reads.push({ kind: 'stay', to: i, score: 1, text: 'Paddle up, ready', why: 'out in front, knees bent' });
  } else {
    // the other side is hitting: get set for it
    const at = next && next.target === me.id && K[next.kind] ? next : null;
    if (at && K[at.kind].recv) reads.push({ kind: 'stay', to: i, score: 2.6, text: `${K[at.kind].read || 'The ball'} is coming to you`, why: fill(K[at.kind].recv, nm(sim.idx[at.who]), nm(i)) });
    if (twoBounce && sim.players[servers] && !mine(servers) && k0 === 0 && myZone !== 'kitchen line') reads.push({ kind: 'stay', to: i, score: 2.2, text: 'Let it bounce, return it deep', why: 'the serve must bounce: a deep return buys you time to get in' });
    else if (myZone === 'transition zone') reads.push({ kind: 'stay', to: i, score: 2, text: 'Stop and split-step', why: 'they’re hitting: land balanced, then keep coming in' });
    else if (myZone === 'baseline' && !(twoBounce && mine(servers))) reads.push({ kind: 'move', to: toLine(i), score: 1.5, text: 'Get to the kitchen line', why: 'the point is won at the line' });
    if (myZone === 'kitchen line') reads.push({ kind: 'stay', to: i, score: 1.8, text: 'Paddle up at the line', why: 'block anything hard back soft; let a low one bounce' });
    reads.push({ kind: 'stay', to: i, score: 1, text: 'Watch their paddle', why: 'open and low means soft, closed and high means hard' });
  }
  return reads.sort((a, b) => b.score - a.score).slice(0, 3);
}
