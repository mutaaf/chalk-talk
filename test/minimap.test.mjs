// The mini map: every play in every sport draws a map with every player, every step tagged, and the step states right.
import assert from 'node:assert/strict';
import { sports } from '../src/sports/index.js';
import { normalize, compile } from '../src/engine/sim.js';
import { mapSVG, routeState } from '../src/minimap.js';

let n = 0;
for (const sport of sports()) for (const raw of sport.plays) for (const defense of [false, true]) {
  const p = normalize(raw, sport); if (!p.ok) continue;
  const sim = compile(p.play, sport, { defense }), svg = mapSVG(sim, sport);
  assert.match(svg, /^<svg viewBox="[-\d. ]+"/, raw.key);
  assert.equal((svg.match(/class="mm-p /g) || []).length, sim.players.length, raw.key + ': a mark per player');
  const offBeats = new Set(sim.routes.filter(r => r.side === 'O' && r.pts.length > 1).map(r => r.beat));
  assert.equal((svg.match(/class="mm-t"/g) || []).length, offBeats.size, raw.key + ': one number per step with offense moving');
  assert.ok(!/NaN|undefined/.test(svg), raw.key + ': clean numbers');
  n++;
}
assert.equal(routeState(0, 2, false), 'done'); assert.equal(routeState(2, 2, false), 'now'); assert.equal(routeState(3, 2, false), 'next'); assert.equal(routeState(3, 2, true), 'done');
console.log(`ok: mini map for ${n} plays across ${sports().length} sports (defense on and off)`);
