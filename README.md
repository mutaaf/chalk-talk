# Chalk Talk

Say a play out loud, or sketch it, and watch it draw itself in light. X's and O's for youth
coaches, on an [aurora-field](https://github.com/mutaaf/aurora-field) court: basketball, flag
football 5v5 and 7v7, and any sport you add as a data file.

**Live:** https://mutaafaziz.com/chalktalk/ · also inside [CourtIQ](https://github.com/mutaaf/courtiq) → Labs

- **Talk:** "1 dribbles to the right wing, 5 sets the ball screen and rolls" or "trips right, Z runs a corner, the slot runs a drag". Commands (next, back, again, slower, show defense, label 5 the big, cover 2, half field right, find the open man) work offline.
- **Sketch:** tap the field to drop players, drag from a player to draw what they do. It plays at once; then the AI takes over: it names the concept ("Looks like Pick and Roll"), proposes a clean version and 2–3 coaching suggestions. Use it or keep yours.
- **Learn:** a concept library per sport (26 basketball concepts from spacing to Spain pick-and-roll, ICE and hedge coverages; 13 flag 5v5 and 13 flag 7v7 concepts from mesh and stick to four verts, Y-cross and Cover 2/3), each with a kid-friendly explanation, cues to shout and the options it creates.
- **Football tools:** the route tree (0–9 plus drag, seam, wheel) on any receiver, coverages (Man, Cover 1, 2, 3, 4) with shaded zones and defenders who play them on their own, and the QB's eyes: half-field or full-field reads, a cone sweeping the progression, every read lit by live separation, and "find the open man".
- **Conventions:** basketball offense is the positional number (1 point guard … 5 center) in a circle, defense an X with its man's number. Football offense is lettered by position (Q, C in a square, X/Z outside, Y/H inside, RB), defense by job (R, CB, S, LB, N). Solid arrow = cut or route, zigzag = dribble, dashed = pass, T-bar = screen.
- **Bring your own key:** Claude or OpenAI for plays (the key is recognised, kept in this browser and sent only to that provider), and OpenAI or ElevenLabs for the play-by-play broadcaster voice. Without keys you get the library, sketching, commands and the device's most natural voice.

## The free AI (no key needed)

Coaches without a key get open models on Cloudflare Workers AI, served by `src/worker` at
`mutaafaziz.com/chalktalk/api/*` and proxied at `digitalcraftai.com/api/chalktalk/*`:

| | |
|---|---|
| `POST play` `{sport, text, current, sketch}` | a play, built with the same prompt, schema, validation and repair round as the BYOK path |
| `POST smart` `{sport, play, ids}` | smart players: each chosen position's move and thought per beat |
| `POST hear` audio ≤ 2 MB | `{text}` via Whisper, for browsers and installed apps without Web Speech |
| `POST say` `{text ≤ 300}` | audio via MeloTTS (cached) |
| `GET health` | models and today's usage |

Requests carry X's and O's only (player names stay on the coach's device). Nothing is stored except
hashed-IP daily counters. Daily caps keep it inside the free Workers AI allowance; a 429 says to
add a key.

## Use it in an app

```js
import { mount } from 'chalk-talk';            // npm i github:mutaaf/chalk-talk
const board = mount(element, { sport: 'flag7', play: 'smash' });   // sport: basketball | flag5 | flag7 | "flag football"…
board.heard('cover 3');  board.setSport('basketball');  board.destroy();
```

`mount` draws everything inside `element` (styles are scoped under `.ct`), so give it a height.
Options: `sport`, `sports` (which tabs to show), `play`, `narrate`, `fullscreen`, `title`,
`glossary`, `onLoad(play, sport)`, `onSport(id)`.

## Add a sport

A sport is data: `src/sports/<sport>.js` exports a pack with its field (units, bounds, lines,
goal), view, named spots, roster size, action vocabulary, how defenders guard, naming
conventions, an AI briefing and its concept library. Register it in `src/sports/index.js`;
the engine, AI schema, sketching and ink follow from the pack. `npm test` checks every
library play of every sport.

## Develop

```sh
npm run up       # http://localhost:8795
npm test         # every play compiles, stays on the field and keeps the ball honest
npm run deploy   # test, build dist/chalktalk, wrangler deploy (route mutaafaziz.com/chalktalk*)
```

MIT. aurora-field is MIT too.
