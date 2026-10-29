# Run and export the g-13 trailer

Use this guide to preview the trailer in Remotion Studio and export an MP4.
Run every command from the repository root.

## Install Node.js and Bun

Install Node.js 20.19 or later in the 20.x line, 22.13 or later in the 22.x
line, or 24 or later. Get it from the [official Node.js download page](https://nodejs.org/en/download/).

Install Bun 1.4.3, the version pinned by this repository. Use the command for
your terminal. These commands come from Bun's [installation guide](https://bun.sh/docs/installation).

macOS or Linux:

```sh
curl -fsSL https://bun.com/install | bash -s "bun-v1.4.3"
```

Windows PowerShell:

```powershell
iex "& {$(irm https://bun.com/install.ps1)} -Version 1.4.3"
```

Check that both tools are available:

```sh
node --version
bun --version
```

`bun --version` should print `1.4.3`.

## Install the project

Clone your fork of the repository, then open a terminal in the `g-13` folder.
If you need help with a fork or clone, follow the repository's
[contribution guide](../../CONTRIBUTING.md).

Install the workspace dependencies:

```sh
bun install --frozen-lockfile
bun run build:packages
```

Run both commands after a fresh clone. Run `bun install --frozen-lockfile` again
when dependencies change.

## Preview the trailer

Start Remotion Studio:

```sh
bun run --cwd apps/trailer studio
```

Open the local address printed in the terminal. Select `G13Trailer` if it is not
already selected, then press play. Stop Studio with `Ctrl+C` in the terminal.
Read [Remotion Studio's guide](https://www.remotion.dev/docs/studio) for more
about preview controls.

## Export the MP4

Run the render command:

```sh
bun run --cwd apps/trailer render --codec=h264 --crf=18 --x264-preset=veryfast
```

When the render finishes, open `apps/trailer/out/trailer.mp4`. The `out/`
folder is ignored by Git, so the rendered video stays on your computer and is
not included in commits. To learn about other render options, see
[Remotion's render guide](https://www.remotion.dev/docs/render).

## Edit the trailer

- Change scenes, copy, and animation timing in `src/Composition.tsx`.
- Change the reconstructed app controls and cards in `src/UI.tsx`.
- Change shared easing and colors in `src/motion.ts`.
- Change the video size, frame rate, or duration in `src/Root.tsx`.

The trailer draws the app screens with React and SVG. It does not use screenshots
or screen recordings. The roadmap shows a few example semesters, not a complete
graduation plan. Archive rows use two Basis Data 2023 filenames from the app's
catalog. The exam PDFs are not included.

To recreate the original soundtrack after editing `scripts/make-soundtrack.py`,
install Python 3 and run:

```sh
bun run --cwd apps/trailer audio
```

This writes `public/soundtrack.wav`. The existing audio file is already included,
so you do not need Python to preview or export the trailer.

## Check your changes

Run these checks before sharing code:

```sh
bun run --cwd apps/trailer lint
bun run --cwd apps/trailer fmt:check
bun run --cwd apps/trailer typecheck
bun run --cwd apps/trailer test
```

The tests check the motion helpers and the featured courses against
`@g13/curriculum`. For the full repository checks and pull request steps, read
the [contribution guide](../../CONTRIBUTING.md).

## Assets and credits

The trailer uses the Geist font under SIL Open Font License 1.1. It uses the
existing OmahTI and HIMAKOM logo assets without changes. See
[`public/brand/README.md`](public/brand/README.md) for logo sources and
`public/geist-OFL.txt` for the font license. The trailer does not include the
reference video, its audio, or external music.
