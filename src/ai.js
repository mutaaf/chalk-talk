// The coach talks, the AI draws: a spoken play → a play as JSON (X's and O's).
// Bring your own key, Claude or OpenAI (we can tell which). It stays in this browser and
// goes only to that provider; nothing passes through us. The answer is checked by
// normalize(), and if it doesn't hold together the problems go back for one repair.

import { normalize, rosterIds } from './engine/sim.js';

const KEY = 'chalktalk.key';
export function keyKind(k) { k = (k || '').trim().replace(/^bearer\s+/i, ''); return /^sk-ant-/.test(k) ? 'claude' : /^sk-[A-Za-z0-9_-]{10,}/.test(k) ? 'openai' : ''; }
export const NAMES = { claude: 'Claude', openai: 'OpenAI' };
export const key = {
  get() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } },
  set(v) { v = (v || '').trim().replace(/^bearer\s+/i, ''); try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} },
  kind() { return keyKind(key.get()); }
};

const XY = { type: 'object', additionalProperties: false, required: ['x', 'y'], properties: { x: { type: 'number' }, y: { type: 'number' } } };
const NULLXY = { anyOf: [XY, { type: 'null' }] };

// the answer's shape, built from the sport: its roster, its actions, its library
export function schemaFor(sport, libraryKeys) {
  const ID = { type: 'string', enum: rosterIds(sport) };
  const s = {
    type: 'object', additionalProperties: false,
    required: ['reply', 'title', 'concept', 'summary', 'players', 'ball', 'beats', 'reads', 'cues', 'recognized', 'suggestions'],
    properties: {
      reply: { type: 'string', description: 'One short sentence spoken back to the coach, like a broadcaster confirming what it drew.' },
      title: { type: 'string' }, concept: { type: 'string' },
      summary: { type: 'string', description: 'How you would explain this play to 8–12 year olds, in one or two sentences.' },
      players: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'side', 'at', 'role'], properties: {
        id: ID, side: { type: 'string', enum: ['O', 'D'] }, at: XY,
        role: { type: 'string', description: 'A short role tag the coach used or implied (' + sport.ai.roles + '), or "" for none. Never a real name.' } } } },
      ball: ID,
      beats: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['say', 'actions'], properties: {
        say: { type: 'string', description: 'What happens in this beat, in plain coach words, naming players as O1, X2 and so on.' },
        actions: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['kind', 'who', 'to', 'via', 'path', 'target'], properties: {
          kind: { type: 'string', enum: Object.keys(sport.kinds) }, who: ID, to: NULLXY, via: NULLXY,
          path: { type: 'array', items: XY, description: 'Waypoints before "to", in order (route breaks). Usually empty.' },
          target: { anyOf: [ID, { type: 'null' }] } } } } } } },
      reads: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['who', 'text'], properties: { who: ID, text: { type: 'string' } } } },
      cues: { type: 'array', items: { type: 'string' } },
      recognized: { type: 'string', enum: (libraryKeys || []).concat(['none']), description: 'The library concept this play is (or is built on), else "none".' },
      suggestions: { type: 'array', items: { type: 'string' }, description: '0–3 short, specific coaching suggestions to make the play better, or none.' }
    }
  };
  if (sport.los != null) { s.properties.los = { type: 'number', description: 'The line of scrimmage (y).' }; s.required.push('los'); }
  return s;
}

function spotTable(sport) {
  const seen = {}, S = sport.spots;
  return Object.keys(S).filter(k => { const v = S[k].join(); if (seen[v]) return false; seen[v] = 1; return true; })
    .map(k => `- ${k}: (${+S[k][0].toFixed(1)}, ${+S[k][1].toFixed(1)})`).join('\n');
}

// the coach's assistant for one sport; the library and a glossary make it speak the team's language
export function system(sport, glossary, library) {
  const n = sport.roster.perSide;
  const kinds = Object.keys(sport.kinds).map(k => `- ${k}: ${sport.kinds[k].desc}`).join('\n');
  return `You are the assistant on a youth ${sport.name} coach's whiteboard. The coach describes a play out loud (speech-to-text, so expect run-on sentences and mis-heard words) or sketches it by hand. You turn it into X's and O's.

Notation: offense is O1–O${n}, defense is X1–X${n}. Never use real player names. ${sport.ai.notation || ''} Use the numbers the coach uses. If the coach says positions, assign numbers yourself and keep them consistent. Only add defenders (X) when the coach mentions defense or the concept needs them to make sense. The defender guarding O3 is X3; a defender with no action in a beat guards their matching O automatically.

${sport.ai.field}
Named spots (x, y):
${spotTable(sport)}

A play is a list of beats; the actions in one beat happen at the same time, and beats happen in order. Split what the coach said into the order it happens (3–6 beats is usual). Action kinds:
${kinds}
Teach the right read: every pass or throw goes to the player who is open at that moment (the nearest defender at least ${sport.open} ${sport.unit} away at the catch). If you place defenders, place them so the reason is visible (the receiver's defender is late, helping, screened or in the wrong zone); never throw to a covered player while someone else is open. For movement, "to" is where the player ends; "path" holds waypoints before it (route breaks) and "via" one control point for a curve. ${sport.ai.rules} Coordinates must be on the field.

Use modern coaching language the way today's coaches say it, and explain any jargon in the kid summary. "reads" are the options the play creates, each tied to a player. "cues" are 2–4 short words a coach shouts. If the coach asks to change the current play, return the whole play with the change; if they describe or name a new play, replace it. If they name a known concept, draw a clean standard version. Set "recognized" to the library concept the play is or builds on, and use "suggestions" for 0–3 specific ways to make it better.${library && library.length ? '\n\nThe concept library (key: title, concept):\n' + library.map(p => `- ${p.key}: ${p.title} (${p.concept})`).join('\n') : ''}${glossary ? '\n\nGlossary of terms coaches use:\n' + glossary : ''}`;
}

function fail(status, msg) {
  const e = new Error(status === 401 || status === 403 ? 'That key didn’t work. Copy it again from the Claude or OpenAI page and paste it in.'
    : status === 429 ? 'Your AI account is out of credit or busy right now. Add credit, or wait a minute and try again.'
    : status >= 500 ? 'The AI service is having a moment. Try again in a minute.'
    : msg || 'The AI didn’t answer (' + status + ').');
  e.status = status; return e;
}

// Where keyless coaches get AI: open models on Workers AI behind our API (src/worker). Hosts can point
// it elsewhere with mount({ api }). Requests carry X's and O's only, never names.
let API = typeof location !== 'undefined' && /mutaafaziz\.com$|localhost$|127\.0\.0\.1$/.test(location.hostname) ? '/chalktalk/api' : 'https://digitalcraftai.com/api/chalktalk';
export const setApi = url => { if (url) API = String(url).replace(/\/$/, ''); };
export const apiBase = () => API;
async function free(task, body, signal) {
  const r = await fetch(API + '/' + task, { method: 'POST', signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(r.status === 429 ? 'The free AI is resting for today. Add your own Claude or OpenAI key to keep going.' : j.error || 'The free AI didn’t answer (' + r.status + ').'), { status: r.status });
  return j;
}

// one call to the provider the key belongs to; resolves with the reply's text
// one call to the provider the key belongs to; resolves with the reply's text
async function ask(k, sys, messages, signal, schema, lite) {
  const kind = keyKind(k);
  if (kind === 'claude') {
    const call = async fallback => {
      const h = { 'content-type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' };
      // Sonnet 5.5 at low effort: a coach is waiting, and it draws plays as well as Opus did here
      // position brains run on Haiku 5.5: small, fast, one per player, in parallel
      const body = { model: lite ? 'claude-haiku-5-5' : 'claude-sonnet-5-5', max_tokens: lite ? 4000 : 16000, output_config: { effort: 'low', format: { type: 'json_schema', schema } }, system: [{ type: 'text', text: sys, cache_control: { type: 'ephemeral' } }], messages };
      if (lite) fallback = false;   // Haiku has no server-side fallback
      if (fallback) { h['anthropic-beta'] = 'server-side-fallback-2026-07-01'; body.fallbacks = 'default'; }
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: h, body: JSON.stringify(body), signal });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { if (fallback && r.status === 400 && /fallback/i.test((j.error && j.error.message) || '')) return call(false); throw fail(r.status, j.error && j.error.message); }
      if (j.stop_reason === 'refusal') throw new Error('It wouldn’t draw that one. Try describing it another way.');
      return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    };
    return call(true);
  }
  if (kind === 'openai') {
    const models = lite ? ['gpt-5-mini', 'gpt-4.1-mini', 'gpt-4o-mini'] : ['gpt-5', 'gpt-4.1', 'gpt-4o'];
    for (let i = 0; i < models.length; i++) {
      const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', signal,
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + k },
        body: JSON.stringify({ model: models[i], response_format: { type: 'json_schema', json_schema: { name: 'play', strict: true, schema } },
          messages: [{ role: 'system', content: sys }].concat(messages) }) });
      const j = await r.json().catch(() => ({})), msg = (j.error && j.error.message) || '';
      if (!r.ok) { if (i + 1 < models.length && (r.status === 404 || /model/i.test(msg)) && r.status !== 401 && r.status !== 429) continue; throw fail(r.status, msg); }
      return (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
    }
  }
  throw Object.assign(new Error('Add your Claude or OpenAI key to draw plays from your own words.'), { code: 'nokey' });
}

// ---- requests, built the same way in the browser and in the worker ----
export function playRequest({ sport, text, current, sketch, glossary, library }) {
  const lib = library || sport.plays;
  const sys = system(sport, glossary || sport.glossary, lib), schema = schemaFor(sport, lib.map(p => p.key));
  const content = sketch
    ? `The coach sketched this play by hand on the board (rough lines turned into actions; each stroke became its own beat, in the order drawn):\n${JSON.stringify(current)}\n\n` +
      'Take over from the sketch: keep the coach\'s idea and the players where they put them, but make it a clean, correct play. Merge strokes that should happen at the same time into one beat, fix the ball (only the holder dribbles, passes or shoots), set screens where a defender would be, tidy routes into real cuts, and add the timing a coach would teach. Name the concept it matches. ' + (text ? 'The coach also said: "' + text + '"' : '')
    : current ? `Current play on the board:\n${JSON.stringify(current)}\n\nThe coach said: "${text}"` : `The coach said: "${text}"`;
  return { sys, schema, messages: [{ role: 'user', content }], check: raw => normalize(raw, sport) };
}

// smart players: the AI plays chosen positions through the whole play, a real read each beat
export function smartSchemaFor(sport, ids) {
  const XYs = { type: 'object', additionalProperties: false, required: ['x', 'y'], properties: { x: { type: 'number' }, y: { type: 'number' } } };
  const N = { anyOf: [XYs, { type: 'null' }] }, ID = { type: 'string', enum: rosterIds(sport) };
  return { type: 'object', additionalProperties: false, required: ['reply', 'players'], properties: {
    reply: { type: 'string', description: 'One short broadcaster-style line about what the smart players will do.' },
    players: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'beats'], properties: {
      id: { type: 'string', enum: ids },
      beats: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['beat', 'kind', 'to', 'via', 'path', 'target', 'thought'], properties: {
        beat: { type: 'integer', description: 'Beat index, 0-based.' }, kind: { type: 'string', enum: Object.keys(sport.kinds) },
        to: N, via: N, path: { type: 'array', items: XYs }, target: { anyOf: [ID, { type: 'null' }] },
        thought: { type: 'string', description: 'What this player sees and why they do it, in under 12 words, like a smart player thinking.' } } } } } } } } };
}
export function smartRequest({ sport, play, ids, glossary }) {
  const sys = system(sport, glossary || sport.glossary, sport.plays) + `

You are now playing as a smart, alive ${sport.name} player in one or more positions. For each of your positions, decide what that player does in EVERY beat, reading what everyone else does in that beat: space the floor, cut when a defender turns their head, fill the spot a teammate left, drift or lift for the driver, find the window against zone, help and recover on defense. Use "ready" when the smartest move is to stay put. Keep the coach's play intact: don't take actions that belong to other players, and only act with the ball if you have it. Give each beat a short thought.`;
  const content = `The play on the board:\n${JSON.stringify(play)}\n\nPlay these positions smartly: ${ids.join(', ')}.`;
  return { sys, schema: smartSchemaFor(sport, ids), messages: [{ role: 'user', content }], check: raw => checkSmart(raw, play, sport, ids) };
}
// one position, one brain: the persona's instincts, that player's eyes
export function brainFor(sport, play, id) {
  const p = (play.players || []).find(q => String(q.id).toUpperCase() === id) || { id, side: id[0] === 'X' ? 'D' : 'O', role: '' };
  return sport.brains ? sport.brains(p) : { key: 'player', name: 'Player brain', instincts: '' };
}
const FILM = { type: 'object', additionalProperties: false, required: ['read', 'risk', 'tip'], properties: {
  read: { type: 'string', description: 'What this position sees and does in the play, first person, under 18 words.' },
  risk: { type: 'string', description: 'The one thing that could go wrong for this position, under 14 words.' },
  tip: { type: 'string', description: 'A coaching cue for a kid in this spot, under 10 words.' } } };
export function brainRequest({ sport, play, id, mode }) {
  const brain = brainFor(sport, play, id);
  if (mode === 'film') {
    const sys = system(sport, '', sport.plays) + `\n\nYou are the ${brain.name} for ${id}. ${brain.instincts}\nWatch the play from ${id}'s eyes and say what you see, your risk and a cue a kid in your spot can use. Speak as the player ("I").`;
    return { brain, sys, schema: FILM, messages: [{ role: 'user', content: `The play:\n${JSON.stringify(play)}\n\nYou are ${id}.` }], check: raw => ({ ok: !!(raw && raw.read), errors: raw && raw.read ? [] : ['no read'] }) };
  }
  const r = smartRequest({ sport, play, ids: [id] });
  r.sys += `\n\nYou are the ${brain.name}. Your instincts: ${brain.instincts}`;
  return Object.assign(r, { brain });
}

export function mergeSmart(play, smart, sport) {
  const out = JSON.parse(JSON.stringify(play)), ids = (smart.players || []).map(p => p.id);
  out.beats = (out.beats || []).map(b => Object.assign({}, b, { actions: (b.actions || []).filter(a => ids.indexOf(String(a.who)) < 0 || sport.kinds[a.kind] && sport.kinds[a.kind].type !== 'move') }));
  (smart.players || []).forEach(sp => (sp.beats || []).forEach(b => {
    const k = Math.max(0, Math.min(out.beats.length - 1, b.beat | 0)), beat = out.beats[k];
    if (!beat || !sport.kinds[b.kind] || sport.kinds[b.kind].type !== 'move') {
      if (beat && b.thought) (beat.thoughts = beat.thoughts || {})[sp.id] = b.thought;
      return;
    }
    if (beat.actions.some(a => a.who === sp.id && sport.kinds[a.kind].type === 'move')) return;
    beat.actions.push({ kind: b.kind, who: sp.id, to: b.to, via: b.via, path: b.path || [], target: b.target, thought: b.thought });
  }));
  out.players = (out.players || []).map(p => ids.indexOf(String(p.id)) >= 0 ? Object.assign({}, p, { smart: true }) : p);
  return out;
}
function checkSmart(raw, play, sport, ids) {
  if (!raw || !Array.isArray(raw.players)) return { ok: false, errors: ['no players'] };
  return normalize(mergeSmart(play, raw, sport), sport);
}

// ask, check, and send the problems back once
async function solve(req, askFn) {
  const messages = req.messages.slice();
  for (let round = 0; round < 2; round++) {
    const t = await askFn(req.sys, messages, req.schema);
    let raw = null;
    try { raw = JSON.parse(String(t).replace(/^```(json)?|```$/g, '').trim()); } catch (e) {}
    const n = raw ? req.check(raw) : { ok: false, errors: ['that was not JSON'] };
    if (n.ok && !n.errors.length) return raw;
    if (round === 1) { if (n.ok) return raw; throw new Error('The AI drew something that doesn’t hold together. Try saying it another way.'); }
    messages.push({ role: 'assistant', content: String(t) }, { role: 'user', content: 'That has problems: ' + n.errors.join('; ') + '. Fix them and send the whole answer again.' });
  }
}
export { solve };

// text the coach said (+ the play on the board, for edits) → a play the board can draw.
// With a key: straight to Claude or OpenAI. Without: the free open-model API.
export async function drawPlay(text, current, opts) {
  opts = opts || {};
  const k = opts.key || key.get(), sport = opts.sport;
  if (!keyKind(k)) return free('play', { sport: sport.id, text, current, sketch: !!opts.sketch }, opts.signal);
  return solve(playRequest({ sport, text, current, sketch: opts.sketch, glossary: opts.glossary, library: opts.library }), (sys, m, schema) => ask(k, sys, m, opts.signal, schema));
}
// smart players: each position gets its own brain (a persona on a lite model), all thinking in
// parallel; their moves are merged one by one and any that break the play are dropped
async function brain(sport, play, id, mode, opts) {
  const k = opts.key || key.get();
  if (keyKind(k)) { const req = brainRequest({ sport, play, id, mode }); return solve(req, (sys, m, schema) => ask(k, sys, m, opts.signal, schema, true)); }
  return free('brain', { sport: sport.id, play, id, mode }, opts.signal);
}
export async function smartPlayers(play, ids, opts) {
  opts = opts || {};
  const sport = opts.sport;
  const answers = await Promise.allSettled(ids.map(id => brain(sport, play, id, 'smart', opts)));
  let out = play; const used = [], lines = [];
  answers.forEach((a, i) => {
    if (a.status !== 'fulfilled' || !a.value || !Array.isArray(a.value.players)) return;
    const next = mergeSmart(out, { players: a.value.players.filter(p => p.id === ids[i]) }, sport), n = normalize(next, sport);
    if (n.ok && !n.errors.length) { out = next; used.push(ids[i]); if (a.value.reply) lines.push(a.value.reply); }
  });
  if (!used.length) { const e = answers.find(a => a.status === 'rejected'); throw e ? e.reason : new Error('The brains couldn’t agree on a move. Try again.'); }
  return { play: out, reply: lines[0] || `${used.join(', ')} are thinking for themselves now.`, used };
}
// the film room: every position's brain watches the play and says what it sees
export async function filmRoom(play, ids, opts) {
  opts = opts || {};
  const sport = opts.sport;
  const answers = await Promise.allSettled(ids.map(id => brain(sport, play, id, 'film', opts)));
  return answers.map((a, i) => a.status === 'fulfilled' && a.value && a.value.read ? Object.assign({ id: ids[i], brain: brainFor(sport, play, ids[i]).name }, a.value) : null).filter(Boolean);
}
