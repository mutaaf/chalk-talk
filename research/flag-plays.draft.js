// DRAFT flag football concept library, second wave: modern concepts coaches name out loud.
// Same format as src/sports/flag-plays.js. O1 is the quarterback, O2 the center; the ball starts
// with O2 and every play opens with the snap. Coordinates are yards: y 10 is the goal line, the
// offense attacks toward y 0. 5v5: x −15…15, default los 30. 7v7: x −20…20, default los 35.
//
// Every player carries a `role` letter (drawn inside the mark):
//   offense  QB (O1), C (O2), X split end (left wide), Z flanker (right wide), Y / H slots, RB back
//   defense  R rusher, CB corner, S safety, LB linebacker / underneath zone, N nickel
// Plays that move the line of scrimmage (los ≠ default) use { x, y } spots, because the named
// spots in flag.js are measured from the default line.
//
// A defender with no move in a beat guards the O with his number (X3 ↔ O3). So in the coverage
// plays (1-3-1, Cover 2, Cover 3) the zone players act in every beat until the ball is thrown,
// which takes 6–10 actions in those beats; offensive plays keep to ≤5 actions per beat.
// Validate: see the command in research/FLAG.md (section "Validating the draft").

const xy = (x, y) => ({ x, y });
const P = (id, at, role) => ({ id, at, role });

// ---------------------------------------------------------------------------------------- 5v5
const QB5 = P('O1', 'qb', 'QB'), C5 = P('O2', 'center', 'C'), X5 = P('O3', 'left wide', 'X'), Z5 = P('O4', 'right wide', 'Z');

export const FLAG5_DRAFT = [
  {
    key: 'mesh', title: 'Mesh', concept: 'Crossing routes (man beater)',
    summary: 'Two receivers run shallow crosses ("drags") at about 5 yards, one just under the other, so they pass close by each other in the middle. Against man coverage, a defender chasing a crosser has to fight through traffic. Legal in NFL FLAG as long as nobody runs into a defender on purpose (that would be a pick).',
    cues: ['Cross at 5', 'Left guy goes under', 'Catch and run away from him'],
    players: [QB5, C5, X5, Z5, P('O5', 'right slot', 'H'),
      P('X1', 'rusher', 'R'), P('X2', xy(0, 25), 'LB'), P('X3', 'left corner', 'CB'), P('X4', 'right corner', 'CB'), P('X5', xy(6, 25), 'LB')],
    ball: 'O2', los: 30,
    beats: [
      { say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O3 and O4 run shallow crosses, O3 underneath. O5 runs a corner, O2 sits in the middle. X1 rushes.', actions: [
        { kind: 'route', who: 'O3', path: [xy(-12, 27)], to: xy(9, 27) }, { kind: 'route', who: 'O4', path: [xy(12, 26)], to: xy(-9, 25) },
        { kind: 'route', who: 'O5', path: [xy(6, 22)], to: xy(13, 15) }, { kind: 'route', who: 'O2', to: xy(0, 24) }, { kind: 'rush', who: 'X1' }] },
      { say: 'X3 gets stuck trailing behind the cross. O1 throws to O3, running away from him.', actions: [
        { kind: 'cover', who: 'X3', to: xy(3, 28) }, { kind: 'throw', who: 'O1', target: 'O3' }] },
      { say: 'O3 turns upfield and runs to the end zone.', actions: [{ kind: 'run', who: 'O3', to: xy(11, 8) }, { kind: 'pull', who: 'X5' }] }
    ],
    reads: [{ who: 'O3', text: 'Man coverage: hit the crosser running away from his defender' },
      { who: 'O4', text: 'Other crosser, going the other way' }, { who: 'O2', text: 'Zone: center sits in the hole' },
      { who: 'O5', text: 'Safety jumps the crossers: corner route' }]
  },
  {
    key: 'flood', title: 'Flood', concept: 'Three-level stretch',
    summary: 'Three receivers go to the same side at three depths: one deep (go), one in the middle (a deep out), one short (the flat). That is more receivers than that side has defenders, so somebody is open. The QB reads high to low: deep, then the out, then the flat.',
    cues: ['Three to one side', 'Deep, middle, short', 'Read high to low'],
    players: [QB5, C5, X5, Z5, P('O5', 'right slot', 'H'),
      P('X1', 'rusher', 'R'), P('X2', xy(0, 25), 'LB'), P('X4', 'right corner', 'CB'), P('X5', xy(6, 25), 'LB')],
    ball: 'O2', los: 30,
    beats: [
      { say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O4 runs deep, O5 runs a deep out, O2 releases to the flat, O3 runs a dig on the back side.', actions: [
        { kind: 'route', who: 'O4', path: [xy(12, 24)], to: xy(12, 12) }, { kind: 'route', who: 'O5', path: [xy(6, 23)], to: xy(13, 23) },
        { kind: 'route', who: 'O2', path: [xy(3, 29)], to: xy(11, 28) }, { kind: 'route', who: 'O3', path: [xy(-12, 22)], to: xy(-3, 22) },
        { kind: 'rush', who: 'X1' }] },
      { say: 'X4 runs deep with O4 and X5 jumps the flat. The middle is open: O1 throws the out to O5.', actions: [
        { kind: 'cover', who: 'X4', to: xy(12, 15) }, { kind: 'cover', who: 'X5', to: xy(10, 27) }, { kind: 'throw', who: 'O1', target: 'O5' }] },
      { say: 'O5 turns up the sideline.', actions: [{ kind: 'run', who: 'O5', to: xy(13, 12) }, { kind: 'pull', who: 'X4' }] }
    ],
    reads: [{ who: 'O4', text: 'Corner sits short: throw the go' }, { who: 'O5', text: 'Corner runs deep, flat guy jumps low: deep out' },
      { who: 'O2', text: 'Flat defender drops: hit the center in the flat' }]
  },
  {
    key: 'curl-flat', title: 'Curl–Flat', concept: 'High–low read',
    summary: 'The outside receiver runs 7 yards and curls back to face the QB (the curl); the inside receiver runs to the sideline low (the flat). One defender cannot cover both: if he takes the flat, throw the curl; if he sinks under the curl, throw the flat.',
    cues: ['Curl at 7, come back to the ball', 'Flat: get wide fast', 'Read the flat defender'],
    players: [QB5, C5, X5, Z5, P('O5', 'left slot', 'H'),
      P('X1', 'rusher', 'R'), P('X2', xy(0, 25), 'LB'), P('X3', 'left corner', 'CB'), P('X5', xy(-6, 25), 'LB')],
    ball: 'O2', los: 30,
    beats: [
      { say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O3 curls at 7 yards, O5 runs to the flat, O4 runs deep, O2 sits in the middle.', actions: [
        { kind: 'route', who: 'O3', path: [xy(-12, 23)], to: xy(-10.5, 24.5) }, { kind: 'route', who: 'O5', path: [xy(-6, 28.5)], to: xy(-13, 28) },
        { kind: 'route', who: 'O4', to: xy(12, 13) }, { kind: 'route', who: 'O2', to: xy(0, 24) }, { kind: 'rush', who: 'X1' }] },
      { say: 'X5 follows O5 to the flat and X3 backs off deep. O1 throws the curl to O3.', actions: [
        { kind: 'cover', who: 'X5', to: xy(-11, 27) }, { kind: 'cover', who: 'X3', to: xy(-12, 18) }, { kind: 'throw', who: 'O1', target: 'O3' }] },
      { say: 'O3 turns and runs.', actions: [{ kind: 'run', who: 'O3', to: xy(-5, 12) }, { kind: 'pull', who: 'X2' }] }
    ],
    reads: [{ who: 'O3', text: 'Flat defender widens: curl' }, { who: 'O5', text: 'Flat defender sinks under the curl: flat' },
      { who: 'O4', text: 'Corner squats on the curl: go' }]
  },
  {
    key: 'double-slants', title: 'Double Slants', concept: 'Quick game',
    summary: 'Both receivers on the right run slants (3 steps, then cut hard toward the middle), one inside the other. The QB throws fast, before the rusher gets there. On the left, O3 runs a quick out to the sideline as the backup.',
    cues: ['Three steps and cut', 'Ball out fast', 'Catch it in front of you'],
    players: [QB5, C5, X5, Z5, P('O5', 'right slot', 'H'),
      P('X1', 'rusher', 'R'), P('X4', 'right corner', 'CB'), P('X5', xy(5, 25), 'LB')],
    ball: 'O2', los: 30,
    beats: [
      { say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O4 and O5 both run slants, O3 runs a quick out, O2 runs straight up the middle.', actions: [
        { kind: 'route', who: 'O4', path: [xy(12, 28)], to: xy(6, 23) }, { kind: 'route', who: 'O5', path: [xy(6, 28)], to: xy(1, 24) },
        { kind: 'route', who: 'O3', path: [xy(-12, 25)], to: xy(-14.5, 25) }, { kind: 'route', who: 'O2', to: xy(0, 15) }, { kind: 'rush', who: 'X1' }] },
      { say: 'X5 jumps the inside slant, so O1 throws to O4 on the outside slant.', actions: [
        { kind: 'cover', who: 'X5', to: xy(1, 25) }, { kind: 'throw', who: 'O1', target: 'O4' }] },
      { say: 'O4 catches it on the run and keeps going.', actions: [{ kind: 'run', who: 'O4', to: xy(3, 8) }, { kind: 'pull', who: 'X4' }] }
    ],
    reads: [{ who: 'O4', text: 'Inside defender jumps O5: outside slant' }, { who: 'O5', text: 'Defender stays wide: inside slant' },
      { who: 'O3', text: 'Rusher in your face early: quick out' }]
  },
  {
    key: 'stick', title: 'Stick', concept: 'Quick high–low',
    summary: 'The slot runs 5 yards and turns to face the QB (the "stick"), the center releases to the flat, and the outside receiver runs a fade to clear room. The QB watches the flat defender: if he widens to the flat, throw the stick; if he sits on the stick, throw the flat.',
    cues: ['Stick at 5 and turn', 'Center to the flat', 'Fade clears it out'],
    players: [QB5, C5, X5, Z5, P('O5', 'right slot', 'H'),
      P('X1', 'rusher', 'R'), P('X2', xy(0, 25), 'LB'), P('X4', 'right corner', 'CB'), P('X5', xy(8, 25), 'LB')],
    ball: 'O2', los: 30,
    beats: [
      { say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O5 runs the stick, O2 goes to the flat, O4 runs a fade, O3 runs a slant on the back side.', actions: [
        { kind: 'route', who: 'O5', path: [xy(6, 25)], to: xy(5.5, 25.5) }, { kind: 'route', who: 'O2', path: [xy(2, 29.5)], to: xy(11, 29) },
        { kind: 'route', who: 'O4', to: xy(13, 14) }, { kind: 'route', who: 'O3', path: [xy(-12, 28)], to: xy(-6, 23) }, { kind: 'rush', who: 'X1' }] },
      { say: 'X5 widens with O2 to the flat. O1 throws the stick to O5.', actions: [
        { kind: 'cover', who: 'X5', to: xy(10, 27.5) }, { kind: 'throw', who: 'O1', target: 'O5' }] },
      { say: 'O5 spins upfield and runs.', actions: [{ kind: 'run', who: 'O5', to: xy(1, 9) }, { kind: 'pull', who: 'X2' }] }
    ],
    reads: [{ who: 'O5', text: 'Flat defender widens: stick' }, { who: 'O2', text: 'Flat defender sits on the stick: flat' },
      { who: 'O4', text: 'Corner jumps short: fade' }]
  },
  {
    key: 'jet-sweep', title: 'Jet Sweep', concept: 'Motion run',
    summary: 'O5 runs flat out across the formation (jet motion) and takes the handoff at full speed behind the line, then races around the edge. The QB never runs, he hands off, which is legal. Called outside the no-run zones only.',
    cues: ['Jet: full speed across', 'Hand it off behind the line', 'Get to the edge and turn up'],
    players: [P('O1', xy(0, 33), 'QB'), P('O2', xy(0, 28.6), 'C'), P('O3', xy(-12, 29), 'X'), P('O4', xy(12, 29), 'Z'), P('O5', xy(-6, 29.5), 'H'),
      P('X1', xy(0, 21), 'R'), P('X2', xy(0, 16), 'S'), P('X3', xy(-12, 23), 'CB'), P('X4', xy(12, 23), 'CB'), P('X5', xy(-5, 23), 'LB')],
    ball: 'O2', los: 28,
    beats: [
      { say: 'O5 goes in jet motion across the formation as O2 snaps to O1.', actions: [
        { kind: 'snap', who: 'O2', target: 'O1' }, { kind: 'motion', who: 'O5', to: xy(-2.5, 31) }] },
      { say: 'O1 hands the ball to O5 at full speed. O3 and O4 run deep to take their defenders away. O2 runs to the middle.', actions: [
        { kind: 'move', who: 'O5', to: xy(1, 32.5) }, { kind: 'handoff', who: 'O1', target: 'O5' },
        { kind: 'route', who: 'O3', to: xy(-12, 15) }, { kind: 'route', who: 'O4', to: xy(12, 14) }, { kind: 'route', who: 'O2', to: xy(0, 22) }] },
      { say: 'O5 races to the right edge. After a handoff everyone can rush, so X1 and X5 chase.', actions: [
        { kind: 'run', who: 'O5', to: xy(14, 25) }, { kind: 'rush', who: 'X1' }, { kind: 'pull', who: 'X5' }] },
      { say: 'O5 turns up the sideline.', actions: [{ kind: 'run', who: 'O5', to: xy(13, 13) }, { kind: 'pull', who: 'X2' }] }
    ],
    reads: [{ who: 'O5', text: 'Edge open: turn up the sideline' }, { who: 'O1', text: 'Defense jumps the motion early: fake it and throw to O3' }]
  },
  {
    key: 'reverse', title: 'Reverse', concept: 'Misdirection run',
    summary: 'The running back takes the handoff and runs left, the defense chases him, then he hands it to O3 coming back the other way (the reverse). Two handoffs, both behind the line: legal in NFL FLAG (many 7v7 leagues ban reverses). Called outside the no-run zones.',
    cues: ['Sell the sweep left', 'Hand it off behind the line', 'Reverse right, outrun them'],
    players: [P('O1', xy(0, 33), 'QB'), P('O2', xy(0, 28.6), 'C'), P('O3', xy(-12, 29), 'X'), P('O4', xy(12, 29), 'Z'), P('O5', xy(2.5, 33.5), 'RB'),
      P('X1', xy(0, 21), 'R'), P('X3', xy(-12, 23), 'CB'), P('X4', xy(12, 23), 'CB'), P('X5', xy(-4, 23), 'LB')],
    ball: 'O2', los: 28,
    beats: [
      { say: 'O2 snaps to O1. O3 starts back toward the ball.', actions: [
        { kind: 'snap', who: 'O2', target: 'O1' }, { kind: 'move', who: 'O3', to: xy(-7, 31) }] },
      { say: 'O1 hands to O5 going left. O3 keeps coming behind him. O4 and O2 run deep to clear out.', actions: [
        { kind: 'move', who: 'O5', to: xy(-1, 33.8) }, { kind: 'handoff', who: 'O1', target: 'O5' }, { kind: 'move', who: 'O3', to: xy(-4, 32.6) },
        { kind: 'route', who: 'O4', to: xy(12, 14) }, { kind: 'route', who: 'O2', to: xy(3, 21) }] },
      { say: 'The defense chases O5 to the left. O5 hands it to O3 going the other way.', actions: [
        { kind: 'run', who: 'O5', to: xy(-5, 33.2) }, { kind: 'move', who: 'O3', to: xy(-4.2, 34.2) }, { kind: 'handoff', who: 'O5', target: 'O3' },
        { kind: 'pull', who: 'X5' }, { kind: 'rush', who: 'X1' }] },
      { say: 'O3 races around the right side.', actions: [{ kind: 'run', who: 'O3', to: xy(13, 25) }, { kind: 'pull', who: 'X4' }] },
      { say: 'O3 turns up the sideline.', actions: [{ kind: 'run', who: 'O3', to: xy(12, 12) }] }
    ],
    reads: [{ who: 'O3', text: 'Defense flows left: reverse right' }, { who: 'O5', text: 'Backside defender stays home: keep it and go left' }]
  },
  {
    key: 'center-pop', title: 'Center Pop', concept: 'Center release (hot)',
    summary: 'In NFL FLAG the center can catch passes. The defender who would cover him is often the rusher, so after the snap the center pops 5 yards up the middle and turns: a quick, safe throw right behind the rusher. Both wides run deep to take their defenders away.',
    cues: ['Snap and pop', 'Turn and show your numbers', 'Ball out before the rusher'],
    players: [QB5, C5, X5, Z5, P('O5', 'right slot', 'H'),
      P('X2', 'rusher', 'R'), P('X3', 'left corner', 'CB'), P('X4', 'right corner', 'CB'), P('X5', xy(6, 25), 'LB')],
    ball: 'O2', los: 30,
    beats: [
      { say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'X2 rushes. O2 pops 5 yards up the middle and turns. O3 and O4 run deep, O5 runs an out.', actions: [
        { kind: 'rush', who: 'X2' }, { kind: 'route', who: 'O2', path: [xy(0, 25.5)], to: xy(-1, 25) },
        { kind: 'route', who: 'O3', to: xy(-12, 13) }, { kind: 'route', who: 'O4', to: xy(12, 13) }, { kind: 'route', who: 'O5', path: [xy(6, 26)], to: xy(13, 26) }] },
      { say: 'Nobody is left to cover O2. O1 throws it right over the rusher.', actions: [{ kind: 'throw', who: 'O1', target: 'O2' }] },
      { say: 'O2 turns and runs.', actions: [{ kind: 'run', who: 'O2', to: xy(-6, 12) }, { kind: 'pull', who: 'X5' }] }
    ],
    reads: [{ who: 'O2', text: 'Rusher came: center is open behind him' }, { who: 'O5', text: 'A linebacker drops on the center: out' },
      { who: 'O4', text: 'Corner sits short: go' }]
  },
  {
    key: 'goal-line-fade-slant', title: 'Goal Line Fade–Slant', concept: 'No-run zone pass',
    summary: 'Inside the 5 (the no-run zone) you have to throw. Outside receiver runs a fade to the back corner, the slot runs a slant into the end zone right under it, and the center sits in the back middle. One defender cannot take both the fade and the slant.',
    cues: ['No-run zone: we throw', 'Fade to the corner', 'Slant under it'],
    players: [P('O1', xy(0, 18), 'QB'), P('O2', xy(0, 13.6), 'C'), P('O3', xy(-12, 14), 'X'), P('O4', xy(12, 14), 'Z'), P('O5', xy(6, 14.5), 'H'),
      P('X1', xy(0, 6), 'R'), P('X3', xy(-12, 9), 'CB'), P('X4', xy(12, 9), 'CB'), P('X5', xy(5, 9), 'LB')],
    ball: 'O2', los: 13,
    beats: [
      { say: 'Ball inside the 5, so it has to be a pass. O2 snaps to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O4 runs a fade to the back corner, O5 slants into the end zone, O3 runs an out, O2 sits at the back. X1 rushes.', actions: [
        { kind: 'route', who: 'O4', path: [xy(12, 10)], to: xy(13, 2) }, { kind: 'route', who: 'O5', path: [xy(6, 11)], to: xy(0, 5) },
        { kind: 'route', who: 'O3', path: [xy(-12, 9)], to: xy(-14, 8) }, { kind: 'route', who: 'O2', to: xy(-4, 4) }, { kind: 'rush', who: 'X1' }] },
      { say: 'X5 jumps the slant. O1 lofts the fade to O4 in the corner.', actions: [
        { kind: 'cover', who: 'X5', to: xy(1, 6) }, { kind: 'throw', who: 'O1', target: 'O4' }] },
      { say: 'Touchdown.', actions: [{ kind: 'run', who: 'O4', to: xy(13, 1.5) }] }
    ],
    reads: [{ who: 'O4', text: 'Corner plays short: fade' }, { who: 'O5', text: 'Nobody inside: slant' },
      { who: 'O2', text: 'Everyone runs with a receiver: center at the back' }]
  },
  {
    key: 'sprint-out', title: 'Sprint Out', concept: 'QB rollout',
    summary: 'The QB rolls out to the right behind the line (he can move, he just cannot run past the line). That moves him away from the rusher and cuts the field in half. O3 crosses deep from the left, O5 runs to the flat, O4 clears deep, and O2 leaks out late.',
    cues: ['Roll right, stay behind the line', 'Throw on the run', 'Cross, flat, deep'],
    players: [QB5, C5, X5, Z5, P('O5', 'right slot', 'H'),
      P('X1', 'rusher', 'R'), P('X3', 'left corner', 'CB'), P('X4', 'right corner', 'CB'), P('X5', xy(6, 25), 'LB')],
    ball: 'O2', los: 30,
    beats: [
      { say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O1 rolls out to the right. O3 crosses deep, O4 runs deep, O5 runs to the flat. X1 chases the QB.', actions: [
        { kind: 'move', who: 'O1', to: xy(8, 35) }, { kind: 'route', who: 'O3', path: [xy(-12, 24)], to: xy(8, 21) },
        { kind: 'route', who: 'O4', to: xy(12, 14) }, { kind: 'route', who: 'O5', path: [xy(6, 30)], to: xy(13, 29) }, { kind: 'rush', who: 'X1' }] },
      { say: 'O2 leaks out late. X5 runs to the flat, so O1 throws to O3 on the crossing route.', actions: [
        { kind: 'route', who: 'O2', to: xy(-4, 23) }, { kind: 'cover', who: 'X5', to: xy(11, 28) }, { kind: 'throw', who: 'O1', target: 'O3' }] },
      { say: 'O3 catches it running toward the sideline and turns up.', actions: [{ kind: 'run', who: 'O3', to: xy(13, 12) }, { kind: 'pull', who: 'X4' }] }
    ],
    reads: [{ who: 'O3', text: 'Flat defender comes up: crossing route' }, { who: 'O5', text: 'Defender drops deep: flat' },
      { who: 'O2', text: 'Rusher closes fast: dump it to the center' }]
  },
  {
    key: 'man-rusher', title: 'Man + 1 Rusher', concept: 'Defense: man coverage',
    summary: 'Defense. One rusher starts 7 yards back and goes at the snap with a hand up. Everyone else covers one receiver (man-to-man) and stays hip to hip with him. When the ball is thrown, go get the flag.',
    cues: ['Rusher: hand up, go at the snap', 'Hip to hip with your man', 'Ball thrown: grab the flag'],
    players: [QB5, C5, X5, Z5, P('O5', 'right slot', 'H'),
      P('X1', 'rusher', 'R'), P('X2', xy(0, 25), 'LB'), P('X3', xy(-12, 26), 'CB'), P('X4', xy(12, 26), 'CB'), P('X5', xy(6, 26), 'CB')],
    ball: 'O2', los: 30,
    beats: [
      { say: 'X1 is the rusher, 7 yards back. Everyone else lines up on a receiver. O2 snaps.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'X1 rushes. X2, X3, X4 and X5 each run with their receiver.', actions: [
        { kind: 'rush', who: 'X1' }, { kind: 'route', who: 'O3', path: [xy(-12, 28)], to: xy(-6, 23) }, { kind: 'route', who: 'O4', to: xy(12, 14) },
        { kind: 'route', who: 'O5', path: [xy(6, 26)], to: xy(13, 26) }, { kind: 'route', who: 'O2', to: xy(0, 24) }] },
      { say: 'The rusher hurries the throw. O1 throws the out to O5 and X5 breaks on it.', actions: [
        { kind: 'throw', who: 'O1', target: 'O5' }, { kind: 'cover', who: 'X5', to: xy(12, 26.5) }] },
      { say: 'X5 pulls the flag right away. No yards after the catch.', actions: [{ kind: 'pull', who: 'X5' }] }
    ],
    reads: [{ who: 'X1', text: 'Rush to where the QB is going, hands up' }, { who: 'X5', text: 'Stay between your man and the end zone, break on the throw' },
      { who: 'X2', text: 'Center stays in: help in the middle' }]
  },
  {
    key: 'zone-1-3-1', title: '1-3-1 Zone', concept: 'Defense: zone with a rusher',
    summary: 'Defense. One rusher, three underneath defenders who each guard a third of the field low, and one safety deep. Guard grass, not a guy: cover whoever comes into your area. Two in your area? Stand between them. Ball thrown? Everyone runs to it.',
    cues: ['Guard your grass', 'Two in your zone: split them', 'Ball in the air: everybody go'],
    players: [QB5, C5, X5, Z5, P('O5', 'right slot', 'H'),
      P('X1', 'rusher', 'R'), P('X2', xy(3, 26), 'LB'), P('X3', xy(-9, 25), 'LB'), P('X4', xy(9, 25), 'LB'), P('X5', xy(0, 17), 'S')],
    ball: 'O2', los: 30,
    beats: [
      { say: '1-3-1: X1 rushes, X3, X2 and X4 drop to their zones underneath, X5 stays deep. O2 snaps.', actions: [
        { kind: 'snap', who: 'O2', target: 'O1' }, { kind: 'rush', who: 'X1' }, { kind: 'zone', who: 'X3', to: xy(-10, 23) },
        { kind: 'zone', who: 'X2', to: xy(1, 22) }, { kind: 'zone', who: 'X4', to: xy(10, 23) }, { kind: 'zone', who: 'X5', to: xy(0, 15) }] },
      { say: 'Receivers run into the zones. Each defender takes whoever comes into his area.', actions: [
        { kind: 'route', who: 'O3', to: xy(-12, 14) }, { kind: 'route', who: 'O4', path: [xy(12, 22)], to: xy(11, 23.5) },
        { kind: 'route', who: 'O5', path: [xy(6, 28)], to: xy(1, 24) }, { kind: 'route', who: 'O2', to: xy(-4, 25) }, { kind: 'rush', who: 'X1' },
        { kind: 'zone', who: 'X3', to: xy(-9, 22) }, { kind: 'zone', who: 'X2', to: xy(1, 23) }, { kind: 'zone', who: 'X4', to: xy(11, 22) },
        { kind: 'zone', who: 'X5', to: xy(-5, 15) }] },
      { say: 'O1 throws the curl to O4. X4 is already there and breaks on it. Everyone else runs to the ball.', actions: [
        { kind: 'throw', who: 'O1', target: 'O4' }, { kind: 'cover', who: 'X4', to: xy(11.5, 24.5) }] },
      { say: 'X4 pulls the flag.', actions: [{ kind: 'pull', who: 'X4' }] }
    ],
    reads: [{ who: 'X5', text: 'Deep safety: nobody gets behind you' }, { who: 'X4', text: 'Curl in your zone: sit on it and break on the throw' },
      { who: 'X2', text: 'Middle: take the slant or the center, whoever comes' }]
  }
];

export const FLAG5_DRAFT_ALIASES = {
  mesh: ['mesh', 'mesh concept', 'cross', 'crossers', 'shallow cross', 'double drag', 'drags', 'mush', 'mash', 'meshed'],
  flood: ['flood', 'flood concept', 'sail', 'three level', '3 level', 'triangle', 'flud', 'flooded'],
  'curl-flat': ['curl flat', 'curl and flat', 'curl to the flat', 'hook flat', 'hook and flat', 'girl flat', 'curl fat'],
  'double-slants': ['double slants', 'double slant', 'two slants', 'slant slant', 'dual slants', 'double slam', 'double plants'],
  stick: ['stick', 'stick concept', 'stick flat', 'stick and flat', 'sit flat', 'stik', 'stick route'],
  'jet-sweep': ['jet sweep', 'jet', 'jet motion', 'fly sweep', 'speed sweep', 'jet handoff', 'jets sweep', 'get sweep'],
  reverse: ['reverse', 'end around', 'reverse handoff', 'double handoff', 'sweep reverse', 'the verse', 'reverse play'],
  'center-pop': ['center pop', 'center release', 'center hot', 'center sit', 'center route', 'snapper route', 'center pass', 'sender pop', 'center pup'],
  'goal-line-fade-slant': ['goal line', 'goal line fade', 'fade slant', 'slant fade', 'no run zone play', 'red zone fade', 'goal line pass', 'fade and slant'],
  'sprint-out': ['sprint out', 'rollout', 'roll out', 'qb rollout', 'roll right', 'boot', 'bootleg', 'sprint right', 'roll out right'],
  'man-rusher': ['man', 'man to man', 'man coverage', 'man with a rusher', 'man and a rusher', 'cover 0', 'cover zero', 'man free', 'many rusher'],
  'zone-1-3-1': ['1 3 1', 'one three one', '131', '1-3-1 zone', 'zone', 'zone defense', 'one three one zone', 'won three won']
};

// ---------------------------------------------------------------------------------------- 7v7
// The center stays home in these (many 7v7 leagues make the snapper ineligible); defenders that
// matter to the read are shown, the rest follow their receiver.
const QB7 = P('O1', 'qb', 'QB'), C7 = P('O2', 'center', 'C'), X7 = P('O3', 'left wide', 'X'), Z7 = P('O4', 'right wide', 'Z'),
  H7 = P('O5', 'right slot', 'H'), Y7 = P('O6', 'left slot', 'Y'), RB7 = P('O7', 'running back', 'RB');
const BASE7 = [QB7, C7, X7, Z7, H7, Y7, RB7];

export const FLAG7_DRAFT = [
  {
    key: 'four-verts', title: 'Four Verticals', concept: 'Vertical stretch',
    summary: 'Four receivers run straight down the field: two outside (go routes) and two in the seams (the lanes just outside the hash marks). One deep safety cannot cover two seams, so the QB watches him and throws the seam he leaves. The running back checks down short if nothing is open.',
    cues: ['Four go deep', 'Seams stay outside the hash', 'Read the middle safety'],
    players: [...BASE7, P('X3', 'left corner', 'CB'), P('X4', 'right corner', 'CB'), P('X7', xy(0, 22), 'S')],
    ball: 'O2', los: 35,
    beats: [
      { say: 'O2 snaps the ball to O1. X7, the safety, sits in the deep middle.', actions: [
        { kind: 'snap', who: 'O2', target: 'O1' }, { kind: 'zone', who: 'X7', to: xy(0, 20) }] },
      { say: 'O3 and O4 run go routes outside, O6 and O5 run up the seams.', actions: [
        { kind: 'route', who: 'O3', to: xy(-17, 14) }, { kind: 'route', who: 'O4', to: xy(17, 14) },
        { kind: 'route', who: 'O6', path: [xy(-8, 30)], to: xy(-7, 16) }, { kind: 'route', who: 'O5', path: [xy(8, 30)], to: xy(7, 16) },
        { kind: 'zone', who: 'X7', to: xy(0, 18) }] },
      { say: 'X7 drifts toward O5. O1 throws the other seam to O6. O7 checks down underneath.', actions: [
        { kind: 'cover', who: 'X7', to: xy(5, 17) }, { kind: 'route', who: 'O7', to: xy(-3, 31) }, { kind: 'throw', who: 'O1', target: 'O6' }] },
      { say: 'O6 runs it in.', actions: [{ kind: 'run', who: 'O6', to: xy(-7, 5) }, { kind: 'pull', who: 'X7' }] }
    ],
    reads: [{ who: 'O6', text: 'Safety goes right: left seam' }, { who: 'O5', text: 'Safety goes left: right seam' },
      { who: 'O7', text: 'Everyone covered deep: check down' }]
  },
  {
    key: 'y-cross', title: 'Y-Cross', concept: 'Deep crosser',
    summary: 'The Y (left slot) runs a crossing route across the whole field at 12 to 15 yards, behind the linebackers. The outside receivers run deep to push the corners back, and the slot on the right runs to the flat to pull the linebacker down. Throw the cross as it comes open on the right side.',
    cues: ['Y crosses deep', 'Clear it out deep', 'Throw it to the open grass'],
    players: [...BASE7, P('X3', 'left corner', 'CB'), P('X4', 'right corner', 'CB'), P('X5', 'right linebacker', 'LB'), P('X6', 'left linebacker', 'LB')],
    ball: 'O2', los: 35,
    beats: [
      { say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O6 crosses the field deep, O3 runs a go, O4 runs a post, O5 runs to the flat, O7 checks left.', actions: [
        { kind: 'route', who: 'O6', path: [xy(-8, 28)], to: xy(14, 22) }, { kind: 'route', who: 'O3', to: xy(-17, 15) },
        { kind: 'route', who: 'O4', path: [xy(16, 26)], to: xy(6, 16) }, { kind: 'route', who: 'O5', path: [xy(9, 35)], to: xy(17, 33) },
        { kind: 'route', who: 'O7', to: xy(-12, 34) }] },
      { say: 'X5 jumps the flat. O1 throws the cross to O6 behind him.', actions: [
        { kind: 'cover', who: 'X5', to: xy(14, 32) }, { kind: 'throw', who: 'O1', target: 'O6' }] },
      { say: 'O6 turns up the sideline.', actions: [{ kind: 'run', who: 'O6', to: xy(17, 8) }, { kind: 'pull', who: 'X4' }] }
    ],
    reads: [{ who: 'O6', text: 'Linebacker comes up for the flat: cross' }, { who: 'O5', text: 'Linebacker drops under the cross: flat' },
      { who: 'O4', text: 'Safety jumps the cross: post' }]
  },
  {
    key: 'levels', title: 'Levels', concept: 'Two-level in-breakers',
    summary: 'Two receivers on the right run in-routes at two depths: the slot at 5 yards, the outside receiver at 12 (a dig). The middle linebacker cannot guard both: if he comes up for the short one, throw the deep one behind him; if he drops, throw the short one.',
    cues: ['Short in at 5', 'Dig at 12', 'Read the middle linebacker'],
    players: [...BASE7, P('X4', 'right corner', 'CB'), P('X5', 'right linebacker', 'LB'), P('X7', 'middle linebacker', 'LB')],
    ball: 'O2', los: 35,
    beats: [
      { say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O5 runs a 5-yard in, O4 runs a 12-yard dig, O3 runs a go, O6 runs a seam, O7 runs to the right flat.', actions: [
        { kind: 'route', who: 'O5', path: [xy(8, 30)], to: xy(-2, 30) }, { kind: 'route', who: 'O4', path: [xy(16, 23)], to: xy(3, 23) },
        { kind: 'route', who: 'O3', to: xy(-17, 15) }, { kind: 'route', who: 'O6', path: [xy(-8, 30)], to: xy(-8, 16) },
        { kind: 'route', who: 'O7', path: [xy(5, 38)], to: xy(15, 34) }] },
      { say: 'X7 comes up to take the short in. O1 throws the dig to O4 behind him.', actions: [
        { kind: 'cover', who: 'X7', to: xy(1, 30.5) }, { kind: 'throw', who: 'O1', target: 'O4' }] },
      { say: 'O4 turns upfield.', actions: [{ kind: 'run', who: 'O4', to: xy(0, 9) }, { kind: 'pull', who: 'X4' }] }
    ],
    reads: [{ who: 'O4', text: 'Linebacker comes up: dig behind him' }, { who: 'O5', text: 'Linebacker drops: short in' },
      { who: 'O7', text: 'Both covered: flat' }]
  },
  {
    key: 'dagger', title: 'Dagger', concept: 'Seam clears, dig behind',
    summary: 'The slot runs straight up the seam and takes the safety with him. Right behind that, the outside receiver runs a deep in-route (a dig) into the space the safety just left. On the other side, a curl and a flat give the QB a safe throw.',
    cues: ['Seam takes the safety', 'Dig at 15 into the hole', 'Curl–flat if it is not there'],
    players: [...BASE7, P('X4', 'right corner', 'CB'), P('X5', xy(5, 24), 'S'), P('X7', 'middle linebacker', 'LB')],
    ball: 'O2', los: 35,
    beats: [
      { say: 'O2 snaps the ball to O1. X5, the safety, waits deep.', actions: [
        { kind: 'snap', who: 'O2', target: 'O1' }, { kind: 'zone', who: 'X5', to: xy(5, 22) }] },
      { say: 'O5 runs the seam and X5 goes with him. O4 runs a 15-yard dig. O3 curls, O6 runs to the flat.', actions: [
        { kind: 'route', who: 'O5', path: [xy(8, 28)], to: xy(8, 13) }, { kind: 'zone', who: 'X5', to: xy(7, 15) },
        { kind: 'route', who: 'O4', path: [xy(16, 21)], to: xy(3, 21) }, { kind: 'route', who: 'O3', path: [xy(-16, 28)], to: xy(-15, 29.5) },
        { kind: 'route', who: 'O6', path: [xy(-8, 34)], to: xy(-17, 33) }] },
      { say: 'The hole behind the linebacker is empty. O1 throws the dig to O4.', actions: [{ kind: 'throw', who: 'O1', target: 'O4' }] },
      { say: 'O4 runs.', actions: [{ kind: 'run', who: 'O4', to: xy(-2, 9) }, { kind: 'pull', who: 'X5' }] }
    ],
    reads: [{ who: 'O5', text: 'Safety stays put: seam' }, { who: 'O4', text: 'Safety carries the seam: dig' },
      { who: 'O6', text: 'Pressure or nothing deep: curl–flat on the left' }]
  },
  {
    key: 'snag', title: 'Snag', concept: 'Triangle read',
    summary: 'Three receivers make a triangle on the right: the slot runs to the back corner, the outside receiver runs 5 yards and sits inside (the snag), and the back runs to the flat. Whichever way the defense leans, one corner of the triangle is open.',
    cues: ['Corner, snag, flat', 'Snag: sit in the window', 'Read the triangle'],
    players: [...BASE7, P('X4', 'right corner', 'CB'), P('X5', 'right linebacker', 'LB')],
    ball: 'O2', los: 35,
    beats: [
      { say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O5 runs the corner, O4 runs the snag and sits, O7 goes to the flat. O3 runs a go, O6 runs a dig.', actions: [
        { kind: 'route', who: 'O5', path: [xy(8, 28)], to: xy(17, 20) }, { kind: 'route', who: 'O4', path: [xy(16, 30)], to: xy(12, 30.5) },
        { kind: 'route', who: 'O7', path: [xy(5, 38)], to: xy(16, 34) }, { kind: 'route', who: 'O3', to: xy(-17, 15) },
        { kind: 'route', who: 'O6', path: [xy(-8, 25)], to: xy(0, 25) }] },
      { say: 'X4 bails with the corner route and X5 widens to the flat. O1 throws the snag to O4.', actions: [
        { kind: 'cover', who: 'X4', to: xy(16, 22) }, { kind: 'cover', who: 'X5', to: xy(14, 33) }, { kind: 'throw', who: 'O1', target: 'O4' }] },
      { say: 'O4 turns and runs.', actions: [{ kind: 'run', who: 'O4', to: xy(9, 12) }, { kind: 'pull', who: 'X5' }] }
    ],
    reads: [{ who: 'O5', text: 'Corner sits low: corner route' }, { who: 'O4', text: 'Corner bails and flat guy widens: snag' },
      { who: 'O7', text: 'Flat defender sinks under the snag: flat' }]
  },
  {
    key: 'spacing', title: 'Spacing', concept: 'Horizontal stretch',
    summary: 'Everybody runs about 5 yards and sits down in an open window, spread evenly across the field. The underneath defenders cannot cover all those windows, so the QB finds the one in between two defenders. Quick, safe, and easy for young QBs.',
    cues: ['Five yards and sit', 'Find the window', 'Show the QB your numbers'],
    players: [...BASE7, P('X5', 'right linebacker', 'LB'), P('X6', 'left linebacker', 'LB'), P('X7', 'middle linebacker', 'LB')],
    ball: 'O2', los: 35,
    beats: [
      { say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'Everyone goes 5 yards and sits: O3 and O4 outside, O6 and O5 inside, O7 swings to the right flat.', actions: [
        { kind: 'route', who: 'O3', path: [xy(-16, 29.5)], to: xy(-15.5, 30.5) }, { kind: 'route', who: 'O6', path: [xy(-7, 30)], to: xy(-6.5, 30.5) },
        { kind: 'route', who: 'O5', path: [xy(7, 30)], to: xy(6, 30.5) }, { kind: 'route', who: 'O4', path: [xy(16, 29.5)], to: xy(15.5, 30.5) },
        { kind: 'route', who: 'O7', path: [xy(5, 39)], to: xy(11, 34) }] },
      { say: 'X5 widens with O7. O1 throws to O5 sitting in the window.', actions: [
        { kind: 'cover', who: 'X5', to: xy(10, 32.5) }, { kind: 'zone', who: 'X7', to: xy(-1, 30) }, { kind: 'throw', who: 'O1', target: 'O5' }] },
      { say: 'O5 turns and runs.', actions: [{ kind: 'run', who: 'O5', to: xy(4, 18) }, { kind: 'pull', who: 'X7' }] }
    ],
    reads: [{ who: 'O5', text: 'Linebacker widens: middle window' }, { who: 'O7', text: 'Linebacker stays inside: flat' },
      { who: 'O6', text: 'Left side open: sit in the left window' }]
  },
  {
    key: 'sail', title: 'Sail', concept: 'Flood (three-level)',
    summary: 'Three receivers flood the right side at three depths: the outside receiver goes deep, the slot runs a deep out at 12 (the sail), and the back runs to the flat. Read high to low: if the corner stays deep, the sail is open underneath him.',
    cues: ['Three to one side', 'Sail at 12 to the sideline', 'High to low'],
    players: [...BASE7, P('X4', 'right corner', 'CB'), P('X5', 'right linebacker', 'LB')],
    ball: 'O2', los: 35,
    beats: [
      { say: 'O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O4 runs deep, O5 runs the sail route, O7 runs to the flat. O3 runs a dig and O6 runs a post on the left.', actions: [
        { kind: 'route', who: 'O4', to: xy(17, 15) }, { kind: 'route', who: 'O5', path: [xy(8, 24)], to: xy(18, 23) },
        { kind: 'route', who: 'O7', path: [xy(4, 39)], to: xy(16, 34) }, { kind: 'route', who: 'O3', path: [xy(-16, 24)], to: xy(-4, 24) },
        { kind: 'route', who: 'O6', path: [xy(-8, 26)], to: xy(-2, 16) }] },
      { say: 'X4 runs deep with O4 and X5 jumps the flat. O1 throws the sail to O5.', actions: [
        { kind: 'cover', who: 'X4', to: xy(17, 18) }, { kind: 'cover', who: 'X5', to: xy(14, 33) }, { kind: 'throw', who: 'O1', target: 'O5' }] },
      { say: 'O5 turns up the sideline.', actions: [{ kind: 'run', who: 'O5', to: xy(17, 9) }, { kind: 'pull', who: 'X4' }] }
    ],
    reads: [{ who: 'O4', text: 'Corner sits short: go' }, { who: 'O5', text: 'Corner deep, linebacker in the flat: sail' },
      { who: 'O7', text: 'Linebacker drops under the sail: flat' }]
  },
  {
    key: 'trips-choice', title: 'Trips Choice', concept: 'Option route',
    summary: 'Three receivers on the right (trips). The two outside ones run deep to clear space. The inside receiver runs 6 yards and then chooses: if the defender is inside him, he breaks out; if the defender is outside, he breaks in. QB and receiver read the same defender.',
    cues: ['Trips right', 'Six yards, then break away from him', 'QB: throw it where he breaks'],
    players: [QB7, C7, X7, P('O4', xy(16, 36), 'Z'), P('O5', xy(11, 36.5), 'H'), P('O6', xy(6, 36.5), 'Y'), RB7,
      P('X4', xy(16, 30), 'CB'), P('X5', xy(11, 30), 'N'), P('X6', xy(4, 30), 'LB')],
    ball: 'O2', los: 35,
    beats: [
      { say: 'Trips right. O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O4 and O5 run deep. O6 runs 6 yards, sees X6 inside him, and breaks out. O3 runs a dig, O7 checks left.', actions: [
        { kind: 'route', who: 'O4', to: xy(17, 15) }, { kind: 'route', who: 'O5', path: [xy(11, 28)], to: xy(10, 15) },
        { kind: 'route', who: 'O6', path: [xy(6, 29)], to: xy(13, 29) }, { kind: 'route', who: 'O3', path: [xy(-16, 24)], to: xy(-4, 24) },
        { kind: 'route', who: 'O7', to: xy(-10, 34) }] },
      { say: 'X6 is stuck inside. O1 throws to O6 breaking out.', actions: [
        { kind: 'cover', who: 'X6', to: xy(8, 30) }, { kind: 'throw', who: 'O1', target: 'O6' }] },
      { say: 'O6 turns upfield.', actions: [{ kind: 'run', who: 'O6', to: xy(13, 18) }, { kind: 'pull', who: 'X6' }] }
    ],
    reads: [{ who: 'O6', text: 'Defender inside: break out. Outside: break in. Deep: sit' },
      { who: 'O5', text: 'Middle of the field open: seam' }, { who: 'O3', text: 'Backside one-on-one: dig' }]
  },
  {
    key: 'bunch', title: 'Bunch Corner–Flat–Whip', concept: 'Bunch release',
    summary: 'Three receivers line up close together in a triangle (a bunch). The front one runs a corner, the outside one runs to the flat, the inside one cuts in and then whips back out. The tight start makes it hard to play man. Release clean: no running into defenders on purpose (no picks).',
    cues: ['Bunch right, tight', 'Corner, flat, whip', 'Release clean, no picks'],
    players: [QB7, C7, X7, P('O4', xy(10, 36), 'Z'), P('O5', xy(13, 37.5), 'H'), P('O6', xy(7.5, 37.5), 'Y'), RB7,
      P('X4', xy(12, 30), 'CB'), P('X5', xy(15, 31), 'N'), P('X6', xy(6, 30), 'LB')],
    ball: 'O2', los: 35,
    beats: [
      { say: 'Bunch right. O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O4 runs the corner, O5 runs to the flat, O6 cuts in then whips back out. O3 runs a dig, O7 sits in the middle.', actions: [
        { kind: 'route', who: 'O4', path: [xy(10, 29)], to: xy(17, 21) }, { kind: 'route', who: 'O5', path: [xy(14, 35)], to: xy(18, 33.5) },
        { kind: 'route', who: 'O6', path: [xy(8, 31), xy(5, 30.5)], to: xy(9, 31) }, { kind: 'route', who: 'O3', path: [xy(-16, 24)], to: xy(-4, 24) },
        { kind: 'route', who: 'O7', to: xy(-3, 32) }] },
      { say: 'X6 bites on the in-cut. O1 throws the whip to O6 going back out.', actions: [
        { kind: 'cover', who: 'X6', to: xy(4, 31) }, { kind: 'throw', who: 'O1', target: 'O6' }] },
      { say: 'O6 turns upfield.', actions: [{ kind: 'run', who: 'O6', to: xy(11, 18) }, { kind: 'pull', who: 'X4' }] }
    ],
    reads: [{ who: 'O6', text: 'Defender bites inside: whip back out' }, { who: 'O4', text: 'Corner jumps the flat: corner route' },
      { who: 'O5', text: 'Defenders stay deep: flat' }]
  },
  {
    key: 'back-shoulder-fade', title: 'Red Zone Back-Shoulder Fade', concept: 'Red zone one-on-one',
    summary: 'Close to the goal line. The outside receiver runs a fade toward the back corner, his defender runs with him over the top, and the QB throws it behind the receiver\'s outside shoulder. The receiver stops, turns back, and catches it where only he can get it.',
    cues: ['Sell the fade', 'Stop and turn back', 'Ball to the back shoulder'],
    players: [P('O1', xy(0, 22), 'QB'), P('O2', xy(0, 17.6), 'C'), P('O3', xy(-16, 18), 'X'), P('O4', xy(16, 18), 'Z'),
      P('O5', xy(8, 18.5), 'H'), P('O6', xy(-8, 18.5), 'Y'), P('O7', xy(2.5, 22.5), 'RB'),
      P('X3', xy(-16, 14), 'CB'), P('X4', xy(16, 14), 'CB'), P('X5', xy(7, 13), 'LB')],
    ball: 'O2', los: 17,
    beats: [
      { say: 'Seven yards to go. O2 snaps the ball to O1.', actions: [{ kind: 'snap', who: 'O2', target: 'O1' }] },
      { say: 'O4 runs a fade toward the back corner. O3 fades on the left, O5 slants, O6 runs an out, O7 sits.', actions: [
        { kind: 'route', who: 'O4', to: xy(17, 8) }, { kind: 'route', who: 'O3', to: xy(-17, 3) },
        { kind: 'route', who: 'O5', path: [xy(8, 15)], to: xy(2, 9) }, { kind: 'route', who: 'O6', path: [xy(-8, 12)], to: xy(-14, 12) },
        { kind: 'route', who: 'O7', to: xy(-4, 15) }] },
      { say: 'X4 runs over the top. O4 stops and turns back. O1 throws to his back shoulder.', actions: [
        { kind: 'cover', who: 'X4', to: xy(17.5, 5) }, { kind: 'route', who: 'O4', to: xy(16, 9.5) }, { kind: 'throw', who: 'O1', target: 'O4' }] },
      { say: 'Caught in the end zone. Touchdown.', actions: [{ kind: 'run', who: 'O4', to: xy(15, 7) }] }
    ],
    reads: [{ who: 'O4', text: 'Defender over the top: back shoulder' }, { who: 'O3', text: 'Defender trailing: fade to the corner' },
      { who: 'O5', text: 'Inside open: slant' }]
  },
  {
    key: 'cover-2', title: 'Cover 2', concept: 'Defense: two-deep zone',
    summary: 'Defense. Two safeties split the deep field in halves. The two corners jam and sit in the flats (short and wide). Three linebackers drop to the short middle. Nobody gets behind the safeties, and quick throws to the outside get caught by the corners.',
    cues: ['Safeties: deep halves', 'Corners: squat the flat', 'Ball thrown: everybody go'],
    players: [...BASE7, P('X1', xy(-9, 22), 'S'), P('X2', xy(9, 22), 'S'), P('X3', xy(-16, 32), 'CB'), P('X4', xy(16, 32), 'CB'),
      P('X5', xy(7, 30), 'LB'), P('X6', xy(-7, 30), 'LB'), P('X7', xy(0, 29), 'LB')],
    ball: 'O2', los: 35,
    beats: [
      { say: 'Cover 2: X1 and X2 back deep, X3 and X4 up on the outside receivers. O2 snaps.', actions: [
        { kind: 'snap', who: 'O2', target: 'O1' }, { kind: 'zone', who: 'X1', to: xy(-10, 20) }, { kind: 'zone', who: 'X2', to: xy(10, 20) },
        { kind: 'zone', who: 'X7', to: xy(0, 28) }] },
      { say: 'Safeties take the deep halves, X4 sinks to the flat, the linebackers drop. O3 hitches, O4 goes, O5 seams, O6 runs an out.', actions: [
        { kind: 'route', who: 'O3', path: [xy(-16, 29)], to: xy(-15.5, 30) }, { kind: 'route', who: 'O4', to: xy(17, 15) },
        { kind: 'route', who: 'O5', path: [xy(8, 28)], to: xy(8, 16) }, { kind: 'route', who: 'O6', path: [xy(-8, 30)], to: xy(-14, 30) },
        { kind: 'zone', who: 'X1', to: xy(-10, 17) }, { kind: 'zone', who: 'X2', to: xy(13, 17) }, { kind: 'zone', who: 'X4', to: xy(15, 31) },
        { kind: 'zone', who: 'X5', to: xy(6, 27) }, { kind: 'zone', who: 'X6', to: xy(-7, 28) }, { kind: 'zone', who: 'X7', to: xy(0, 26) }] },
      { say: 'O1 throws the out to O6. X6 is right there and breaks on it.', actions: [
        { kind: 'throw', who: 'O1', target: 'O6' }, { kind: 'cover', who: 'X6', to: xy(-12.5, 30) },
        { kind: 'zone', who: 'X1', to: xy(-11, 22) }, { kind: 'zone', who: 'X2', to: xy(10, 18) }, { kind: 'zone', who: 'X7', to: xy(-4, 28) }] },
      { say: 'X6 pulls the flag. Everyone rallies to the ball.', actions: [
        { kind: 'pull', who: 'X6' }, { kind: 'pull', who: 'X1' }, { kind: 'zone', who: 'X2', to: xy(4, 22) }, { kind: 'pull', who: 'X7' }] }
    ],
    reads: [{ who: 'X1', text: 'Deep half: nobody behind you' }, { who: 'X4', text: 'Squat the flat, carry a go until the safety takes it' },
      { who: 'X6', text: 'Hook to curl: break on anything short' }]
  },
  {
    key: 'cover-3', title: 'Cover 3', concept: 'Defense: three-deep zone',
    summary: 'Defense. Three players split the deep field in thirds: two corners on the outside, one safety in the middle. Four underneath defenders cover the short areas. Great against deep throws; the short curls and flats are the soft spots, so the underneath players sink and break fast.',
    cues: ['Three deep, four under', 'Deep thirds: nobody behind you', 'Under: sink under the curl'],
    players: [...BASE7, P('X1', xy(0, 22), 'S'), P('X2', xy(-3, 30), 'LB'), P('X3', xy(-16, 30), 'CB'), P('X4', xy(16, 30), 'CB'),
      P('X5', xy(9, 30), 'LB'), P('X6', xy(-9, 30), 'LB'), P('X7', xy(3, 30), 'LB')],
    ball: 'O2', los: 35,
    beats: [
      { say: 'Cover 3: X3 and X4 bail to the deep thirds, X1 takes the deep middle. O2 snaps.', actions: [
        { kind: 'snap', who: 'O2', target: 'O1' }, { kind: 'zone', who: 'X1', to: xy(0, 20) }, { kind: 'zone', who: 'X2', to: xy(-3, 28) },
        { kind: 'zone', who: 'X3', to: xy(-16, 22) }, { kind: 'zone', who: 'X4', to: xy(16, 22) }, { kind: 'zone', who: 'X7', to: xy(3, 28) }] },
      { say: 'O3 runs a go, O4 curls, O5 runs a seam, O6 runs to the flat. The four underneath players drop to their spots.', actions: [
        { kind: 'route', who: 'O3', to: xy(-17, 14) }, { kind: 'route', who: 'O4', path: [xy(16, 25)], to: xy(15, 26.5) },
        { kind: 'route', who: 'O5', path: [xy(8, 28)], to: xy(8, 15) }, { kind: 'route', who: 'O6', path: [xy(-8, 35)], to: xy(-17, 33) },
        { kind: 'zone', who: 'X1', to: xy(3, 16) }, { kind: 'zone', who: 'X4', to: xy(16, 17) }, { kind: 'zone', who: 'X5', to: xy(12, 27) },
        { kind: 'zone', who: 'X6', to: xy(-14, 31) }, { kind: 'zone', who: 'X2', to: xy(-3, 27) }, { kind: 'zone', who: 'X7', to: xy(4, 27) }] },
      { say: 'O1 throws the curl to O4. X5 sank under it and breaks on the ball.', actions: [
        { kind: 'throw', who: 'O1', target: 'O4' }, { kind: 'cover', who: 'X5', to: xy(14, 27) },
        { kind: 'zone', who: 'X1', to: xy(6, 18) }, { kind: 'zone', who: 'X2', to: xy(0, 28) }, { kind: 'zone', who: 'X7', to: xy(7, 27) }] },
      { say: 'X5 pulls the flag. Everyone rallies.', actions: [
        { kind: 'pull', who: 'X5' }, { kind: 'pull', who: 'X1' }, { kind: 'pull', who: 'X7' }, { kind: 'zone', who: 'X2', to: xy(4, 27) }] }
    ],
    reads: [{ who: 'X1', text: 'Deep middle: stay deeper than the deepest receiver' }, { who: 'X5', text: 'Curl to flat: sink under the curl, break on the throw' },
      { who: 'X4', text: 'Deep third: nobody behind you' }]
  }
];

export const FLAG7_DRAFT_ALIASES = {
  'four-verts': ['four verts', '4 verts', 'four verticals', '4 verticals', 'all go', 'verts', 'four vertical', 'for verts', 'four birds', 'all verticals'],
  'y-cross': ['y cross', 'why cross', 'wye cross', 'y-cross', 'deep cross', 'cross', 'y over', 'white cross'],
  levels: ['levels', 'level', 'levels concept', 'in in', 'double in', 'dig in', 'levels read', 'leavels'],
  dagger: ['dagger', 'dagger concept', 'seam dig', 'dig seam', 'dagger read', 'dager', 'daggers'],
  snag: ['snag', 'snag concept', 'spot', 'spot concept', 'triangle', 'corner snag flat', 'snack', 'snagg', 'stag'],
  spacing: ['spacing', 'spacing concept', 'space', 'all sit', 'five hitches', 'sit everybody', 'spacing out'],
  sail: ['sail', 'sail concept', 'flood', 'flood right', 'three level', 'boot sail', 'sale', 'sell concept'],
  'trips-choice': ['trips choice', 'trips option', 'choice route', 'option route', 'trips right', 'trips', 'trip choice', 'strips choice'],
  bunch: ['bunch', 'bunch right', 'bunch formation', 'corner flat whip', 'bunch whip', 'cluster', 'bunched', 'brunch'],
  'back-shoulder-fade': ['back shoulder', 'back shoulder fade', 'red zone fade', 'fade', 'fade stop', 'red zone', 'back shoulder throw', 'back shoulder phase'],
  'cover-2': ['cover 2', 'cover two', 'two deep', 'tampa 2', 'cover to', 'cover too', 'two high', 'cover 2 zone'],
  'cover-3': ['cover 3', 'cover three', 'three deep', 'sky', 'cover free', 'cover tree', 'one high', 'cover 3 zone']
};
