// The route tree, every coverage and the QB's reads work on both flag formats.
import assert from 'node:assert/strict';
import { flag5, flag7 } from '../src/sports/flag.js';
import { normalize, compile } from '../src/engine/sim.js';
import { ROUTE_TREE, applyRoute, applyCoverage, coverages, findOpen, throwTo, progression, coverageNamed } from '../src/engine/football.js';

for (const sport of [flag5, flag7]) {
  const seed = sport.plays[0];
  for (const key of Object.keys(coverages(sport))) {
    let raw = applyCoverage(seed, sport, key);
    const n0 = normalize(raw, sport); assert.ok(n0.ok && !n0.errors.length, sport.id + ' ' + key + ': ' + n0.errors);
    assert.ok(n0.play.players.filter(p => p.side === 'D').every(p => p.cover), key + ': every defender has a job');
    // every route in the tree, for every receiver
    for (const tree of ROUTE_TREE) {
      let r = raw;
      n0.play.players.filter(p => p.side === 'O' && p.id !== 'O1').forEach(p => { r = applyRoute(r, sport, p.id, tree.name, [p.x, p.y]); });
      const n = normalize(r, sport); assert.ok(n.ok && !n.errors.length, `${sport.id} ${key} ${tree.name}: ${n.errors}`);
      const sim = compile(n.play, sport);
      for (let t = 0; t < sim.beats + 1; t += 0.1) for (const q of sim.posAt(t)) assert.ok(isFinite(q[0]) && q[0] >= sport.field.x[0] && q[0] <= sport.field.x[1] && q[1] >= 0 && q[1] <= sport.field.y[1], `${tree.name} off the field`);
    }
    // reads: half field each side and full field find someone, and the throw compiles
    const sim = compile(normalize(raw, sport).play, sport);
    for (const [mode, side] of [['half', 1], ['half', -1], ['full', 1]]) {
      assert.ok(progression(sim, mode, side).length > 0, `${sport.id} ${key} ${mode} ${side}: no reads`);
      const pick = findOpen(sim, mode, side); assert.ok(pick, 'nobody to throw to');
      const thrown = normalize(throwTo(raw, sim, pick, sport), sport);
      assert.ok(thrown.ok && !thrown.errors.length, 'throw: ' + thrown.errors);
      compile(thrown.play, sport);
    }
  }
}
assert.equal(coverageNamed(flag7, 'cover two'), 'cover2');
assert.equal(coverageNamed(flag5, 'Cover 4'), 'cover3');   // 5v5 has no quarters: nearest is thirds
console.log('ok: route tree × coverages × reads on 5v5 and 7v7');

// nobody on defense crosses the line before the snap is made, and the rusher holds his depth until the count
{
  const { sports: all } = await import('../src/sports/index.js');
  const { normalize: norm, compile: comp } = await import('../src/engine/sim.js');
  let checked = 0;
  for (const sp of all()) if (sp.rush) for (const raw of sp.plays) for (const defense of [false, true]) {
    const n = norm(raw, sp), sim = comp(n.play, sp, { defense }), L = n.play.los, k = n.play.beats.findIndex(b => b.actions.some(a => a.kind === 'snap'));
    if (k < 0) continue;
    for (let t = 0; t < k + 0.94; t += 0.05) sim.players.forEach((p, j) => {
      if (p.side !== 'D') return;
      const y = sim.posAt(t)[j][1];
      if (y > L - 0.99) throw new Error(`${sp.id}/${raw.key}: ${p.id} is over the line before the snap (${(y - L).toFixed(1)} yd)`);
      if (p.role === 'R' && y > L - sp.rush.depth + 0.01) throw new Error(`${sp.id}/${raw.key}: the rusher left his ${sp.rush.depth} yd before the count`);
    });
    checked++;
  }
  console.log(`ok: ${checked} football plays keep the defense onside until the snap and the rusher at ${all().find(s => s.rush).rush.depth} yd`);
}
