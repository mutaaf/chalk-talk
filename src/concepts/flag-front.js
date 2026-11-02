// Keep it in front: flag football defense as geometry. Nothing gets behind the deepest defender, the outside
// players keep receivers inside where the help is, and short throws get rallied to and the flag pulled before the
// runner turns upfield. Built for a field (flag5 or flag7): yards, x across the field, y from the end line (0),
// goal line at 10, offense driving toward the end zone from the line of scrimmage (los). Data only.

export function keepInFront(sportId, W, los, depth, rush) {
  const h = W / 2, third = W / 6, under = los - 9, deep = 10;
  const Z = [
    { id: 'endzone', kind: 'rect', x: [-h, h], y: [0, deep], tone: 'red', label: ['End zone'], at: [0, 5],
      ask: 'The ball is thrown into the end zone.', rule: 'Stay deeper than the deepest receiver, play the ball high' },
    { id: 'deepM', kind: 'rect', x: [-third, third], y: [deep, under], tone: 'ice', label: ['Deep', 'middle'], at: [0, (deep + under) / 2],
      ask: 'A receiver runs deep, down the middle.', rule: 'Safety: read the quarterback, break on the throw' },
    { id: 'deepL', kind: 'rect', x: [-h, -third], y: [deep, under], tone: 'warn', label: ['Deep', 'outside'], at: [-(h + third) / 2, (deep + under) / 2],
      ask: 'A receiver runs deep, down the sideline.', rule: 'Stay on top and outside: the sideline squeezes him' },
    { id: 'deepR', kind: 'rect', x: [third, h], y: [deep, under], tone: 'warn', label: ['Deep', 'outside'], at: [(h + third) / 2, (deep + under) / 2],
      ask: 'A receiver runs deep, down the sideline.', rule: 'Stay on top and outside: the sideline squeezes him' },
    { id: 'hook', kind: 'rect', x: [-third, third], y: [under, los - 1], tone: 'gold', label: ['Short', 'middle'], at: [0, (under + los) / 2],
      ask: 'A short throw over the middle.', rule: 'Close fast, pull the flag before he turns' },
    { id: 'flatL', kind: 'rect', x: [-h, -third], y: [under, los - 1], tone: 'good', label: ['Flat'], at: [-(h + third) / 2, (under + los) / 2],
      ask: 'A quick throw to the flat.', rule: 'Rally to the ball, pull the flag right away' },
    { id: 'flatR', kind: 'rect', x: [third, h], y: [under, los - 1], tone: 'good', label: ['Flat'], at: [(h + third) / 2, (under + los) / 2],
      ask: 'A quick throw to the flat.', rule: 'Rally to the ball, pull the flag right away' },
    { id: 'line', kind: 'rect', x: [-h, h], y: [los - 1, depth], tone: 'hot', label: ['Contain'], at: [h - 4, los + 3],
      ask: 'The quarterback or a runner has the ball behind the line.', rule: 'Contain: keep him inside, don’t let him get outside you' },
    { id: 'goal', kind: 'line', pts: [[-h, deep], [h, deep]], tone: 'red' },
    { id: 'inL', kind: 'arrow', pts: [[-h + 2, los - 2], [-third, under - 3]], tone: 'o' },
    { id: 'inR', kind: 'arrow', pts: [[h - 2, los - 2], [third, under - 3]], tone: 'o' },
    { id: 'lid', kind: 'line', pts: [[-h, deep + 4], [h, deep + 4]], tone: 'ice', dash: true }
  ];
  if (rush) Z.push({ id: 'rush', kind: 'line', pts: [[-h, los - rush], [h, los - rush]], tone: 'hot', dash: true, label: ['Rush line'], at: [-h + 5, los - rush - 1.2] });

  const DEMOS = {
    leverage: { dur: 3.4, actors: [
      { side: 'O', label: 'X', path: [[-h + 3, los], [-h + 3.5, los - 7], [-third - 2, under - 2], [-third + 1, under - 5]] },
      { side: 'D', label: 'C', path: [[-h + 1.5, los - 6], [-h + 2.5, los - 9], [-third - 3.5, under - 3], [-third - 1, under - 5.5]] },
      { side: 'D', label: 'S', path: [[0, deep + 6], [-2, deep + 6], [-third + 1.5, under - 6.5], [-third + 1.5, under - 6.5]] }] },
    rally: { dur: 3, actors: [
      { side: 'O', label: 'Z', path: [[h - 4, los], [h - 4, los - 4], [h - 4.5, los - 6], [h - 4.5, los - 6.5]] },
      { side: 'ball', path: [[0, los + 4], [h - 6, los - 2.5], [h - 3.8, los - 6.2], [h - 3.8, los - 6.6]] },
      { side: 'D', label: 'C', path: [[h - 6, los - 7], [h - 5.5, los - 7.5], [h - 5, los - 7], [h - 4.8, los - 6.8]] },
      { side: 'D', label: 'S', path: [[0, deep + 6], [4, deep + 8], [h - 7, los - 8], [h - 6, los - 7.5]] }] },
    lid: { dur: 3.2, actors: [
      { side: 'O', label: 'Y', path: [[2, los], [2, los - 10], [1, deep + 6], [0.5, deep + 2]] },
      { side: 'D', label: 'S', path: [[0, deep + 9], [0.5, deep + 8], [0.8, deep + 4], [0.6, deep + 0.8]] }] },
    contain: { dur: 3, actors: [
      { side: 'O', label: 'Q', path: [[0, los + 5], [4, los + 5.5], [8, los + 4], [7, los + 2]] },
      { side: 'D', label: 'R', path: [[0, los - (rush || 4)], [4, los], [9.5, los + 3], [9, los + 1.5]] }] }
  };
  const S = (o) => o;   // a step, as written
  const L = {
    kids: [
      S({ t: 'Stay in front', say: 'Always stand between the runner and your end zone. If they’re in front of you, you can catch them.', show: ['endzone', 'goal'], hot: ['endzone'], demo: 'lid', cue: 'In front!' }),
      S({ t: 'Push them to the middle', say: 'If you’re on the outside, stay on the outside. Let them run to the middle, where your friends are.', show: ['inL', 'inR', 'deepM'], hot: ['deepM'], demo: 'leverage', cue: 'Outside!' }),
      S({ t: 'Run to the ball', say: 'When the ball is thrown, everybody runs to it. Then grab the flag, not the shirt.', show: ['flatL', 'flatR', 'hook'], hot: ['flatR'], demo: 'rally', cue: 'Run to the ball!' }),
      S({ t: 'Grab the flag', say: 'Eyes on the hip, hands on the flag, pull and hold it up high!', show: ['flatR'], hot: ['flatR'], demo: 'rally', cue: 'Flag!' })
    ],
    starter: [
      S({ t: 'The deepest defender', say: 'One of you is always the deepest player on the field. Nothing gets behind you, ever.', show: ['endzone', 'deepM', 'goal', 'lid'], hot: ['deepM'], demo: 'lid', cue: 'Nothing deep!' }),
      S({ t: 'Outside leverage', say: 'Line up a little outside your receiver. He has to go inside, where the safety is.', show: ['deepL', 'deepR', 'inL', 'inR', 'deepM'], hot: ['deepL', 'deepR'], demo: 'leverage', cue: 'Outside shoulder' }),
      S({ t: 'Cushion', say: 'Start five to seven yards off. Backpedal as he comes; you can always come up, you can’t catch up.', show: ['flatL', 'flatR', 'hook'], hot: ['flatL', 'flatR'], cue: 'Cushion!' }),
      S({ t: 'Rally to the ball', say: 'On every throw, all of you sprint to the ball. The first one there pulls the flag; the rest are the backup.', show: ['flatR', 'hook'], hot: ['flatR'], demo: 'rally', cue: 'Rally!' }),
      ...(rush ? [S({ t: 'The rush', say: `The rusher starts ${rush} yards off. Rush to contain: get to the quarterback’s outside shoulder and push him back inside.`, show: ['rush', 'line'], hot: ['line'], demo: 'contain', cue: 'Contain!' })]
        : [S({ t: 'No rush, so cover', say: 'Nobody rushes here, so everybody covers. The quarterback has time: stay with your receiver longer.', show: ['line', 'flatL', 'flatR', 'hook'], hot: ['line'], cue: 'Stay on him' })]),
      S({ t: 'The end zone', say: 'Near your goal line, the field is short. Play tighter and stay deeper than every receiver.', show: ['endzone', 'goal'], hot: ['endzone'], demo: 'lid', cue: 'Tight and deep' })
    ],
    varsity: [
      S({ t: 'Keep it in front', say: 'Every throw in front of you is a short gain and a flag pull. The only big play is the one behind you.', show: ['endzone', 'deepL', 'deepM', 'deepR', 'flatL', 'flatR', 'hook', 'line'], cue: 'Everything in front' }),
      S({ t: 'Leverage and the funnel', say: 'Outside defenders keep outside leverage, the middle keeps depth. Receivers get funnelled into the safety.', show: ['inL', 'inR', 'deepM', 'deepL', 'deepR'], hot: ['deepM'], demo: 'leverage', cue: 'Funnel inside' }),
      S({ t: 'Read the quarterback', say: 'The safety reads the quarterback’s eyes and shoulders, not the receivers. Break when the arm comes forward.', show: ['deepM', 'lid'], hot: ['deepM'], demo: 'lid', cue: 'Eyes on the QB' }),
      S({ t: 'Rally and pursuit angles', say: 'Take an angle to where the runner will be, not where he is. Two defenders on every catch.', show: ['flatR', 'hook', 'deepR'], hot: ['flatR'], demo: 'rally', cue: 'Angle!' }),
      S({ t: 'Contain', say: 'Behind the line, the outside is yours. If the quarterback or a runner gets outside, everybody is chasing.', show: ['line'].concat(rush ? ['rush'] : []), hot: ['line'], demo: 'contain', cue: 'Keep him in' }),
      S({ t: 'Red zone', say: 'Inside the ten, there’s no deep. Squeeze the field, jump the short routes, and play the end line.', show: ['endzone', 'goal', 'hook', 'flatL', 'flatR'], hot: ['endzone'], cue: 'Squeeze it' })
    ],
    coach: [
      S({ t: 'The idea in one line', say: 'Keep everything in front, funnel it to the help, and swarm the catch. Teach places before routes.', show: ['endzone', 'deepL', 'deepM', 'deepR', 'flatL', 'flatR', 'hook', 'line'], cue: 'In front, funnel, swarm' }),
      S({ t: 'Teaching order', say: 'Flag pulling, then staying in front, then leverage, then rallying, then reading the quarterback.', show: ['flatL', 'flatR'], hot: ['flatR'], cue: 'Flags first' }),
      S({ t: 'Drill: sideline flag', say: 'A runner and a defender in a five-yard alley along the sideline. The defender must pull the flag before the cone.', show: ['flatR', 'deepR'], hot: ['flatR'], demo: 'rally', cue: 'Pull it!' }),
      S({ t: 'Drill: leverage mirror', say: 'Receiver tries to get outside; defender keeps outside leverage for ten yards. Then add a safety in the middle.', show: ['deepL', 'inL', 'deepM'], hot: ['deepL'], demo: 'leverage', cue: 'Win outside' }),
      S({ t: 'What to chart', say: 'Plays over 15 yards, catches with no defender within two yards, and missed flag pulls.', show: ['deepL', 'deepM', 'deepR'], hot: ['deepM'], cue: 'Chart three things' }),
      S({ t: 'By age', say: 'Under 9: stay in front, run to the ball, pull the flag. 9 to 12: leverage and cushion. 13 and up: read the quarterback and contain.', show: ['endzone', 'flatL', 'flatR', 'deepM'], cue: 'Grow it' })
    ]
  };
  return {
    id: 'front', sport: sportId, kind: 'defense',
    title: 'Keep it in front', sub: 'Leverage, cushion and the rally to the flag',
    line: 'Nothing behind you, everything funnelled to the help, every catch swarmed.',
    zones: Z, demos: DEMOS, levels: L,
    quiz: { kids: ['rule'], starter: ['rule'], varsity: ['rule'], coach: ['rule'] },
    cues: ['In front!', 'Outside!', 'Rally!', 'Flag!', 'Contain!']
  };
}
