// Screens and handoffs look like the real thing, in every library play (and so in any play the AI draws):
// the screener is set before the teammate runs past; the bar lies across the runner's path; the runner's
// defender gets hung up; a handoff happens hip to hip, on the move, and the giver becomes a screen.
import assert from 'node:assert/strict';
import { sports } from '../src/sports/index.js';
import { normalize, compile } from '../src/engine/sim.js';

let screens = 0, offs = 0, dhos = 0;
const bad = [];
for (const sport of sports()) for (const raw of sport.plays) {
  const sim = compile(normalize(raw, sport).play, sport, { defense: true }), K = sport.kinds;
  sim.play.beats.forEach((b, k) => b.actions.forEach(a => {
    if (K[a.kind].style === 'screen') {
      const si = sim.idx[a.who], r = sim.routes.find(x => x.beat === k && x.p === si && x.kind === a.kind && !x.wall);
      if (!r) return;
      screens++;
      const spot = sim.posAt(k + 0.999)[si];
      // whoever runs within 5.5 of the spot this beat, at their closest
      sim.players.forEach((p, j) => {
        if (j === si || p.side !== sim.players[si].side) return;
        let bf = -1, bd = 5.5;
        for (let s = 1; s < 60; s++) { const f = s / 60, q = sim.posAt(k + f)[j], d = Math.hypot(q[0] - spot[0], q[1] - spot[1]); if (d < bd) { bd = d; bf = f; } }
        if (bf < 0) return;
        const q0 = sim.posAt(k)[j]; if (Math.hypot(q0[0] - spot[0], q0[1] - spot[1]) < 5.5) return;   // started next to it: not running off it
        offs++;
        const s = sim.posAt(k + bf)[si];
        if (Math.hypot(s[0] - spot[0], s[1] - spot[1]) > 1) bad.push(`${sport.id}/${raw.key} beat ${k + 1}: ${a.who} isn't set when ${p.id} comes by`);
      });
    }
    if (K[a.kind].type === 'handoff') {
      dhos++;
      const gi = sim.idx[a.who], ri = sim.idx[a.target];
      let bd = Infinity, bf = 0;
      for (let s = 1; s < 80; s++) { const f = s / 80, P = sim.posAt(k + f), d = Math.hypot(P[gi][0] - P[ri][0], P[gi][1] - P[ri][1]); if (d < bd) { bd = d; bf = f; } }
      if (bd > 3.2 * (sport.unit === 'ft' ? 1 : 0.5)) bad.push(`${sport.id}/${raw.key} beat ${k + 1}: handoff players never get within reach (${bd.toFixed(1)})`);
      const B = sim.ballAt(k + bf), G = sim.posAt(k + bf)[gi];
      if (Math.hypot(B[0] - G[0], B[1] - G[1]) > 3) bad.push(`${sport.id}/${raw.key} beat ${k + 1}: the ball is in the air at the handoff`);
      if (sport.dho) {
        const v = sim.posAt(k + Math.min(0.99, bf + 0.05))[ri], u = sim.posAt(k + Math.max(0, bf - 0.05))[ri];
        if (Math.hypot(v[0] - u[0], v[1] - u[1]) < 0.4) bad.push(`${sport.id}/${raw.key} beat ${k + 1}: the receiver stands still for the handoff`);
        if (!sim.routes.some(r => r.wall && r.beat === k)) bad.push(`${sport.id}/${raw.key} beat ${k + 1}: the giver doesn't become a screen`);
      }
    }
  }));
}
if (bad.length) console.log(bad.join('\n'));
assert.equal(bad.length, 0, bad.length + ' screen/handoff problems');

// the bar is the screener's shoulders: across the flex cutter's path (the cutter runs along the baseline)
{
  const sport = sports().find(s => s.id === 'basketball'), raw = sport.plays.find(p => p.key === 'flex');
  const sim = compile(normalize(raw, sport).play, sport);
  const r = sim.routes.find(x => x.beat === 1 && x.kind === 'screen'), n = r.pts.length, a = r.pts[n - 2], b = r.pts[n - 1];
  assert.ok(Math.abs(b[0] - a[0]) < Math.abs(b[1] - a[1]), 'flex screen bar stands across the baseline cut');
}
console.log(`ok: ${screens} screens set before ${offs} runs off them, bars across the path; ${dhos} handoffs hip to hip, on the move`);
