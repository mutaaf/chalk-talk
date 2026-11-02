// Pressure, cover, balance: the principles of defending, as geometry. The first defender pressures and shows the
// dribbler outside, the second covers, the far side balances; protect the penalty area and Zone 14 (the central
// space just outside the box), and press in the attacking third only on a trigger. Areas use the game's own names:
// thirds, central channel, half-spaces, wide channels, crossing zones. Built for a pitch (soccer7 / soccer9):
// yards, x across (-W/2..W/2), y from our goal line (0) to theirs (L). Data only.

export function showOutside(sportId, o) {
  const h = o.W / 2, L = o.L, bw = o.boxW / 2, box = o.box, c = o.W * 0.18, s = o.W * 0.32, hi = L * 2 / 3, z14 = box + box * 0.75;
  const Z = [
    { id: 'box', kind: 'rect', x: [-bw, bw], y: [0, box], tone: 'red', label: ['Penalty', 'area'], at: [0, box * 0.55],
      ask: 'The attacker has the ball in your penalty area.', rule: 'Penalty area: stay on your feet and block the shot' },
    { id: 'byL', kind: 'rect', x: [-h, -bw], y: [0, box], tone: 'hot', label: ['Crossing', 'zone'], at: [-(h + bw) / 2, box * 0.5],
      ask: 'The attacker is wide, near your byline.', rule: 'Crossing zone: show him to the byline, block the cross' },
    { id: 'byR', kind: 'rect', x: [bw, h], y: [0, box], tone: 'hot', label: ['Crossing', 'zone'], at: [(h + bw) / 2, box * 0.5],
      ask: 'The attacker is wide, near your byline.', rule: 'Crossing zone: show him to the byline, block the cross' },
    { id: 'z14', kind: 'rect', x: [-c, c], y: [box, z14], tone: 'red', label: ['Zone 14'], at: [0, (box + z14) / 2],
      ask: 'The attacker has it just outside your box, in the middle.', rule: 'Zone 14: pressure now, no turn and no shot' },
    { id: 'centre', kind: 'rect', x: [-c, c], y: [z14, hi], tone: 'warn', label: ['Central', 'channel'], at: [0, (z14 + hi) / 2],
      ask: 'The attacker dribbles at you through the middle.', rule: 'Central channel: delay, stay goal-side, show him outside' },
    { id: 'halfL', kind: 'rect', x: [-s, -c], y: [box, hi], tone: 'gold', label: ['Half-', 'space'], at: [-(s + c) / 2, (box + hi) / 2],
      ask: 'The attacker is in the half-space, between the middle and the touchline.', rule: 'Half-space: angle your body and force him wide' },
    { id: 'halfR', kind: 'rect', x: [c, s], y: [box, hi], tone: 'gold', label: ['Half-', 'space'], at: [(s + c) / 2, (box + hi) / 2],
      ask: 'The attacker is in the half-space, between the middle and the touchline.', rule: 'Half-space: angle your body and force him wide' },
    { id: 'sideL', kind: 'rect', x: [-h, -s], y: [box, hi], tone: 'good', label: ['Wide', 'channel'], at: [-(h + s) / 2, (box + hi) / 2],
      ask: 'The attacker has it in the wide channel, by the touchline.', rule: 'Wide channel: show him down the line, the touchline is a defender' },
    { id: 'sideR', kind: 'rect', x: [s, h], y: [box, hi], tone: 'good', label: ['Wide', 'channel'], at: [(h + s) / 2, (box + hi) / 2],
      ask: 'The attacker has it in the wide channel, by the touchline.', rule: 'Wide channel: show him down the line, the touchline is a defender' },
    { id: 'press', kind: 'rect', x: [-h, h], y: [hi, L], tone: 'ice', label: ['Attacking', 'third'], at: [0, (hi + L) / 2],
      ask: 'They have the ball in their own defensive third.', rule: 'Attacking third: press together on a trigger, a bad touch, a back pass, a player facing his own goal' },
    { id: 'turnL', kind: 'arrow', pts: [[-1.5, hi - 4], [-s + 1, hi - 10]], tone: 'o' },
    { id: 'turnR', kind: 'arrow', pts: [[1.5, hi - 4], [s - 1, hi - 10]], tone: 'o' },
    { id: 'downL', kind: 'arrow', pts: [[-(h + s) / 2, hi - 3], [-(h + s) / 2, box + 3]], tone: 'good' },
    { id: 'downR', kind: 'arrow', pts: [[(h + s) / 2, hi - 3], [(h + s) / 2, box + 3]], tone: 'good' },
    { id: 'goalside', kind: 'line', pts: [[-h, box], [h, box]], tone: 'red', dash: true }
  ];
  const DEMOS = {
    show: { dur: 3.4, actors: [
      { side: 'O', label: '9', path: [[0, hi - 2], [-2, hi - 6], [-7, hi - 11], [-12, hi - 15]] },
      { side: 'ball', path: [[0.6, hi - 2.8], [-1.4, hi - 6.8], [-6.4, hi - 11.8], [-11.4, hi - 15.8]] },
      { side: 'D', label: '4', path: [[1.2, hi - 5], [-0.6, hi - 8.6], [-5.4, hi - 13.2], [-10, hi - 17]] }] },
    line: { dur: 3, actors: [
      { side: 'O', label: '7', path: [[-(h + s) / 2, hi - 2], [-(h + s) / 2, (box + hi) / 2], [-(h + s) / 2 - 1, box + 3]] },
      { side: 'ball', path: [[-(h + s) / 2 + 0.6, hi - 2.8], [-(h + s) / 2 + 0.6, (box + hi) / 2 - 0.8], [-(h + s) / 2 - 0.4, box + 2.2]] },
      { side: 'D', label: '2', path: [[-(h + s) / 2 + 2, hi - 4.5], [-(h + s) / 2 + 2, (box + hi) / 2 - 2.5], [-(h + s) / 2 + 1, box + 0.8]] }] },
    press: { dur: 3.2, actors: [
      { side: 'O', label: '4', path: [[-6, L - 8], [-6, L - 8], [-6.5, L - 7.5]] },
      { side: 'ball', path: [[4, L - 12], [-5.4, L - 8.8], [-5.8, L - 8.2]] },
      { side: 'D', label: '9', path: [[0, hi + 4], [-3, L - 13], [-5.2, L - 10]] },
      { side: 'D', label: '7', path: [[-h + 4, hi + 2], [-h + 6, L - 12], [-8, L - 10]] }] },
    block: { dur: 2.8, actors: [
      { side: 'O', label: '10', path: [[-4, box + 5], [-2, box + 1], [-1.5, box - 2]] },
      { side: 'ball', path: [[-3.4, box + 4.2], [-1.4, box + 0.2], [-0.9, box - 2.8]] },
      { side: 'D', label: '5', path: [[0, box - 2], [-0.8, box - 3], [-1, box - 4.5]] }] }
  };
  const L2 = {
    kids: [
      { t: 'Stand between', say: 'Always stand between the ball and your goal. That’s called goal-side.', show: ['goalside', 'box'], hot: ['box'], demo: 'show', cue: 'Goal-side!' },
      { t: 'Show them to the side', say: 'Don’t let them dribble through the middle. Stand a little to the middle so they go to the side.', show: ['centre', 'z14', 'turnL', 'turnR'], hot: ['centre'], demo: 'show', cue: 'To the side!' },
      { t: 'The line helps you', say: 'Once they’re by the line, keep them there. The line is like another friend on your team.', show: ['sideL', 'sideR', 'downL', 'downR'], hot: ['sideL', 'sideR'], demo: 'line', cue: 'Down the line!' },
      { t: 'Stay on your feet', say: 'In front of your goal, don’t fall over. Stay up and block the ball with your body.', show: ['box'], hot: ['box'], demo: 'block', cue: 'Stay up!' }
    ],
    starter: [
      { t: 'Goal-side', say: 'Between your player and your goal, always. If you’re goal-side, one pass can’t beat you.', show: ['goalside', 'box', 'z14'], hot: ['goalside'], demo: 'show', cue: 'Goal-side!' },
      { t: 'Pressure: the first defender', say: 'The nearest player to the ball is the first defender. Close him down fast, slow down as you arrive, and delay him in the central channel.', show: ['centre'], hot: ['centre'], demo: 'show', cue: 'Delay!' },
      { t: 'Show him outside', say: 'Stand side-on, a little toward the middle. Your body is a door that only opens to the outside, out of the half-space and into the wide channel.', show: ['halfL', 'halfR', 'turnL', 'turnR'], hot: ['halfL', 'halfR'], demo: 'show', cue: 'Side-on!' },
      { t: 'The wide channel', say: 'By the touchline, keep him there. Every step down the line is a step away from your goal.', show: ['sideL', 'sideR', 'downL', 'downR'], hot: ['sideL'], demo: 'line', cue: 'Down the line!' },
      { t: 'Protect the penalty area', say: 'In the penalty area, stay on your feet and block. In the crossing zone, block the cross.', show: ['box', 'byL', 'byR'], hot: ['box'], demo: 'block', cue: 'Block it!' }
    ],
    varsity: [
      { t: 'Pressure, cover, balance', say: 'First defender pressures the ball. Second defender covers, behind and inside him. Third defender balances, the far side tucked in toward the middle.', show: ['centre', 'z14', 'halfL', 'halfR', 'sideL', 'sideR', 'box', 'byL', 'byR', 'press'], cue: 'Pressure, cover, balance' },
      { t: 'Delay, then tackle', say: 'Stop the run forward first, then show him outside. Tackle only on a heavy touch, or once the cover has arrived.', show: ['centre', 'turnL', 'turnR'], hot: ['centre'], demo: 'show', cue: 'Patience' },
      { t: 'Zone 14', say: 'The space in the middle just outside the box is where most goals are made. The ball arrives there: pressure it at once, no turn, no shot.', show: ['z14', 'box'], hot: ['z14'], demo: 'block', cue: 'Close Zone 14!' },
      { t: 'Pressing triggers', say: 'In the attacking third, don’t chase every ball. Go together on a trigger: a bad touch, a back pass, a player facing his own goal, the ball out to the touchline.', show: ['press'], hot: ['press'], demo: 'press', cue: 'Trigger: go!' },
      { t: 'The crossing zone', say: 'Wide near the byline, the danger is the cross: block it. In the penalty area, stay on your feet; a block beats a tackle.', show: ['box', 'byL', 'byR'], hot: ['byL', 'byR'], demo: 'block', cue: 'Block the cross' }
    ],
    coach: [
      { t: 'The idea in one line', say: 'Pressure, cover, balance: close the central channel and Zone 14, show everything outside, press together on a trigger, never alone.', show: ['centre', 'z14', 'halfL', 'halfR', 'sideL', 'sideR', 'box', 'byL', 'byR', 'press'], cue: 'Middle closed' },
      { t: 'Teaching order', say: 'Goal-side, then pressure and delay, then body shape, then cover and balance, then Zone 14, then pressing triggers.', show: ['goalside', 'centre'], hot: ['goalside'], cue: 'One a week' },
      { t: 'Drill: 1 v 1 channels', say: 'A 15-yard channel with a gate in the middle. The defender wins by keeping the attacker out of the gate all the way to the byline.', show: ['centre', 'halfL', 'sideL'], hot: ['centre'], demo: 'show', cue: 'Keep the gate shut' },
      { t: 'Drill: 2 v 2 pressure and cover', say: 'Two attackers, two defenders, a small goal. On every pass the defenders swap jobs: the nearest pressures, the other covers.', show: ['centre', 'halfL'], hot: ['halfL'], demo: 'line', cue: 'Swap jobs' },
      { t: 'Drill: trigger rondo', say: 'A big rondo; defenders may only press when the coach calls a trigger. Then let them call it themselves.', show: ['press'], hot: ['press'], demo: 'press', cue: 'Call the trigger' },
      { t: 'What to chart', say: 'Shots from the penalty area and Zone 14, dribbles through the central channel, and balls won after a trigger.', show: ['box', 'z14', 'centre', 'press'], hot: ['box', 'z14', 'press'], cue: 'Chart three things' },
      { t: 'By age', say: 'Under 9: goal-side, to the side, stay on your feet. 9 to 12: pressure and delay, body shape, cover. 13 and up: balance, Zone 14 and pressing triggers.', show: ['goalside', 'centre', 'sideL', 'sideR', 'box'], cue: 'Grow it' }
    ]
  };
  return {
    id: 'outside', sport: sportId, kind: 'defense',
    title: 'Pressure, cover, balance', sub: 'Goal-side, show him outside, Zone 14, pressing triggers',
    line: 'Pressure the ball, cover the presser, balance the far side; show everything outside and press together on a trigger.',
    credit: 'Built on the principles of defending taught in youth coaching courses',
    zones: Z, demos: DEMOS, levels: L2,
    way: { x: [2, s + 2], y: [box + 4, hi - 3], mid: c, ask: 'You’re defending the dribbler. Which way do you show him?',
      kids: 'Show him to the side closest to him. The line helps you!', middle: 'Show him out of the middle, toward the nearest touchline.', why: 'Show him down the line: the touchline is an extra defender.' },
    quiz: { kids: ['way'], starter: ['way', 'rule'], varsity: ['rule', 'way'], coach: ['rule', 'way'] },
    cues: ['Goal-side!', 'Delay!', 'Down the line!', 'Close Zone 14!', 'Trigger: go!']
  };
}
