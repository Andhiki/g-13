import { m, useReducedMotion } from "motion/react";
import { Typography } from "../../ui/typography";

export function RoadmapLoading() {
  const reducedMotion = useReducedMotion();
  const route = "M32 112 H80 Q104 112 104 88 V64 Q104 40 128 40 H208";

  return (
    <main
      role="status"
      className="flex min-h-[calc(100dvh-var(--app-header-height))] flex-col items-center justify-center gap-4 bg-bg-white-0 px-5 text-center text-text-strong-950"
    >
      <svg viewBox="0 0 240 152" className="w-60 max-w-full" aria-hidden="true">
        <path
          d={route}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-stroke-soft-200"
        />
        <m.path
          d={route}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-primary-base"
          initial={false}
          animate={reducedMotion ? { pathLength: 1 } : { pathLength: [0, 1, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        {[
          [32, 112],
          [80, 112],
          [128, 40],
          [208, 40],
        ].map(([x, y], index) => (
          <m.g
            key={x}
            initial={false}
            animate={reducedMotion ? { y: 0 } : { y: [0, -8, 0] }}
            transition={{ duration: 0.7, delay: index * 0.12, repeat: Infinity, repeatDelay: 0.3 }}
          >
            <rect
              x={x - 10}
              y={y - 10}
              width="20"
              height="20"
              rx="6"
              fill="currentColor"
              className={index === 3 ? "text-warning-base" : "text-primary-base"}
            />
            <path
              d={`M${x - 4} ${y} l3 3 5 -6`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-static-white"
            />
          </m.g>
        ))}
      </svg>
      <Typography as="h1" variant="subtitle1">
        Lagi merakit roadmapmu
      </Typography>
    </main>
  );
}
