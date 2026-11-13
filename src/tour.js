// The explainer, called like a broadcast: a first-run tour, and release notes that can show
// each new feature where it lives. Copy is play-by-play: energetic, clear, professional.

export const VERSION = '0.44.0';

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
  { at: 'keyBtn', title: 'The AI', call: 'It works out of the box on free open-source models. Add your own Claude, OpenAI or Gemini key for the best answers and the broadcaster voice.' }
];

// newest first; "show" points the spotlight at the feature
export const RELEASES = [
  { version: '0.44.0', date: '2026-11-13', title: 'One link, one tap', items: [
    { title: 'Straight into Trace', call: 'In any headset’s browser, open mutaafaziz.com/chalktalk/xr and tap the big button: it picks the best way your device has (your room, VR, the camera on a phone) and your position, and you’re walking the play. Codes from your phone land on the same button.', show: null }
  ] },
  { version: '0.43.1', date: '2026-11-13', title: 'Pick your headset', items: [
    { title: 'Set up any headset in four steps', call: 'mutaafaziz.com/chalktalk/beta is now all about Trace: pick your headset, glasses or earbuds and follow the steps to walk your first play, with a section for every sport.', show: null }
  ] },
  { version: '0.43.0', date: '2026-11-13', title: 'Trace, lighter and smarter', items: [
    { title: 'Smooth on every headset', call: 'Trace now draws each frame in a fraction of the time: the field is built once, rings are drawn by the graphics chip, and the board rests behind it. That means steadier light on glasses, cooler phones and longer batteries.', show: null },
    { title: 'Set the play on a real table', call: 'In Tabletop, look at a table or the floor and the whole play rides on it. Pinch and it stays put.', show: null },
    { title: 'Blue is where you went', call: 'Walking a play in AR or VR, your real path shows in blue after each rep, next to the gold one you were meant to run.', show: null },
    { title: 'A home for the beta', call: 'mutaafaziz.com/chalktalk/beta shows what Chalk Talk does on a phone, an iPhone Duo and glasses, and installs it in two taps. Send it to another coach.', show: null },
    { title: 'Ray-Ban Display goes hands-free', call: 'Swipe down on the glasses app and it walks the whole play by itself, each step as long as its words. It also rests the display when nothing is moving.', show: null }
  ] },
  { version: '0.42.1', date: '2026-11-12', title: 'Telling you what we count', items: [
    { title: 'Anonymous usage analytics', call: 'On this site we now also see which pages and buttons get used, and from roughly which city, so we know where the board needs work. Every bit of text is masked, so player names and what you say never leave your device, and Global Privacy Control or Do Not Track turns it off. The Coach’s Guide has the details.', show: null }
  ] },
  { version: '0.42.0', date: '2026-11-12', title: 'Made for iPhone Duo', items: [
    { title: 'Open it like a book', call: 'On iPhone Duo the board gets the first page to itself and everything else moves to the second, so nothing ever sits on the fold. Tap a player and their card fills the second page while the read is drawn on the board beside it.', show: null },
    { title: 'Stand it up on the bench', call: 'In tabletop the court sits above the fold and the controls, or the player card, sit below it. Close it and you’re back on the phone layout, same play, same step.', show: null }
  ] },
  { version: '0.41.0', date: '2026-11-11', title: 'The player card', items: [
    { title: 'Tap a player, get the whole player', call: 'A new card: their position drawn small with its signature move, their cue (tap to hear it), what they’re doing right now, and live numbers in their sport’s words: court zone, distance to the net and the partner gap in pickleball; space, the lane and who marks them on offense; their man and the help on defense; the read order in football.', show: null },
    { title: 'Walk them through the play', call: 'Step back and forth inside the card (or use the arrow keys) and the reads, numbers and board move with you. The steps they’re in are lit. Flip to the next player from the strip at the top (or ▲▼) without closing anything.', show: null },
    { title: 'Four tabs', call: 'Now: the best reads, ranked, with a tap to say one aloud. Their play: what they do, step by step, with Watch only them. Coach it: what to read, do and don’t, by age, and a drill. Edit: label, name and the AI brain, as before.', show: null }
  ] },
  { version: '0.40.1', date: '2026-11-10', title: 'The Coach’s Guide', items: [
    { title: 'The whole playbook, written down', call: 'New on the standalone board: the Coach’s Guide. Every sport, every key, the IQ game, Kids view and what stays private, in one page you can read on the bench. Find it under Help, or at the foot of the Plays list.', show: 'help' }
  ] },
  { version: '0.40.0', date: '2026-11-09', title: 'Every player speaks their sport', items: [
    { title: 'Pickleball players read like pickleball players', call: 'Tap a player and the best read is a real pickleball read: the play’s shot first, then drop, dink, hit at the feet, move up with your partner, or stay back for the two-bounce rule. No more passing to your partner or cutting to the rim. Mind view shows where each player stands (kitchen line, transition zone, baseline) and how far apart partners are.', show: null },
    { title: 'Soccer says it the soccer way', call: 'Carry it forward, shoot, run in behind, close down, mark goal-side, and a keeper who sets the angle or stays the outlet.', show: null },
    { title: 'Film room knows who’s who', call: 'In pickleball the same player serves one point and returns the next: Film room now picks the right position from where they start, every step is told in pickleball words, and the Analyst voice no longer calls a point “man to man.”', show: null }
  ] },
  { version: '0.39.0', date: '2026-11-04', title: 'Trace on every headset and pair of glasses', items: [
    { title: 'Send a play to any headset', call: 'In Trace, Any glasses → Send to a headset gives a 4-digit code. On Snap Specs, Quest, Vision Pro, Android XR or Pico, open mutaafaziz.com/chalktalk/go and type it, and your play opens at your position. On Ray-Ban Display, choose Enter a code. A phone can scan the QR code instead.' },
    { title: 'Fits every view', call: 'The step card sizes itself to the device. On narrow see-through glasses like Snap Specs it’s smaller and follows your gaze, so it never drops out of view when you look down at your ring. The words match your device too: pinch, tap the screen, or pull the trigger.' },
    { title: 'Earbuds and Ray-Ban Meta', call: 'Earbuds says every step out loud, paced to the words, with a ping from where you’re going, while your phone stays in your pocket. A tap on your Ray-Ban Meta, Oakley Meta, AirPods or any earbuds pauses and plays it. For XREAL, VITURE, RayNeo or Rokid, Display glasses goes full screen in pure black, so only the light shows, and 3D draws one picture for each eye.' }
  ] },
  { version: '0.38.0', date: '2026-11-03', title: 'Trace, rebuilt for AR and VR', items: [
    { title: 'Line it up on a real field, any sport', call: 'On AR glasses, “On a real court” or “On a real field” lets the play follow you while you stand on your spot facing the basket, the end zone, the goal or the net. Pinch and it locks to the real lines. The hoop, the goals, the pylons and the net stand up at their real size.' },
    { title: 'Chase your ghost, score the rep', call: 'Walking it, a gold ghost of you runs the play on time. Arrows on the floor point to your next ring, a ping sounds from where you need to go, and when a pass is coming, light at the edge of your view shows which way to turn. Each rep gets up to three stars, and your best is kept.' },
    { title: 'Tabletop, phone camera, and the real ball flight', call: 'Tabletop puts the whole play on a table in front of you as a hologram. On a phone, Camera draws the light over what your camera sees, and you look around by moving the phone. Every pass, throw, hit and shot now flies the ball’s real path, gold when it’s coming to you, with ½× speed for walk-throughs.' }
  ] },
  { version: '0.37.0', date: '2026-11-03', title: 'Pickleball', items: [
    { title: 'A new sport: pickleball doubles', call: 'The real 20 × 44 ft court with the kitchen and the net. Nine points from the serve to the put-away: the two-bounce rule, return and run in, the third-shot drop, drive and crash, dinking, lob and switch, the poach, the Erne and the reset.' },
    { title: 'New to it? Start here', call: 'The first time you open pickleball you get three ways in: the five rules in two minutes, a whole point step by step, or Trace. The lessons go from kids to coach, and PickleIQ asks you to pick the shot before it happens.' },
    { title: 'On a real court, in AR', call: 'Trace draws the kitchens, the net at its real height, and a ring where each ball bounces. On AR glasses, “On a real court” lines the court up as you stand on your spot facing the net, and the point starts with a pinch.' }
  ] },
  { version: '0.36.0', date: '2026-11-02', title: 'Trace: walk your path in light', items: [
    { title: 'Be the player', call: 'More → Trace. Pick your position and the play is projected around you: your path glows on the floor, light runs along the move you make now, and the step card tells you your job. Your eyes, or just above and behind you.' },
    { title: 'On AR and VR glasses', call: 'On glasses or headsets with a WebXR browser (Snap Spectacles, Quest, Vision Pro, Android XR), Trace goes life size or fits your room. The play waits at the end of each move until you walk to the ring.' },
    { title: 'Meta Ray-Ban Display', call: 'mutaafaziz.com/chalktalk/glasses is a heads-up version: pick a sport, a play and your position, step with the band, and hear your job.' }
  ] },
  { version: '0.35.1', date: '2026-11-02', title: 'Bigger map, always a way back', items: [
    { title: 'Expand the mini map', call: 'Tap the map, or ⤢, and it opens big across the screen with the step’s line under it. Tap again to shrink it. Step numbers still jump to that step.' },
    { title: 'Leaving Kids view on a phone', call: 'The Grown-up view button now always shows at the top, so you can get back to the regular board.' }
  ] },
  { version: '0.35.0', date: '2026-11-02', title: 'Real names, both sides of the ball', items: [
    { title: 'Every sport teaches offense and defense', call: 'Flag 5v5 teaches Cover 2 and Flood, flag 7v7 Cover 3 and Flood, soccer Pressure, cover, balance and Five lanes, basketball Guard the space and 5-out drive and kick.' },
    { title: 'The words coaches actually use', call: 'Deep thirds, curl-flat, hook-curl, the honey hole and the seams; go, sail and flat; Zone 14, half-spaces, the cutback zone; drift, lift and backfill.' },
    { title: 'Spots on real lines', call: 'The 5-out spots sit behind the three-point line and the dunker spot just outside the lane, and the soccer areas follow the real thirds of the pitch.' }
  ] },
  { version: '0.34.1', date: '2026-11-02', title: 'Always the latest', items: [
    { title: 'Updates arrive when you open the app', call: 'Chalk Talk on your home screen now checks for a new version every time you come back to it, and switches to it right away instead of one launch later.' }
  ] },
  { version: '0.34.0', date: '2026-11-02', title: 'Concepts everywhere', items: [
    { title: 'The defense plays your system', call: 'Turn Defense on in basketball and every X now plays Guard the space: the ball gets pushed to the sideline, the far side sinks to the split line, and posts get fronted. The analyst calls it out too, like when the ball gets into the middle alley. Turn it off in More → Settings.' },
    { title: 'New concepts for every sport', call: 'Space the floor (five spots, drive a gap, kick it out) for basketball offense, Keep it in front for flag football, and Show them outside for soccer, each at four levels with clips and a quiz.' },
    { title: 'Quiz it, print it', call: 'Concept quizzes sit in the IQ game next to Streak Run, and every lesson prints all four levels on one page for the clipboard.' }
  ] },
  { version: '0.33.0', date: '2026-11-02', title: 'Teach a concept: Guard the space', items: [
    { title: 'Defense as geometry, drawn on your court', call: 'Open Guard the space (top of the plays list, or More → Concepts) and the court splits into alleys: the split line, the middle, the force lanes, the sideline, the elbows, the post and the red zone, one idea at a time with a little clip. Pick Kids, Starter, Varsity or Coach for the words that fit your team, then Quiz me for endless questions: which way do you push it, what’s the rule here, where do you help from.' }
  ] },
  { version: '0.32.0', date: '2026-11-02', title: 'A clearer More menu', items: [
    { title: 'Everything in one calm sheet', call: 'More now opens with eight quick switches (tap one and it tells you what it does), one thing worth trying today, and the rest in three small groups: Make, Learn and Show. Settings fold away until you need them.', show: 'moreBtn' }
  ] },
  { version: '0.31.0', date: '2026-11-02', title: 'Kids view', items: [
    { title: 'Big, slow and simple for little players', call: 'Tap Kids up top (or More → Kids) and the board turns into something a six-year-old can follow. Each step is one short sentence, like “5 stands still like a wall” or “1 passes to 2.” Buttons are big and round, the play is slower and the clutter is gone. Tap Grown-up view to come back.', show: 'kidsBtn' }
  ] },
  { version: '0.30.1', date: '2026-10-31', title: 'The free AI, twice as fast', items: [
    { title: 'Plays in about five seconds', call: 'Plays from your own words now draw in about 3 to 7 seconds on the free AI, down from about 10, and you can draw three times as many a day.', show: null }
  ] },
  { version: '0.30.0', date: '2026-10-31', title: 'Every sport, endless reads', items: [
    { title: 'Flag and soccer get the deep bank too', call: 'FieldIQ now makes up situations: routes for every receiver against a real coverage, and the quarterback’s own read finds who’s open. In soccer, real plays branch at a moment and the engine finds the open pass. That’s thousands of fresh questions in every sport.', show: 'iqBtn' }
  ] },
  { version: '0.29.0', date: '2026-10-31', title: 'The mini map', items: [
    { title: 'The whole play at a glance', call: 'A mini map of the play now sits in the corner for every sport: every route drawn, the step playing now lit, and the players and the ball moving on it live. Tap a step number to jump there, or fold it away with the arrow.', show: null }
  ] },
  { version: '0.28.0', date: '2026-10-31', title: 'Under the hood', items: [
    { title: 'How Chalk Talk uses AI', call: 'More → Under the hood shows how it works: the ears, the draft, the engine, the booth, the minds and the game. It also shows your own numbers and what stays private. Look for the ✦ how chips around the board; each one opens the part you just saw.', show: 'moreBtn' }
  ] },
  { version: '0.27.1', date: '2026-10-31', title: 'Plays draw faster', items: [
    { title: 'No more minute-long waits', call: 'With an OpenAI key, plays used to take over a minute. GPT-5 now thinks just enough to draw them. And with any key, if your AI hasn’t answered in 18 seconds, or it fails, the free AI draws the play too, and you get whichever answer comes first.', show: 'keyBtn' }
  ] },
  { version: '0.27.0', date: '2026-10-31', title: 'The IQ game, all new', items: [
    { title: 'The Daily: five reads, about a minute', call: 'Every day there are five new reads, the same five for everyone. Keep your streak, see your squares, and share your score. Tap the lit Daily pill up top or the card atop the plays.', show: 'iqBtn' },
    { title: 'A bank that doesn’t run dry', call: 'Thousands of questions now: the playbook (mirrored too), plus game situations the engine builds on the spot, where it finds who is open. New questions too: pass, drive or shoot; what happens next; and what is your job on defense.', show: 'iqBtn' },
    { title: 'Faster, and worth coming back to', call: 'Each clip starts right before the decision and moves on by itself. Try Streak Run (one miss ends it), Quick five on your own rating, and ten badges to earn.', show: 'iqBtn' }
  ] },
  { version: '0.26.0', date: '2026-10-30', title: 'Shorts with diagrams', items: [
    { title: 'Every Short fills the screen with the play', call: 'Under the captions, each step’s actions now show as chips with their own little diagrams (screen, pass, drive, handoff), and the rest of the frame shows the whole play drawn like a playbook page, with this step lit, next to every step as its own small diagram. The end card shows the whole play once more.', show: 'moreBtn' }
  ] },
  { version: '0.25.0', date: '2026-10-30', title: 'Make a Short', items: [
    { title: 'Any play, ready for Shorts, TikTok and Reels', call: 'More → Make a Short (or C) records the play on the board as a vertical 1080×1920 video: a title card, the whole play at teaching pace, big captions with the word being said highlighted, and an end card. With a voice key the analyst’s voice is in it too. Save it or share it straight from your phone.', show: 'moreBtn' }
  ] },
  { version: '0.24.2', date: '2026-10-30', title: 'The booth gets it right', items: [
    { title: 'An analyst who calls what really happens', call: 'The analyst now explains each screen once, on the step it’s used, naming the defender who runs into it and what the screener does next (roll or pop). Handoffs say who becomes the wall. Late defenders are called on the real move (cut, roll, pop), and the lines vary instead of repeating.', show: 'narrate' }
  ] },
  { version: '0.24.1', date: '2026-10-30', title: 'Screens and handoffs, for real', items: [
    { title: 'Set the screen, then go', call: 'Screeners now get there first and set; the teammate waits, then comes off shoulder to shoulder while their defender gets hung up on the screener’s chest and fights through. The screen bar is drawn across the runner’s path, the way playbooks draw it. Works for any play you draw or say.', show: 'ink' },
    { title: 'Dribble handoffs at speed', call: 'A handoff happens hip to hip on the move: the receiver runs by, takes it out of the giver’s hands and turns the corner downhill, and the giver becomes a screen on the receiver’s defender. Drawn with the handoff bars.', show: 'ink' }
  ] },
  { version: '0.24.0', date: '2026-10-30', title: 'Plays that keep flowing', items: [
    { title: 'Continuity, all the way around', call: 'Five Out Spacing, Help Defense, Flex Cut and 5-Out Pass, Cut, Fill now run full rotations: the ball goes around (drive, help, kick, recover; screen the screener on both sides; three cutters) and comes back to where it started, so the loop never stops after a pass or two.', show: 'lib' },
    { title: 'The best read, flashing', call: 'A green marker flashes on the open option as the play runs: the teammate to pass to, the lane to drive or the shot. Switch it off in More.', show: 'moreBtn' },
    { title: 'Made for phones, folds and glass', call: 'iPhone portrait and landscape layouts, flip-phone cover screens, Surface Duo and foldables (the board on one screen, the controls on the other, nothing on the hinge), and a Liquid Glass finish on everything that floats.', show: 'mic' }
  ] },
  { version: '0.23.1', date: '2026-10-30', title: 'Every word, at a teaching pace', items: [
    { title: 'The analyst at half speed', call: 'With the analyst on, plays run at 0.5× so there’s time to follow the read (pick any speed and it sticks). The play now waits at the end of each step for the line to finish, so nothing is cut off or skipped, and the play’s name leads into step one instead of being talked over.', show: 'narrate' }
  ] },
  { version: '0.23.0', date: '2026-10-30', title: 'Inside their heads', items: [
    { title: 'Mind view', call: 'Press V (or More → Mind view) and every player gets a see-through chip: what they’re doing, how fast, how much space. Tap one to open their mind, live: their job, their man, their read, the QB’s progression, the ball on its way, the AI’s thought and their best reads, scored. Open up to three, or the table of everyone. Light enough to leave on.', show: 'moreBtn' }
  ] },
  { version: '0.22.1', date: '2026-10-30', title: 'Gemini works too', items: [
    { title: 'Bring a Gemini key', call: 'Paste a Google AI Studio key (it starts with AIza) and Chalk Talk draws with Gemini: the same structured plays, checks and repair round as Claude and OpenAI. The key stays in your browser and goes only to Google.', show: 'keyBtn' }
  ] },
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
  ['Space (hold)', 'Talk'], ['← →', 'Step back / forward'], ['P', 'Play or pause'], ['S', 'Sketch'], ['D', 'Defense'], ['V', 'Mind view: every player’s live read'], ['C', 'Make a Short: the play as a vertical video'],
  ['L', 'Lock the view'], ['+ / −', 'Zoom'], ['N', 'Show names'], ['G', 'Guide'], ['R', 'Film room'], ['I', 'IQ game'], ['F', 'Presenter mode'], ['W', 'Whiteboard only'], ['H', 'My plays'], ['M', 'More'], ['[ / ]', 'Collapse the side panels'], ['0', 'Reset the view'], ['Esc', 'Close'], ['In sketch: D M E B O X', 'Draw, Move, Erase, Ball, add O, add X'], ['In sketch: T', 'Same time'], ['⌘Z', 'Undo a stroke']
];

const SEEN = 'chalktalk.seen';
export const seen = {
  get() { try { return JSON.parse(localStorage.getItem(SEEN) || '{}'); } catch (e) { return {}; } },
  set(k, v) { const s = seen.get(); s[k] = v; try { localStorage.setItem(SEEN, JSON.stringify(s)); } catch (e) {} }
};
// is there news since this device last looked?
export const hasNews = () => seen.get().version !== VERSION;
