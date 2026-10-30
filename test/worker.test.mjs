// The free-AI worker: routing, validation, CORS, caps and size limits, against a stub AI and D1.
import assert from 'node:assert/strict';
import worker, { LIMITS, cors } from '../src/worker/index.js';
import { getSport } from '../src/sports/index.js';

const bb = getSport('basketball');
const canned = Object.assign({ reply: 'Drawn.', recognized: 'pick-and-roll', suggestions: [] }, JSON.parse(JSON.stringify(bb.plays.find(p => p.key === 'pick-and-roll'))));
canned.players = canned.players.map(p => Object.assign({ role: '' }, p));
function fakeDB() {
  const rows = new Map();
  const stmt = sql => ({
    bind: (...a) => ({
      first: async () => {
        if (/^INSERT INTO ai_usage/.test(sql)) { const n = (rows.get(a[0]) || 0) + a[1]; rows.set(a[0], n); return { n }; }
        if (/FROM ai_usage/.test(sql)) return rows.has(a[0]) ? { n: rows.get(a[0]) } : null;
        return null;   // the answer cache and the rest: empty
      },
      run: async () => ({}),
      all: async () => ({ results: [] })
    }),
    first: async () => null,
    all: async () => ({ results: [] }),
    run: async () => ({})
  });
  return { prepare: stmt, rows };
}
function env(aiAnswer, extra) {
  return Object.assign({
    DB: fakeDB(),
    AI: { calls: 0, run: async (model, input) => {
      env.last = { model, input };
      if (/whisper/.test(model)) return { text: ' O1 passes to O2 ' };
      if (/melotts/.test(model)) return { audio: btoa('ID3fake') };
      return { response: typeof aiAnswer === 'function' ? aiAnswer(input) : aiAnswer, usage: { prompt_tokens: 1000, completion_tokens: 300 } };
    } }
  }, extra);
}
const req = (path, body, h) => new Request('https://mutaafaziz.com/chalktalk/api' + path, {
  method: body === undefined ? 'GET' : 'POST', headers: Object.assign({ 'content-type': 'application/json', origin: 'https://youthsportsiq.com', 'cf-connecting-ip': '1.2.3.4' }, h),
  body: body === undefined ? undefined : typeof body === 'string' || body instanceof Uint8Array ? body : JSON.stringify(body) });

// a play comes back, validated, with CORS for CourtIQ
let r = await worker.fetch(req('/play', { sport: 'basketball', text: '1 dribbles off a 5 screen' }), env(JSON.stringify(canned)));
assert.equal(r.status, 200); assert.equal(r.headers.get('access-control-allow-origin'), 'https://youthsportsiq.com');
const j = await r.json(); assert.equal(j.recognized, 'pick-and-roll'); assert.ok(j.beats.length);
// the system prompt is the shared one, and the schema rides along
assert.ok(/X's and O's/.test(env.last.input.messages[0].content)); assert.ok(env.last.input.response_format);
// a model that answers garbage twice is a 502 in plain words, not a crash
r = await worker.fetch(req('/play', { sport: 'basketball', text: 'x' }), env('not json'));
assert.equal(r.status, 502); assert.ok((await r.json()).error);
// one repair round: bad first, good second
let n = 0;
r = await worker.fetch(req('/play', { sport: 'basketball', text: 'x' }), env(() => (n++ ? JSON.stringify(canned) : '{"players":[]}')));
assert.equal(r.status, 200); assert.equal(n, 2);
// validation
assert.equal((await worker.fetch(req('/play', { sport: 'cricket', text: 'x' }), env('{}'))).status, 400);
assert.equal((await worker.fetch(req('/play', { sport: 'basketball', text: ' ' }), env('{}'))).status, 400);
assert.equal((await worker.fetch(req('/play', 'nope{'), env('{}'))).status, 400);
assert.equal((await worker.fetch(req('/play', 'x'.repeat(LIMITS.maxJson + 10)), env('{}'))).status, 413);
assert.equal((await worker.fetch(req('/smart', { sport: 'basketball', play: canned, ids: [] }), env('{}'))).status, 400);
// smart players
const smart = { reply: 'Smart.', players: [{ id: 'O2', beats: [{ beat: 1, kind: 'drift', to: { x: 21, y: 6 }, via: null, path: [], target: null, thought: 'Sees the drive, drifts to the corner.' }] }] };
r = await worker.fetch(req('/smart', { sport: 'basketball', play: canned, ids: ['O2'] }), env(JSON.stringify(smart)));
assert.equal(r.status, 200); assert.equal((await r.json()).players[0].id, 'O2');
// position brains: smart and film, validated; a bad mode is a 400
r = await worker.fetch(req('/brain', { sport: 'basketball', play: canned, id: 'O2', mode: 'smart' }), env(JSON.stringify(smart)));
assert.equal(r.status, 200); assert.ok(/glm-4\.7-flash/.test(env.last.model));
r = await worker.fetch(req('/brain', { sport: 'basketball', play: canned, id: 'O5', mode: 'film' }), env(JSON.stringify({ read: 'I see X5 drop.', risk: 'Rolling too early.', tip: 'Roll when 1 turns the corner.' })));
assert.equal(r.status, 200); assert.equal((await r.json()).read, 'I see X5 drop.');
assert.equal((await worker.fetch(req('/brain', { sport: 'basketball', play: canned, id: 'O5', mode: 'nap' }), env('{}'))).status, 400);
assert.equal((await worker.fetch(req('/brain', { sport: 'basketball', play: canned, id: 'Q9', mode: 'film' }), env('{}'))).status, 400);
// a brain that fails on the small model falls back to Gemma
let calls = [];
r = await worker.fetch(req('/brain', { sport: 'basketball', play: canned, id: 'O5', mode: 'film' }), Object.assign(env(''), { AI: { run: async m => { calls.push(m); return { response: /glm/.test(m) ? 'nope' : '{"read":"ok","risk":"r","tip":"t"}' }; } } }));
assert.equal(r.status, 200); assert.ok(calls.some(m => /gemma/.test(m)));
// the brain cap is its own
const eb = env(JSON.stringify({ read: 'r', risk: 'r', tip: 't' }));
for (let i = 0; i < LIMITS.perIp.brain; i++) await worker.fetch(req('/brain', { sport: 'basketball', play: canned, id: 'O1', mode: 'film' }), eb);
assert.equal((await worker.fetch(req('/brain', { sport: 'basketball', play: canned, id: 'O1', mode: 'film' }), eb)).status, 429);
// per-IP cap → 429; the global neuron cap → 429
const e = env(JSON.stringify(canned));
for (let i = 0; i < LIMITS.perIp.play; i++) assert.equal((await worker.fetch(req('/play', { sport: 'flag5', text: 'slant' }), e)).status === 429, false);
assert.equal((await worker.fetch(req('/play', { sport: 'flag5', text: 'slant' }), e)).status, 429);
const e2 = env(JSON.stringify(canned)); e2.DB.rows.set('neurons:' + new Date().toISOString().slice(0, 10), LIMITS.neuronsPerDay);
assert.equal((await worker.fetch(req('/play', { sport: 'basketball', text: 'x' }), e2)).status, 429);
// hear and say
r = await worker.fetch(req('/hear', new Uint8Array([1, 2, 3, 4]), { 'content-type': 'audio/webm' }), env('{}'));
assert.equal(r.status, 200); assert.equal((await r.json()).text, 'O1 passes to O2');
assert.equal((await worker.fetch(req('/hear', new Uint8Array(LIMITS.maxAudio + 1), { 'content-type': 'audio/webm' }), env('{}'))).status, 413);
r = await worker.fetch(req('/say', { text: 'Five rolls to the rim!' }), env('{}'));
assert.equal(r.status, 200); assert.ok(/^audio\//.test(r.headers.get('content-type')));
assert.equal((await worker.fetch(req('/say', { text: 'x'.repeat(LIMITS.maxSay + 1) }), env('{}'))).status, 413);
// health, preflight, unknown origins, unknown routes, no AI
r = await worker.fetch(req('/health'), env('{}')); assert.equal(r.status, 200); assert.ok((await r.json()).ok);
r = await worker.fetch(new Request('https://mutaafaziz.com/chalktalk/api/play', { method: 'OPTIONS', headers: { origin: 'https://digitalcraftai.com' } }), env('{}'));
assert.equal(r.status, 204); assert.equal(r.headers.get('access-control-allow-origin'), 'https://digitalcraftai.com');
assert.equal(cors('https://evil.example')['access-control-allow-origin'], undefined);
assert.ok(cors('http://localhost:8795')['access-control-allow-origin']);
assert.equal((await worker.fetch(req('/nope', {}), env('{}'))).status, 404);
assert.equal((await worker.fetch(req('/play', { sport: 'basketball', text: 'x' }), { DB: fakeDB() })).status, 503);
console.log('ok: worker routes, validation, CORS, caps and limits');
// the IQ tutor: lite model, validated, and token headers for the coach's stats
{
  const rt = await worker.fetch(req('/tutor', { sport: 'basketball', band: 'young', mode: 'answer', q: { type: 'pass', answer: 'O3' }, given: 'O4', right: false }), env(JSON.stringify({ say: 'Look for the open friend.', tip: 'Eyes up' })));
  assert.equal(rt.status, 200); assert.equal((await rt.json()).tip, 'Eyes up'); assert.ok(rt.headers.get('x-ct-in') != null);
  assert.equal((await worker.fetch(req('/tutor', { sport: 'basketball', mode: 'nap', q: {} }), env('{}'))).status, 400);
  console.log('ok: tutor endpoint');
}
{
  const ra = await worker.fetch(req('/analyst', { sport: 'flag5', play: canned, facts: ['a', 'b'] }), env(JSON.stringify({ lines: ['Watch the safety.', 'He comes off it.'] })));
  assert.equal(ra.status, 200); assert.equal((await ra.json()).lines.length, 2);
  assert.equal((await worker.fetch(req('/analyst', { sport: 'flag5', play: canned, facts: [] }), env('{}'))).status, 400);
  console.log('ok: analyst endpoint');
}
// opt-in voice learning: a phrase or a fix is shared with everyone only once 3 different coaches confirm it;
// anything carrying a scrubbed name is refused
{
  const { DatabaseSync } = await import('node:sqlite');
  const sq = new DatabaseSync(':memory:');
  const mk = (sql, a = []) => ({ first: async () => sq.prepare(sql).get(...a) ?? null, run: async () => { sq.prepare(sql).run(...a); return {}; }, all: async () => ({ results: sq.prepare(sql).all(...a) }) });
  const D = { prepare: sql => Object.assign(mk(sql), { bind: (...a) => mk(sql, a) }) };
  const e = env('{}', { DB: D });
  const post = (ip, body) => worker.fetch(new Request('https://x/chalktalk/api/learn', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip }, body: JSON.stringify(body) }), e);
  const lex = async () => (await worker.fetch(new Request('https://x/chalktalk/api/lexicon'), e)).json();
  const phrase = { kind: 'phrase', sport: 'basketball', text: 'our five rolling thing', concept: 'pick-and-roll', kept: true };
  for (const ip of ['1.1.1.1', '2.2.2.2']) assert.equal((await post(ip, phrase)).status, 200);
  await post('2.2.2.2', phrase);   // the same coach twice still counts once
  assert.equal((await lex()).phrases.basketball, undefined);
  await post('3.3.3.3', phrase);
  assert.equal((await lex()).phrases.basketball['our five rolling thing'], 'pick-and-roll');
  for (const ip of ['1.1.1.1', '2.2.2.2', '3.3.3.3']) await post(ip, { kind: 'word', a: 'spade', b: 'spain' });
  assert.equal((await lex()).words.spade, 'spain');
  assert.equal((await post('4.4.4.4', { kind: 'phrase', sport: 'basketball', text: '[name] runs it', concept: 'pick-and-roll', kept: true })).status, 400);
  assert.equal((await post('4.4.4.4', { kind: 'phrase', sport: 'basketball', text: 'whatever', concept: 'not-a-play', kept: true })).status, 400);
  console.log('ok: opt-in voice learning shares only what 3+ coaches confirm, never names');
}
// analytics: events land without IPs or cookies; the rollup is the owner's only (Bearer STATS_TOKEN)
{
  const { DatabaseSync } = await import('node:sqlite');
  const sq = new DatabaseSync(':memory:');
  const mk = (sql, a = []) => ({ first: async () => sq.prepare(sql).get(...a) ?? null, run: async () => { sq.prepare(sql).run(...a); return {}; }, all: async () => ({ results: sq.prepare(sql).all(...a) }) });
  const D = { prepare: sql => Object.assign(mk(sql), { bind: (...a) => mk(sql, a) }) };
  const e = env('{}', { DB: D, STATS_TOKEN: 'owner' });
  const send = (ip, ua, events) => worker.fetch(new Request('https://x/chalktalk/api/event', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip, 'user-agent': ua }, body: JSON.stringify({ ctx: { host: 'mutaafaziz.com', device: 'phone', sport: 'flag5', ai: 'free', ref: 'google.com' }, events }) }), e);
  assert.equal((await send('1.1.1.1', 'Mozilla/5.0 (iPhone) Safari/604', [{ n: 'view' }, { n: 'film_open' }, { n: 'voice', p: { path: 'ai', ms: 9000, ok: 1 } }])).status, 204);
  await send('2.2.2.2', 'Mozilla/5.0 (Windows) Chrome/140', [{ n: 'view' }, { n: 'iq_done', p: { band: 'young', right: 4, of: 6 } }]);
  assert.equal(sq.prepare("SELECT COUNT(*) n FROM events WHERE visitor LIKE '%1.1.1.1%' OR props LIKE '%1.1.1.1%'").get().n, 0);   // no IPs anywhere
  assert.equal((await worker.fetch(new Request('https://x/chalktalk/api/stats'), e)).status, 401);
  const st = await (await worker.fetch(new Request('https://x/chalktalk/api/stats?days=7', { headers: { authorization: 'Bearer owner' } }), e)).json();
  assert.equal(st.totals.visitors, 2); assert.equal(st.totals.views, 2);
  assert.ok(st.features.some(f => f.k === 'film_open')); assert.ok(st.browsers.some(b => b.k === 'Safari')); assert.ok(st.refs.some(r => r.k === 'google.com'));
  assert.equal(st.iq[0].pct, 67);
  console.log('ok: anonymous analytics ingest and the owner-only rollup');
}
// free users on Claude Haiku: used when the Worker has a key and the day's dollar cap has room; the open models
// take over past the cap or when Anthropic errors; every call's cost is tracked in micro-dollars
{
  const { DatabaseSync } = await import('node:sqlite');
  const sq = new DatabaseSync(':memory:');
  const mk = (sql, a = []) => ({ first: async () => sq.prepare(sql).get(...a) ?? null, run: async () => { sq.prepare(sql).run(...a); return {}; }, all: async () => ({ results: sq.prepare(sql).all(...a) }) });
  const D = { prepare: sql => Object.assign(mk(sql), { bind: (...a) => mk(sql, a) }) };
  const realFetch = globalThis.fetch; let claudeCalls = 0, claudeFails = false;
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('https://api.anthropic.com/')) {
      claudeCalls++;
      if (claudeFails) return new Response(JSON.stringify({ error: { message: 'overloaded' } }), { status: 529 });
      const body = JSON.parse(init.body); assert.equal(body.model, 'claude-haiku-5-5'); assert.equal(body.output_config.format.type, 'json_schema');
      return new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(canned) }], stop_reason: 'end_turn', usage: { input_tokens: 5000, output_tokens: 1100 } }), { status: 200 });
    }
    return realFetch(url, init);
  };
  const e = env(JSON.stringify(canned), { DB: D, ANTHROPIC_API_KEY: 'sk-ant-test' });
  const draw = () => worker.fetch(new Request('https://x/chalktalk/api/play', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '9.9.9.' + Math.floor(Math.random() * 200) }, body: JSON.stringify({ sport: 'basketball', text: 'pick and roll' }) }), e);
  let r = await draw();
  assert.equal(r.status, 200); assert.equal(r.headers.get('x-ct-model'), 'claude-haiku-5-5'); assert.equal(r.headers.get('x-ct-usd'), '0.00105');
  assert.equal(sq.prepare("SELECT n FROM ai_usage WHERE bucket LIKE 'usd:%'").get().n, 1050);
  claudeFails = true; r = await draw();
  assert.equal(r.status, 200); assert.notEqual(r.headers.get('x-ct-model'), 'claude-haiku-5-5');   // Anthropic down: the open models answer
  claudeFails = false; sq.prepare("UPDATE ai_usage SET n = ? WHERE bucket LIKE 'usd:%'").run(LIMITS.claudeMicrosPerDay);
  const before = claudeCalls; r = await draw();
  assert.equal(r.status, 200); assert.equal(claudeCalls, before); assert.notEqual(r.headers.get('x-ct-model'), 'claude-haiku-5-5');   // over the cap
  const e2 = env(JSON.stringify(canned), { DB: D }); const n0 = claudeCalls;
  await worker.fetch(new Request('https://x/chalktalk/api/play', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sport: 'basketball', text: 'pick and roll' }) }), e2);
  assert.equal(claudeCalls, n0);   // no key: open models, as before
  globalThis.fetch = realFetch;
  console.log('ok: free plays on Haiku within a daily dollar cap, open models past it or on error');
}
// the shared answer cache: the same question is answered from cache (no AI, no cap); edits only match the same
// board; "another" always asks the AI; only a hash of the question is stored
{
  const { DatabaseSync } = await import('node:sqlite');
  const sq = new DatabaseSync(':memory:');
  const mk = (sql, a = []) => ({ first: async () => sq.prepare(sql).get(...a) ?? null, run: async () => { sq.prepare(sql).run(...a); return {}; }, all: async () => ({ results: sq.prepare(sql).all(...a) }) });
  const D = { prepare: sql => Object.assign(mk(sql), { bind: (...a) => mk(sql, a) }) };
  let aiCalls = 0;
  const e = env(() => { aiCalls++; return JSON.stringify(canned); }, { DB: D });
  const ask = (body, ip) => worker.fetch(new Request('https://x/chalktalk/api/play', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip || '7.7.7.7' }, body: JSON.stringify(Object.assign({ sport: 'basketball' }, body)) }), e);
  const boardA = { title: 'A', players: [], beats: [] }, boardB = { title: 'B', players: [], beats: [] };
  let r = await ask({ text: 'Run Spain pick and roll!', current: boardA });
  assert.equal(r.headers.get('x-ct-cache'), null); const n1 = aiCalls;
  r = await ask({ text: 'run spain pick and roll', current: boardB }, '8.8.8.8');   // another coach, another board: same fresh question
  assert.equal(r.status, 200); assert.equal(r.headers.get('x-ct-cache'), 'hit'); assert.equal(aiCalls, n1);
  assert.equal((await r.json()).recognized, 'pick-and-roll');
  await ask({ text: 'now have 5 pop instead', current: boardA }); const n2 = aiCalls;
  r = await ask({ text: 'now have 5 pop instead', current: boardB });   // an edit of a different board: asks the AI
  assert.equal(r.headers.get('x-ct-cache'), null); assert.ok(aiCalls > n2);
  const n3 = aiCalls; r = await ask({ text: 'give me another spain pick and roll', current: boardA }); await ask({ text: 'give me another spain pick and roll', current: boardA });
  assert.ok(aiCalls >= n3 + 2, '"another" is never cached');
  assert.equal(sq.prepare("SELECT COUNT(*) n FROM ai_cache WHERE k LIKE '%spain%' OR v LIKE '%Run Spain%'").get().n, 0);   // keys are hashes, words aren't stored
  const brainBody = { sport: 'basketball', play: canned, id: 'O5', mode: 'film' };
  const brain = () => worker.fetch(new Request('https://x/chalktalk/api/brain', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(brainBody) }), env(() => { aiCalls++; return '{"read":"I see X5 drop.","risk":"r","tip":"t"}'; }, { DB: D }));
  await brain(); const n4 = aiCalls; r = await brain();
  assert.equal(r.headers.get('x-ct-cache'), 'hit'); assert.equal(aiCalls, n4);
  console.log('ok: shared answer cache (fresh plays by words, edits by board, never "another", hashes only)');
}
