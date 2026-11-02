// Space the floor: five-out spacing and drive-and-kick, the offense's half of geometry. Five spots around the arc,
// about 15 feet apart; the driver attacks a gap, the help collapses, the ball goes to whoever just got left.
// Basketball coordinates (feet, x -25..25, y 0 at the baseline). Data only; see basketball-space.js for the shape.

const Z = [
  // the fallback: anywhere that isn't a spot
  { id: 'floor', kind: 'rect', x: [-25, 25], y: [0, 47], tone: 'ice',
    ask: 'You’re standing here, off the spots.', rule: 'Get to a spot, 15 feet from a teammate' },
  { id: 'paint', kind: 'rect', x: [-8, 8], y: [0, 19], tone: 'o', label: ['Paint', 'touch'], at: [0, 14],
    ask: 'The driver gets into the paint and the help comes.', rule: 'Kick it out to whoever got left open' },
  { id: 'dunkL', kind: 'circle', c: [-5.5, 3], r: 2.6, tone: 'gold', label: ['Dunker'], at: [-5.5, 7.4],
    ask: 'The big waits here on a drive.', rule: 'Dunker spot: stay low, ready for the drop-off' },
  { id: 'dunkR', kind: 'circle', c: [5.5, 3], r: 2.6, tone: 'gold', label: ['Dunker'], at: [5.5, 7.4],
    ask: 'The big waits here on a drive.', rule: 'Dunker spot: stay low, ready for the drop-off' },
  { id: 'cornerL', kind: 'circle', c: [-21.5, 3.5], r: 3.4, tone: 'good', label: ['Corner'], at: [-21.5, 9],
    ask: 'You’re in the corner while a teammate drives.', rule: 'Corner: stay wide and ready, the kick comes here' },
  { id: 'cornerR', kind: 'circle', c: [21.5, 3.5], r: 3.4, tone: 'good', label: ['Corner'], at: [21.5, 9],
    ask: 'You’re in the corner while a teammate drives.', rule: 'Corner: stay wide and ready, the kick comes here' },
  { id: 'wingL', kind: 'circle', c: [-18.5, 20], r: 3.4, tone: 'good', label: ['Wing'], at: [-18.5, 25.5],
    ask: 'You catch it on the wing.', rule: 'Wing: catch ready to shoot, drive or swing it' },
  { id: 'wingR', kind: 'circle', c: [18.5, 20], r: 3.4, tone: 'good', label: ['Wing'], at: [18.5, 25.5],
    ask: 'You catch it on the wing.', rule: 'Wing: catch ready to shoot, drive or swing it' },
  { id: 'top', kind: 'circle', c: [0, 28.5], r: 3.4, tone: 'good', label: ['Top'], at: [0, 34],
    ask: 'You have the ball at the top.', rule: 'Top: start it, drive a gap' },
  // the way the ball goes
  { id: 'gapL', kind: 'arrow', pts: [[-1.5, 26], [-5, 15]], tone: 'o' },
  { id: 'gapR', kind: 'arrow', pts: [[1.5, 26], [5, 15]], tone: 'o' },
  { id: 'kickL', kind: 'arrow', pts: [[-5, 12], [-18.5, 5]], tone: 'gold' },
  { id: 'kickR', kind: 'arrow', pts: [[5, 12], [18.5, 5]], tone: 'gold' },
  { id: 'swing', kind: 'arrow', pts: [[-15.5, 21.5], [15.5, 21.5]], tone: 'ice' }
];

const DEMOS = {
  spots: { dur: 3, actors: [
    { side: 'O', label: '1', path: [[-3, 32], [0, 28.5]] }, { side: 'O', label: '2', path: [[-12, 18], [-18.5, 20]] },
    { side: 'O', label: '3', path: [[11, 17], [18.5, 20]] }, { side: 'O', label: '4', path: [[-13, 6], [-21.5, 3.5]] },
    { side: 'O', label: '5', path: [[9, 7], [21.5, 3.5]] }, { side: 'ball', path: [[-2, 31.5], [1, 27.8]] }] },
  kick: { dur: 3.6, actors: [
    { side: 'O', label: '1', path: [[0, 28.5], [-3.5, 18], [-4.5, 12.5], [-4.5, 12.5]] },
    { side: 'D', label: '1', path: [[0.5, 25.5], [-2, 16.5], [-3, 11.5], [-3, 11.5]] },
    { side: 'D', label: '4', path: [[-17.5, 6], [-11, 8.5], [-7, 10.5], [-7, 10.5]] },
    { side: 'O', label: '4', path: [[-21.5, 3.5], [-21.5, 3.5]] },
    { side: 'ball', path: [[0.8, 27.8], [-2.7, 17.4], [-3.8, 12], [-20.6, 4.2]] }] },
  dunk: { dur: 3.2, actors: [
    { side: 'O', label: '2', path: [[-18.5, 20], [-11, 12], [-6.5, 8], [-6.5, 8]] },
    { side: 'D', label: '5', path: [[-2.5, 6], [-4.5, 6.5], [-5.5, 7], [-5.5, 7]] },
    { side: 'O', label: '5', path: [[5.5, 3], [5.5, 3]] },
    { side: 'ball', path: [[-17.6, 19.4], [-10.2, 11.4], [-5.8, 7.4], [4.8, 3.6]] }] },
  swing: { dur: 3, actors: [
    { side: 'O', label: '2', path: [[-18.5, 20], [-18.5, 20]] }, { side: 'O', label: '1', path: [[0, 28.5], [0, 28.5]] }, { side: 'O', label: '3', path: [[18.5, 20], [18.5, 20]] },
    { side: 'ball', path: [[-17.8, 19.4], [0.6, 27.8], [17.8, 19.4]] }] }
};

const L = {
  kids: [
    { t: 'Find a spot', say: 'There are five spots on the floor. Everybody stands on a different one, far from each other.', show: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR'], hot: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR'], demo: 'spots', cue: 'Find a spot!' },
    { t: 'Not too close', say: 'If you can touch a friend, you’re too close. One defender can guard you both. Move away!', show: ['floor', 'top', 'wingL', 'wingR', 'cornerL', 'cornerR'], hot: ['floor'], cue: 'Too close!' },
    { t: 'Dribble to the basket', say: 'When there’s space in front of you, dribble right to the basket.', show: ['gapL', 'gapR', 'paint'], hot: ['paint'], demo: 'kick', cue: 'Go!' },
    { t: 'Pass to the open friend', say: 'If a defender comes to stop you, pass to the friend they left. That friend is open!', show: ['kickL', 'kickR', 'cornerL', 'cornerR'], hot: ['cornerL', 'cornerR'], demo: 'kick', cue: 'Find your friend!' }
  ],
  starter: [
    { t: 'Five spots', say: 'Top, two wings, two corners. Each about 15 feet from the next, two big steps behind the line.', show: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR'], hot: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR'], demo: 'spots', cue: '15 feet' },
    { t: 'Drive a gap', say: 'Look for the space between two defenders and drive it. Two feet in the paint, eyes up.', show: ['top', 'gapL', 'gapR', 'paint'], hot: ['paint'], demo: 'kick', cue: 'Gap!' },
    { t: 'Kick it out', say: 'When a defender helps on the drive, someone is open. Usually it’s the corner on the side of the help.', show: ['paint', 'kickL', 'kickR', 'cornerL', 'cornerR'], hot: ['cornerL', 'cornerR'], demo: 'kick', cue: 'Kick!' },
    { t: 'Corners stay wide', say: 'The corner is the best pass on a drive, as long as you stay in it. Don’t drift toward the ball.', show: ['cornerL', 'cornerR', 'kickL', 'kickR'], hot: ['cornerL', 'cornerR'], cue: 'Stay wide!' },
    { t: 'The dunker spot', say: 'The big waits low beside the rim. If his defender steps up to stop the drive, drop it off.', show: ['dunkL', 'dunkR', 'paint'], hot: ['dunkL', 'dunkR'], demo: 'dunk', cue: 'Drop it!' },
    { t: 'Swing it', say: 'If nothing’s there, swing the ball to the other side and attack again before the defense resets.', show: ['swing', 'wingL', 'wingR', 'top'], hot: ['wingL', 'wingR'], demo: 'swing', cue: 'Swing!' }
  ],
  varsity: [
    { t: 'Spacing is a weapon', say: 'Every step closer lets one defender guard two. Spacing makes every help decision cost them something.', show: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR', 'floor'], hot: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR'], demo: 'spots', cue: 'Make them choose' },
    { t: 'Paint touch', say: 'Two feet in the paint collapses the defense. Jump stop, pivot, read the help: who left whom?', show: ['paint', 'gapL', 'gapR'], hot: ['paint'], demo: 'kick', cue: 'Touch, then read' },
    { t: 'Read the helper', say: 'Help from the corner: kick to the corner. From the dunker: drop it off. From the wing: skip it or kick to the wing.', show: ['paint', 'kickL', 'kickR', 'dunkL', 'dunkR', 'cornerL', 'cornerR'], hot: ['cornerL', 'dunkR'], demo: 'kick', cue: 'Who helped?' },
    { t: 'Drive the closeout', say: 'The kick-out catch is a closeout coming at you. Shoot if it’s late, drive if it’s hard. The second drive is the killer.', show: ['cornerL', 'wingL', 'gapL', 'paint'], hot: ['cornerL', 'wingL'], cue: 'Shoot or drive' },
    { t: 'One more pass', say: 'Good shot or great shot? One more pass usually turns a contested look into an open one.', show: ['swing', 'wingL', 'wingR', 'top', 'cornerL', 'cornerR'], hot: ['swing'], demo: 'swing', cue: 'One more!' }
  ],
  coach: [
    { t: 'The idea in one line', say: 'Spread out so every drive forces a choice, then punish the choice. Spots first, reads second.', show: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR', 'paint', 'dunkL', 'dunkR'], cue: 'Spots, then reads' },
    { t: 'Teaching order', say: 'The five spots, then driving a gap, then kicking to the corner, then the dunker, then reading the helper. One a week.', show: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR'], hot: ['top'], cue: 'One a week' },
    { t: 'Drill: five-out shell', say: 'Five on the spots, no defense. Drive, kick, everybody fills the empty spot. Then add two defenders, then four.', show: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR', 'gapL', 'kickL'], hot: ['gapL'], demo: 'kick', cue: 'Drive, kick, fill' },
    { t: 'Drill: 2 on 1 from the top', say: 'A driver and a corner against one helper. The helper chooses; the driver must make the right pass or finish.', show: ['top', 'cornerL', 'paint', 'kickL'], hot: ['paint'], demo: 'kick', cue: 'Read the one' },
    { t: 'What to chart', say: 'Paint touches, corner threes, and passes after a paint touch. More of all three means it’s working.', show: ['paint', 'cornerL', 'cornerR'], hot: ['paint', 'cornerL', 'cornerR'], cue: 'Chart three things' },
    { t: 'By age', say: 'Under 10: find a spot, not too close, pass to the open friend. 10 to 13: drive a gap, kick to the corner. 14 and up: read the helper, attack closeouts.', show: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR'], cue: 'Grow it' }
  ]
};

export default {
  id: 'spacing', sport: 'basketball', kind: 'offense',
  title: 'Space the floor', sub: 'Five spots, drive a gap, kick it out',
  line: 'Spread out so every drive forces a choice, then punish the choice.',
  zones: Z, demos: DEMOS, levels: L,
  quiz: { kids: ['rule'], starter: ['rule'], varsity: ['rule'], coach: ['rule'] },
  cues: ['Find a spot!', 'Gap!', 'Kick!', 'Stay wide!', 'One more!']
};
