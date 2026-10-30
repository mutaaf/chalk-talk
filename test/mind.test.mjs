// The mind view's telemetry: for every library play of every sport, with defense on and off, at many
// moments, every player's numbers come out whole (finite, on the field, the right shape for their side),
// and the per-play facts are built once per sim.
import assert from 'node:assert/strict';
import { sports } from '../src/sports/index.js';
import { normalize, compile } from '../src/engine/sim.js';
import { facts, frame, telemetry, telemetryAll, doing, speedProfile } from '../src/engine/mind.js';

const fin = v => typeof v === 'number' && isFinite(v);
let plays = 0, samples = 0, holding = 0, flights = 0, screens = 0, beatens = 0, helps = 0;
for (const sport of sports()) for (const raw of sport.plays) for (const defense of [true, false]) {
  const sim = compile(normalize(raw, sport).play, sport, { defense }), F = facts(sim, sport), Fd = sport.field;
  assert.equal(facts(sim, sport), F, 'facts are cached per sim');
  plays++;
  sim.players.forEach((p, i) => {
    assert.ok(F.brain[i] && F.brain[i].name, `${sport.id}/${raw.key}: ${p.id} has a brain`);
    assert.ok(fin(F.cum[i][F.steps]) && F.cum[i][F.steps] >= 0);
    assert.equal(speedProfile(F, i, 40).length, 40);
  });
  for (let t = 0; t <= sim.beats + 0.5; t += 0.23) {
    const all = telemetryAll(sim, sport, t, F);
    assert.equal(all.length, sim.players.length);
    all.forEach((T, i) => {
      samples++;
      const p = sim.players[i], where = `${sport.id}/${raw.key} t=${t.toFixed(2)} ${p.id}`;
      assert.equal(T.id, p.id, where);
      assert.ok(fin(T.x) && fin(T.y) && T.x >= Fd.x[0] - 1 && T.x <= Fd.x[1] + 1 && T.y >= Fd.y[0] - 1 && T.y <= Fd.y[1] + 1, where + ' on the field');
      assert.ok(fin(T.speed) && T.speed >= 0 && T.speed < 40 * sport.mark, where + ' speed ' + T.speed);
      assert.ok(T.heading == null || (T.heading >= -180 && T.heading <= 180), where);
      assert.ok(fin(T.dist) && T.dist >= 0 && T.dist <= T.total + 1e-3, where + ' distance');
      assert.ok(typeof doing(T) === 'string' && doing(T).length, where + ' doing');
      if (T.route) assert.ok(T.route.done >= 0 && T.route.done <= 1, where);
      if (p.side === 'D') {
        assert.ok(T.def && !T.off, where);
        if (T.def.man) assert.ok(fin(T.def.toMan), where);
        if (T.def.screenedBy) screens++;
        if (T.def.beaten) beatens++;
        if (T.def.help) helps++;
      } else {
        assert.ok(T.off && !T.def, where);
        if (sim.players.some(q => q.side === 'D')) assert.ok(fin(T.off.space) && ['open', 'tight', 'covered'].includes(T.off.open), where);
        if (T.off.lane != null) assert.ok(fin(T.off.lane), where);
      }
      if (T.ball && T.ball.state === 'holding') holding++;
      if (T.ball && T.ball.state === 'air') { flights++; assert.ok(T.ball.eta >= 0, where); }
      if (T.fb && T.fb.qb) assert.ok(Array.isArray(T.fb.order), where);
    });
    // exactly one holder while the ball is held
    if (sim.holderAt(t) >= 0) assert.equal(all.filter(T => T.ball && T.ball.state === 'holding').length, 1, `${sport.id}/${raw.key} t=${t}`);
    // the single-player call agrees with the batch
    assert.equal(telemetry(sim, sport, t, 0, F, frame(sim, sport, t)).x, all[0].x);
  }
}
assert.ok(holding && flights && beatens && helps, `holding ${holding} flights ${flights} screens ${screens} beaten ${beatens} help ${helps}`);

// a 9v9 play with defense: the per-tick cost of every player's telemetry stays small
const s9 = sports().find(s => s.id === 'soccer9'), raw9 = s9.plays[0];
const sim9 = compile(normalize(raw9, s9).play, s9, { defense: true });
let t0 = performance.now(); const F9 = facts(sim9, s9); const build = performance.now() - t0;
let ticks = 0; t0 = performance.now();
for (let t = 0; t < sim9.beats; t += 0.02) { sim9.posAt(t); telemetryAll(sim9, s9, t, F9); ticks++; }
const per = (performance.now() - t0) / ticks;
console.log(`ok: mind telemetry for ${plays} plays (defense on/off), ${samples} player samples; soccer9 facts ${build.toFixed(1)} ms once, a full tick (${sim9.players.length} players) ${per.toFixed(3)} ms`);
assert.ok(per < 2, 'a telemetry tick for 18 players stays under 2 ms');
