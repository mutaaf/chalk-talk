// The explainer, called like a broadcast: a first-run tour, and release notes that can show
// each new feature where it lives. Copy is play-by-play: energetic, clear, professional.

export const VERSION = '0.22.0';

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
  { version: '0.22.0', date: '2026-10-30', title: 'Soccer kicks off', items: [
    { title: 'Soccer 7v7 and 9v9', call: 'Youth soccer joins: 7v7 with the build-out line and 9v9, numbered the way coaches draw it (1 keeper, 2 and 3 backs, the 8, the 9, 7 and 11 wide), with researched plays from the wall pass and the overlap to the third-man run, switches, counters, low corners, and pressing lessons.', show: 'sports' },
    { title: 'PitchIQ, the guide and coach styles', call: 'Every position in depth, a PitchIQ game for your players, and coaching lenses inspired by the modern game. Say it, sketch it, print it as a playbook.', show: 'guideBtn' }
  ] },
  { version: '0.21.0', date: '2026-10-30', title: 'Best reads', items: [
    { title: 'The best read, any moment', call: 'Tap any player at any point in a play: it holds still and shows their best read right now (who’s open and how open, the drive, the shot, the cut, where to relocate, or for defenders: pressure, deny, help, close out), with the play’s own read marked and a green arrow on the board.', show: 'ink' }
  ] },
  { version: '0.20.0', date: '2026-10-30', title: 'Your playbook', items: [
    { title: 'Print a playbook', call: 'Pick any plays (the library, your own, what’s on the board) and get a clean playbook: a cover with contents, then each play on its own page with a top-down diagram, numbered steps, step-by-step frames, the kid version, the cues and the reads. Save it as a PDF from any device. In More, or My plays.', show: 'moreBtn' },
    { title: 'A calmer film room', call: 'Each player’s card fills in on its own as its brain answers; the rest of the film room stays still.', show: 'filmTop' }
  ] },
  { version: '0.19.2', date: '2026-10-30', title: 'Done means done', items: [
    { title: 'Done and Cancel work', call: 'While you talk, Done draws what you said and Cancel throws it away. Nothing gets drawn after a Cancel.', show: 'mic' }
  ] },
  { version: '0.19.1', date: '2026-10-30', title: 'A legal rush', items: [
    { title: 'The rusher waits for the snap', call: 'In flag football nobody on defense crosses the line before the snap, and the rusher holds his 7 yards until a short count after the QB has the ball.', show: null }
  ] },
  { version: '0.19.0', date: '2026-10-30', title: 'A real football', items: [
    { title: 'The ball is a football', call: 'In flag football the ball is a laced football now, and it turns to face where it’s thrown.', show: null },
    { title: 'Routes and coverage, out of the way', call: 'On iPad and phones the football tools open as a small card in the corner, not a strip across the field.', show: null },
    { title: 'Tucked panels say what they hold', call: 'Collapse the plays list or the play card and a tab on the edge shows what’s there, with the play’s name. Tap it to bring it back.', show: null }
  ] },
  { version: '0.18.0', date: '2026-10-30', title: 'Room to read', items: [
    { title: 'No more pile-ups', call: 'Players are never drawn on top of each other: at a screen or a handoff you can always tell 1 from 5 from the defender, while the play itself stays exact.', show: null }
  ] },
  { version: '0.17.1', date: '2026-10-30', title: 'A ready film room', items: [
    { title: 'Film room, instantly', call: 'Every play in the library now has its film room and analyst ready ahead of time: open it and every position’s brain answers at once.', show: 'filmTop' }
  ] },
  { version: '0.17.0', date: '2026-10-30', title: 'The court listens', items: [
    { title: 'The mic, fixed', call: 'Talking works again in every browser. If the browser’s own listener can’t run, the board records you and writes it down instead, without you doing anything.', show: 'mic' },
    { title: 'Light that listens', call: 'While you talk, the court ripples out from the mic with your voice. While a play is drawn, light races along the lines. Nothing covers the board.', show: 'mic' },
    { title: 'It only says listening when it is', call: 'The mic shows “starting” until your voice is really coming through, and tells you if the browser is waiting for permission.', show: 'mic' }
  ] },
  { version: '0.16.0', date: '2026-10-30', title: 'Instant answers', items: [
    { title: 'Asked before? Instant.', call: 'When any coach has asked for the same play, or the film room has broken down the same play before, the answer comes back instantly and doesn’t count against your daily free AI.', show: null }
  ] },
  { version: '0.15.0', date: '2026-10-30', title: 'A sharper free AI', items: [
    { title: 'Free plays on Claude', call: 'With no key at all, plays are now drawn by Claude: far more accurate than before, still free, within a daily limit.', show: 'mic' }
  ] },
  { version: '0.14.0', date: '2026-10-30', title: 'The dock', items: [
    { title: 'A floating dock', call: 'On phones and tablets the sections live in a floating dock: Plays, Guide, Talk, Film room and More, each labeled, the one you’re in lit up. Panels float just above it, so it’s always one tap to switch.', show: null }
  ] },
  { version: '0.13.1', date: '2026-10-30', title: 'iPad, fixed', items: [
    { title: 'iPad in landscape', call: 'The whole field fits again, the play card is a sheet you pull up instead of a panel over the board, and collapsing a panel can never hide the board.', show: null }
  ] },
  { version: '0.13.0', date: '2026-10-30', title: 'Coach it your way', items: [
    { title: 'Coach styles', call: 'Pick how plays are named and taught: motion and reads like Steve Kerr’s Warriors, pace and space like Erik Spoelstra’s Heat, the beautiful game like Gregg Popovich’s Spurs, five-out threes like Joe Mazzulla’s Celtics, or pressure like Mark Daigneault’s Thunder. In AI settings.', show: 'keyBtn' },
    { title: 'Every word counts', call: 'The AI now accounts for every clause you say, in order, by the player you named, at the spot you named, and fills in the standard version when you keep it short.', show: 'mic' }
  ] },
  { version: '0.12.0', date: '2026-10-30', title: 'Front and center', items: [
    { title: 'Your words, big', call: 'When you talk, your words fill the screen as you say them. Then you watch it work: placing the players, drawing every move, checking the read, with a clock and a Cancel.', show: 'mic' },
    { title: 'Your last plays, one tap', call: 'The three plays you made last sit right under My plays, in the list and in the Plays sheet.', show: 'lib' }
  ] },
  { version: '0.11.1', date: '2026-10-30', title: 'Edit on the whiteboard', items: [
    { title: 'Whiteboard only stays put', call: 'Pause, tap a player, label or sketch: the board stays in whiteboard-only mode until you leave it.', show: null }
  ] },
  { version: '0.11.0', date: '2026-10-30', title: 'Your plays, kept', items: [
    { title: 'My plays', call: 'Every play the AI draws for you is saved with the words you used. Search it, star it, rename it, run it again. Ask for one again and it\'s instant, with no AI used.', show: 'lib' },
    { title: 'Chalk Talk AI', call: 'Get Chalk Talk AI through CourtIQ at a $4.99 launch price, or use the AI that comes with any CourtIQ plan. Connect it here from AI settings.', show: 'keyBtn' },
    { title: 'A calmer top bar', call: 'The everyday controls up top, everything else one tap away in More.', show: 'moreBtn' },
    { title: 'Panels that tuck away', call: 'Collapse the plays list and the play card from their edges, or press [ and ].', show: null },
    { title: 'Steadier court', call: 'The lines no longer bend under your pointer, the hoop is bigger, and a double-tap on the field resets the view.', show: null }
  ] },
  { version: '0.10.1', date: '2026-10-30', title: 'Free stays free', items: [
    { title: 'A small ad in the playbook', call: 'On mutaafaziz.com, one labelled ad can sit at the foot of the Plays list. It keeps the board free. It never covers the court, and it never interrupts you while you talk or draw.', show: null }
  ] },
  { version: '0.10.0', date: '2026-10-30', title: 'Just the board', items: [
    { title: 'Whiteboard only', call: 'Full screen, every panel away, a slim rail of icons: talk, sketch, defense, plays, step through. Press W, or find it in More.', show: 'boardBtn' },
    { title: 'Sound on iPhone and iPad', call: 'Chimes and the voice now play on iPhone and iPad, even with the silent switch on. Tap the board once and it\'s on.', show: null },
    { title: 'One tap to plays and the guide', call: 'On a phone or tablet, Plays, Guide and Film room each sit in the tab bar; sketch is the pencil up top.', show: null },
    { title: 'A sharper laser', call: 'In presenter mode the laser follows the pointer exactly, fades fast, and the play title takes up less of the screen.', show: 'presentBtn' }
  ] },
  { version: '0.9.0', date: '2026-10-30', title: 'Settings the way your phone does them', items: [
    { title: 'Switches, not buttons', call: 'On a phone or tablet, More now has real switches for defense, the analyst, routes and coverage, the view lock, light mode and sound. They flip right there.', show: null },
    { title: 'Film room in the tab bar', call: 'One tap from anywhere on a phone or tablet.', show: null },
    { title: 'Anonymous usage counts', call: 'To make the board better we count which features get used, by country and device. No cookies, no names, nothing you say.', show: null }
  ] },
  { version: '0.8.0', date: '2026-10-30', title: 'Smarter with every coach', items: [
    { title: 'Help the voice learn (opt-in)', call: 'Turn it on in AI settings and the plays you keep and the words you fix teach it for every coach, with your players\' names removed on your device first. Off unless you say so.', show: 'keyBtn' },
    { title: 'Shortcuts from other coaches', call: 'Phrases three or more coaches confirmed now work instantly for you too, offline.', show: 'mic' },
    { title: 'AI through your app', call: 'In CourtIQ, every paid plan unlocks the AI: plays, brains, the tutor and the analyst, no key needed.', show: 'filmTop' }
  ] },
  { version: '0.7.1', date: '2026-10-30', title: 'Wake the brains', items: [
    { title: 'Connect AI from the film room', call: 'No AI connected? The film room still breaks down every position from the engine, and one tap connects your key, or the subscription where your app offers one.', show: 'filmTop' }
  ] },
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
  ['Space (hold)', 'Talk'], ['← →', 'Step back / forward'], ['P', 'Play or pause'], ['S', 'Sketch'], ['D', 'Defense'], ['V', 'Mind view: every player’s live read'],
  ['L', 'Lock the view'], ['+ / −', 'Zoom'], ['N', 'Show names'], ['G', 'Guide'], ['R', 'Film room'], ['I', 'IQ game'], ['F', 'Presenter mode'], ['W', 'Whiteboard only'], ['H', 'My plays'], ['M', 'More'], ['[ / ]', 'Collapse the side panels'], ['0', 'Reset the view'], ['Esc', 'Close'], ['In sketch: D M E B O X', 'Draw, Move, Erase, Ball, add O, add X'], ['In sketch: T', 'Same time'], ['⌘Z', 'Undo a stroke']
];

const SEEN = 'chalktalk.seen';
export const seen = {
  get() { try { return JSON.parse(localStorage.getItem(SEEN) || '{}'); } catch (e) { return {}; } },
  set(k, v) { const s = seen.get(); s[k] = v; try { localStorage.setItem(SEEN, JSON.stringify(s)); } catch (e) {} }
};
// is there news since this device last looked?
export const hasNews = () => seen.get().version !== VERSION;
