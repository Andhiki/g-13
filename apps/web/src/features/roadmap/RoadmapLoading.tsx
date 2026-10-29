import { useLocale } from "../../useLocale";
import { m, useReducedMotion } from "motion/react";
import { Typography } from "../../ui/typography";

export function RoadmapLoading() {
  const { text } = useLocale("roadmap");
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
          strokeWidth="5"
          strokeLinecap="round"
          className="text-primary-base"
          initial={false}
          animate={
            reducedMotion
              ? { pathLength: 1, pathOffset: 0 }
              : { pathLength: [0, 0.5, 0], pathOffset: [0, 0.5, 1] }
          }
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
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
            animate={reducedMotion ? { y: 0, scale: 1 } : { y: [0, -12, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 0.8, delay: index * 0.15, repeat: Infinity, ease: "easeInOut" }}
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
      <Typography as="h1" variant="subtitle1" className="motion-safe:animate-pulse">
        {text("Lagi merakit roadmapmu")}
      </Typography>
    </main>
  );
}
