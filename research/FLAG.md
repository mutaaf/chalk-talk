# Chalk Talk: Flag Football Concepts & Coaching Language

Research notes for the voice-to-whiteboard app, flag football packs (`flag5`, `flag7`). Every glossary term has:

- **Coach**: a one-line definition the way a coach would say it on the sideline
- **Kid**: a phrase that works for 6–12 year olds
- **Heard as**: spoken synonyms plus likely speech-recognizer mishearings, to use as aliases

Players are always O1–On (offense) and X1–Xn (defense), never real names. Sources are numbered `[n]` and listed at the bottom. League rules vary a lot in flag football, so where sources disagree the variance is called out. Draft plays live in `research/flag-plays.draft.js`.

---

## 1. Rules that change the drawing: NFL FLAG 5v5 vs 7v7

| Rule | NFL FLAG 5v5 (youth) | 7v7 passing leagues | Notes / variance |
|---|---|---|---|
| Players | 5 on 5, rosters up to 10 [1] | 7 on 7 [5][6] | Some rec leagues play 6v6 or 4v4 |
| Field | 30 × 70 yd, two 10-yd end zones, midfield at the 25 of each half [1][2] | About 40+ yd wide, 40–50 yd long plus a 10-yd end zone; drives start at the 40 [5][6] | Some 5v5 guides list 25 yd wide; the app uses 30 |
| No-run zones | 5 yd before each goal line and 5 yd before midfield: pass only, "even with a handoff" [1][2] | Usually none, but some leagues ban runs inside the 10 [5] | Draft play `goal-line-fade-slant` is all pass |
| Rush | Rushers start at a rush line 7 yd off the ball, hand raised; after a handoff/pitch anyone may rush [1][2] | No rush. Some events allow 1 blitz per game, which shuts off the pass clock [5]; others ban blitzing entirely [7] | **How many rushers varies:** nflflag.com says up to 2 designated rushers [1]; the 2020 NFL FLAG rulebook says "any number" from 7 yd [2]; many local leagues use 1. The app assumes 1 |
| Pass clock | 7 seconds; ends once the ball is handed off [1][2] | 4 seconds from snap to release; going over is a loss of down [5][6] | |
| QB running | QB (whoever takes the snap) cannot run past the line; can after the ball is handed back [1][2] | QB may scramble behind the line only [5] | QB *moving* behind the line (rollout) is legal in both |
| Handoffs / pitches | Direct handoffs behind the line, multiple allowed; 2020 rulebook bans laterals and bans a first handoff to the center ("center sneak") [2]; nflflag.com allows backward pitches [1] | Often "one exchange" only: no reverses, hook-and-laterals, or double passes [5] | Reverse is a 5v5-only draft play |
| Running plays | Yes, outside no-run zones [2] | Usually no; some leagues allow runs outside the 10 [5] | 7v7 drafts are all pass |
| Center | Eligible receiver [1] | Often **ineligible**, stays on a knee after the snap [5][6] | 7v7 drafts keep O2 home |
| Blocking / screens / picks | None. "No blocking or screening is allowed at any time"; can't impede the rusher [2] | No blocking; picks are offensive interference in most rulebooks | Mesh/bunch drafts say "release clean, no picks" |
| Motion | One player at a time, 1 yd behind and parallel to the line, never toward it [2] | Allowed (league dependent) | Jet motion in `jet-sweep` |
| Tackle | Pull the flag; flag guarding (stiff arm, covering flags, spinning out of control, diving) is a penalty [1][2] | Flag pull or 1/2-hand touch below the neck [5][6] | |
| Contact on receivers | None | Press/jam within 5 yd allowed in some leagues [5] | |

**What the app should assume:** 5v5 = one rusher at 7 yd, everyone eligible, handoffs fine behind the line. 7v7 = no rusher, ~4 s, pass only, center usually stays in. If the coach says "two rushers" or "my center can go out", follow the coach.

---

## 2. Lettering conventions (what goes inside the mark)

The draft plays put one of these in every player's `role`. Letters are a convention, not a law: every system moves them around [10][11].

| Letter | Who | Notes |
|---|---|---|
| **QB** (Q) | Quarterback, O1 | Takes the snap |
| **C** | Center, O2 | Snaps; eligible in NFL FLAG, often not in 7v7 |
| **X** | Split end: outside receiver, usually left, on the line | Usually the #1 receiver [10] |
| **Z** | Flanker: outside receiver, usually right, off the line | The one most often put in motion [10] |
| **Y** | In tackle football the tight end; in flag the inside/slot receiver (often the one who runs "Y-cross", "Y-stick") | Some systems call Y the slot [10][11] |
| **H** | Second slot / H-back | |
| **F / RB** | Back (fullback / running back) | F is also used for a "move" receiver [10] |
| **R** | Rusher (defense) | Flag-specific |
| **CB** | Corner | Some playbooks use C |
| **S / FS / SS** | Safety (free, strong); `$` in many playbooks | |
| **LB** (M, W, S, Mike/Will/Sam) | Linebacker / underneath zone player | |
| **N** | Nickel: defender over a slot | |

**Defense marks:** The phrase "X's and O's" is folklore more than a standard. Early diagrams drew both sides as circles; Army's Charles Daly (1919) used X's for the *offense* and O's for the defense [12]. Modern teaching diagrams most often use open circles for offense and some other shape for defense (shaded squares, diamonds, triangles or V's, or letters) [13][14]. The app's convention is O = offense, X = defense, the most common way coaches say it out loud.

**Line conventions [13]:** route = solid line with arrowhead; pre-snap motion = dashed/zig line; pass = dashed; block = line ending in a T-bar (illegal in flag); zone = shaded area or bubble.

---

## 3. Glossary

### 3a. The route tree (0–9)

Route numbers are **not standardized**: 9 = go and (usually) 8 = post are the stable anchors; 0–2 vary the most, and so does whether odd numbers go outside or inside [8][9]. This is the most common tree, with odd routes outside, even routes inside:

| # | Term | Coach | Kid | Heard as |
|---|---|---|---|---|
| 0 | **Hitch** (stop, quick hitch) | 5 yards and stop, turn to the QB | "Run 5 steps, stop and turn around" | hitch, stop, quick hitch, "itch", "hitched", "hit" |
| 1 | **Flat / Arrow** | Quick release toward the sideline at 0–2 yd; arrow angles up a bit | "Run to the sideline, stay close to the line" | flat, arrow, flat route, "flap", "fat", "aero" |
| 2 | **Slant** | Three steps, then cut hard at 45° to the middle | "Three steps and cut to the middle" | slant, quick slant, "slam", "plant", "slants" |
| 3 | **Out / Speed out** | Straight up 5–6 yd, then a 90° cut to the sideline | "Run, then cut to the sideline" | out, quick out, speed out, "now", "owl" |
| 4 | **In / Dig** (square in) | Straight up, then a 90° cut to the middle; a dig is the deep (10–15 yd) one | "Run, then cut across the middle" | in, dig, square in, "dug", "inn", "deg" |
| 5 | **Comeback** | Go deep 10–12, then break back toward the sideline | "Run deep, then come back to the ball" | comeback, come back, "come black" |
| 6 | **Curl** (hook) | 6–8 yd, turn back inside to face the QB | "Run, then turn back to the QB like a hook" | curl, hook, "girl", "cool", "curled" |
| 7 | **Corner** (flag) | Stem 6–10 yd, then angle to the back corner/pylon | "Run, then cut to the corner flag" | corner, flag route, "coroner", "corner route" |
| 8 | **Post** | Stem, then angle to the middle of the goal posts | "Run, then cut toward the goal posts" | post, skinny post, "ghost", "most", "boast" |
| 9 | **Go / Fade / Streak / Fly** | Straight up the field as fast as you can; a fade drifts toward the sideline | "Run as fast as you can, straight to the end zone" | go, fly, streak, nine, fade, "phase", "glow" |

### 3b. Other routes

| Term | Coach | Kid | Heard as |
|---|---|---|---|
| **Wheel** | Release to the flat, then turn up the sideline | "Go to the sideline, then turn and run deep" | wheel, wheel route, "we'll", "real" |
| **Seam** | Vertical route just outside the hash, between the deep defenders | "Run straight up the middle lane" | seam, seam route, "seem", "scene" |
| **Sit** | Run to a depth, find the hole between defenders, stop | "Find an empty spot and stop" | sit, sit down, settle, "set", "said" |
| **Stick** | 5–6 yd, then turn and sit, usually by the inside receiver | "Five steps, stop, show your numbers" | stick, stick route, "stik", "sick" |
| **Drag / Shallow** | Shallow cross at 2–5 yd all the way across the field | "Run across the field, close to the line" | drag, shallow, shallow cross, "drug", "dragging" |
| **Whip** | Fake in, then whip back out (or vice versa) | "Fake one way, then turn back the other way" | whip, whip route, pivot, "with" |
| **Option / Choice** | Get to 6 yd, then break away from the defender's leverage (in vs outside, out vs inside, sit vs deep) | "Go where your defender isn't" | option, choice, read route, "options" |
| **Back-shoulder** | A fade thrown short and behind the receiver's outside shoulder; he stops and turns back | "Stop and turn back for the ball" | back shoulder, "back shoulder fade" |
| **Check-down** | Short safety-valve route for when everyone is covered | "Stay close for an easy catch" | check down, outlet, dump off, "checked down" |

### 3c. Pass concepts (2–3 routes that work together)

| Term | Coach | Kid | Heard as |
|---|---|---|---|
| **Slant–Flat** | Slant + flat on one side; read the flat defender | "One goes in, one goes out: throw it away from the defender" | slant flat, high low (seed play) |
| **Mesh** | Two shallow crosses, one just under the other; beats man coverage. In NFL FLAG keep it legal: no contact, no picks [2] | "Cross close, but don't touch anyone" | mesh, cross, drags, "mash", "mush" |
| **Smash** | Outside hitch + inside corner; read the corner (seed play) | "Short and deep corner, read the corner" | smash, corner hitch, "smosh" |
| **Flood / Sail** | Three receivers to one side at three depths (deep, ~10–12 yd out, flat) [3] | "Three friends to one side, deep, middle, short" | flood, sail, three level, "flud", "sale" |
| **Levels** | Two in-breakers at different depths, read the middle linebacker [15] | "Two cuts to the middle, one high, one low" | levels, "level", "leavels" |
| **Stick** | Stick + flat (+ fade to clear); quick high–low on the flat defender [16] | "Stop route and flat, throw to the open one" | stick, stick flat |
| **Spacing** | Several receivers sit at ~5 yd evenly spread across the field | "Everybody stop in an empty spot" | spacing, space, all sit |
| **Snag (Spot)** | Corner + snag (5-yd sit inside) + flat: a triangle read [17] | "Three make a triangle; one is always open" | snag, spot, triangle, "snack", "stag" |
| **Four Verticals** | Four receivers go deep: two outside, two seams; read the middle safety | "Four go deep; throw where the safety isn't" | four verts, all go, verts, "four birds" |
| **Y-Cross** | Inside receiver crosses the whole field at 12–15 yd behind the linebackers | "Y runs all the way across, deep" | y cross, "why cross", "white cross" |
| **Drive** | Shallow drag underneath a 10–12 yd dig from the same side; high–low on the hook defender | "One shallow across, one deeper across" | drive, shallow dig, "dive", "drive concept" |
| **Dagger** | Seam clears the safety, dig comes in behind it [18][19] | "One runs deep to take the safety, one cuts in behind" | dagger, seam dig, "dager" |
| **Curl–Flat** | Curl outside + flat inside; read the flat defender | "Hook and sideline, throw to the open one" | curl flat, hook flat, "girl flat" |
| **Hi–Lo** | Any two routes stacked vertically to put one defender in a bind | "One high, one low" | high low, hi lo, "hilo" |
| **Rub / Pick** | Routes that make a defender run into a receiver. **Illegal in NFL FLAG** (no screening) [2] and offensive interference in most 7v7 rules | "Run your route, don't run into anyone" | rub, pick, pick play, "rubs", "pig" |
| **Center screen** | A screen needs blockers, so **not legal** in NFL FLAG; the legal version is the center releasing short (see Center release) | — | center screen |
| **Center release (Center pop)** | Center snaps and runs a short route (sit, pop, flat); legal in 5v5 because the center is eligible [1] | "Center: snap, then get open" | center pop, center hot, snapper route, "sender" |
| **Hot route** | Quick throw to beat the rush; the receiver who is "hot" looks for the ball early | "If the rusher comes fast, you get it" | hot, hot read, "hut" |

### 3d. Formations, motion & runs

| Term | Coach | Kid | Heard as |
|---|---|---|---|
| **Trips** | Three receivers to one side | "Three friends on one side" | trips, trips right/left, "trip", "strips" |
| **Bunch** | Three receivers in a tight triangle; hard to cover man-to-man | "Stand close together in a triangle" | bunch, cluster, "brunch", "punch" |
| **Stack** | Two receivers lined up one behind the other | "One behind the other" | stack, stacked, "stock" |
| **Twins / Doubles** | Two receivers on each side (or two on one side) | "Two and two" | twins, doubles, 2x2, "twin" |
| **Empty** | No back in the backfield; everyone spread out | "Nobody behind the QB" | empty, empty backfield, "MT" |
| **Shotgun** | QB 4–5 yd behind the center (the only way to line up in flag) | "QB stands back" | shotgun, gun |
| **Motion** | One player moves sideways before the snap, 1 yd behind and parallel to the line [2] | "Run sideways before the snap, never forward" | motion, in motion, "notion" |
| **Jet sweep** | Full-speed motion across, handoff at speed, race to the edge | "Run across fast, take the handoff, go to the edge" | jet, jet sweep, fly sweep, "get sweep" |
| **Reverse** | Handoff one way, second handoff to a player going the other way; legal in NFL FLAG behind the line, banned in many 7v7 events [2][5] | "Fake one way, give it to a friend going back" | reverse, end around, "the verse" |
| **Rollout / Sprint-out / Boot** | QB moves to one side behind the line before throwing | "QB runs sideways, stays behind the line" | rollout, sprint out, bootleg, boot |
| **No-run zone** | 5 yd before midfield and the goal line: pass plays only [1][2] | "Close to the line, we have to throw" | no run zone, no running zone, "no fun zone" |

### 3e. Defense

| Term | Coach | Kid | Heard as |
|---|---|---|---|
| **Man (man-to-man)** | Each defender covers one receiver everywhere he goes | "Stick to your player like glue" | man, man to man, "mane", "men" |
| **Zone** | Each defender guards an area and covers whoever comes into it [20][21] | "Guard your grass, not a guy" | zone, zone defense, "zoned", "soon" |
| **Rusher** | Defender who starts 7 yd back and goes after the QB at the snap [1][21] | "Hand up, go get the QB's flag" | rusher, blitzer, "rush her", "Russia" |
| **Blitz** | Sending extra rushers (5v5 within league limits) or a one-time rush in 7v7 [5] | "Surprise, two of us go!" | blitz, "blitzed", "blitz her" |
| **Cover 0** | Man everywhere, no deep help | "Everybody on a man, nobody deep" | cover zero, cover 0, all man |
| **Cover 1** | Man underneath with one deep free safety | "Man, plus one helper deep" | cover one, man free, "cover won" |
| **Cover 2** | Two deep safeties split the field in halves; corners sit in the flats | "Two deep, corners stay short" | cover two, two deep, tampa 2, "cover to/too" |
| **Cover 3** | Three deep (two corners + middle safety), four underneath | "Three deep, the rest stay short" | cover three, three deep, "cover tree/free" |
| **Cover 4 (Quarters)** | Four deep defenders each take a quarter; strong vs deep passes | "Four deep, nobody gets behind us" | cover four, quarters, "cover for" |
| **1-3-1** | 5v5 zone: rusher, three underneath, one deep safety [21][22] | "One rushes, three short, one deep" | one three one, 131, "won three won" |
| **2-3 / 2-2-1** | 5v5 zone without a rusher (or with one of the 2 dropping); two short outside, middle, safeties | "Two up, three back" | two three, 2-3 zone |
| **Flag pull technique** | Break down (chop your feet, bend your knees), aim at the hips, rip one flag and hold it up | "Buzz your feet, eyes on the belt, rip and show it" | flag pull, pull the flag, "pull flag", "flag pole" |
| **Flag guarding** | Ball carrier blocks access to his flags (hand, stiff arm, spinning out of control); a penalty [1][2] | "Never cover your flags" | flag guard, flag guarding |
| **Leverage** | Where the defender lines up on the receiver: inside or outside shade | "Stand on the side you want to take away" | leverage, inside/outside leverage |

### 3f. Youth teaching language (shoutable cues)

| Cue | Means |
|---|---|
| "Eyes, then hands" | Look the ball in before you run |
| "Show your numbers" | Face the QB when you stop on a sit/hitch/stick |
| "Get open, stay open" | Keep moving away from your defender |
| "Hand up, go!" | Rusher's pre-snap signal and start (the rule requires the raised hand [1]) |
| "Guard your grass" | Zone defender, stay in your area |
| "Hip to hip" | Man defender, stay next to your receiver |
| "Ball in the air, everybody go!" | All defenders rally to the throw [20] |
| "Buzz your feet" | Break down before a flag pull |
| "No-run zone: we throw" | Reminder near midfield and the goal line |
| "Behind the line!" | QB/handoff must stay behind the line of scrimmage |

---

## 4. Draft play library (research/flag-plays.draft.js)

**5v5 (`FLAG5_DRAFT`, 12):** mesh, flood, curl-flat, double-slants, stick, jet-sweep, reverse, center-pop, goal-line-fade-slant (los 13, inside the no-run zone), sprint-out (QB rollout), man-rusher (defense), zone-1-3-1 (defense).
**7v7 (`FLAG7_DRAFT`, 12):** four-verts, y-cross, levels, dagger, snag, spacing, sail, trips-choice, bunch (corner-flat-whip), back-shoulder-fade (los 17, red zone), cover-2 (defense), cover-3 (defense).

Notes for promotion into `src/sports/flag-plays.js`:
- Every player has a `role` letter (QB, C, X, Z, Y, H, RB / R, CB, S, LB, N).
- The coverage plays (`zone-1-3-1`, `cover-2`, `cover-3`) give each defender a `cover` job (`{type:'rush'}`, `{type:'man', on}`, `{type:'zone', zone:{x0,x1,d0,d1,label}}`), which `normalize`/`compile` in `sim.js` support. The zone players then play on their own, so every beat stays at ≤5 actions. `cover-2` and `cover-3` also set `coverage: 'cover2'|'cover3'` so the UI's coverage buttons light up. In Cover 2, X7 is a middle "robber" zone, not man on the back: man on a back who stays in the backfield drags the defender across the line.
- Any other defender with no move in a beat auto-guards the O with the same number (X3 ↔ O3).
- In 7v7, the QB (O1) and center (O2) never get a placed X1/X2 in offensive plays: an idle X1 or X2 would "guard" the QB/center and walk across the line.
- Run plays (jet-sweep, reverse) use los 28, so they sit clearly outside the 30–35 no-run zone, and spell out every spot as `{x, y}`, because named spots are measured from the default los.

### Validating the draft

```sh
cd /Users/mutaafaziz/Desktop/projects/chalk-talk && node -e "import('./research/flag-plays.draft.js').then(async m=>{const {normalize,compile}=await import('./src/engine/sim.js');const {flag5,flag7}=await import('./src/sports/flag.js');for(const [sp,list] of [[flag5,m.FLAG5_DRAFT],[flag7,m.FLAG7_DRAFT]]){for(const p of list){const r=normalize(p,sp);if(!r.ok||r.errors.length){console.log(sp.id,p.key,r.errors);process.exitCode=1;continue}const s=compile(r.play,sp,{defense:true});for(let t=0;t<s.beats+1;t+=.1){for(const q of s.posAt(t)){if(!isFinite(q[0])||q[0]<sp.field.x[0]||q[0]>sp.field.x[1]||q[1]<0||q[1]>sp.field.y[1])throw sp.id+' '+p.key+' off field '+q}}}console.log('ok',sp.id,list.length)}})"
```

Last run: `ok flag5 12` / `ok flag7 12`. Extra checks also passed: ≤5 actions in every beat; only the ball holder snaps, hands off or throws; handoff partners end ≤1.5 yd apart; every offensive player starts behind the line and every defender in front of it; beats 3–6.

---

## Sources

1. NFL FLAG, "Flag Football Rules" (official): https://nflflag.com/coaches/flag-football-rules
2. NFL FLAG 2020 Regular Season Rulebook (league copy): https://gadsden.recdesk.com/RecDeskPortal/Portals/453/NFL-flag-2020-regularseason-rulebook-prd-2.pdf
3. NFL.com flag playbook PDF (flood concept: flat, deep out, go): https://static.www.nfl.com/image/upload/league/w7jrxyki5ffvoncw3ckg.pdf
4. GHSA Girls Flag Football Strategy Presentation: https://old.ghsa.net/sites/default/files/documents/flag-football/GHSA_Girls_Flag_Football_Strategy_Presentation_2020.pdf
5. MY7ON7 Tournament Rulebook: https://cdn3.sportngin.com/attachments/document/50a3-3568753/MY7ON7_TOURNAMENT_RULEBOOK_7on7.pdf
6. AAU Football 7-on-7 Passing League Guidelines: https://www.aaujumprope.org/football/7-on-7
7. Gotta Believe 7v7 2025 Playing Rules (no blitzing): https://cdn4.sportngin.com/attachments/document/1457-3403704/2025_Gotta_Believe_7ON7_Rules.doc ; Midwest 7v7 rules: https://docs.google.com/document/d/1fQVF5QLGcRUUbkAxJUWXJooKM14OlEke/export?format=pdf
8. Active.com, "Pass Route Tree": https://www.active.com/football/articles/pass-route-tree
9. Football Times, "Wide Receiver Routes & Patterns": https://footballtimes.org/blog/wide-receiver-routes-patterns
10. Viqtory Sports, "X Y Z Receivers Explained": https://www.viqtorysports.com/x-y-z-receivers-explained/
11. Wikipedia, "End (gridiron football)": https://en.wikipedia.org/wiki/End_(gridiron_football)
12. Football Archaeology, "A word on football X's and O's": https://www.footballarchaeology.com/p/a-word-on-football-xs-and-os
13. GoRout, "How to Draw Football Plays": https://gorout.com/how-to-draw-football-plays/
14. CFB Track, play diagrams (circles = offense, diamonds = defense): https://cfbtrack.com/football-plays/run-plays
15. Youth Football Online, "3 pass concepts for your young QB": https://youthfootballonline.com/3-pass-concepts-for-your-young-qb/
16. Football Play Card, "Mastering the stick concept": https://footballplaycard.com/blog/mastering-the-stick-concept-football
17. FirstDown PlayBook, "NFL Snag Concept on a Flag Football Field": https://firstdown.playbooktech.com/coaches-community/nfl-snag-concept-on-a-flag-football-field
18. FirstDown PlayBook, "7on7 Dagger Concept": https://firstdown.playbooktech.com/coaches-community/firstdown-playbook-7on7-dagger-concept
19. Youth Football Online, "Post-corner dagger concept (7v7 flag)": https://youthfootballonline.com/post-corner-dagger-concept-7v7-flag-football-play/
20. Flag Football Substack, "Rules for mastering zone coverage in NFL Flag": https://flagfootball.substack.com/p/rules-for-mastering-zone-coverage
21. Team MOJO, "What is zone defense" (rusher at the 7-yd mark): https://mojo.sport/coachs-corner/what-is-zone-defense
22. Best Flag Football Plays, "Defense Formation: 1-3-1": https://bestflagfootballplays.com/defense-formations/1-3-1
