import { useId } from "react";

type GlyphShape = {
  fill: string;
  cutout: string;
  done?: string;
  trace?: string;
  badge?: { cx: number; cy: number; r: number };
};

const glyphs = {
  review: {
    fill: "M14 10h68a10 10 0 0 1 10 10v36a10 10 0 0 1-10 10H40l-16 14V66H14A10 10 0 0 1 4 56V20a10 10 0 0 1 10-10Z",
    cutout: "M26 30h44M26 44h26",
    done: "M32 38l10 10 22-20",
  },
  person: {
    fill: "M44 6a17 17 0 1 1 0 34 17 17 0 0 1 0-34ZM12 82c0-20 14-34 32-34s32 14 32 34Z",
    cutout: "M76 58v12m-6-6h12",
    done: "M70 64l4 4 8-8",
    badge: { cx: 76, cy: 64, r: 13 },
  },
  pin: {
    fill: "M48 4C30 4 16 18 16 36c0 24 32 48 32 48s32-24 32-48C80 18 66 4 48 4Z",
    cutout: "M38 28a10 10 0 1 1 15 9c-4 2-5 4-5 8M48 58h0",
  },
  warning: {
    fill: "M43.7 9.5a5 5 0 0 1 8.6 0l38.4 66a5 5 0 0 1-4.3 7.5H9.6a5 5 0 0 1-4.3-7.5Z",
    cutout: "M48 36v18M48 68h0",
  },
  hand: {
    fill: "M24 22a4 4 0 0 1 8 0v30h-8ZM36 16a4 4 0 0 1 8 0v36h-8ZM48 20a4 4 0 0 1 8 0v32h-8ZM60 30a4 4 0 0 1 8 0v22h-8ZM24 46h44v20a18 18 0 0 1-18 18h-8a18 18 0 0 1-18-18ZM27 70 12 55a4.5 4.5 0 0 1 6.5-6.5L30 58Z",
    cutout: "M38 68q8 5 16 0",
    trace: "M74 14q7 5 8 14M80 6q11 8 12 24",
  },
} satisfies Record<string, GlyphShape>;

export type HalftoneGlyph = keyof typeof glyphs;

function Glyph({
  id,
  index,
  shape,
  done,
  transform,
}: {
  id: string;
  index: number;
  shape: GlyphShape;
  done: boolean;
  transform?: string;
}) {
  const cutId = `${id}-cut-${index}`;
  const { badge } = shape;
  return (
    <g transform={transform}>
      <mask id={cutId}>
        <rect width="96" height="88" className="fill-static-white" />
        {badge && (
          <>
            <circle cx={badge.cx} cy={badge.cy} r={badge.r + 4} className="fill-static-black" />
            <circle cx={badge.cx} cy={badge.cy} r={badge.r} className="fill-static-white" />
          </>
        )}
        <path
          d={done && shape.done ? shape.done : shape.cutout}
          className="stroke-static-black"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </mask>
      <g mask={`url(#${cutId})`}>
        <g mask={`url(#${id}-fade)`} opacity="0.8">
          <path d={shape.fill} fill={`url(#${id}-dots)`} />
          {shape.trace && (
            <path
              d={shape.trace}
              stroke={`url(#${id}-dots)`}
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}
          {badge && <circle cx={badge.cx} cy={badge.cy} r={badge.r} fill={`url(#${id}-dots)`} />}
        </g>
      </g>
    </g>
  );
}

/** Dotted pictograms with negative-space marks. `done` swaps a glyph's mark for a check where it has one. */
export function HalftoneIllustration({
  items,
  done = false,
  width = 96,
  height = 88,
  className = "h-24 w-auto",
}: {
  items: { glyph: HalftoneGlyph; transform?: string }[];
  done?: boolean;
  width?: number;
  height?: number;
  className?: string;
}) {
  const id = useId().replace(/[^\w-]/g, "");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true" className={className}>
      <defs>
        <pattern id={`${id}-dots`} width="3.5" height="3.5" patternUnits="userSpaceOnUse">
          <circle cx="1.75" cy="1.75" r="1.1" className="fill-primary-base" />
        </pattern>
        <radialGradient id={`${id}-fade-gradient`} cx="50%" cy="45%" r="70%">
          <stop offset="0.4" stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.35" />
        </radialGradient>
        <mask id={`${id}-fade`} className="[mask-type:alpha]">
          <rect width={width} height={height} fill={`url(#${id}-fade-gradient)`} />
        </mask>
      </defs>
      {items.map((item, index) => (
        <Glyph
          key={item.glyph}
          id={id}
          index={index}
          shape={glyphs[item.glyph]}
          done={done}
          transform={item.transform}
        />
      ))}
    </svg>
  );
}
