// Five lanes: attacking shape as geometry, in the words of positional play (juego de posición) and the principles
// of attack (width, depth, penetration, support). The pitch splits into five vertical lanes (two wide lanes, two
// half-spaces, the central lane); the best places to finish from are Zone 14 (central, just outside the box) and
// the cutback zone (between the six-yard box and the penalty spot), reached from the byline. Built per pitch
// (soccer7 / soccer9): yards, x across, y from the goal we attack (0) to our own goal line (L). Data only.

export function fiveLanes(sportId, o) {
  const h = o.W / 2, L = o.L, bw = o.boxW / 2, c = o.boxW / 4, box = o.box, z14 = box * 1.75, cutTop = o.pen + 1.5;
  const Z = [
    { id: 'box', kind: 'rect', x: [-bw, bw], y: [0, box], tone: 'red', label: ['Penalty', 'area'], at: [0, box - 1.6],
      ask: 'You get the ball in the penalty area.', rule: 'Penalty area: shoot early, low and across the keeper' },
    { id: 'cut', kind: 'rect', x: [-c, c], y: [o.six, cutTop], tone: 'hot', label: ['Cutback', 'zone'], at: [0, (o.six + cutTop) / 2],
      ask: 'You arrive here as the winger reaches the byline.', rule: 'Cutback zone: arrive late, meet the pull-back first time' },
    { id: 'byL', kind: 'rect', x: [-h, -bw], y: [0, box], tone: 'gold', label: ['Byline'], at: [-(h + bw) / 2, box / 2],
      ask: 'You have it wide, close to their byline.', rule: 'Byline: get to the end line and pull it back to the cutback zone' },
    { id: 'byR', kind: 'rect', x: [bw, h], y: [0, box], tone: 'gold', label: ['Byline'], at: [(h + bw) / 2, box / 2],
      ask: 'You have it wide, close to their byline.', rule: 'Byline: get to the end line and pull it back to the cutback zone' },
    { id: 'z14', kind: 'rect', x: [-c, c], y: [box, z14], tone: 'o', label: ['Zone 14'], at: [0, (box + z14) / 2],
      ask: 'You get it in the middle, just outside their box.', rule: 'Zone 14: receive on the half-turn, shoot or slip the runner in behind' },
    { id: 'central', kind: 'rect', x: [-c, c], y: [z14, L], tone: 'ice', label: ['Central', 'lane'], at: [0, L * 0.6],
      ask: 'You’re in the central lane, behind the ball.', rule: 'Central lane: support behind the ball, play through the lines or switch it' },
    { id: 'halfL', kind: 'rect', x: [-bw, -c], y: [box, L], tone: 'warn', label: ['Half-', 'space'], at: [-(bw + c) / 2, L * 0.45],
      ask: 'You’re in the half-space, between the wide lane and the middle.', rule: 'Half-space: receive between the lines, face forward, play the through ball' },
    { id: 'halfR', kind: 'rect', x: [c, bw], y: [box, L], tone: 'warn', label: ['Half-', 'space'], at: [(bw + c) / 2, L * 0.45],
      ask: 'You’re in the half-space, between the wide lane and the middle.', rule: 'Half-space: receive between the lines, face forward, play the through ball' },
    { id: 'wideL', kind: 'rect', x: [-h, -bw], y: [box, L], tone: 'good', label: ['Wide', 'lane'], at: [-(h + bw) / 2, L * 0.45],
      ask: 'You’re the winger, out in the wide lane.', rule: 'Wide lane: hold the touchline, stretch them, then go 1 v 1' },
    { id: 'wideR', kind: 'rect', x: [bw, h], y: [box, L], tone: 'good', label: ['Wide', 'lane'], at: [(h + bw) / 2, L * 0.45],
      ask: 'You’re the winger, out in the wide lane.', rule: 'Wide lane: hold the touchline, stretch them, then go 1 v 1' },
    // the lane lines, and the ways the ball goes
    { id: 'lanes', kind: 'line', pts: [[-c, box], [-c, L]], tone: 'ice', dash: true },
    { id: 'lanes2', kind: 'line', pts: [[c, box], [c, L]], tone: 'ice', dash: true },
    { id: 'lanes3', kind: 'line', pts: [[-bw, box], [-bw, L]], tone: 'ice', dash: true },
    { id: 'lanes4', kind: 'line', pts: [[bw, box], [bw, L]], tone: 'ice', dash: true },
    { id: 'switch', kind: 'arrow', pts: [[-h + 3, L * 0.5], [0, L * 0.56], [h - 3, L * 0.5]], tone: 'ice' },
    { id: 'pullback', kind: 'arrow', pts: [[bw + 1, 1.5], [1, o.pen]], tone: 'hot' },
    { id: 'through', kind: 'arrow', pts: [[0, box + 4], [-2, box - 4]], tone: 'o' }
  ];
  const DEMOS = {
    width: { dur: 3, actors: [
      { side: 'O', label: '11', path: [[-c, L * 0.5], [-h + 2, L * 0.45]] }, { side: 'O', label: '7', path: [[c, L * 0.5], [h - 2, L * 0.45]] },
      { side: 'O', label: '8', path: [[0, L * 0.6], [0, L * 0.58]] }, { side: 'ball', path: [[0.6, L * 0.59], [0.6, L * 0.57]] }] },
    cutback: { dur: 3.6, actors: [
      { side: 'O', label: '7', path: [[h - 3, box + 8], [h - 4, box + 2], [bw + 1, 1.8], [bw + 1, 1.8]] },
      { side: 'O', label: '8', path: [[-3, box + 9], [-2.5, box + 4], [-1.5, cutTop + 1], [-1, o.pen]] },
      { side: 'ball', path: [[h - 3.6, box + 7.4], [h - 4.6, box + 1.4], [bw + 0.4, 1.4], [-0.6, o.pen - 0.4]] }] },
    z14: { dur: 3.2, actors: [
      { side: 'O', label: '10', path: [[0, z14 + 3], [0, box + 4], [0, box + 4]] },
      { side: 'O', label: '9', path: [[3, box + 1.5], [3.5, box + 1], [-2, box - 4]] },
      { side: 'ball', path: [[0.5, z14 + 2.4], [0.5, box + 3.4], [-1.5, box - 4.5]] }] },
    switch: { dur: 3.2, actors: [
      { side: 'O', label: '3', path: [[-h + 3, L * 0.5], [-h + 3, L * 0.5]] }, { side: 'O', label: '8', path: [[0, L * 0.56], [0, L * 0.56]] },
      { side: 'O', label: '7', path: [[h - 3, L * 0.5], [h - 3, L * 0.48]] },
      { side: 'ball', path: [[-h + 3.6, L * 0.5], [0.6, L * 0.55], [h - 3.6, L * 0.48]] }] }
  };
  const Lv = {
    kids: [
      { t: 'Spread out', say: 'Two friends stay right by the sidelines, the rest spread across the middle. A big field is hard to defend!', show: ['wideL', 'wideR', 'central'], hot: ['wideL', 'wideR'], demo: 'width', cue: 'Get wide!' },
      { t: 'Run to the end line', say: 'If you’re by the sideline with the ball, dribble all the way to the end line.', show: ['byL', 'byR', 'wideR'], hot: ['byR'], demo: 'cutback', cue: 'To the end!' },
      { t: 'Pass it back', say: 'From the end line, pass it back across the ground to a friend running in. Easy goal!', show: ['pullback', 'cut', 'byR'], hot: ['cut'], demo: 'cutback', cue: 'Pass it back!' },
      { t: 'Shoot!', say: 'In the big box, shoot right away, low and hard.', show: ['box'], hot: ['box'], demo: 'z14', cue: 'Shoot!' }
    ],
    starter: [
      { t: 'Five lanes', say: 'The pitch has five lanes: two wide lanes by the touchlines, two half-spaces, and the central lane. Never two teammates in the same lane on the same line.', show: ['wideL', 'halfL', 'central', 'halfR', 'wideR', 'lanes', 'lanes2', 'lanes3', 'lanes4'], hot: ['wideL', 'halfL', 'central', 'halfR', 'wideR'], demo: 'width', cue: 'Own your lane' },
      { t: 'Width', say: 'Wingers hold the touchline. The wider we are, the more space opens up inside for everyone else.', show: ['wideL', 'wideR'], hot: ['wideL', 'wideR'], demo: 'width', cue: 'Hold the width' },
      { t: 'Switch it', say: 'When one side is crowded, move the ball through the central lane to the other wide lane, where there’s space.', show: ['switch', 'wideL', 'wideR', 'central'], hot: ['wideR'], demo: 'switch', cue: 'Switch!' },
      { t: 'Byline and cutback', say: 'Get to the byline, then pull it back along the ground to the cutback zone, between the six-yard box and the penalty spot.', show: ['byL', 'byR', 'pullback', 'cut'], hot: ['cut'], demo: 'cutback', cue: 'Cut it back!' },
      { t: 'Zone 14', say: 'The space in the middle just outside their box. Get the ball there facing goal and you can shoot or play a runner in.', show: ['z14', 'through', 'box'], hot: ['z14'], demo: 'z14', cue: 'Zone 14!' }
    ],
    varsity: [
      { t: 'The shape', say: 'Width from the wide lanes, players between the lines in the half-spaces, support behind the ball in the central lane. Penetrate through Zone 14 or around to the byline.', show: ['wideL', 'halfL', 'central', 'halfR', 'wideR', 'z14', 'byL', 'byR'], cue: 'Width, then penetrate' },
      { t: 'Half-spaces', say: 'The half-space is the best place to receive: defenders there aren’t sure whose player you are. Receive on the half-turn, face forward.', show: ['halfL', 'halfR'], hot: ['halfL', 'halfR'], cue: 'Half-turn' },
      { t: 'Zone 14 and the through ball', say: 'From Zone 14, shoot or slip the striker in behind. The run starts before the pass.', show: ['z14', 'through', 'box'], hot: ['z14'], demo: 'z14', cue: 'Slip him in' },
      { t: 'The cutback', say: 'A pull-back from the byline to the cutback zone is the highest-percentage chance in youth soccer. Arrive late, between the six and the penalty spot.', show: ['byR', 'pullback', 'cut'], hot: ['cut'], demo: 'cutback', cue: 'Arrive late' },
      { t: 'Switch to isolate', say: 'Draw them to one side, switch it to the far wide lane, and the winger goes 1 v 1 before they shift across.', show: ['switch', 'wideL', 'wideR'], hot: ['wideR'], demo: 'switch', cue: 'Isolate' }
    ],
    coach: [
      { t: 'The idea in one line', say: 'Stretch them across five lanes, get into Zone 14 or to the byline, and finish from the cutback zone.', show: ['wideL', 'halfL', 'central', 'halfR', 'wideR', 'z14', 'cut'], cue: 'Lanes, then finish' },
      { t: 'Teaching order', say: 'Width, then the switch, then byline and cutback, then Zone 14, then receiving in the half-spaces.', show: ['wideL', 'wideR'], hot: ['wideL', 'wideR'], cue: 'One a week' },
      { t: 'Drill: five-lane game', say: 'Mark the five lanes with cones. Rule: no two attackers in the same lane. A goal from a cutback counts double.', show: ['wideL', 'halfL', 'central', 'halfR', 'wideR', 'lanes', 'lanes2', 'lanes3', 'lanes4'], demo: 'width', cue: 'Own your lane' },
      { t: 'Drill: cutback finishing', say: 'Wingers dribble to the byline and pull it back; two runners arrive late, one near post, one in the cutback zone. Rotate.', show: ['byL', 'byR', 'pullback', 'cut'], hot: ['cut'], demo: 'cutback', cue: 'Arrive late' },
      { t: 'What to chart', say: 'Touches in Zone 14, balls to the byline, and shots from the cutback zone. More of those three means more goals.', show: ['z14', 'byL', 'byR', 'cut'], hot: ['z14', 'cut'], cue: 'Chart three things' },
      { t: 'By age', say: 'Under 9: spread out, to the end line, pass it back. 9 to 12: width, the switch, the cutback. 13 and up: half-spaces and Zone 14.', show: ['wideL', 'wideR', 'byL', 'byR', 'cut'], cue: 'Grow it' }
    ]
  };
  return {
    id: 'lanes', sport: sportId, kind: 'offense',
    title: 'Five lanes', sub: 'Width, half-spaces, Zone 14 and the cutback',
    line: 'Stretch them across five lanes, get into Zone 14 or to the byline, and finish from the cutback zone.',
    credit: 'Built on positional play’s five lanes and the principles of attack',
    zones: Z, demos: DEMOS, levels: Lv,
    quiz: { kids: ['rule'], starter: ['rule'], varsity: ['rule'], coach: ['rule'] },
    cues: ['Get wide!', 'Switch!', 'Cut it back!', 'Zone 14!', 'Arrive late']
  };
}
