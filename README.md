# Chalk Talk

Say a play out loud, or sketch it, and watch it draw itself in light. X's and O's for youth
coaches, on an [aurora-field](https://github.com/mutaaf/aurora-field) court: basketball, flag
football 5v5 and 7v7, and any sport you add as a data file.

**Live:** https://mutaafaziz.com/chalktalk/ · also inside [CourtIQ](https://github.com/mutaaf/courtiq) → Labs

- **Talk:** "1 dribbles to the right wing, 5 sets the ball screen and rolls" or "trips right, Z runs a corner, the slot runs a drag". Commands (next, back, again, slower, show defense, label 5 the big, cover 2, half field right, find the open man) work offline.
- **Sketch:** tap the field to drop players, drag from a player to draw what they do. It plays at once; then the AI takes over: it names the concept ("Looks like Pick and Roll"), proposes a clean version and 2–3 coaching suggestions. Use it or keep yours.
- **Learn:** a concept library per sport (26 basketball concepts from spacing to Spain pick-and-roll, ICE and hedge coverages; 13 flag 5v5 and 13 flag 7v7 concepts from mesh and stick to four verts, Y-cross and Cover 2/3), each with a kid-friendly explanation, cues to shout and the options it creates.
- **Football tools:** the route tree (0–9 plus drag, seam, wheel) on any receiver, coverages (Man, Cover 1, 2, 3, 4) with shaded zones and defenders who play them on their own, and the QB's eyes: half-field or full-field reads, a cone sweeping the progression, every read lit by live separation, and "find the open man".
- **Guide:** every position in depth (job, reads, do and don't, coaching by age, a drill, its AI brain) with its signature move animated on its own mini court, the play broken down player by player with "Watch it", and big game-day cue cards.
- **CourtIQ / FieldIQ:** a game for players. Real plays freeze at the decision; they tap the open man or the spot, or name the play or coverage. An AI tutor explains at their age (only an age band is sent), ratings climb from Rookie to MVP, and the profile earns a likeness to a modern pro or a hybrid. Nicknames and scores stay on the device.
- **The analyst:** narration explains the read (the coverage, the defender who moves, the QB's progression, why the ball goes there), built from the engine and polished by the AI. Play-by-play is still a choice.
- **Presenter mode:** full screen for AirPlay, Cast or any mirroring: a broadcast lower third, a laser pointer, the defense switch, controls that fade.
- **Stats:** distance, touches, spacing and space at every catch; voice accuracy, speed and what it learned; every AI call's tokens, latency and estimated cost, exportable as CSV.
- **It learns:** tap the transcript to fix a word and it's heard right from then on; a phrase whose drawing you keep becomes an instant, offline shortcut. All on the device.
- **Conventions:** basketball offense is the positional number (1 point guard … 5 center) in a circle, defense an X with its man's number. Football offense is lettered by position (Q, C in a square, X/Z outside, Y/H inside, RB), defense by job (R, CB, S, LB, N). Solid arrow = cut or route, zigzag = dribble, dashed = pass, T-bar = screen.
- **Bring your own key:** Claude or OpenAI for plays (the key is recognised, kept in this browser and sent only to that provider), and OpenAI or ElevenLabs for the broadcast voice. Without keys you get the library, sketching, commands and the device's most natural voice.

## The free AI (no key needed)

Free plays are drawn by Claude Haiku 5.5 on the owner's key (set it once: `npx wrangler secret put ANTHROPIC_API_KEY`), within a daily dollar cap for everyone together (`LIMITS.claudeMicrosPerDay`, $5) and the per-person daily caps. Past the cap, or if Claude is unavailable, the open models below take over.

Coaches without a key get open models on Cloudflare Workers AI, served by `src/worker` at
`mutaafaziz.com/chalktalk/api/*` and proxied at `digitalcraftai.com/api/chalktalk/*`:

| | |
|---|---|
| `POST play` `{sport, text, current, sketch}` | a play, built with the same prompt, schema, validation and repair round as the BYOK path |
| `POST smart` `{sport, play, ids}` | smart players: each chosen position's move and thought per beat |
| `POST brain` `{sport, play, id, mode}` | one position's brain (smart moves, or a film-room read), on a lite model |
| `POST hear` audio ≤ 2 MB | `{text}` via Whisper, for browsers and installed apps without Web Speech |
| `POST say` `{text ≤ 300}` | audio via MeloTTS (cached) |
| `GET health` | models and today's usage |

Requests carry X's and O's only (player names stay on the coach's device). Nothing is stored except
hashed-IP daily counters. Daily caps keep it inside the free Workers AI allowance; a 429 says to
add a key.

## Use it in an app

Offer your own AI subscription: `mount(el, { upgrade: { label: 'Get unlimited AI', href: '/upgrade', note: 'No key needed' } })` (or `onClick` instead of `href`). It appears in the film room when the AI isn't connected, and in AI settings.


```js
import { mount } from 'chalk-talk';            // npm i github:mutaaf/chalk-talk
const board = mount(element, { sport: 'flag7', play: 'smash' });   // sport: basketball | flag5 | flag7 | "flag football"…
board.heard('cover 3');  board.setSport('basketball');  board.destroy();
```

`mount` draws everything inside `element` (styles are scoped under `.ct`), so give it a height.
Options: `sport`, `sports` (which tabs to show), `play`, `narrate`, `fullscreen`, `title`,
`glossary`, `onLoad(play, sport)`, `onSport(id)`.

## Analytics

Anonymous, cookieless usage counts (country and city, device, browser, how people arrived, which features they use) go to the Worker; the owner reads them at `/chalktalk/admin` with the stats token. No IPs are stored, visitors are a hash that rotates daily, and nothing a coach says, names or keys is ever included. Hosts can turn it off: `mount(el, { analytics: false })`.

## Ads

Per the owner's 2026-10-30 decision to monetize the collection (split by audience; Chalk Talk is
general audience), the standalone page at mutaafaziz.com/chalktalk/ loads
[Marquee](https://mutaafaziz.com/ads/) and shows one labelled banner (`library`, menu context) at
the foot of the Plays list. It never covers the board, never interrupts talking or drawing, isn't on
`/admin`, and isn't part of the package, so hosts like CourtIQ show no ads. Ads may use cookies and
Google's ad requests; see the [ad privacy policy](https://mutaafaziz.com/ads/privacy/). Chalk Talk's
own analytics above are unchanged.

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
