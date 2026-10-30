# Chalk Talk: notes for agents

Read README.md first. Zero-build ES modules; the only dependency is aurora-field (pinned).

## Layout
- `src/engine/` is pure and sport-agnostic: `sim.js` (normalize + compile a play into a timeline; defenders' man/zone/rush jobs), `field.js` (the aurora shape + view + particle budget), `geom.js`, `football.js` (route tree, coverages, QB reads).
- `src/sports/` is data: one pack per sport (`basketball.js`, `flag.js` → flag5/flag7) and its plays. Never put sport rules in the engine.
- `src/ui.js` mounts everything in one element; `src/style.js` is scoped under `.ct`. `src/ai.js` builds the schema and briefing from the sport pack; `src/voice.js` is speech in/out and the offline command grammar.
- `research/` holds the cited glossaries; `npm run glossary` regenerates `src/sports/basketball-glossary.js`.

## Invariants
- X's and O's only, never real player names. Basketball offense = positional number (1 PG … 5 C); football = position letters (QB, C, X, Z, Y, H, RB; defense R, CB, S, LB, N). Defender Xn guards On unless a coverage gives it a job.
- Only the ball holder dribbles, passes, hands off or shoots/throws. `npm test` enforces it for every library play.
- Keys never leave the browser except to the provider they belong to. No server, no analytics.

## Environment nuances
- `npm run up` installs (idempotent) and serves on **8795** (8790 is taken by another local server). The dev server maps `vendor/aurora-field.mjs` to `node_modules`; the build copies it.
- Deploy: `npm run deploy` (local wrangler auth). The Worker route `mutaafaziz.com/chalktalk*` beats the site's Custom Domain, like hearth/coldgas.
- aurora-field keeps every shape a field has shown; the UI recreates the field every ~24 plays to bound memory. A `field.remove()` upstream would make that unnecessary.

## The free AI (src/worker)
- `/chalktalk/api/*` runs the Worker (`assets.run_worker_first`); everything else is static assets. digitalcraftai.com proxies `/api/chalktalk/*` here (a Vercel rewrite in digital-craft-architect `vercel.json`). The client picks the base in `src/ai.js` (`setApi`).
- Prompts, schemas, validation and the repair round come from `src/ai.js` (`playRequest`, `smartRequest`, `brainRequest`, `solve`), so the free path and BYOK draw the same plays.
- **Models (benchmarked 2026-10-30 on real calls: the DHO description, a flag5 trips call, a sketch takeover, smart players; brains: 12 parallel smart/film calls on pick-and-roll and smash):**
  - play/smart: `@cf/google/gemma-4-26b-a4b-it` (thinking off). 10/12 clean, the rest usable after normalize. p50 ≈ 20–30 s, ~5k in / ~1.1k out tokens ≈ 80 neurons a call. Falls back to `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (4/4 clean but 18–48 s and ≈ 380 neurons).
  - brain: `@cf/zai-org/glm-4.7-flash`. 12/12 valid, p50 7.6 s, all 12 in parallel done in 17 s, ≈ 35 neurons. Falls back to Gemma (12/12, p50 14 s, ≈ 43).
  - Rejected: llama-3.1-8b (5/12 brains), qwen3-30b-a3b (0/4 plays), gpt-oss-120b (slow, 60–140 s), llama-4-scout (12/12 brains but ≈ 170 neurons and a 90 s straggler). GLM on full plays was 7/8 but slower and mislabeled concepts.
  - hear: `@cf/openai/whisper-large-v3-turbo` (~2 s; transcribed "O1 … 5 sets the ball screen" exactly). say: `@cf/myshell-ai/melotts` (~2 s, returns WAV; cached 30 days by text hash).
- **Caps** (`LIMITS`): per hashed IP per UTC day: 40 play, 20 smart, 200 brain, 60 hear, 150 say. Globally 3,500 neurons a day (estimated up front, then corrected to tokens × price), which leaves the shared 10k free allowance room for COLD GAS and Hearth. That's roughly 40 free plays, or ~100 brains, a day; a 429 tells the coach to add a key. Behind the Vercel proxy the per-IP bucket uses the forwarded client IP.
- D1 `chalk-talk` holds only hashed-IP counters (provisioned by name on first deploy). Never log request text or audio.
- Tests: `test/worker.test.mjs` (stub AI + D1). Live checks used a route-less preview Worker (`BENCH=1` honours an `x-ct-model` header to force a model); it was deleted afterwards.
