# g-13 cinematic trailer

28-second Indonesian product film, 1920 × 1080 at 30 fps, with an original
ambient score and synchronized typing/click sounds.

The film recreates the app's interface as React and SVG: search input and results,
course metadata tabs, prerequisite paths, detail drawer, roadmap choices and
semester cards, and the exam archive's folders and file rows. Every interaction
and camera movement is driven by Remotion frames. No screenshots or screen
recordings are used in the composition.

```sh
bun install --frozen-lockfile
bun run --cwd apps/trailer studio
```

Choose `G13Trailer`. To export:

```sh
bun run --cwd apps/trailer render --codec=h264 --crf=18 --x264-preset=veryfast
```

Output: `apps/trailer/out/g13-cinematic.mp4` (ignored by Git).

- `src/Composition.tsx`: authored shots, interaction timing, camera movement.
- `src/UI.tsx`: reconstructed interface components and illustrated courses.
- `src/motion.ts`: easing and shot visibility.
- `src/Root.tsx`: duration, dimensions, and frame rate.
- `scripts/make-soundtrack.py`: reproducible original audio; run `bun run audio`.

The reference clip informed the isolated controls, whitespace, typing, selection,
and pacing. It is not included as footage or audio. Light-mode components and
behaviors were inspected using the shared MCP browser on 29 October 2026.
The selected course is Algoritma dan Struktur Data, curriculum 2026. The graph
shows direct prerequisite relationships; tests compare featured cards and edges
against `@g13/curriculum`. The roadmap is an illustrative excerpt rather than a
complete graduation plan. Archive rows preserve two real Basis Data 2023 filenames
from the application's catalog; exam PDFs are not bundled.

Geist is bundled unmodified under SIL OFL 1.1 (`public/geist-OFL.txt`).
The closing shot uses the existing official OmahTI and HIMAKOM assets, copied
unmodified from `apps/web/public/brand/`; provenance is in `public/brand/README.md`
and rights remain with their owners. No external music, photos, or reference-video
assets are included.

Verification:

```sh
bun run --cwd apps/trailer lint
bun run --cwd apps/trailer fmt:check
bun run --cwd apps/trailer typecheck
bun run --cwd apps/trailer test
```
