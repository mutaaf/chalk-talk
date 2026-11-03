// Pickleball, taught on the court (feet; x −10…10 sidelines, y 0 their baseline, 22 the net, 44 ours; the field runs
// to x ±15, y −8…52). Three lessons: the five rules a new player needs before their first game (quick onboarding:
// serve, two-bounce rule, kitchen, scoring, faults), getting to the kitchen line (serve, return, third-shot drop,
// the transition zone), and holding it (dink, reset, the middle, the lob and switch). The words are the game's
// own (USA Pickleball rulebook and the way coaches teach doubles: research/PICKLEBALL.md). Data only.

const H = 10, NET = 22, K1 = 29, K0 = 15, L = 44, OUT = { id: 'out', kind: 'rect', x: [-15, 15], y: [-8, 52] };
const out = (rule, ask) => Object.assign({}, OUT, { tone: 'ice', rule, ask, label: ['Out'], at: [-12.5, 48] });
const net = { id: 'net', kind: 'line', pts: [[-11, NET], [11, NET]], tone: 'gold', label: ['Net'], at: [12.5, NET] };
// demo players: A and B ours (circles), C and D theirs (X's)
const A = (path) => ({ side: 'O', label: 'A', path }), B = (path) => ({ side: 'O', label: 'B', path });
const C = (path) => ({ side: 'D', label: 'C', path }), D = (path) => ({ side: 'D', label: 'D', path });
const ball = (path) => ({ side: 'ball', path });

const DEMOS = {
  serve: { dur: 3, actors: [A([[4, 45.5], [4, 45.5]]), B([[-5, 44.5], [-5, 44.5]]), C([[-5, -1], [-5, -1]]), D([[5, 13.5], [5, 13.5]]), ball([[4.6, 45], [0, 24], [-4.5, 4], [-4.5, -0.5]])] },
  twobounce: { dur: 4.2, actors: [A([[4, 45.5], [4, 45.5], [4, 45.5]]), B([[-5, 44.5], [-5, 44.5], [-5, 44.5]]), C([[-5, -1], [-5, 6], [-5, 13.5]]), D([[5, 13.5], [5, 13.5], [5, 13.5]]),
    ball([[4.6, 45], [-4.5, 4], [-4.5, -0.5], [3.5, 40], [4, 45]])] },
  walkup: { dur: 4, actors: [A([[4, 45.5], [4, 37], [4, 30.5]]), B([[-5, 44.5], [-5, 37], [-5, 30.5]]), C([[-5, 13.5], [-5, 13.5]]), D([[5, 13.5], [5, 13.5]]), ball([[4, 45], [2, 24], [4, 17.5], [4.5, 14]])] },
  kitchen: { dur: 3.4, actors: [A([[4, 30.5], [4, 30.5]]), B([[-5, 30.5], [-5, 30.5]]), C([[-5, 13.5], [-5, 13.5]]), D([[4.5, 13.5], [4.5, 13.5]]), ball([[3.5, 30], [0, 22.5], [-4, 18], [-4.5, 14]])] },
  dink: { dur: 3.6, actors: [A([[4, 30.5], [3.5, 30.5], [4, 30.5]]), B([[-5, 30.5], [-5, 30.5]]), C([[-5, 13.5], [-5.5, 13.5], [-5, 13.5]]), D([[4.5, 13.5], [4.5, 13.5]]),
    ball([[3.5, 30], [-4, 18.5], [-4.5, 14], [3, 26], [3.5, 30]])] },
  reset: { dur: 3.4, actors: [A([[4, 37], [4, 37], [4, 33]]), B([[-5, 37], [-5, 37], [-5, 33]]), C([[-5, 13.5], [-5, 13.5]]), D([[4.5, 13.5], [4.5, 13.5]]), ball([[4.5, 14], [4, 36.5], [3, 18], [4, 14]])] },
  switch: { dur: 3.8, actors: [A([[4, 30.5], [0, 30.5], [-4.5, 30.5]]), B([[-5, 30.5], [0, 37], [5, 41]]), C([[-5, 13.5], [-5, 13.5]]), D([[4.5, 13.5], [4.5, 13.5]]), ball([[-4.5, 14], [0, 30], [5, 41]])] }
};

// ---- 1. Pickleball in five rules: everything a new player needs before the first game ----
const basics = {
  id: 'rules', sport: 'pickleball', kind: 'basics',
  title: 'Pickleball in five rules', sub: 'Serve, two bounces, the kitchen, the score',
  line: 'Serve underhand and cross-court, let the serve and the return bounce, never volley in the kitchen, and only the serving team scores.',
  credit: 'The rules as USA Pickleball writes them, for doubles',
  zones: [
    out('Out: a ball that lands out here is out, let it go', 'The ball is coming down out here, past the lines.'),
    { id: 'behind', kind: 'rect', x: [-H, H], y: [L, 52], tone: 'good', label: ['Serve from', 'here'], at: [0, 48.5],
      ask: 'It’s your serve. Where do your feet go?', rule: 'Behind the baseline: serve from here, underhand, feet behind the line' },
    { id: 'svcR', kind: 'rect', x: [0, H], y: [K1, L], tone: 'o', label: ['Right', 'court'], at: [5, 37],
      ask: 'You’re serving and your team’s score is even (0, 2, 4…).', rule: 'Right service court: serve from behind it when your score is even' },
    { id: 'svcL', kind: 'rect', x: [-H, 0], y: [K1, L], tone: 'warn', label: ['Left', 'court'], at: [-5, 37],
      ask: 'You’re serving and your team’s score is odd (1, 3, 5…).', rule: 'Left service court: serve from behind it when your score is odd' },
    { id: 'kitchen', kind: 'rect', x: [-H, H], y: [K1 - 7, K1], tone: 'red', label: ['Kitchen'], at: [0, 25.5],
      ask: 'You’re standing in here and the ball comes at you in the air.', rule: 'Kitchen: no volleys in here, let it bounce first' },
    { id: 'kitchen2', kind: 'rect', x: [-H, H], y: [K0, NET], tone: 'red', label: ['Kitchen'], at: [0, 18.5],
      ask: 'Their player is standing in here and the ball comes in the air.', rule: 'Kitchen: no volleys in here, let it bounce first' },
    { id: 'target', kind: 'rect', x: [-H, H], y: [0, K0], tone: 'gold', label: ['Their service', 'courts'], at: [0, 7],
      ask: 'Your serve lands here.', rule: 'Their service court: the diagonal one, past the kitchen, or it’s a fault' },
    net,
    { id: 'serveArrow', kind: 'arrow', pts: [[4, 45], [0, 24], [-5, 6]], tone: 'good' },
    { id: 'returnArrow', kind: 'arrow', pts: [[-5, 0], [0, 22], [4, 40]], tone: 'o' }
  ],
  demos: DEMOS,
  levels: {
    kids: [
      { t: 'Serve it underhand', say: 'Stand behind the back line. Swing low, like bowling, and hit it to the box across from you, the one on the diagonal.', show: ['behind', 'serveArrow', 'target'], hot: ['behind'], demo: 'serve', cue: 'Swing low!' },
      { t: 'Bounce, bounce', say: 'The serve bounces once, then the return bounces once. After that you can hit it in the air.', show: ['serveArrow', 'returnArrow'], hot: ['returnArrow'], demo: 'twobounce', cue: 'Bounce, bounce!' },
      { t: 'The kitchen', say: 'The box by the net is the kitchen. You can’t hit the ball in the air while you stand in it. Let it bounce first.', show: ['kitchen', 'kitchen2', 'net'], hot: ['kitchen'], demo: 'kitchen', cue: 'Bounce in the kitchen!' },
      { t: 'Get to the line', say: 'After the bounces, walk up to the kitchen line with your partner, side by side.', show: ['kitchen', 'net'], demo: 'walkup', cue: 'Side by side!' }
    ],
    starter: [
      { t: '1. The serve', say: 'Underhand, contact below your waist, both feet behind the baseline. Hit it cross-court, past the kitchen, into the diagonal service court. Score even: serve from the right. Odd: from the left.', show: ['behind', 'svcR', 'svcL', 'serveArrow', 'target'], hot: ['svcR', 'target'], demo: 'serve', cue: 'Low, deep, diagonal' },
      { t: '2. The two-bounce rule', say: 'The serve must bounce, and the return must bounce. Only then can anyone volley. So the serving team stays back for the return.', show: ['serveArrow', 'returnArrow', 'behind'], hot: ['returnArrow'], demo: 'twobounce', cue: 'Two bounces, then volley' },
      { t: '3. The kitchen', say: 'The 7 ft by the net on each side is the non-volley zone. No volleys while you touch it or its line. You may step in to play a ball that bounced.', show: ['kitchen', 'kitchen2', 'net'], hot: ['kitchen', 'kitchen2'], demo: 'kitchen', cue: 'No volleys in the kitchen' },
      { t: '4. The score', say: 'Only the serving team scores. Games go to 11, win by 2. Call it as three numbers: your score, their score, and server 1 or 2. The first serve of the game is 0-0-2.', show: ['svcR', 'svcL'], hot: ['svcR'], cue: '0-0-2, to 11' },
      { t: '5. Faults', say: 'A point ends when the ball lands out, goes into the net, bounces twice, or someone volleys from the kitchen. Then go to the kitchen line and play the soft game.', show: ['out', 'kitchen', 'net'], hot: ['out'], demo: 'walkup', cue: 'In, over, once' }
    ],
    varsity: [
      { t: 'Serve deep', say: 'A deep serve keeps the returner back. Aim deep and to the middle more often than at the lines; a missed serve gives the point away.', show: ['serveArrow', 'target'], hot: ['target'], demo: 'serve', cue: 'Deep, not fancy' },
      { t: 'Use the two-bounce rule', say: 'The returning team gets to the kitchen line first: the returner’s partner starts there, the returner runs in behind a deep return. The serving team has to earn the net with the third shot.', show: ['returnArrow', 'kitchen', 'kitchen2'], hot: ['returnArrow'], demo: 'twobounce', cue: 'Return deep, run in' },
      { t: 'The kitchen line is the game', say: 'Most points are won by the team that gets to the kitchen line and stays patient there. Everything else is getting there.', show: ['kitchen', 'kitchen2', 'net'], hot: ['kitchen'], demo: 'walkup', cue: 'Get to the line' }
    ],
    coach: [
      { t: 'The order to teach it', say: 'Serve, then the two-bounce rule, then the kitchen. Play games to 11 right away, calling the score out loud, and add the third-shot drop once they can rally.', show: ['behind', 'serveArrow', 'returnArrow', 'kitchen'], cue: 'Play right away' },
      { t: 'Drill: serve and return', say: 'Serve ten from each side to a cone deep in the diagonal court; the returner returns deep and runs to the kitchen line before the next shot.', show: ['behind', 'serveArrow', 'returnArrow', 'target'], hot: ['target'], demo: 'twobounce', cue: 'Deep and in' },
      { t: 'Drill: the kitchen game', say: 'Half-court skinny singles inside the kitchens only: dinks, no volleys from the kitchen, first to 11. It teaches the soft game and the rule at once.', show: ['kitchen', 'kitchen2', 'net'], hot: ['kitchen', 'kitchen2'], demo: 'dink', cue: 'Soft game' },
      { t: 'Calling the score', say: 'Server’s score, receiver’s score, server number. A side out passes the serve; the first server of each side out serves from the right.', show: ['svcR', 'svcL'], hot: ['svcR'], cue: 'Say it out loud' }
    ]
  },
  quiz: { kids: ['rule'], starter: ['rule'], varsity: ['rule'], coach: ['rule'] },
  cues: ['Swing low!', 'Bounce, bounce!', 'No volleys in the kitchen', 'Side by side!']
};

// ---- 2. Get to the kitchen line: serve, return, third shot, through the transition zone ----
const toLine = {
  id: 'kitchen', sport: 'pickleball', kind: 'offense',
  title: 'Get to the kitchen line', sub: 'Return deep, third-shot drop, through the transition zone',
  line: 'Serve and return deep, drop the third shot into their kitchen, and walk through the transition zone to the kitchen line side by side.',
  credit: 'The serving and returning patterns every doubles coach teaches first',
  zones: [
    out('Out: let it go, it lands out', 'The ball is heading out here, past the lines.'),
    { id: 'base', kind: 'rect', x: [-H, H], y: [40, 52], tone: 'o', label: ['Baseline'], at: [0, 47],
      ask: 'You just served, and the return is coming back deep.', rule: 'Baseline: let the return bounce, then drop it into their kitchen' },
    { id: 'trans', kind: 'rect', x: [-H, H], y: [32, 40], tone: 'warn', label: ['Transition', 'zone'], at: [0, 36],
      ask: 'You’re halfway up the court and they’re about to hit.', rule: 'Transition zone: split-step as they hit, reset it soft, keep coming' },
    { id: 'line', kind: 'rect', x: [-H, H], y: [K1, 32], tone: 'good', label: ['Kitchen line'], at: [0, 30.8],
      ask: 'You made it a step behind the kitchen line.', rule: 'Kitchen line: stop here, side by side, paddle up, be patient' },
    { id: 'kitchen', kind: 'rect', x: [-H, H], y: [NET, K1], tone: 'red', label: ['Kitchen'], at: [0, 25.5],
      ask: 'The ball bounced short, in your kitchen.', rule: 'Kitchen: step in to play a bounced ball, then step back out' },
    { id: 'theirK', kind: 'rect', x: [-H, H], y: [K0, NET], tone: 'gold', label: ['Their', 'kitchen'], at: [0, 18.5],
      ask: 'Where does your third-shot drop land?', rule: 'Their kitchen: land your drops and dinks here, they can’t attack them' },
    { id: 'theirBack', kind: 'rect', x: [-H, H], y: [-8, K0], tone: 'ice', label: ['Their', 'backcourt'], at: [0, 6],
      ask: 'Where do your serve and your return go?', rule: 'Their backcourt: serve and return deep here, keep them back' },
    net,
    { id: 'drop', kind: 'arrow', pts: [[3, 44], [1.5, 27], [0, 18.5]], tone: 'gold' },
    { id: 'walkA', kind: 'arrow', pts: [[4, 44], [4, 31.5]], tone: 'good' },
    { id: 'walkB', kind: 'arrow', pts: [[-5, 44], [-5, 31.5]], tone: 'good' },
    { id: 'deep', kind: 'arrow', pts: [[-4, 0], [0, 22], [4, 41]], tone: 'o' }
  ],
  demos: DEMOS,
  levels: {
    kids: [
      { t: 'Hit it deep', say: 'Serve and hit back way past the kitchen, close to their back line. It gives you time.', show: ['theirBack', 'deep'], hot: ['theirBack'], demo: 'twobounce', cue: 'Way back!' },
      { t: 'A soft one', say: 'Then hit a soft one that drops into their kitchen. They can’t smash it from there.', show: ['drop', 'theirK'], hot: ['theirK'], demo: 'walkup', cue: 'Soft into the kitchen!' },
      { t: 'Walk up together', say: 'Walk up with your partner to the kitchen line and stop. Paddles up!', show: ['walkA', 'walkB', 'line'], hot: ['line'], demo: 'walkup', cue: 'Up together!' }
    ],
    starter: [
      { t: 'Return deep, run in', say: 'Receiving? Return it high and deep, then run to the kitchen line. Your partner is already there.', show: ['deep', 'theirBack', 'line'], hot: ['line'], demo: 'twobounce', cue: 'Deep, then in' },
      { t: 'The third-shot drop', say: 'Serving? The return has to bounce, so you’re stuck back. Hit the third shot soft and high so it lands in their kitchen.', show: ['base', 'drop', 'theirK'], hot: ['theirK'], demo: 'walkup', cue: 'Drop it in' },
      { t: 'Through the transition zone', say: 'Walk up behind a good drop. Stop and split-step every time they hit, and if the ball comes at your feet, reset it soft.', show: ['trans', 'walkA', 'walkB'], hot: ['trans'], demo: 'reset', cue: 'Split-step' },
      { t: 'Stop at the line', say: 'A step behind the kitchen line, side by side with your partner, paddles up. Now the soft game starts.', show: ['line', 'kitchen'], hot: ['line'], demo: 'kitchen', cue: 'Side by side' }
    ],
    varsity: [
      { t: 'Drop or drive?', say: 'A deep, low return: drop. A short or high return: drive it at the player still running in, and your partner crashes the net for the weak reply.', show: ['base', 'drop', 'theirK', 'theirBack'], hot: ['theirK'], demo: 'walkup', cue: 'Read the return' },
      { t: 'Earn the line', say: 'A drop that’s too high means stop and drop again. Two good drops and resets beat one rushed step into a ball at your feet.', show: ['trans', 'line'], hot: ['trans'], demo: 'reset', cue: 'Earn it' },
      { t: 'Move as a pair', say: 'Like a rope ties you together: same depth, same side shift with the ball. A gap between you is where they hit.', show: ['walkA', 'walkB', 'line'], hot: ['line'], demo: 'walkup', cue: 'Tied by a rope' }
    ],
    coach: [
      { t: 'The idea in one line', say: 'Deep serve and return, a third shot that lands in their kitchen, and both players to the line together.', show: ['deep', 'drop', 'line'], cue: 'Deep, drop, line' },
      { t: 'Drill: drop and walk', say: 'Feeder at the kitchen line; pairs hit drops from the baseline and take two steps after every good one, split-stepping on each feed. Reach the line in four shots.', show: ['base', 'trans', 'line', 'drop'], hot: ['trans'], demo: 'walkup', cue: 'Four shots to the line' },
      { t: 'Drill: return and run', say: 'Serve; the returner hits past a rope 30 ft from the net and must be set at the kitchen line before the third shot.', show: ['deep', 'line'], hot: ['line'], demo: 'twobounce', cue: 'Set before the third' },
      { t: 'What to watch', say: 'How many points your team reaches the line together, and how often the third shot lands in their kitchen.', show: ['line', 'theirK'], hot: ['line', 'theirK'], cue: 'Chart two things' }
    ]
  },
  quiz: { kids: ['rule'], starter: ['rule'], varsity: ['rule'], coach: ['rule'] },
  cues: ['Way back!', 'Drop it in', 'Split-step', 'Side by side']
};

// ---- 3. Hold the line: the soft game, resets, the middle, the lob ----
const hold = {
  id: 'line', sport: 'pickleball', kind: 'defense',
  title: 'Hold the kitchen line', sub: 'Dink low, reset, the middle, the lob and switch',
  line: 'At the kitchen line: dink low, reset anything hard, take the middle with the forehand, and switch when they lob.',
  credit: 'The soft game and doubles positioning, the way coaches teach it',
  zones: [
    out('Out: a ball heading out, let it go', 'The ball is going to land out here.'),
    { id: 'back', kind: 'rect', x: [-H, H], y: [40, 52], tone: 'warn', label: ['Lobbed', 'deep'], at: [0, 46],
      ask: 'They lobbed over your partner and you’re chasing it back here.', rule: 'Lobbed deep: chase it on the diagonal, call switch, reset or lob back' },
    { id: 'trans', kind: 'rect', x: [-H, H], y: [32, 40], tone: 'o', label: ['Transition', 'zone'], at: [0, 36],
      ask: 'You got stuck halfway and they drive at your feet.', rule: 'Transition zone: block it soft into their kitchen, then move up' },
    { id: 'line', kind: 'rect', x: [-H, H], y: [K1, 32], tone: 'good', label: ['Kitchen line'], at: [-6, 30.8],
      ask: 'You’re at the kitchen line and their dink is low.', rule: 'Kitchen line: dink it back low and cross-court, wait for a high one' },
    { id: 'middle', kind: 'rect', x: [-2.5, 2.5], y: [K1, 33], tone: 'gold', label: ['Middle'], at: [0, 33.5],
      ask: 'A ball comes right between you and your partner.', rule: 'Middle: the forehand takes it, call it early' },
    { id: 'kitchen', kind: 'rect', x: [-H, H], y: [NET, K1], tone: 'red', label: ['Kitchen'], at: [0, 25.5],
      ask: 'You want to volley, but you’re standing in here.', rule: 'Kitchen: never volley from in here, let it bounce or step back' },
    { id: 'theirK', kind: 'rect', x: [-H, H], y: [K0, NET], tone: 'ice', label: ['Their', 'kitchen'], at: [0, 18.5],
      ask: 'Where do your dinks and resets land?', rule: 'Their kitchen: keep it low here, they can’t attack it' },
    { id: 'theirLine', kind: 'rect', x: [-H, H], y: [-8, K0], tone: 'hot', label: ['Their', 'feet'], at: [0, 9],
      ask: 'Their dink floats up above the net.', rule: 'Ball above the net: speed it up at their shoulder or feet' },
    net,
    { id: 'cross', kind: 'arrow', pts: [[4, 30], [0, 22], [-4.5, 17]], tone: 'ice' },
    { id: 'lobArrow', kind: 'arrow', pts: [[-4.5, 14], [0, 30], [5, 41]], tone: 'warn' }
  ],
  demos: DEMOS,
  levels: {
    kids: [
      { t: 'Soft and low', say: 'At the net line, tap it softly into their kitchen. Low balls are hard to smash.', show: ['line', 'theirK', 'cross'], hot: ['theirK'], demo: 'dink', cue: 'Soft and low!' },
      { t: 'Wait for the high one', say: 'If their ball comes up high, hit it hard at their feet!', show: ['theirLine'], hot: ['theirLine'], demo: 'dink', cue: 'High? Hit it!' },
      { t: 'Switch!', say: 'If the ball goes over your friend’s head, run and get it and shout "Switch!"', show: ['lobArrow', 'back'], hot: ['back'], demo: 'switch', cue: 'Switch!' }
    ],
    starter: [
      { t: 'Dink cross-court', say: 'Dink low and cross-court: it’s the longest shot over the lowest part of the net, so it’s the safest.', show: ['line', 'cross', 'theirK'], hot: ['theirK'], demo: 'dink', cue: 'Cross-court, low' },
      { t: 'Reset the hard ones', say: 'Driven at you? Paddle out front, soft hands, block it into their kitchen. A reset turns their attack back into dinks.', show: ['trans', 'theirK'], hot: ['trans'], demo: 'reset', cue: 'Soft hands' },
      { t: 'The middle', say: 'A ball down the middle goes to the forehand. Call it early: "mine!"', show: ['middle', 'line'], hot: ['middle'], demo: 'kitchen', cue: 'Forehand takes the middle' },
      { t: 'Lob and switch', say: 'A lob over your partner: you chase it on the diagonal, they slide across. Reset it, then both get back up.', show: ['lobArrow', 'back', 'line'], hot: ['back'], demo: 'switch', cue: 'Switch!' }
    ],
    varsity: [
      { t: 'Attack only above the net', say: 'Speed up a ball that’s above the net, at the shoulder or hip. A ball below the net goes back as a dink.', show: ['theirLine', 'theirK'], hot: ['theirLine'], demo: 'dink', cue: 'Above the net only' },
      { t: 'Never volley from the kitchen', say: 'Your momentum counts too: if a volley carries you into the kitchen, it’s a fault. Step back to the line between dinks.', show: ['kitchen', 'line'], hot: ['kitchen'], demo: 'kitchen', cue: 'Feet behind the line' },
      { t: 'Poach and Erne', say: 'See a pattern? Poach the cross-court dink, or jump around the kitchen corner (an Erne) to take a line dink out of the air.', show: ['line', 'middle', 'cross'], hot: ['middle'], demo: 'dink', cue: 'Steal it' }
    ],
    coach: [
      { t: 'The idea in one line', say: 'Low dinks, soft resets, the forehand in the middle, and a switch on every lob: the team that’s more patient at the line wins.', show: ['line', 'theirK', 'middle'], cue: 'Patience wins' },
      { t: 'Drill: skinny dinks', say: 'Cross-court dinking, half court only. A ball above the net may be sped up; the other player resets. First to 11.', show: ['line', 'cross', 'theirK'], hot: ['theirK'], demo: 'dink', cue: 'Above the net only' },
      { t: 'Drill: reset wall', say: 'Pairs in the transition zone; a feeder at the line drives at their feet. Ten resets into the kitchen in a row, then step up.', show: ['trans', 'theirK'], hot: ['trans'], demo: 'reset', cue: 'Soft hands' },
      { t: 'Drill: switch calls', say: 'Feed lobs over the players at the line. The diagonal partner chases and calls "switch!", the other slides. Then reset and back up.', show: ['lobArrow', 'back'], hot: ['back'], demo: 'switch', cue: 'Call it' }
    ]
  },
  quiz: { kids: ['rule'], starter: ['rule'], varsity: ['rule'], coach: ['rule'] },
  cues: ['Soft and low', 'Above the net only', 'Forehand takes the middle', 'Switch!']
};

export const pickleballConcepts = () => [basics, toLine, hold];
