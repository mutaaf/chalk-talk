# Chalk Talk: Soccer Concepts & Coaching Language

Research notes behind `src/sports/soccer.js` (the `soccer7` and `soccer9` packs) and
`src/sports/soccer-plays.js`. Numbers in brackets point to the sources at the bottom. Where sources
disagree, the table says so and says what the app draws.

The glossary tables in section 4 use the same row format as `research/FLAG.md`
(`| **Term** | Coach | Kid | Heard as |`), so `node scripts/glossary.mjs research/SOCCER.md <out>`
produces the string that is inlined as `GLOSSARY` in `soccer.js`.

---

## 1. Formats: what changes the drawing

U.S. Soccer's Player Development Initiatives (PDI, 2016, still the basis of every state association's
small-sided rules in 2025–26) set the youth formats by birth year [1][2][3]:

| | 4v4 (U6–U8) | **7v7 (U9–U10)** | **9v9 (U11–U12)** | 11v11 (U13+) |
|---|---|---|---|---|
| Players | 4 (no keeper) | 6 + keeper [1] | 8 + keeper [2] | 10 + keeper |
| Field | 15–25 × 25–35 yd | **55–65 × 35–45 yd** [1] | **70–80 × 45–55 yd** [2][4] | 100–130 × 50–100 yd |
| App draws | — | **55 × 40** | **75 × 50** | (not drawn) |
| Goal | 4 × 6 ft | ≤ 6.5 × 18.5 ft (6.5 × 12 recommended) [1] | 7 × 21 ft [3][4] | 8 × 24 ft |
| Penalty area | none | 12 yd deep × 24 wide (secondary sources; the PDI diagram is an image) [5][6] | 14 × 36 yd [4] | 18 × 44 yd |
| Goal area | none | 4 × 8 yd [5] | 5 × 16 yd [4] | 6 × 20 yd |
| Penalty spot | none | 8 yd | 10 yd [4] | 12 yd |
| Ball | 3 | 4 [1] | 4 | 5 |
| Build-out line | — | **Yes**: equidistant between the penalty area line and the halfway line [1][7] | No | No |
| Offside | No | Only between the build-out line and the goal line [1][7] | Yes (normal) | Yes |
| Punting / drop kicks | — | **Not allowed** (indirect free kick) [1][7] | Allowed | Allowed |
| Heading | Banned | **Banned** (10 and under) [1][7] | Banned for U11; U12 limited in practice [7][8] | Allowed |

**Build-out line rules (7v7)** [1][7]: when the goalkeeper has the ball in hand (from play or a goal
kick), the opponents must retreat behind the build-out line until the ball is released; the keeper may
pass, throw or roll it out (not punt) and need not wait. After release, play is normal. Some leagues
(EDP and others) and a 2015 U.S. Soccer slide describe the line as "14 yards from goal"; the 2016
standard says halfway between the box and halfway line. On a 55-yd field with a 12-yd box that is
19.75 yd from each goal line, which is what the app draws (dashed).

**What this changes in the pack**
- `soccer.js` `guard()`: while the attacking keeper has the ball (the ball is in their goal area), every
  defender is held behind the build-out line (y < 35.25); they step up the moment the ball is released.
- No headers anywhere in the library: corners are **driven low** to the near post and redirected with
  the foot, crosses are low, and the 7v7 "cross and finish" is a **cutback** from the byline.
- `distribute` (the keeper rolls/throws/passes) exists; there is no punt kind.
- Offside isn't enforced by the engine (see Limitations); plays keep runners level until the pass.
- 11v11 (U13+) is research only: rosters are capped at 9 per side by the engine's ids (O1–O9).

## 2. Positions, numbers and jobs

### 2a. Shirt numbers (what goes inside the circle)

Youth coaches draw a team the way the game has numbered it since the 1930s–60s: the numbers name the
role, not the player [9][10].

| Number | Role | 7v7 (2-3-1) | 9v9 (3-2-3) |
|---|---|---|---|
| 1 | Goalkeeper | O1 | O1 |
| 2 | Right back | O2 | O2 |
| 3 | Left back | O3 | O3 |
| 4 (5) | Center back(s) | — | O4 |
| 6 | Holding / defensive midfielder ("the 6") | — | O5 |
| 8 | Box-to-box / central midfielder ("the 8") | O4 | O6 |
| 10 | Attacking midfielder, the playmaker ("the 10") | (role "AM" if used) | (role "AM" if used) |
| 7 | Right winger | O7 | O7 |
| 11 | Left winger | O5 | O8 |
| 9 | Striker / center forward ("the 9") | O6 | O9 |

Defense is drawn as X's carrying the number of the player they mark (basketball's convention):
X1 marks their keeper, so X1 *is* the defending keeper.

**Why 2-3-1 and 3-2-3.** U.S. Soccer's 7v7 and 9v9 materials and most state associations show 2-3-1
(or 3-2-1) for 7v7 and 3-2-3 (or 3-3-2, 2-3-2-1) for 9v9 [11][12]; 2-3-1 and 3-2-3 give every player
diamonds and triangles (a back, a midfielder, a winger on each side) and width on both sides, which is
what the principles below need. A coach can still say "we play a 3-2-1": the AI is told the default
ids and how to map "the 9", "the 8" etc.

### 2b. Jobs, in the words coaches use

| Position | With the ball (attack) | Without the ball (defend) |
|---|---|---|
| Keeper (1) | First attacker: play short to a split back, then wide; in 7v7 roll it out (no punt) | On the line from ball to the middle of the goal; narrow the angle; sweep through balls; talk |
| Outside backs (2, 3) | Split wide to the edges of the box on goal kicks; give width; **overlap** when the winger comes inside | Get goal-side first; press the winger or **tuck in** to balance |
| Center back (4) | Receive on the half-turn, play forward, **carry** into space when nobody presses | Stay goal-side, cover the presser, keep the line, don't get turned |
| The 6 | Show between the lines of the press, play the way you face, drop between the backs | Screen the middle, cover, stop the counter |
| The 8 | Half-turn, play forward or switch; **arrive late** in the box for the cutback; **underlap** | Press on the trigger, recover goal-side |
| The 10 | Find the pocket between midfield and defense, 1-2s and through balls, shoot from the top of the box | First line of the press with the 9 |
| Wingers (7, 11) | **Hold the width**, receive on the outside foot, 1v1, byline and cut back; far side attacks the back post | Track the full back |
| The 9 | Pin the center backs, **check short** to link (lay-offs), **spin in behind** on the blind side, near post on crosses | Press the center back, **curve the run** to cut off the switch |

## 3. Principles of play (why these plays)

U.S. Soccer's grassroots curriculum teaches the game in **four moments**: attacking (in possession),
defending (out of possession), and the two transitions (winning and losing the ball) [13][14]. The
principles under them are the same in U.S. Soccer, US Youth Soccer, the FA and most coaching texts
[13][15][16][17]:

| Moment | Principles | Plays in the library that teach it |
|---|---|---|
| Attacking | **Penetration** (play/dribble/run forward), **support** (angles, distance), **width & depth**, **mobility** (runs, rotations), **creativity / improvisation** | wall pass, overlap, underlap, third-man run, through ball, switch, cutback/cross, build out |
| Defending | **Pressure** (first defender), **cover** (second defender), **balance** (third defender), **compactness**, **delay**, **control & restraint** | pressure-cover-balance, compact block, pressing trigger |
| Attack → defense | Win it back fast (counter-press) or delay and recover goal-side | pressing trigger (win it and go), the counter's recovering defenders |
| Defense → attack | Play forward quickly while the opponent is unorganized; numbers up | counterattack 3v2 |

**Age fit.** U.S. Soccer's grassroots guidance for 7v7 (U9–U10) is to build players who are
comfortable on the ball, play out from the back and recognize simple 2v1s and support angles; 9v9
(U11–U12) adds team shape, switching, third-man combinations and pressing as a unit [13][14]. The FA's
youth modules emphasize the same: realistic, game-like decisions over set "plays" [16]. So the
library is a set of **patterns and decisions**, each with a read (what makes it the right choice),
not choreography.

### Why these concepts

| Concept | Why it's in | Key teaching point (source) |
|---|---|---|
| Wall pass / 1-2 (give-and-go) | The simplest 2v1 combination; the first combination taught at U9 [13][18] | Dribble at the defender to commit him, pass and **go**, return first time |
| Overlap | Creates a 2v1 out wide; teaches width and running from behind [15][17] | Winger carries inside to take the defender, back runs around the outside |
| Underlap | The modern inside run (the 8, or an inverted back) into the gap between full back and center back [17][19] | The winger holding width is what opens the gap |
| Third-man run | Core of positional play and rondo-based coaching; beats man-marking [17][19][20] | A → B → C: C is running before B receives |
| Switch of play | Width principle: attack where they aren't [15][16] | Far winger **stays wide**; recognize the crowded side |
| Build out from the back | The purpose of the build-out line [1][7] | Backs split wide, keeper rolls it, carry into free space |
| Through ball | Penetration; timing the run on the blind side; offside awareness [15][17] | Bend the run, pass into space, not feet |
| Cutback / cross & finish | Most youth goals from wide come from cutbacks; low crosses at heading-ban ages [8][17] | Near post, far post, arrive at the spot |
| Counterattack 3v2 | Transition to attack; numbers-up decision [13][14] | Commit a defender, pass to the side he left |
| Corner (near post, on the ground) | Set pieces win youth games; heading banned so the ball is driven low [7][8] | Get in front of your marker; far post |
| Throw-in pattern | The most frequent restart in youth soccer; "throw it to feet, give it back to the thrower" [16][18] | Check away, check back |
| Pressing trigger | When to press, not just how: back pass, ball to the touchline, a bad touch [19][21] | The touchline is an extra defender; curve the run |
| Pressure, cover, balance | The first defending principles at every license level [13][15] | Nearest presses, next covers at an angle, far side tucks in |
| Compact block (9v9) | Compactness: shift as a unit, close the middle [15][21] | Pass across, we slide; far side tucks in |

## 4. Glossary

### 4a. Areas of the pitch

| Term | Coach | Kid | Heard as |
|---|---|---|---|
| **Box / penalty area** | The big rectangle in front of goal (12 × 24 yd in 7v7, 14 × 36 in 9v9) | "The big box" | box, the box, penalty area, the area, eighteen |
| **Six / goal area** | The small box at the goal (4 × 8 yd in 7v7, 5 × 16 in 9v9) | "The little box" | six, six yard box, the six, goal box, sex yard box |
| **Top of the box / edge of the box** | Just outside the penalty area, in the middle | "The edge of the big box" | top of the box, edge of the box, top of the area, top a the box |
| **Penalty spot** | 8 yd out in 7v7, 10 in 9v9: where the cutback goes | "The PK spot" | penalty spot, PK spot, the spot, penalty mark |
| **Near post / far post** | The post closest to / farthest from the ball | "The close post, the far post" | near post, far post, back post, front post, near pole, Ferpost |
| **Half-space / channel** | The lane between the middle and the wing, just outside the box | "The gap between the middle and the side" | half space, half-space, channel, pocket lane, half spaces |
| **Byline / end line** | The goal line outside the goal | "The end line" | byline, by line, end line, goal line, buy line |
| **Touchline** | The sideline | "The sideline" | touchline, touch line, sideline, side line |
| **Build-out line** | 7v7: dashed line halfway between the box and halfway; opponents retreat behind it when the keeper has the ball | "The back-up line" | build out line, build-out line, build outline, bill doubt line, retreat line |
| **Pocket / between the lines** | Space between their midfield and defense | "The hole behind their midfielders" | pocket, between the lines, the hole, in the pocket |

### 4b. Attacking

| Term | Coach | Kid | Heard as |
|---|---|---|---|
| **Wall pass / 1-2 / give-and-go** | Pass, run past the defender, get it back first time | "Bounce it off your friend like a wall" | wall pass, one two, 1-2, give and go, won two, one to |
| **Overlap** | Run around the outside of the teammate on the ball, from behind | "Run around the outside" | overlap, overlapping run, over lap, overload |
| **Underlap** | Run on the inside of the teammate on the ball, into the gap | "Run inside your friend" | underlap, under lap, inside run, under lab |
| **Third-man run** | A passes to B, C is already running and gets it from B first time | "The third player is the surprise" | third man, third man run, 3rd man, third men, bird man |
| **Switch / switch of play** | Move the ball from the crowded side to the open side | "Go where they aren't" | switch, switch play, switch the field, change the point, swing it |
| **Through ball** | Pass into space behind the defenders for a runner | "Pass to where they're going" | through ball, thru ball, through pass, threw ball, in behind |
| **In behind** | The space between the last defender and the keeper | "Behind the defenders" | in behind, run in behind, behind them, in be hind |
| **Cutback / pull-back** | From the byline, pass backward along the ground to a late runner | "Pass it back from the end line" | cutback, cut back, pull back, cut black |
| **Cross** | Ball from wide into the box (driven low at these ages) | "Kick it across the front of the goal" | cross, cross it, crossing, Kraus |
| **Check / check to the ball** | Move toward the passer to receive; check away first to make space | "Come to the ball" | check, check to, check in, come short, show for it, check away |
| **Half-turn / open body** | Receive sideways-on so you can see both ways and play forward | "Stand sideways so you can see the field" | half turn, half-turn, open up, open body, side on |
| **Scan / check your shoulder** | Look around before the ball arrives | "Look before it comes" | scan, scanning, check your shoulder, shoulder check, head on a swivel |
| **First time / one touch** | Pass without stopping the ball | "Don't stop it, just pass" | first time, one touch, one-touch, 1 touch |
| **Lay-off** | A short first-time pass back or sideways to a teammate facing forward | "Give it back to your friend facing goal" | lay off, lay it off, layoff, set it |
| **Carry / run with the ball** | Big touches into open space at speed | "Run with it" | carry, carry it, drive, run with the ball, cary |
| **Give width / stay wide** | Wingers and backs hold the touchline to stretch the defense | "Stay by the sideline" | width, stay wide, hold the width, give width, get wide |
| **Support / angles** | Get diagonal to the ball, never flat, about 10 yards away | "Make a triangle" | support, angle, show, give an angle, triangle |
| **Split (the backs)** | On a goal kick the backs move wide to the edges of the box | "Backs go wide" | split, split wide, split the backs, spit |
| **Pin** | A striker stays on the last defender to hold the line deep | "Stay on the last defender" | pin, pin them, pin the back line |
| **Blind side** | Run behind a defender's back, where they can't see you | "Run where he can't see you" | blind side, blindside, behind his back |

### 4c. Defending and transition

| Term | Coach | Kid | Heard as |
|---|---|---|---|
| **Goal-side** | Between your attacker and your goal | "Stay between him and our goal" | goal side, goal-side, goalside, get goal side |
| **Pressure (first defender)** | Nearest player closes the ball, slows on arrival, shows him one way | "Go to the ball, then slow down" | pressure, press, first defender, close down, closed down |
| **Cover (second defender)** | Behind and to the side of the presser, ready if he's beaten | "Back up your friend" | cover, cover him, second defender, back him up |
| **Balance (third defender)** | Far-side defenders tuck in toward the middle | "Come to the middle" | balance, tuck in, tuck, third defender |
| **Compact** | Small distances between players and lines, close the middle | "Stay close together" | compact, stay compact, squeeze, tight, combat |
| **Shift** | The whole team slides toward the ball side | "Slide with the ball" | shift, slide, shift across, move over |
| **Pressing trigger** | The cue to press as a group: back pass, ball to the touchline, bad touch, a player facing his own goal | "The signal to go get it" | trigger, pressing trigger, press trigger, presting |
| **Counter-press** | Win it back right after losing it, within a few seconds | "Lost it? Get it back fast" | counter press, counterpress, gegenpress, gegen press |
| **Delay** | Slow the attack down so teammates can recover | "Don't dive in, slow him down" | delay, jockey, contain, hold him up |
| **Show him outside / inside** | Angle your body to force the attacker one way | "Make him go to the sideline" | show him outside, force outside, show him inside, push him wide |
| **Track** | Follow a runner back | "Run with him" | track, track back, track your runner, follow |
| **Counterattack / transition** | Attack fast right after winning the ball | "Win it, go!" | counter, counter attack, counterattack, transition, break, fast break |
| **Rest defense** | Players who stay back while we attack, ready for the counter | "Who stays home" | rest defense, rest defence, stay home, safety |

### 4d. Restarts

| Term | Coach | Kid | Heard as |
|---|---|---|---|
| **Goal kick** | Restart from the goal area after the ball crosses our goal line; in 7v7 the build-out line applies | "Kick from our little box" | goal kick, goalkick, gold kick |
| **Corner (kick)** | Restart from the corner arc after the defense put it over its own goal line | "Kick from the corner" | corner, corner kick, corna, quarter |
| **Throw-in** | Two hands, both feet down, from the touchline | "Throw it in over your head" | throw in, throw-in, throwing, through in |
| **Kickoff** | Restart at the center spot | "The start kick" | kickoff, kick off, kick-off |
| **Free kick (direct / indirect)** | Opponents 10 yd away; indirect needs a second touch | "A free kick after a foul" | free kick, direct, indirect, IFK |

## 5. Coaching lenses ("inspired by", never quoted)

| Lens | Widely described public ideas used [19][20][21][22] |
|---|---|
| Positional play (inspired by Pep Guardiola) | Occupy the five vertical lanes, third-man combinations, receive in the half-spaces, rondos, rest defense, "the ball does the running" |
| Gegenpressing (inspired by Jürgen Klopp) | Counter-press immediately after losing it, pressing triggers, vertical play after winning it, intensity |
| Freedom & simplicity (inspired by Carlo Ancelotti) | A flexible shape built around the players, simple patterns, quick transitions, calm |
| Flexible & direct (inspired by Emma Hayes) | Switch shapes (back three/four) to the opponent, wing-backs, direct transitions, mentality and team culture |
| Structured build-up (inspired by Mikel Arteta) | Rehearsed build-out patterns, inverted full backs, set-piece detail, high press with clear triggers |

## 6. Archetypes for PitchIQ (likeness labels only)

Vectors are `[vision, spacing, recognition, speed]`: Lionel Messi (the genius: sees the pass and the
dribble), Kevin De Bruyne (the through ball), Luka Modrić (the metronome: always an angle), Rodri (the
anchor: reads danger), Kylian Mbappé (the run in behind, decision speed), Bukayo Saka (the wide
threat: holds width, attacks space), Alexia Putellas (the complete midfielder: scans, arrives on time).
Only on the IQ card, never on the board.

## 7. Limitations found while drawing (for the engine owner)

- **One goal for shots.** `field.goal` is a single point, so every shot flies to the middle of the
  attacking goal; there's no aiming at a post, and a team in possession of the X side (after an
  interception) can't shoot at the other goal. Defending lessons end on the win and a carry.
- **No offside, no build-out timing beyond guard().** The build-out retreat lives in the pack's guard
  (it keys off the ball being in the keeper's area); offside isn't checked.
- **Auto defenders close any gap in half a beat.** Fine for man-marking, but counters and block shifts
  need an explicit move for every defender in every beat (the `counter-3v2` and `compact-block` plays).
- **Roster ≤ 9 per side** (`/^[OX][1-9]$/`), so 11v11 can't be drawn.
- **No keeper hands / no aerial game.** The ball is always at the feet (`held` 0.3); a keeper catch,
  a throw-out from the hands or a header can only be approximated with pass arcs.
- UI bits written for basketball/football: the analyst's lines ("rises up", "feet away"), the blank
  board's ball (`O2`), `spoken()` names, and the mini-board mate labels (keys are drawn as their digits,
  so the pack keys mates by shirt, e.g. `O11`).

## Sources

1. U.S. Soccer, *Player Development Initiatives: 7v7 Modified Laws of the Game* (2016): field 55–65 × 35–45 yd, goals ≤ 6.5 × 18.5 ft, build-out line, punting, offside. https://cdn4.sportngin.com/attachments/document/0138/4138/Player_Dvelopment_Initiative_FINAL_7v7.pdf
2. U.S. Soccer, *Five things to know: how small-sided standards will change youth soccer* (2017). https://www.ussoccer.com/stories/2017/08/five-things-to-know-how-smallsided-standards-will-change-youth-soccer
3. Eastern Pennsylvania Youth Soccer, *Field & goal standards* (goal 6.5 × 18.5 ft for 7v7, 7 × 21 ft for 9v9). https://www.epysa.org/field-goal-standards/
4. Your Soccer Home, *9v9 soccer field size and dimensions* (citing US Youth Soccer: 14 × 36 yd area, 10-yd mark). https://yoursoccerhome.com/9v9-soccer-field-size-and-dimensions/
5. DribbleUp, *What are the dimensions of a soccer field?* (7v7: 12 × 24 penalty area, 4 × 8 goal area). https://dribbleup.com/blog/what-are-the-dimensions-of-a-soccer-field
6. EPYSA, *7v7 field diagram*. https://www.epysa.org/wp-content/uploads/sites/280/2025/04/7v7.pdf
7. AYSO, *Player Development Initiatives* (build-out line, punting, heading, offside for 9U/10U). https://wiki.ayso.org/wiki/Player_Development_Initiatives
8. U.S. Soccer, *Concussion initiative / heading guidelines* (no heading 10 and under; limited 11–13 in practice), summarized in [1] and [7]; program home: https://www.ussoccer.com/ (search "Recognize to Recover")
9. The Guardian / football tradition of shirt numbers by position (1 keeper … 11 left wing), summarized: https://en.wikipedia.org/wiki/Squad_number_(association_football)
10. FA England Learning, *Positions and roles* (youth modules). https://learning.thefa.com/
11. US Youth Soccer, *Player Development Model* and age-group coaching documents (U9–U12 formations, principles). https://www.usyouthsoccer.org/
12. U.S. Soccer, *The progression from 4v4 to 11v11* (candidate recommended reading). https://www.soccerxpert.com/docs/us-soccer-4v4-to-11v11-progression.pdf
13. U.S. Soccer Learning Center, *Grassroots coaching: the four moments and the principles of play*. https://learning.ussoccer.com/
14. U.S. Soccer, *Soccer Curriculum: concepts and coaching guidelines* (attacking: support, width, depth, overlaps; defending: mark, press, cover, balance), referenced via https://www.soccerxpert.com/docs/us-soccer-4v4-to-11v11-progression.pdf
15. Human Kinetics, *Principles of attack* (penetration, support, mobility, width). https://us.humankinetics.com/blogs/excerpt/principles-of-attack
16. FA England Learning, *Youth Module 1–3 / the four-corner model* (game-realistic practice, throw-ins, switching). https://learning.thefa.com/
17. Michael Cox, *Zonal Marking* (2019) and *The Mixer* (2017), for overlap/underlap, third-man and cutback usage in the modern game.
18. Coerver Coaching, *Ball mastery to group play* (1v1, 2v1, wall pass progressions). https://www.coerver.com/
19. Martí Perarnau, *Pep Confidential* (2014) and *Pep Guardiola: The Evolution* (2016): positional play, third man, half-spaces, rest defense.
20. Juego de posición explainer, Coaches' Voice. https://www.coachesvoice.com/
21. UEFA Technical Reports (Champions League 2023–24, Women's Champions League): pressing triggers, counter-press, compact blocks. https://www.uefatechnicalreports.com/
22. Raphael Honigstein, *Klopp: Bring the Noise* (2017): gegenpressing and counter-press timing.
23. Emma Hayes, public interviews and Chelsea FC Women technical analysis (back-three/back-four flexibility, wing-backs), e.g. The Athletic coverage 2022–24.
