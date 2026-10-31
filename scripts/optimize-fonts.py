"""Manual only: run with fonttools==4.68.0 and brotli==1.2.1 installed."""
import json
import unicodedata
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'apps/web/src/fonts'
OUT.mkdir(exist_ok=True)
# Scan source and runtime data, including inline styles, translations and course names.
characters = set(range(0x20, 0x180)) | {0x2010}
for directory in ['apps/web/src', 'packages/curriculum/src', 'packages/i18n/src']:
    for path in (ROOT / directory).rglob('*'):
        if path.suffix in {'.tsx', '.ts', '.css', '.json'}:
            characters.update(map(ord, path.read_text()))
characters.update(ord(part) for cp in list(characters) for part in unicodedata.normalize('NFD', chr(cp)))
report = {}
css = []

def inspect(font, path):
    return dict(bytes=path.stat().st_size, glyphs=len(font.getGlyphOrder()),
                axes={a.axisTag: [a.minValue, a.defaultValue, a.maxValue] for a in font['fvar'].axes} if 'fvar' in font else {},
                features={tag: sorted({r.FeatureTag for r in font[tag].table.FeatureList.FeatureRecord}) for tag in ['GSUB', 'GPOS'] if tag in font},
                hinting=any(t in font for t in ['fpgm', 'prep', 'cvt ']),
                codepoints=len(font.getBestCmap()))

for family in ['inter', 'geist']:
    source = ROOT / f'node_modules/@fontsource-variable/{family}/files/{family}-latin-wght-normal.woff2'
    original = TTFont(source, lazy=False)
    report[family] = {'before': inspect(original, source), 'after': {}}
    available = set(original.getBestCmap())
    font = instantiateVariableFont(TTFont(source, lazy=False), {'wght': (400, 900)}, inplace=True)
    # Instancing removes empty variations; the subsetter expects every glyph key.
    for glyph in font.getGlyphOrder():
        font["gvar"].variations.setdefault(glyph, [])
    options = subset.Options()
    options.layout_features = ["calt", "ccmp", "liga", "clig", "locl", "kern", "mark", "mkmk", "rlig", "rvrn", "tnum"]
    options.hinting = True
    options.notdef_outline = True
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=characters & available)
    worker.subset(font)
    # Use distinct internal names for these OFL derivatives.
    for record in font['name'].names:
        if record.nameID in {1, 3, 4, 6, 16, 17}:
            record.string = f'G13{family.title()}Subset'.encode(record.getEncoding())
    path = OUT / f'{family}-subset.woff2'
    font.recalcTimestamp = False
    font.save(path)
    generated = TTFont(path)
    actual = set(generated.getBestCmap())
    assert actual == characters & available
    report[family]['after']['subset'] = inspect(generated, path)
    css.append(f'''@font-face {{
  font-family: "{family.title()} Variable";
  font-style: normal;
  font-display: swap;
  font-weight: 400 900;
  src: url("./{family}-subset.woff2") format("woff2");
}}''')
    (OUT / f'{family}-LICENSE.txt').write_bytes((source.parents[1] / 'LICENSE').read_bytes())
(OUT / 'fonts.css').write_text('\n'.join(css) + '\n')
(OUT / 'audit.json').write_text(json.dumps(report, indent=2) + '\n')
