// Chalk Talk's free AI, for coaches without their own key: open models on Cloudflare Workers AI.
// Runs only for /chalktalk/api/*; everything else on the route is static assets.
//   POST /chalktalk/api/play   {sport, text, current, sketch}  → a play (same JSON as the BYOK path)
//   POST /chalktalk/api/smart  {sport, play, ids}               → smart players' moves and thoughts
//   POST /chalktalk/api/brain  {sport, play, id, mode}           → one position's brain (smart moves, or a film-room read), lite model
//   POST /chalktalk/api/tutor  {sport, band, mode, q, play, given, right, summary} → the IQ tutor's line, lite model
//   POST /chalktalk/api/analyst {sport, play, facts}          → booth commentary, one line per beat, lite model
//   POST /chalktalk/api/hear   audio (webm/mp4/wav, ≤ 2 MB)     → {text}   (Whisper)
//   POST /chalktalk/api/say    {text ≤ 300 chars}                → audio    (MeloTTS, cached)
//   POST /chalktalk/api/learn  {kind, sport, text, concept, kept | a, b} → opt-in voice learning (names scrubbed on the device)
//   GET  /chalktalk/api/lexicon                                 → phrases and word fixes 3+ coaches confirmed
//   POST /chalktalk/api/event  {ctx, events[]}                → anonymous usage analytics (no cookies, no IPs, daily-rotating visitor hash)
//   GET  /chalktalk/api/stats  Bearer STATS_TOKEN              → the owner's analytics rollup (for /chalktalk/admin)
//   GET  /chalktalk/api/health                                   → {ok, models, today}
// Prompts, schemas, validation and the one repair round are src/ai.js's, shared with the browser.
// Requests carry X's and O's only (player names never leave the coach's device); nothing is stored
// but hashed-IP counters, and (only from coaches who opt in) the words of plays they kept and words
// they fixed, keyed by a salted hash, deleted after 180 days.

import { requestFor, TASKS, LITE, solve } from '../server.js';
import { getSport } from '../sports/index.js';

// Free users get Claude Haiku 5.5 (far more accurate than the open models: 96% vs ~83% on npm run eval) when the
// Worker has an ANTHROPIC_API_KEY secret, inside a daily dollar cap; past it, or if Anthropic errors, the open
// models below take over, so the free board never stops.
export const HAIKU = 'claude-haiku-5-5';
const HAIKU_PRICE = [0.1, 0.5, 0.01, 0.125];   // USD per million tokens: in, out, cache read, cache write
export const haikuMicros = u => Math.ceil(u.in * HAIKU_PRICE[0] + u.out * HAIKU_PRICE[1] + (u.cr || 0) * HAIKU_PRICE[2] + (u.cw || 0) * HAIKU_PRICE[3]);
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
  perIp: { event: 400, learn: 300, play: 40, smart: 20, brain: 200, tutor: 300, analyst: 80, hear: 60, say: 150 },
  neuronsPerDay: 3500,
  // charged up front, then corrected to what the call really cost (tokens × price, below)
  lexiconMin: 3,
  claudeMicrosPerDay: 5_000_000,   // $5 a day of Haiku for everyone together (≈ 3,000 free plays); then the open models   // distinct coaches before a phrase or a fix is shared with everyone
  estNeurons: { event: 0, learn: 0, play: 85, smart: 80, brain: 35, tutor: 15, analyst: 30, hear: 8, say: 4 },
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
// a stable pseudonym for counting distinct coaches (salted, not reversible, not tied to a day)
async function whoHash(req, env) {
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode((env.SALT || 'chalk-talk') + '|who|' + ip));
  return [...new Uint8Array(d)].slice(0, 10).map(b => b.toString(16).padStart(2, '0')).join('');
}
// analytics: a visitor is a salted hash of (day, IP, browser) that rotates daily, so a person can't be
// followed across days and no IP is ever stored; browser and OS are reduced to a family name
async function visitorHash(req, env) {
  const ip = req.headers.get('cf-connecting-ip') || 'local', ua = req.headers.get('user-agent') || '';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode((env.SALT || 'chalk-talk') + '|v|' + day() + '|' + ip + '|' + ua));
  return [...new Uint8Array(d)].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}
export const browserOf = ua => /Edg\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : /bot|crawl|spider/i.test(ua) ? 'Bot' : 'Other';
export const osOf = ua => /iPhone/.test(ua) ? 'iOS' : /iPad/.test(ua) ? 'iPadOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Other';
async function rollup(d, days) {
  const since = new Date(Date.now() - (days - 1) * 864e5).toISOString().slice(0, 10), all = async (sql, ...a) => ((await d.prepare(sql).bind(since, ...a).all()).results || []);
  const top = col => all(`SELECT ${col} k, COUNT(DISTINCT visitor || day) visitors, COUNT(*) events FROM events WHERE day >= ? AND name = 'view' GROUP BY ${col} ORDER BY visitors DESC LIMIT 25`);
  const [daily, countries, cities, devices, browsers, oses, hosts, refs, sports, ais, features, voice, iq, recent, ai] = await Promise.all([
    all("SELECT day, COUNT(DISTINCT visitor) visitors, SUM(name = 'view') views, COUNT(*) events FROM events WHERE day >= ? GROUP BY day ORDER BY day"),
    top('country'), all("SELECT city || ', ' || COALESCE(region, '') || ' ' || COALESCE(country, '') k, COUNT(DISTINCT visitor || day) visitors FROM events WHERE day >= ? AND name = 'view' AND city IS NOT NULL GROUP BY k ORDER BY visitors DESC LIMIT 25"),
    top('device'), top('browser'), top('os'), top('host'), top('ref'), top('sport'), top('ai'),
    all("SELECT name k, COUNT(DISTINCT visitor || day) visitors, COUNT(*) events FROM events WHERE day >= ? AND name != 'view' GROUP BY name ORDER BY visitors DESC"),
    all("SELECT json_extract(props, '$.path') k, COUNT(*) events, ROUND(AVG(json_extract(props, '$.ms'))) ms, SUM(json_extract(props, '$.ok') = 1) ok FROM events WHERE day >= ? AND name = 'voice' GROUP BY k ORDER BY events DESC"),
    all("SELECT json_extract(props, '$.band') k, COUNT(*) sessions, ROUND(AVG(json_extract(props, '$.right') * 100.0 / json_extract(props, '$.of'))) pct FROM events WHERE day >= ? AND name = 'iq_done' GROUP BY k"),
    all("SELECT ts, name, country, city, device, browser, os, host, sport, props FROM events WHERE day >= ? ORDER BY ts DESC LIMIT 60"),
    (async () => { const r = await d.prepare("SELECT bucket, n FROM ai_usage WHERE bucket LIKE 'neurons:%' OR bucket LIKE 'calls:%' OR bucket LIKE 'usd:%' OR bucket LIKE 'cache:%'").all(); return (r.results || []).filter(x => x.bucket.split(':')[1] >= since); })()
  ]);
  const tot = daily.reduce((a, r) => ({ visitors: a.visitors + r.visitors, views: a.views + r.views, events: a.events + r.events }), { visitors: 0, views: 0, events: 0 });
  const learn = await d.prepare("SELECT COUNT(*) n, COUNT(DISTINCT who) coaches FROM voice_learn WHERE day >= ?").bind(since).first().catch(() => null);
  return { days, since, totals: tot, daily, countries, cities, devices, browsers, oses, hosts, refs, sports, ais, features, voice, iq, recent, ai, learn };
}
const ready = new WeakSet();   // per database binding
async function db(env) {
  if (!env.DB) return null;
  if (!ready.has(env.DB)) {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS ai_usage (bucket TEXT PRIMARY KEY, n INTEGER NOT NULL)').run();
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS events (day TEXT NOT NULL, ts INTEGER NOT NULL, visitor TEXT NOT NULL, name TEXT NOT NULL, country TEXT, region TEXT, city TEXT, device TEXT, browser TEXT, os TEXT, host TEXT, ref TEXT, sport TEXT, ai TEXT, props TEXT)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS events_day ON events (day)').run();
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS ai_cache (k TEXT PRIMARY KEY, task TEXT NOT NULL, v TEXT NOT NULL, hits INTEGER NOT NULL DEFAULT 0, at TEXT NOT NULL, last TEXT)').run();
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS voice_learn (day TEXT NOT NULL, sport TEXT NOT NULL, kind TEXT NOT NULL, a TEXT NOT NULL, b TEXT NOT NULL, kept INTEGER NOT NULL, who TEXT NOT NULL)').run();
    ready.add(env.DB);
  }
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
// ---- the shared answer cache: the same question gets the same (checked) answer, instantly and free ----
// The key is a SHA-256 of the task, the full system prompt (so a prompt change starts a fresh cache) and what was
// asked. A fresh play ("run Spain pick and roll") matches on the words alone, whatever was on the board; an edit
// ("now have 5 pop") matches only the very same board; "another / different / new" is never served from cache.
// Only the hash is stored, never the words; the value is the play (X's and O's). Entries live 30 days.
const EDITY = /\b(change|instead|now|also|then|make|move|add|remove|swap|switch|flip|mirror|again|same|but|more|less|faster|slower|wider|deeper)\b/;
const FRESHY = /\b(another|different|new|random|surprise|else|variation|other)\b/;
const normText = t => String(t || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
async function sha(s) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join(''); }
export async function cacheKeyFor(task, body, req2) {
  let ask = body;
  if (task === 'play') {
    const n = normText(body.text);
    if (FRESHY.test(n)) return null;
    ask = { sport: body.sport, text: n, sketch: !!body.sketch, coach: body.coach || null, board: body.sketch || EDITY.test(n) ? body.current || null : null };
  }
  return sha(task + '|' + req2.sys + '|' + JSON.stringify(req2.schema) + '|' + JSON.stringify(ask));
}
const CACHE_DAYS = 30;

// one Haiku call (the browser's BYOK path does the same with the coach's key)
export function claudeAsker(env, usage) {
  return async (sys, messages, schema) => {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: HAIKU, max_tokens: 6000, system: [{ type: 'text', text: sys, cache_control: { type: 'ephemeral' } }],
        output_config: { effort: 'low', format: { type: 'json_schema', schema } }, messages }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error((j.error && j.error.message) || 'Claude answered ' + r.status), { status: r.status });
    const u = j.usage || {};
    usage.in += u.input_tokens || 0; usage.out += u.output_tokens || 0; usage.cr = (usage.cr || 0) + (u.cache_read_input_tokens || 0); usage.cw = (usage.cw || 0) + (u.cache_creation_input_tokens || 0);
    if (j.stop_reason === 'refusal') throw new Error('It wouldn’t draw that one. Try describing it another way.');
    return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  };
}
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
        return json({ ok: true, models: Object.assign({}, MODELS, { play: env.PLAY_MODEL || MODELS.play }), today: { calls: await peek(d, `calls:${day()}`), neurons_est: await peek(d, `neurons:${day()}`), cap: LIMITS.neuronsPerDay, haiku_usd: (await peek(d, `usd:${day()}`)) / 1e6, haiku_cap_usd: LIMITS.claudeMicrosPerDay / 1e6, haiku: !!env.ANTHROPIC_API_KEY, cache: d ? await d.prepare('SELECT COUNT(*) entries, COALESCE(SUM(hits), 0) hits FROM ai_cache').first().catch(() => null) : null } }, 200, h);
      }
      if (path === '/stats' && req.method === 'GET') {
        if (!env.STATS_TOKEN || req.headers.get('authorization') !== 'Bearer ' + env.STATS_TOKEN) return json({ error: 'Not authorized.' }, 401, h);
        const d = await db(env); if (!d) return json({ error: 'No database.' }, 503, h);
        return json(await rollup(d, Math.max(1, Math.min(365, +url.searchParams.get('days') || 30))), 200, h);
      }
      if (path === '/event' && req.method === 'POST') {
        const body = await readJson(req), d = await db(env);
        const events = Array.isArray(body.events) ? body.events.slice(0, 40) : [];
        if (!d || !events.length || !(await allow(req, env, 'event'))) return new Response(null, { status: 204, headers: h });
        const c = body.ctx || {}, cf = req.cf || {}, ua = req.headers.get('user-agent') || '', s = v => (v == null ? null : String(v).slice(0, 60));
        const visitor = await visitorHash(req, env), dev = s(c.device), br = browserOf(ua), os = osOf(ua);
        const stmt = d.prepare('INSERT INTO events (day, ts, visitor, name, country, region, city, device, browser, os, host, ref, sport, ai, props) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        const rows = events.map(e => stmt.bind(day(), Date.now(), visitor, String(e.n || '').slice(0, 32), s(cf.country), s(cf.region), s(cf.city), dev, br, os, s(c.host), s(e.n === 'view' ? c.ref : null), s(c.sport), s(c.ai), JSON.stringify(e.p || {}).slice(0, 300)));
        await (d.batch ? d.batch(rows) : Promise.all(rows.map(r => r.run())));
        if (Math.random() < 0.01) ctx && ctx.waitUntil && ctx.waitUntil(d.prepare("DELETE FROM events WHERE day < date('now', '-400 days')").run());
        return new Response(null, { status: 204, headers: h });
      }
      if (path === '/lexicon' && req.method === 'GET') {
        const d = await db(env), out = { words: {}, phrases: {} };
        if (d) {
          const n = LIMITS.lexiconMin;
          const ph = await d.prepare("SELECT sport, a, b, COUNT(DISTINCT who) n FROM voice_learn WHERE kind = 'phrase' GROUP BY sport, a, b HAVING n >= ? AND AVG(kept) >= 0.7 ORDER BY n DESC LIMIT 400").bind(n).all();
          (ph.results || []).forEach(r => { (out.phrases[r.sport] = out.phrases[r.sport] || {})[r.a] = r.b; });
          const wd = await d.prepare("SELECT a, b, COUNT(DISTINCT who) n FROM voice_learn WHERE kind = 'word' GROUP BY a, b HAVING n >= ? ORDER BY n DESC LIMIT 300").bind(n).all();
          (wd.results || []).forEach(r => { if (!out.words[r.a]) out.words[r.a] = r.b; });
        }
        return json(out, 200, Object.assign({ 'cache-control': 'public, max-age=3600' }, h));
      }
      if (req.method !== 'POST') return json({ error: 'Not found.' }, 404, h);
      if (!env.AI) return json({ error: 'The free AI is offline.' }, 503, h);

      const task = path.slice(1);
      if (TASKS.indexOf(task) >= 0) {
        const body = await readJson(req);
        let req2;
        try { req2 = requestFor(task, body); } catch (e) { return json({ error: e.message }, e.status || 400, h); }
        // a question asked before: the same checked answer, instantly, free, and not counted against anyone's caps
        const dc = await db(env), ck = dc ? await cacheKeyFor(task, body, req2) : null;
        if (ck) {
          const hit = await dc.prepare(`SELECT v FROM ai_cache WHERE k = ? AND at >= date('now', '-${CACHE_DAYS} days')`).bind(ck).first();
          if (hit) {
            const touch = Promise.all([dc.prepare('UPDATE ai_cache SET hits = hits + 1, last = ? WHERE k = ?').bind(day(), ck).run(), bump(dc, `cache:${day()}`, 1)]);
            ctx && ctx.waitUntil ? ctx.waitUntil(touch) : await touch;
            return json(JSON.parse(hit.v), 200, Object.assign({ 'x-ct-model': 'cache', 'x-ct-cache': 'hit', 'x-ct-ms': '0', 'access-control-expose-headers': 'x-ct-model, x-ct-cache, x-ct-ms' }, h));
          }
        }
        // the owner pre-filling the cache (scripts/prewarm-cache.mjs) isn't held to one person's daily caps
        const owner = env.STATS_TOKEN && req.headers.get('x-ct-prewarm') === env.STATS_TOKEN;
        if (!owner && !(await allow(req, env, task))) return json({ error: 'The free AI is resting for today. Add your own Claude or OpenAI key to keep going.' }, 429, h);
        // plays: Gemma first (fast, cheap), then Llama 3.3 70B gets one go. Brains: GLM 4.7 Flash,
        // then Gemma. Every call is charged what it really cost.
        const t0 = Date.now(), forced = env.BENCH && req.headers.get('x-ct-model');
        let chain = forced ? [forced] : LITE[task] ? [env.BRAIN_MODEL || MODELS.brain, MODELS.play] : [modelFor(env, req), MODELS.fallback];
        const d0 = await db(env), budget = d0 ? await peek(d0, `usd:${day()}`) : 0;
        if (!forced && env.ANTHROPIC_API_KEY && budget < LIMITS.claudeMicrosPerDay) chain = [HAIKU].concat(chain);
        let raw = null, model = null, err = null, spent = 0, micros = 0;
        const used = { in: 0, out: 0 };
        for (const m of chain) {
          const usage = { in: 0, out: 0 };
          try { raw = await solve(req2, m === HAIKU ? claudeAsker(env, usage) : asker(env, m, usage)); model = m; } catch (e) { err = e; }
          if (m === HAIKU) micros += haikuMicros(usage); else spent += neuronsFor(m, usage.in, usage.out);
          used.in += usage.in; used.out += usage.out;
          if (raw) break;
        }
        ctx && ctx.waitUntil ? ctx.waitUntil(settle(env, task, spent)) : await settle(env, task, spent);
        if (micros && d0) { const b = bump(d0, `usd:${day()}`, micros); ctx && ctx.waitUntil ? ctx.waitUntil(b) : await b; }
        if (raw && ck) {   // remember the checked answer for the next coach who asks the same thing
          const put = dc.prepare('INSERT INTO ai_cache (k, task, v, hits, at) VALUES (?, ?, ?, 0, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, at = excluded.at').bind(ck, task, JSON.stringify(raw), day()).run();
          ctx && ctx.waitUntil ? ctx.waitUntil(put) : await put;
          if (Math.random() < 0.01) { const old = dc.prepare(`DELETE FROM ai_cache WHERE at < date('now', '-${CACHE_DAYS} days')`).run(); ctx && ctx.waitUntil ? ctx.waitUntil(old) : await old; }
        }
        if (!raw) throw err;
        return json(raw, 200, Object.assign({ 'x-ct-model': model, 'x-ct-ms': String(Date.now() - t0), 'x-ct-neurons': String(spent), 'x-ct-usd': (micros / 1e6).toFixed(5), 'x-ct-in': String(used.in), 'x-ct-out': String(used.out), 'access-control-expose-headers': 'x-ct-model, x-ct-ms, x-ct-neurons, x-ct-in, x-ct-out' }, h));
      }

      if (path === '/learn') {
        const body = await readJson(req), d = await db(env);
        const clean = v => String(v || '').toLowerCase().replace(/[^a-z0-9 \[\]]+/g, ' ').replace(/\s+/g, ' ').trim();
        let row = null;
        if (body.kind === 'phrase' && SPORTS.indexOf(body.sport) >= 0) {
          const text = clean(body.text).slice(0, 160), key = String(body.concept || '');
          if (text && text.split(' ').length <= 8 && !/\[name\]/.test(text) && getSport(body.sport).plays.some(p => p.key === key)) row = [body.sport, 'phrase', text, key, body.kept ? 1 : 0];
        } else if (body.kind === 'word') {
          const a = clean(body.a).slice(0, 40), b = clean(body.b).slice(0, 40);
          if (a && b && a !== b && !/\[name\]/.test(a + b)) row = ['any', 'word', a, b, 1];
        }
        if (!row) return json({ error: 'Nothing to learn.' }, 400, h);
        if (!d || !(await allow(req, env, 'learn'))) return json({ ok: true }, 200, h);   // over the cap: drop it quietly
        const who = await whoHash(req, env);
        await d.prepare('INSERT INTO voice_learn (day, sport, kind, a, b, kept, who) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(day(), row[0], row[1], row[2], row[3], row[4], who).run();
        if (Math.random() < 0.02) ctx && ctx.waitUntil && ctx.waitUntil(d.prepare("DELETE FROM voice_learn WHERE day < date('now', '-180 days')").run());
        return json({ ok: true }, 200, h);
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
