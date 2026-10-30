// Chalk Talk's free AI, for coaches without their own key: open models on Cloudflare Workers AI.
// Runs only for /chalktalk/api/*; everything else on the route is static assets.
//   POST /chalktalk/api/play   {sport, text, current, sketch}  → a play (same JSON as the BYOK path)
//   POST /chalktalk/api/smart  {sport, play, ids}               → smart players' moves and thoughts
//   POST /chalktalk/api/brain  {sport, play, id, mode}           → one position's brain (smart moves, or a film-room read), lite model
//   POST /chalktalk/api/tutor  {sport, band, mode, q, play, given, right, summary} → the IQ tutor's line, lite model
//   POST /chalktalk/api/analyst {sport, play, facts}          → booth commentary, one line per beat, lite model
//   POST /chalktalk/api/hear   audio (webm/mp4/wav, ≤ 2 MB)     → {text}   (Whisper)
//   POST /chalktalk/api/say    {text ≤ 300 chars}                → audio    (MeloTTS, cached)
//   GET  /chalktalk/api/health                                   → {ok, models, today}
// Prompts, schemas, validation and the one repair round are src/ai.js's, shared with the browser.
// Requests carry X's and O's only (player names never leave the coach's device); nothing is stored
// but hashed-IP counters.

import { playRequest, smartRequest, brainRequest, tutorRequest, analystRequest, solve } from '../ai.js';
import { getSport } from '../sports/index.js';

export const MODELS = {
  play: '@cf/google/gemma-4-26b-a4b-it',
  fallback: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  brain: '@cf/zai-org/glm-4.7-flash',
  hear: '@cf/openai/whisper-large-v3-turbo',
  say: '@cf/myshell-ai/melotts'
};
// Per hashed IP per UTC day, and for everyone together, so this stays inside the free Workers AI
// allowance (10k neurons a day, shared with COLD GAS and Hearth).
export const LIMITS = {
  perIp: { play: 40, smart: 20, brain: 200, tutor: 300, analyst: 80, hear: 60, say: 150 },
  neuronsPerDay: 3500,
  // charged up front, then corrected to what the call really cost (tokens × price, below)
  estNeurons: { play: 85, smart: 80, brain: 35, tutor: 15, analyst: 30, hear: 8, say: 4 },
  maxJson: 64 * 1024, maxAudio: 2 * 1024 * 1024, maxSay: 300
};
const SPORTS = ['basketball', 'flag5', 'flag7'];
// USD per million tokens (in, out); a neuron is $0.011 per 1000
const PRICES = {
  '@cf/google/gemma-4-26b-a4b-it': [0.1, 0.3], '@cf/meta/llama-3.3-70b-instruct-fp8-fast': [0.293, 2.253],
  '@cf/meta/llama-3.1-8b-instruct-fp8': [0.152, 0.287], '@cf/zai-org/glm-4.7-flash': [0.06, 0.4], '@cf/meta/llama-4-scout-17b-16e-instruct': [0.27, 0.85]
};
export const neuronsFor = (model, inTok, outTok) => { const p = PRICES[model] || [0.3, 2.3]; return Math.ceil((inTok * p[0] + outTok * p[1]) / 1e6 / 0.011 * 1000); };

// mutaafaziz.com, digitalcraftai.com, and CourtIQ (youthsportsiq.com / sportsiq.app and its Vercel previews)
const ORIGINS = [/^https:\/\/mutaafaziz\.com$/, /^https:\/\/(www\.)?digitalcraftai\.com$/, /^https:\/\/(www\.|app\.)?youthsportsiq\.com$/, /^https:\/\/(www\.|app\.)?sportsiq\.app$/,
  /^https:\/\/courtiq[a-z0-9-]*\.vercel\.app$/, /^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];
export function cors(origin) {
  const ok = origin && ORIGINS.some(r => r.test(origin));
  return ok ? { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400', vary: 'Origin' } : { vary: 'Origin' };
}
// Whisper hears coaching talk better when it's told the words to expect (play names, spots, O1–X7)
function hearPrompt(id) {
  const sp = SPORTS.indexOf(id) >= 0 ? getSport(id) : null; if (!sp) return 'A youth coach describing a play: O1 dribbles, O5 sets a ball screen, pick and roll, DHO.';
  const ids = []; for (let i = 1; i <= sp.roster.perSide; i++) ids.push('O' + i);
  return `A youth ${sp.name} coach describing a play: ${ids.join(', ')}, X1. ` + sp.plays.slice(0, 18).map(p => p.title).join(', ') + '. ' + Object.keys(sp.spots).slice(0, 14).join(', ') + '.';
}
const json = (body, status, h) => new Response(JSON.stringify(body), { status: status || 200, headers: Object.assign({ 'content-type': 'application/json', 'cache-control': 'no-store' }, h) });
const day = () => new Date().toISOString().slice(0, 10);

async function ipHash(req, env) {
  // behind digitalcraftai.com's Vercel proxy every caller shares Vercel's egress IP, so use the
  // forwarded client there (spoofable, which is why the global neuron cap is the real backstop)
  const fwd = req.headers.get('x-vercel-id') && (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const ip = fwd || req.headers.get('cf-connecting-ip') || 'local';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode((env.SALT || 'chalk-talk') + '|' + day() + '|' + ip));
  return [...new Uint8Array(d)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}
let ready = false;
async function db(env) {
  if (!env.DB) return null;
  if (!ready) { await env.DB.prepare('CREATE TABLE IF NOT EXISTS ai_usage (bucket TEXT PRIMARY KEY, n INTEGER NOT NULL)').run(); ready = true; }
  return env.DB;
}
async function bump(d, bucket, by) {
  const row = await d.prepare('INSERT INTO ai_usage (bucket, n) VALUES (?, ?) ON CONFLICT(bucket) DO UPDATE SET n = n + ? RETURNING n').bind(bucket, by, by).first();
  return row ? row.n : by;
}
async function peek(d, bucket) { const r = d ? await d.prepare('SELECT n FROM ai_usage WHERE bucket = ?').bind(bucket).first() : null; return r ? r.n : 0; }
// one more call of this kind for this caller, if today's caps allow it
async function settle(env, task, actual) {   // correct today's estimate to the real cost
  const d = await db(env); if (!d || !actual) return;
  await bump(d, `neurons:${day()}`, actual - LIMITS.estNeurons[task]);
}
async function allow(req, env, task) {
  const d = await db(env); if (!d) return true;
  const ip = await ipHash(req, env);
  if (await bump(d, `ip:${task}:${ip}`, 1) > LIMITS.perIp[task]) return false;
  if (await bump(d, `neurons:${day()}`, LIMITS.estNeurons[task]) > LIMITS.neuronsPerDay) return false;
  await bump(d, `calls:${day()}`, 1);
  return true;
}

// the open model, held to the schema: JSON-schema mode where the model supports it, else JSON mode
// with the schema in the prompt
export function asker(env, model, usage) {
  return async (sys, messages, schema) => {
    const msgs = [{ role: 'system', content: sys }].concat(messages.map(m => ({ role: m.role, content: String(m.content) })));
    const base = { messages: msgs, max_tokens: 4096, temperature: 0.2 };
    if (/gemma-4|qwen3|glm/.test(model)) base.chat_template_kwargs = { enable_thinking: false };
    let out;
    try { out = await env.AI.run(model, Object.assign({ response_format: { type: 'json_schema', json_schema: schema } }, base)); }
    catch (e) {
      const m2 = msgs.slice(); m2[0] = { role: 'system', content: sys + '\n\nReply with ONE JSON object matching this JSON Schema, and nothing else:\n' + JSON.stringify(schema) };
      out = await env.AI.run(model, Object.assign({}, base, { messages: m2, response_format: { type: 'json_object' } }));
    }
    if (usage && out && out.usage) { usage.in += out.usage.prompt_tokens || 0; usage.out += out.usage.completion_tokens || 0; }
    const r = out && (out.response != null ? out.response : out.choices && out.choices[0] && out.choices[0].message && out.choices[0].message.content);
    return typeof r === 'string' ? r : JSON.stringify(r);
  };
}

async function readJson(req) {
  const len = +(req.headers.get('content-length') || 0);
  if (len > LIMITS.maxJson) throw Object.assign(new Error('That request is too big.'), { status: 413 });
  const t = await req.text();
  if (t.length > LIMITS.maxJson) throw Object.assign(new Error('That request is too big.'), { status: 413 });
  try { return JSON.parse(t); } catch (e) { throw Object.assign(new Error('That isn’t JSON.'), { status: 400 }); }
}
const sportOf = s => { if (SPORTS.indexOf(s) < 0) throw Object.assign(new Error('Unknown sport.'), { status: 400 }); return getSport(s); };
const modelFor = (env, req) => (env.BENCH && req.headers.get('x-ct-model')) || env.PLAY_MODEL || MODELS.play;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url), path = url.pathname.replace(/^\/chalktalk\/api/, ''), h = cors(req.headers.get('origin'));
    if (!url.pathname.startsWith('/chalktalk/api/')) return env.ASSETS ? env.ASSETS.fetch(req) : new Response('Not found', { status: 404 });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    try {
      if (path === '/health' && req.method === 'GET') {
        const d = await db(env);
        return json({ ok: true, models: Object.assign({}, MODELS, { play: env.PLAY_MODEL || MODELS.play }), today: { calls: await peek(d, `calls:${day()}`), neurons_est: await peek(d, `neurons:${day()}`), cap: LIMITS.neuronsPerDay } }, 200, h);
      }
      if (req.method !== 'POST') return json({ error: 'Not found.' }, 404, h);
      if (!env.AI) return json({ error: 'The free AI is offline.' }, 503, h);

      if (path === '/play' || path === '/smart' || path === '/brain' || path === '/tutor' || path === '/analyst') {
        const body = await readJson(req), sport = sportOf(body.sport), task = path.slice(1);
        if (task === 'play' && !String(body.text || '').trim() && !body.sketch) return json({ error: 'Say or sketch a play first.' }, 400, h);
        if (task === 'smart' && (!body.play || !Array.isArray(body.ids) || !body.ids.length)) return json({ error: 'Pick a player to make smart.' }, 400, h);
        if (task === 'brain' && (!body.play || !/^[OX][1-9]$/.test(String(body.id || '')) || ['smart', 'film'].indexOf(body.mode) < 0)) return json({ error: 'Pick a player and a mode.' }, 400, h);
        if (task === 'analyst' && (!body.play || !Array.isArray(body.facts) || !body.facts.length || body.facts.length > 12)) return json({ error: 'Nothing to analyse.' }, 400, h);
        if (task === 'tutor' && (!body.q || ['answer', 'recap'].indexOf(body.mode) < 0)) return json({ error: 'Nothing to tutor.' }, 400, h);
        if (!(await allow(req, env, task))) return json({ error: 'The free AI is resting for today. Add your own Claude or OpenAI key to keep going.' }, 429, h);
        const req2 = task === 'play' ? playRequest({ sport, text: String(body.text || '').slice(0, 2000), current: body.current || null, sketch: !!body.sketch })
          : task === 'brain' ? brainRequest({ sport, play: body.play, id: String(body.id), mode: body.mode })
          : task === 'analyst' ? analystRequest({ sport, play: body.play, facts: body.facts.map(f => String(f).slice(0, 600)) })
          : task === 'tutor' ? tutorRequest({ sport, band: ['young', 'mid', 'older'].indexOf(body.band) >= 0 ? body.band : 'young', mode: body.mode, q: body.q, play: body.play || null, given: body.given == null ? null : body.given, right: !!body.right, summary: body.summary || null })
          : smartRequest({ sport, play: body.play, ids: body.ids.map(String).filter(id => /^[OX][1-9]$/.test(id)).slice(0, 7) });
        // plays: Gemma first (fast, cheap), then Llama 3.3 70B gets one go. Brains: GLM 4.7 Flash,
        // then Gemma. Every call is charged what it really cost.
        const t0 = Date.now(), forced = env.BENCH && req.headers.get('x-ct-model');
        const chain = forced ? [forced] : task === 'brain' || task === 'tutor' || task === 'analyst' ? [env.BRAIN_MODEL || MODELS.brain, MODELS.play] : [modelFor(env, req), MODELS.fallback];
        let raw = null, model = null, err = null, spent = 0;
        const used = { in: 0, out: 0 };
        for (const m of chain) {
          const usage = { in: 0, out: 0 };
          try { raw = await solve(req2, asker(env, m, usage)); model = m; } catch (e) { err = e; }
          spent += neuronsFor(m, usage.in, usage.out); used.in += usage.in; used.out += usage.out;
          if (raw) break;
        }
        ctx && ctx.waitUntil ? ctx.waitUntil(settle(env, task, spent)) : await settle(env, task, spent);
        if (!raw) throw err;
        return json(raw, 200, Object.assign({ 'x-ct-model': model, 'x-ct-ms': String(Date.now() - t0), 'x-ct-neurons': String(spent), 'x-ct-in': String(used.in), 'x-ct-out': String(used.out), 'access-control-expose-headers': 'x-ct-model, x-ct-ms, x-ct-neurons, x-ct-in, x-ct-out' }, h));
      }

      if (path === '/hear') {
        const len = +(req.headers.get('content-length') || 0);
        if (len > LIMITS.maxAudio) return json({ error: 'That recording is too long. Keep it under a minute.' }, 413, h);
        const buf = await req.arrayBuffer();
        if (!buf.byteLength) return json({ error: 'No audio.' }, 400, h);
        if (buf.byteLength > LIMITS.maxAudio) return json({ error: 'That recording is too long. Keep it under a minute.' }, 413, h);
        if (!(await allow(req, env, 'hear'))) return json({ error: 'The free listener is resting for today.' }, 429, h);
        let b64 = '', bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.length; i += 0x8000) b64 += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        ctx && ctx.waitUntil && ctx.waitUntil(settle(env, 'hear', Math.ceil(buf.byteLength / 32000 / 60 * 0.00051 / 0.011 * 1000) || 1));   // ≈ $0.00051 an audio minute
        const out = await env.AI.run(MODELS.hear, { audio: btoa(b64), language: 'en', initial_prompt: hearPrompt(url.searchParams.get('sport')), vad_filter: true });
        return json({ text: String((out && out.text) || '').trim() }, 200, h);
      }

      if (path === '/say') {
        const body = await readJson(req), text = String(body.text || '').trim();
        if (!text) return json({ error: 'Nothing to say.' }, 400, h);
        if (text.length > LIMITS.maxSay) return json({ error: 'That line is too long.' }, 413, h);
        const keyUrl = new URL('https://chalk-talk.cache/say/' + encodeURIComponent(MODELS.say) + '/' + [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(b => b.toString(16).padStart(2, '0')).join(''));
        const cache = typeof caches !== 'undefined' ? caches.default : null;
        const hit = cache && await cache.match(keyUrl);
        if (hit) { const r = new Response(hit.body, hit); Object.entries(h).forEach(([k, v]) => r.headers.set(k, v)); r.headers.set('x-ct-cache', 'hit'); return r; }
        if (!(await allow(req, env, 'say'))) return json({ error: 'The free voice is resting for today.' }, 429, h);
        const out = await env.AI.run(MODELS.say, { prompt: text, lang: 'en' });
        const audio = out && out.audio ? Uint8Array.from(atob(out.audio), c => c.charCodeAt(0)) : out;
        const wav = audio && audio[0] === 0x52 && audio[1] === 0x49 && audio[2] === 0x46 && audio[3] === 0x46;   // "RIFF": MeloTTS answers in WAV
        const res = new Response(audio, { headers: { 'content-type': wav ? 'audio/wav' : 'audio/mpeg', 'cache-control': 'public, max-age=2592000' } });
        if (cache) ctx && ctx.waitUntil ? ctx.waitUntil(cache.put(keyUrl, res.clone())) : await cache.put(keyUrl, res.clone());
        const r = new Response(res.body, res); Object.entries(h).forEach(([k, v]) => r.headers.set(k, v)); return r;
      }
      return json({ error: 'Not found.' }, 404, h);
    } catch (e) {
      // the account's shared free Workers AI allowance ran out for today: same answer as our own cap
      if (/4006|daily free allocation/i.test(String(e && e.message))) return json({ error: 'The free AI is resting for today. Add your own Claude or OpenAI key to keep going.' }, 429, h);
      const status = e.status || 502;
      if (status >= 500) console.error('chalk-talk api', path, (e && e.message) || e);   // the error only, never the request
      return json({ error: status < 500 ? e.message : 'The free AI stumbled. Try again in a moment.' }, status, h);
    }
  }
};
