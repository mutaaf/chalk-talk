// The explainer, called like a broadcast: a first-run tour, and release notes that can show
// each new feature where it lives. Copy is play-by-play: energetic, clear, professional.

export const VERSION = '0.5.0';

// a step points at an element (data-r name or a selector) and says what it is, broadcaster-style
export const TOUR = [
  { at: null, title: 'And we\'re live', call: 'Welcome to Chalk Talk, coach. Tonight it\'s you and a board that draws in light. Here\'s how to run it.' },
  { at: 'mic', title: 'Call the play', call: 'Tap the mic and talk it through: "1 dribbles to the wing, 5 sets the screen and rolls." It draws as you say it.' },
  { at: 'lib', title: 'The playbook', call: 'Every concept your team needs, from spacing to Spain pick-and-roll. Pick one and it runs, step by step.' },
  { at: 'sketchBtn', title: 'Draw it yourself', call: 'Sketch it with a finger or an Apple Pencil. A zigzag is a dribble, a T is a screen, and the AI takes it from there.' },
  { at: 'ink', title: 'Every player has a brain', call: 'Tap any player to label them, add a name that stays on this device, or let an AI brain play the position.' },
  { at: 'defBtn', title: 'Bring the defense', call: 'Turn on defense and every X guards its man. Watch who gets open: the green ring is your read.' },
  { at: 'filmBtn', title: 'Film room', call: 'Each position\'s brain watches the play and tells you what it sees, what could go wrong, and the cue to give a kid.' },
  { at: 'viewBtn', title: 'Your angle', call: 'Drag to orbit, pinch to zoom, then lock the view right where you like it.' },
  { at: 'keyBtn', title: 'The AI', call: 'It works out of the box on free open-source models. Add your own Claude or OpenAI key for the best answers and the broadcaster voice.' }
];

// newest first; "show" points the spotlight at the feature
export const RELEASES = [
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
  ['L', 'Lock the view'], ['+ / −', 'Zoom'], ['N', 'Show names'], ['Esc', 'Close'], ['In sketch: D M E B O X', 'Draw, Move, Erase, Ball, add O, add X'], ['In sketch: T', 'Same time'], ['⌘Z', 'Undo a stroke']
];

const SEEN = 'chalktalk.seen';
export const seen = {
  get() { try { return JSON.parse(localStorage.getItem(SEEN) || '{}'); } catch (e) { return {}; } },
  set(k, v) { const s = seen.get(); s[k] = v; try { localStorage.setItem(SEEN, JSON.stringify(s)); } catch (e) {} }
};
// is there news since this device last looked?
export const hasNews = () => seen.get().version !== VERSION;
