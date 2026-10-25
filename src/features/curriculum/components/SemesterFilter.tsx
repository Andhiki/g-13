import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AlignButton } from "../../../ui/button";
import type { Scope } from "../scope";

const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export function SemesterFilter({
  scope,
  onChange,
}: {
  scope: Scope;
  onChange: (scope: Scope) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [entered, setEntered] = useState(false);

  return (
    <div
      className="flex min-w-0 items-center gap-3 max-[1100px]:w-full max-[1100px]:max-w-[360px]"
      role="group"
      aria-label="Filter semester"
    >
      <motion.span
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: reducedMotion || entered ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.15 }}
        className="text-label-sm max-[1100px]:sr-only"
      >
        Semester
      </motion.span>
      <motion.div
        initial={reducedMotion ? false : { scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        onAnimationComplete={() => setEntered(true)}
        transition={
          reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.45, bounce: 0.25 }
        }
        className="flex origin-center items-center gap-0.5 rounded-10 bg-bg-white-0 p-1 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 max-[1100px]:grid max-[1100px]:w-full max-[1100px]:grid-cols-8"
      >
        {semesters.map((semester) => (
          <AlignButton.Root
            key={semester}
            variant={scope === semester ? "primary" : "neutral"}
            mode={scope === semester ? "lighter" : "ghost"}
            size="xsmall"
            className="hover:bg-primary-alpha-16 hover:text-primary-base hover:ring-transparent max-[1100px]:min-w-0 max-[1100px]:px-0"
            aria-label={`Semester ${semester}`}
            aria-pressed={scope === semester}
            title={scope === semester ? "Tampilkan semua semester" : `Semester ${semester}`}
            onClick={() => onChange(scope === semester ? "all" : semester)}
          >
            {semester}
          </AlignButton.Root>
        ))}
      </motion.div>
    </div>
  );
}
