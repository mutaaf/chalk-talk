# Pickleball (doubles): what Chalk Talk models, and where it comes from

Chalk Talk teaches pickleball doubles: the court, the rules a new player needs, and the patterns coaches teach first.
The pack is `src/sports/pickleball.js` (+ `pickleball-plays.js`), the lessons are `src/concepts/pickleball.js`, and
`test/pickleball.test.mjs` checks every shot against the rules below.

## The court (USA Pickleball Official Rulebook, section 2)
- 20 × 44 ft for doubles and singles. The net is 36 in high at the sidelines and 34 in at the center; the posts stand
  12 in outside the sidelines (x ±11 in Chalk Talk).
- The non-volley zone ("the kitchen") is the 7 ft on each side of the net, lines included. Centerlines run from each
  baseline to the kitchen line; the kitchen has none.
- Recommended playing area: 30 × 60 ft, so players can serve and return from behind the baseline (the field in Chalk
  Talk runs x ±15, y −8 … 52).

## The rules a new player needs (the "Pickleball in five rules" lesson)
1. **The serve** (section 4): underhand (contact below the waist, the paddle head below the wrist; the drop serve is
   also legal), both feet behind the baseline, cross-court into the diagonal service court, landing past the
   non-volley line. Even score: serve from the right; odd: from the left.
2. **The two-bounce rule** (section 7): the serve must bounce before it's returned, and the return must bounce before
   the serving team hits it. After that, volleys are allowed. This is why the serving team starts back and the
   returner's partner may start at the kitchen line.
3. **The non-volley zone** (section 9): no volleys while touching the zone or its line, including momentum carrying
   you in after the volley. You may enter it at any time to play a ball that bounced.
4. **Scoring** (section 4, traditional side-out scoring for doubles): only the serving team scores; games to 11, win
   by 2; the score is called as server's score, receiver's score, server number; the game starts 0-0-2.
5. **Faults**: out, into the net, a second bounce, a volley from the kitchen, a serve into the wrong court or the
   kitchen.

## The patterns (the library)
The standard doubles progression taught by USA Pickleball's coaching material and most club coaches:
serve deep, return deep and run to the kitchen line, the **third-shot drop** (or the **drive** with the partner
crashing in, sometimes called "shake and bake"), **dinking** cross-court until a ball sits up above the net, the
**speed-up** and the **put-away**, the **reset** from the **transition zone**, the **lob and switch**, the **poach**,
and the **Erne** (jumping around the kitchen corner to volley from outside the court; legal because the player is
not in the non-volley zone). Each library point is drawn so the engine checks it: every shot crosses and clears the
net, serves and returns land deep, soft shots land in the kitchen (or at the feet of a player still in transition),
and nobody volleys from the kitchen.

## How the engine plays it
- `rally: true`: nobody guards anybody (sim.js skips the auto defense), and every shot is a `hit` that goes to a
  player on the other side. A kind says how it flies (`apex` in feet, `bounce`, `lead`: how far in front of the
  player it bounces), and sim.js lifts any flight that would clip the net (`sport.net.clear`).
- Kinds carry their own words: `job` (Trace), `recv` (Trace, when it's coming to you), `kid` (Kids view), `says`
  and `read` (PickleIQ "which shot?" and "what happens next").
- PickleIQ levels follow the familiar skill ratings (2.5 to 5.0); likeness archetypes are well-known pros described
  by their style of play.

## Sources
- USA Pickleball Official Rulebook (2025/2026 edition): court, serve, two-bounce rule, non-volley zone, scoring.
- USA Pickleball "Learn the Basics" and coaching resources: the progression above.
