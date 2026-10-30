# Agents

Same rules as CLAUDE.md. Definition of done for any change:
1. `npm test` is green (all sports' libraries, the football tools, fuzzing, the frame budget).
2. The page was opened (`npm run up`) and the change seen on the board.
3. New plays use the sport's conventions and keep kid-friendly summaries; cite new terms in `research/`.
4. **Launcher registration:** the app is listed on mutaafaziz.com (every edition, the ⌘K dock and deep links) and on Digital Craft `/labs`; update both when URLs change.
5. CourtIQ consumes this package from GitHub: bump the version tag and update CourtIQ's dependency when the public API (`mount` options) changes.

## URL parameters
Deep links from mutaafaziz.com's launcher point at these; keep them working.
- `?sport=basketball | flag5 | flag7`: which sport opens (slugs like `flag-football` work too).
- `&play=<key>`: which library play opens, e.g. `?sport=flag7&play=smash`, `?sport=basketball&play=spain-pnr`. Unknown keys fall back to the sport's first play.
