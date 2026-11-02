// Flood (Sail): the passing concept that puts three receivers at three depths on one side (go, sail, flat) so
// one defender can't cover two levels; the QB reads high to low. The backside runs a post and a dig to hold the
// safety and catch what the flood leaves open. Route names are the route tree's. Field as in flag-coverage.js:
// yards, x across, goal line at y 10, the offense attacking toward y 0 from the line of scrimmage (los).
// The flood goes to the right; mirror it on the board. Data only.

const goal = 10;

export function flood(sportId, W, los, depth) {
  const h = W / 2, t = h / 3, mid = los - 12, flat = los - 4;
  const Z = [
    { id: 'endzone', kind: 'rect', x: [-h, h], y: [0, goal], tone: 'red', label: ['End zone'], at: [0, 5],
      ask: 'You’re running your route into the end zone.', rule: 'End zone: get to the back line, then work back toward the QB' },
    { id: 'go', kind: 'rect', x: [t, h], y: [goal, mid], tone: 'ice', label: ['Go'], at: [(t + h) / 2, goal + 3],
      ask: 'You’re the outside receiver on the flood side.', rule: 'Go route: run off the deep defender; if he stays short, you’re open over the top' },
    { id: 'sail', kind: 'rect', x: [t, h], y: [mid, flat], tone: 'gold', label: ['Sail'], at: [(t + h) / 2, (mid + flat) / 2],
      ask: 'You run the middle level of the flood, toward the sideline.', rule: 'Sail route: break to the sideline at 10 to 12 yards, under the go and over the flat' },
    { id: 'flat', kind: 'rect', x: [t, h], y: [flat, los], tone: 'good', label: ['Flat'], at: [(t + h) / 2, flat + 2],
      ask: 'You run the short level of the flood.', rule: 'Flat route: get width fast, catch it, turn upfield' },
    { id: 'post', kind: 'rect', x: [-h, t], y: [goal, mid], tone: 'ice', label: ['Backside', 'post'], at: [-(h - t) / 2, goal + 3],
      ask: 'You’re on the backside, away from the flood, running deep.', rule: 'Backside post: hold the safety in the middle so he can’t help the flood' },
    { id: 'dig', kind: 'rect', x: [-h, t], y: [mid, los], tone: 'warn', label: ['Backside', 'dig'], at: [-(h - t) / 2, (mid + los) / 2],
      ask: 'You’re on the backside, away from the flood, running short.', rule: 'Backside dig: cross the middle late and sit in the hole the flood leaves' },
    { id: 'qb', kind: 'rect', x: [-h, h], y: [los, depth], tone: 'hot', label: ['QB'], at: [-h + 3, los + 4],
      ask: 'You have the ball behind the line.', rule: 'QB: read high to low, go then sail then flat, then the dig' },
    { id: 'rGo', kind: 'arrow', pts: [[h - 3, los], [h - 3, goal + 3]], tone: 'ice' },
    { id: 'rSail', kind: 'arrow', pts: [[t + 2, los], [t + 2, los - 7], [h - 2, mid + 1]], tone: 'gold' },
    { id: 'rFlat', kind: 'arrow', pts: [[2, los + 2], [t + 2, los + 0.5], [h - 3, flat + 1.5]], tone: 'good' },
    { id: 'rDig', kind: 'arrow', pts: [[-h + 4, los], [-h + 4, los - 9], [t - 1, los - 9]], tone: 'warn' },
    { id: 'rPost', kind: 'arrow', pts: [[-h + 7, los], [-h + 7, mid + 2], [-1, goal + 4]], tone: 'ice' }
  ];
  const sail = [[t + 2, los], [t + 2, los - 6], [h - 4, los - 10], [h - 3, los - 11]];
  const flatPath = [[2, los + 2], [t + 2, los + 0.5], [h - 5, flat + 2.5], [h - 3.5, flat + 1.5]];
  const qb = { side: 'O', label: 'Q', path: [[0, los + 5], [0, los + 5.5], [0, los + 5.5], [0, los + 5.5]] };
  const DEMOS = {
    flood: { dur: 3.6, actors: [qb,
      { side: 'O', label: 'Z', path: [[h - 3, los], [h - 3, los - 7], [h - 3, mid - 2], [h - 3, goal + 4]] },
      { side: 'O', label: 'Y', path: sail }, { side: 'O', label: 'H', path: flatPath },
      { side: 'D', label: 'C', path: [[h - 4, los - 6], [h - 3.5, los - 10], [h - 3, mid - 3], [h - 3, goal + 5]] },
      { side: 'ball', path: [[0, los + 4.5], [0, los + 4.5], [0, los + 4.5], [h - 3.2, los - 10.8]] }] },
    flat: { dur: 3.6, actors: [qb,
      { side: 'O', label: 'Y', path: sail }, { side: 'O', label: 'H', path: flatPath },
      { side: 'D', label: 'L', path: [[t + 3, los - 5], [t + 4, los - 8], [h - 4, los - 10], [h - 3.6, los - 10.4]] },
      { side: 'ball', path: [[0, los + 4.5], [0, los + 4.5], [0, los + 4.5], [h - 3.4, flat + 1.4]] }] },
    dig: { dur: 3.6, actors: [qb,
      { side: 'O', label: 'X', path: [[-h + 4, los], [-h + 4, los - 9], [-2, los - 9], [t - 1.5, los - 9]] },
      { side: 'O', label: 'Y', path: sail },
      { side: 'D', label: 'L', path: [[0, los - 6], [t, los - 7], [t + 3, los - 9], [h - 4.5, los - 10]] },
      { side: 'ball', path: [[0, los + 4.5], [0, los + 4.5], [0, los + 4.5], [t - 1.7, los - 8.6]] }] }
  };
  const L = {
    kids: [
      { t: 'Three friends, one side', say: 'Three of you run to the same side: one runs far, one runs to the middle of the field and turns to the sideline, one stays close.', show: ['go', 'sail', 'flat', 'rGo', 'rSail', 'rFlat'], hot: ['go', 'sail', 'flat'], demo: 'flood', cue: 'Far, middle, close!' },
      { t: 'Run far', say: 'The far runner goes fast and straight. The defender has to go with you, and that leaves space for your friends.', show: ['go', 'rGo'], hot: ['go'], demo: 'flood', cue: 'Run far!' },
      { t: 'Turn to the sideline', say: 'The middle runner goes up, then turns toward the sideline. That’s where the ball often goes.', show: ['sail', 'rSail'], hot: ['sail'], demo: 'flood', cue: 'Turn out!' },
      { t: 'Stay close', say: 'The close runner goes to the side right away. If nobody is near you, you get the ball!', show: ['flat', 'rFlat'], hot: ['flat'], demo: 'flat', cue: 'Get wide!' }
    ],
    starter: [
      { t: 'Flood', say: 'Three receivers flood one side at three depths: a go route deep, a sail route at 10 to 12 yards, a flat route short. The defense has more people to cover than defenders on that side.', show: ['go', 'sail', 'flat', 'rGo', 'rSail', 'rFlat'], hot: ['go', 'sail', 'flat'], demo: 'flood', cue: 'Three levels' },
      { t: 'The go clears it', say: 'The go route runs off the deep defender. If he doesn’t go with it, throw it over the top.', show: ['go', 'rGo'], hot: ['go'], demo: 'flood', cue: 'Clear it!' },
      { t: 'The sail', say: 'Up the field, then break hard to the sideline at 10 to 12 yards, under the go and over the flat. It’s the main throw.', show: ['sail', 'rSail'], hot: ['sail'], demo: 'flood', cue: 'Break out!' },
      { t: 'The flat', say: 'Get to the sideline fast, eyes on the QB. If the defender drops under the sail, you’re open.', show: ['flat', 'rFlat'], hot: ['flat'], demo: 'flat', cue: 'Width!' },
      { t: 'QB: high to low', say: 'Look at the go first, then the sail, then the flat. Throw to the first one the defense leaves.', show: ['qb', 'go', 'sail', 'flat'], hot: ['qb'], demo: 'flat', cue: 'High to low' }
    ],
    varsity: [
      { t: 'Flood in one picture', say: 'Three levels on one side, a post and a dig on the other. Stretch them vertically on the flood side, hold the safety on the backside.', show: ['go', 'sail', 'flat', 'post', 'dig', 'rGo', 'rSail', 'rFlat', 'rDig', 'rPost'], cue: 'Three levels' },
      { t: 'High-low read', say: 'Read the flat defender. He sinks under the sail: throw the flat. He jumps the flat: throw the sail over him.', show: ['sail', 'flat', 'qb'], hot: ['sail', 'flat'], demo: 'flat', cue: 'Read the flat defender' },
      { t: 'Against Cover 3', say: 'The corner has the deep third, so the go takes him away. The curl-flat defender is the one who has to choose between the sail and the flat.', show: ['go', 'sail', 'flat'], hot: ['sail'], demo: 'flood', cue: 'Make him choose' },
      { t: 'The backside', say: 'The post holds the free safety in the middle. If the whole defense shifts to the flood, the dig is open coming across.', show: ['post', 'dig', 'rPost', 'rDig'], hot: ['dig'], demo: 'dig', cue: 'Backside dig!' },
      { t: 'Spacing', say: 'Keep the three levels at least 5 yards apart, deep, middle and short. Two receivers at the same depth let one defender cover both.', show: ['go', 'sail', 'flat'], hot: ['sail'], cue: 'Five yards apart' }
    ],
    coach: [
      { t: 'The idea in one line', say: 'Flood one side with three levels so one defender has to cover two, then read high to low.', show: ['go', 'sail', 'flat', 'qb', 'rGo', 'rSail', 'rFlat'], cue: 'Three levels, one read' },
      { t: 'Teaching order', say: 'The three routes on air, then the QB’s high-low read, then one defender, then the backside dig, then against Cover 2 and Cover 3.', show: ['go', 'sail', 'flat'], hot: ['sail'], cue: 'Air first' },
      { t: 'Drill: two on one', say: 'A sail and a flat against one defender. The QB throws to whoever the defender doesn’t take. Rotate everyone.', show: ['sail', 'flat'], hot: ['sail', 'flat'], demo: 'flat', cue: 'Throw off him' },
      { t: 'Drill: depth cones', say: 'Cones at 5 and 11 yards on the flood side. The flat stays under 5, the sail breaks at 11, the go runs past both.', show: ['go', 'sail', 'flat'], hot: ['go', 'sail', 'flat'], demo: 'flood', cue: 'Hit your depth' },
      { t: 'What to chart', say: 'Completions to each level, which defender the QB read, and sacks or throwaways. If the flat never gets the ball, the read is too slow.', show: ['go', 'sail', 'flat', 'qb'], hot: ['qb'], cue: 'Chart three things' },
      { t: 'By age', say: 'Under 9: far, middle, close. 9 to 12: the sail and the high-low read. 13 and up: the backside and reading the coverage.', show: ['go', 'sail', 'flat'], cue: 'Grow it' }
    ]
  };
  return {
    id: 'flood', sport: sportId, kind: 'offense',
    title: 'Flood (Sail)', sub: 'Go, sail and flat: three levels to one side',
    line: 'Three receivers at three depths on one side, read high to low.',
    zones: Z, demos: DEMOS, levels: L,
    quiz: { kids: ['rule'], starter: ['rule'], varsity: ['rule'], coach: ['rule'] },
    cues: ['Three levels', 'Clear it!', 'Break out!', 'Width!', 'High to low']
  };
}
