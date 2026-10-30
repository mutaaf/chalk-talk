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
For movement, "to" is where the player ends; "path" holds waypoints before it (route breaks) and "via" one control point for a curve. ${sport.ai.rules} Coordinates must be on the field.

Use modern coaching language the way today's coaches say it, and explain any jargon in the kid summary. "reads" are the options the play creates, each tied to a player. "cues" are 2–4 short words a coach shouts. If the coach asks to change the current play, return the whole play with the change; if they describe or name a new play, replace it. If they name a known concept, draw a clean standard version. Set "recognized" to the library concept the play is or builds on, and use "suggestions" for 0–3 specific ways to make it better.${library && library.length ? '\n\nThe concept library (key: title, concept):\n' + library.map(p => `- ${p.key}: ${p.title} (${p.concept})`).join('\n') : ''}${glossary ? '\n\nGlossary of terms coaches use:\n' + glossary : ''}`;
}

function fail(status, msg) {
  const e = new Error(status === 401 || status === 403 ? 'That key didn’t work. Copy it again from the Claude or OpenAI page and paste it in.'
    : status === 429 ? 'Your AI account is out of credit or busy right now. Add credit, or wait a minute and try again.'
    : status >= 500 ? 'The AI service is having a moment. Try again in a minute.'
    : msg || 'The AI didn’t answer (' + status + ').');
  e.status = status; return e;
}

// one call to the provider the key belongs to; resolves with the reply's text
async function ask(k, sys, messages, signal, schema) {
  const kind = keyKind(k);
  if (kind === 'claude') {
    const call = async fallback => {
      const h = { 'content-type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' };
      const body = { model: 'claude-opus-5-5', max_tokens: 16000, output_config: { effort: 'low', format: { type: 'json_schema', schema } }, system: [{ type: 'text', text: sys, cache_control: { type: 'ephemeral' } }], messages };
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
    const models = ['gpt-5', 'gpt-4.1', 'gpt-4o'];
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

// text the coach said (+ the play on the board, for edits) → a play the board can draw
export async function drawPlay(text, current, opts) {
  opts = opts || {};
  const k = opts.key || key.get();
  if (!keyKind(k)) throw Object.assign(new Error('Add your Claude or OpenAI key to draw plays from your own words.'), { code: 'nokey' });
  const sport = opts.sport, lib = opts.library || sport.plays;
  const sys = system(sport, opts.glossary || sport.glossary, lib), schema = schemaFor(sport, lib.map(p => p.key));
  const content = opts.sketch
    ? `The coach sketched this play by hand on the board (rough lines turned into actions; each stroke became its own beat, in the order drawn):\n${JSON.stringify(current)}\n\n` +
      'Take over from the sketch: keep the coach\'s idea and the players where they put them, but make it a clean, correct play. Merge strokes that should happen at the same time into one beat, fix the ball (only the holder dribbles, passes or shoots), set screens where a defender would be, tidy routes into real cuts, and add the timing a coach would teach. Name the concept it matches. ' + (text ? 'The coach also said: "' + text + '"' : '')
    : current ? `Current play on the board:\n${JSON.stringify(current)}\n\nThe coach said: "${text}"` : `The coach said: "${text}"`;
  const messages = [{ role: 'user', content }];
  for (let round = 0; round < 2; round++) {
    const t = await ask(k, sys, messages, opts.signal, schema);
    let raw = null;
    try { raw = JSON.parse(t.replace(/^```(json)?|```$/g, '').trim()); } catch (e) {}
    const n = raw ? normalize(raw, sport) : { ok: false, errors: ['that was not JSON'] };
    if (n.ok && !n.errors.length) return raw;
    if (round === 1) { if (n.ok) return raw; throw new Error('The AI drew something that doesn’t hold together. Try saying it another way.'); }
    messages.push({ role: 'assistant', content: t }, { role: 'user', content: 'That play has problems: ' + n.errors.join('; ') + '. Fix them and send the whole play again.' });
  }
}
