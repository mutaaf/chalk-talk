// Under the hood: says what the AI does for a coach, hints at the craft, never gives away the recipe.
import assert from 'node:assert/strict';
import { LAYERS, PRIVATE, numbers, howChip } from '../src/howai.js';

const all = JSON.stringify([LAYERS, PRIVATE]);
for (const secret of [/haiku|sonnet|opus|claude|gpt|openai|gemini|gemma|llama|glm|whisper|cloudflare|workers ai/i, /json|schema|prompt|token|temperature|effort/i, /\bsystem\b/i])
  assert.ok(!secret.test(all), 'the explainer never names ' + secret);
assert.equal(new Set(LAYERS.map(l => l.id)).size, LAYERS.length);
LAYERS.forEach(l => assert.ok(l.name && l.line && l.body && l.hint, l.id));
['ears', 'draft', 'engine', 'board', 'minds', 'iq'].forEach(id => assert.ok(LAYERS.some(l => l.id === id), 'a layer for ' + id));
assert.match(howChip('engine'), /data-how="engine"/); assert.match(howChip('iq', '<x>'), /&lt;x&gt;/);
const N = numbers([{ path: 'library' }, { path: 'command' }, { path: 'ai' }, { path: 'ai', ok: false }, { path: 'history' }],
  [{ task: 'play', ok: true, ms: 9000 }, { task: 'play', ok: true, ms: 12000 }, { task: 'play', ok: true, ms: 8000 }, { task: 'brain', ok: true, ms: 1 }, { task: 'play', provider: 'free', model: 'cache', ok: true, ms: 0 }, { task: 'brain', provider: 'cache' }]);
assert.equal(N.said, 4); assert.equal(N.instant, 3); assert.equal(N.pct, 75); assert.equal(N.aiMs, 9000); assert.equal(N.cached, 1);
assert.deepEqual(numbers([], []), { said: 0, instant: 0, pct: null, aiMs: null, aiN: 0, cached: 0 });
console.log('ok: the explainer tells what it does, hints, and keeps the recipe');
