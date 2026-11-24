import { Typography } from "../ui/typography";
import { useLocale } from "../useLocale";
import { useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { AlignButton } from "../ui/button";

function SemesterPill({
  semester,
  active,
  onNavigate,
}: {
  semester: string;
  active: boolean;
  onNavigate: (semester: number) => void;
}) {
  const { text } = useLocale();
  return (
    <AlignButton.Root
      variant={active ? "primary" : "neutral"}
      mode="ghost"
      size="xsmall"
      className="hover:bg-primary-alpha-16 hover:text-primary-base hover:ring-transparent max-[1100px]:min-w-0 max-[1100px]:px-0"
      aria-label={text("Semester {{v0}}", { v0: semester })}
      aria-pressed={active}
      aria-keyshortcuts={semester}
      title={text("Ke semester {{v0}}", { v0: semester })}
      onClick={() => onNavigate(Number(semester))}
    >
      {semester}
    </AlignButton.Root>
  );
}

function SemesterTrack({
  visible,
  lastSemester,
  reducedMotion,
  onEntered,
  onNavigate,
}: {
  visible: number[];
  lastSemester: number;
  reducedMotion: boolean | null;
  onEntered: () => void;
  onNavigate: (semester: number) => void;
}) {
  const semesters = Array.from({ length: lastSemester }, (_, i) => String(i + 1));
  const firstVisible = (visible[0] ?? 1) - 1;
  const visibleSpan = visible.length ? visible[visible.length - 1]! - visible[0]! + 1 : 0;
  const trailingColumns = visible.length
    ? lastSemester - (firstVisible + visibleSpan)
    : lastSemester;
  const bandClip = `inset(0px calc(${(trailingColumns * 100) / lastSemester}% + ${(trailingColumns * 2) / lastSemester}px) 0px calc(${(firstVisible * 100) / lastSemester}% + ${(firstVisible * 2) / lastSemester}px) round 0.5rem)`;

  return (
    <m.div
      initial={reducedMotion ? false : { scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      onAnimationComplete={onEntered}
      transition={reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.25, bounce: 0 }}
      className="relative z-10 flex origin-center items-center gap-0.5 rounded-10 bg-bg-white-0 p-1 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 max-[1100px]:min-w-0 max-[1100px]:flex-1"
    >
      <div
        className="relative grid w-full gap-0.5"
        style={{ gridTemplateColumns: `repeat(${lastSemester}, minmax(0, 1fr))` }}
      >
        <div
          aria-hidden="true"
          data-semester-band=""
          style={{
            clipPath: bandClip,
            opacity: visible.length ? 1 : 0,
          }}
          className="pointer-events-none absolute inset-0 rounded-lg bg-primary-alpha-10 transition-[clip-path,opacity] duration-200 ease-out motion-reduce:transition-none"
        />
        {semesters.map((semester) => (
          <SemesterPill
            key={semester}
            semester={semester}
            active={visible.includes(Number(semester))}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </m.div>
  );
}

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
  const reducedMotion = useReducedMotion();
  const [entered, setEntered] = useState(false);

  return (
    <div
      className="flex min-w-0 items-center gap-2 max-[1100px]:w-full max-[1100px]:max-w-[360px]"
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
          duration: reducedMotion ? 0 : 0.25,
          ease: [0.16, 1, 0.3, 1],
          opacity: { duration: 0 },
        }}
        className="relative z-0"
      >
        <Typography as="span" variant="label">
          {text("Semester")}
        </Typography>
      </m.span>
      <SemesterTrack
        visible={visible}
        lastSemester={lastSemester}
        reducedMotion={reducedMotion}
        onEntered={() => setEntered(true)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
