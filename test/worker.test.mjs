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
        if (/^INSERT/.test(sql)) { const n = (rows.get(a[0]) || 0) + a[1]; rows.set(a[0], n); return { n }; }
        return rows.has(a[0]) ? { n: rows.get(a[0]) } : null;
      }
    }),
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
