// Show them outside: defending as geometry in youth soccer. Stay goal-side, show the dribbler away from the middle
// toward the touchline, protect the box, and press high only on a trigger. Built for a pitch (soccer7 / soccer9):
// yards, x across (-W/2..W/2), y from our goal line (0) to theirs (L). Data only.

export function showOutside(sportId, o) {
  const h = o.W / 2, L = o.L, bw = o.boxW / 2, box = o.box, c = o.W * 0.18, s = o.W * 0.32, hi = L * 0.62;
  const Z = [
    { id: 'box', kind: 'rect', x: [-bw, bw], y: [0, box], tone: 'red', label: ['The box'], at: [0, box * 0.55],
      ask: 'The attacker has the ball in your box.', rule: 'Stay on your feet and block the shot' },
    { id: 'byL', kind: 'rect', x: [-h, -bw], y: [0, box], tone: 'hot', label: ['By the', 'end line'], at: [-(h + bw) / 2, box * 0.5],
      ask: 'The attacker is wide, near your end line.', rule: 'Show him to the line, block the cross' },
    { id: 'byR', kind: 'rect', x: [bw, h], y: [0, box], tone: 'hot', label: ['By the', 'end line'], at: [(h + bw) / 2, box * 0.5],
      ask: 'The attacker is wide, near your end line.', rule: 'Show him to the line, block the cross' },
    { id: 'centre', kind: 'rect', x: [-c, c], y: [box, hi], tone: 'warn', label: ['Middle'], at: [0, (box + hi) / 2],
      ask: 'The attacker dribbles at you through the middle.', rule: 'Delay, stay goal-side, show him outside' },
    { id: 'halfL', kind: 'rect', x: [-s, -c], y: [box, hi], tone: 'gold', label: ['Angle', 'him out'], at: [-(s + c) / 2, (box + hi) / 2],
      ask: 'The attacker is between the middle and the touchline.', rule: 'Angle your body and force him wide' },
    { id: 'halfR', kind: 'rect', x: [c, s], y: [box, hi], tone: 'gold', label: ['Angle', 'him out'], at: [(s + c) / 2, (box + hi) / 2],
      ask: 'The attacker is between the middle and the touchline.', rule: 'Angle your body and force him wide' },
    { id: 'sideL', kind: 'rect', x: [-h, -s], y: [box, hi], tone: 'good', label: ['Down', 'the line'], at: [-(h + s) / 2, (box + hi) / 2],
      ask: 'The attacker has it by the touchline.', rule: 'Show him down the line: the touchline is a defender' },
    { id: 'sideR', kind: 'rect', x: [s, h], y: [box, hi], tone: 'good', label: ['Down', 'the line'], at: [(h + s) / 2, (box + hi) / 2],
      ask: 'The attacker has it by the touchline.', rule: 'Show him down the line: the touchline is a defender' },
    { id: 'press', kind: 'rect', x: [-h, h], y: [hi, L], tone: 'ice', label: ['Press on', 'a trigger'], at: [0, (hi + L) / 2],
      ask: 'They have the ball deep in their own half.', rule: 'Press when the trigger comes: bad touch, back pass, facing his goal' },
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
      { t: 'Show them to the side', say: 'Don’t let them dribble through the middle. Stand a little to the middle so they go to the side.', show: ['centre', 'turnL', 'turnR'], hot: ['centre'], demo: 'show', cue: 'To the side!' },
      { t: 'The line helps you', say: 'Once they’re by the line, keep them there. The line is like another friend on your team.', show: ['sideL', 'sideR', 'downL', 'downR'], hot: ['sideL', 'sideR'], demo: 'line', cue: 'Down the line!' },
      { t: 'Stay on your feet', say: 'In front of your goal, don’t fall over. Stay up and block the ball with your body.', show: ['box'], hot: ['box'], demo: 'block', cue: 'Stay up!' }
    ],
    starter: [
      { t: 'Goal-side', say: 'Between your player and your goal, always. If you’re goal-side, you can’t be beaten by one pass.', show: ['goalside', 'box', 'centre'], hot: ['goalside'], demo: 'show', cue: 'Goal-side!' },
      { t: 'Delay in the middle', say: 'In the middle, don’t dive in. Get close, slow them down, and wait for help.', show: ['centre'], hot: ['centre'], demo: 'show', cue: 'Delay!' },
      { t: 'Angle your body', say: 'Stand sideways, a little toward the middle. Your body is a door that only opens to the outside.', show: ['halfL', 'halfR', 'turnL', 'turnR'], hot: ['halfL', 'halfR'], demo: 'show', cue: 'Sideways!' },
      { t: 'Show them down the line', say: 'By the touchline, keep them there. Every step down the line is a step away from your goal.', show: ['sideL', 'sideR', 'downL', 'downR'], hot: ['sideL'], demo: 'line', cue: 'Down the line!' },
      { t: 'Protect the box', say: 'In the box, stay on your feet and block. Near the end line, block the cross.', show: ['box', 'byL', 'byR'], hot: ['box'], demo: 'block', cue: 'Block it!' }
    ],
    varsity: [
      { t: 'Show them outside', say: 'The middle is the most dangerous place on the pitch. Every defender’s body shape says: not through here.', show: ['centre', 'halfL', 'halfR', 'sideL', 'sideR', 'box', 'byL', 'byR', 'press'], cue: 'Not through the middle' },
      { t: 'Delay, deny, then tackle', say: 'First stop the run forward. Then show them outside. Tackle only when the ball is loose or the support has arrived.', show: ['centre', 'turnL', 'turnR'], hot: ['centre'], demo: 'show', cue: 'Patience' },
      { t: 'Cover and balance', say: 'The second defender sits behind and inside the first, covering the inside. The far side tucks in to the middle.', show: ['centre', 'halfL', 'sideL'], hot: ['halfL'], demo: 'line', cue: 'Cover inside' },
      { t: 'Press on a trigger', say: 'Up high, don’t chase every ball. Go together when it’s a bad touch, a back pass, or a player facing his own goal.', show: ['press'], hot: ['press'], demo: 'press', cue: 'Trigger: go!' },
      { t: 'The box and the cross', say: 'Wide near the end line, the danger is the cross: block it. In the box, stay on your feet; a block is better than a tackle.', show: ['box', 'byL', 'byR'], hot: ['byL', 'byR'], demo: 'block', cue: 'Block the cross' }
    ],
    coach: [
      { t: 'The idea in one line', say: 'Protect the middle and the box, show everything outside, and press together on a trigger, never alone.', show: ['centre', 'halfL', 'halfR', 'sideL', 'sideR', 'box', 'byL', 'byR', 'press'], cue: 'Middle closed' },
      { t: 'Teaching order', say: 'Goal-side, then delay, then body shape, then down the line, then cover, then pressing triggers.', show: ['goalside', 'centre'], hot: ['goalside'], cue: 'One a week' },
      { t: 'Drill: 1 v 1 channels', say: 'A 15-yard channel with a middle gate. Defender scores by keeping the attacker out of the gate until the end line.', show: ['centre', 'halfL', 'sideL'], hot: ['centre'], demo: 'show', cue: 'Keep the gate shut' },
      { t: 'Drill: trigger rondo', say: 'A big rondo; the defenders may only press on a coach’s call of a trigger. Then let them call it themselves.', show: ['press'], hot: ['press'], demo: 'press', cue: 'Call the trigger' },
      { t: 'What to chart', say: 'Shots from the middle of the box, dribbles through the middle third, and presses won after a trigger.', show: ['box', 'centre', 'press'], hot: ['box', 'centre', 'press'], cue: 'Chart three things' },
      { t: 'By age', say: 'Under 9: goal-side, to the side, stay on your feet. 9 to 12: delay, body shape, cover. 13 and up: pressing triggers together.', show: ['goalside', 'centre', 'sideL', 'sideR', 'box'], cue: 'Grow it' }
    ]
  };
  return {
    id: 'outside', sport: sportId, kind: 'defense',
    title: 'Show them outside', sub: 'Goal-side, body shape and pressing triggers',
    line: 'Close the middle, show everything outside, and press together on a trigger.',
    zones: Z, demos: DEMOS, levels: L2,
    way: { x: [2, s + 2], y: [box + 4, hi - 3], mid: c, ask: 'You’re defending the dribbler. Which way do you show him?',
      kids: 'Show him to the side closest to him. The line helps you!', middle: 'Show him out of the middle, toward the nearest touchline.', why: 'Show him down the line: the touchline is an extra defender.' },
    quiz: { kids: ['way'], starter: ['way', 'rule'], varsity: ['rule', 'way'], coach: ['rule', 'way'] },
    cues: ['Goal-side!', 'Delay!', 'Down the line!', 'Trigger: go!', 'Stay up!']
  };
}
