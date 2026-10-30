// The explainer, called like a broadcast: a first-run tour, and release notes that can show
// each new feature where it lives. Copy is play-by-play: energetic, clear, professional.

export const VERSION = '0.7.0';

// a step points at an element (data-r name or a selector) and says what it is, broadcaster-style
export const TOUR = [
  { at: null, title: 'And we\'re live', call: 'Welcome to Chalk Talk, coach. Tonight it\'s you and a board that draws in light. Here\'s how to run it.' },
  { at: 'mic', title: 'Call the play', call: 'Tap the mic and talk it through: "1 dribbles to the wing, 5 sets the screen and rolls." It draws as you say it.' },
  { at: 'lib', title: 'The playbook', call: 'Every concept your team needs, from spacing to Spain pick-and-roll. Pick one and it runs, step by step.' },
  { at: 'sketchBtn', title: 'Draw it yourself', call: 'Sketch it with a finger or an Apple Pencil. A zigzag is a dribble, a T is a screen, and the AI takes it from there.' },
  { at: 'ink', title: 'Every player has a brain', call: 'Tap any player to label them, add a name that stays on this device, or let an AI brain play the position.' },
  { at: 'defBtn', title: 'Bring the defense', call: 'Turn on defense and every X guards its man. Watch who gets open: the green ring is your read.' },
  { at: 'filmBtn', title: 'Film room', call: 'Each position\'s brain watches the play and tells you what it sees, what could go wrong, and the cue to give a kid.' },
  { at: 'filmTop', title: 'The film room', call: 'Every position\'s brain breaks down the play. Tap any player for the full breakdown: what they see, the risk, the cue, and their move.' },
  { at: 'guideBtn', title: 'The guide', call: 'Every position, in depth: the job, the read, how to coach it at every age, its move on a mini board. And sideline cards you can read from the bench.' },
  { at: 'iqBtn', title: 'The IQ game', call: 'Hand it to a player. The board freezes at the moment of truth, they make the read, and a tutor talks them through it at their age. Level up, and find out whose game yours looks like.' },
  { at: 'narrate', title: 'The analyst', call: 'Turn on the voice and an analyst breaks down the read: the coverage, the defender who gets moved, why the ball goes where it goes.' },
  { at: 'viewBtn', title: 'Your angle', call: 'Drag to orbit, pinch to zoom, then lock the view right where you like it.' },
  { at: 'keyBtn', title: 'The AI', call: 'It works out of the box on free open-source models. Add your own Claude or OpenAI key for the best answers and the broadcaster voice.' }
];

// newest first; "show" points the spotlight at the feature
export const RELEASES = [
  { version: '0.7.0', date: '2026-10-30', title: 'The film room, front and center', items: [
    { title: 'Film room', call: 'Up top now. Every player gets a card the moment it opens, and each one opens into a full breakdown: the move, what the brain sees, the risk, the cue, beat by beat, with Watch it.', show: 'filmTop' },
    { title: 'Light mode', call: 'For a bright sideline: ink on paper. Or let it follow your device.', show: 'themeBtn' },
    { title: 'Chest and bounce passes', call: 'In basketball the ball moves the way you teach it: a chest pass on a line, or a bounce pass to the cutter and past a defender in the lane.', show: null },
    { title: 'Cleaner closes', call: 'Tap outside any panel and it slides away; the big ones dim the board behind them.', show: null }
  ] },
  { version: '0.6.0', date: '2026-10-30', title: 'The film room comes to the sideline', items: [
    { title: 'Positions, in depth', call: 'Tap any position for its job, its reads, do and don\'t, how to coach it at every age, a drill, and its signature move drawn on its own mini court. Plus game-day cue cards.', show: 'guideBtn' },
    { title: 'CourtIQ and FieldIQ', call: 'A game for your players: real plays freeze at the decision, they tap the open man or the spot, and an AI tutor coaches them at their age. Levels from Rookie to MVP, and a likeness to a modern pro, or a hybrid of two.', show: 'iqBtn' },
    { title: 'The analyst', call: 'The voice now explains the read like an analyst in the booth: the coverage, the defender who gets moved, where the quarterback\'s eyes go and why.', show: 'narrate' },
    { title: 'Hit them in stride', call: 'Passes lead the receiver now. The ball goes where they\'re going, not where they stop.', show: null },
    { title: 'Smarter defense', call: 'The low man rotates to stop a drive, the ball side denies, and in flag everyone rallies to the ball carrier. Defenders line up on their side of the ball.', show: 'defBtn' },
    { title: 'It learns your words', call: 'Tap what it heard to fix a word and it remembers. Say a play your way, keep what it draws, and next time it\'s instant, right on the device.', show: 'mic' },
    { title: 'Presenter mode', call: 'Put the board on a TV with AirPlay or Cast: full screen, a broadcast lower third, a laser pointer and the defense switch, with controls that fade away.', show: 'presentBtn' },
    { title: 'Stats', call: 'The play\'s numbers (distance, touches, spacing, how open every catch is), plus every AI call\'s tokens, time and cost.', show: 'statsBtn' },
    { title: 'Built for phones and tablets', call: 'A tab bar with the mic in the middle, and everything else one tap away in the control center.', show: null },
    { title: 'Your first sketch', call: 'Trace three glowing strokes and watch each one read in milliseconds, then let the AI take over.', show: 'sketchBtn' }
  ] },
  { version: '0.5.0', date: '2026-10-30', title: 'Brains on every position', items: [
    { title: 'Position brains', call: 'Each player can think for themselves now: a dedicated AI brain per position, all reading the play at once.', show: 'ink' },
    { title: 'Film room', call: 'Every position\'s brain breaks down the play: what they see, the risk, and the coaching cue.', show: 'filmBtn' },
    { title: 'The right read', call: 'Passes go to the open player, defenders react like real ones, and a green ring shows who\'s open.', show: 'defBtn' },
    { title: 'Sketch, reworked', call: 'Draw, move, erase, hand off the ball, and strokes that happen at the same time. It tells you what it read as you draw.', show: 'sketchBtn' },
    { title: 'Lock your view', call: 'Coach, top-down or sideline. Orbit, zoom, and lock it.', show: 'viewBtn' },
    { title: 'Free AI, no key', call: 'Open-source models now draw plays and run the brains with no key at all, within a daily limit.', show: 'keyBtn' },
    { title: 'Install it', call: 'Add Chalk Talk to your home screen. It works offline, and player names stay on your device.', show: null }
  ] },
  { version: '0.3.0', date: '2026-10-30', title: 'Flag football joins the broadcast', items: [
    { title: 'Flag 5v5 and 7v7', call: 'Two new formats, lettered the way football coaches draw it, with researched plays from mesh to four verts.', show: 'sports' },
    { title: 'Route tree and coverages', call: 'Give any receiver a route from the tree, line the defense up in Cover 2 or Cover 3, and watch the QB read it.', show: 'fb' }
  ] }
];

export const SHORTCUTS = [
  ['Space (hold)', 'Talk'], ['← →', 'Step back / forward'], ['P', 'Play or pause'], ['S', 'Sketch'], ['D', 'Defense'],
  ['L', 'Lock the view'], ['+ / −', 'Zoom'], ['N', 'Show names'], ['G', 'Guide'], ['R', 'Film room'], ['I', 'IQ game'], ['F', 'Presenter mode'], ['Esc', 'Close'], ['In sketch: D M E B O X', 'Draw, Move, Erase, Ball, add O, add X'], ['In sketch: T', 'Same time'], ['⌘Z', 'Undo a stroke']
];

const SEEN = 'chalktalk.seen';
export const seen = {
  get() { try { return JSON.parse(localStorage.getItem(SEEN) || '{}'); } catch (e) { return {}; } },
  set(k, v) { const s = seen.get(); s[k] = v; try { localStorage.setItem(SEEN, JSON.stringify(s)); } catch (e) {} }
};
// is there news since this device last looked?
export const hasNews = () => seen.get().version !== VERSION;
