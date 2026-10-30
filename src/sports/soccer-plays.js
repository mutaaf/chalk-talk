// Soccer concept libraries, drawn as X's and O's (research/SOCCER.md has the sources and why each
// was picked). Coordinates are yards, attacking the goal at y 0: 7v7 x −20…20, y 0…55 (halfway 27.5,
// build-out lines 19.75 and 35.25); 9v9 x −25…25, y 0…75 (halfway 37.5). Spots can be names (see
// spots() in soccer.js) or { x, y }.
//
// Ids are fixed per format and drawn as shirt numbers (soccer.js SOCCER7 / SOCCER9):
//   7v7 (2-3-1)  O1 keeper 1 · O2 right back 2 · O3 left back 3 · O4 the 8 · O5 left wing 11 · O6 striker 9 · O7 right wing 7
//   9v9 (3-2-3)  O1 keeper 1 · O2 right back 2 · O3 left back 3 · O4 center back 4 · O5 the 6 · O6 the 8 · O7 right wing 7
//                O8 left wing 11 · O9 striker 9
// Defender Xn marks On, so X1 is the defending keeper. A defender with no move in a beat guards on its
// own (goal-side, compact) and closes the gap within half a beat, so plays where defenders must be
// caught out (the counter) or move as a unit (defending lessons) give them a move every beat.
// Every pass goes to a player who is open at the catch (test/soccer.test.mjs checks it with defense on).

const xy = (x, y) => ({ x, y });
const P = (id, at) => ({ id, at });
const team = (pos) => Object.keys(pos).map(id => P(id, pos[id]));

// ---------------------------------------------------------------------------------------- 7v7
export const SOCCER7_PLAYS = [
  {
    key: 'wall-pass', title: 'Wall Pass (1-2)', concept: 'Give-and-go',
    summary: 'The 8 dribbles at a defender, passes to the 9 and sprints past. The 9 bounces it straight back, first time, into the space behind the defender, like hitting the ball off a wall. The defender watched the ball and lost the runner.',
    cues: ['Dribble at him', 'Pass and GO', 'One touch back'],
    players: team({ O1: xy(0, 50), O2: xy(12, 36), O3: xy(-12, 36), O4: xy(-2, 27), O5: xy(-16, 20), O6: xy(2, 14), O7: xy(16, 20) }), ball: 'O4',
    beats: [
      { say: 'O4 dribbles at the defender. O6 checks short to be the wall.', actions: [{ kind: 'dribble', who: 'O4', to: xy(-3, 21) }, { kind: 'check', who: 'O6', to: xy(3, 17) }] },
      { say: 'O4 passes to O6.', actions: [{ kind: 'pass', who: 'O4', target: 'O6' }] },
      { say: 'O4 sprints past the defender and O6 plays it back first time into the space behind. O5 and O7 attack the posts.', actions: [
        { kind: 'run', who: 'O4', to: xy(1, 11) }, { kind: 'pass', who: 'O6', target: 'O4' }, { kind: 'run', who: 'O5', to: xy(-6, 5) }, { kind: 'run', who: 'O7', to: xy(9, 7) }] },
      { say: 'O4 shoots.', actions: [{ kind: 'shot', who: 'O4' }] }
    ],
    reads: [{ who: 'O4', text: 'Defender follows the pass with his eyes: run past him' }, { who: 'O6', text: 'Defender drops off the runner: turn and shoot yourself' }]
  },
  {
    key: 'overlap', title: 'Overlap', concept: 'Two against one wide',
    summary: 'The left winger dribbles inside and takes the defender with him. The left back runs around the outside, behind and then past him, into the empty space down the line. Now it is two against one: the winger slips it outside, the left back gets to the end line and pulls it back.',
    cues: ['Winger: take it inside', 'Back: run around the outside', 'Get to the end line'],
    players: team({ O1: xy(0, 50), O2: xy(10, 38), O3: xy(-12, 32), O4: xy(-3, 28), O5: xy(-15, 22), O6: xy(0, 14), O7: xy(15, 20) }), ball: 'O5',
    beats: [
      { say: 'O5 dribbles inside. O3 overlaps around the outside.', actions: [{ kind: 'dribble', who: 'O5', to: xy(-11, 19) }, { kind: 'overlap', who: 'O3', path: [xy(-17, 25)], to: xy(-17, 12) }] },
      { say: 'O5 slips it down the line to O3.', actions: [{ kind: 'pass', who: 'O5', target: 'O3' }] },
      { say: 'O3 drives to the end line. O6 attacks the near post, O7 the far post, O4 arrives at the penalty spot.', actions: [
        { kind: 'dribble', who: 'O3', to: xy(-11, 3) }, { kind: 'run', who: 'O6', to: xy(-4.5, 4.5) }, { kind: 'run', who: 'O7', to: xy(5, 5) }, { kind: 'run', who: 'O4', to: xy(-1, 9) }] },
      { say: 'O3 cuts it back to O4.', actions: [{ kind: 'cutback', who: 'O3', target: 'O4' }] },
      { say: 'O4 finishes.', actions: [{ kind: 'shot', who: 'O4' }] }
    ],
    reads: [{ who: 'O3', text: 'Defender stays inside with the winger: overlap is free' }, { who: 'O5', text: 'Defender jumps the overlap: cut inside and shoot' },
      { who: 'O4', text: 'Everyone runs at goal: the cutback spot is empty' }]
  },
  {
    key: 'underlap', title: 'Underlap', concept: 'Inside run past the winger',
    summary: 'The right winger stays wide with the ball and pulls the defender out toward the touchline. The 8 runs on the inside of the winger, into the gap between the defenders, and gets the pass in the box.',
    cues: ['Winger: stay wide', 'Run the inside gap', 'Pass into the run'],
    players: team({ O1: xy(0, 50), O2: xy(12, 36), O3: xy(-12, 38), O4: xy(4, 28), O5: xy(-15, 22), O6: xy(-1, 14), O7: xy(16, 20) }), ball: 'O7',
    beats: [
      { say: 'O7 takes a touch wide. O4 underlaps: an inside run into the gap.', actions: [{ kind: 'dribble', who: 'O7', to: xy(17, 18) }, { kind: 'underlap', who: 'O4', path: [xy(9, 21)], to: xy(9, 9) }] },
      { say: 'O7 passes into O4\'s run. O6 heads for the far post.', actions: [{ kind: 'pass', who: 'O7', target: 'O4' }, { kind: 'run', who: 'O6', to: xy(-3, 5) }] },
      { say: 'O4 shoots across the keeper.', actions: [{ kind: 'shot', who: 'O4' }] }
    ],
    reads: [{ who: 'O4', text: 'Defender follows the winger wide: the inside gap opens' }, { who: 'O7', text: 'Defender drops inside: go 1v1 down the line' }]
  },
  {
    key: 'third-man', title: 'Third-Man Run', concept: 'Pass, lay-off, run in behind',
    summary: 'The left back passes into the 9, who comes short. The 9\'s defender follows him. The left winger, the third player, is already running in behind, and the 9 flicks it into that run first time. The defense watches the first two players and never sees the third.',
    cues: ['9: come short', 'Third man: run early', 'First-time flick'],
    players: team({ O1: xy(0, 50), O2: xy(12, 38), O3: xy(-12, 36), O4: xy(-2, 30), O5: xy(-16, 22), O6: xy(-1, 17), O7: xy(15, 22) }), ball: 'O3',
    beats: [
      { say: 'O6 checks short and O3 plays it into his feet.', actions: [{ kind: 'check', who: 'O6', to: xy(-5, 26) }, { kind: 'pass', who: 'O3', target: 'O6' }] },
      { say: 'O5 runs in behind and O6 flicks it into his path first time.', actions: [{ kind: 'run', who: 'O5', to: xy(-8, 10) }, { kind: 'through', who: 'O6', target: 'O5' }] },
      { say: 'O5 shoots.', actions: [{ kind: 'shot', who: 'O5' }] }
    ],
    reads: [{ who: 'O5', text: 'Center back steps up with the 9: run into the space he left' }, { who: 'O6', text: 'Nobody follows you short: turn and go yourself' }]
  },
  {
    key: 'switch', title: 'Switch of Play', concept: 'Change the point of attack',
    summary: 'Everyone on the other team slides over to the ball on the right. So we move it to the 8 and he hits a long ball across to the left winger, who has been waiting wide on the far side with lots of space. He goes 1v1 and finds the 8 arriving.',
    cues: ['Far winger: stay wide', 'Look away from the crowd', 'Switch it'],
    players: team({ O1: xy(0, 50), O2: xy(12, 36), O3: xy(-12, 38), O4: xy(5, 29), O5: xy(-17, 22), O6: xy(2, 15), O7: xy(16, 22) }), ball: 'O7',
    beats: [
      { say: 'The defense crowds the right. O7 plays it back to O4.', actions: [{ kind: 'pass', who: 'O7', target: 'O4' }] },
      { say: 'O4 switches it, a long diagonal to O5 on the far side.', actions: [{ kind: 'switch', who: 'O4', target: 'O5' }] },
      { say: 'O5 attacks the space. O6 pins the defenders near post and O4 arrives late.', actions: [
        { kind: 'dribble', who: 'O5', to: xy(-11, 10) }, { kind: 'run', who: 'O6', to: xy(-3, 4) }, { kind: 'run', who: 'O4', to: xy(-2, 11) }] },
      { say: 'O5 pulls it back to O4.', actions: [{ kind: 'pass', who: 'O5', target: 'O4' }] },
      { say: 'O4 shoots.', actions: [{ kind: 'shot', who: 'O4' }] }
    ],
    reads: [{ who: 'O5', text: 'Defense shifted to the ball: far side is open' }, { who: 'O7', text: 'Nobody shifted: go 1v1 yourself' }]
  },
  {
    key: 'build-out', title: 'Build Out from the Back', concept: 'Playing out (build-out line)',
    summary: 'Our keeper has the ball, so the other team has to back up behind the build-out line. The backs split wide to the edges of the box, the keeper rolls it to one of them, and he dribbles forward into the free space before passing up the line to the winger.',
    cues: ['Backs: split wide', 'Keeper: roll it', 'Free space? Carry it'],
    players: team({ O1: xy(0, 53), O2: xy(6, 47), O3: xy(-6, 47), O4: xy(0, 38), O5: xy(-16, 32), O6: xy(0, 22), O7: xy(16, 32) }), ball: 'O1',
    beats: [
      { say: 'O1 has it: the other team retreats behind the build-out line. O2 and O3 split wide, O4 shows in the middle.', actions: [
        { kind: 'support', who: 'O2', to: xy(11, 47) }, { kind: 'support', who: 'O3', to: xy(-11, 47) }, { kind: 'check', who: 'O4', to: xy(-1, 41) }] },
      { say: 'O1 rolls it out to O3.', actions: [{ kind: 'distribute', who: 'O1', target: 'O3' }] },
      { say: 'Nobody presses yet, so O3 carries it forward. O5 checks back to the ball.', actions: [{ kind: 'carry', who: 'O3', to: xy(-11, 40) }, { kind: 'check', who: 'O5', to: xy(-16, 30) }, { kind: 'support', who: 'O4', to: xy(-3, 35) }] },
      { say: 'O3 passes up the line to O5.', actions: [{ kind: 'pass', who: 'O3', target: 'O5' }] },
      { say: 'O5 turns and attacks.', actions: [{ kind: 'dribble', who: 'O5', to: xy(-14, 22) }] }
    ],
    reads: [{ who: 'O3', text: 'Space in front: carry it until someone comes' }, { who: 'O4', text: 'Defender presses the back: the 8 is free in the middle' },
      { who: 'O2', text: 'Left side crowded: keeper goes to the other back' }]
  },
  {
    key: 'through-ball', title: 'Through Ball', concept: 'Run in behind',
    summary: 'The 8 dribbles forward to make the defenders step up. The 9 bends a run across and behind the last defender, and the 8 slides the ball into the space in front of him. He is through on the keeper.',
    cues: ['9: bend the run', 'Pass into space, not feet', 'Through on goal'],
    players: team({ O1: xy(0, 50), O2: xy(12, 38), O3: xy(-12, 38), O4: xy(0, 30), O5: xy(-15, 20), O6: xy(4, 16), O7: xy(15, 20) }), ball: 'O4',
    beats: [
      { say: 'O4 carries it forward.', actions: [{ kind: 'carry', who: 'O4', to: xy(0, 25) }] },
      { say: 'O6 bends a run in behind and O4 slides the through ball into his path.', actions: [{ kind: 'run', who: 'O6', via: xy(6, 11), to: xy(-2, 7) }, { kind: 'through', who: 'O4', target: 'O6' }] },
      { say: 'O6 is through and shoots.', actions: [{ kind: 'shot', who: 'O6' }] }
    ],
    reads: [{ who: 'O6', text: 'Defender watching the ball: run behind his back' }, { who: 'O4', text: 'Defender drops with the run: keep dribbling and shoot' }]
  },
  {
    key: 'cutback', title: 'Byline Cutback', concept: 'Cross & finish',
    summary: 'The right winger dribbles all the way to the end line. The 9 runs to the near post and the 11 to the far post, which pulls the defenders back toward the goal. The 8 waits behind them at the penalty spot, and the winger passes it back to him on the ground.',
    cues: ['Get to the end line', 'Near post, far post', 'The 8: arrive late'],
    players: team({ O1: xy(0, 50), O2: xy(12, 36), O3: xy(-12, 38), O4: xy(2, 22), O5: xy(-15, 18), O6: xy(0, 14), O7: xy(16, 16) }), ball: 'O7',
    beats: [
      { say: 'O7 dribbles to the end line. O6 attacks the near post, O5 the far post, O4 arrives at the penalty spot.', actions: [
        { kind: 'dribble', who: 'O7', to: xy(10, 3) }, { kind: 'run', who: 'O6', to: xy(4.5, 4.5) }, { kind: 'run', who: 'O5', to: xy(-4.5, 4) }, { kind: 'run', who: 'O4', to: xy(0, 9) }] },
      { say: 'O7 cuts it back to O4.', actions: [{ kind: 'cutback', who: 'O7', target: 'O4' }] },
      { say: 'O4 shoots.', actions: [{ kind: 'shot', who: 'O4' }] }
    ],
    reads: [{ who: 'O4', text: 'Defenders run back at their goal: the cutback spot is open' }, { who: 'O6', text: 'Keeper stays in the middle: near post' },
      { who: 'O5', text: 'Ball gets past the near post: far post' }]
  },
  {
    key: 'counter-3v2', title: 'Counterattack 3v2', concept: 'Transition to attack',
    summary: 'We win the ball and three of us sprint forward against only two defenders. The 8 dribbles straight at the middle until one defender has to step up to him, then passes to the side that defender left. The winger draws the last defender and the keeper, then squares it to the far post.',
    cues: ['Win it, go!', 'Wide runners: get wide', 'Commit him, then pass'],
    players: team({ O1: xy(0, 53), O2: xy(10, 46), O3: xy(-10, 46), O4: xy(0, 38), O5: xy(-12, 35), O6: xy(-3, 44), O7: xy(12, 35) }).concat([
      P('X2', xy(-6, 22)), P('X3', xy(6, 22)), P('X4', xy(1, 41)), P('X5', xy(-11, 39)), P('X7', xy(11, 39))]), ball: 'O4',
    beats: [
      { say: 'O4 wins it and carries forward. O5 and O7 sprint wide. X2 and X3 drop to slow it down; the rest chase back.', actions: [
        { kind: 'carry', who: 'O4', to: xy(0, 28) }, { kind: 'run', who: 'O5', to: xy(-14, 24) }, { kind: 'run', who: 'O7', to: xy(14, 24) },
        { kind: 'drop', who: 'X2', to: xy(-5, 17) }, { kind: 'drop', who: 'X3', to: xy(5, 17) }, { kind: 'track', who: 'X4', to: xy(1, 34) }, { kind: 'track', who: 'X5', to: xy(-12, 30) }, { kind: 'track', who: 'X7', to: xy(12, 30) }] },
      { say: 'O4 drives at the middle. X3 has to step up to him; X2 covers.', actions: [
        { kind: 'carry', who: 'O4', to: xy(0, 20) }, { kind: 'run', who: 'O5', to: xy(-13, 14) }, { kind: 'run', who: 'O7', to: xy(12, 13) },
        { kind: 'press', who: 'X3', to: xy(1, 17.5) }, { kind: 'cover', who: 'X2', to: xy(-3, 13) }, { kind: 'track', who: 'X4', to: xy(1, 27) }, { kind: 'track', who: 'X5', to: xy(-12, 22) }, { kind: 'track', who: 'X7', to: xy(11, 24) }] },
      { say: 'O4 passes to O7, on the side X3 left. O5 runs to the far post.', actions: [
        { kind: 'pass', who: 'O4', target: 'O7' }, { kind: 'run', who: 'O5', to: xy(-4, 5) }, { kind: 'run', who: 'O6', to: xy(-3, 32) },
        { kind: 'cover', who: 'X2', to: xy(3, 10) }, { kind: 'drop', who: 'X3', to: xy(3, 14) }, { kind: 'track', who: 'X4', to: xy(1, 20) }, { kind: 'track', who: 'X5', to: xy(-11, 16) }, { kind: 'track', who: 'X7', to: xy(10, 18) }] },
      { say: 'O7 dribbles at goal. X2 has to come to him.', actions: [
        { kind: 'dribble', who: 'O7', to: xy(9, 8) }, { kind: 'press', who: 'X2', to: xy(6, 6.5) }, { kind: 'drop', who: 'X3', to: xy(1, 10) }, { kind: 'track', who: 'X4', to: xy(2, 14) }, { kind: 'track', who: 'X5', to: xy(-9, 11) }, { kind: 'track', who: 'X7', to: xy(9, 13) }] },
      { say: 'O7 squares it to O5 at the far post.', actions: [
        { kind: 'pass', who: 'O7', target: 'O5' }, { kind: 'press', who: 'X2', to: xy(5, 5) }, { kind: 'drop', who: 'X3', to: xy(1, 8) }, { kind: 'track', who: 'X4', to: xy(2, 11) }, { kind: 'track', who: 'X5', to: xy(-8, 9) }, { kind: 'track', who: 'X7', to: xy(8, 10) }] },
      { say: 'O5 taps it in.', actions: [{ kind: 'shot', who: 'O5' }, { kind: 'drop', who: 'X2', to: xy(4, 4) }, { kind: 'drop', who: 'X3', to: xy(0, 6) }] }
    ],
    reads: [{ who: 'O7', text: 'Defender steps up to the ball: pass to the side he left' }, { who: 'O4', text: 'Nobody steps up: keep dribbling and shoot' },
      { who: 'O5', text: 'Last defender and keeper go to the ball: back post' }]
  },
  {
    key: 'corner-near-post', title: 'Near-Post Corner', concept: 'Corner kick (on the ground)',
    summary: 'A low, driven corner, no heading. The 9 sprints in front of his defender to the near post and redirects the ball first time with his foot across the goal. The 11 runs to the far post and taps it in. The 8 waits at the top of the box for anything that comes out.',
    cues: ['Low and hard to the near post', 'Get in front of him', 'Far post: be there'],
    players: team({ O1: xy(0, 50), O2: xy(7, 24), O3: xy(-9, 26), O4: xy(1, 15), O5: xy(-4, 9), O6: xy(3, 10), O7: 'right corner' }), ball: 'O7',
    beats: [
      { say: 'O6 sprints in front of his defender to the near post. O5 goes far post, O4 waits at the top of the box.', actions: [
        { kind: 'run', who: 'O6', to: xy(5, 4.5) }, { kind: 'run', who: 'O5', to: xy(-4, 3.5) }, { kind: 'move', who: 'O4', to: xy(0, 11) }] },
      { say: 'O7 drives the corner low to O6.', actions: [{ kind: 'cross', who: 'O7', target: 'O6' }] },
      { say: 'O6 flicks it on first time to O5.', actions: [{ kind: 'flick', who: 'O6', target: 'O5' }] },
      { say: 'O5 taps it in at the far post.', actions: [{ kind: 'shot', who: 'O5' }] }
    ],
    reads: [{ who: 'O6', text: 'Get in front of your defender: near post' }, { who: 'O5', text: 'Ball gets flicked on: far post' }, { who: 'O4', text: 'Cleared out: shoot from the top of the box' }]
  },
  {
    key: 'throw-in', title: 'Throw-In: Throw It and Get It Back', concept: 'Throw-in pattern',
    summary: 'The thrower is usually the one nobody marks. The 8 checks away and comes back for the throw at his feet, then passes it straight back to the left back, who has stepped onto the field. He plays the 9 in behind.',
    cues: ['Check away, check back', 'Throw to feet', 'Give it back to the thrower'],
    players: team({ O1: xy(0, 50), O2: xy(10, 38), O3: xy(-19.4, 30), O4: xy(-10, 31), O5: xy(-15, 22), O6: xy(0, 16), O7: xy(15, 22) }), ball: 'O3',
    beats: [
      { say: 'O5 runs down the line to clear space. O4 checks away, then back toward O3.', actions: [{ kind: 'run', who: 'O5', to: xy(-17, 14) }, { kind: 'check', who: 'O4', via: xy(-8, 27), to: xy(-14, 28) }] },
      { say: 'O3 throws it to O4\'s feet.', actions: [{ kind: 'throwin', who: 'O3', target: 'O4' }] },
      { say: 'O3 steps onto the field and O4 gives it straight back.', actions: [{ kind: 'run', who: 'O3', to: xy(-16, 21) }, { kind: 'pass', who: 'O4', target: 'O3' }] },
      { say: 'O6 runs in behind and O3 plays him through.', actions: [{ kind: 'run', who: 'O6', via: xy(-2, 12), to: xy(-6, 8) }, { kind: 'through', who: 'O3', target: 'O6' }] },
      { say: 'O6 shoots.', actions: [{ kind: 'shot', who: 'O6' }] }
    ],
    reads: [{ who: 'O3', text: 'Nobody marks the thrower: get it back' }, { who: 'O5', text: 'Defender doesn\'t follow you: throw it down the line' }]
  },
  {
    key: 'pressing-trigger', lesson: 'defense', title: 'Press on the Trigger', concept: 'Defense: pressing triggers',
    summary: 'Defense. We don\'t chase everything: we wait for a trigger. When the ball goes to a player near the touchline, the closest player presses from the inside and the next one cuts off the pass back. The touchline is like an extra defender. Trap him, win it, go.',
    cues: ['Ball to the line: GO', 'Press from the inside', 'Win it and go'],
    players: team({ O1: xy(0, 53), O2: xy(12, 42), O3: xy(-12, 42), O4: xy(0, 36), O5: xy(-15, 30), O6: xy(0, 20), O7: xy(15, 30) }).concat(
      team({ X1: xy(0, 1.5), X2: xy(10, 38), X3: xy(-10, 38), X4: xy(0, 32), X5: xy(-13, 27), X6: xy(0, 17), X7: xy(13, 27) })), ball: 'O4',
    beats: [
      { say: 'O4 passes wide to O2, near the touchline. That\'s the trigger.', actions: [{ kind: 'pass', who: 'O4', target: 'O2' }] },
      { say: 'X2 presses from the inside, showing him down the line. X4 marks O4 so he can\'t pass back, X7 slides over.', actions: [
        { kind: 'press', who: 'X2', to: xy(11, 40) }, { kind: 'mark', who: 'X4', to: xy(3, 35) }, { kind: 'cover', who: 'X7', to: xy(15, 33) }] },
      { say: 'O2 is forced down the line into the trap. X2 and X7 squeeze him.', actions: [
        { kind: 'dribble', who: 'O2', to: xy(17, 37) }, { kind: 'press', who: 'X2', to: xy(15.5, 36) }, { kind: 'press', who: 'X7', to: xy(17.5, 34.5) }, { kind: 'mark', who: 'X4', to: xy(4, 34) }] },
      { say: 'Trapped. His pass is cut out by X7.', actions: [{ kind: 'pass', who: 'O2', target: 'X7' }] },
      { say: 'X7 wins it and goes the other way.', actions: [{ kind: 'carry', who: 'X7', to: xy(9, 45) }] }
    ],
    reads: [{ who: 'X2', text: 'Ball goes to the touchline: press, show him down the line' }, { who: 'X4', text: 'Take away the pass back inside' },
      { who: 'X7', text: 'Squeeze the line: two against one' }]
  },
  {
    key: 'pressure-cover-balance', lesson: 'defense', title: 'Pressure, Cover, Balance', concept: 'Defense: team shape',
    summary: 'Defense. The closest defender presses the ball (pressure) and shows him toward the touchline. The next one stands behind and to the side, ready if he gets beaten (cover). The one on the far side tucks in toward the middle (balance). There\'s no way through, so they have to pass backward.',
    cues: ['First: pressure', 'Second: cover', 'Far side: tuck in'],
    players: team({ O1: xy(0, 53), O2: xy(12, 40), O3: xy(-12, 38), O4: xy(-4, 28), O5: xy(-15, 22), O6: xy(-2, 13), O7: xy(14, 20) }).concat(
      team({ X1: xy(0, 1.5), X2: xy(10, 36), X3: xy(-10, 34), X4: xy(-3, 24), X5: xy(-12, 18), X6: xy(-1, 10), X7: xy(12, 16) })), ball: 'O5',
    beats: [
      { say: 'X5 presses O5, goal-side, showing him outside. X6 covers behind him. X7 tucks in for balance.', actions: [
        { kind: 'press', who: 'X5', to: xy(-13.5, 19.5) }, { kind: 'cover', who: 'X6', to: xy(-8, 13) }, { kind: 'drop', who: 'X7', to: xy(4, 11) }] },
      { say: 'O5 is forced toward the line. X5 stays with him, X6 and X7 shift.', actions: [
        { kind: 'dribble', who: 'O5', to: xy(-16, 15) }, { kind: 'press', who: 'X5', to: xy(-15, 13.5) }, { kind: 'cover', who: 'X6', to: xy(-10, 9) }, { kind: 'move', who: 'X7', to: xy(2, 9) }] },
      { say: 'No way through. O5 has to pass backward to O4.', actions: [{ kind: 'pass', who: 'O5', target: 'O4' }] }
    ],
    reads: [{ who: 'X5', text: 'Nearest to the ball: pressure, show him outside' }, { who: 'X6', text: 'Second defender: cover behind at an angle' },
      { who: 'X7', text: 'Far side: tuck in, the far winger can wait' }]
  }
];

export const SOCCER7_ALIASES = {
  'wall-pass': ['wall pass', 'one two', '1 2', 'one-two', 'give and go', 'give-and-go', 'give n go', 'wall', 'won two', 'one to', 'wall paws', 'all pass'],
  overlap: ['overlap', 'overlapping run', 'overlapping', 'over lap', 'go around', 'run around the outside', 'overlap run', 'overload'],
  underlap: ['underlap', 'under lap', 'underlapping', 'inside run', 'run inside', 'under lab', 'under lip'],
  'third-man': ['third man', 'third man run', '3rd man', 'third-man run', 'third person run', 'lay off and run', 'third mann', 'third men', 'bird man'],
  switch: ['switch', 'switch play', 'switch of play', 'switch the field', 'change the point', 'swing it', 'switch it', 'switching', 'which play'],
  'build-out': ['build out', 'build-out', 'build out line', 'play out from the back', 'playing out', 'goal kick short', 'build up', 'bill doubt', 'build outline', 'build our line'],
  'through-ball': ['through ball', 'through pass', 'in behind', 'run in behind', 'slide it through', 'thru ball', 'threw ball', 'through all', 'true ball'],
  cutback: ['cutback', 'cut back', 'pull back', 'pullback', 'byline cutback', 'end line', 'cross and finish', 'cross', 'cut black', 'cup back'],
  'counter-3v2': ['counter', 'counter attack', 'counterattack', '3v2', '3 v 2', 'three v two', 'three on two', 'fast break', 'break', 'transition', 'counter tack'],
  'corner-near-post': ['corner', 'corner kick', 'near post corner', 'near post', 'flick on', 'flick', 'corner kicks', 'corna', 'near post flick'],
  'throw-in': ['throw in', 'throw-in', 'throwing', 'throw ins', 'throw it and get it back', 'check away check back', 'through in', 'throw and'],
  'pressing-trigger': ['pressing trigger', 'press', 'pressing', 'trigger', 'press the touchline', 'trap', 'high press', 'when to press', 'presting', 'pressing triggers'],
  'pressure-cover-balance': ['pressure cover balance', 'pressure', 'cover', 'balance', 'first defender', 'second defender', 'defending shape', 'pressure cover', 'press her cover']
};

// ---------------------------------------------------------------------------------------- 9v9
export const SOCCER9_PLAYS = [
  {
    key: 'wall-pass', title: 'Wall Pass (1-2)', concept: 'Give-and-go',
    summary: 'The 8 dribbles at the defender, passes to the 9 who has come short, and sprints past. The 9 plays it back first time into the space behind the defender. Two passes, one defender beaten.',
    cues: ['Dribble at him', 'Pass and GO', 'One touch back'],
    players: team({ O1: xy(0, 70), O2: xy(15, 52), O3: xy(-15, 52), O4: xy(0, 58), O5: xy(-4, 42), O6: xy(3, 34), O7: xy(20, 26), O8: xy(-20, 26), O9: xy(-1, 18) }), ball: 'O6',
    beats: [
      { say: 'O6 dribbles at the defender. O9 checks short to be the wall.', actions: [{ kind: 'dribble', who: 'O6', to: xy(3, 27) }, { kind: 'check', who: 'O9', to: xy(-3, 22) }] },
      { say: 'O6 passes to O9.', actions: [{ kind: 'pass', who: 'O6', target: 'O9' }] },
      { say: 'O6 sprints past and O9 plays it back first time. O7 and O8 attack the posts.', actions: [
        { kind: 'run', who: 'O6', to: xy(1, 14) }, { kind: 'pass', who: 'O9', target: 'O6' }, { kind: 'run', who: 'O8', to: xy(-7, 6) }, { kind: 'run', who: 'O7', to: xy(9, 8) }] },
      { say: 'O6 shoots.', actions: [{ kind: 'shot', who: 'O6' }] }
    ],
    reads: [{ who: 'O6', text: 'Defender follows the pass with his eyes: run past him' }, { who: 'O9', text: 'Defender drops off: turn and shoot yourself' }]
  },
  {
    key: 'overlap', title: 'Overlap', concept: 'Two against one wide',
    summary: 'The right winger dribbles inside and takes his defender with him. The right back runs around the outside into the space down the line. The winger slips it to him, he gets to the end line and pulls it back for the 8.',
    cues: ['Winger: take it inside', 'Back: run around the outside', 'Get to the end line'],
    players: team({ O1: xy(0, 70), O2: xy(16, 40), O3: xy(-16, 52), O4: xy(0, 56), O5: xy(-5, 44), O6: xy(6, 32), O7: xy(20, 26), O8: xy(-20, 26), O9: xy(0, 18) }), ball: 'O7',
    beats: [
      { say: 'O7 dribbles inside. O2 overlaps around the outside.', actions: [{ kind: 'dribble', who: 'O7', to: xy(15, 22) }, { kind: 'overlap', who: 'O2', path: [xy(22, 30)], to: xy(22, 14) }] },
      { say: 'O7 slips it down the line to O2.', actions: [{ kind: 'pass', who: 'O7', target: 'O2' }] },
      { say: 'O2 drives to the end line. O9 attacks the near post, O8 the far post, O6 arrives at the penalty spot.', actions: [
        { kind: 'dribble', who: 'O2', to: xy(15, 3) }, { kind: 'run', who: 'O9', to: xy(5, 4.5) }, { kind: 'run', who: 'O8', to: xy(-5, 4) }, { kind: 'run', who: 'O6', to: xy(2, 11) }] },
      { say: 'O2 cuts it back to O6.', actions: [{ kind: 'cutback', who: 'O2', target: 'O6' }] },
      { say: 'O6 finishes.', actions: [{ kind: 'shot', who: 'O6' }] }
    ],
    reads: [{ who: 'O2', text: 'Defender stays inside with the winger: overlap is free' }, { who: 'O7', text: 'Defender jumps the overlap: cut inside and shoot' },
      { who: 'O6', text: 'Everyone runs at goal: the cutback spot is empty' }]
  },
  {
    key: 'underlap', title: 'Underlap', concept: 'Inside run past the winger',
    summary: 'The left winger holds the width and pulls the defender toward the touchline. The 8 runs on the inside of him, into the gap between that defender and the center back, and gets the ball in the box.',
    cues: ['Winger: stay wide', 'Run the inside gap', 'Pass into the run'],
    players: team({ O1: xy(0, 70), O2: xy(16, 50), O3: xy(-16, 42), O4: xy(0, 56), O5: xy(2, 40), O6: xy(-6, 32), O7: xy(20, 26), O8: xy(-21, 24), O9: xy(1, 18) }), ball: 'O8',
    beats: [
      { say: 'O8 takes a touch wide. O6 underlaps into the inside gap; O3 supports behind.', actions: [
        { kind: 'dribble', who: 'O8', to: xy(-22, 21) }, { kind: 'underlap', who: 'O6', path: [xy(-12, 25)], to: xy(-12, 11) }, { kind: 'support', who: 'O3', to: xy(-19, 32) }] },
      { say: 'O8 passes into O6\'s run. O9 heads for the far post.', actions: [{ kind: 'pass', who: 'O8', target: 'O6' }, { kind: 'run', who: 'O9', to: xy(3, 5) }] },
      { say: 'O6 shoots across the keeper.', actions: [{ kind: 'shot', who: 'O6' }] }
    ],
    reads: [{ who: 'O6', text: 'Defender follows the winger wide: the inside gap opens' }, { who: 'O8', text: 'Defender drops inside: go 1v1 down the line' }]
  },
  {
    key: 'third-man', title: 'Third-Man Run', concept: 'Pass, lay-off, run in behind',
    summary: 'The center back passes into the 9, who drops short and takes his defender with him. The 8, the third player, is already running past, and the 9 lays it into his path first time. The defense watches the ball and the 9, never the 8.',
    cues: ['9: drop short', 'Third man: run early', 'First-time lay-off'],
    players: team({ O1: xy(0, 70), O2: xy(16, 50), O3: xy(-16, 48), O4: xy(-3, 54), O5: xy(-4, 42), O6: xy(8, 38), O7: xy(20, 28), O8: xy(-20, 28), O9: xy(0, 22) }), ball: 'O4',
    beats: [
      { say: 'O9 drops short and O4 plays it into his feet.', actions: [{ kind: 'check', who: 'O9', to: xy(-2, 34) }, { kind: 'pass', who: 'O4', target: 'O9' }] },
      { say: 'O6 runs past and O9 lays it into his path first time.', actions: [{ kind: 'run', who: 'O6', to: xy(5, 18) }, { kind: 'flick', who: 'O9', target: 'O6' }] },
      { say: 'O6 carries it toward goal.', actions: [{ kind: 'carry', who: 'O6', to: xy(4, 12) }] },
      { say: 'O6 shoots.', actions: [{ kind: 'shot', who: 'O6' }] }
    ],
    reads: [{ who: 'O6', text: 'Center back follows the 9: run into the space he left' }, { who: 'O9', text: 'Nobody follows you: turn and go' }]
  },
  {
    key: 'switch', title: 'Switch of Play', concept: 'Change the point of attack',
    summary: 'The whole defense has slid over to the ball on the right. We move it back to the 8, then the 6, who hits a long diagonal to the left winger waiting wide on the far side. He attacks the space and finds the 8 arriving late.',
    cues: ['Far winger: stay wide', 'Back, then across', 'Switch it'],
    players: team({ O1: xy(0, 70), O2: xy(18, 44), O3: xy(-17, 50), O4: xy(2, 56), O5: xy(3, 42), O6: xy(12, 34), O7: xy(21, 26), O8: xy(-22, 26), O9: xy(4, 20) }), ball: 'O7',
    beats: [
      { say: 'The defense crowds the right. O7 plays it back to O6.', actions: [{ kind: 'pass', who: 'O7', target: 'O6' }] },
      { say: 'O6 moves it on to O5.', actions: [{ kind: 'pass', who: 'O6', target: 'O5' }] },
      { say: 'O5 switches it, a long diagonal to O8 on the far side.', actions: [{ kind: 'switch', who: 'O5', target: 'O8' }] },
      { say: 'O8 attacks the space. O9 pins the defenders at the near post and O6 arrives late.', actions: [
        { kind: 'dribble', who: 'O8', to: xy(-17, 10) }, { kind: 'run', who: 'O9', to: xy(-4, 5) }, { kind: 'run', who: 'O6', to: xy(-3, 13) }] },
      { say: 'O8 pulls it back to O6.', actions: [{ kind: 'pass', who: 'O8', target: 'O6' }] },
      { say: 'O6 shoots.', actions: [{ kind: 'shot', who: 'O6' }] }
    ],
    reads: [{ who: 'O8', text: 'Defense shifted to the ball: far side is open' }, { who: 'O7', text: 'Nobody shifted: go 1v1 yourself' }]
  },
  {
    key: 'build-out', title: 'Build Out vs the Press', concept: 'Playing out under pressure',
    summary: 'The other team presses high. The backs split wide, the keeper passes to the left back, and the 6 comes to the side of the ball. The 6 plays it first time to the 8, who is facing forward. That beats the first line of the press, and the 8 carries it into the space behind.',
    cues: ['Backs: split wide', 'Six: show on the side', 'Face forward: go'],
    players: team({ O1: xy(0, 73), O2: xy(12, 66), O3: xy(-12, 66), O4: xy(0, 64), O5: xy(-3, 56), O6: xy(6, 50), O7: xy(21, 44), O8: xy(-21, 44), O9: xy(0, 34) }), ball: 'O1',
    beats: [
      { say: 'Goal kick. O2 and O3 split wide to the edges of the box.', actions: [{ kind: 'support', who: 'O3', to: xy(-19, 64) }, { kind: 'support', who: 'O2', to: xy(19, 64) }] },
      { say: 'O1 passes it out to O3.', actions: [{ kind: 'distribute', who: 'O1', target: 'O3' }] },
      { say: 'O5 shows on the side of the ball and O3 passes into him. O6 comes inside.', actions: [
        { kind: 'check', who: 'O5', to: xy(-11, 58) }, { kind: 'pass', who: 'O3', target: 'O5' }, { kind: 'support', who: 'O6', to: xy(-2, 52) }] },
      { say: 'O5 plays it first time to O6, facing forward.', actions: [{ kind: 'pass', who: 'O5', target: 'O6' }] },
      { say: 'The press is beaten. O6 carries it into the space; O8 checks back to the ball.', actions: [{ kind: 'carry', who: 'O6', to: xy(-2, 44) }, { kind: 'check', who: 'O8', to: xy(-18, 40) }] },
      { say: 'O6 passes to O8.', actions: [{ kind: 'pass', who: 'O6', target: 'O8' }] }
    ],
    reads: [{ who: 'O5', text: 'Your defender follows you: play it first time to the 8' }, { who: 'O3', text: 'Nobody presses: carry it forward yourself' },
      { who: 'O2', text: 'Left side crowded: keeper goes right' }]
  },
  {
    key: 'through-ball', title: 'Through Ball', concept: 'Run in behind',
    summary: 'The 8 carries it forward to make the defenders step up. The 9 bends a run across and behind the last defender, and the 8 slides the ball into the space in front of him. Through on goal.',
    cues: ['9: bend the run', 'Pass into space, not feet', 'Through on goal'],
    players: team({ O1: xy(0, 70), O2: xy(16, 50), O3: xy(-16, 50), O4: xy(0, 56), O5: xy(-4, 42), O6: xy(2, 34), O7: xy(20, 22), O8: xy(-20, 22), O9: xy(5, 19) }), ball: 'O6',
    beats: [
      { say: 'O6 carries it forward.', actions: [{ kind: 'carry', who: 'O6', to: xy(1, 28) }] },
      { say: 'O9 bends a run in behind and O6 slides the through ball into his path. O8 runs too.', actions: [
        { kind: 'run', who: 'O9', via: xy(7, 14), to: xy(-3, 9) }, { kind: 'through', who: 'O6', target: 'O9' }, { kind: 'run', who: 'O8', to: xy(-14, 12) }] },
      { say: 'O9 is through and shoots.', actions: [{ kind: 'shot', who: 'O9' }] }
    ],
    reads: [{ who: 'O9', text: 'Defender watching the ball: run behind his back' }, { who: 'O8', text: 'Center back covers the 9: you\'re free on the left' }]
  },
  {
    key: 'cross-finish', title: 'Cross and Finish', concept: 'Near post, far post, cutback',
    summary: 'The right winger gets wide of his defender and drives a low cross. The 9 sprints to the near post and drags the defenders with him, so the ball goes over to the 11 arriving at the far post. The 8 waits at the penalty spot for a cutback. Three runs, three chances.',
    cues: ['Near post, far post, spot', 'Drive it low', 'Arrive, don\'t wait'],
    players: team({ O1: xy(0, 70), O2: xy(16, 44), O3: xy(-16, 50), O4: xy(0, 56), O5: xy(-3, 40), O6: xy(4, 30), O7: xy(21, 22), O8: xy(-20, 22), O9: xy(1, 18) }), ball: 'O7',
    beats: [
      { say: 'O7 dribbles down the line. O9 attacks the near post, O8 the far post, O6 the penalty spot.', actions: [
        { kind: 'dribble', who: 'O7', to: xy(17, 7) }, { kind: 'run', who: 'O9', to: xy(5, 4.5) }, { kind: 'run', who: 'O8', to: xy(-6, 4) }, { kind: 'run', who: 'O6', to: xy(-1, 11) }] },
      { say: 'The defenders go with O9. O7 drives it across to O8 at the far post.', actions: [{ kind: 'cross', who: 'O7', target: 'O8' }] },
      { say: 'O8 finishes.', actions: [{ kind: 'shot', who: 'O8' }] }
    ],
    reads: [{ who: 'O8', text: 'Defenders go with the near-post run: far post' }, { who: 'O9', text: 'Keeper stays in the middle: near post' },
      { who: 'O6', text: 'Everyone runs at goal: cutback to the spot' }]
  },
  {
    key: 'counter-3v2', title: 'Counterattack 3v2', concept: 'Transition to attack',
    summary: 'We win it and three of us break against only two defenders. The 8 dribbles straight at the middle until one defender has to step up, then passes to the side he left. The winger draws the last defender and squares it to the 9 at the far post.',
    cues: ['Win it, go!', 'Wide runners: get wide', 'Commit him, then pass'],
    players: team({ O1: xy(0, 73), O2: xy(14, 64), O3: xy(-14, 64), O4: xy(0, 64), O5: xy(-4, 58), O6: xy(0, 50), O7: xy(14, 48), O8: xy(-16, 56), O9: xy(-10, 46) }).concat([
      P('X2', xy(-7, 26)), P('X3', xy(7, 26)), P('X6', xy(1, 54)), P('X7', xy(13, 52)), P('X9', xy(-9, 50))]), ball: 'O6',
    beats: [
      { say: 'O6 wins it and carries forward. O7 and O9 sprint wide. X2 and X3 drop; the rest chase back.', actions: [
        { kind: 'carry', who: 'O6', to: xy(0, 38) }, { kind: 'run', who: 'O7', to: xy(16, 34) }, { kind: 'run', who: 'O9', to: xy(-14, 34) },
        { kind: 'drop', who: 'X2', to: xy(-6, 20) }, { kind: 'drop', who: 'X3', to: xy(6, 20) }, { kind: 'track', who: 'X6', to: xy(1, 45) }, { kind: 'track', who: 'X7', to: xy(14, 42) }, { kind: 'track', who: 'X9', to: xy(-12, 42) }] },
      { say: 'O6 drives at the middle. X3 has to step up; X2 covers.', actions: [
        { kind: 'carry', who: 'O6', to: xy(0, 27) }, { kind: 'run', who: 'O7', to: xy(15, 22) }, { kind: 'run', who: 'O9', to: xy(-13, 22) },
        { kind: 'press', who: 'X3', to: xy(1, 24.5) }, { kind: 'cover', who: 'X2', to: xy(-4, 17) }, { kind: 'track', who: 'X6', to: xy(1, 36) }, { kind: 'track', who: 'X7', to: xy(14, 32) }, { kind: 'track', who: 'X9', to: xy(-12, 32) }] },
      { say: 'O6 passes to O7, on the side X3 left. O9 runs to the far post.', actions: [
        { kind: 'pass', who: 'O6', target: 'O7' }, { kind: 'run', who: 'O9', to: xy(-5, 6) },
        { kind: 'cover', who: 'X2', to: xy(4, 15) }, { kind: 'drop', who: 'X3', to: xy(3, 20) }, { kind: 'track', who: 'X6', to: xy(1, 30) }, { kind: 'track', who: 'X7', to: xy(14, 27) }, { kind: 'track', who: 'X9', to: xy(-10, 24) }] },
      { say: 'O7 dribbles at goal. X2 has to come to him.', actions: [
        { kind: 'dribble', who: 'O7', to: xy(12, 10) }, { kind: 'press', who: 'X2', to: xy(9, 8.5) }, { kind: 'drop', who: 'X3', to: xy(1, 12) }, { kind: 'track', who: 'X6', to: xy(2, 22) }, { kind: 'track', who: 'X7', to: xy(13, 17) }, { kind: 'track', who: 'X9', to: xy(-8, 15) }] },
      { say: 'O7 squares it to O9 at the far post.', actions: [
        { kind: 'pass', who: 'O7', target: 'O9' }, { kind: 'press', who: 'X2', to: xy(7, 6) }, { kind: 'drop', who: 'X3', to: xy(0, 9) }, { kind: 'track', who: 'X6', to: xy(2, 17) }, { kind: 'track', who: 'X7', to: xy(11, 13) }, { kind: 'track', who: 'X9', to: xy(-7, 10) }] },
      { say: 'O9 taps it in.', actions: [{ kind: 'shot', who: 'O9' }, { kind: 'drop', who: 'X2', to: xy(5, 5) }, { kind: 'drop', who: 'X3', to: xy(-1, 6) }] }
    ],
    reads: [{ who: 'O7', text: 'Defender steps up to the ball: pass to the side he left' }, { who: 'O6', text: 'Nobody steps up: keep dribbling and shoot' },
      { who: 'O9', text: 'Last defender and keeper go to the ball: back post' }]
  },
  {
    key: 'corner-near-post', title: 'Near-Post Corner', concept: 'Corner kick (on the ground)',
    summary: 'A low, driven corner. The 9 sprints in front of his defender to the near post and redirects it first time with his foot across the goal, and the 11 taps it in at the far post. The 8 and the 6 wait at the top of the box for anything that comes out.',
    cues: ['Low and hard to the near post', 'Get in front of him', 'Far post: be there'],
    players: team({ O1: xy(0, 70), O2: xy(10, 32), O3: xy(-12, 34), O4: xy(0, 40), O5: xy(-3, 24), O6: xy(1, 16), O7: 'right corner', O8: xy(-5, 11), O9: xy(4, 12) }), ball: 'O7',
    beats: [
      { say: 'O9 sprints in front of his defender to the near post. O8 goes far post; O6 and O5 hold the edge of the box.', actions: [
        { kind: 'run', who: 'O9', to: xy(6, 5) }, { kind: 'run', who: 'O8', to: xy(-5, 4) }, { kind: 'move', who: 'O6', to: xy(0, 13) }, { kind: 'move', who: 'O5', to: xy(-2, 19) }] },
      { say: 'O7 drives the corner low to O9.', actions: [{ kind: 'cross', who: 'O7', target: 'O9' }] },
      { say: 'O9 flicks it on first time to O8.', actions: [{ kind: 'flick', who: 'O9', target: 'O8' }] },
      { say: 'O8 taps it in at the far post.', actions: [{ kind: 'shot', who: 'O8' }] }
    ],
    reads: [{ who: 'O9', text: 'Get in front of your defender: near post' }, { who: 'O8', text: 'Ball gets flicked on: far post' }, { who: 'O6', text: 'Cleared out: shoot from the top of the box' }]
  },
  {
    key: 'throw-in', title: 'Throw-In: Throw It and Get It Back', concept: 'Throw-in pattern',
    summary: 'Nobody marks the thrower. The 8 checks away, then comes back for the throw to his feet and gives it straight back to the right back, who has stepped onto the field. He plays the 9 in behind.',
    cues: ['Check away, check back', 'Throw to feet', 'Give it back to the thrower'],
    players: team({ O1: xy(0, 70), O2: xy(24.4, 36), O3: xy(-16, 50), O4: xy(0, 54), O5: xy(-2, 42), O6: xy(14, 38), O7: xy(20, 28), O8: xy(-20, 26), O9: xy(5, 22) }), ball: 'O2',
    beats: [
      { say: 'O7 runs down the line to clear space. O6 checks away, then back toward O2.', actions: [{ kind: 'run', who: 'O7', to: xy(22, 18) }, { kind: 'check', who: 'O6', via: xy(12, 34), to: xy(19, 34) }] },
      { say: 'O2 throws it to O6\'s feet.', actions: [{ kind: 'throwin', who: 'O2', target: 'O6' }] },
      { say: 'O2 steps onto the field and O6 gives it straight back.', actions: [{ kind: 'run', who: 'O2', to: xy(21, 28) }, { kind: 'pass', who: 'O6', target: 'O2' }] },
      { say: 'O9 runs in behind and O2 plays him through.', actions: [{ kind: 'run', who: 'O9', via: xy(4, 14), to: xy(8, 10) }, { kind: 'through', who: 'O2', target: 'O9' }] },
      { say: 'O9 shoots.', actions: [{ kind: 'shot', who: 'O9' }] }
    ],
    reads: [{ who: 'O2', text: 'Nobody marks the thrower: get it back' }, { who: 'O7', text: 'Defender doesn\'t follow you: throw it down the line' }]
  },
  {
    key: 'pressing-trigger', lesson: 'defense', title: 'Press the Back Pass', concept: 'Defense: pressing triggers',
    summary: 'Defense. A pass backward is a trigger: the whole team steps up. The 9 curves his run to press the center back from one side, so one player takes away two passes. Everyone else jumps onto their player. The center back panics and kicks it long, right to us.',
    cues: ['Back pass: step up!', 'Curve your run', 'Everyone: find your player'],
    players: team({ O1: xy(0, 72), O2: xy(17, 60), O3: xy(-17, 60), O4: xy(0, 62), O5: xy(-2, 50), O6: xy(8, 45), O7: xy(21, 40), O8: xy(-21, 40), O9: xy(0, 30) }).concat(
      team({ X1: xy(0, 1.5), X2: xy(15, 55), X3: xy(-15, 55), X4: xy(1, 55), X5: xy(-2, 47.5), X6: xy(7, 42), X7: xy(19, 36), X8: xy(-19, 36), X9: xy(0, 26) })), ball: 'O5',
    beats: [
      { say: 'O5 passes back to O4. That\'s the trigger.', actions: [{ kind: 'pass', who: 'O5', target: 'O4' }] },
      { say: 'X4 curves his run to press O4 from the left, cutting off the pass to O3. X2 jumps O2, X5 and X6 mark tight.', actions: [
        { kind: 'press', who: 'X4', path: [xy(-4, 58)], to: xy(-2, 60) }, { kind: 'press', who: 'X2', to: xy(16, 57.5) }, { kind: 'mark', who: 'X5', to: xy(-1, 52) }, { kind: 'mark', who: 'X6', to: xy(7, 47) }, { kind: 'mark', who: 'X3', to: xy(-16, 57.5) }] },
      { say: 'No pass is on. O4 kicks it long and X9 steps in front of O9 to win it.', actions: [{ kind: 'mark', who: 'X9', to: xy(0, 33) }, { kind: 'clear', who: 'O4', target: 'X9' }] },
      { say: 'X9 wins it: attack again.', actions: [{ kind: 'carry', who: 'X9', to: xy(-4, 40) }] }
    ],
    reads: [{ who: 'X4', text: 'Back pass: press, curve your run to cut off the other side' }, { who: 'X2', text: 'Jump your player when the press goes' },
      { who: 'X9', text: 'Long ball coming: step in front and win it' }]
  },
  {
    key: 'pressure-cover-balance', lesson: 'defense', title: 'Pressure, Cover, Balance', concept: 'Defense: team shape',
    summary: 'Defense. The closest defender presses the ball and shows him outside (pressure). The next one stands behind and to the side (cover). The far-side defender tucks into the middle (balance). There\'s no way through, so they pass backward.',
    cues: ['First: pressure', 'Second: cover', 'Far side: tuck in'],
    players: team({ O1: xy(0, 72), O2: xy(16, 56), O3: xy(-16, 52), O4: xy(0, 58), O5: xy(-5, 42), O6: xy(5, 38), O7: xy(20, 24), O8: xy(-20, 26), O9: xy(-2, 16) }).concat(
      team({ X1: xy(0, 1.5), X2: xy(14, 52), X3: xy(-14, 48), X4: xy(0, 54), X5: xy(-4, 37), X6: xy(4, 33), X7: xy(17, 20), X8: xy(-17, 21), X9: xy(-2, 12.5) })), ball: 'O8',
    beats: [
      { say: 'X8 presses O8, goal-side, showing him outside. X9 covers behind. X7 tucks in for balance.', actions: [
        { kind: 'press', who: 'X8', to: xy(-18.5, 23.5) }, { kind: 'cover', who: 'X9', to: xy(-10, 16) }, { kind: 'drop', who: 'X7', to: xy(6, 13) }] },
      { say: 'O8 is forced toward the line. X8 stays with him, X9 and X7 shift.', actions: [
        { kind: 'dribble', who: 'O8', to: xy(-21, 18) }, { kind: 'press', who: 'X8', to: xy(-20, 16.5) }, { kind: 'cover', who: 'X9', to: xy(-13, 12) }, { kind: 'move', who: 'X7', to: xy(4, 11) }] },
      { say: 'No way through. O8 passes backward to O5.', actions: [{ kind: 'pass', who: 'O8', target: 'O5' }] }
    ],
    reads: [{ who: 'X8', text: 'Nearest to the ball: pressure, show him outside' }, { who: 'X9', text: 'Second defender: cover behind at an angle' },
      { who: 'X7', text: 'Far side: tuck in, the far winger can wait' }]
  },
  {
    key: 'compact-block', lesson: 'defense', title: 'Compact Block', concept: 'Defense: shift as a unit',
    summary: 'Defense. We stay close together, like a box that slides. Every time they pass across, the whole team shifts to the ball side, and the players far from the ball tuck in. They can pass around us, but not through us.',
    cues: ['Stay close', 'Shift with the ball', 'Far side: tuck in'],
    players: team({ O1: xy(0, 72), O2: xy(18, 58), O3: xy(-18, 58), O4: xy(0, 62), O5: xy(-5, 50), O6: xy(6, 50), O7: xy(21, 42), O8: xy(-21, 42), O9: xy(0, 32) }).concat(
      team({ X1: xy(0, 1.5), X3: xy(-15, 52), X4: xy(-5, 52), X2: xy(6, 48), X5: xy(-8, 42), X6: xy(1, 42), X8: xy(-16, 34), X9: xy(-6, 30), X7: xy(6, 30) })), ball: 'O3',
    beats: [
      { say: 'Ball on their left: our block is shifted that way. O3 passes to O4 in the middle; we slide with it and X4 presses.', actions: [
        { kind: 'pass', who: 'O3', target: 'O4' }, { kind: 'press', who: 'X4', to: xy(0, 58) }, { kind: 'move', who: 'X3', to: xy(-9, 50) }, { kind: 'move', who: 'X2', to: xy(9, 50) },
        { kind: 'move', who: 'X5', to: xy(-4, 42) }, { kind: 'move', who: 'X6', to: xy(5, 42) }, { kind: 'move', who: 'X8', to: xy(-10, 32) }, { kind: 'move', who: 'X9', to: xy(0, 30) }, { kind: 'move', who: 'X7', to: xy(10, 32) }] },
      { say: 'O4 passes to O2 on the right. The whole block slides right; the far side tucks in.', actions: [
        { kind: 'pass', who: 'O4', target: 'O2' }, { kind: 'press', who: 'X2', to: xy(16, 55) }, { kind: 'cover', who: 'X4', to: xy(7, 54) }, { kind: 'move', who: 'X3', to: xy(-4, 50) },
        { kind: 'move', who: 'X6', to: xy(9, 43) }, { kind: 'move', who: 'X5', to: xy(1, 42) }, { kind: 'move', who: 'X7', to: xy(16, 34) }, { kind: 'move', who: 'X9', to: xy(6, 30) }, { kind: 'move', who: 'X8', to: xy(-4, 32) }] },
      { say: 'Nothing through the middle. O2 has to go back to O1.', actions: [{ kind: 'pass', who: 'O2', target: 'O1' }] }
    ],
    reads: [{ who: 'X2', text: 'Ball comes to your side: press' }, { who: 'X5', text: 'Shift with the ball, stay close to your partner' },
      { who: 'X8', text: 'Far side: tuck in toward the middle' }]
  }
];

const { cutback: _cutback, ...SHARED } = SOCCER7_ALIASES;   // 9v9 calls the cutback play "cross and finish"
export const SOCCER9_ALIASES = Object.assign({}, SHARED, {
  'cross-finish': ['cross', 'cross and finish', 'crossing', 'near post far post', 'far post', 'back post', 'cross it', 'cutback', 'cut back', 'across', 'cross in finish', 'kraus'],
  'pressing-trigger': ['pressing trigger', 'press', 'pressing', 'trigger', 'press the back pass', 'back pass', 'high press', 'curve your run', 'presting', 'pressing triggers'],
  'compact-block': ['compact', 'compact block', 'stay compact', 'shift', 'shift across', 'low block', 'mid block', 'block', 'zonal', 'compact back', 'combat block']
});
