// 5-out, drive and kick: five spots behind the three-point line, about 15 to 18 feet apart; the driver attacks a
// gap, the help collapses, the ball goes to whoever just got left. Movement words are Dribble Drive Motion's
// (Vance Walberg): drift, lift, backfill, dunker spot. Basketball coordinates (feet, x -25..25, y 0 at the
// baseline, rim at 0,5.25, arc 23.75 out, 22 in the corners, lane 16 wide). Spots sit on real floor: every
// perimeter spot is behind the arc, the dunker spot is outside the lane. Data only; see basketball-space.js.

const Z = [
  // the fallback: anywhere that isn't a spot
  { id: 'floor', kind: 'rect', x: [-25, 25], y: [0, 47], tone: 'ice',
    ask: 'You’re standing here, off the five spots.', rule: 'Get to a spot, 15 to 18 feet from a teammate' },
  { id: 'paint', kind: 'rect', x: [-8, 8], y: [0, 19], tone: 'o', label: ['Paint'], at: [0, 14],
    ask: 'You drive into the paint and the help comes.', rule: 'Paint touch: jump stop, find the helper, kick it to who he left' },
  { id: 'dunkL', kind: 'circle', c: [-10.5, 3], r: 2, tone: 'gold', label: ['Dunker', 'spot'], at: [-11, 7.4],
    ask: 'You’re the big, low on the baseline while a teammate drives.', rule: 'Dunker spot: stay behind the help, hands ready for the drop-off' },
  { id: 'dunkR', kind: 'circle', c: [10.5, 3], r: 2, tone: 'gold', label: ['Dunker', 'spot'], at: [11, 7.4],
    ask: 'You’re the big, low on the baseline while a teammate drives.', rule: 'Dunker spot: stay behind the help, hands ready for the drop-off' },
  { id: 'cornerL', kind: 'circle', c: [-23, 3.5], r: 2, tone: 'good', label: ['Corner'], at: [-22.2, 8],
    ask: 'You’re in the corner while a teammate drives.', rule: 'Corner: feet behind the line, stay wide, the kick-out comes here' },
  { id: 'cornerR', kind: 'circle', c: [23, 3.5], r: 2, tone: 'good', label: ['Corner'], at: [22.2, 8],
    ask: 'You’re in the corner while a teammate drives.', rule: 'Corner: feet behind the line, stay wide, the kick-out comes here' },
  { id: 'wingL', kind: 'circle', c: [-20, 21], r: 2.6, tone: 'good', label: ['Wing'], at: [-20, 25.6],
    ask: 'You catch it on the wing.', rule: 'Wing: catch it shot-ready: shoot, drive the closeout, or swing it' },
  { id: 'wingR', kind: 'circle', c: [20, 21], r: 2.6, tone: 'good', label: ['Wing'], at: [20, 25.6],
    ask: 'You catch it on the wing.', rule: 'Wing: catch it shot-ready: shoot, drive the closeout, or swing it' },
  { id: 'top', kind: 'circle', c: [0, 31], r: 2.6, tone: 'good', label: ['Top'], at: [0, 35.6],
    ask: 'You have the ball at the top.', rule: 'Top: start it, drive a gap or swing it' },
  // the way the ball and the players go
  { id: 'gapL', kind: 'arrow', pts: [[-1.5, 28.5], [-5, 16]], tone: 'o' },
  { id: 'gapR', kind: 'arrow', pts: [[1.5, 28.5], [5, 16]], tone: 'o' },
  { id: 'kickL', kind: 'arrow', pts: [[-5, 12], [-21.5, 4.5]], tone: 'gold' },
  { id: 'kickR', kind: 'arrow', pts: [[5, 12], [21.5, 4.5]], tone: 'gold' },
  { id: 'lift', kind: 'arrow', pts: [[-23, 6], [-21.2, 17.5]], tone: 'ice' },
  { id: 'fill', kind: 'arrow', pts: [[-2, 31], [-16.5, 23.5]], tone: 'ice' },
  { id: 'swing', kind: 'arrow', pts: [[-17.5, 22.5], [0, 28.5], [17.5, 22.5]], tone: 'ice' }
];

const DEMOS = {
  spots: { dur: 3, actors: [
    { side: 'O', label: '1', path: [[-3, 36], [0, 31]] }, { side: 'O', label: '2', path: [[-12, 19], [-20, 21]] },
    { side: 'O', label: '3', path: [[12, 19], [20, 21]] }, { side: 'O', label: '4', path: [[-14, 6], [-23, 3.5]] },
    { side: 'O', label: '5', path: [[9, 8], [23, 3.5]] }, { side: 'ball', path: [[-2.4, 35.4], [0.6, 30.4]] }] },
  kick: { dur: 3.6, actors: [
    { side: 'O', label: '1', path: [[0, 31], [-3.5, 19], [-4.5, 12.5], [-4.5, 12.5]] },
    { side: 'D', label: '1', path: [[0.5, 28], [-2, 17], [-3, 11.5], [-3, 11.5]] },
    { side: 'D', label: '4', path: [[-19.5, 6], [-12, 8.5], [-7.5, 10.5], [-7.5, 10.5]] },
    { side: 'O', label: '4', path: [[-23, 3.5], [-23, 3.5]] },
    { side: 'ball', path: [[0.8, 30.4], [-2.7, 18.4], [-3.8, 12], [-22.3, 4.2]] }] },
  dunk: { dur: 3.2, actors: [
    { side: 'O', label: '2', path: [[-20, 21], [-11, 12], [-6.5, 8], [-6.5, 8]] },
    { side: 'D', label: '5', path: [[8.5, 4.5], [4, 6], [-4, 7.5], [-4, 7.5]] },
    { side: 'O', label: '5', path: [[10.5, 3], [10.5, 3]] },
    { side: 'ball', path: [[-19.4, 20.4], [-10.2, 11.4], [-5.8, 7.4], [9.8, 3.4]] }] },
  baseline: { dur: 3.6, actors: [
    { side: 'O', label: '2', path: [[-20, 21], [-17.5, 12], [-12, 5], [-12, 5]] },
    { side: 'D', label: '4', path: [[-20, 6], [-16, 6], [-13.5, 6], [-13.5, 6]] },
    { side: 'O', label: '4', path: [[-23, 3.5], [-22.6, 9], [-21, 18], [-21, 18]] },
    { side: 'O', label: '1', path: [[0, 31], [-6, 29], [-12, 26], [-12, 26]] },
    { side: 'ball', path: [[-19.4, 20.4], [-16.9, 11.4], [-11.4, 5.6], [-20.4, 17.6]] }] },
  swing: { dur: 3, actors: [
    { side: 'O', label: '2', path: [[-20, 21], [-20, 21]] }, { side: 'O', label: '1', path: [[0, 31], [0, 31]] }, { side: 'O', label: '3', path: [[20, 21], [20, 21]] },
    { side: 'ball', path: [[-19.4, 20.4], [0.6, 30.4], [19.4, 20.4]] }] }
};

const L = {
  kids: [
    { t: 'Find a spot', say: 'There are five spots behind the big line: the top, two wings, two corners. Everybody takes a different one.', show: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR'], hot: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR'], demo: 'spots', cue: 'Find a spot!' },
    { t: 'Not too close', say: 'If you can touch a friend, you’re too close. One defender can guard you both. Move away!', show: ['floor', 'top', 'wingL', 'wingR', 'cornerL', 'cornerR'], hot: ['floor'], cue: 'Too close!' },
    { t: 'Drive to the basket', say: 'When there’s space in front of you, dribble right to the basket.', show: ['gapL', 'gapR', 'paint'], hot: ['paint'], demo: 'kick', cue: 'Go!' },
    { t: 'Pass to the open friend', say: 'If a defender comes to stop you, pass to the friend they left. That friend is open!', show: ['kickL', 'kickR', 'cornerL', 'cornerR'], hot: ['cornerL', 'cornerR'], demo: 'kick', cue: 'Find your friend!' }
  ],
  starter: [
    { t: '5-out', say: 'Top, two wings, two corners, all behind the three-point line, 15 to 18 feet apart. Nobody in the paint until somebody drives.', show: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR'], hot: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR'], demo: 'spots', cue: '15 feet' },
    { t: 'Drive a gap', say: 'The gap is the space between two defenders. Drive it, get two feet in the paint, eyes up.', show: ['top', 'gapL', 'gapR', 'paint'], hot: ['paint'], demo: 'kick', cue: 'Gap!' },
    { t: 'Kick it out', say: 'When a defender helps on the drive, his man is open. Most of the time that’s the corner on the side of the drive.', show: ['paint', 'kickL', 'kickR', 'cornerL', 'cornerR'], hot: ['cornerL', 'cornerR'], demo: 'kick', cue: 'Kick!' },
    { t: 'Lift and backfill', say: 'When the wing drives baseline, the corner lifts up to the wing and the top backfills behind the drive. Two easy passes, both behind the help.', show: ['lift', 'fill', 'wingL', 'cornerL', 'top'], hot: ['wingL'], demo: 'baseline', cue: 'Lift!' },
    { t: 'The dunker spot', say: 'The big waits on the baseline just outside the lane. When his defender steps up to stop the drive, drop it off.', show: ['dunkL', 'dunkR', 'paint'], hot: ['dunkL', 'dunkR'], demo: 'dunk', cue: 'Drop it!' },
    { t: 'Swing it', say: 'Nothing there? Swing it to the other side and drive again before the defense resets.', show: ['swing', 'wingL', 'wingR', 'top'], hot: ['wingL', 'wingR'], demo: 'swing', cue: 'Swing!' }
  ],
  varsity: [
    { t: 'Spacing is the weapon', say: 'Every step closer lets one defender guard two. Behind the arc and 15 to 18 feet apart, every help decision costs them something.', show: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR', 'floor'], hot: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR'], demo: 'spots', cue: 'Make them choose' },
    { t: 'Paint touch', say: 'Two feet in the paint collapses the defense. Jump stop, pivot, and read the helper: who left whom?', show: ['paint', 'gapL', 'gapR'], hot: ['paint'], demo: 'kick', cue: 'Touch, then read' },
    { t: 'Read the helper', say: 'Help from the corner: kick to the corner. Help from the dunker: drop it off. Help from the wing: kick to the wing or skip it.', show: ['paint', 'kickL', 'kickR', 'dunkL', 'dunkR', 'cornerL', 'cornerR'], hot: ['cornerL', 'dunkR'], demo: 'kick', cue: 'Who helped?' },
    { t: 'Drift, lift, backfill', say: 'Move with the drive. Middle drive: wings hold, corners stay. Baseline drive: the corner lifts and the top backfills. Never stand where the help is.', show: ['lift', 'fill', 'wingL', 'cornerL', 'top', 'paint'], hot: ['wingL', 'top'], demo: 'baseline', cue: 'Move with it' },
    { t: 'Attack the closeout', say: 'The kick-out catch has a closeout coming at you. Late: shoot it. Hard: drive past it. The second drive beats a defense that’s already rotating.', show: ['cornerL', 'wingL', 'gapL', 'paint'], hot: ['cornerL', 'wingL'], cue: 'Shoot or drive' },
    { t: 'One more pass', say: 'Good shot or great shot? One more pass usually turns a contested look into an open one.', show: ['swing', 'wingL', 'wingR', 'top', 'cornerL', 'cornerR'], hot: ['swing'], demo: 'swing', cue: 'One more!' }
  ],
  coach: [
    { t: 'The idea in one line', say: 'Spread out so every drive forces a choice, then punish the choice. Spots first, reads second.', show: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR', 'paint', 'dunkL', 'dunkR'], cue: 'Spots, then reads' },
    { t: 'Teaching order', say: 'The five spots, driving a gap, kicking to the corner, the dunker spot, lift and backfill, then reading the helper. One a week.', show: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR'], hot: ['top'], cue: 'One a week' },
    { t: 'Drill: 5-out shell', say: 'Five on the spots, no defense. Drive, kick, everybody fills the empty spot. Then add two defenders, then four, then five.', show: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR', 'gapL', 'kickL'], hot: ['gapL'], demo: 'kick', cue: 'Drive, kick, fill' },
    { t: 'Drill: 2-on-1 to the corner', say: 'A driver from the top and a shooter in the corner against one helper. The helper chooses; the driver finishes or kicks.', show: ['top', 'cornerL', 'paint', 'kickL'], hot: ['paint'], demo: 'kick', cue: 'Read the one' },
    { t: 'What to chart', say: 'Paint touches, corner threes, and passes after a paint touch. More of all three means it’s working.', show: ['paint', 'cornerL', 'cornerR'], hot: ['paint', 'cornerL', 'cornerR'], cue: 'Chart three things' },
    { t: 'By age', say: 'Under 10: find a spot, not too close, pass to the open friend. 10 to 13: drive a gap, kick to the corner, the dunker spot. 14 and up: lift and backfill, read the helper, attack closeouts.', show: ['top', 'wingL', 'wingR', 'cornerL', 'cornerR'], cue: 'Grow it' }
  ]
};

export default {
  id: 'spacing', sport: 'basketball', kind: 'offense',
  title: '5-out drive and kick', sub: 'Five spots, drive a gap, kick to the open man',
  line: 'Spread out so every drive forces a choice, then punish the choice.',
  credit: 'Spacing words from Vance Walberg’s Dribble Drive Motion',
  zones: Z, demos: DEMOS, levels: L,
  quiz: { kids: ['rule'], starter: ['rule'], varsity: ['rule'], coach: ['rule'] },
  cues: ['Find a spot!', 'Gap!', 'Kick!', 'Lift!', 'One more!']
};
