// Zone coverages for flag football, named the way football names them. 5v5 (one rusher, four in coverage) plays
// Cover 2: two deep halves, two underneath defenders from curl to flat. 7v7 (no rush, seven in coverage) plays
// Cover 3: three deep thirds, two curl-flat and two hook-curl defenders underneath. Each zone's label is the
// coverage's own word; the soft spots are the real ones (Cover 2's honey hole and middle hole, Cover 3's seams).
// Field: yards, x across, y from the end line (0), goal line at 10, the offense attacking toward 0 from the line
// of scrimmage (los). Data only; see basketball-space.js for the shape.

const goal = 10;

function common(h, los, depth, rush) {
  return {
    endzone: { id: 'endzone', kind: 'rect', x: [-h, h], y: [0, goal], tone: 'red', label: ['End zone'], at: [0, 5],
      ask: 'The ball is thrown into the end zone.', rule: 'End zone: stay deeper than the deepest receiver, play the ball at its highest point' },
    line: { id: 'line', kind: 'rect', x: [-h, h], y: [los - 1, depth], tone: 'hot', label: [rush ? 'Rush' : 'No rush'], at: [h - 4, los + 3],
      ask: 'The quarterback has the ball behind the line.',
      rule: rush ? `Rusher: from ${rush} yards, rush the throwing shoulder and keep him inside` : 'No rush: everybody stays in coverage; the QB has about four seconds' },
    goalLine: { id: 'goal', kind: 'line', pts: [[-h, goal], [h, goal]], tone: 'red' },
    rushLine: rush ? { id: 'rush', kind: 'line', pts: [[-h, los - rush], [h, los - rush]], tone: 'hot', dash: true, label: ['Rush line'], at: [-h + 5, los - rush - 1.2] } : null
  };
}

// ---- Cover 2 (5v5): two deep, two under, one rusher -------------------------------------------------------
export function cover2(sportId, W, los, depth, rush) {
  const h = W / 2, u = los - 8, C = common(h, los, depth, rush);
  const Z = [C.endzone,
    { id: 'deepL', kind: 'rect', x: [-h, 0], y: [goal, u], tone: 'ice', label: ['Deep', 'half'], at: [-h / 2, goal + 3],
      ask: 'A receiver runs deep on your half of the field.', rule: 'Deep half: stay deeper than the deepest receiver on your side' },
    { id: 'deepR', kind: 'rect', x: [0, h], y: [goal, u], tone: 'ice', label: ['Deep', 'half'], at: [h / 2, goal + 3],
      ask: 'A receiver runs deep on your half of the field.', rule: 'Deep half: stay deeper than the deepest receiver on your side' },
    { id: 'holeL', kind: 'circle', c: [-h + 3, u - 5], r: 2.8, tone: 'warn', label: ['Honey', 'hole'], at: [-h + 3, u - 0.6],
      ask: 'A receiver sits down by the sideline, past the under defender and short of the safety.', rule: 'Honey hole: the under defender sinks under it, the safety drives down on the throw' },
    { id: 'holeR', kind: 'circle', c: [h - 3, u - 5], r: 2.8, tone: 'warn', label: ['Honey', 'hole'], at: [h - 3, u - 0.6],
      ask: 'A receiver sits down by the sideline, past the under defender and short of the safety.', rule: 'Honey hole: the under defender sinks under it, the safety drives down on the throw' },
    { id: 'underL', kind: 'rect', x: [-h, 0], y: [u, los - 1], tone: 'good', label: ['Curl', 'to flat'], at: [-h / 2 - 1.5, (u + los) / 2],
      ask: 'A receiver runs a short route on your side.', rule: 'Curl to flat: wall the curl, then drive on the flat and pull the flag' },
    { id: 'underR', kind: 'rect', x: [0, h], y: [u, los - 1], tone: 'good', label: ['Curl', 'to flat'], at: [h / 2 + 1.5, (u + los) / 2],
      ask: 'A receiver runs a short route on your side.', rule: 'Curl to flat: wall the curl, then drive on the flat and pull the flag' },
    { id: 'middle', kind: 'circle', c: [0, u + 3], r: 2.6, tone: 'warn', label: ['Middle', 'hole'], at: [0, u + 0.2],
      ask: 'A receiver settles in the middle, between the two under defenders.', rule: 'Middle hole: both under defenders squeeze it, eyes on the QB, break on the throw' },
    C.line, C.goalLine,
    { id: 'seam', kind: 'line', pts: [[0, goal], [0, u]], tone: 'ice', dash: true, label: ['Split the', 'safeties'], at: [0, goal + 6] },
    { id: 'rally', kind: 'arrow', pts: [[h / 2, goal + 5], [h - 4, los - 4]], tone: 'o' }
  ].concat(C.rushLine ? [C.rushLine] : []);

  const DEMOS = {
    drop: { dur: 3, actors: [
      { side: 'D', label: 'C', path: [[-h + 3, los - 5], [-h / 2, los - 5]] }, { side: 'D', label: 'C', path: [[h - 3, los - 5], [h / 2, los - 5]] },
      { side: 'D', label: 'S', path: [[-4, u - 2], [-h / 2, u - 6]] }, { side: 'D', label: 'S', path: [[4, u - 2], [h / 2, u - 6]] },
      { side: 'D', label: 'R', path: [[2.5, los - (rush || 4)], [0.5, los + 3]] }] },
    flat: { dur: 3, actors: [
      { side: 'O', label: 'Z', path: [[h - 4, los], [h - 3, los - 3], [h - 2, los - 5]] },
      { side: 'ball', path: [[0, los + 4], [h - 3, los - 4], [h - 2.3, los - 5.3]] },
      { side: 'D', label: 'C', path: [[h / 2, los - 6], [h - 4.5, los - 6], [h - 2.8, los - 5.6]] }] },
    honey: { dur: 3.4, actors: [
      { side: 'O', label: 'X', path: [[-h + 3, los], [-h + 3, los - 8], [-h + 3, u - 5]] },
      { side: 'D', label: 'C', path: [[-h / 2, los - 5], [-h + 4, los - 9], [-h + 3.8, u - 3.2]] },
      { side: 'D', label: 'S', path: [[-h / 2, u - 6], [-h / 2 - 1, u - 6], [-h + 3.4, u - 6.6]] },
      { side: 'ball', path: [[0, los + 4], [0, los + 4], [-h + 3.3, u - 5.2]] }] },
    seam: { dur: 3.2, actors: [
      { side: 'O', label: 'Y', path: [[1, los], [0.5, u], [0, goal + 2]] },
      { side: 'D', label: 'S', path: [[-h / 2, u - 6], [-4, goal + 6], [-1.2, goal + 2.5]] },
      { side: 'D', label: 'S', path: [[h / 2, u - 6], [4, goal + 6], [1.4, goal + 3]] }] },
    rush: { dur: 3, actors: [
      { side: 'O', label: 'Q', path: [[0, los + 5], [3, los + 5.5], [7, los + 4]] },
      { side: 'D', label: 'R', path: [[0, los - (rush || 4)], [3, los], [7.8, los + 3.4]] }] }
  };
  const L = {
    kids: [
      { t: 'Two deep, two short', say: 'Two of you stay far back, one on each half. Two of you stay close to the line. One friend chases the quarterback.', show: ['deepL', 'deepR', 'underL', 'underR', 'line'], hot: ['deepL', 'deepR'], demo: 'drop', cue: 'Two and two!' },
      { t: 'Deep means deep', say: 'If you’re a deep friend, nobody gets behind you. Ever.', show: ['deepL', 'deepR', 'endzone'], hot: ['deepL', 'deepR'], demo: 'seam', cue: 'Nobody behind!' },
      { t: 'Run to the ball', say: 'When the ball is thrown, everybody runs to it. Then grab the flag, not the shirt.', show: ['underR', 'rally'], hot: ['underR'], demo: 'flat', cue: 'Run to the ball!' },
      { t: 'Grab the flag', say: 'Eyes on the hip, hands on the flag, pull and hold it up high!', show: ['underR'], hot: ['underR'], demo: 'flat', cue: 'Flag!' }
    ],
    starter: [
      { t: 'Cover 2', say: 'Two safeties split the deep field in half. Two under defenders take the short routes on their side. The fifth player rushes.', show: ['deepL', 'deepR', 'underL', 'underR', 'line', 'seam'].concat(rush ? ['rush'] : []), hot: ['deepL', 'deepR', 'underL', 'underR'], demo: 'drop', cue: 'Cover 2!' },
      { t: 'Deep half', say: 'Safety: stay deeper than the deepest receiver on your half. Read the quarterback, break when the ball is in the air.', show: ['deepL', 'deepR', 'seam'], hot: ['deepL'], demo: 'seam', cue: 'Stay on top' },
      { t: 'Curl to flat', say: 'Under defender: wall off the curl first, then drive to the flat when the ball goes there. Pull the flag before he turns up.', show: ['underL', 'underR'], hot: ['underR'], demo: 'flat', cue: 'Curl, then flat' },
      { t: 'The honey hole', say: 'The soft spot in Cover 2 is by the sideline, past the under defender and short of the safety. The under defender sinks under it; the safety comes down hard.', show: ['holeL', 'holeR', 'underL', 'deepL'], hot: ['holeL'], demo: 'honey', cue: 'Sink!' },
      ...(rush ? [{ t: 'The rusher', say: `The rusher starts ${rush} yards off. Rush the quarterback’s throwing shoulder, hands up, and keep him inside.`, show: ['rush', 'line'], hot: ['line'], demo: 'rush', cue: 'Contain!' }] : []),
      { t: 'Rally', say: 'Every throw, all four sprint to the ball. First one there pulls the flag, the rest are the backup.', show: ['rally', 'underR', 'deepR'], hot: ['underR'], demo: 'flat', cue: 'Rally!' }
    ],
    varsity: [
      { t: 'Cover 2 in one picture', say: 'Two deep halves, two under, one rusher. Everything short gets rallied to; nothing gets behind the safeties.', show: ['endzone', 'deepL', 'deepR', 'underL', 'underR', 'line', 'seam'], cue: 'Two deep, two under' },
      { t: 'Its weak spots', say: 'Three places beat Cover 2: the honey hole by the sideline, the middle hole between the under defenders, and a seam that splits the safeties. Know them before they find them.', show: ['holeL', 'holeR', 'middle', 'seam'], hot: ['holeL', 'holeR', 'middle'], cue: 'Know the holes' },
      { t: 'Squeeze the middle', say: 'Under defenders: when nobody threatens your flat, squeeze toward the middle hole with your eyes on the QB.', show: ['middle', 'underL', 'underR'], hot: ['middle'], cue: 'Squeeze' },
      { t: 'Split the safeties', say: 'A receiver straight up the middle wants to split the safeties. Both safeties pinch toward him without losing depth.', show: ['seam', 'deepL', 'deepR'], hot: ['seam'], demo: 'seam', cue: 'Pinch!' },
      { t: 'Red zone', say: 'Inside the ten there’s no deep half left. Safeties play the end line, under defenders jump the short routes.', show: ['endzone', 'goal', 'underL', 'underR'], hot: ['endzone'], cue: 'Squeeze it' }
    ],
    coach: [
      { t: 'The idea in one line', say: 'Cover 2: two deep halves, two curl-to-flat defenders and a rusher. Keep it in front, rally, and close the three holes.', show: ['endzone', 'deepL', 'deepR', 'underL', 'underR', 'line'], cue: 'Two deep, two under' },
      { t: 'Teaching order', say: 'Flag pulling, then the drops, then curl to flat, then the safeties’ depth, then the holes, then the rush.', show: ['underL', 'underR', 'deepL', 'deepR'], hot: ['underR'], cue: 'Flags first' },
      { t: 'Drill: drop and break', say: 'Four defenders in their Cover 2 spots. On the snap, drop to the landmark; on the coach’s point, break to the ball and pull a flag.', show: ['deepL', 'deepR', 'underL', 'underR'], demo: 'drop', cue: 'Drop, break' },
      { t: 'Drill: honey hole', say: 'A receiver runs a sideline route at 12 to 15 yards. The under defender sinks under it, the safety comes over the top. Count breakups.', show: ['holeL', 'underL', 'deepL'], hot: ['holeL'], demo: 'honey', cue: 'Sink and drive' },
      { t: 'What to chart', say: 'Catches in the honey hole, catches in the middle hole, and any catch behind a safety. Those three tell you what to fix.', show: ['holeL', 'holeR', 'middle', 'deepL', 'deepR'], hot: ['holeL', 'holeR', 'middle'], cue: 'Chart three things' },
      { t: 'By age', say: 'Under 9: two deep, two short, run to the ball. 9 to 12: curl to flat and deep halves. 13 and up: the holes and the red zone.', show: ['deepL', 'deepR', 'underL', 'underR'], cue: 'Grow it' }
    ]
  };
  return {
    id: 'cover2', sport: sportId, kind: 'defense',
    title: 'Cover 2', sub: 'Two deep halves, curl to flat, one rusher',
    line: 'Two safeties split the deep field, two defenders own the short routes, and everybody rallies to the flag.',
    zones: Z, demos: DEMOS, levels: L,
    quiz: { kids: ['rule'], starter: ['rule'], varsity: ['rule'], coach: ['rule'] },
    cues: ['Cover 2!', 'Stay on top', 'Curl, then flat', 'Sink!', 'Rally!']
  };
}

// ---- Cover 3 (7v7): three deep, four under, no rush --------------------------------------------------------
export function cover3(sportId, W, los, depth, rush) {
  const h = W / 2, t = W / 6, u = los - 10, ins = h * 0.45, C = common(h, los, depth, rush);
  const Z = [C.endzone,
    { id: 'deepL', kind: 'rect', x: [-h, -t], y: [goal, u], tone: 'ice', label: ['Deep', 'third'], at: [-(h + t) / 2, goal + 3],
      ask: 'A receiver runs deep down the outside.', rule: 'Deep third: corner, stay deeper than anyone in your third' },
    { id: 'deepM', kind: 'rect', x: [-t, t], y: [goal, u], tone: 'ice', label: ['Deep', 'middle'], at: [0, goal + 3],
      ask: 'A receiver runs deep down the middle.', rule: 'Deep middle: free safety, read the QB and break on the throw' },
    { id: 'deepR', kind: 'rect', x: [t, h], y: [goal, u], tone: 'ice', label: ['Deep', 'third'], at: [(h + t) / 2, goal + 3],
      ask: 'A receiver runs deep down the outside.', rule: 'Deep third: corner, stay deeper than anyone in your third' },
    { id: 'seamL', kind: 'circle', c: [-t, u - 5], r: 2.6, tone: 'warn', label: ['Seam'], at: [-t, u - 1],
      ask: 'A receiver runs straight up the seam, between two deep thirds.', rule: 'Seam: the hook defender carries it up, the free safety tops it' },
    { id: 'seamR', kind: 'circle', c: [t, u - 5], r: 2.6, tone: 'warn', label: ['Seam'], at: [t, u - 1],
      ask: 'A receiver runs straight up the seam, between two deep thirds.', rule: 'Seam: the hook defender carries it up, the free safety tops it' },
    { id: 'flatL', kind: 'rect', x: [-h, -ins], y: [u, los - 1], tone: 'good', label: ['Curl', 'flat'], at: [-(h + ins) / 2, (u + los) / 2],
      ask: 'A receiver runs a short route on the outside.', rule: 'Curl-flat: sink under the curl, then drive on the flat' },
    { id: 'hookL', kind: 'rect', x: [-ins, 0], y: [u, los - 1], tone: 'gold', label: ['Hook', 'curl'], at: [-ins / 2, (u + los) / 2],
      ask: 'A receiver runs a short route inside, over the middle.', rule: 'Hook-curl: wall the crosser, carry the seam, settle under the curl' },
    { id: 'hookR', kind: 'rect', x: [0, ins], y: [u, los - 1], tone: 'gold', label: ['Hook', 'curl'], at: [ins / 2, (u + los) / 2],
      ask: 'A receiver runs a short route inside, over the middle.', rule: 'Hook-curl: wall the crosser, carry the seam, settle under the curl' },
    { id: 'flatR', kind: 'rect', x: [ins, h], y: [u, los - 1], tone: 'good', label: ['Curl', 'flat'], at: [(h + ins) / 2, (u + los) / 2],
      ask: 'A receiver runs a short route on the outside.', rule: 'Curl-flat: sink under the curl, then drive on the flat' },
    C.line, C.goalLine,
    { id: 'rally', kind: 'arrow', pts: [[t + 2, goal + 6], [h - 4, los - 4]], tone: 'o' }
  ].concat(C.rushLine ? [C.rushLine] : []);

  const DEMOS = {
    drop: { dur: 3, actors: [
      { side: 'D', label: 'C', path: [[-h + 3, los - 6], [-(h + t) / 2, u - 4]] }, { side: 'D', label: 'S', path: [[0, u - 2], [0, u - 6]] },
      { side: 'D', label: 'C', path: [[h - 3, los - 6], [(h + t) / 2, u - 4]] },
      { side: 'D', label: 'L', path: [[-h + 6, los - 3], [-(h + ins) / 2, los - 6]] }, { side: 'D', label: 'L', path: [[-4, los - 4], [-ins / 2, los - 7]] },
      { side: 'D', label: 'L', path: [[4, los - 4], [ins / 2, los - 7]] }, { side: 'D', label: 'L', path: [[h - 6, los - 3], [(h + ins) / 2, los - 6]] }] },
    seam: { dur: 3.4, actors: [
      { side: 'O', label: 'Y', path: [[-t, los], [-t, u + 2], [-t, u - 6]] },
      { side: 'D', label: 'L', path: [[-ins / 2, los - 7], [-t + 0.8, u + 1], [-t + 1, u - 3.5]] },
      { side: 'D', label: 'S', path: [[0, u - 6], [-1.5, u - 6], [-t + 0.8, u - 7.2]] },
      { side: 'ball', path: [[0, los + 4], [0, los + 4], [-t + 0.3, u - 6.3]] }] },
    flat: { dur: 3, actors: [
      { side: 'O', label: 'Z', path: [[h - 4, los], [h - 3, los - 3], [h - 2, los - 4.5]] },
      { side: 'ball', path: [[0, los + 4], [h - 3, los - 3.5], [h - 2.3, los - 4.8]] },
      { side: 'D', label: 'L', path: [[(h + ins) / 2, los - 6], [h - 4, los - 5.5], [h - 2.6, los - 5]] }] },
    curl: { dur: 3.2, actors: [
      { side: 'O', label: 'X', path: [[-h + 3, los], [-h + 3, los - 12], [-h + 4, los - 10]] },
      { side: 'D', label: 'L', path: [[-(h + ins) / 2, los - 6], [-h + 5, los - 8], [-h + 4.6, los - 9]] },
      { side: 'D', label: 'C', path: [[-(h + t) / 2, u - 4], [-h + 4, u - 6], [-h + 4, u - 6]] }] }
  };
  const L = {
    kids: [
      { t: 'Three deep friends', say: 'Three of you stay far back: one on each side, one in the middle. Nobody gets behind you.', show: ['deepL', 'deepM', 'deepR', 'endzone'], hot: ['deepL', 'deepM', 'deepR'], demo: 'drop', cue: 'Three deep!' },
      { t: 'Four close friends', say: 'Four of you stay close and spread out across the field, two outside and two in the middle.', show: ['flatL', 'hookL', 'hookR', 'flatR'], hot: ['flatL', 'hookL', 'hookR', 'flatR'], demo: 'drop', cue: 'Spread out!' },
      { t: 'Run to the ball', say: 'When the ball is thrown, everybody runs to it. Then grab the flag.', show: ['flatR', 'rally'], hot: ['flatR'], demo: 'flat', cue: 'Run to the ball!' },
      { t: 'Grab the flag', say: 'Eyes on the hip, hands on the flag, pull and hold it up high!', show: ['flatR'], hot: ['flatR'], demo: 'flat', cue: 'Flag!' }
    ],
    starter: [
      { t: 'Cover 3', say: 'Three deep: two corners each take an outside third, the free safety takes the middle third. Four underneath: two curl-flat, two hook-curl.', show: ['deepL', 'deepM', 'deepR', 'flatL', 'hookL', 'hookR', 'flatR'], hot: ['deepL', 'deepM', 'deepR'], demo: 'drop', cue: 'Cover 3!' },
      { t: 'Deep thirds', say: 'Corners: stay deeper than anyone in your third. Free safety: read the quarterback and break on the throw.', show: ['deepL', 'deepM', 'deepR'], hot: ['deepM'], demo: 'drop', cue: 'Stay on top' },
      { t: 'Curl-flat', say: 'Outside under defenders: sink under the curl first, then drive on the flat when the ball goes there.', show: ['flatL', 'flatR'], hot: ['flatL'], demo: 'curl', cue: 'Curl, then flat' },
      { t: 'Hook-curl', say: 'Inside under defenders: wall off anyone crossing the middle, then settle under the curl.', show: ['hookL', 'hookR'], hot: ['hookL', 'hookR'], cue: 'Wall the crosser' },
      { t: 'No rush', say: 'Nobody rushes in 7v7, so all seven cover. The QB has about four seconds: stay in your zone until the ball comes out.', show: ['line'], hot: ['line'], cue: 'Stay in coverage' }
    ],
    varsity: [
      { t: 'Cover 3 in one picture', say: 'Three deep thirds, four under. It gives up the short throw to take away the deep one.', show: ['endzone', 'deepL', 'deepM', 'deepR', 'flatL', 'hookL', 'hookR', 'flatR', 'line'], cue: 'Three deep, four under' },
      { t: 'The seams', say: 'The weak spot is the seam, between two deep thirds. The hook defender carries a seam runner up; the free safety tops it.', show: ['seamL', 'seamR', 'hookL', 'deepM'], hot: ['seamL', 'seamR'], demo: 'seam', cue: 'Carry the seam' },
      { t: 'The flats', say: 'Four verticals and flat throws stress Cover 3. Curl-flat defenders: sink, then drive. Rally so the flat stays a short gain.', show: ['flatL', 'flatR', 'rally'], hot: ['flatR'], demo: 'flat', cue: 'Drive and rally' },
      { t: 'Red zone', say: 'Inside the ten there’s no deep third left. Corners play the end line, the four under jump the short routes.', show: ['endzone', 'goal', 'flatL', 'hookL', 'hookR', 'flatR'], hot: ['endzone'], cue: 'Squeeze it' }
    ],
    coach: [
      { t: 'The idea in one line', say: 'Cover 3: three deep, four under. Nothing behind you, rally to the short throw, carry the seams.', show: ['endzone', 'deepL', 'deepM', 'deepR', 'flatL', 'hookL', 'hookR', 'flatR'], cue: 'Three deep, four under' },
      { t: 'Teaching order', say: 'Flag pulling, the drops to landmarks, curl-flat and hook-curl, then the seams, then the red zone.', show: ['flatL', 'hookL', 'hookR', 'flatR'], hot: ['flatL'], cue: 'Landmarks first' },
      { t: 'Drill: landmark drops', say: 'All seven at their alignment. On the snap, drop to the landmark and turn to the QB. On the throw, break and pull a flag.', show: ['deepL', 'deepM', 'deepR', 'flatL', 'hookL', 'hookR', 'flatR'], demo: 'drop', cue: 'Drop, break' },
      { t: 'Drill: seam carry', say: 'A slot runs the seam; the hook defender carries him to 12 yards, then hands him to the free safety. Count throws taken away.', show: ['seamL', 'hookL', 'deepM'], hot: ['seamL'], demo: 'seam', cue: 'Carry and pass off' },
      { t: 'What to chart', say: 'Catches in the seams, catches in the flats that go over 5 yards, and any catch behind a deep defender.', show: ['seamL', 'seamR', 'flatL', 'flatR'], hot: ['seamL', 'seamR'], cue: 'Chart three things' },
      { t: 'By age', say: 'Under 9: three deep, four close, run to the ball. 9 to 12: the four under jobs. 13 and up: the seams and the red zone.', show: ['deepL', 'deepM', 'deepR', 'flatL', 'hookL', 'hookR', 'flatR'], cue: 'Grow it' }
    ]
  };
  return {
    id: 'cover3', sport: sportId, kind: 'defense',
    title: 'Cover 3', sub: 'Three deep thirds, curl-flat and hook-curl underneath',
    line: 'Three deep take away the big play, four under rally to every short throw.',
    zones: Z, demos: DEMOS, levels: L,
    quiz: { kids: ['rule'], starter: ['rule'], varsity: ['rule'], coach: ['rule'] },
    cues: ['Cover 3!', 'Stay on top', 'Curl, then flat', 'Carry the seam', 'Rally!']
  };
}
