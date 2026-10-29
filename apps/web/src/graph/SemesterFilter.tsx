import { Typography } from "../ui/typography";
import { useLocale } from "../useLocale";
import { useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { AlignButton } from "../ui/button";

export function SemesterFilter({
  visible,
  onNavigate,
  lastSemester = 8,
}: {
  visible: number[];
  onNavigate: (semester: number) => void;
  lastSemester?: number;
}) {
  const { text } = useLocale();
  const semesters = Array.from({ length: lastSemester }, (_, i) => String(i + 1));
  const reducedMotion = useReducedMotion();
  const [entered, setEntered] = useState(false);

  return (
    <div
      className="flex min-w-0 items-center gap-3 max-[1100px]:w-full max-[1100px]:max-w-[360px]"
      role="group"
      aria-label={text("Navigasi semester")}
    >
      <m.span
        initial={reducedMotion ? false : { x: "120%", opacity: 0 }}
        animate={{
          x: reducedMotion || entered ? "0%" : "120%",
          opacity: reducedMotion || entered ? 1 : 0,
        }}
        transition={{
          duration: reducedMotion ? 0 : 0.45,
          ease: [0.16, 1, 0.3, 1],
          opacity: { duration: 0 },
        }}
        className="relative z-0 max-[1100px]:sr-only"
      >
        <Typography as="span" variant="label">
          {text("Semester")}
        </Typography>
      </m.span>
      <m.div
        initial={reducedMotion ? false : { scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        onAnimationComplete={() => setEntered(true)}
        transition={
          reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.45, bounce: 0.25 }
        }
        className="relative z-10 flex origin-center items-center gap-0.5 rounded-10 bg-bg-white-0 p-1 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 max-[1100px]:w-full"
      >
        <div
          className="relative grid w-full gap-0.5"
          style={{ gridTemplateColumns: `repeat(${lastSemester}, minmax(0, 1fr))` }}
        >
          <m.div
            aria-hidden="true"
            data-semester-band=""
            initial={false}
            animate={{
              left: `${((visible[0] ?? 1) - 1) * (100 / lastSemester)}%`,
              width: `${visible.length ? (visible[visible.length - 1]! - visible[0]! + 1) * (100 / lastSemester) : 0}%`,
              opacity: visible.length ? 1 : 0,
            }}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
            className="pointer-events-none absolute inset-y-0 rounded-lg bg-primary-alpha-10"
          />
          {semesters.map((semester) => (
            <AlignButton.Root
              key={semester}
              variant={visible.includes(Number(semester)) ? "primary" : "neutral"}
              mode="ghost"
              size="xsmall"
              className="hover:bg-primary-alpha-16 hover:text-primary-base hover:ring-transparent max-[1100px]:min-w-0 max-[1100px]:px-0"
              aria-label={text("Semester {{v0}}", { v0: semester })}
              aria-pressed={visible.includes(Number(semester))}
              aria-keyshortcuts={semester}
              title={text("Ke semester {{v0}}", { v0: semester })}
              onClick={() => onNavigate(Number(semester))}
            >
              {semester}
            </AlignButton.Root>
          ))}
        </div>
      </m.div>
    </div>
  );
}
