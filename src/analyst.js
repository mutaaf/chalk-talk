// The analyst in the booth: instead of calling each step, explain the read. What the defense is
// in, who it's taking away, which defender gets moved, where the QB's eyes go and why the ball ends up
// where it does. Built from the engine's own picture of the play, so it's right with no AI; the AI
// (analystRequest in ai.js) can rewrite it with more colour.

import { coverages, progression, readStart, READ_STEP, separation } from './engine/football.js';

const NUMW = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
const KEY = ['Here\'s the key:', 'Watch the screen:', 'Look here:', 'This is the whole play:'];
const CLOSE = ['That\'s the read: the ball goes to the open player.', 'Make the defense run.', 'Every pass moves the defense.', 'Simple and on time.', 'See it, move it.'];

export function analyze(sim, sport, nameOf) {
  const nm = nameOf || (id => id), play = sim.play, K = sport.kinds, fb = !!K.route, soccer = /^soccer/.test(sport.id), unitWord = sport.unit === 'yd' ? 'yards' : 'feet', lines = [];
  const D = sim.players.map((p, i) => i).filter(i => sim.players[i].side === 'D');
  const defOf = ri => D.find(d => sim.match[d] === ri);
  const nearestD = (t, i) => { const P = sim.posAt(t); let b = null, bd = 1e9; D.forEach(d => { const v = Math.hypot(P[d][0] - P[i][0], P[d][1] - P[i][1]); if (v < bd) { bd = v; b = d; } }); return b == null ? null : { d: b, dist: bd }; };
  const cov = fb && play.coverage ? coverages(sport)[play.coverage] : null;

  let passN = 0, keyN = 0;
  play.beats.forEach((b, k) => {
    const out = [];
    if (k === 0 && D.length) {
      if (cov) {
        const deep = cov.jobs.filter(j => j[1] === 'zone' && /deep/i.test(j[2].label)).length, rush = cov.jobs.some(j => j[1] === 'rush');
        out.push(`Look at the shell: it's ${cov.name}. ${deep ? deep + ' deep, so ' + (deep >= 3 ? 'the seams are covered but the flats and the hooks are soft' : deep === 2 ? 'the hole is the middle of the field, between the safeties' : 'one-high, so you want to work the outside') : 'Nobody deep. Man everywhere, so somebody has to win on the route'}.${rush ? ' And they bring a rusher, so the ball has to come out on time.' : ''}`);
      } else if (fb) out.push('Defense is in man. Every receiver has a shadow, so it comes down to who wins off the line.');
      else if (soccer) out.push('Look at their shape: each X is goal-side of a player and the far side tucks in toward the ball. Watch for the moment a defender has to choose.');
      else out.push('Man to man. Every X has a player, and the help is sinking off the weak side. Keep your eye on who has to make a decision.');
    }
    // screens, from what the engine really did: who got hung up, on whose screen, and what the screener does next
    // told once, on the step the teammate actually runs off it (set one step, used the next: said on the next)
    const hungNow = D.filter(d => sim.screened[k] && sim.screened[k][d] != null && sim.match[d] >= 0 && !(sim.screened[k + 1] && sim.screened[k + 1][d] === sim.screened[k][d]));
    hungNow.forEach(d => {
      const si = sim.screened[k][d], man = sim.players[sim.match[d]].id, scr = sim.players[si].id, nb = play.beats[k + 1];
      const next = nb && nb.actions.find(a => a.who === scr && K[a.kind] && K[a.kind].type === 'move');
      const ho = b.actions.find(a => K[a.kind] && K[a.kind].type === 'handoff' && a.who === scr);
      if (ho) return;   // the handoff line says it
      const then = next && next.kind === 'roll' ? ` Then ${nm(scr)} rolls to the rim, and now the defense has two problems.` : next && next.kind === 'pop' ? ` Then ${nm(scr)} pops out for the shot, and nobody's there.` : '';
      const open = KEY[(keyN++) % KEY.length];
      out.push(`${open} ${nm(sim.players[d].id)} runs right into ${nm(scr)}'s screen. ${nm(man)} comes off shoulder to shoulder and gets a step.${then}`);
    });
    D.forEach(d => {
      const m = sim.match[d]; if (!(k > 0 && sim.beaten[k] && sim.beaten[k][d] && m >= 0 && sim.players[m].role !== 'QB' && m !== sim.holderAt(k)) || hungNow.includes(d)) return;
      const mv = b.actions.concat(k > 0 ? play.beats[k - 1].actions : []).find(a => a.who === sim.players[m].id && K[a.kind] && K[a.kind].type === 'move');
      const how = !mv ? 'move' : /cut|curl|route|dive/.test(mv.kind) ? 'cut' : /roll/.test(mv.kind) ? 'roll' : /pop/.test(mv.kind) ? 'pop' : /run|overlap/.test(mv.kind) ? 'run' : 'move';
      out.push(`Watch ${nm(sim.players[d].id)}: a step late on ${nm(sim.players[m].id)}'s ${how}. Their head turned to the ball, and now they're chasing.`);
    });
    b.actions.forEach(a => {
      const T = K[a.kind]; if (!T) return;
      if (T.type === 'pass' && a.kind !== 'snap') {
        const ri = sim.idx[a.target], tc = k + 0.94, near = D.length ? nearestD(tc, ri) : null, d = defOf(ri);
        if (fb && D.length) {
          const qb = a.who, side = Math.sign(sim.posAt(readStart(sim) + 1)[ri][0] || 1), order = progression(sim, 'half', side), n = order.indexOf(ri);
          const before = n > 0 ? order.slice(0, n).map((i, j) => { const sp = separation(sim, readStart(sim) + j * READ_STEP, i); return `${nm(sim.players[i].id)} is ${sp >= 3 ? 'open, but not on time' : sp >= 1.5 ? 'tight' : 'covered'}`; }) : [];
          out.push(n > 0 ? `${nm(qb)} starts ${side > 0 ? 'right' : 'left'}. ${before.join(', ').replace(/^./, c => c.toUpperCase())}. They work to their ${NUMW[n + 1] || 'next'} read: ${nm(a.target)}.` : `${nm(qb)} likes it right away: ${nm(a.target)} is the first read.`);
          if (near) out.push(near.dist >= sport.open ? `Why open? ${nm(sim.players[near.d].id)} is ${near.dist.toFixed(0)} yards away${cov ? ', sitting in a zone' : ', trailing the break'}. Ball out on time, that's the right read.` : `That's a tight window; ${nm(sim.players[near.d].id)} is right there. It has to be on the outside shoulder.`);
        } else if (D.length && near) {
          const dd = d != null ? sim.players[d].id : null, P = sim.posAt(tc), hold = sim.holderAt(k + 0.4);
          let why = '';
          if (d != null && hold >= 0) { const toBall = Math.hypot(P[d][0] - P[hold][0], P[d][1] - P[hold][1]), toMan = Math.hypot(P[d][0] - P[ri][0], P[d][1] - P[ri][1]); if (toBall < toMan) why = `${nm(dd)} stepped over to help on the ball, and that leaves ${nm(a.target)} alone.`; }
          if (!why && d != null && sim.screened[k] && sim.screened[k][d] != null) why = `${nm(dd)} is stuck on the screen.`;
          if (!why) why = near.dist >= sport.open * 2.2 ? `nobody within ${near.dist.toFixed(0)} ${unitWord} of ${nm(a.target)}.` : `${nm(sim.players[near.d].id)} is ${near.dist.toFixed(0)} ${unitWord} away.`;
          const st = sim.passStyle && sim.passStyle(k), close = CLOSE[(passN++) % CLOSE.length];
          out.push(`${nm(a.who)} sees it: ${why} ${st === 'bounce' ? 'Bounce pass, under the hands.' : st === 'chest' ? 'Chest pass, on a line.' : ''} ${close}`.replace(/\s+/g, ' ').trim());
        } else out.push(`${nm(a.who)} finds ${nm(a.target)}. Turn the defense on and you'll see why that's the right look.`);
      }
      if (T.type === 'shot') out.push(soccer ? `${nm(a.who)} strikes it low and early, before the keeper is set. That's what the movement bought: a clean look at goal.` : `${nm(a.who)} rises up in rhythm. That's what spacing buys you: a clean look.`);
      if (T.type === 'handoff') {
        const d = defOf(sim.idx[a.target]), wall = sport.dho && d != null ? ` ${nm(a.who)} plants and becomes a wall: ${nm(sim.players[d].id)} is stuck behind it.` : '';
        out.push(`The handoff: ${nm(a.target)} runs by and takes it out of ${nm(a.who)}'s hands at full speed.${wall} Now the defense is guarding a moving target.`);
      }
    });
    if (!out.length) out.push(b.say);
    lines.push(out.join(' '));
  });
  return lines;
}
