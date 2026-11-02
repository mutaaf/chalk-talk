// Kids view words: each step of a play as one short sentence a 6-year-old can follow, built from the step's own
// actions (never the AI, so it's always what the board shows). Offense first, at most two things per step, plain
// verbs ("passes to", "stands still like a wall for", "runs to the basket"), a picture word at the end of a score.
// Pure: no DOM.

const GOAL = { basketball: 'the basket', flag5: 'the end zone', flag7: 'the end zone', soccer7: 'the goal', soccer9: 'the goal' };
const BALL = { basketball: '🏀', flag5: '🏈', flag7: '🏈', soccer7: '⚽', soccer9: '⚽' };

// one action as a few words, or null when it isn't worth saying to a little kid
function said(a, n, sport) {
  const goal = GOAL[sport.id] || 'the goal', who = n(a.who), to = a.target ? n(a.target) : '';
  switch (a.kind) {
    case 'pass': case 'distribute': return `${who} passes to ${to}`;
    case 'throw': return `${who} throws to ${to}`;
    case 'pitch': return `${who} tosses it to ${to}`;
    case 'snap': return `${who} hikes the ball to ${to}`;
    case 'handoff': return `${who} hands the ball to ${to}`;
    case 'dribble': return `${who} dribbles`;
    case 'screen': return to ? `${who} stands still like a wall for ${to}` : `${who} stands still like a wall`;
    case 'roll': return `${who} rolls to ${goal}`;
    case 'pop': return `${who} steps back for a shot`;
    case 'cut': case 'curl': return `${who} runs fast to a new spot`;
    case 'route': return `${who} runs their path`;
    case 'motion': return `${who} runs across before the play`;
    case 'run': return sport.kinds.route ? `${who} runs with the ball` : `${who} runs into open space`;
    case 'shot': return `${who} shoots! ${BALL[sport.id] || ''}`.trim();
    case 'move': case 'drift': case 'lift': case 'overlap': case 'underlap': case 'support': return `${who} moves to an open spot`;
    case 'boxout': return `${who} holds their spot for the rebound`;
    default: return null;
  }
}

export function kidLines(play, sport, nameOf) {
  const n = nameOf || (id => id.replace(/^O/, ''));
  const side = id => { const p = (play.players || []).find(q => q.id === id); return p ? p.side : id[0] === 'X' ? 'D' : 'O'; };
  return (play.beats || []).map(b => {
    const acts = (b.actions || []).filter(a => side(a.who) === 'O' && a.kind !== 'ready');
    // the ball first (it's what kids watch), then one more thing
    const ball = acts.filter(a => (sport.kinds[a.kind] || {}).type !== 'move' || a.kind === 'dribble' || (a.kind === 'run' && sport.kinds.route));
    const rest = acts.filter(a => ball.indexOf(a) < 0);
    const parts = ball.concat(rest).map(a => said(a, n, sport)).filter(Boolean);
    const uniq = parts.filter((p, i) => parts.indexOf(p) === i).slice(0, 2);
    if (!uniq.length) return 'Everybody gets ready.';
    const line = uniq.join(', and ');
    return line[0].toUpperCase() + line.slice(1) + (/[!?]\s*\S{0,3}$/u.test(line) ? '' : '.');
  });
}
