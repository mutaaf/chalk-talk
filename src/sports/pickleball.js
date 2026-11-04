// Pickleball doubles, in feet. The court is 20 × 44 (USA Pickleball): x runs sideline to sideline (−10 left …
// +10 right, as our team faces the net), y runs from THEIR baseline (0) to OUR baseline (44). The net is at y 22,
// 36 in high at the posts and 34 in the middle; the non-volley zone (the kitchen) is 7 ft deep on each side, so
// the kitchen lines are y 15 (theirs) and y 29 (ours). The field runs past the lines (x ±15, y −8 … 52) because
// players serve and return from behind the baseline. research/PICKLEBALL.md has the sources.
//
// A net sport (rally: true): nobody guards anybody and the ball never goes to a teammate. Every shot is a "hit"
// (sim.js) that crosses the net to a player on the other side, and the kind says how it flies (apex, bounce) and
// how to say it (job for Trace, kid for Kids view, says and read for the IQ game). O1 A and O2 B are our team, X1 C
// and X2 D theirs; they only move when the play moves them.

import { arc, clamp } from '../engine/geom.js';
import { PICKLEBALL_PLAYS, PICKLEBALL_ALIASES } from './pickleball-plays.js';

export const COURT = { W: 20, L: 44, net: 22, nvz: 7, netH: 3, netMid: 34 / 12, post: 11 };
const K1 = COURT.net + COURT.nvz, K0 = COURT.net - COURT.nvz;   // our kitchen line (29), theirs (15)

const move = (desc, extra) => Object.assign({ type: 'move', desc }, extra);
const hit = (desc, extra) => Object.assign({ type: 'hit', desc }, extra);
const KINDS = {
  move: move('shuffles to "to" (a small adjustment)', { kid: '{w} moves over' }),
  advance: move('moves up to "to", usually the kitchen line, split-stepping as the other side hits', { job: 'Move up to the kitchen line, split-step as they hit', kid: '{w} runs up to the net line' }),
  crash: move('crashes the net behind a hard drive to pick off the weak reply', { job: 'Crash the net: the reply will be weak', kid: '{w} runs up close to the net' }),
  slide: move('slides side to side with the partner, like they are tied together with a rope', { job: 'Slide with your partner', kid: '{w} slides with a partner' }),
  retreat: move('backs up to "to" (a lob, or a ball driven deep)', { job: 'Turn and get back', kid: '{w} runs back' }),
  switch: move('partners cross sides: one chases a lob over the other, the other slides across', { curve: true, job: 'Switch sides with your partner', kid: '{w} switches sides' }),
  poach: move('crosses the middle to take a ball headed for the partner', { job: 'Poach: cross over and take it', kid: '{w} jumps across to hit it' }),
  erne: move('jumps around the corner of the kitchen, outside the post, to volley a ball near the sideline', { curve: true, job: 'Erne: jump around the kitchen corner', kid: '{w} jumps around the corner' }),
  serve: hit('"who" serves underhand, cross-court, to "target"; it must land past the kitchen in the diagonal service court', { apex: 7, bounce: true, lead: 5,
    job: 'Serve it deep, cross-court to {t}', recv: '{w} serves to you: let it bounce, then return it deep', says: '{w} serves to {t}', kid: '{w} serves the ball over to {t}' }),
  return: hit('"who" returns the serve deep and high, after it bounces, then moves up to the kitchen line', { apex: 8, bounce: true, lead: 5,
    job: 'Return it deep to {t}, then come up', recv: '{w} returns it: let it bounce, that’s the two-bounce rule', says: '{w} returns it to {t}', kid: '{w} hits it back deep to {t}' }),
  drop: hit('"who" hits a soft, arcing shot that lands in the other kitchen (the third-shot drop)', { apex: 6.5, bounce: true, read: 'Drop',
    job: 'Drop it soft into the kitchen in front of {t}', recv: '{w} drops it at your feet: let it bounce, dink it back', says: '{w} drops it in front of {t}', kid: '{w} hits a soft one into the kitchen' }),
  drive: hit('"who" drives it hard and low over the net at "target"', { apex: 4.2, bounce: false, read: 'Drive',
    job: 'Drive it hard and low at {t}', recv: '{w} drives it at you: paddle up, block it soft', says: '{w} drives it at {t}', kid: '{w} hits it hard at {t}' }),
  dink: hit('"who" dinks: a soft shot from the kitchen line that lands in the other kitchen', { apex: 4.3, bounce: true, read: 'Dink',
    job: 'Dink it soft to {t}', recv: '{w} dinks to you: let it bounce, stay low', says: '{w} dinks to {t}', kid: '{w} taps a soft one to {t}' }),
  reset: hit('"who" takes the pace off a hard ball and blocks it soft into the other kitchen', { apex: 4.5, bounce: true, read: 'Reset',
    job: 'Reset it soft into the kitchen to {t}', recv: '{w} resets it: let it bounce', says: '{w} resets it to {t}', kid: '{w} hits a soft one back to {t}' }),
  volley: hit('"who" hits it out of the air, before it bounces (never from inside the kitchen)', { apex: 4, bounce: false, read: 'Volley',
    job: 'Volley it to {t}', recv: '{w} volleys it at you: paddle up', says: '{w} volleys it to {t}', kid: '{w} hits it before it bounces' }),
  speedup: hit('"who" speeds it up: a fast shot at an opponent’s shoulder or hip from a ball that sat up', { apex: 3.8, bounce: false, read: 'Speed up',
    job: 'Speed it up at {t}’s shoulder', recv: '{w} speeds it up at you: paddle up, counter', says: '{w} speeds it up at {t}', kid: '{w} hits it fast at {t}' }),
  lob: hit('"who" lobs it high over the players at the kitchen line, deep', { apex: 17, bounce: true, lead: 3, read: 'Lob',
    job: 'Lob it over their heads, deep', recv: '{w} lobs over you: turn and chase it', says: '{w} lobs it over {t}', kid: '{w} hits it high over their heads' }),
  putaway: { type: 'shot', desc: '"who" puts it away: a smash or a hard volley the other side can’t get back', read: 'Put it away',
    job: 'Put it away, at their feet or between them', says: '{w} puts it away', kid: '{w} puts it away! 🏓' },
  ready: { type: 'ready', desc: 'stays put: paddle up, knees bent, ready' }
};

// the court, drawn: sidelines and baselines, the kitchen lines (warm), the centerlines (baseline to kitchen line
// only: the kitchen has no centerline), and the net standing up off the court on its posts
function lines() {
  const h = COURT.W / 2, L = COURT.L, n = COURT.net, Ls = [];
  Ls.push({ p: [[-h, 0, 0], [h, 0, 0], [h, L, 0], [-h, L, 0], [-h, 0, 0]], w: 1 });
  for (const y of [K0, K1]) Ls.push({ p: [[-h, y, 0], [h, y, 0]], w: 1.2, warm: true });
  Ls.push({ p: [[0, 0, 0], [0, K0, 0]], w: 0.8 }); Ls.push({ p: [[0, K1, 0], [0, L, 0]], w: 0.8 });
  Ls.push({ p: [[-COURT.post, n, 0], [COURT.post, n, 0]], w: 0.5 });   // the net's foot
  Ls.push({ p: [[-COURT.post, n, 0], [-COURT.post, n, COURT.netH], [0, n, COURT.netMid], [COURT.post, n, COURT.netH], [COURT.post, n, 0]], w: 2.2, hot: true });
  for (let x = -COURT.post + 1.5; x < COURT.post; x += 1.5) Ls.push({ p: [[x, n, 0.15], [x, n, COURT.netMid - 0.1]], w: 0.25, warm: true });   // the mesh
  Ls.push({ p: arc(0, L + 1, 0.3, 0, 2 * Math.PI, 8), w: 0.6 });   // a hint of where the server stands
  return Ls;
}

const SPOTS = {
  'kitchen line': [0, K1 + 1.5], 'right kitchen': [4, K1 + 1.5], 'left kitchen': [-5, K1 + 1.5], 'right kitchen line': [4, K1 + 1.5], 'left kitchen line': [-5, K1 + 1.5],
  'kitchen': [0, 26], 'non-volley zone': [0, 26], 'nvz': [0, 26], 'middle': [0, K1 + 1.5],
  'baseline': [0, 45], 'right baseline': [5, 45], 'left baseline': [-5, 45], 'serve': [4, 45.5], 'server': [4, 45.5],
  'right service court': [5, 37], 'left service court': [-5, 37], 'transition zone': [0, 37], "no man's land": [0, 37], 'mid court': [0, 37],
  'right sideline': [9.5, 33], 'left sideline': [-9.5, 33], 'erne': [11.5, 25.5], 'right erne': [11.5, 25.5], 'left erne': [-11.5, 25.5],
  // their side: their right is our left (they face us)
  'their kitchen line': [0, K0 - 1.5], 'their right kitchen': [-5, K0 - 1.5], 'their left kitchen': [5, K0 - 1.5], 'their kitchen': [0, 18],
  'their baseline': [0, -1], 'their right baseline': [-5, -1], 'their left baseline': [5, -1], 'their transition zone': [0, 7], 'their middle': [0, K0 - 1.5]
};

// nobody guards anybody; a player added to a blank board stands across the net from the one it matches,
// cross-court (the way a serve goes): the point reflected through the middle of the net
function guard({ o }) { return [clamp(-o[0], -12, 12), clamp(COURT.L - o[1], -3, 47)]; }

const LETTER = { O1: 'A', O2: 'B', X1: 'C', X2: 'D' };
const DOUBLES = { key: 'doubles', name: 'Doubles brain', instincts: 'Serve and return deep, then get to the kitchen line with your partner. Be patient there: dink low, reset anything hard, and only attack a ball that sits up above the net. Move as a pair, like you are tied together with a rope; the forehand in the middle takes the middle ball.' };
const OPP = { key: 'opp', name: 'Opponent brain', instincts: 'Same game from the other side: return deep and come in, drop the third shot when you serve, keep your dinks low, and punish anything that floats.' };

// the positions guide, on the full court (y 0 their baseline, 44 ours); mates are A B (ours), C D (theirs)
const POSITIONS = [
  { id: 'O1', side: 'O', num: 'A', name: 'Server', nick: 'Starts the point', home: [4, 45.5],
    cue: 'Deep, then stay back.', job: 'Serves underhand from behind the baseline, cross-court, deep into the diagonal service court, then stays back: the return has to bounce, and so does your next shot (the two-bounce rule). Your third shot is usually a soft drop into their kitchen, so you and your partner can walk up behind it.',
    sees: ['Where the returner stands: deep serve, back foot', 'The return coming: let it bounce', 'Whether the drop landed in their kitchen, so you can move up'],
    does: ['Serve deep and down the middle more than at the lines', 'Stay behind the baseline until the return bounces', 'Drop the third shot, then move up with your partner'],
    donts: ['Rush in after the serve', 'Try to win the point on the serve'],
    ages: { young: 'Hit it underhand to the box across from you. Then wait for it to come back and bounce.', mid: 'Serve deep. Let the return bounce. Hit a soft one into their kitchen and walk up.', older: 'Serve deep to the backhand, drop or drive the third by how deep the return was, and move up only behind a good drop.' },
    drill: { name: 'Serve to the cone', how: 'Put a cone a step inside the baseline of each service court. Ten serves each side; points for every serve past the cone.' },
    paths: [{ kind: 'pass', pts: [[4, 45.5], [-5, -1]] }, { kind: 'move', pts: [[4, 45.5], [4, 44.5]] }],
    mates: { O2: [-5, 44.5], X1: [-5, -1], X2: [5, 13.5] } },
  { id: 'O2', side: 'O', num: 'B', name: 'Server’s partner', nick: 'Waits, then walks up', home: [-5, 44.5],
    cue: 'Stay back. Then come up together.', job: 'Starts at the baseline beside the server (the return has to bounce), then moves up with the server behind the third-shot drop. Covers the middle with your forehand when you’re on the left.',
    sees: ['The return: whose ball is it, yours or your partner’s?', 'The drop: is it good enough to move up behind?', 'Your partner: stay side by side'],
    does: ['Start back, beside the server', 'Call "yours" or "mine" on a ball down the middle', 'Move up in step with your partner'],
    donts: ['Stand at the kitchen line while your partner serves', 'Run ahead of your partner'],
    ages: { young: 'Stand back next to your partner. When they hit a soft one, walk up together.', mid: 'Wait for the return to bounce, then move up when the drop is good.', older: 'Take the middle with the forehand, read the drop’s height, and split-step every time they hit.' },
    drill: { name: 'Walk the drop', how: 'Pairs hit third-shot drops from the baseline and take two steps in after each good one, split-stepping as the feeder hits. Reach the kitchen line in four shots.' },
    paths: [{ kind: 'move', pts: [[-5, 44.5], [-5, 37], [-5, 30.5]] }],
    mates: { O1: [4, 45.5], X1: [-5, 13.5], X2: [5, 13.5] } },
  { id: 'O1', side: 'O', num: 'A', name: 'Returner', nick: 'Deep, then in', home: [5, 45],
    cue: 'Return deep. Get in.', job: 'Stands behind the baseline, lets the serve bounce, and hits the return high and deep, then runs up to the kitchen line. A deep return buys you time to get there.',
    sees: ['The serve: let it bounce', 'Where to aim: deep, down the middle, to the backhand', 'Your path to the kitchen line'],
    does: ['Stand a step behind the baseline', 'Hit it high and deep: time to get in', 'Run in and split-step as they hit'],
    donts: ['Hit a short, hard return', 'Stay back after you return'],
    ages: { young: 'Let it bounce, hit it back, then run up to the line by the net.', mid: 'Hit it high and deep, then get to the kitchen line before they hit.', older: 'Return deep to the weaker player’s backhand and be set at the line for the third shot.' },
    drill: { name: 'Return and run', how: 'A coach serves; the returner hits deep (past a rope at 30 ft) and must be at the kitchen line, set, before the coach hits again.' },
    paths: [{ kind: 'pass', pts: [[5, 45], [-4, -1]] }, { kind: 'move', pts: [[5, 45], [4.5, 37], [4, 30.5]] }],
    mates: { O2: [-5, 30.5], X1: [-4, -1.5], X2: [5, -1] } },
  { id: 'O2', side: 'O', num: 'B', name: 'Returner’s partner', nick: 'Already at the line', home: [-5, 30.5],
    cue: 'At the line. Paddle up.', job: 'Starts at the kitchen line (your side can’t be hurt by the two-bounce rule), paddle up, and holds the line for your partner coming in. Watches the third shot: a drop means dink, a drive means block.',
    sees: ['The third shot: soft or hard?', 'A ball that pops up: put it away', 'Your partner coming in beside you'],
    does: ['Stand a step behind the kitchen line', 'Paddle up, in front of your body', 'Block a drive soft, back into their kitchen'],
    donts: ['Back up when they drive', 'Step into the kitchen to volley'],
    ages: { young: 'Stand by the net line with your paddle up, like a wall.', mid: 'Hold the line, block hard balls soft, and wait for your partner.', older: 'Hold the line, take the middle with your forehand, and pick off a weak drop early.' },
    drill: { name: 'Wall at the line', how: 'Two at the kitchen line; a feeder at the baseline drives balls at them. Block every one soft into the kitchen. Ten in a row.' },
    paths: [{ kind: 'move', pts: [[-5, 30.5], [-4, 30.5]] }],
    mates: { O1: [4, 30.5], X1: [-5, 13.5], X2: [5, 13.5] } },
  { id: 'O1', side: 'O', num: 'A', name: 'At the kitchen line', nick: 'Patience wins', home: [4, 30.5],
    cue: 'Dink low. Wait for the high one.', job: 'Where points are won: both of you a step behind the kitchen line, side by side. Dink soft and low until someone pops one up, then speed it up or put it away. Reset anything hard back into their kitchen.',
    sees: ['How high the ball is: below the net, dink; above it, attack', 'The middle: the forehand takes it', 'A lob over your partner: switch'],
    does: ['Dink cross-court: the longest, safest shot', 'Keep your paddle up and your knees bent', 'Attack only the ball that sits up'],
    donts: ['Volley with a foot in the kitchen', 'Speed up a ball below the net'],
    ages: { young: 'Tap it softly into their little box by the net. If it comes high, hit it hard!', mid: 'Dink low, cross-court. Hit hard only when the ball is high.', older: 'Move them with the dinks, attack the ball above the net, and reset anything at your feet.' },
    drill: { name: 'Cross-court dinking', how: 'Two players dink cross-court only. Any ball above the net may be sped up. First to 11, then switch diagonals.' },
    paths: [{ kind: 'pass', pts: [[4, 30.5], [-5, 13.5]] }, { kind: 'move', pts: [[4, 30.5], [2, 30.5]] }],
    mates: { O2: [-5, 30.5], X1: [-5, 13.5], X2: [5, 13.5] } },
  { id: 'X1', side: 'D', num: 'C', name: 'The other side', nick: 'Same game, facing you', home: [-5, 13.5],
    cue: 'Watch the paddle.', job: 'The other team plays the same game: deep serve and return, a third-shot drop, then the kitchen line. Watch their paddle face: open and low means soft, closed and high means hard.',
    sees: ['Their paddle: what shot is coming', 'Who is out of position', 'Which of them is weaker on the backhand'],
    does: ['Hit to the player who is behind', 'Aim at feet when they come in', 'Lob when both crowd the net'],
    donts: ['Hit it to the player who is ready and set', 'Speed up from below the net'],
    ages: { young: 'Look at the other team. Hit it where nobody is!', mid: 'Hit it to their feet when they run in.', older: 'Target the player in transition and the gap in the middle, and lob a pair that crowds the net.' },
    drill: { name: 'Feet only', how: 'Play out points where a ball landing at a moving player’s feet scores double.' },
    paths: [{ kind: 'pass', pts: [[-5, 13.5], [4, 30.5]] }],
    mates: { X2: [5, 13.5], O1: [4, 30.5], O2: [-5, 30.5] } }
];

// PickleIQ: vectors are [vision, spacing, recognition, speed]
const IQ = {
  name: 'PickleIQ', short: 'IQ',
  dims: { vision: 'Shot choice', spacing: 'Court position', recognition: 'Reading the point', speed: 'Hands' },
  levels: ['2.5 Beginner', '3.0', '3.5', '4.0', '4.5', '5.0 Pro'],
  archetypes: [
    { name: 'Ben Johns', style: 'The complete player', why: 'is patient at the line, places every dink, and has the quickest hands when it speeds up', v: [0.8, 0.7, 1, 0.8] },
    { name: 'Anna Leigh Waters', style: 'The attacker', why: 'takes the ball early and speeds it up the moment it sits up', v: [0.6, 0.4, 0.6, 1] },
    { name: 'Riley Newman', style: 'The tactician', why: 'moves the ball around, poaches at the right moment and reads what’s coming', v: [0.7, 0.9, 0.8, 0.3] },
    { name: 'Catherine Parenteau', style: 'The steady one', why: 'resets everything and out-dinks you, one low ball at a time', v: [0.5, 0.6, 0.9, 0.1] },
    { name: 'Federico Staksrud', style: 'The grinder', why: 'gets to every ball and walks the drop all the way to the line', v: [0.6, 1, 0.5, 0.4] },
    { name: 'Anna Bright', style: 'The hands', why: 'wins the fast exchanges at the kitchen line', v: [0.4, 0.5, 0.6, 0.9] }
  ]
};

// coaching lenses: styles of play, described plainly (no coach named)
const COACHES = [
  { id: 'youth', name: 'Learn to play', note: 'Plain words, one idea per step', lens: 'A patient community coach teaching someone their first games: plain words, the rules as they come up (two-bounce rule, kitchen), one teaching point per step, lots of praise for good choices.' },
  { id: 'soft', name: 'Soft game', note: 'Drop, dink, reset', lens: 'A soft-game coach: third-shot drops, cross-court dinks, resets from the transition zone, patience until a ball sits up.' },
  { id: 'power', name: 'Drive and crash', note: 'Pressure first', lens: 'An aggressive coach: deep serves and returns, third-shot drives followed by a crash to the net, speed-ups at the shoulder, put away anything high.' },
  { id: 'pro', name: 'Pro doubles', note: 'Stacking, poaching, Ernes', lens: 'A high-level doubles coach: stacking to keep forehands in the middle, poaching, Ernes and ATPs, targeting the weaker player and the player in transition.' }
];

const GLOSSARY = [
  'Kitchen / non-volley zone (NVZ): The 7-ft area on each side of the net; you can’t hit a ball out of the air while standing in it or on its line (heard as: kitchen, NVZ, non volley zone, the box)',
  'Kitchen line: The line 7 ft from the net; where both teams want to stand (heard as: kitchen line, NVZ line, the line)',
  'Two-bounce rule: The serve must bounce, and the return must bounce, before anyone may volley (heard as: two bounce rule, double bounce rule)',
  'Serve: Underhand, from behind the baseline, cross-court into the diagonal service court, past the kitchen (heard as: serve, serving)',
  'Return: The receiving team’s first shot, deep, after the serve bounces (heard as: return, return of serve)',
  'Third shot drop: A soft shot from the baseline that lands in their kitchen, so the serving team can come in (heard as: third shot drop, drop shot, the drop, 3rd shot)',
  'Drive: A hard, low shot (heard as: drive, third shot drive, bang)',
  'Dink: A soft shot from the kitchen line into the other kitchen (heard as: dink, dinking)',
  'Reset: Taking the pace off a hard ball and putting it soft into the kitchen (heard as: reset, block)',
  'Speed-up: Going from soft to fast, at the shoulder or hip (heard as: speed up, speed-up, attack)',
  'Volley: Hitting the ball before it bounces (heard as: volley, punch)',
  'Lob: A high shot over the players at the kitchen line (heard as: lob, topspin lob)',
  'Erne: Jumping around the corner of the kitchen to volley near the sideline (heard as: erne, ernie)',
  'ATP (around the post): A shot hit around the net post rather than over the net (heard as: ATP, around the post)',
  'Poach: Crossing over to take a ball headed for your partner (heard as: poach, poaching)',
  'Stacking: Lining up so each player stays on their better side (heard as: stack, stacking)',
  'Transition zone: The middle of the court between the baseline and the kitchen line; move through it, don’t live in it (heard as: transition zone, no man’s land, mid court)',
  'Split step: A small hop to land balanced as the other side hits (heard as: split step, split)',
  'Side out: The serve passes to the other team (heard as: side out)',
  'Score call: Server’s score, receiver’s score, server number (1 or 2), e.g. 0-0-2 to start (heard as: zero zero two, score)'
].join('\n');

export const pickleball = {
  id: 'pickleball', name: 'Pickleball', short: 'Pickleball', unit: 'ft', rally: true,
  roster: { perSide: 2, label: 'Doubles' }, startBall: 'O1',
  field: { x: [-15, 15], y: [-8, 52], goal: [0, 9, 0.3], goalD: [0, 35, 0.3], lines },
  view: { scale: 0.8 / 24.5, center: 24.5, tilt: 0.92, lift: -0.02 },
  net: { y: 22, clear: 3.6 },   // every hit clears the net (36 in) by a few inches
  mark: 1.4, screenGap: 2, open: 4, react: 0.3, situations: false, court: COURT,
  ball: { r: 0.35, held: 3, bounce: false, offset: [0.9, -0.5], maxArc: 17, stretch: 1 },
  spots: SPOTS, kinds: KINDS, guard, los: null,
  notation: { shape: p => (p.side === 'O' ? 'circle' : 'x'), inside: p => LETTER[p.id] || p.id.slice(1), name: p => LETTER[p.id] || p.id },
  sides: { O: 'Your team', D: 'Other side' },
  trace: { place: 'court', face: 'the net' },
  brains: p => (p.side === 'O' ? DOUBLES : OPP),
  positions: POSITIONS, iq: IQ, coaches: COACHES, glossary: GLOSSARY,
  plays: PICKLEBALL_PLAYS, aliases: PICKLEBALL_ALIASES,
  starter: ['right baseline', 'left baseline'],
  // first time here: three ways in for someone who has never played (ui.js welcome)
  welcome: { title: 'New to pickleball?', line: 'Doubles on a 20 × 44 ft court: serve underhand, let two bounces happen, stay out of the kitchen when you volley, and win at the kitchen line. Pick a way in.',
    steps: [
      { k: '2 minutes', t: 'The five rules', s: 'Serve, two bounces, the kitchen, the score, faults', go: 'lesson', id: 'rules', level: 'starter' },
      { k: 'Watch', t: 'A whole point', s: 'Serve to put-away, step by step', go: 'play', key: 'serve-two-bounce' },
      { k: 'Be the player', t: 'Walk your path in light', s: 'Trace: first person, or life size on AR glasses', go: 'trace', who: 'O1' },
      { k: 'Play', t: 'PickleIQ', s: 'Pick the shot before it happens', go: 'iq' }
    ] },
  ai: {
    field: `A pickleball court (doubles), in feet: x runs sideline to sideline, −10 (left) to +10 (right), as our team faces the net. y runs from THEIR baseline (y 0) to OUR baseline (y 44); the net is at y 22. The kitchen (non-volley zone) is 7 ft deep on each side: our kitchen line is y 29, theirs y 15. Centerlines run x 0 from each baseline to the kitchen line. Players may stand behind the baselines (y to −3 and 47) and outside the sidelines. Their right side is our left (they face us).`,
    rules: 'Pickleball doubles (USA Pickleball rules): the serve is underhand, from behind the baseline, cross-court into the diagonal service court, past the kitchen. Two-bounce rule: the serve must bounce and the return must bounce before anyone volleys, so the serving team stays back for the return and the returner\'s partner may start at the kitchen line. No volleys from inside the kitchen or on its line. Every shot is a hit kind (serve, return, drop, drive, dink, reset, volley, speedup, lob) from the player who has the ball to a player on the OTHER side ("target" must be the other team); "putaway" ends the point (only our team, O1/O2, puts it away). Hits alternate sides, one per beat. Usual pattern: serve, deep return and the returner runs to the kitchen line, third-shot drop and the serving team moves up, dinks, then a speed-up or put-away of a ball that sits up. Moves: advance (up to the kitchen line), crash, slide, retreat, switch, poach, erne, move. Nobody guards anybody: move the other side (X1, X2) with their own actions.',
    roles: 'Server, Partner, Returner',
    notation: 'O1 is player A and O2 player B (our team, near side, y 22–47); X1 is C and X2 is D (the other side, y −3–22). C stands cross-court from A. When the coach says "A", "B", "C" or "D", use O1, O2, X1, X2. To start a point, the server stands behind their baseline on the right side when their score is even (ours: x 4, y 45.5; theirs: x −4, y −1.5).'
  }
};
