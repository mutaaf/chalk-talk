// Guard the space: man defense as geometry (after Mike Dunlap's defensive system). The half court is cut into
// alleys by a split line rim to rim; where the ball is decides the job. Coordinates are the basketball pack's:
// feet, x across (-25 to 25), y up from the baseline (0) to half court (47). Taught in our own words.
//
// A concept file is data only: zones (drawn on the court), demos (little scripted clips), four levels of steps
// that reveal zones one idea at a time, and the quiz kinds the engine (src/engine/space.js) can ask at each level.

const Z = [
  // the lines and lanes
  { id: 'split', kind: 'line', pts: [[0, 0], [0, 47]], tone: 'ice', label: ['Split line'], at: [0, 45.2] },
  { id: 'sideL', kind: 'rect', x: [-25, -16], y: [0, 47], tone: 'good', label: ['Sideline', 'alley'], at: [-20.5, 33],
    ask: 'The ball is on the sideline.', rule: 'Keep it in the sideline alley' },
  { id: 'sideR', kind: 'rect', x: [16, 25], y: [0, 47], tone: 'good', label: ['Sideline', 'alley'], at: [20.5, 33],
    ask: 'The ball is on the sideline.', rule: 'Keep it in the sideline alley' },
  { id: 'forceL', kind: 'rect', x: [-16, -7], y: [19, 47], tone: 'warn', label: ['Force', 'lane'], at: [-11.5, 33],
    ask: 'The ball is here, between the middle and the sideline.', rule: 'Force it to the sideline' },
  { id: 'forceR', kind: 'rect', x: [7, 16], y: [19, 47], tone: 'warn', label: ['Force', 'lane'], at: [11.5, 33],
    ask: 'The ball is here, between the middle and the sideline.', rule: 'Force it to the sideline' },
  { id: 'middle', kind: 'rect', x: [-7, 7], y: [19, 47], tone: 'warn', label: ['Middle', 'alley'], at: [0, 38],
    ask: 'The ball is in the middle.', rule: 'Keep it in front and turn it' },
  // the V: the middle narrows toward the elbows, the closer the ball gets, the less middle you can give
  { id: 'vee', kind: 'line', pts: [[-25, 15], [0, 31], [25, 15]], tone: 'ice', dash: true },
  // near the basket
  { id: 'red', kind: 'rect', x: [-8, 8], y: [0, 19], tone: 'red', label: ['Red zone'], at: [0, 13.5],
    ask: 'The ball gets inside, into the paint.', rule: 'No easy baskets: contest, no layups' },
  { id: 'postL', kind: 'rect', x: [-16, -8], y: [0, 19], tone: 'hot', label: ['Low', 'post'], at: [-12, 9],
    ask: 'A post player sets up here.', rule: 'Full front: don’t let the post catch it' },
  { id: 'postR', kind: 'rect', x: [8, 16], y: [0, 19], tone: 'hot', label: ['Low', 'post'], at: [12, 9],
    ask: 'A post player sets up here.', rule: 'Full front: don’t let the post catch it' },
  { id: 'elbowL', kind: 'circle', c: [-8, 19], r: 3, tone: 'hot', label: ['Elbow'], at: [-8, 23.6],
    ask: 'The dribbler is heading for the elbow.', rule: 'Wall up: no penetration at the elbow' },
  { id: 'elbowR', kind: 'circle', c: [8, 19], r: 3, tone: 'hot', label: ['Elbow'], at: [8, 23.6],
    ask: 'The dribbler is heading for the elbow.', rule: 'Wall up: no penetration at the elbow' },
  { id: 'ppL', kind: 'circle', c: [-11.5, 42], r: 3.2, tone: 'gold', label: ['Pressure', 'point'], at: [-11.5, 37.6],
    ask: 'The ball is dribbled here, near half court and the sideline.', rule: 'Pressure point: trap it or squeeze the pass' },
  { id: 'ppR', kind: 'circle', c: [11.5, 42], r: 3.2, tone: 'gold', label: ['Pressure', 'point'], at: [11.5, 37.6],
    ask: 'The ball is dribbled here, near half court and the sideline.', rule: 'Pressure point: trap it or squeeze the pass' },
  // the way the ball should go
  { id: 'turnL', kind: 'arrow', pts: [[-2.5, 35], [-12.5, 28]], tone: 'o' },
  { id: 'turnR', kind: 'arrow', pts: [[2.5, 35], [12.5, 28]], tone: 'o' },
  { id: 'downL', kind: 'arrow', pts: [[-20.5, 28], [-20.5, 6]], tone: 'good' },
  { id: 'downR', kind: 'arrow', pts: [[20.5, 28], [20.5, 6]], tone: 'good' }
];

// demos: who moves where over one loop (seconds); the ball rides with whoever has it
const DEMOS = {
  turn: { dur: 3.4, actors: [
    { side: 'O', label: '1', ball: true, path: [[0, 41], [-2.5, 37], [-8, 32.5], [-13.5, 28.5], [-18, 24]] },
    { side: 'D', label: '1', path: [[1.6, 38.6], [-0.6, 34.8], [-5.8, 30.5], [-11, 26.6], [-15.4, 22.4]] }] },
  side: { dur: 3, actors: [
    { side: 'O', label: '1', ball: true, path: [[-20.5, 38], [-20.5, 26], [-20.5, 14]] },
    { side: 'D', label: '1', path: [[-17.6, 36.2], [-17.6, 24.2], [-17.6, 12.4]] }] },
  elbow: { dur: 2.8, actors: [
    { side: 'O', label: '2', ball: true, path: [[-18, 27], [-13.5, 23.5], [-12, 22.6], [-12.6, 23.2]] },
    { side: 'D', label: '2', path: [[-15.5, 24.5], [-11.5, 21.6], [-9.8, 20.6], [-9.8, 20.6]] }] },
  trap: { dur: 3.4, actors: [
    { side: 'O', label: '1', ball: true, path: [[-4, 39], [-8, 40.5], [-11.5, 42], [-11.8, 42.2]] },
    { side: 'D', label: '1', path: [[-2.4, 37], [-6.6, 38.4], [-10, 39.8], [-10.3, 40.2]] },
    { side: 'D', label: '2', path: [[-15, 31], [-14.5, 35.5], [-13.6, 40], [-13.4, 43.3]] }] },
  front: { dur: 3, actors: [
    { side: 'O', label: '3', ball: true, path: [[-20, 23], [-20, 23]] },
    { side: 'O', label: '5', path: [[-10, 7.5], [-10.5, 8]] },
    { side: 'D', label: '5', path: [[-9.4, 5], [-12.2, 7.6], [-12.6, 10.2]] },
    { side: 'D', label: '4', path: [[12, 10], [4, 9], [1.2, 8.5]] }] },
  help: { dur: 3, actors: [
    { side: 'O', label: '2', ball: true, path: [[-19, 23], [-19, 23]] },
    { side: 'O', label: '3', path: [[19, 20], [19, 20]] },
    { side: 'D', label: '3', path: [[16.4, 18.4], [6, 15], [1.4, 13.5]] }] },
  red: { dur: 2.6, actors: [
    { side: 'O', label: '4', ball: true, path: [[-7, 15], [-4, 11], [-2.6, 8.6]] },
    { side: 'D', label: '5', path: [[1.5, 5], [-0.6, 6.6], [-1.6, 7.4]] }] }
};

const L = {
  kids: [
    { t: 'The court has lanes', say: 'Like a swimming pool, the court has lanes. A line runs right down the middle, rim to rim.', show: ['split', 'sideL', 'sideR', 'middle'], hot: ['split'], cue: 'Lanes!' },
    { t: 'Keep them out of the middle', say: 'When you guard the dribbler, stand a little on the middle side. Then the only way to go is to the side.', show: ['split', 'middle', 'turnL', 'turnR'], hot: ['middle'], demo: 'turn', cue: 'Middle side!' },
    { t: 'The side lane is the slow lane', say: 'Let them dribble down the side. The sideline is like an extra defender.', show: ['sideL', 'sideR', 'downL', 'downR'], hot: ['sideL', 'sideR'], demo: 'side', cue: 'Side lane!' },
    { t: 'Stand in front of the big kid', say: 'If someone waits near the basket for the ball, stand in front of them so the pass can’t get there.', show: ['postL', 'postR'], hot: ['postL'], demo: 'front', cue: 'In front!' },
    { t: 'The red box', say: 'Nobody gets an easy layup in the red box. Hands up high, feet on the floor.', show: ['red'], hot: ['red'], demo: 'red', cue: 'Hands up!' }
  ],
  starter: [
    { t: 'The split line', say: 'Draw a line from rim to rim. When the ball is on one side, the defenders on the other side sink to the line. That’s where help comes from.', show: ['split'], hot: ['split'], demo: 'help', cue: 'Split it!' },
    { t: 'Three kinds of alley', say: 'A middle alley, two sideline alleys, and a lane in between where you push the ball out. Where the ball is tells you your job.', show: ['split', 'sideL', 'sideR', 'forceL', 'forceR', 'middle'], cue: 'Know your alley' },
    { t: 'Turn the ball', say: 'In the middle, keep the ball in front of you and turn it toward the nearest sideline. Nose on its inside shoulder.', show: ['split', 'middle', 'forceL', 'forceR', 'turnL', 'turnR'], hot: ['middle'], demo: 'turn', cue: 'Turn it!' },
    { t: 'Keep it on the sideline', say: 'Once it’s on the sideline, keep it there. Don’t let it come back to the middle.', show: ['sideL', 'sideR', 'downL', 'downR'], hot: ['sideL'], demo: 'side', cue: 'Keep it!' },
    { t: 'No penetration at the elbows', say: 'The elbow is the door to the paint. Beat the dribbler there and stand tall.', show: ['elbowL', 'elbowR', 'red'], hot: ['elbowL', 'elbowR'], demo: 'elbow', cue: 'Wall!' },
    { t: 'Full front the post', say: 'A post on the ball side: get in front, not behind. The help on the split line takes the lob.', show: ['postL', 'postR', 'split'], hot: ['postL'], demo: 'front', cue: 'Front!' },
    { t: 'The red zone', say: 'No easy baskets. Contest every shot, no layups, take the charge.', show: ['red'], hot: ['red'], demo: 'red', cue: 'Nothing easy!' }
  ],
  varsity: [
    { t: 'Guard the space', say: 'Don’t just guard your man; guard the place he wants to go. The ball’s alley tells all five of you where to stand.', show: ['split', 'sideL', 'sideR', 'forceL', 'forceR', 'middle', 'red', 'postL', 'postR', 'elbowL', 'elbowR', 'ppL', 'ppR'], cue: 'Space, not faces' },
    { t: 'Middle: in front, then out', say: 'In the middle alley you can’t give a straight line. Contain first, then turn it to a force lane. As it gets closer, the V narrows: less middle to give.', show: ['middle', 'vee', 'turnL', 'turnR', 'split'], hot: ['middle', 'vee'], demo: 'turn', cue: 'Contain, turn' },
    { t: 'Split-line help', say: 'Ball on one side: the far side sinks to the split line, one foot on it, seeing man and ball. A drive that gets by meets a body.', show: ['split', 'sideL', 'forceL'], hot: ['split'], demo: 'help', cue: 'Sink to the line' },
    { t: 'Pressure points', say: 'Where the force lane meets half court, the sideline and the half-court line do half the guarding. Trap there, or squeeze the pass out.', show: ['ppL', 'ppR', 'forceL', 'forceR', 'sideL', 'sideR'], hot: ['ppL', 'ppR'], demo: 'trap', cue: 'Trap the corner' },
    { t: 'Elbows', say: 'No penetration at the elbows. Beat the ball to the spot with your top foot; help comes from the split line, not the post defender.', show: ['elbowL', 'elbowR', 'red', 'split'], hot: ['elbowL', 'elbowR'], demo: 'elbow', cue: 'Top foot, wall' },
    { t: 'Full front, back-side help', say: 'Front the post below the free-throw line on the ball side. The lob is covered by the split-line defender; pressure on the passer makes it a bad one.', show: ['postL', 'postR', 'split'], hot: ['postL', 'split'], demo: 'front', cue: 'Front and help' },
    { t: 'The red zone', say: 'Every shot here is contested with two hands high. No fouls on jump shots, take the charge on drives, and finish the play with a box-out.', show: ['red'], hot: ['red'], demo: 'red', cue: 'Two hands, no foul' }
  ],
  coach: [
    { t: 'The idea in one line', say: 'Defense is geometry: control the ball’s path and the other four know where to be. Teach places before people.', show: ['split', 'sideL', 'sideR', 'forceL', 'forceR', 'middle', 'red', 'postL', 'postR', 'elbowL', 'elbowR', 'ppL', 'ppR'], cue: 'Places before people' },
    { t: 'The teaching order', say: 'Split line, then alleys, then turning the ball, then the elbows, then the post, then pressure points. Little ones get the first three only.', show: ['split', 'middle', 'sideL', 'sideR'], hot: ['split'], cue: 'One layer a week' },
    { t: 'Drill: alley one-on-one', say: 'Cones on the 7 and 16 foot lines. The dribbler tries to reach the middle from half court; the defender scores by keeping it in the alley to the free-throw line.', show: ['forceL', 'middle', 'sideL'], hot: ['forceL'], demo: 'turn', cue: 'Win the alley' },
    { t: 'Drill: shell with alleys', say: 'Four on four, passing only. On each catch, call the ball’s alley; everyone jumps: on-ball turns, far side to the split line, post fronted.', show: ['split', 'sideL', 'sideR', 'postL', 'postR', 'middle'], hot: ['split'], demo: 'help', cue: 'Call the alley' },
    { t: 'Drill: elbow wall', say: 'Dribbler from the wing attacks the elbow. Defender must beat them to the spot; count stops in ten tries.', show: ['elbowL', 'elbowR'], hot: ['elbowL'], demo: 'elbow', cue: '10 tries' },
    { t: 'What to chart', say: 'Middle-alley drives allowed, post catches below the line, and shots in the red zone. If those three go down, the system is working.', show: ['middle', 'postL', 'postR', 'red'], hot: ['middle', 'postL', 'postR', 'red'], cue: 'Chart three things' },
    { t: 'By age', say: 'Under 10: middle side, side lane, in front, hands up. 10 to 13: add the split line and elbows. 14 and up: pressure points and traps.', show: ['split', 'middle', 'sideL', 'sideR', 'postL', 'postR', 'red'], cue: 'Grow it' }
  ]
};

export default {
  id: 'space', sport: 'basketball', kind: 'defense',
  title: 'Guard the space', sub: 'Alleys, the split line and the red zone',
  line: 'Defense is geometry. Where the ball is tells every defender where to be.',
  credit: 'After Mike Dunlap’s defensive system',
  zones: Z, demos: DEMOS, levels: L,
  // the defense on every play, when this system is on: feet of shade, sink and front (engine/space.js defenseSystem)
  defense: { forceSideline: 1.3, splitLine: 1.5, frontPost: 2.2 },
  // which questions each level gets: way (which way do you push it), rule (what's the job here), help (tap your help spot)
  way: { x: [2.5, 14.5], y: [22, 43], mid: 7, ask: 'You’re guarding the ball. Which way do you push it?',
    kids: 'Push it to the side lane, the one closest to the ball. The sideline helps you!',
    middle: 'Turn it out of the middle, toward the nearest sideline.', why: 'Force it to the nearest sideline: it’s the extra defender.' },
  quiz: { kids: ['way'], starter: ['way', 'rule'], varsity: ['rule', 'way', 'help'], coach: ['rule', 'way', 'help'] },
  cues: ['Middle side!', 'Side lane!', 'Wall!', 'Front!', 'Nothing easy!']
};
