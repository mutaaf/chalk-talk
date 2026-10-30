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
