// DRAFT concept library, second wave: modern actions coaches name out loud.
// Same format as src/sports/basketball-plays.js (src/sports/basketball.js has the SPOTS). Offense O1–O5, defense X1–X5. Coordinates in feet:
// x −25 (left) … +25 (right) facing the basket, y 0 (baseline) … 47 (half court), basket (0, 5.25).
// Validate: see the "Validating the draft plays" section at the bottom of research/CONCEPTS.md.

const O = (id, at, role) => ({ id: 'O' + id, side: 'O', at, role });
const X = (id, at) => ({ id: 'X' + id, side: 'D', at });
const xy = (x, y) => ({ x, y });

export const DRAFT = [
  // ---------------------------------------------------------------- on-ball: Horns
  {
    key: 'horns', title: 'Horns', concept: 'Ball screen set',
    summary: 'Two bigs stand at the elbows like a bull\'s horns. O5 screens for O1 and rolls; O4 pops out for a shot. X5 "drops" back to stop the roll, so the popper is open.',
    cues: ['Bigs on the elbows', 'Roll and pop', 'Find the open one'],
    players: [O(1, xy(0, 31), 'point'), O(4, 'left elbow'), O(5, 'right elbow'), O(2, 'right corner'), O(3, 'left corner'),
      X(1, xy(0, 27.5)), X(5, xy(7, 16.5))], ball: 'O1',
    beats: [
      { say: 'Horns: bigs on both elbows, shooters in the corners. O5 steps up and screens X1.', actions: [
        { kind: 'screen', who: 'O5', to: xy(2.5, 27.5) }, { kind: 'slide', who: 'X5', to: xy(5, 21.5) }] },
      { say: 'O1 dribbles hard off the screen, shoulder to shoulder.', actions: [
        { kind: 'dribble', who: 'O1', to: xy(11, 22), via: xy(5.5, 31.5) }, { kind: 'move', who: 'X1', to: xy(2, 25.5) },
        { kind: 'slide', who: 'X5', to: xy(8.5, 19) }] },
      { say: 'O5 rolls to the rim. O4 pops out to the top. X5 drops back to stop the roll.', actions: [
        { kind: 'roll', who: 'O5', to: xy(2, 10), via: xy(5, 20) }, { kind: 'pop', who: 'O4', to: xy(-5, 28) },
        { kind: 'slide', who: 'X5', to: xy(4.5, 13) }] },
      { say: 'O1 throws it back to O4, the popper.', actions: [{ kind: 'pass', who: 'O1', target: 'O4' }] },
      { say: 'Open shot.', actions: [{ kind: 'shot', who: 'O4' }] }
    ],
    reads: [{ who: 'O4', text: 'Popper open when X5 drops' }, { who: 'O5', text: 'X5 stays high: roller open' },
      { who: 'O1', text: 'Nobody helps: pull-up or drive' }]
  },
  {
    key: 'horns-twist', title: 'Horns Twist', concept: 'Ball screen set',
    summary: 'Two screens in a row. O1 goes one way off O4, then O5 screens again and O1 turns back the other way. The defense gets dizzy.',
    cues: ['Go one way', 'Turn back', 'Roll hard'],
    players: [O(1, xy(0, 31), 'point'), O(4, 'left elbow'), O(5, 'right elbow'), O(2, 'right corner'), O(3, 'left corner'),
      X(1, xy(0, 27.5))], ball: 'O1',
    beats: [
      { say: 'O4 steps up and screens X1 on the left.', actions: [{ kind: 'screen', who: 'O4', to: xy(-2.5, 28) }] },
      { say: 'O1 dribbles left off the screen. O4 pops out wide.', actions: [
        { kind: 'dribble', who: 'O1', to: xy(-9, 25), via: xy(-5, 31.5) }, { kind: 'slide', who: 'X1', to: xy(-7.5, 22) },
        { kind: 'pop', who: 'O4', to: xy(-16, 24) }] },
      { say: 'The twist: O5 runs over and screens X1 again.', actions: [{ kind: 'screen', who: 'O5', to: xy(-5, 23.5) }] },
      { say: 'O1 turns back to the right. O5 rolls to the rim.', actions: [
        { kind: 'dribble', who: 'O1', to: xy(6, 22), via: xy(-3, 33) }, { kind: 'move', who: 'X1', to: xy(-6, 20.5) },
        { kind: 'roll', who: 'O5', to: xy(1.5, 10), via: xy(-3, 16) }] },
      { say: 'O1 passes to O5.', actions: [{ kind: 'pass', who: 'O1', target: 'O5' }] },
      { say: 'Layup.', actions: [{ kind: 'shot', who: 'O5' }] }
    ],
    reads: [{ who: 'O5', text: 'Second roller is open' }, { who: 'O4', text: 'Help comes: shot from the wing' }]
  },
  // ---------------------------------------------------------------- on-ball: Spain
  {
    key: 'spain-pnr', title: 'Spain Pick and Roll', concept: 'Ball screen + back screen',
    summary: 'A pick and roll with a surprise. While O5 rolls, O2 sneaks behind X5 and screens him, so X5 can\'t catch the roller. Then O2 pops out for a shot.',
    cues: ['Screen, roll', 'Screen the helper', 'Pop for three'],
    players: [O(1, xy(0, 31), 'point'), O(5, xy(0, 19)), O(2, xy(0, 12)), O(3, 'left corner'), O(4, 'right corner'),
      X(1, xy(0, 27.5)), X(5, xy(0, 16))], ball: 'O1',
    beats: [
      { say: 'O5 sprints up and screens X1. O2 waits in the lane.', actions: [
        { kind: 'screen', who: 'O5', to: xy(2.5, 27.5) }, { kind: 'slide', who: 'X5', to: xy(2, 22) }] },
      { say: 'O1 dribbles off the screen. O2 sneaks up behind X5.', actions: [
        { kind: 'dribble', who: 'O1', to: xy(10, 23), via: xy(5.5, 31.5) }, { kind: 'move', who: 'X1', to: xy(2, 25.5) },
        { kind: 'slide', who: 'X5', to: xy(5, 23) }, { kind: 'screen', who: 'O2', to: xy(4, 20.5) }] },
      { say: 'O5 rolls right past O2. X5 runs into O2\'s back screen.', actions: [
        { kind: 'roll', who: 'O5', to: xy(1.5, 9), via: xy(1, 18) }, { kind: 'move', who: 'X5', to: xy(5.5, 21.5) }] },
      { say: 'O1 hits the roller. O2 pops out for three.', actions: [
        { kind: 'pass', who: 'O1', target: 'O5' }, { kind: 'pop', who: 'O2', to: xy(-8, 25.5) }] },
      { say: 'Layup.', actions: [{ kind: 'shot', who: 'O5' }] }
    ],
    reads: [{ who: 'O5', text: 'Roller free behind the back screen' }, { who: 'O2', text: 'X1 helps: open three' }]
  },
  // ---------------------------------------------------------------- off-ball into DHO
  {
    key: 'chicago', title: 'Chicago Action', concept: 'Pin-down into handoff',
    summary: 'O4 runs down and screens for O2 in the corner (a pin-down). O2 runs up and takes a handoff from O5. Two screens in a row, so X2 is always behind.',
    cues: ['Pin down', 'Run to the ball', 'Turn the corner'],
    players: [O(5, 'top', 'big'), O(4, 'right wing'), O(2, 'right corner'), O(1, 'left wing'), O(3, 'left corner'),
      X(2, xy(18.5, 5))], ball: 'O5',
    beats: [
      { say: 'O4 runs down and sets a pin-down screen on X2. O5 dribbles toward the right slot.', actions: [
        { kind: 'screen', who: 'O4', to: xy(17.5, 8) }, { kind: 'dribble', who: 'O5', to: xy(8, 25) }] },
      { say: 'O2 runs up off the screen and curves toward O5.', actions: [
        { kind: 'cut', who: 'O2', to: xy(10, 23.5), via: xy(19, 13) }, { kind: 'move', who: 'X2', to: xy(16, 10.5) }] },
      { say: 'Handoff. O4 fills the corner.', actions: [
        { kind: 'handoff', who: 'O5', target: 'O2' }, { kind: 'move', who: 'O4', to: xy(21.5, 4) }] },
      { say: 'O2 attacks downhill. O5 rolls to the rim.', actions: [
        { kind: 'dribble', who: 'O2', to: xy(6, 15) }, { kind: 'roll', who: 'O5', to: xy(-1, 9) },
        { kind: 'move', who: 'X2', to: xy(9, 18) }] },
      { say: 'Pull-up jumper.', actions: [{ kind: 'shot', who: 'O2' }] }
    ],
    reads: [{ who: 'O2', text: 'X2 trails: pull up or drive' }, { who: 'O5', text: 'Help comes: roller open' },
      { who: 'O2', text: 'X2 cheats over the top: backdoor' }]
  },
  {
    key: 'zoom', title: 'Elbow Zoom', concept: 'Pin-down into handoff',
    summary: 'O2 starts under the basket. O4 screens down at the elbow, O2 zooms up and grabs a handoff from O5 at the top, then drives. Lots of coaches use Zoom and Chicago for the same idea.',
    cues: ['Screen down', 'Zoom up', 'Hand it, roll'],
    players: [O(1, xy(0, 28), 'point'), O(2, 'left block'), O(4, 'left elbow'), O(5, 'right slot', 'big'), O(3, 'right corner'),
      X(2, xy(-4.5, 9))], ball: 'O1',
    beats: [
      { say: 'O1 passes to O5, then cuts to the left corner.', actions: [
        { kind: 'pass', who: 'O1', target: 'O5' }, { kind: 'cut', who: 'O1', to: xy(-21.5, 4), via: xy(-1, 13) }] },
      { say: 'O4 screens down for O2.', actions: [{ kind: 'screen', who: 'O4', to: xy(-5, 12) }] },
      { say: 'O2 zooms up around the screen toward O5, who dribbles to meet him.', actions: [
        { kind: 'cut', who: 'O2', to: xy(3, 24), via: xy(-10, 18) }, { kind: 'dribble', who: 'O5', to: xy(5, 25.5) },
        { kind: 'move', who: 'X2', to: xy(-4, 15) }] },
      { say: 'Handoff to O2. O4 pops out to the left wing.', actions: [
        { kind: 'handoff', who: 'O5', target: 'O2' }, { kind: 'pop', who: 'O4', to: xy(-17, 20) },
        { kind: 'move', who: 'X2', to: xy(0, 21) }] },
      { say: 'O2 turns the corner and drives. O5 rolls.', actions: [
        { kind: 'dribble', who: 'O2', to: xy(3, 9) }, { kind: 'roll', who: 'O5', to: xy(-4, 11) }] },
      { say: 'Layup.', actions: [{ kind: 'shot', who: 'O2' }] }
    ],
    reads: [{ who: 'O2', text: 'Downhill: layup or floater' }, { who: 'O5', text: 'Help comes: dump to the roller' },
      { who: 'O4', text: 'Defense switches: open on the wing' }]
  },
  // ---------------------------------------------------------------- on-ball: Delay / Elbow
  {
    key: 'delay', title: 'Delay Elbow Get', concept: 'Big as passer',
    summary: 'Pass to the big at the elbow, then come right back and "get" the ball with a handoff. The big is a wall you dribble off.',
    cues: ['Big up', 'Pass and get it back', 'Turn the corner'],
    players: [O(1, xy(0, 29), 'point'), O(5, 'right elbow', 'big'), O(2, 'right corner'), O(3, 'left wing'), O(4, 'left corner')], ball: 'O1',
    beats: [
      { say: 'O5 steps up from the elbow. O1 passes to O5.', actions: [
        { kind: 'lift', who: 'O5', to: xy(7, 22) }, { kind: 'pass', who: 'O1', target: 'O5' }] },
      { say: 'O1 runs around O5 to get the ball back.', actions: [{ kind: 'move', who: 'O1', to: xy(9.5, 23.5), via: xy(12, 31) }] },
      { say: 'Handoff: the "get."', actions: [{ kind: 'handoff', who: 'O5', target: 'O1' }] },
      { say: 'O1 turns the corner and drives. O5 rolls to the rim.', actions: [
        { kind: 'dribble', who: 'O1', to: xy(9, 11) }, { kind: 'roll', who: 'O5', to: xy(0, 10), via: xy(2, 16) }] },
      { say: 'The corner defender helps, so O1 kicks it to O2.', actions: [{ kind: 'pass', who: 'O1', target: 'O2' }] },
      { say: 'Corner three.', actions: [{ kind: 'shot', who: 'O2' }] }
    ],
    reads: [{ who: 'O2', text: 'Corner defender helps: shoot' }, { who: 'O5', text: 'Roller open' },
      { who: 'O1', text: 'Defender jumps the handoff: backdoor' }]
  },
  // ---------------------------------------------------------------- early offense: Pistol / 21
  {
    key: 'pistol', title: 'Pistol (21)', concept: 'Early offense',
    summary: 'Run it before the defense is ready. O1 passes to O2 on the wing, chases for a handoff back, then O5 sets a ball screen right away.',
    cues: ['Push it', 'Give and chase', 'Screen and roll'],
    players: [O(1, xy(8, 32), 'point'), O(2, xy(20, 21)), O(5, xy(-2, 34), 'big'), O(3, 'left wing'), O(4, 'left corner')], ball: 'O1',
    beats: [
      { say: 'O1 pushes up the right side and passes to O2. O1 chases the pass. O5 trails behind.', actions: [
        { kind: 'pass', who: 'O1', target: 'O2' }, { kind: 'cut', who: 'O1', to: xy(17.5, 22.5) }, { kind: 'move', who: 'O5', to: xy(10, 28) }] },
      { say: 'O2 hands it right back to O1.', actions: [{ kind: 'handoff', who: 'O2', target: 'O1' }] },
      { say: 'O5 sets a ball screen. O2 drifts down to the corner.', actions: [
        { kind: 'screen', who: 'O5', to: xy(14.5, 24.5) }, { kind: 'drift', who: 'O2', to: xy(21.5, 5) }] },
      { say: 'O1 dribbles to the middle. O5 rolls to the rim.', actions: [
        { kind: 'dribble', who: 'O1', to: xy(5, 20), via: xy(12, 34) }, { kind: 'roll', who: 'O5', to: xy(2, 9), via: xy(11, 14) }] },
      { say: 'O1 hits the roller.', actions: [{ kind: 'pass', who: 'O1', target: 'O5' }] },
      { say: 'Layup.', actions: [{ kind: 'shot', who: 'O5' }] }
    ],
    reads: [{ who: 'O5', text: 'Roller before help arrives' }, { who: 'O2', text: 'Help from the corner: open three' },
      { who: 'O1', text: 'Big drops: pull-up' }]
  },
  // ---------------------------------------------------------------- off-ball: stagger / floppy
  {
    key: 'stagger', title: 'Stagger for a Shooter', concept: 'Off-ball screens',
    summary: 'Two teammates line up as screens, one after the other. The shooter runs off both, and the defender gets stuck. This is the "floppy" idea.',
    cues: ['Fake one way', 'Run off both', 'Feet set, shoot'],
    players: [O(1, xy(0, 29), 'point'), O(2, xy(0, 7), 'shooter'), O(4, xy(-5, 11)), O(5, xy(-11, 15)), O(3, xy(8.5, 10.5)),
      X(2, xy(0, 9.5))], ball: 'O1',
    beats: [
      { say: 'O2 starts under the rim and fakes to the right.', actions: [
        { kind: 'move', who: 'O2', to: xy(2.5, 7.5) }, { kind: 'slide', who: 'X2', to: xy(2, 10) }] },
      { say: 'O2 runs off O4, then O5: a stagger. X2 gets caught. O1 moves to the left slot.', actions: [
        { kind: 'cut', who: 'O2', to: xy(-19, 17), via: xy(-9, 8) }, { kind: 'move', who: 'X2', to: xy(-7, 13) },
        { kind: 'dribble', who: 'O1', to: xy(-7, 27) }] },
      { say: 'O1 hits O2 on the wing. X2 runs out late.', actions: [
        { kind: 'pass', who: 'O1', target: 'O2' }, { kind: 'closeout', who: 'X2', to: xy(-15.5, 15) }] },
      { say: 'Feet set, shoot.', actions: [{ kind: 'shot', who: 'O2' }] }
    ],
    reads: [{ who: 'O2', text: 'X2 cheats left: go right off O3' }, { who: 'O5', text: 'Defense switches: slip to the rim' }]
  },
  // ---------------------------------------------------------------- off-ball: UCLA
  {
    key: 'ucla-cut', title: 'UCLA Cut', concept: 'Back screen',
    summary: 'O1 passes to the wing, then O5 sets a back screen and O1 cuts to the basket. Defenders relax after a pass, so O1 is gone.',
    cues: ['Pass to the wing', 'Back screen', 'Cut to the rim'],
    players: [O(1, xy(0, 29), 'point'), O(2, 'right wing'), O(5, 'right elbow'), O(3, 'left wing'), O(4, 'left corner'),
      X(1, xy(0, 25.5))], ball: 'O1',
    beats: [
      { say: 'O1 passes to O2 on the wing. X1 jumps toward the ball.', actions: [
        { kind: 'pass', who: 'O1', target: 'O2' }, { kind: 'slide', who: 'X1', to: xy(3.5, 25.5) }] },
      { say: 'O5 steps up and sets a back screen on X1, who is watching the ball.', actions: [
        { kind: 'screen', who: 'O5', to: xy(4.5, 22.5) }, { kind: 'slide', who: 'X1', to: xy(3.5, 26) }] },
      { say: 'O1 cuts off O5\'s shoulder straight to the rim.', actions: [
        { kind: 'cut', who: 'O1', to: xy(2.5, 9), via: xy(8.5, 24) }, { kind: 'move', who: 'X1', to: xy(3, 23.5) }] },
      { say: 'O2 throws it to O1. O5 pops to the top.', actions: [
        { kind: 'pass', who: 'O2', target: 'O1' }, { kind: 'pop', who: 'O5', to: xy(0, 28) }] },
      { say: 'Layup.', actions: [{ kind: 'shot', who: 'O1' }] }
    ],
    reads: [{ who: 'O1', text: 'Layup off the back screen' }, { who: 'O5', text: 'Defense switches: pop for the shot' }]
  },
  // ---------------------------------------------------------------- off-ball: Flex
  {
    key: 'flex', title: 'Flex Cut', concept: 'Screen the screener',
    summary: 'O4 screens on the baseline and O3 cuts across the lane for a layup. Then O1 screens for the screener, so O4 comes up open too.',
    cues: ['Flex screen', 'Cut across', 'Screen the screener'],
    players: [O(1, 'right slot'), O(2, 'left slot'), O(3, xy(16, 5)), O(4, 'right block'), O(5, 'left wing')], ball: 'O1',
    beats: [
      { say: 'O1 swings the ball to O2.', actions: [{ kind: 'pass', who: 'O1', target: 'O2' }] },
      { say: 'O4 sets a flex screen on the baseline.', actions: [{ kind: 'screen', who: 'O4', to: xy(7, 7.5) }] },
      { say: 'O3 cuts across the lane, low off the screen. O1 screens down for O4.', actions: [
        { kind: 'cut', who: 'O3', to: xy(-5, 7), via: xy(8, 4) }, { kind: 'screen', who: 'O1', to: xy(7, 13) }] },
      { say: 'O2 passes to O3. O4 comes up off the screen.', actions: [
        { kind: 'pass', who: 'O2', target: 'O3' }, { kind: 'cut', who: 'O4', to: xy(4, 21), via: xy(11, 13) }] },
      { say: 'Layup.', actions: [{ kind: 'shot', who: 'O3' }] }
    ],
    reads: [{ who: 'O3', text: 'Layup off the flex screen' }, { who: 'O4', text: 'Elbow jumper off the down screen' }]
  },
  // ---------------------------------------------------------------- youth motion: pass-cut-fill
  {
    key: 'pass-cut-fill', title: '5-Out Pass, Cut, Fill', concept: 'Motion offense',
    summary: 'Pass, cut to the basket, then fill the empty spot. Everyone else slides over one spot. Do it again and again.',
    cues: ['Pass', 'Cut', 'Fill the empty spot'],
    players: [O(1, 'top', 'point'), O(2, 'right wing'), O(3, 'left wing'), O(4, 'right corner'), O(5, 'left corner')], ball: 'O1',
    beats: [
      { say: 'O1 passes to O2 on the wing.', actions: [{ kind: 'pass', who: 'O1', target: 'O2' }] },
      { say: 'O1 cuts hard to the basket, hand up.', actions: [{ kind: 'cut', who: 'O1', to: xy(2, 8), via: xy(-2, 20) }] },
      { say: 'No pass, so O1 runs to the far corner. Everyone fills one spot toward the ball.', actions: [
        { kind: 'cut', who: 'O1', to: 'left corner', via: xy(-9, 4) }, { kind: 'lift', who: 'O5', to: 'left wing' },
        { kind: 'move', who: 'O3', to: 'top' }] },
      { say: 'O2 passes back to the top. Now do it again.', actions: [{ kind: 'pass', who: 'O2', target: 'O3' }] }
    ],
    reads: [{ who: 'O1', text: 'Open on the cut: layup' }, { who: 'O3', text: 'Fill the top, ready to catch' }]
  },
  // ---------------------------------------------------------------- 4-out-1-in post entry
  {
    key: 'post-entry', title: '4-Out 1-In Post Entry', concept: 'Post play',
    summary: 'Four players outside, one big inside. The big holds his spot, the wing throws a bounce pass in, then moves to a new spot to be ready.',
    cues: ['Seal', 'Bounce pass in', 'Move after you pass'],
    players: [O(1, 'top', 'point'), O(2, 'right wing'), O(3, 'left wing'), O(4, 'left corner'), O(5, xy(5, 10), 'big'),
      X(5, xy(6, 12))], ball: 'O1',
    beats: [
      { say: 'O1 passes to O2 on the wing.', actions: [{ kind: 'pass', who: 'O1', target: 'O2' }] },
      { say: 'O5 steps to the block and seals X5 behind him. Hand up: "here!"', actions: [
        { kind: 'move', who: 'O5', to: xy(8, 7.5) }, { kind: 'slide', who: 'X5', to: xy(5.5, 7) }] },
      { say: 'O2 throws a bounce pass in, then moves to the corner.', actions: [
        { kind: 'pass', who: 'O2', target: 'O5' }, { kind: 'move', who: 'O2', to: xy(21.5, 4) }] },
      { say: 'O5 turns to the middle and scores.', actions: [{ kind: 'dribble', who: 'O5', to: xy(3, 6.5), via: xy(6, 9) }] },
      { say: 'Layup.', actions: [{ kind: 'shot', who: 'O5' }] }
    ],
    reads: [{ who: 'O5', text: 'Back to the basket: drop step' }, { who: 'O2', text: 'Defense doubles: kick to the corner' }]
  },
  // ---------------------------------------------------------------- ghost screen / slip
  {
    key: 'ghost-slip', title: 'Ghost Screen', concept: 'Fake screen',
    summary: 'O4 runs up like he\'s going to screen, but never touches anyone. Both defenders jump at the ball, and O4 pops out wide open. If his defender stays home, he slips to the rim.',
    cues: ['Run at it', 'Don\'t touch', 'Pop or slip'],
    players: [O(1, xy(0, 30.5), 'point'), O(4, 'left slot'), O(2, 'right wing'), O(3, 'left corner'), O(5, 'right corner'),
      X(1, xy(0, 27)), X(4, xy(-7.5, 22.5))], ball: 'O1',
    beats: [
      { say: 'O4 runs up like he\'s going to screen X1.', actions: [
        { kind: 'move', who: 'O4', to: xy(-3.5, 25.5) }, { kind: 'slide', who: 'X4', to: xy(-3.5, 22.5) }] },
      { say: 'X1 and X4 both jump at O1. O4 never touches anyone and pops back out.', actions: [
        { kind: 'pop', who: 'O4', to: xy(-12, 26.5) }, { kind: 'slide', who: 'X1', to: xy(-1, 28) },
        { kind: 'slide', who: 'X4', to: xy(-2, 26) }] },
      { say: 'O1 passes to O4. X4 is too late.', actions: [
        { kind: 'pass', who: 'O1', target: 'O4' }, { kind: 'closeout', who: 'X4', to: xy(-9, 24.5) }] },
      { say: 'Open shot.', actions: [{ kind: 'shot', who: 'O4' }] }
    ],
    reads: [{ who: 'O4', text: 'Both jump the ball: pop' }, { who: 'O4', text: 'X4 stays home: slip to the rim' }]
  },
  // ---------------------------------------------------------------- BLOB: Box
  {
    key: 'blob-box', title: 'Box Out-of-Bounds (BLOB)', concept: 'Inbounds play',
    summary: 'Four players make a box near the basket. The corner shooter pops out, a screen frees a cutter in the middle, and we inbound for a layup.',
    cues: ['Make the box', 'Screen down', 'Ball to the middle'],
    players: [O(1, xy(7, 0.5), 'inbounder'), O(5, 'right block'), O(4, 'left block'), O(2, xy(7, 14)), O(3, xy(-7, 14))], ball: 'O1',
    beats: [
      { say: 'Box: four players on the blocks and above them. O1 takes the ball out.', actions: [] },
      { say: 'O2 pops to the corner. O3 screens down for O4.', actions: [
        { kind: 'pop', who: 'O2', to: xy(21.5, 4) }, { kind: 'screen', who: 'O3', to: xy(-5.5, 10.5) }] },
      { say: 'O4 runs up around the screen and darts into the middle.', actions: [
        { kind: 'curl', who: 'O4', to: xy(1, 11.5), via: xy(-9, 12) }, { kind: 'pop', who: 'O3', to: xy(-4, 21) }] },
      { say: 'O1 inbounds to O4.', actions: [{ kind: 'pass', who: 'O1', target: 'O4' }] },
      { say: 'Layup.', actions: [{ kind: 'shot', who: 'O4' }] }
    ],
    reads: [{ who: 'O4', text: 'Open in the middle' }, { who: 'O2', text: 'Corner three if they collapse' },
      { who: 'O3', text: 'Safety: catch it up top' }]
  },
  // ---------------------------------------------------------------- SLOB
  {
    key: 'slob', title: 'Sideline Inbounds (SLOB)', concept: 'Inbounds play',
    summary: 'O1 zips up off a screen to catch the inbound. Then the passer steps in, gets a back screen, and cuts to the rim.',
    cues: ['Zip up to catch', 'Step in', 'Back screen, cut'],
    players: [O(3, xy(24.5, 30), 'inbounder'), O(1, xy(8, 8), 'point'), O(5, xy(9, 16), 'big'), O(2, 'right corner'), O(4, 'left wing')], ball: 'O3',
    beats: [
      { say: 'O5 sets a down screen. O1 takes his defender low.', actions: [
        { kind: 'screen', who: 'O5', to: xy(8, 12.5) }, { kind: 'move', who: 'O1', to: xy(7, 6.5) }] },
      { say: 'O1 zips up off the screen to the top.', actions: [{ kind: 'cut', who: 'O1', to: xy(6, 27), via: xy(11, 14) }] },
      { say: 'O3 inbounds to O1 and steps in to the wing.', actions: [
        { kind: 'pass', who: 'O3', target: 'O1' }, { kind: 'move', who: 'O3', to: xy(18, 23) }] },
      { say: 'O5 sets a back screen for O3.', actions: [{ kind: 'screen', who: 'O5', to: xy(15, 19.5) }] },
      { say: 'O3 cuts to the rim. O1 throws it to him.', actions: [
        { kind: 'cut', who: 'O3', to: xy(3, 8), via: xy(13, 16) }, { kind: 'pass', who: 'O1', target: 'O3' }] },
      { say: 'Layup.', actions: [{ kind: 'shot', who: 'O3' }] }
    ],
    reads: [{ who: 'O3', text: 'Layup off the back screen' }, { who: 'O5', text: 'Defense switches: slip to the rim' }]
  },
  // ---------------------------------------------------------------- press break (drawn going up the floor)
  {
    key: 'press-break', title: '1-4 Press Break', concept: 'Beat full-court pressure',
    summary: 'Line up four across. Flash to the ball, catch, and when two defenders trap you, pass to the middle and then up the floor. Passes beat the press, not dribbles.',
    cues: ['Four across', 'Flash to the ball', 'Middle, then long'],
    players: [O(4, xy(-4, 0.5), 'inbounder'), O(2, xy(-20, 19)), O(1, xy(-7, 19), 'point'), O(5, xy(7, 19)), O(3, xy(20, 19)),
      X(1, xy(-7, 16)), X(2, xy(-14, 22))], ball: 'O4',
    beats: [
      { say: 'Four across the free-throw line. O1 flashes to the ball.', actions: [
        { kind: 'cut', who: 'O1', to: xy(-9, 9) }, { kind: 'slide', who: 'X1', to: xy(-7.5, 12.5) }] },
      { say: 'O4 inbounds to O1, then steps in behind as the safety.', actions: [
        { kind: 'pass', who: 'O4', target: 'O1' }, { kind: 'move', who: 'O4', to: xy(4, 7) }] },
      { say: 'X1 and X2 trap O1. Don\'t panic. O5 flashes to the middle. O3 runs long.', actions: [
        { kind: 'slide', who: 'X1', to: xy(-6.5, 11) }, { kind: 'help', who: 'X2', to: xy(-12, 11.5) },
        { kind: 'cut', who: 'O5', to: xy(0, 20) }, { kind: 'cut', who: 'O3', to: xy(18, 40) }] },
      { say: 'O1 passes to the middle. O2 runs long on the left.', actions: [
        { kind: 'pass', who: 'O1', target: 'O5' }, { kind: 'cut', who: 'O2', to: xy(-18, 38) }] },
      { say: 'O5 turns and throws it ahead to O3.', actions: [{ kind: 'pass', who: 'O5', target: 'O3' }] },
      { say: 'O3 dribbles across half court. Press broken.', actions: [{ kind: 'dribble', who: 'O3', to: xy(12, 46) }] }
    ],
    reads: [{ who: 'O5', text: 'Middle is the key pass' }, { who: 'O4', text: 'Safety: always behind the ball' },
      { who: 'O1', text: 'Trapped: pivot, pass high or low' }]
  },
  // ---------------------------------------------------------------- defense: ICE
  {
    key: 'ice-defense', title: 'ICE the Side Pick and Roll', concept: 'Ball screen defense',
    summary: 'When the other team sets a side screen, X1 jumps to the top and blocks the middle. O1 has to go toward the sideline, right into X5 waiting below.',
    cues: ['Ice! No middle', 'Big sits low', 'Tag the roller'],
    players: [O(1, xy(18, 22), 'point'), O(5, xy(8, 18), 'big'), O(2, 'left wing'), O(3, 'left corner'), O(4, 'left slot'),
      X(1, xy(16, 19.5)), X(5, xy(8.5, 15.5)), X(2, xy(-10, 16))], ball: 'O1',
    beats: [
      { say: 'O5 comes to set a side screen so O1 can go to the middle.', actions: [
        { kind: 'screen', who: 'O5', to: xy(14.5, 22.5) }, { kind: 'slide', who: 'X5', to: xy(12, 18) }] },
      { say: 'ICE! X1 jumps to the top side and blocks the middle. X5 drops low.', actions: [
        { kind: 'slide', who: 'X1', to: xy(16.5, 24.5) }, { kind: 'slide', who: 'X5', to: xy(14, 14) }] },
      { say: 'O1 can\'t go middle, so he dribbles toward the baseline, right into X5. X1 chases.', actions: [
        { kind: 'dribble', who: 'O1', to: xy(19.5, 11) }, { kind: 'slide', who: 'X5', to: xy(16, 9.5) },
        { kind: 'slide', who: 'X1', to: xy(20, 15) }] },
      { say: 'O5 rolls. X2 slides over to tag the roller.', actions: [
        { kind: 'roll', who: 'O5', to: xy(4, 10) }, { kind: 'help', who: 'X2', to: xy(2.5, 12) }] }
    ],
    reads: [{ who: 'X1', text: 'Top side: "Ice! Ice!"' }, { who: 'X5', text: 'Stay low, stop the ball' },
      { who: 'X2', text: 'Tag the roller' }]
  },
  // ---------------------------------------------------------------- defense: hedge (and drop as the read)
  {
    key: 'hedge-defense', title: 'Hedge and Recover', concept: 'Ball screen defense',
    summary: 'When O5 screens, X5 jumps out in front of the dribbler for a second (the hedge) so X1 can get back. Then X5 sprints back to his player.',
    cues: ['Show!', 'Over the top', 'Sprint back'],
    players: [O(1, xy(0, 29.5), 'point'), O(5, xy(8, 19.5), 'big'), O(2, 'right wing'), O(3, 'left wing'), O(4, 'left corner'),
      X(1, xy(0, 26)), X(5, xy(6.5, 17))], ball: 'O1',
    beats: [
      { say: 'O5 comes up and screens X1. X5 follows him up.', actions: [
        { kind: 'screen', who: 'O5', to: xy(2.5, 26) }, { kind: 'slide', who: 'X5', to: xy(4, 22.5) }] },
      { say: 'Hedge! X5 jumps out in front of O1. X1 fights over the top of the screen.', actions: [
        { kind: 'dribble', who: 'O1', to: xy(8, 27.5), via: xy(4.5, 30.5) }, { kind: 'help', who: 'X5', to: xy(10, 25) },
        { kind: 'slide', who: 'X1', to: xy(5.5, 30), via: xy(2, 30.5) }] },
      { say: 'O1 has to back up. X1 catches up. X5 sprints back to O5, who rolls.', actions: [
        { kind: 'dribble', who: 'O1', to: xy(11, 30) }, { kind: 'slide', who: 'X1', to: xy(10, 27.5) },
        { kind: 'roll', who: 'O5', to: xy(2, 12) }, { kind: 'slide', who: 'X5', to: xy(2, 9.5) }] },
      { say: 'Everyone is back home. No easy shot.', actions: [{ kind: 'pass', who: 'O1', target: 'O2' }] }
    ],
    reads: [{ who: 'X5', text: 'Show, then sprint back' }, { who: 'X1', text: 'Over the top, don\'t get stuck' },
      { who: 'X5', text: 'Or drop: stay back by the rim' }]
  }
];

// the words coaches say (and what a speech recognizer might hear)
export const ALIASES = {
  horns: ['horns', 'horn', 'horn set', 'horns set', 'horns pop', 'horns roll', 'double high', 'bull horns'],
  'horns-twist': ['horns twist', 'horn twist', 'twist', 'double ball screen', 'two screens', 'horns double'],
  'spain-pnr': ['spain', 'spain pick and roll', 'spain pnr', 'spain action', 'stack pick and roll', 'spanish pick and roll', 'back screen the roller'],
  chicago: ['chicago', 'chicago action', 'pin down handoff', 'pindown handoff', 'pin down into dho', 'chi town'],
  zoom: ['zoom', 'zoom action', 'elbow zoom', 'zoom dho', 'zoom handoff'],
  delay: ['delay', 'elbow', 'elbow get', 'delay get', 'big at the elbow', 'elbow series'],
  pistol: ['pistol', '21', 'twenty one', 'twenty-one', '2 1', 'two one', 'pistol action', 'early offense', '21 chase'],
  stagger: ['stagger', 'staggered screen', 'stagger screen', 'floppy', 'double screen for a shooter', 'shooter screens'],
  'ucla-cut': ['ucla', 'u c l a', 'ucla cut', 'ucla screen', 'u.c.l.a.', 'high post back screen'],
  flex: ['flex', 'flex cut', 'flex screen', 'flex offense', 'screen the screener'],
  'pass-cut-fill': ['pass cut fill', 'pass and cut', 'pass cut and fill', 'five out motion', '5 out motion', 'motion offense', 'fill the empty spot', 'basket cut'],
  'post-entry': ['post entry', 'post up', '4 out 1 in', 'four out one in', 'feed the post', 'post feed', 'entry pass', 'throw it inside'],
  'ghost-slip': ['ghost', 'ghost screen', 'slip', 'slip screen', 'fake screen', 'ghost and slip'],
  'blob-box': ['blob', 'b l o b', 'baseline out of bounds', 'box set', 'box play', 'under the basket', 'baseline inbound', 'b lob'],
  slob: ['slob', 's l o b', 'sideline out of bounds', 'sideline inbound', 'side out', 'zipper', 'zip cut'],
  'press-break': ['press break', 'press breaker', 'break the press', 'beat the press', 'press offense', '1 4 press', 'four across', 'press brake'],
  'ice-defense': ['ice', 'ice it', 'ice defense', 'ice the pick and roll', 'ice coverage', 'blue coverage', 'push it down'],
  'hedge-defense': ['hedge', 'hedge and recover', 'show and recover', 'hard hedge', 'hedge out', 'drop coverage', 'big drops']
};
