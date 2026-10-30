// Flag football concept libraries, drawn as X's and O's. O1 is the quarterback, O2 the center.
// Spots can be names (see spots() in flag.js) or { x, y } in yards (y 10 is the goal line).

import { FLAG5_DRAFT, FLAG5_DRAFT_ALIASES, FLAG7_DRAFT, FLAG7_DRAFT_ALIASES } from './flag-modern.js';

const xy = (x, y) => ({ x, y });

const FLAG5_SEED = [
  {
    key: 'slant-flat', title: 'Slant–Flat', concept: 'High–low read',
    summary: 'One receiver cuts across the middle (the slant), one runs to the sideline low (the flat). The QB watches the defender in between and throws to whoever he leaves open.',
    cues: ['Snap', 'Read the flat defender', 'Throw it away from him'],
    players: [
      { id: 'O1', at: 'qb' }, { id: 'O2', at: 'center' }, { id: 'O3', at: 'left wide' }, { id: 'O4', at: 'right wide' }, { id: 'O5', at: 'right slot' },
      { id: 'X1', at: 'rusher' }, { id: 'X4', at: 'right corner' }, { id: 'X5', at: xy(7, 25) }
    ], ball: 'O2', los: 30,
    beats: [
      { say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O4 runs the slant, O5 runs to the flat, O3 goes deep, O2 sits in the middle.', actions: [
        { kind: 'route', who: 'O4', path: [xy(12, 27)], to: xy(5, 22) }, { kind: 'route', who: 'O5', path: [xy(7, 29)], to: xy(13, 28) },
        { kind: 'route', who: 'O3', to: xy(-12, 13) }, { kind: 'route', who: 'O2', to: xy(0, 24) }, { kind: 'rush', who: 'X1' }] },
      { say: 'X5 jumps the flat, so O1 throws the slant to O4.', actions: [{ kind: 'cover', who: 'X5', to: xy(11, 27) }, { kind: 'throw', who: 'O1', target: 'O4' }] },
      { say: 'O4 runs to the end zone.', actions: [{ kind: 'run', who: 'O4', to: xy(3, 6) }, { kind: 'pull', who: 'X4' }] }
    ],
    reads: [{ who: 'O4', text: 'Flat defender jumps low: slant' }, { who: 'O5', text: 'Defender sits inside: flat' }]
  }
];
const FLAG5_SEED_ALIASES = { 'slant-flat': ['slant flat', 'slant and flat', 'high low', 'hi lo'] };

const FLAG7_SEED = [
  {
    key: 'smash', title: 'Smash', concept: 'Corner–hitch read',
    summary: 'Outside receiver stops short (the hitch), inside receiver runs to the back corner. The QB reads the corner defender: if he sits on the hitch, throw the corner.',
    cues: ['Hitch at 5', 'Corner to the pylon', 'Read the corner'],
    players: [
      { id: 'O1', at: 'qb' }, { id: 'O2', at: 'center' }, { id: 'O3', at: 'left wide' }, { id: 'O4', at: 'right wide' }, { id: 'O5', at: 'right slot' }, { id: 'O6', at: 'left slot' }, { id: 'O7', at: 'running back' },
      { id: 'X4', at: 'right corner' }, { id: 'X5', at: xy(8, 28) }, { id: 'X1', at: 'safety' }
    ], ball: 'O2', los: 35,
    beats: [
      { say: 'O2 snaps to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O4 runs a hitch, O5 runs the corner route, everyone else clears out.', actions: [
        { kind: 'route', who: 'O4', path: [xy(16, 30)], to: xy(15, 31) }, { kind: 'route', who: 'O5', path: [xy(8, 27)], to: xy(17, 16) },
        { kind: 'route', who: 'O3', to: xy(-16, 18) }, { kind: 'route', who: 'O6', to: xy(-6, 22) }, { kind: 'route', who: 'O7', to: xy(-12, 34) }, { kind: 'route', who: 'O2', to: xy(0, 29) }] },
      { say: 'X4 sits on the hitch. O1 throws the corner to O5.', actions: [{ kind: 'cover', who: 'X4', to: xy(15, 29) }, { kind: 'throw', who: 'O1', target: 'O5' }] },
      { say: 'O5 runs it in.', actions: [{ kind: 'run', who: 'O5', to: xy(15, 7) }] }
    ],
    reads: [{ who: 'O5', text: 'Corner sits low: throw the corner' }, { who: 'O4', text: 'Corner bails deep: throw the hitch' }]
  }
];
const FLAG7_SEED_ALIASES = { smash: ['smash', 'smash concept', 'corner hitch', 'hitch corner'] };

export const FLAG5_PLAYS = FLAG5_SEED.concat(FLAG5_DRAFT), FLAG7_PLAYS = FLAG7_SEED.concat(FLAG7_DRAFT);
export const FLAG5_ALIASES = Object.assign({}, FLAG5_SEED_ALIASES, FLAG5_DRAFT_ALIASES), FLAG7_ALIASES = Object.assign({}, FLAG7_SEED_ALIASES, FLAG7_DRAFT_ALIASES);
