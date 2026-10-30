# Agents

Same rules as CLAUDE.md. Definition of done for any change:
1. `npm test` is green (all sports' libraries, the football tools, fuzzing, the frame budget).
2. The page was opened (`npm run up`) and the change seen on the board.
3. New plays use the sport's conventions and keep kid-friendly summaries; cite new terms in `research/`.
4. **Launcher registration:** the app is listed on mutaafaziz.com (every edition, the ⌘K dock and deep links) and on Digital Craft `/labs`; update both when URLs change.
5. **Release notes:** every user-facing change adds an item to `RELEASES` in `src/tour.js` (newest first, play-by-play broadcaster voice: energetic, clear, professional) with a `show` target where it applies, and bumps `VERSION` there and in package.json. New UI gets a `title` (it becomes a styled tooltip). New core features get a tour step in `TOUR`.
6. CourtIQ consumes this package from GitHub: bump the version tag and update CourtIQ's dependency when the public API (`mount` options) changes.

## Ads and privacy
Owner decision 2026-10-30: the standalone page carries one Marquee banner at the foot of the Plays
list (see CLAUDE.md → Ads). Keep ads out of `src/`, `admin/` and the board; the ad privacy policy is
https://mutaafaziz.com/ads/privacy/ and is linked under the slot.

## URL parameters
Deep links from mutaafaziz.com's launcher point at these; keep them working.
- `?sport=basketball | flag5 | flag7`: which sport opens (slugs like `flag-football` work too).
- `&play=<key>`: which library play opens, e.g. `?sport=flag7&play=smash`, `?sport=basketball&play=spain-pnr`. Unknown keys fall back to the sport's first play.
