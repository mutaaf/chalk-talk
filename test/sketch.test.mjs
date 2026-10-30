// Hand-drawn strokes read the way a coach means them.
import assert from 'node:assert/strict';
import { getSport } from '../src/sports/index.js';
import { readStroke } from '../src/engine/sketch.js';

const bb = getSport('basketball'), f7 = getSport('flag7');
const players = [{ id: 'O1', side: 'O' }, { id: 'O2', side: 'O' }, { id: 'O5', side: 'O' }, { id: 'X1', side: 'D' }];
const P = [[0, 27], [19, 19], [8, 19], [0, 24]];
const line = (a, b, n = 20) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
const ctx = (who, holder) => ({ who: players.find(p => p.id === who), holder, players, P, spots: bb.spots, los: null });

// ball handler, straight to a teammate → pass
let r = readStroke(bb, line([0, 27], [18.5, 19.5]), ctx('O1', true));
assert.equal(r.action.kind, 'pass'); assert.equal(r.action.target, 'O2');
// ball handler, zigzag → dribble, even toward a teammate
const zig = []; for (let i = 0; i <= 40; i++) zig.push([i * 0.4, 27 - i * 0.15 + (i % 8 < 4 ? 1.2 : -1.2)]);
r = readStroke(bb, zig, ctx('O1', true));
assert.equal(r.action.kind, 'dribble');
// off-ball, ends in a T flick → screen for the nearest teammate
const t = line([8, 19], [2, 24.5]).concat(line([2, 24.5], [3.6, 26.3], 4).slice(1));
r = readStroke(bb, t, ctx('O5', false));
assert.equal(r.action.kind, 'screen', JSON.stringify(r)); assert.equal(r.action.target, 'O1');
// off-ball, to the rim → cut, snapped to a named spot
r = readStroke(bb, line([19, 19], [5.3, 6.6]), ctx('O2', false));
assert.equal(r.action.kind, 'cut'); assert.ok(r.snapped, 'snapped to a spot');
// defender → slide
r = readStroke(bb, line([0, 24], [6, 22]), ctx('X1', false));
assert.equal(r.action.kind, 'slide');
// football: a stem then an inward break reads as a slant/post family route with its name
const fplayers = [{ id: 'O1', side: 'O' }, { id: 'O4', side: 'O' }], FP = [[0, 40], [17, 36]];
const slant = line([17, 36], [17, 34], 4).concat(line([17, 34], [11, 29], 10).slice(1));
r = readStroke(f7, slant, { who: fplayers[1], holder: false, players: fplayers, P: FP, spots: {}, los: 35 });
assert.equal(r.action.kind, 'route'); assert.equal(r.action.tree, 'slant', JSON.stringify(r));
const go = line([17, 36], [17, 16]);
r = readStroke(f7, go, { who: fplayers[1], holder: false, players: fplayers, P: FP, spots: {}, los: 35 });
assert.equal(r.action.tree, 'go');
console.log('ok: strokes read as pass, dribble, screen, cut, slide, and named routes');
