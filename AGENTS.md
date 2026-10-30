# Agents

Same rules as CLAUDE.md. Definition of done for any change:
1. `npm test` is green (all sports' libraries, the football tools, fuzzing, the frame budget).
2. The page was opened (`npm run up`) and the change seen on the board.
3. New plays use the sport's conventions and keep kid-friendly summaries; cite new terms in `research/`.
4. **Launcher registration:** the app is listed on mutaafaziz.com (every edition, the ⌘K dock and deep links) and on Digital Craft `/labs`; update both when URLs change.
5. CourtIQ consumes this package from GitHub: bump the version tag and update CourtIQ's dependency when the public API (`mount` options) changes.
