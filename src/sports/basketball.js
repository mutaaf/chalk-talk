// Basketball, half court, in feet. x runs sideline to sideline (−25 left … +25 right, as the
// offense faces the basket), y runs from the baseline (0) to half court (47), h is height.

import { arc, toward, clamp } from '../engine/geom.js';
import { PLAYS, ALIASES } from './basketball-plays.js';
import { MODERN, MODERN_ALIASES } from './basketball-modern.js';
import glossary from './basketball-glossary.js';
import { POSITIONS, IQ } from './basketball-positions.js';
import { COACHES } from './basketball-coaches.js';

const BASKET = [0, 5.25, 10];

const SPOTS = {
  'top': [0, 27], 'top of the key': [0, 27], 'point': [0, 27],
  'right slot': [9, 25], 'left slot': [-9, 25], 'right 45': [15, 21], 'left 45': [-15, 21],
  'right wing': [19, 19], 'left wing': [-19, 19],
  'right corner': [21.5, 3], 'left corner': [-21.5, 3],
  'right short corner': [13, 4], 'left short corner': [-13, 4],
  'right block': [6, 7], 'left block': [-6, 7],
  'right elbow': [8, 19], 'left elbow': [-8, 19],
  'free throw line': [0, 19], 'high post': [0, 19], 'nail': [0, 16],
  'right dunker': [5, 3], 'left dunker': [-5, 3],
  'middle': [0, 12], 'basket': [0, 5.25], 'rim': [0, 5.25],
  'half court': [0, 44], 'right half': [15, 40], 'left half': [-15, 40]
};

function lines() {
  const L = [], [bx, by] = BASKET;
  L.push({ p: [[-25, 0, 0], [25, 0, 0], [25, 47, 0], [-25, 47, 0], [-25, 0, 0]], w: 1 });   // boundary
  L.push({ p: [[-8, 0, 0], [-8, 19, 0], [8, 19, 0], [8, 0, 0]], w: 1.2 });                  // the lane
  L.push({ p: arc(0, 19, 6, Math.PI, 0, 28), w: 1 });                                       // free-throw circle, top half
  L.push({ p: arc(0, 19, 6, 0, Math.PI, 28), w: 0.35 });                                    // and the faint half in the lane
  const a3 = Math.asin(22 / 23.75), y3 = by + 23.75 * Math.cos(a3);
  L.push({ p: [[22, 0, 0], [22, y3, 0]].concat(arc(bx, by, 23.75, Math.PI / 2 - a3, Math.PI / 2 + a3, 60)).concat([[-22, y3, 0], [-22, 0, 0]]), w: 1.1 });
  L.push({ p: arc(0, 47, 6, Math.PI, 2 * Math.PI, 30), w: 0.8 });                           // centre circle
  L.push({ p: arc(bx, by, 4, 0, Math.PI, 20), w: 0.5 });                                    // restricted area
  for (const s of [-1, 1]) for (const y of [7, 8, 11, 14]) L.push({ p: [[s * 8, y, 0], [s * 8.9, y, 0]], w: 0.5 });
  // the hoop, standing up off the floor: backboard, square, rim
  // drawn about a third larger than life so they read on a phone
  L.push({ p: [[-4, 4, 9.2], [4, 4, 9.2], [4, 4, 13.8], [-4, 4, 13.8], [-4, 4, 9.2]], w: 1.7, warm: true });
  L.push({ p: [[-1.35, 4, 10], [-1.35, 4, 12], [1.35, 4, 12], [1.35, 4, 10]], w: 0.8, warm: true });
  L.push({ p: arc(bx, by, 1.05, 0, 2 * Math.PI, 22, 10), w: 2.6, hot: true });
  L.push({ p: [[0, 4, 10], [0, 4.2, 10]], w: 0.8, warm: true });
  return L;
}

// where a defender stands: between their player and the rim; tight on the ball, a step off one
// pass away, sagging into the lane on the help side ("see ball, see your player")
// help: the low man rotates to stop a ball that gets into the paint (and leaves his man: the kick-out)
// one pass away on the ball side: deny, a hand and a foot in the passing lane
function guard({ o, ball, onBall, help }) {
  const dist = Math.hypot(BASKET[0] - o[0], BASKET[1] - o[1]);
  if (help && !onBall) return toward(toward(ball, BASKET, 3), o, 2.5);
  let off, shade = 0;
  if (onBall) off = Math.min(3.2, dist * 0.3);
  else if (Math.sign(o[0]) === Math.sign(ball[0]) || Math.abs(o[0]) < 7) {
    off = clamp(dist * 0.28, 2.5, 5.5);
    if (Math.hypot(o[0] - ball[0], o[1] - ball[1]) < 22 && dist > 15) shade = 0.12;   // deny the next pass
  }
  else { off = clamp(dist * 0.45, 5, 10); shade = 0.22; }
  const g = toward(o, BASKET, off);
  return [g[0] + (ball[0] - g[0]) * shade, g[1] + (ball[1] - g[1]) * shade * 0.4];
}

// the perimeter and inside spots an off-ball player relocates to
const AUTO_SPOTS = ['top', 'right slot', 'left slot', 'right wing', 'left wing', 'right corner', 'left corner', 'right dunker', 'left dunker', 'right 45', 'left 45'].map(k => SPOTS[k]);

const move = (desc, extra) => Object.assign({ type: 'move', desc }, extra);
const KINDS = {
  move: move('runs to "to"'), cut: move('cuts hard to "to" (give "via" for a V-cut or a curved cut)'),
  curl: move('curls tight around a screen toward the rim', { curve: true }), drift: move('drifts to an open spot'),
  lift: move('lifts up from the corner or baseline'), pop: move('pops out after screening'), roll: move('rolls to the rim after screening'),
  slide: move('a defender slides'), closeout: move('a defender closes out to a shooter'), help: move('a defender helps to stop the ball'),
  dribble: move('the ball handler dribbles to "to"', { style: 'zigzag', dribble: true }),
  screen: move('runs to "to" and sets a screen; set "target" to the teammate being screened for', { style: 'screen' }),
  boxout: move('turns and seals for the rebound ("to" may be null)', { seal: true }),
  pass: { type: 'pass', desc: '"who" passes to "target"' }, handoff: { type: 'handoff', desc: '"who" hands the ball to "target" (they must be within 3 ft)' },
  shot: { type: 'shot', desc: '"who" shoots' }, ready: { type: 'ready', desc: 'stays put, hands ready' }
};

export default {
  id: 'basketball', name: 'Basketball', short: 'Hoops', unit: 'ft',
  roster: { perSide: 5, label: '5 on 5' },
  field: { x: [-25, 25], y: [0, 47], goal: BASKET, lines },
  view: { scale: 1 / 26, center: 23.5, tilt: 0.98, lift: -0.02 },
  mark: 1.7, screenGap: 3, open: 4.5, react: 0.3, help: { at: 13 },
  ball: { r: 0.75, held: 3.6, bounce: true, passes: 'low', offset: [1, -0.6], maxArc: 4, stretch: 1 },   // passes: chest or bounce only
  spots: SPOTS, kinds: KINDS, guard, los: null,
  autonomy: { crowd: 9, drive: 11, pressed: 0, findSpace: false, kind: 'move', spots: () => AUTO_SPOTS,
    why: { fill: 'fills the open spot', drive: 'drifts away from the drive', space: 'finds space' } },
  // playbook convention: offense is the positional number (1 point guard … 5 center) in a circle,
  // defense is an X with the number of the player it guards
  notation: {
    shape: p => (p.side === 'O' ? 'circle' : 'x'),
    inside: p => p.id.slice(1),
    name: p => (p.side === 'O' ? p.id.slice(1) : p.id)
  },
  // a dedicated brain per position: how that player thinks
  brains: p => p.side === 'D'
    ? ({ 1: 'on-ball', 2: 'wing', 3: 'wing', 4: 'big', 5: 'big' }[p.id[1]] === 'on-ball'
      ? { key: 'onball-d', name: 'On-ball defender', instincts: 'Stay between your player and the rim, hands active, call out screens early, fight over or go under on purpose, never get beat baseline.' }
      : { key: 'help-d', name: 'Help defender', instincts: 'See ball, see your player. One pass away: in the gap. Two away: in the paint at the nail or the help line. Stunt at drives, recover to shooters, box out when the shot goes up.' })
    : ({
      1: { key: 'pg', name: 'Point guard brain', instincts: 'Run the offense: read the defender guarding the ball screen (drop, hedge, ICE, switch), find the open teammate, keep your dribble alive, reverse the ball when the side is dead, never pick up the dribble in a trap.' },
      2: { key: 'sg', name: 'Shooting guard brain', instincts: 'Space to the corner or slot, be shot-ready with hands up, relocate when your defender helps, cut backdoor when overplayed, fill behind any drive.' },
      3: { key: 'wing', name: 'Wing brain', instincts: 'Lift or drift with the drive, 45-cut when your defender turns their head, replace yourself, crash weak side on shots, keep two big steps from every teammate.' },
      4: { key: 'four', name: 'Power forward brain', instincts: 'Pop for the open shot or short roll, seal your defender inside, set screens with angles that free the shooter, dive to the dunker spot when the big helps.' },
      5: { key: 'big', name: 'Center brain', instincts: 'Set wide, still screens at the right angle, roll hard with a hand up, slip when they switch or hedge hard, seal deep, rebound everything.' }
    }[p.id[1]] || { key: 'player', name: 'Player brain', instincts: 'Space, cut, fill, help.' }),
  positions: POSITIONS, iq: IQ, coaches: COACHES,
  plays: PLAYS.concat(MODERN), aliases: Object.assign({}, ALIASES, MODERN_ALIASES), glossary,
  starter: ['top', 'right wing', 'left wing', 'right corner', 'left corner'],
  ai: {
    field: `A basketball half court, in feet: x runs sideline to sideline, −25 (left) to +25 (right), as the offense faces the basket. y runs from the baseline (0) to half court (47). The basket is at (0, 5.25), the rim 10 ft up. The lane is 16 ft wide (x −8 to 8) up to the free throw line at y 19. The three-point line is 22 ft out in the corners and 23.75 ft from the basket elsewhere.`,
    rules: `Only the player with the ball can dribble, pass, hand off or shoot. Keep players 6+ ft apart unless they screen or hand off. For a handoff the two players must end up within about 3 ft of each other. Put a screen right next to the defender of the player being screened for.`,
    roles: 'PG, Wing, Shooter, Big, Screener',
    notation: 'Use positional numbering the way playbooks do: O1 is the point guard, O2 the shooting guard, O3 the small forward, O4 the power forward, O5 the center. Bigs (O4, O5) set most screens and play inside; guards (O1, O2) handle the ball. The defender of O3 is X3.'
  }
};
