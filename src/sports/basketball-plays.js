// Basketball's concept library: the ideas every youth team learns, drawn as X's and O's.
// Offense is O1–O5, defense X1–X5. Spots can be names (see SPOTS) or { x, y } in feet.

const O = (id, at, role) => ({ id: 'O' + id, side: 'O', at, role });
const X = (id, at) => ({ id: 'X' + id, side: 'D', at });
const xy = (x, y) => ({ x, y });
const FIVE_OUT = [O(1, 'top', 'point'), O(2, 'right wing'), O(3, 'left wing'), O(4, 'right corner'), O(5, 'left corner')];

export const PLAYS = [
  {
    key: 'spacing', title: 'Five Out Spacing', concept: 'Spacing',
    summary: 'Stand far apart, like stars in the sky. When two of us are close, one defender can guard both of us. Then move the ball all the way around: every pass makes the defense run.',
    cues: ['Find a spot', 'Two big steps apart', 'See the ball'],
    players: [O(1, xy(0, 30)), O(2, xy(3, 26)), O(3, xy(-3, 25)), O(4, xy(5, 22)), O(5, xy(-4, 21))], ball: 'O1',
    beats: [
      { say: 'Everybody is bunched up. One defender could guard two of us.', actions: [] },
      { say: 'Run to your spots: top, two wings, two corners.', actions: [
        { kind: 'move', who: 'O1', to: 'top' }, { kind: 'move', who: 'O2', to: 'right wing' }, { kind: 'move', who: 'O3', to: 'left wing' },
        { kind: 'move', who: 'O4', to: 'right corner' }, { kind: 'move', who: 'O5', to: 'left corner' }] },
      { say: 'O1 passes to O2 on the right wing. The whole defense has to shift.', actions: [{ kind: 'pass', who: 'O1', target: 'O2' }] },
      { say: 'O2 swings it down to O4 in the corner.', actions: [{ kind: 'pass', who: 'O2', target: 'O4' }] },
      { say: 'O4 sends it back up to O2.', actions: [{ kind: 'pass', who: 'O4', target: 'O2' }] },
      { say: 'O2 to O1 at the top.', actions: [{ kind: 'pass', who: 'O2', target: 'O1' }] },
      { say: 'O1 reverses it to O3 on the left wing. Now the defense runs the other way.', actions: [{ kind: 'pass', who: 'O1', target: 'O3' }] },
      { say: 'O3 down to O5 in the corner.', actions: [{ kind: 'pass', who: 'O3', target: 'O5' }] },
      { say: 'O5 back up to O3.', actions: [{ kind: 'pass', who: 'O5', target: 'O3' }] },
      { say: 'O3 to O1. The ball went all the way around and nobody had to come closer to catch it.', actions: [{ kind: 'pass', who: 'O3', target: 'O1' }] }
    ],
    reads: [{ who: 'O1', text: 'Lots of room to drive' }, { who: 'O4', text: 'Open corner three when the defense is late' }]
  },
  {
    key: 'give-and-go', title: 'Give and Go', concept: 'Pass and cut',
    summary: 'Pass the ball, then cut hard to the basket. Your defender turns to watch the ball, and you are gone.',
    cues: ['Pass', 'Cut hard', 'Hands up'],
    players: FIVE_OUT.concat([X(1, xy(0, 24.5)), X(2, xy(16.5, 17.5))]), ball: 'O1',
    beats: [
      { say: 'O1 passes to O2 on the wing.', actions: [{ kind: 'pass', who: 'O1', target: 'O2' }, { kind: 'slide', who: 'X1', to: xy(4, 22) }] },
      { say: 'X1 turns to watch the ball. O1 cuts hard to the basket.', actions: [
        { kind: 'cut', who: 'O1', to: xy(2, 8), via: xy(-3, 20) }, { kind: 'slide', who: 'X1', to: xy(7, 20) }] },
      { say: 'O2 passes it right back. Give, then go.', actions: [{ kind: 'pass', who: 'O2', target: 'O1' }, { kind: 'move', who: 'O1', to: xy(1, 6.5) }] },
      { say: 'Layup.', actions: [{ kind: 'shot', who: 'O1' }] }
    ],
    reads: [{ who: 'O1', text: 'Open layup' }, { who: 'O2', text: 'If X1 follows, keep it and drive' }]
  },
  {
    key: 'pick-and-roll', title: 'Pick and Roll', concept: 'Screening',
    summary: 'A teammate stands still like a wall. The dribbler runs the defender into the wall, and the wall rolls to the rim.',
    cues: ['Wide and still', 'Shoulder to shoulder', 'Roll with hands up'],
    players: [O(1, 'top'), O(5, 'right elbow'), O(2, 'right wing'), O(3, 'left wing'), O(4, 'left corner'), X(1, xy(0, 24.5)), X(5, xy(6.5, 16))], ball: 'O1',
    beats: [
      { say: 'O5 sets a screen on X1. Stand wide and still like a wall.', actions: [{ kind: 'screen', who: 'O5', to: xy(2.2, 24.5) }] },
      { say: 'O1 dribbles off the screen, shoulder to shoulder.', actions: [
        { kind: 'dribble', who: 'O1', to: xy(9, 19), via: xy(5, 27.5) }, { kind: 'slide', who: 'X5', to: xy(8, 21.5) }, { kind: 'move', who: 'X1', to: xy(1, 23.5) }] },
      { say: 'O5 rolls to the rim, hands up.', actions: [{ kind: 'roll', who: 'O5', to: xy(1.5, 9) }, { kind: 'move', who: 'O2', to: xy(21.5, 9) }] },
      { say: 'O1 hits the roller.', actions: [{ kind: 'pass', who: 'O1', target: 'O5' }] },
      { say: 'Layup.', actions: [{ kind: 'shot', who: 'O5' }] }
    ],
    reads: [{ who: 'O5', text: 'Roller wide open' }, { who: 'O1', text: 'X5 stays back: pull-up' }, { who: 'O2', text: 'Help comes: kick out' }]
  },
  {
    key: 'backdoor', title: 'Backdoor Cut', concept: 'Beat the denial',
    summary: 'When your defender is in the passing lane, step out like you want the ball, then sprint behind them to the basket.',
    cues: ['Step out', 'Plant', 'Go behind'],
    players: FIVE_OUT.concat([X(2, xy(16, 21.5))]), ball: 'O1',
    beats: [
      { say: 'X2 is in the passing lane. O2 cannot get the ball.', actions: [{ kind: 'move', who: 'O2', to: xy(20, 23) }, { kind: 'slide', who: 'X2', to: xy(16.5, 24) }] },
      { say: 'O2 plants and cuts behind X2, backdoor.', actions: [{ kind: 'cut', who: 'O2', to: xy(4, 7), via: xy(15, 15) }, { kind: 'slide', who: 'X2', to: xy(12, 18) }] },
      { say: 'O1 throws a bounce pass.', actions: [{ kind: 'pass', who: 'O1', target: 'O2' }, { kind: 'move', who: 'O2', to: xy(2, 6) }] },
      { say: 'Layup.', actions: [{ kind: 'shot', who: 'O2' }] }
    ],
    reads: [{ who: 'O2', text: 'Behind the defender, ball on time' }]
  },
  {
    key: 'handoff', title: 'Wing Screen into DHO', concept: 'Dribble handoff',
    summary: 'O1 dribbles at the wing. O2 screens, O4 runs up from the corner for the handoff, and now there are three ways to score.',
    cues: ['Dribble at it', 'Hand it, don\'t throw it', 'Roll, drift, attack'],
    players: FIVE_OUT, ball: 'O1',
    beats: [
      { say: 'O1 dribbles toward the right wing. O2 comes up to set the screen.', actions: [
        { kind: 'dribble', who: 'O1', to: xy(6, 26) }, { kind: 'screen', who: 'O2', to: xy(10, 24) }] },
      { say: 'O1 dribbles off the screen. O4 comes around from the corner for the handoff.', actions: [
        { kind: 'dribble', who: 'O1', to: xy(15, 21), via: xy(11, 27.5) }, { kind: 'curl', who: 'O4', to: xy(17.5, 18.5), via: xy(22, 13) },
        { kind: 'lift', who: 'O3', to: xy(-5, 19) }] },
      { say: 'Handoff to O4. O2 rolls to the rim. O3 has hands ready at the free throw line.', actions: [
        { kind: 'handoff', who: 'O1', target: 'O4' }, { kind: 'roll', who: 'O2', to: xy(2, 9) }, { kind: 'boxout', who: 'O5', to: xy(-9, 5) }] },
      { say: 'O4 attacks. O1 drifts in for the shot. O5 is ready for the rebound.', actions: [
        { kind: 'dribble', who: 'O4', to: xy(11, 13) }, { kind: 'drift', who: 'O1', to: xy(14, 25) }] }
    ],
    reads: [{ who: 'O4', text: 'Attack the rim or pull up' }, { who: 'O2', text: 'Roller to the basket' }, { who: 'O1', text: 'Drift for the open shot' }, { who: 'O3', text: 'Free throw line, hands ready' }]
  },
  {
    key: 'box-out', title: 'Box Out', concept: 'Rebounding',
    summary: 'When the shot goes up, find a player, put your back on them, and keep them behind you. Then go get the ball.',
    cues: ['Find', 'Hit', 'Get it'],
    players: [O(1, 'top'), O(2, 'right wing'), O(4, 'right block'), O(5, 'left block'), O(3, 'left wing'),
      X(1, xy(0, 24.5)), X(2, xy(16.5, 17.5)), X(4, xy(5, 9.5)), X(5, xy(-5, 9.5)), X(3, xy(-16.5, 17.5))], ball: 'O2',
    beats: [
      { say: 'O2 shoots. Every X finds an O.', actions: [{ kind: 'shot', who: 'O2' }] },
      { say: 'Turn, put your back on them, and sit low.', actions: [
        { kind: 'boxout', who: 'X4', to: xy(5, 8) }, { kind: 'boxout', who: 'X5', to: xy(-5, 8) }, { kind: 'boxout', who: 'X1', to: xy(0, 21.5) },
        { kind: 'boxout', who: 'X3', to: xy(-14.5, 15.5) }, { kind: 'boxout', who: 'X2', to: xy(14.5, 15.5) },
        { kind: 'move', who: 'O4', to: xy(5, 10.5) }, { kind: 'move', who: 'O5', to: xy(-5, 10.5) }] },
      { say: 'Now go get the ball.', actions: [{ kind: 'move', who: 'X4', to: xy(1.5, 6.5) }] }
    ],
    reads: [{ who: 'X4', text: 'Rebound' }]
  },
  {
    key: 'help-defense', title: 'Help Defense', concept: 'Defense',
    summary: 'If your teammate gets beat, slide over and stop the ball. When the ball gets kicked out, sprint back to your player. Every pass, everyone moves: one step toward the ball, ready to help.',
    cues: ['See ball, see your player', 'Slide, don\'t reach', 'Talk: "I got ball!"', 'Help, then recover'],
    players: [O(1, 'top'), O(2, 'right wing'), O(3, 'left wing'), O(4, 'right corner'), O(5, 'left corner'),
      X(1, xy(0, 24)), X(2, xy(15.5, 18)), X(3, xy(-10, 16)), X(4, xy(16.5, 6)), X(5, xy(-8, 6))], ball: 'O2',
    beats: [
      { say: 'Ball on the right wing. The X\'s on the far side sag toward the middle.', actions: [{ kind: 'slide', who: 'X3', to: xy(-6, 15) }, { kind: 'slide', who: 'X5', to: xy(-4, 6) }] },
      { say: 'O2 beats X2 on the baseline drive.', actions: [{ kind: 'dribble', who: 'O2', to: xy(15, 6), via: xy(20, 12) }, { kind: 'slide', who: 'X2', to: xy(17, 11) }] },
      { say: 'X5 slides over to stop the ball. X3 drops to cover the rim.', actions: [
        { kind: 'help', who: 'X5', to: xy(11, 4.5) }, { kind: 'slide', who: 'X3', to: xy(-3, 6) }, { kind: 'slide', who: 'X1', to: xy(-4, 18) }] },
      { say: 'O2 kicks it to O5, the man X5 left. X5 sprints back: high hand, short steps.', actions: [
        { kind: 'pass', who: 'O2', target: 'O5' }, { kind: 'closeout', who: 'X5', to: xy(-16.5, 6) }, { kind: 'slide', who: 'X3', to: xy(-9, 12) }] },
      { say: 'O5 swings it to O3. Everyone jumps toward the ball. O2 gets back out to the wing.', actions: [
        { kind: 'pass', who: 'O5', target: 'O3' }, { kind: 'move', who: 'O2', to: 'right wing' }] },
      { say: 'O3 to O1 at the top. The help side is the right side now.', actions: [{ kind: 'pass', who: 'O3', target: 'O1' }] },
      { say: 'O1 back to O2. Same spots as the start: run it again, the other way next.', actions: [{ kind: 'pass', who: 'O1', target: 'O2' }] }
    ],
    reads: [{ who: 'X5', text: '"I got ball!"' }, { who: 'X3', text: 'Cover the rim' }, { who: 'X5', text: 'Close out on the kick' }]
  },
  {
    key: 'fast-break', title: 'Three-Lane Fast Break', concept: 'Transition',
    summary: 'Get the rebound, then run. Ball in the middle, two runners wide, and get there before the defense does.',
    cues: ['Run wide', 'Ball in the middle', 'Stop at the line'],
    players: [O(1, xy(0, 44)), O(2, xy(16, 44)), O(3, xy(-16, 44)), X(1, xy(0, 26)), X(2, xy(-2, 13))], ball: 'O1',
    beats: [
      { say: 'Three lanes: O1 in the middle, O2 and O3 sprint wide.', actions: [
        { kind: 'dribble', who: 'O1', to: xy(0, 27) }, { kind: 'cut', who: 'O2', to: xy(17, 17) }, { kind: 'cut', who: 'O3', to: xy(-17, 17) },
        { kind: 'slide', who: 'X1', to: xy(0, 21) }] },
      { say: 'O1 stops at the free throw line. X1 has to pick one.', actions: [
        { kind: 'dribble', who: 'O1', to: xy(0, 21.5) }, { kind: 'slide', who: 'X1', to: xy(-6, 17) }, { kind: 'slide', who: 'X2', to: xy(-6, 9) }] },
      { say: 'Pass to the open lane. O2 cuts in for the layup.', actions: [{ kind: 'cut', who: 'O2', to: xy(6, 8) }, { kind: 'pass', who: 'O1', target: 'O2' }] },
      { say: 'Layup.', actions: [{ kind: 'shot', who: 'O2' }] }
    ],
    reads: [{ who: 'O2', text: 'Open lane' }, { who: 'O1', text: 'Nobody steps up: drive' }]
  }
];

// the words coaches use for each concept, so "show me a pick and roll" finds it
export const ALIASES = {
  spacing: ['spacing', 'five out', '5 out', 'spread', 'spots'],
  'give-and-go': ['give and go', 'give-and-go', 'give n go', 'pass and cut', 'pass and go'],
  'pick-and-roll': ['pick and roll', 'pick-and-roll', 'pick n roll', 'ball screen', 'screen and roll'],
  backdoor: ['backdoor', 'back door', 'back-door', 'denial'],
  handoff: ['handoff', 'hand off', 'dho', 'dribble handoff', 'wing screen'],
  'box-out': ['box out', 'boxout', 'box-out', 'rebound'],
  'help-defense': ['help defense', 'help side', 'helpside', 'defense', 'rotation'],
  'fast-break': ['fast break', 'fastbreak', 'transition', 'three lanes', '3 lanes']
};
