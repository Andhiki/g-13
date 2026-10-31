# Web fonts

Run `python scripts/optimize-fonts.py` in a Python environment with
`fonttools==4.68.0` and `brotli==1.2.1`, after `bun install --frozen-lockfile`.
Then run `bun run --cwd apps/web fmt`, review the audit and pixel comparisons,
and commit `apps/web/src/fonts/` with the changes. Processing is manual; the
build consumes committed assets.

Rerun after changing font versions, content, translations, curriculum data,
font families, weights, inline styles, OpenType settings, or hyphenation.
Review the explicit axis/feature allowlists for style changes. Repeat original
versus optimized screenshots against the same settled DOM, including accented
characters, bold inside italics, code, component overrides, and CJK.

The script scans TS/TSX, CSS and JSON in web source and both data packages.
It retains supported Latin-1/Extended-A, source characters, U+2010 if supported,
and their canonical decompositions. That last step matters: browsers can compose
an absent precomposed character from a base and combining mark in the font.
It never introduces CJK coverage or changes fallback stacks or font-display.

Source and rendered-style inspection found Inter 400/500 and Geist 500, no
custom feature/axis overrides, and manual hyphenation. Code uses system
monospace. There was no italic face, and synthesis remains disabled. The axis
range is 400–900 to preserve browser `bolder` selection inside heavier runs.
Tabular numerals (`tnum`) are retained for zoom controls, semester indicators,
and course tables. Unused numeric features are removed; default shaping, hinting and `.notdef`
outlines are retained. Internal derivative names are G13InterSubset and
G13GeistSubset, with adjacent OFL license copies. Outputs are reopened and their
cmaps asserted against the requested coverage. Empty glyph variations
removed by instancing are restored for FontTools' subsetter.

## Measurements

Original/generated glyph counts, axes, feature tags and hinting are recorded
in [`audit.json`](../apps/web/src/fonts/audit.json).

| Font | Original bytes | Optimized bytes | Saved |
| --- | ---: | ---: | ---: |
| Inter | 48,256 | 31,240 | 17,016 |
| Geist | 29,400 | 19,220 | 10,180 |
| Total | 77,656 | 50,460 | 27,196 (35.0%) |

Each of `/`, `/roadmap`, `/exam`, `/resources`, and `/alumni` originally fetched
both fonts (77,656 bytes) and preloaded neither. The optimized root preloads
both generated fonts (50,460 bytes). Byte totals are WOFF2 payload sizes,
excluding HTTP headers. The trailer's independent Geist font is unchanged.

## Rejected candidates

The exact-cmap unicode-range split changed the accent/CJK specimen by 8,877
pixels. The browser could no longer select the font for absent-but-composable
Latin characters. This is a rendering regression, so the default keeps one
file per family and has no unicode-range restriction or extended-file fetch.
There is no generated fallback face.

The rejected core files totaled 32,000 bytes (Inter 19,296; Geist 12,704), and
the extended files totaled 21,500 (Inter 12,624; Geist 8,876). Keeping the verified
single files costs 18,460 bytes on a core-only page; when both extended files
would be needed, the verified single files save 3,040 bytes over the split.
Removing hinting saves only 68 bytes total
(Inter 31,156; Geist 19,236), but changes 44,481 specimen pixels, so it stays. No change was accepted merely
as harmless rounding. Embedding or idle precaching was not added.

The full specimen passed with **zero changed pixels** after preserving canonical
decompositions. It covers normal/italic/nested bold runs at 400/500/600/700,
ASCII, ligatures, accents, Extended-A, punctuation, code, Chinese, Japanese,
and Korean. Verification captures and temporary scripts live in
`.scratch/font-audit/`, outside the committed application and test suite.

Tool reference: [FontTools subsetting documentation](https://fonttools.readthedocs.io/en/latest/subset/index.html).

Production Chromium captures at 1440×1000 compare original Fontsource faces and
optimized faces on the same built content and settled DOM: `/`, `/roadmap`,
`/exam`, `/resources`, and `/alumni` each have **zero changed pixels**. Network
capture confirms two font downloads and two font preloads per page, totaling
50,460 bytes. `bun run check` and `bun run build` pass. Coverage is one Linux
Chromium environment; other browser/OS rasterizers were not tested.
