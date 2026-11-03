// Pickleball doubles patterns, drawn on the full court in feet (pickleball.js): x −10…10, y 0 their baseline,
// 22 the net, 44 our baseline; our kitchen line is y 29 (players stand a step behind it, 30.5), theirs y 15 (13.5).
// O1 A and O2 B are our team, X1 C and X2 D the other side; C starts cross-court from A. Every shot is a hit to the
// other side, one per step, from whoever has the ball (test/sim.test.mjs checks it). The patterns are the ones
// every coach teaches first (research/PICKLEBALL.md): the serve and the two-bounce rule, the return and the run
// in, the third-shot drop, drive and crash, dinking until a ball sits up, the lob and the switch, the poach, the
// Erne, and the reset from the transition zone.

const xy = (x, y) => ({ x, y });
const P = (id, at) => ({ id, at });
const team = pos => Object.keys(pos).map(id => P(id, pos[id]));
const LINE = 30.5, THEIRS = 13.5;   // where players stand at the kitchen lines
const atNet = () => team({ O1: xy(4, LINE), O2: xy(-5, LINE), X1: xy(-5, THEIRS), X2: xy(4.5, THEIRS) });

export const PICKLEBALL_PLAYS = [
  {
    key: 'serve-two-bounce', title: 'Serve and the Two-Bounce Rule', concept: 'How every point starts',
    summary: 'A serves underhand, cross-court and deep. The return has to bounce, and so does A’s next shot: that’s the two-bounce rule, so A and B stay back. A drops the third shot softly into their kitchen and both walk up to the kitchen line behind it. Then it’s a dinking game, until C pops one up and B puts it away.',
    cues: ['Serve deep', 'Stay back for the return', 'Drop it, then walk up'],
    players: team({ O1: xy(4, 45.5), O2: xy(-5, 44.5), X1: xy(-5, -1), X2: xy(5, THEIRS) }), ball: 'O1',
    beats: [
      { say: 'A serves underhand, cross-court and deep, to C. B stays back beside A.', actions: [{ kind: 'serve', who: 'O1', target: 'X1' }] },
      { say: 'C lets it bounce, returns it deep to A, and runs up to the kitchen line.', actions: [{ kind: 'return', who: 'X1', target: 'O1' }, { kind: 'advance', who: 'X1', to: xy(-5, THEIRS) }] },
      { say: 'A lets the return bounce, the second bounce, then drops it softly into the kitchen in front of D.', actions: [{ kind: 'drop', who: 'O1', target: 'X2' }, { kind: 'advance', who: 'O2', to: xy(-5, 37) }] },
      { say: 'The drop lands in the kitchen, so D has to let it bounce and dink. A and B walk up to the line together.', actions: [{ kind: 'dink', who: 'X2', target: 'O1' }, { kind: 'advance', who: 'O1', to: xy(4, LINE) }, { kind: 'advance', who: 'O2', to: xy(-5, LINE) }] },
      { say: 'All four are at the kitchen line. A dinks cross-court to C.', actions: [{ kind: 'dink', who: 'O1', target: 'X1' }] },
      { say: 'C’s dink floats up high, toward B.', actions: [{ kind: 'dink', who: 'X1', target: 'O2' }] },
      { say: 'B puts it away between C and D.', actions: [{ kind: 'putaway', who: 'O2' }] }
    ],
    reads: [{ who: 'O1', text: 'Short return: drive it instead of dropping' }, { who: 'O2', text: 'The drop is high: stay back one more shot' }]
  },
  {
    key: 'return-and-run', title: 'Return and Run In', concept: 'The receiving team gets the net first',
    summary: 'C serves to A. A lets it bounce, returns it high and deep down the middle, and runs up beside B, who started at the kitchen line. C has to let the return bounce, so they’re stuck back and must drop it. A and B wait at the line, dink, and speed up the first ball that sits up.',
    cues: ['Return deep', 'Run in', 'Wait for the high one'],
    players: team({ O1: xy(5, 45), O2: xy(-5, LINE), X1: xy(-4, -1.5), X2: xy(5, -1) }), ball: 'X1',
    beats: [
      { say: 'C serves cross-court to A.', actions: [{ kind: 'serve', who: 'X1', target: 'O1' }] },
      { say: 'A lets it bounce, returns it high and deep to C, and runs up to the kitchen line next to B.', actions: [{ kind: 'return', who: 'O1', target: 'X1' }, { kind: 'advance', who: 'O1', to: xy(4, LINE) }] },
      { say: 'C must let the return bounce, then drops it into the kitchen. C and D start to come in.', actions: [{ kind: 'drop', who: 'X1', target: 'O1' }, { kind: 'advance', who: 'X1', to: xy(-4, 8) }, { kind: 'advance', who: 'X2', to: xy(5, 8) }] },
      { say: 'A dinks it back at C’s feet just as C reaches the line.', actions: [{ kind: 'dink', who: 'O1', target: 'X1' }, { kind: 'advance', who: 'X1', to: xy(-4, THEIRS) }, { kind: 'advance', who: 'X2', to: xy(5, THEIRS) }] },
      { say: 'C digs it out, and it floats up in the middle to B.', actions: [{ kind: 'dink', who: 'X1', target: 'O2' }] },
      { say: 'The ball sat up: B speeds it up at D’s right hip.', actions: [{ kind: 'speedup', who: 'O2', target: 'X2' }] },
      { say: 'D blocks it, but it pops up to A.', actions: [{ kind: 'volley', who: 'X2', target: 'O1' }] },
      { say: 'A puts it away.', actions: [{ kind: 'putaway', who: 'O1' }] }
    ],
    reads: [{ who: 'O1', text: 'Serve was short: return deep anyway, time to get in' }, { who: 'O2', text: 'Their drop is low: dink, don’t attack' }]
  },
  {
    key: 'third-shot-drop', title: 'Third-Shot Drop', concept: 'The serving team’s way to the net',
    summary: 'The serving team starts stuck at the back while the returner gets to the kitchen line. The third shot answers that: a soft arcing shot that lands in their kitchen, so they can’t attack it. Walk up behind a good drop; if it’s short, stop and drop again.',
    cues: ['Soft and high', 'Land it in the kitchen', 'Walk up behind it'],
    players: team({ O1: xy(-4, 45.5), O2: xy(5, 44.5), X1: xy(4, -1), X2: xy(-5, THEIRS) }), ball: 'O1',
    beats: [
      { say: 'A serves from the left side, cross-court to C.', actions: [{ kind: 'serve', who: 'O1', target: 'X1' }] },
      { say: 'C returns it deep to B and runs in to join D at the line.', actions: [{ kind: 'return', who: 'X1', target: 'O2' }, { kind: 'advance', who: 'X1', to: xy(4.5, THEIRS) }] },
      { say: 'B lets it bounce and drops it softly into the kitchen, in front of D.', actions: [{ kind: 'drop', who: 'O2', target: 'X2' }, { kind: 'advance', who: 'O1', to: xy(-4, 37) }] },
      { say: 'D has to let it bounce and dinks to B. A and B take a few steps in and split-step as D hits.', actions: [{ kind: 'dink', who: 'X2', target: 'O2' }, { kind: 'advance', who: 'O2', to: xy(5, 37) }] },
      { say: 'B drops it again from the transition zone, soft into the kitchen.', actions: [{ kind: 'reset', who: 'O2', target: 'X1' }, { kind: 'advance', who: 'O1', to: xy(-4, LINE) }] },
      { say: 'C dinks back to A. A and B are both at the line now.', actions: [{ kind: 'dink', who: 'X1', target: 'O1' }, { kind: 'advance', who: 'O2', to: xy(5, LINE) }] },
      { say: 'A dinks cross-court. A neutral point: four at the line.', actions: [{ kind: 'dink', who: 'O1', target: 'X1' }] }
    ],
    reads: [{ who: 'O2', text: 'Return is short and high: drive it' }, { who: 'O1', text: 'Drop is high: stop and split-step' }]
  },
  {
    key: 'drive-and-crash', title: 'Drive and Crash', concept: 'Third-shot drive, the partner crashes in',
    summary: 'Instead of a drop, B drives the third shot hard and low at C, who is still running in. C can only block it up. A has already crashed the net behind the drive and puts away the weak reply. Some coaches call it shake and bake.',
    cues: ['Drive it low', 'Crash the net', 'Put away the pop-up'],
    players: team({ O1: xy(4, 45.5), O2: xy(-5, 44.5), X1: xy(-5, -1), X2: xy(5, THEIRS) }), ball: 'O1',
    beats: [
      { say: 'A serves cross-court, deep, to C.', actions: [{ kind: 'serve', who: 'O1', target: 'X1' }] },
      { say: 'C returns it short, down the middle to B, and runs in.', actions: [{ kind: 'return', who: 'X1', target: 'O2' }, { kind: 'advance', who: 'X1', to: xy(-5, 8) }] },
      { say: 'B lets it bounce and drives it hard and low at C’s feet. A crashes the net behind it.', actions: [{ kind: 'drive', who: 'O2', target: 'X1' }, { kind: 'crash', who: 'O1', to: xy(3, LINE) }] },
      { say: 'C, caught in the transition zone, can only block it up toward A.', actions: [{ kind: 'volley', who: 'X1', target: 'O1' }, { kind: 'advance', who: 'O2', to: xy(-5, 37) }] },
      { say: 'A puts it away between C and D.', actions: [{ kind: 'putaway', who: 'O1' }] }
    ],
    reads: [{ who: 'O2', text: 'They’re both set at the line: drop instead of drive' }, { who: 'O1', text: 'The drive goes high: stay back' }]
  },
  {
    key: 'dink-speed-up', title: 'Dink, Then Speed Up', concept: 'Patience at the kitchen line',
    summary: 'All four at the kitchen line. Dink low and cross-court, move them side to side, and wait. The first dink that floats up above the net gets sped up at a shoulder. The block pops up and the partner puts it away.',
    cues: ['Dink low, cross-court', 'Wait for the high one', 'Speed it up at the shoulder'],
    players: atNet(), ball: 'O1',
    beats: [
      { say: 'A dinks cross-court to C.', actions: [{ kind: 'dink', who: 'O1', target: 'X1' }] },
      { say: 'C dinks cross-court back to A.', actions: [{ kind: 'dink', who: 'X1', target: 'O1' }] },
      { say: 'A dinks wider, to C’s backhand, and pulls C off the court.', actions: [{ kind: 'dink', who: 'O1', target: 'X1' }, { kind: 'move', who: 'X1', to: xy(-8, 14.5) }] },
      { say: 'C reaches, and the dink floats up toward B.', actions: [{ kind: 'dink', who: 'X1', target: 'O2' }, { kind: 'slide', who: 'X2', to: xy(1.5, THEIRS) }] },
      { say: 'It’s above the net: B speeds it up at D’s right shoulder.', actions: [{ kind: 'speedup', who: 'O2', target: 'X2' }] },
      { say: 'D gets a paddle on it, but it floats to A.', actions: [{ kind: 'volley', who: 'X2', target: 'O1' }] },
      { say: 'A puts it away into the gap C left.', actions: [{ kind: 'putaway', who: 'O1' }] }
    ],
    reads: [{ who: 'O2', text: 'Ball below the net: dink it, don’t speed it up' }, { who: 'O1', text: 'C is off the court: hit to the open middle' }]
  },
  {
    key: 'lob-switch', title: 'Lob and Switch', concept: 'When they lob over you',
    summary: 'C lobs over A. A can’t get back for it, so B, coming from the other side, chases it down and A slides across: "Switch!" B resets it into the kitchen and both get back to the line, side by side again.',
    cues: ['Call "switch!"', 'Chase it on the diagonal', 'Reset, then get back up'],
    players: atNet(), ball: 'X1',
    beats: [
      { say: 'C dinks to A.', actions: [{ kind: 'dink', who: 'X1', target: 'O1' }] },
      { say: 'A dinks back to C.', actions: [{ kind: 'dink', who: 'O1', target: 'X1' }] },
      { say: 'C lobs it high over A. B calls "switch!", chases it on the diagonal, and A slides across.', actions: [{ kind: 'lob', who: 'X1', target: 'O2' }, { kind: 'switch', who: 'O2', to: xy(5, 41), via: xy(0, 37) }, { kind: 'switch', who: 'O1', to: xy(-4.5, LINE) }] },
      { say: 'B lets it bounce and resets it softly into the kitchen, in front of D.', actions: [{ kind: 'reset', who: 'O2', target: 'X2' }] },
      { say: 'D dinks to A while B runs back up to the line.', actions: [{ kind: 'dink', who: 'X2', target: 'O1' }, { kind: 'advance', who: 'O2', to: xy(4, LINE) }] },
      { say: 'A dinks cross-court. Back to even, both at the line.', actions: [{ kind: 'dink', who: 'O1', target: 'X2' }] }
    ],
    reads: [{ who: 'O1', text: 'Short lob: back up and smash it yourself' }, { who: 'O2', text: 'Great lob: lob it back, deep' }]
  },
  {
    key: 'poach', title: 'Poach', concept: 'Take your partner’s ball',
    summary: 'C keeps dinking cross-court to A. B sees the pattern, slides across the middle and takes the next one out of the air, a volley at D’s feet. A slides over to cover the side B left. D can only pop it up, and A puts it away.',
    cues: ['See the pattern', 'Cross and take it', 'Partner covers behind'],
    players: atNet(), ball: 'X1',
    beats: [
      { say: 'C dinks cross-court to A.', actions: [{ kind: 'dink', who: 'X1', target: 'O1' }] },
      { say: 'A dinks back to C.', actions: [{ kind: 'dink', who: 'O1', target: 'X1' }] },
      { say: 'C dinks cross-court again. B poaches: slides across and takes it out of the air. A slides to cover.', actions: [{ kind: 'dink', who: 'X1', target: 'O2' }, { kind: 'poach', who: 'O2', to: xy(1.5, LINE) }, { kind: 'slide', who: 'O1', to: xy(6.5, LINE) }] },
      { say: 'B volleys it down at D’s feet.', actions: [{ kind: 'volley', who: 'O2', target: 'X2' }] },
      { say: 'D digs it out, and it pops up to A.', actions: [{ kind: 'volley', who: 'X2', target: 'O1' }] },
      { say: 'A puts it away.', actions: [{ kind: 'putaway', who: 'O1' }] }
    ],
    reads: [{ who: 'O2', text: 'C sees you coming: stay home' }, { who: 'O1', text: 'Partner poaches: slide behind, cover the gap' }]
  },
  {
    key: 'erne', title: 'The Erne', concept: 'Jump around the kitchen',
    summary: 'D keeps sending soft balls down the line, near A’s sideline. A jumps around the corner of the kitchen, landing outside the court beside the net, and volleys it before it bounces. You can’t volley in the kitchen, but outside it, by the post, you can.',
    cues: ['See the line dink', 'Jump around the corner', 'Volley at their feet'],
    players: atNet(), ball: 'O2',
    beats: [
      { say: 'B dinks cross-court to D.', actions: [{ kind: 'dink', who: 'O2', target: 'X2' }] },
      { say: 'D taps it out of the air, down the line, near A’s sideline. A jumps around the kitchen corner, outside the court.', actions: [{ kind: 'volley', who: 'X2', target: 'O1' }, { kind: 'erne', who: 'O1', to: xy(11.5, 25.5), via: xy(9.5, 30) }] },
      { say: 'A volleys it out of the air, from outside the kitchen, at D’s feet.', actions: [{ kind: 'volley', who: 'O1', target: 'X2' }] },
      { say: 'D can only pop it up to B. A hops back onto the court.', actions: [{ kind: 'volley', who: 'X2', target: 'O2' }, { kind: 'advance', who: 'O1', to: xy(4, LINE) }] },
      { say: 'B puts it away.', actions: [{ kind: 'putaway', who: 'O2' }] }
    ],
    reads: [{ who: 'O1', text: 'D sees you go: stay home, dink' }, { who: 'O2', text: 'Partner ernes: slide to cover the middle' }]
  },
  {
    key: 'reset', title: 'Reset From the Transition Zone', concept: 'Stuck in the middle',
    summary: 'A and B are caught in the transition zone, the middle of the court, while C and D are at the line. D drives at A’s feet. Don’t swing: block it soft into the kitchen, a reset. Now D has to let it bounce, and A and B can walk up to the line.',
    cues: ['Paddle out front', 'Soft hands, block it', 'Then walk up'],
    players: team({ O1: xy(4, 37), O2: xy(-5, 37), X1: xy(-5, THEIRS), X2: xy(4.5, THEIRS) }), ball: 'X2',
    beats: [
      { say: 'D drives it hard at A’s feet. A and B are stuck in the transition zone.', actions: [{ kind: 'drive', who: 'X2', target: 'O1' }] },
      { say: 'A doesn’t swing: paddle out front, A blocks it soft into the kitchen in front of D.', actions: [{ kind: 'reset', who: 'O1', target: 'X2' }] },
      { say: 'D has to let it bounce and dink. A and B walk up to the line together.', actions: [{ kind: 'dink', who: 'X2', target: 'O1' }, { kind: 'advance', who: 'O1', to: xy(4, LINE) }, { kind: 'advance', who: 'O2', to: xy(-5, LINE) }] },
      { say: 'A dinks cross-court to C. Four at the line: the point starts over.', actions: [{ kind: 'dink', who: 'O1', target: 'X1' }] }
    ],
    reads: [{ who: 'O1', text: 'Drive is high: volley it deep' }, { who: 'O2', text: 'Partner resets: move up with them' }]
  }
];

export const PICKLEBALL_ALIASES = {
  'two bounce rule': 'serve-two-bounce', 'double bounce': 'serve-two-bounce', 'serve': 'serve-two-bounce', 'how to start a point': 'serve-two-bounce',
  'return': 'return-and-run', 'return of serve': 'return-and-run',
  'third shot': 'third-shot-drop', 'drop shot': 'third-shot-drop', 'the drop': 'third-shot-drop',
  'shake and bake': 'drive-and-crash', 'third shot drive': 'drive-and-crash', 'crash': 'drive-and-crash',
  'dink': 'dink-speed-up', 'dinking': 'dink-speed-up', 'speed up': 'dink-speed-up',
  'lob': 'lob-switch', 'switch': 'lob-switch',
  'poach': 'poach', 'erne': 'erne', 'ernie': 'erne', 'reset': 'reset', 'block': 'reset', 'transition zone': 'reset'
};
