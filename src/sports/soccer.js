// Soccer, the youth small-sided formats, in yards, attacking the goal at the far end. x runs
// touchline to touchline (negative left, as the attacking team faces the goal it attacks), y runs
// from that goal line (0) back to our own goal line (the length). The halfway line is at length / 2.
// There is no line of scrimmage (los null, like basketball): the whole pitch is live.
//
// Two packs share this file (research/SOCCER.md has the sources):
//   soccer7  7v7 for U9–U10: 55 × 40 yd, 12 × 24 penalty area, goals 6.5 × 18.5 ft, a build-out line
//            halfway between the penalty area and the halfway line (opponents retreat behind it
//            while our keeper has the ball; no punting; offside only past it)
//   soccer9  9v9 for U11–U12: 75 × 50 yd, 14 × 36 penalty area, goals 7 × 21 ft, no build-out line
// League rules vary; the AI is told which. Heading is out at these ages (U.S. Soccer: none for 10 and
// under, limited in practice at 11–13), so finishes and set pieces stay on the ground or volleyed.

import { arc, toward, clamp } from '../engine/geom.js';
import { SOCCER7_PLAYS, SOCCER7_ALIASES, SOCCER9_PLAYS, SOCCER9_ALIASES } from './soccer-plays.js';

const move = (desc, extra) => Object.assign({ type: 'move', desc }, extra);
const KINDS = {
  move: move('jogs or shuffles to "to" (a small adjustment)'),
  run: move('an off-the-ball run into space to "to": in behind, across the line, into the box; give "via" to bend it so it stays onside', { curve: true }),
  check: move('checks toward the ball to show for it (come short); give "via" for check away, then check back'),
  cut: move('a sharp change of direction to lose a marker (give "via" for the first step)'),
  overlap: move('runs around the OUTSIDE of the teammate on the ball, from behind, into the space down the line; put the bend in "path"'),
  underlap: move('runs on the INSIDE of the teammate on the ball, into the channel between the full back and the center back'),
  support: move('moves to support the ball: offers an angle (a diagonal, never flat), gives width or depth'),
  dribble: move('the player on the ball dribbles to "to" (beats a defender, close control)', { style: 'zigzag', dribble: true }),
  carry: move('the player on the ball runs with it into open space at speed (big touches)', { style: 'zigzag', dribble: true }),
  press: move('a defender sprints to pressure the ball, slowing as they arrive, goal-side, showing the attacker one way', { chase: true }),
  track: move('a defender tracks a runner (stays goal-side of them) to "to"'),
  mark: move('a defender steps tight to an attacker, goal-side and ball-side'),
  cover: move('a defender takes the covering position behind and to the side of the pressing teammate (the second defender)'),
  drop: move('a defender drops back toward their own goal to get compact or delay a counter'),
  save: move('the goalkeeper sets their position: on the line between the ball and the middle of the goal, narrowing the angle'),
  pass: { type: 'pass', arc: 0.05, desc: '"who" passes along the ground to "target" (inside of the foot, to the far foot)' },
  through: { type: 'pass', arc: 0.12, desc: '"who" plays a through ball into space behind the defense for "target" to run onto' },
  switch: { type: 'pass', arc: 0.85, desc: '"who" switches play: a long diagonal ball to "target" on the far side' },
  cross: { type: 'pass', arc: 0.55, desc: '"who" crosses (or takes a corner) from wide to "target" in the box; driven low at these ages' },
  cutback: { type: 'pass', arc: 0.04, desc: '"who" pulls the ball back from the byline to "target" arriving at the edge of the six or the penalty spot' },
  flick: { type: 'pass', arc: 0.12, desc: '"who" redirects the ball first time with the foot (a flick-on or lay-off) to "target"' },
  throwin: { type: 'pass', arc: 0.6, desc: '"who" takes a throw-in from the touchline to "target" (two hands, both feet down)' },
  distribute: { type: 'pass', arc: 0.08, desc: 'the goalkeeper rolls, throws or passes it out to "target" (no punting in 7v7)' },
  clear: { type: 'pass', arc: 1, desc: '"who" clears it long, up the field, to "target"' },
  shot: { type: 'shot', desc: '"who" shoots at goal' },
  ready: { type: 'ready', desc: 'stays put: on the half-turn, body open, ready to receive' }
};

// shirt numbers, the way youth coaches draw a team: 1 keeper, 2 right back, 3 left back, 4/5 center
// backs, 6 holding mid, 8 box-to-box mid, 10 attacking mid, 7 right wing, 11 left wing, 9 striker
const SHIRT = { GK: '1', RB: '2', LB: '3', CB: '4', LCB: '5', RCB: '4', DM: '6', CM: '8', AM: '10', RW: '7', LW: '11', RM: '7', LM: '11', ST: '9', CF: '9' };
const SHIRT_WORDS = [[/keep|goalie|^gk$/, '1'], [/right ?back|^rb$|^rwb$/, '2'], [/left ?back|^lb$|^lwb$/, '3'], [/cent(er|re) ?back|^cb$|sweeper/, '4'],
  [/holding|defensive mid|^cdm$|^dm$|anchor|pivot|^six$/, '6'], [/attacking mid|^cam$|^am$|^ten$|playmaker/, '10'], [/mid|^cm$|^eight$/, '8'],
  [/right (wing|mid)|^rw$|^rm$/, '7'], [/left (wing|mid)|^lw$|^lm$/, '11'], [/strik|forward|^st$|^cf$|^nine$|target/, '9']];
export function shirtOf(role) {
  const r = String(role || '').trim();
  if (SHIRT[r.toUpperCase()]) return SHIRT[r.toUpperCase()];
  if (/^\d{1,2}$/.test(r)) return r;
  const s = r.toLowerCase(); for (const [re, n] of SHIRT_WORDS) if (re.test(s)) return n;
  return '';
}

// the pitch, drawn: touchlines, goal lines, halfway line and circle, both boxes, spots, corner arcs,
// the goals standing up off the grass (posts and crossbar, h = height) with a hint of net behind
function pitchLines(o) {
  const h = o.W / 2, L = o.L, mid = L / 2;
  return function () {
    const Ls = [];
    Ls.push({ p: [[-h, 0, 0], [h, 0, 0], [h, L, 0], [-h, L, 0], [-h, 0, 0]], w: 1 });                       // touchlines + goal lines
    Ls.push({ p: [[-h, mid, 0], [h, mid, 0]], w: 0.9 });                                                      // halfway line
    Ls.push({ p: arc(0, mid, o.circle, 0, 2 * Math.PI, 40), w: 0.8 });                                         // center circle
    Ls.push({ p: arc(0, mid, 0.25, 0, 2 * Math.PI, 8), w: 1.2 });                                              // center spot
    for (const [g, s] of [[0, 1], [L, -1]]) {                                                                  // each end: s points into the field
      const pa = o.box, pw = o.boxW / 2, ga = o.six, gw = o.sixW / 2, post = o.goalW / 2;
      Ls.push({ p: [[-pw, g, 0], [-pw, g + s * pa, 0], [pw, g + s * pa, 0], [pw, g, 0]], w: 1 });            // penalty area
      Ls.push({ p: [[-gw, g, 0], [-gw, g + s * ga, 0], [gw, g + s * ga, 0], [gw, g, 0]], w: 0.7 });          // goal area (the six)
      Ls.push({ p: arc(0, g + s * o.pen, 0.25, 0, 2 * Math.PI, 8), w: 1.2 });                                 // penalty spot
      for (const x of [-h, h]) { const a0 = x < 0 ? (s > 0 ? 0 : -Math.PI / 2) : (s > 0 ? Math.PI / 2 : Math.PI); Ls.push({ p: arc(x, g, 1, a0, a0 + Math.PI / 2, 6), w: 0.5 }); }   // corner arcs
      Ls.push({ p: [[-post, g, 0], [-post, g, o.goalH], [post, g, o.goalH], [post, g, 0]], w: 2.4, hot: g === 0, warm: g !== 0 });   // posts + crossbar
      Ls.push({ p: [[-post, g, o.goalH], [-post * 0.9, g - s * 1.4, 0.2], [post * 0.9, g - s * 1.4, 0.2], [post, g, o.goalH]], w: 0.3, warm: true });   // the net
      if (o.buildOut) {                                                                                       // build-out line: dashed
        const y = g + s * o.buildOut;
        for (let x = -h; x < h; x += 2) Ls.push({ p: [[x, y, 0], [Math.min(h, x + 1), y, 0]], w: 0.5, dots: true, warm: true });
      }
    }
    return Ls;
  };
}

// the goalkeeper's spot without the ball: on the line from the middle of the goal to the ball, a
// step or two off the line, further off when the ball is far away (the sweeper keeper)
function keeperSpot(ball, o) {
  const d = Math.hypot(ball[0], ball[1]), depth = clamp(0.8 + d * 0.06, 1, 3.2);
  const g = toward([0, 0], ball, depth);
  return [clamp(g[0], -o.goalW / 2, o.goalW / 2), Math.max(0.8, g[1])];
}

// how a defender plays an attacker: goal-side (between the attacker and our goal at y 0), tight on
// the ball, a few yards off when away from it, and shaded toward the ball so the team stays compact
// ("tuck in"). The player marking their keeper IS our keeper: they stay in goal. In 7v7, while the
// attacking keeper has the ball, everyone retreats behind the build-out line until it's released.
function guarder(o) {
  const L = o.L, keeperZone = p => p[1] > L - o.six - 4 && Math.abs(p[0]) < o.sixW / 2 + 4;
  return function guard({ o: man, ball, onBall, start }) {
    if (keeperZone(man)) return keeperSpot(start ? [0, L] : ball, o);
    const goal = [0, 0], dGoal = Math.hypot(man[0], man[1]);
    let g;
    const h = o.W / 2, corner = Math.abs(man[0]) > h - 1.2 && man[1] < 1.2, touchline = Math.abs(man[0]) > h - 0.8;
    if (onBall && !start) g = toward(man, goal, corner ? 10 : touchline ? 2.2 : clamp(dGoal * 0.05, 1.6, 2.6));   // pressure: a yard or two, goal-side (10 yd at a corner, 2 at a throw-in)
    else {
      const db = start ? 12 : Math.hypot(ball[0] - man[0], ball[1] - man[1]);
      g = toward(man, goal, start ? 3 : clamp(2 + db * 0.1, 2.6, 6));
      const s = start ? 0 : clamp(db / 70, 0.06, 0.3);
      g = [g[0] + (ball[0] - g[0]) * s, g[1] + (ball[1] - g[1]) * s * 0.35];
    }
    if (o.buildOut && !start && keeperZone(ball)) g[1] = Math.min(g[1], L - o.buildOut - 0.6);   // the build-out line
    return g;
  };
}

// off-ball attackers with nothing to do still play: crowded or marked, they find the open window
function openSpots(play, me, sport) {
  const out = [], h = sport.field.x[1], L = sport.field.y[1];
  for (let a = 0; a < 12; a++) for (const r of [3, 5]) {
    const x = me[0] + Math.cos(a / 12 * Math.PI * 2) * r, y = me[1] + Math.sin(a / 12 * Math.PI * 2) * r;
    if (Math.abs(x) < h - 1 && y > 2 && y < L - 2) out.push([x, y]);
  }
  return out;
}

// a dedicated brain per position: how that player thinks
const BRAINS = {
  1: { key: 'gk', name: 'Goalkeeper brain', instincts: 'Be the first attacker: play it short to a split back when it\'s on, wide when they press. Without the ball, stay on the line between the ball and the middle of the goal, come off it to sweep balls in behind, talk to your defenders.' },
  2: { key: 'fb', name: 'Outside back brain', instincts: 'Split wide when we have it, give width, overlap when the winger comes inside. When we lose it, get goal-side first, then press the winger or tuck in to balance.' },
  3: { key: 'fb', name: 'Outside back brain', instincts: 'Split wide when we have it, give width, overlap when the winger comes inside. When we lose it, get goal-side first, then press the winger or tuck in to balance.' },
  4: { key: 'cb', name: 'Center back brain', instincts: 'Receive on the half-turn and play forward when you can; carry into space when nobody presses. Defending: stay goal-side, cover the presser, keep the line together, never get turned.' },
  5: { key: 'cb', name: 'Center back brain', instincts: 'Receive on the half-turn and play forward when you can; carry into space when nobody presses. Defending: stay goal-side, cover the presser, keep the line together, never get turned.' },
  6: { key: 'dm', name: 'Holding midfielder brain', instincts: 'Scan before it comes, show between the lines of their press, play the way you face; drop between the center backs to build. Defending: screen the middle, cover the presser, stop the counter.' },
  8: { key: 'cm', name: 'Midfielder brain', instincts: 'Check your shoulder, get on the half-turn, play forward or switch it; arrive late in the box for the cutback. Defending: press on the trigger, recover goal-side.' },
  10: { key: 'am', name: 'Attacking midfielder brain', instincts: 'Find the pocket between their midfield and defense, receive facing forward, play the through ball or the 1-2, shoot from the top of the box.' },
  7: { key: 'w', name: 'Winger brain', instincts: 'Hold the width, receive on the outside foot, go 1v1, get to the byline and cut it back. Far side: attack the back post. Defending: track your full back.' },
  11: { key: 'w', name: 'Winger brain', instincts: 'Hold the width, receive on the outside foot, go 1v1, get to the byline and cut it back. Far side: attack the back post. Defending: track your full back.' },
  9: { key: 'st', name: 'Striker brain', instincts: 'Pin the center backs, check short to link (lay it off first time), then spin in behind on the blind side; attack the near post on crosses. Defending: press the center back on the trigger, curve your run to cut off the switch.' }
};
const DEF_BRAINS = {
  keeper: { key: 'gk-d', name: 'Keeper in goal', instincts: 'Set your feet before the shot, stand on the line from the ball to the middle of the goal, narrow the angle on a 1v1, sweep the through ball, organize your defenders.' },
  press: { key: 'press', name: 'Defender brain', instincts: 'Goal-side first. Nearest player presses (pressure), the next covers behind at an angle (cover), the far side tucks in (balance). Press on the trigger: a bad touch, a back pass, the ball going to the touchline.' }
};

function base(o) {
  const ids = o.ids, shirtById = id => ids[id.slice(1)] || id.slice(1);
  const autoRoles = players => players.forEach(p => { if (!p.role && p.side === 'O') p.role = o.roles[p.id.slice(1)] || ''; if (!p.role && p.id === 'X1') p.role = 'GK'; });
  return {
    unit: 'yd', field: { x: [-o.W / 2, o.W / 2], y: [0, o.L], goal: [0, 0, o.goalH * 0.55], lines: pitchLines(o) },
    view: { scale: 0.86 / Math.max(o.W / 2 + 2.5, o.L / 2.45), center: o.L / 2, tilt: 0.92, lift: -0.02 },   // the whole pitch, both boxes, clear of the dock
    mark: o.mark, screenGap: 1.5, open: 3, react: 0.3,
    ball: { r: 0.42, held: 0.3, bounce: false, offset: [0.3, -0.45], maxArc: 4.5, stretch: 1 },
    kinds: KINDS, guard: guarder(o), los: null, pitch: o,
    // offense in circles (the keeper in a square) numbered by shirt; defense as X's with the shirt of the
    // player they mark (X1 marks their keeper, so X1 is our keeper)
    notation: {
      shape: p => (p.side === 'D' ? 'x' : shirtOf(p.role) === '1' ? 'square' : 'circle'),
      inside: p => (p.side === 'O' ? shirtOf(p.role) || shirtById(p.id) : shirtById(p.id)),
      name: p => (p.side === 'O' ? shirtOf(p.role) || shirtById(p.id) : 'X' + shirtById(p.id))
    },
    autoRoles,
    brains: p => p.side === 'D' ? (p.id === 'X1' || shirtOf(p.role) === '1' ? DEF_BRAINS.keeper : DEF_BRAINS.press)
      : BRAINS[shirtOf(p.role) || shirtById(p.id)] || BRAINS[8],
    autonomy: { crowd: 4, drive: 0, pressed: 1.8, findSpace: true, kind: 'support', spots: openSpots,
      skip: p => shirtOf(p.role) === '1',
      why: { fill: 'spreads out: a new angle for the ball', drive: 'clears the space', space: 'moves off the marker into the open window' } }
  };
}

export const SOCCER7 = { W: 40, L: 55, box: 12, boxW: 24, six: 4, sixW: 8, pen: 8, circle: 6, goalW: 18.5 / 3, goalH: 6.5 / 3, buildOut: (12 + 27.5) / 2, mark: 1.25,
  // 2-3-1: O1 keeper, O2 right back, O3 left back, O4 the 8, O5 left wing, O6 striker, O7 right wing
  ids: { 1: '1', 2: '2', 3: '3', 4: '8', 5: '11', 6: '9', 7: '7' }, roles: { 1: 'GK', 2: 'RB', 3: 'LB', 4: 'CM', 5: 'LW', 6: 'ST', 7: 'RW' } };
export const SOCCER9 = { W: 50, L: 75, box: 14, boxW: 36, six: 5, sixW: 16, pen: 10, circle: 8, goalW: 7, goalH: 7 / 3, buildOut: null, mark: 1.5,
  // 3-2-3: O1 keeper, O2 right back, O3 left back, O4 center back, O5 the 6, O6 the 8, O7 right wing, O8 left wing, O9 striker
  ids: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '6', 6: '8', 7: '7', 8: '11', 9: '9' }, roles: { 1: 'GK', 2: 'RB', 3: 'LB', 4: 'CB', 5: 'DM', 6: 'CM', 7: 'RW', 8: 'LW', 9: 'ST' } };

// named spots coaches say; "near post" and "far post" are for a ball coming from the right (mirror for the left)
function spots(o) {
  const h = o.W / 2, L = o.L, mid = L / 2, post = o.goalW / 2, s7 = o.W === 40;
  const S = {
    'goal': [0, 1], 'goal mouth': [0, 2], 'goal line': [0, 0.5], 'left post': [-post, 1.2], 'right post': [post, 1.2],
    'near post': [post + 1.5, 4.5], 'far post': [-post - 1, 3.5], 'back post': [-post - 1, 3.5],
    'six yard box': [0, o.six - 1], 'goal area': [0, o.six - 1], 'edge of the six': [0, o.six + 0.5],
    'penalty spot': [0, o.pen], 'cutback spot': [-1, o.pen + 1], 'top of the box': [0, o.box + 1.5], 'edge of the box': [0, o.box + 1.5],
    'left half-space': [-o.boxW / 2 + 3, o.box + 3], 'right half-space': [o.boxW / 2 - 3, o.box + 3], 'left channel': [-o.boxW / 2 + 3, o.box + 3], 'right channel': [o.boxW / 2 - 3, o.box + 3],
    'left byline': [-o.boxW / 2 + 2, 2], 'right byline': [o.boxW / 2 - 2, 2], 'left corner': [-h + 0.6, 0.6], 'right corner': [h - 0.6, 0.6],
    'left wing': [-h + 4, o.box + 6], 'right wing': [h - 4, o.box + 6],
    'striker': [0, o.box + (s7 ? 7 : 10)], 'center forward': [0, o.box + (s7 ? 7 : 10)], 'attacking midfield': [0, o.box + (s7 ? 11 : 16)], 'the pocket': [0, o.box + (s7 ? 11 : 16)],
    'halfway': [0, mid], 'halfway line': [0, mid], 'center circle': [0, mid], 'center spot': [0, mid], 'kickoff': [0, mid],
    'left halfway': [-h + 5, mid], 'right halfway': [h - 5, mid], 'left touchline': [-h + 0.7, mid], 'right touchline': [h - 0.7, mid],
    'left midfield': [-h + 5, mid + 2.5], 'right midfield': [h - 5, mid + 2.5], 'center midfield': [0, mid + (s7 ? 5.5 : 9)], 'midfield': [0, mid + (s7 ? 5.5 : 9)],
    'defensive midfield': [0, mid + (s7 ? 10 : 15)],
    'top of our box': [0, L - o.box - 1.5], 'left edge of our box': [-o.boxW / 2 + 1, L - o.box + 4], 'right edge of our box': [o.boxW / 2 - 1, L - o.box + 4],
    'goalkeeper': [0, L - 2], 'keeper': [0, L - 2], 'our goal': [0, L - 1],
    'left back': [s7 ? -11 : -16, L - (s7 ? 12 : 15)], 'right back': [s7 ? 11 : 16, L - (s7 ? 12 : 15)], 'center back': [0, L - (s7 ? 11 : 13)]
  };
  if (!s7) Object.assign(S, { 'left center midfield': [-7, L - 25], 'right center midfield': [7, L - 28], 'the 6': [0, L - 22], 'the 8': [7, L - 28] });
  if (o.buildOut) Object.assign(S, { 'build-out line': [0, L - o.buildOut], 'build out line': [0, L - o.buildOut], 'their build-out line': [0, o.buildOut] });
  return S;
}

// ---- the positions guide, PitchIQ, coaching lenses, glossary ----------------------------------------
// Positions are written on the 7v7 pitch (40 × 55 yd, attacking y 0) and keyed by shirt number;
// forField() scales them to a format and gives each the id that format uses (7v7 the 9 is O6, 9v9 O9).
// Mates are keyed 'O' + shirt (the mini board draws the digits) or 'X…' for defenders.
const POS = [
  { shirt: '1', side: 'O', num: '1', shape: 'square', name: 'Goalkeeper', nick: 'The first attacker', home: [0, 52.5],
    cue: 'Split, then play it short.', job: 'Starts every attack: plays out to a back who has split wide, rolls or passes it (no punting in 7v7), and switches it when one side is crowded. Talks to the defenders all game.',
    sees: ['Which back is free once the other team backs up', 'Who is pressing, and from which side', 'The far side when everyone crowds one back'],
    does: ['Roll it to the back on the side with space', 'Get your body behind the ball, hands ready', 'Call it: "keeper!", "time!", "man on!"'],
    donts: ['Kick it long every time', 'Pass across the front of your own goal'],
    ages: { young: 'When you get the ball, wait for your friends to go wide, then roll it to the one with nobody near.', mid: 'Your backs split wide; play to the free one and follow to give him a pass back.', older: 'Read the press: if they press one back, play the other, or skip a line to the 6 who shows between their forwards.' },
    drill: { name: 'Split and roll', how: 'Two backs start at the posts and split to the edges of the box on "keeper!". A coach steps toward one; the keeper rolls to the other within three seconds.' },
    paths: [{ kind: 'pass', pts: [[0, 52.5], [-11, 47]] }],
    mates: { O2: [11, 47], O3: [-11, 47], O8: [0, 40], X11: [-8, 35] } },
  { shirt: '2', side: 'O', num: '2', name: 'Outside backs (2 / 3)', nick: 'The width from behind', home: [11, 43],
    cue: 'Split wide. Overlap.', job: 'Defends first, then gives width: splits wide on goal kicks, overlaps the winger when he cuts inside, and gets back goal-side the moment we lose it.',
    sees: ['The winger in front: inside means overlap, wide means support underneath', 'The defender between you and the winger', 'Who you mark when we lose it'],
    does: ['Split to the edge of the box on goal kicks', 'Run around the outside when the winger cuts in', 'Sprint back goal-side when we lose it'],
    donts: ['Overlap when the winger is still wide', 'Stand flat next to the center back'],
    ages: { young: 'Stay by the sideline. When your winger dribbles inside, run around the outside and shout for it.', mid: 'Overlap when the winger cuts in, and get to the end line before you cross.', older: 'Choose overlap or underlap from the winger\'s position, and keep one back home for the counter (rest defense).' },
    drill: { name: 'Overlap 2v1', how: 'Winger and back vs one defender in a channel 15 yd wide. Winger dribbles inside; back overlaps; finish with a cutback to a cone at the penalty spot.' },
    paths: [{ kind: 'move', pts: [[11, 43], [17, 30], [17, 14]] }],
    mates: { O7: [13, 22], O8: [3, 30], O9: [0, 17], X7: [12, 25] } },
  { shirt: '4', side: 'O', num: '4', only: 'soccer9', name: 'Center back', nick: 'The calm one', home: [0, 44],
    cue: 'Half-turn. Play forward.', job: 'Holds the middle at the back: receives on the half-turn, carries into space when nobody presses, plays forward when he can; defending, stays goal-side and covers the presser.',
    sees: ['Is anyone pressing you? No: carry it', 'The 6 between their forwards', 'The striker you mark when we lose it'],
    does: ['Open your body to see the whole field', 'Carry it into free space until someone comes', 'Cover behind whoever presses'],
    donts: ['Dribble at a crowd in your own half', 'Get turned by the striker'],
    ages: { young: 'Stay in the middle in front of the keeper. With the ball: if nobody is near, dribble forward.', mid: 'Receive sideways so you can see forward. Space in front? Carry it. Pressed? Play to the free back.', older: 'Break the first line: carry to draw a presser, then pass past him to the 6 or the winger he left.' },
    drill: { name: 'Carry to commit', how: 'CB carries at one defender in a 20-yd grid; when the defender steps up, pass to a target behind him. The defender may only step up once.' },
    paths: [{ kind: 'dribble', pts: [[0, 44], [0, 36]] }, { kind: 'pass', pts: [[0, 36], [-14, 28]] }],
    mates: { O2: [11, 43], O3: [-11, 43], O6: [-4, 36], O1: [0, 52.5] } },
  { shirt: '6', side: 'O', num: '6', only: 'soccer9', name: 'Holding midfielder (6)', nick: 'The connector', home: [-4, 37],
    cue: 'Scan. Show. Play forward.', job: 'Links the back to the front: shows between the opponents\' forwards, plays the way he faces, drops between the backs to build; defending, screens the middle and stops the counter.',
    sees: ['The gap between their forwards', 'Who is behind you (check your shoulder)', 'The 8 facing forward for the first-time pass'],
    does: ['Check your shoulder before the ball comes', 'Show on the side of the ball, not behind a defender', 'Play the way you face; turn only when nobody is there'],
    donts: ['Hide behind an opponent', 'Turn into pressure in the middle'],
    ages: { young: 'Stand where the passer can see you, not behind a defender. Look around before the ball comes.', mid: 'Check your shoulder twice before the pass. Nobody behind? Turn. Somebody? Play it back or to the side.', older: 'Find the line between their forwards, receive half-turned, and play first time to the third man facing forward.' },
    drill: { name: 'Shoulder-check rondo', how: '4v2 rondo with a middle player; a coach behind holds up fingers. The 6 calls the number before receiving.' },
    paths: [{ kind: 'move', pts: [[-4, 37], [-7, 41]] }, { kind: 'pass', pts: [[-7, 41], [4, 33]] }],
    mates: { O4: [0, 44], O3: [-14, 43], O8: [4, 33], X9: [-3, 42] } },
  { shirt: '8', side: 'O', num: '8', name: 'Central midfielder (8)', nick: 'Box to box', home: [3, 31],
    cue: 'Half-turn. Arrive late.', job: 'Runs the middle: receives on the half-turn and plays forward or switches it, makes the underlap and the third-man run, and arrives late in the box for the cutback. Presses on the trigger.',
    sees: ['Which side is crowded: switch it', 'The runner in behind', 'The empty penalty spot when everyone runs at goal'],
    does: ['Receive sideways-on, play forward', 'Run beyond the ball when it goes wide', 'Arrive at the penalty spot, not the six'],
    donts: ['Run into the same spot as the striker', 'Walk back when we lose it'],
    ages: { young: 'Get the ball and pass to a friend in space. When the ball goes wide, run to the middle of the big box.', mid: 'Look before it comes, play forward if you can, and arrive late at the penalty spot for the pass back.', older: 'Time the third-man run, underlap when the winger holds width, and counter-press the second we lose it.' },
    drill: { name: 'Late arrival', how: 'Winger dribbles to the byline; three runners go near post, far post and the spot. The 8 must arrive at the spot as the cutback is played.' },
    paths: [{ kind: 'move', pts: [[3, 31], [1, 20], [0, 9]] }],
    mates: { O7: [10, 3], O9: [4, 4.5], O11: [-4.5, 4], X8: [1, 15] } },
  { shirt: '7', side: 'O', num: '7', name: 'Wingers (7 / 11)', nick: 'The width', home: [15, 22],
    cue: 'Stay wide. Go 1v1.', job: 'Holds the width so the team has space inside, goes 1v1 at the full back, gets to the byline and cuts it back; the far-side winger attacks the back post. Tracks the full back on defense.',
    sees: ['Your defender\'s feet: square means go past him', 'The overlap coming from behind', 'Near post, far post and the spot in the box'],
    does: ['Receive on your outside foot, facing forward', 'Dribble to the byline, then pull it back', 'Far side? Attack the back post'],
    donts: ['Drift into the middle and crowd it', 'Cross it high into a crowd'],
    ages: { young: 'Stay by the sideline so the ball can find you. Dribble fast at goal, then pass it back across the box.', mid: 'Go at your defender. Beat him outside, get to the end line and pull it back to the spot.', older: 'Hold width until the ball is on your side, read your full back (overlap or underlap), and choose cutback, near post or far post off the defenders\' runs.' },
    drill: { name: '1v1 to the byline', how: 'Winger vs full back in a 15-yd channel. Beat him to the end line and cut back to a target at the spot within six seconds.' },
    paths: [{ kind: 'dribble', pts: [[15, 22], [13, 10], [10, 3]] }, { kind: 'pass', pts: [[10, 3], [0, 9]] }],
    mates: { O9: [4.5, 4.5], O8: [0, 9], O2: [12, 36], X7: [12, 12] } },
  { shirt: '9', side: 'O', num: '9', name: 'Striker (9)', nick: 'The finisher', home: [0, 17],
    cue: 'Check short. Spin in behind.', job: 'Pins the defenders back, checks short to link play with first-time lay-offs, spins in behind on the blind side, attacks the near post and finishes. First line of the press.',
    sees: ['The last defender\'s shoulders and feet', 'The passer\'s head: up means run now', 'Space behind the defense'],
    does: ['Come short, lay it off first time', 'Bend your run behind the defender, not straight', 'Attack the near post on every cross'],
    donts: ['Stand still waiting for the ball', 'Run offside: stay level until the pass'],
    ages: { young: 'Stay near their goal, and when your friend looks up, run past the last defender.', mid: 'Check short to get the ball, then spin behind when your defender follows.', older: 'Pin, check, spin: drag the center back out, lay it off for the third man, and time the blind-side run to the pass.' },
    drill: { name: 'Check and spin', how: 'Striker vs one center back, a server at halfway. Check short for a lay-off, or spin in behind for a through ball, read off the defender\'s position.' },
    paths: [{ kind: 'move', pts: [[0, 17], [-3, 24]] }, { kind: 'move', pts: [[-3, 24], [4, 14], [1, 7]] }],
    mates: { O8: [-4, 28], O7: [15, 22], O11: [-15, 22], X9: [0, 13] } },
  { id: 'X1', side: 'D', num: 'X', name: 'Keeper in goal', nick: 'The last line', home: [0, 1.5],
    cue: 'Set. Narrow the angle.', job: 'Without the ball the keeper stands on the line from the ball to the middle of the goal, sets before the shot, comes off the line to narrow the angle or sweep a through ball, and organizes the defense.',
    sees: ['The ball, and the line from it to the middle of the goal', 'Runners in behind your defenders', 'Who is free at the back post'],
    does: ['Set your feet as the shooter\'s head goes down', 'Come off your line on a through ball', 'Shout who presses and who covers'],
    donts: ['Stand on the goal line for every shot', 'Dive before the shot is taken'],
    ages: { young: 'Stand in the middle of the goal in front of the ball, ready like a cat, and catch it to your belly.', mid: 'Step toward the ball when it comes close to make the goal look small, and set your feet before the shot.', older: 'Position on the ball-to-center line, adjust depth to the ball\'s distance, sweep behind a high line, and command the box.' },
    drill: { name: 'Angle game', how: 'Shooters move around the box edge; the keeper shuffles to the ball-to-center line and sets before each shot. Count saves.' },
    paths: [{ kind: 'move', pts: [[0, 1.5], [2, 3]] }],
    mates: { O9: [6, 10], X9: [3, 7], X8: [-6, 7] } },
  { id: 'X3', side: 'D', num: 'X', name: 'Defender', nick: 'Pressure, cover, balance', home: [-12, 18],
    cue: 'Goal-side. Press on the trigger.', job: 'Every player defends: get goal-side first, then the nearest presses (pressure), the next covers behind at an angle (cover), the far side tucks in (balance). The team presses together on a trigger.',
    sees: ['Am I the first, second or third defender?', 'The trigger: back pass, ball to the touchline, a bad touch', 'Which way to show him: toward the touchline'],
    does: ['Sprint to goal-side when we lose it', 'Arrive slow and low, show him outside', 'Cover at an angle, two or three yards behind'],
    donts: ['Dive in and get beaten', 'Everyone chases the ball'],
    ages: { young: 'Stand between your player and our goal. If the ball comes near, go to it, then slow down.', mid: 'Closest one presses, next one backs him up. Make the dribbler go to the sideline.', older: 'Read the trigger, press as a unit, curve your run to cut off a pass, and keep the block compact as the ball moves.' },
    drill: { name: '2v2 pressure-cover', how: 'Two defenders vs two attackers in a 20 × 15 grid. One presses, one covers; switch roles on each pass. Points for forcing a backward pass.' },
    paths: [{ kind: 'move', pts: [[-12, 18], [-13.5, 20]] }],
    mates: { O11: [-15, 22], O8: [-4, 28], X9: [-8, 13] } }
];

// place the guide on a format's pitch: scale to its size, use the ids that format gives each shirt
function forField(o, id) {
  const sx = o.W / 40, sy = o.L / 55, pt = ([x, y]) => [x * sx, y * sy];
  const idOf = {}; Object.keys(o.ids).forEach(k => { idOf[o.ids[k]] = 'O' + k; });
  return POS.filter(p => (!p.only || p.only === id) && (p.side === 'D' || idOf[p.shirt])).map(p => Object.assign({}, p, {
    id: p.side === 'O' ? idOf[p.shirt] : p.id, home: pt(p.home), paths: p.paths.map(q => ({ kind: q.kind, pts: q.pts.map(pt) })),
    mates: Object.fromEntries(Object.entries(p.mates).filter(([k]) => k[0] === 'X' || idOf[k.slice(1)]).map(([k, v]) => [k, pt(v)]))
  }));
}

// PitchIQ: vectors are [vision, spacing, recognition, speed]
const IQ = {
  name: 'PitchIQ', short: 'IQ',
  dims: { vision: 'Vision (the pass)', spacing: 'Movement off the ball', recognition: 'Reading the game', speed: 'Decision speed' },
  levels: ['Rookie', 'Academy', 'First Team', 'International', 'World Class', 'Ballon d\'Or'],
  archetypes: [
    { name: 'Lionel Messi', style: 'The genius', why: 'sees the pass and the dribble before anyone else moves', v: [1, 0.3, 0.6, 0.7] },
    { name: 'Kevin De Bruyne', style: 'The through ball', why: 'finds the run in behind from anywhere on the field', v: [1, 0.1, 0.3, 0.5] },
    { name: 'Luka Modrić', style: 'The metronome', why: 'is always on the half-turn and always gives an angle', v: [0.6, 0.8, 0.7, 0.2] },
    { name: 'Rodri', style: 'The anchor', why: 'reads the danger before it happens and keeps the team in shape', v: [0.3, 0.6, 1, -0.2] },
    { name: 'Kylian Mbappé', style: 'The run in behind', why: 'times the run and decides in a flash', v: [0.1, 0.5, 0.2, 1] },
    { name: 'Bukayo Saka', style: 'The wide threat', why: 'holds the width, then attacks the space at exactly the right moment', v: [0.3, 1, 0.4, 0.4] },
    { name: 'Alexia Putellas', style: 'The complete midfielder', why: 'scans, finds the pocket and arrives in the box on time', v: [0.7, 0.6, 0.8, 0.3] }
  ]
};

// Coaching lenses: how the AI names, describes and teaches a play. Each is "inspired by" a coach's public,
// widely described philosophy and vocabulary; the AI never quotes a coach or claims to be one.
const COACHES = [
  { id: 'youth', name: 'Youth coach', note: 'Plain words, one idea per beat',
    lens: 'A patient grassroots youth soccer coach: plain words, one teaching point per beat, the "why" in kid language, lots of praise for good decisions, not just goals.' },
  { id: 'positional', name: 'Positional play', note: 'Inspired by Pep Guardiola',
    lens: 'A positional-play coach in the mold of Pep Guardiola: occupy the five vertical lanes, never two players in the same lane, receive in the half-spaces, third-man combinations, rondos as the language, rest defense behind the ball, "the ball does the running".' },
  { id: 'gegenpress', name: 'Gegenpressing', note: 'Inspired by Jürgen Klopp',
    lens: 'A high-energy pressing coach in the mold of Jürgen Klopp: counter-press the moment the ball is lost, press on clear triggers, play forward fast after winning it, full backs high and wide, intensity and togetherness.' },
  { id: 'freedom', name: 'Freedom & simplicity', note: 'Inspired by Carlo Ancelotti',
    lens: 'A calm, player-first coach in the mold of Carlo Ancelotti: a flexible shape built around the players, simple patterns done well, quick transitions, freedom in the final third.' },
  { id: 'flexible', name: 'Flexible & direct', note: 'Inspired by Emma Hayes',
    lens: 'A flexible, demanding coach in the mold of Emma Hayes: change the shape to the opponent (a back three or a back four), wing-backs who attack, direct transitions into space behind, mentality and team culture.' },
  { id: 'structured', name: 'Structured build-up', note: 'Inspired by Mikel Arteta',
    lens: 'A detail-driven coach in the mold of Mikel Arteta: rehearsed build-out patterns, inverted full backs, rotations on the wing, a high press with clear triggers, set-piece detail.' }
];

// built from research/SOCCER.md by scripts/glossary.mjs (same format as basketball-glossary.js)
const GLOSSARY = "Box / penalty area: The big rectangle in front of goal (12 × 24 yd in 7v7, 14 × 36 in 9v9) (heard as: box, the box, penalty area, the area, eighteen)\nSix / goal area: The small box at the goal (4 × 8 yd in 7v7, 5 × 16 in 9v9) (heard as: six, six yard box, the six, goal box, sex yard box)\nTop of the box / edge of the box: Just outside the penalty area, in the middle (heard as: top of the box, edge of the box, top of the area, top a the box)\nPenalty spot: 8 yd out in 7v7, 10 in 9v9: where the cutback goes (heard as: penalty spot, PK spot, the spot, penalty mark)\nNear post / far post: The post closest to / farthest from the ball (heard as: near post, far post, back post, front post, near pole, Ferpost)\nHalf-space / channel: The lane between the middle and the wing, just outside the box (heard as: half space, half-space, channel, pocket lane, half spaces)\nByline / end line: The goal line outside the goal (heard as: byline, by line, end line, goal line, buy line)\nTouchline: The sideline (heard as: touchline, touch line, sideline, side line)\nBuild-out line: 7v7: dashed line halfway between the box and halfway; opponents retreat behind it when the keeper has the ball (heard as: build out line, build-out line, build outline, bill doubt line, retreat line)\nPocket / between the lines: Space between their midfield and defense (heard as: pocket, between the lines, the hole, in the pocket)\nWall pass / 1-2 / give-and-go: Pass, run past the defender, get it back first time (heard as: wall pass, one two, 1-2, give and go, won two, one to)\nOverlap: Run around the outside of the teammate on the ball, from behind (heard as: overlap, overlapping run, over lap, overload)\nUnderlap: Run on the inside of the teammate on the ball, into the gap (heard as: underlap, under lap, inside run, under lab)\nThird-man run: A passes to B, C is already running and gets it from B first time (heard as: third man, third man run, 3rd man, third men, bird man)\nSwitch / switch of play: Move the ball from the crowded side to the open side (heard as: switch, switch play, switch the field, change the point, swing it)\nThrough ball: Pass into space behind the defenders for a runner (heard as: through ball, thru ball, through pass, threw ball, in behind)\nIn behind: The space between the last defender and the keeper (heard as: in behind, run in behind, behind them, in be hind)\nCutback / pull-back: From the byline, pass backward along the ground to a late runner (heard as: cutback, cut back, pull back, cut black)\nCross: Ball from wide into the box (driven low at these ages) (heard as: cross, cross it, crossing, Kraus)\nCheck / check to the ball: Move toward the passer to receive; check away first to make space (heard as: check, check to, check in, come short, show for it, check away)\nHalf-turn / open body: Receive sideways-on so you can see both ways and play forward (heard as: half turn, half-turn, open up, open body, side on)\nScan / check your shoulder: Look around before the ball arrives (heard as: scan, scanning, check your shoulder, shoulder check, head on a swivel)\nFirst time / one touch: Pass without stopping the ball (heard as: first time, one touch, one-touch, 1 touch)\nLay-off: A short first-time pass back or sideways to a teammate facing forward (heard as: lay off, lay it off, layoff, set it)\nCarry / run with the ball: Big touches into open space at speed (heard as: carry, carry it, drive, run with the ball, cary)\nGive width / stay wide: Wingers and backs hold the touchline to stretch the defense (heard as: width, stay wide, hold the width, give width, get wide)\nSupport / angles: Get diagonal to the ball, never flat, about 10 yards away (heard as: support, angle, show, give an angle, triangle)\nSplit (the backs): On a goal kick the backs move wide to the edges of the box (heard as: split, split wide, split the backs, spit)\nPin: A striker stays on the last defender to hold the line deep (heard as: pin, pin them, pin the back line)\nBlind side: Run behind a defender's back, where they can't see you (heard as: blind side, blindside, behind his back)\nGoal-side: Between your attacker and your goal (heard as: goal side, goal-side, goalside, get goal side)\nPressure (first defender): Nearest player closes the ball, slows on arrival, shows him one way (heard as: pressure, press, first defender, close down, closed down)\nCover (second defender): Behind and to the side of the presser, ready if he's beaten (heard as: cover, cover him, second defender, back him up)\nBalance (third defender): Far-side defenders tuck in toward the middle (heard as: balance, tuck in, tuck, third defender)\nCompact: Small distances between players and lines, close the middle (heard as: compact, stay compact, squeeze, tight, combat)\nShift: The whole team slides toward the ball side (heard as: shift, slide, shift across, move over)\nPressing trigger: The cue to press as a group: back pass, ball to the touchline, bad touch, a player facing his own goal (heard as: trigger, pressing trigger, press trigger, presting)\nCounter-press: Win it back right after losing it, within a few seconds (heard as: counter press, counterpress, gegenpress, gegen press)\nDelay: Slow the attack down so teammates can recover (heard as: delay, jockey, contain, hold him up)\nShow him outside / inside: Angle your body to force the attacker one way (heard as: show him outside, force outside, show him inside, push him wide)\nTrack: Follow a runner back (heard as: track, track back, track your runner, follow)\nCounterattack / transition: Attack fast right after winning the ball (heard as: counter, counter attack, counterattack, transition, break, fast break)\nRest defense: Players who stay back while we attack, ready for the counter (heard as: rest defense, rest defence, stay home, safety)\nGoal kick: Restart from the goal area after the ball crosses our goal line; in 7v7 the build-out line applies (heard as: goal kick, goalkick, gold kick)\nCorner (kick): Restart from the corner arc after the defense put it over its own goal line (heard as: corner, corner kick, corna, quarter)\nThrow-in: Two hands, both feet down, from the touchline (heard as: throw in, throw-in, throwing, through in)\nKickoff: Restart at the center spot (heard as: kickoff, kick off, kick-off)\nFree kick (direct / indirect): Opponents 10 yd away; indirect needs a second touch (heard as: free kick, direct, indirect, IFK)";

const AI_RULES = 'Only the player on the ball can dribble, carry, pass, cross or shoot. The ball goes to feet or into space in front of a runner; every pass goes to an open teammate. Keep attackers about 8–12 yards apart (support at angles, never in a flat line). Defenders stay goal-side (between their attacker and the goal at y 0); X1 is the defending goalkeeper (it marks their keeper, O1). No heading at these ages: crosses and corners are driven low, finishes are with the feet. Offside: an attacker can\'t be past the last defender when a teammate passes forward to them' ;

export const soccer7 = Object.assign(base(SOCCER7), {
  id: 'soccer7', name: 'Soccer 7v7', short: 'Soccer 7v7', roster: { perSide: 7, label: '7 on 7' }, startBall: 'O4',   // a blank board starts with the ball at the 8's feet
  positions: forField(SOCCER7, 'soccer7'), iq: IQ, coaches: COACHES, glossary: GLOSSARY,
  spots: spots(SOCCER7), plays: SOCCER7_PLAYS, aliases: SOCCER7_ALIASES,
  starter: ['goalkeeper', 'right back', 'left back', 'center midfield', 'left midfield', 'striker', 'right midfield'],
  ai: {
    field: `A 7v7 youth soccer pitch (U9–U10), in yards: x runs touchline to touchline, −20 (left) to +20 (right), as our team attacks. y runs from the goal we attack (goal line y 0) to our own goal line (y 55); the halfway line is y 27.5. We attack toward y 0. The penalty area is 12 yd deep and 24 wide (x −12 to 12, y 0–12), the penalty spot y 8, the goal 6 yd wide (x −3.1 to 3.1). Build-out lines are dashed at y 19.75 (their half) and y 35.25 (our half). "Near post" and "far post" in the spot list are for a ball from the right; mirror them for a ball from the left.`,
    rules: `7v7 rules (U.S. Soccer Player Development Initiatives): build-out line: when our keeper has the ball (in play or a goal kick), the opponents must retreat behind the build-out line (y < 35.25) until it's released, so draw building out short. No punting. Offside only in the last part of the field (between the far build-out line, y 19.75, and the goal line). ${AI_RULES}.`,
    roles: 'GK, RB, LB, CM, LW, RW, ST',
    notation: 'Players are drawn by shirt number in a 2-3-1: O1 is the goalkeeper (role "GK", shirt 1), O2 the right back ("RB", 2), O3 the left back ("LB", 3), O4 the center midfielder ("CM", the 8), O5 the left winger ("LW", 11), O6 the striker ("ST", the 9), O7 the right winger ("RW", 7). When the coach says "the 9" use O6, "the 8" O4, "the 11" O5, "the 7" O7. Defender Xn marks On, so X1 is the defending keeper and X6 marks the striker.'
  }
});

export const soccer9 = Object.assign(base(SOCCER9), {
  id: 'soccer9', name: 'Soccer 9v9', short: 'Soccer 9v9', roster: { perSide: 9, label: '9 on 9' }, startBall: 'O4',   // a blank board starts with the ball at the 8's feet
  positions: forField(SOCCER9, 'soccer9'), iq: IQ, coaches: COACHES, glossary: GLOSSARY,
  spots: spots(SOCCER9), plays: SOCCER9_PLAYS, aliases: SOCCER9_ALIASES,
  starter: ['goalkeeper', 'right back', 'left back', 'center back', 'left center midfield', 'right center midfield', 'right wing', 'left wing', 'striker'],
  ai: {
    field: `A 9v9 youth soccer pitch (U11–U12), in yards: x runs touchline to touchline, −25 (left) to +25 (right), as our team attacks. y runs from the goal we attack (goal line y 0) to our own goal line (y 75); the halfway line is y 37.5. We attack toward y 0. The penalty area is 14 yd deep and 36 wide (x −18 to 18, y 0–14), the penalty spot y 10, the goal 7 yd wide (x −3.5 to 3.5). "Near post" and "far post" in the spot list are for a ball from the right; mirror them for a ball from the left.`,
    rules: `9v9 rules (U.S. Soccer Player Development Initiatives): no build-out line; goal kicks and the keeper can play short or long; normal offside from the halfway line. ${AI_RULES}.`,
    roles: 'GK, RB, LB, CB, DM, CM, AM, LW, RW, ST',
    notation: 'Players are drawn by shirt number in a 3-2-3: O1 is the goalkeeper (role "GK", shirt 1), O2 the right back ("RB", 2), O3 the left back ("LB", 3), O4 the center back ("CB", 4), O5 the holding midfielder ("DM", the 6), O6 the box-to-box midfielder ("CM", the 8), O7 the right winger ("RW", 7), O8 the left winger ("LW", 11), O9 the striker ("ST", the 9). If the coach plays a 10 (attacking midfielder), give that player role "AM". Defender Xn marks On, so X1 is the defending keeper and X9 marks the striker.'
  }
});
