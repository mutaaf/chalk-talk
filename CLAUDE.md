# Chalk Talk: notes for agents

Read README.md first. Zero-build ES modules; the only dependency is aurora-field (pinned).

## Layout
- `src/engine/` is pure and sport-agnostic: `sim.js` (normalize + compile a play into a timeline; defenders' man/zone/rush jobs), `field.js` (the aurora shape + view + particle budget), `geom.js`, `football.js` (route tree, coverages, QB reads).
- `src/sports/` is data: one pack per sport (`basketball.js`, `flag.js` → flag5/flag7) and its plays. Never put sport rules in the engine.
- `src/ui.js` mounts everything in one element; `src/style.js` is scoped under `.ct`. `src/ai.js` builds the schema and briefing from the sport pack; `src/voice.js` is speech in/out and the offline command grammar.
- `src/guide.js` (positions guide + mini boards), `src/iqmode.js` (CourtIQ / FieldIQ game) on `src/engine/iq.js` (pure: questions cut from library plays, Elo, levels, likeness), `src/stats.js` (play numbers, voice, AI meter), `src/analyst.js` (booth commentary from the engine), `src/learn.js` (voice healing + on-device learning), `src/sound.js` (synthesized cues). Position/IQ data lives in the sport packs (`basketball-positions.js`, `flag-positions.js`).
- `research/` holds the cited glossaries; `npm run glossary` regenerates `src/sports/basketball-glossary.js`.

## Invariants
- X's and O's only, never real player names. Basketball offense = positional number (1 PG … 5 C); football = position letters (QB, C, X, Z, Y, H, RB; defense R, CB, S, LB, N). Defender Xn guards On unless a coverage gives it a job.
- Only the ball holder dribbles, passes, hands off or shoots/throws. `npm test` enforces it for every library play.
- Real pro names appear only as IQ likeness labels (archetypes in the positions files), never on the board.
- Passes lead the receiver: a cut followed by a catch next beat spills into the catch beat (sim.js `carry`), and the ball flies to the catch point. Defenders line up on their side of the ball (flag `guard`, `unguarded`); basketball help comes only on a real drive (`sport.help`, `helperOf`); flag defenders rally after the catch.
- Voice gets better with use, on the device only: `heal()` fixes mishearings (built-in table + the coach's corrections from tapping the transcript), `recall()`/`teach()` turn a phrase the coach kept into an instant offline shortcut, and every attempt's path/timing/outcome is logged locally (Stats → Voice). `test/voice.test.mjs` is the regression corpus: add every real miss there. Nothing said is sent anywhere except to the AI that draws the play.
- The AI meter (`meter` in ai.js) records model, tokens, cache, latency and estimated cost per call in localStorage; prices in `PRICES`. The worker returns `x-ct-in/out/neurons` headers for it.
- Keys never leave the browser except to the provider they belong to. The only server is the free open-model Worker (src/worker), which stores nothing but hashed-IP counters. No analytics. Player names never leave the device.

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
- `/tutor` (IQ tutor, age band only, never a nickname) and `/analyst` (booth lines) run on the brain chain. `/hear` gets a sport vocabulary `initial_prompt` (`?sport=`).
- Tests: `test/worker.test.mjs` (stub AI + D1). Live checks used a route-less preview Worker (`BENCH=1` honours an `x-ct-model` header to force a model); it was deleted afterwards.

## Environment nuances
- `npm run up` installs (idempotent) and serves on **8795** (8790 is taken by another local server). The dev server maps `vendor/aurora-field.mjs` to `node_modules`; the build copies it.
- Deploy: `npm run deploy` (local wrangler auth). The Worker route `mutaafaziz.com/chalktalk*` beats the site's Custom Domain, like hearth/coldgas.
- aurora-field keeps every shape a field has shown; the UI recreates the field every ~24 plays to bound memory. A `field.remove()` upstream would make that unnecessary.
