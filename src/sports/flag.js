// Flag football, in yards, attacking the end zone at the far end. x runs sideline to sideline
// (negative left, as the offense faces the end zone), y runs from the back of the end zone (0):
// the goal line is at 10, and the offense lines up below the line of scrimmage (los).
//
// Two packs share this file: 5v5 (the NFL FLAG youth field, 30 × 70 yd with no-run zones)
// and 7v7 (a 40-yd-wide passing field, no rush). League rules vary; the AI is told which.

import { toward, clamp } from '../engine/geom.js';
import { FLAG5_PLAYS, FLAG5_ALIASES, FLAG7_PLAYS, FLAG7_ALIASES } from './flag-plays.js';
import glossary from './flag-glossary.js';

const move = (desc, extra) => Object.assign({ type: 'move', desc }, extra);
const KINDS = {
  move: move('runs to "to"'),
  route: move('runs a pass route to "to"; put the breaks (the stem, the cut) in "path", in order, so it breaks sharp'),
  motion: move('pre-snap motion across the formation'),
  run: move('the ball carrier runs to "to" (after a handoff, a pitch or a catch)'),
  rush: move('a defender rushes the quarterback', { chase: true }),
  cover: move('a defender covers (runs with a receiver, or to a spot)'),
  zone: move('a defender drops to a zone spot'),
  pull: move('a defender goes to pull the ball carrier\'s flag', { chase: true }),
  snap: { type: 'pass', arc: 0.08, desc: 'the center snaps the ball to "target" (the quarterback)' },
  handoff: { type: 'handoff', desc: '"who" hands the ball to "target" (they must be within 1.5 yd)' },
  pitch: { type: 'pass', arc: 0.25, desc: '"who" pitches (a backward toss) to "target"' },
  throw: { type: 'pass', arc: 1, desc: '"who" throws a pass to "target"' },
  ready: { type: 'ready', desc: 'stays put' }
};

// man coverage: a cushion off the receiver toward the end zone, shaded inside; on the ball, go get it
function guard({ o, ball, onBall, sport, start }) {
  const goal = sport.field.goal;
  if (onBall && !start) return toward(o, [o[0], goal[1]], 1);
  const cushion = start ? 5 : 2;
  const g = toward(o, [o[0] * 0.85, goal[1]], cushion);
  return [g[0] + (ball[0] - g[0]) * 0.04, g[1]];
}

function fieldLines(W, depth, opts) {
  return function (play) {
    const L = [], h = W / 2, los = play && play.los != null ? play.los : opts.los;
    L.push({ p: [[-h, depth, 0], [-h, 0, 0], [h, 0, 0], [h, depth, 0]], w: 1 });          // sidelines + end line
    L.push({ p: [[-h, 10, 0], [h, 10, 0]], w: 1.8 });                                      // the goal line
    for (let y = 15; y <= depth; y += 5) if (y !== opts.mid) L.push({ p: [[-h, y, 0], [h, y, 0]], w: 0.32 });
    if (opts.mid) L.push({ p: [[-h, opts.mid, 0], [h, opts.mid, 0]], w: 0.9 });
    for (const y of opts.noRun || []) {   // no-run zones: dashed
      for (let x = -h; x < h; x += 2) L.push({ p: [[x, y, 0], [Math.min(h, x + 1), y, 0]], w: 0.5, dots: true });
    }
    for (const x of opts.hashes || []) for (let y = 12; y <= depth; y += 1) L.push({ p: [[x - 0.4, y, 0], [x + 0.4, y, 0]], w: 0.25, dots: true });
    for (let k = -h + 2; k < h; k += 3) L.push({ p: [[k, 9.5, 0], [k + 3, 0.5, 0]].map(p => [clamp(p[0], -h, h), p[1], 0]), w: 0.14, warm: true });   // end zone hatching
    for (const [x, y] of [[-h, 10], [h, 10], [-h, 0], [h, 0]]) L.push({ p: [[x, y, 0], [x, y, 0.6]], w: 3, hot: true });   // pylons
    if (los != null) L.push({ p: [[-h, los, 0.02], [h, los, 0.02]], w: 1.3, hot: true });   // line of scrimmage
    return L;
  };
}

function spots(W, L) {
  const s = W / 30;   // spread scales with field width
  return {
    'center': [0, L + 0.6], 'snapper': [0, L + 0.6], 'qb': [0, L + 5], 'quarterback': [0, L + 5], 'shotgun': [0, L + 5],
    'running back': [2.5, L + 5.5], 'rb': [2.5, L + 5.5], 'left back': [-2.5, L + 5.5], 'right back': [2.5, L + 5.5],
    'left wide': [-12 * s, L + 1], 'right wide': [12 * s, L + 1], 'left slot': [-6 * s, L + 1.5], 'right slot': [6 * s, L + 1.5],
    'left flat': [-12 * s, L - 2], 'right flat': [12 * s, L - 2], 'left sideline': [-13.5 * s, L - 8], 'right sideline': [13.5 * s, L - 8],
    'middle': [0, L - 8], 'deep middle': [0, L - 16],
    'goal line': [0, 10], 'end zone': [0, 5], 'back of the end zone': [0, 2],
    'left pylon': [-W / 2 + 1, 10], 'right pylon': [W / 2 - 1, 10], 'left corner of the end zone': [-W / 2 + 2, 2], 'right corner of the end zone': [W / 2 - 2, 2],
    'rusher': [0, L - 7], 'left corner': [-12 * s, L - 5], 'right corner': [12 * s, L - 5], 'safety': [0, L - 12],
    'left safety': [-7 * s, L - 12], 'right safety': [7 * s, L - 12],
    'left linebacker': [-5 * s, L - 5], 'right linebacker': [5 * s, L - 5], 'middle linebacker': [0, L - 5]
  };
}

// football convention: offense in circles lettered by position (Q, C in a square, X/Z outside,
// Y/H inside, RB), defense as X's lettered by job (R rusher, CB, S, LB)
const notation = {
  shape: p => (p.side === 'D' ? 'x' : p.role === 'C' ? 'square' : 'circle'),
  inside: p => (p.role ? p.role.replace(/^QB$/, 'Q').slice(0, 2) : p.id.slice(1)),
  name: p => p.role || p.id
};
// plays without position letters get the usual ones from where players line up
function autoRoles(players, los) {
  const O = players.filter(p => p.side === 'O' && !p.role), D = players.filter(p => p.side === 'D' && !p.role);
  const qb = players.find(p => p.id === 'O1'), c = players.find(p => p.id === 'O2');
  if (qb && !qb.role) qb.role = 'QB';
  if (c && !c.role) c.role = 'C';
  const rest = O.filter(p => p !== qb && p !== c).sort((a, b) => a.x - b.x);
  const backs = rest.filter(p => los != null && p.y > los + 3), wides = rest.filter(p => backs.indexOf(p) < 0);
  backs.forEach(p => { p.role = 'RB'; });
  wides.forEach((p, i) => { p.role = i === 0 ? 'X' : i === wides.length - 1 ? 'Z' : (i === 1 ? 'Y' : 'H'); });
  D.forEach(p => {
    const deep = los != null ? los - p.y : 0;
    p.role = deep >= 9 ? 'S' : Math.abs(p.x) > 8 ? 'CB' : deep >= 6 && Math.abs(p.x) < 3 && !players.some(q => q.role === 'R') ? 'R' : 'LB';
  });
}

// receivers with nothing to run get open: settle in the nearest window away from defenders
function openSpots(play, me, sport) {
  const out = [], h = sport.field.x[1], los = play.los != null ? play.los : sport.los;
  for (let a = 0; a < 12; a++) for (const r of [3, 5]) {
    const x = me[0] + Math.cos(a / 12 * Math.PI * 2) * r, y = me[1] + Math.sin(a / 12 * Math.PI * 2) * r;
    if (Math.abs(x) < h - 1 && y > 1 && y < los + 0.5) out.push([x, y]);
  }
  return out;
}

const base = (o) => ({
  notation, autoRoles,
  autonomy: { afterSnap: 'snap', crowd: 3.5, drive: 0, pressed: 1.6, findSpace: true, kind: 'move', spots: openSpots,
    skip: p => p.role === 'QB' || p.role === 'C' || p.role === 'RB',
    why: { fill: 'spreads out from a teammate', drive: 'clears out', space: 'works open, away from the defender' } },
  unit: 'yd', field: { x: [-o.W / 2, o.W / 2], y: [0, o.depth], goal: [0, 4, 0], lines: fieldLines(o.W, o.depth, o) },
  view: { scale: 1 / (o.W / 2 + 2.5), center: o.depth / 2 + 1, tilt: 0.92, lift: -0.1 },
  mark: o.W / 30, screenGap: 1.5,
  ball: { r: 0.32 * o.W / 30, held: 1.1, bounce: false, offset: [0.45, -0.25], maxArc: 7, stretch: 1.7 },
  spots: spots(o.W, o.los), kinds: KINDS, guard, los: o.los
});

export const flag5 = Object.assign(base({ W: 30, depth: 45, los: 30, mid: 35, noRun: [15, 30] }), {
  id: 'flag5', name: 'Flag Football 5v5', short: 'Flag 5v5', roster: { perSide: 5, label: '5 on 5' },
  plays: FLAG5_PLAYS, aliases: FLAG5_ALIASES, glossary,
  starter: ['qb', 'center', 'left wide', 'right wide', 'right slot'],
  ai: {
    field: `A 5-on-5 flag football field (NFL FLAG youth style), in yards: x runs sideline to sideline, −15 (left) to +15 (right), as the offense faces the end zone. y runs from the back of the end zone (0); the goal line is y 10, midfield is y 35. The offense attacks toward y 0. The line of scrimmage is at y = los (default 30); the offense lines up at y > los, the defense at y < los. No-run zones are the 5 yards before the goal line and before midfield (y 10–15 and 30–35): only passes there.`,
    rules: `NFL FLAG rules: the center snaps to the quarterback (O1 is the QB, O2 the center unless the coach says otherwise). Everyone is eligible, the center too. No blocking, screening or picks. The quarterback can't run with the ball unless it was handed off or pitched first; a handoff or pitch must be behind the line. Usually one rusher (the official rules allow up to two), who starts 7 yards back from the line. The QB has about 7 seconds to throw. Defenders pull flags instead of tackling. Only the ball holder can hand off, pitch or throw. Keep receivers 4+ yards apart.`,
    roles: 'QB, C, X, Z, Y, H, RB, R, CB, S, LB',
    notation: 'Football lettering: O1 is the QB (role "QB"), O2 the center ("C"). Give every receiver its letter: X is the split end (usually wide left), Z the flanker (usually wide right), Y and H the inside/slot receivers, RB a back. Defenders get their job: R (the rusher), CB, S, LB. Call routes by their route-tree names (hitch, slant, out, in, curl, corner, post, go, flat, wheel, drag).'
  }
});

export const flag7 = Object.assign(base({ W: 40, depth: 50, los: 35, hashes: [-6, 6] }), {
  id: 'flag7', name: 'Flag Football 7v7', short: 'Flag 7v7', roster: { perSide: 7, label: '7 on 7' },
  plays: FLAG7_PLAYS, aliases: FLAG7_ALIASES, glossary,
  starter: ['qb', 'center', 'left wide', 'right wide', 'left slot', 'right slot', 'running back'],
  ai: {
    field: `A 7-on-7 flag/passing football field, in yards: x runs sideline to sideline, −20 (left) to +20 (right), as the offense faces the end zone. y runs from the back of the end zone (0); the goal line is y 10. The offense attacks toward y 0. The line of scrimmage is at y = los (default 35); the offense lines up at y > los, the defense at y < los. Hash marks at x ±6.`,
    rules: `7v7 rules (most leagues): the center snaps to the quarterback (O1 is the QB, O2 the center unless the coach says otherwise); in many 7v7 rulebooks the center is not eligible, so keep the center home unless the coach sends them out. No rush and no blocking: the QB has about 4 seconds to throw. Usually no running plays (handoffs only where the coach says the league allows them). Defenders cover man or zone and pull flags (or touch) the catcher. Only the ball holder can hand off, pitch or throw. Keep receivers 4+ yards apart.`,
    roles: 'QB, C, X, Z, Y, H, RB, CB, S, LB, N',
    notation: 'Football lettering: O1 is the QB (role "QB"), O2 the center ("C"). Give every receiver its letter: X is the split end (usually wide left), Z the flanker (usually wide right), Y and H the inside/slot receivers, RB a back. Defenders get their job: CB, S, LB, N (nickel). Call routes by their route-tree names (hitch, slant, out, in, curl, corner, post, go, flat, wheel, drag, seam).'
  }
});
