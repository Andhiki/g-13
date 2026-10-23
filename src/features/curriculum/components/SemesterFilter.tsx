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
  return (
    <div
      className="flex min-w-0 items-center gap-3 max-[1100px]:w-full max-[1100px]:max-w-[360px]"
      role="group"
      aria-label="Filter semester"
    >
      <span className="text-label-sm max-[1100px]:sr-only">Semester</span>
      <div className="flex items-center gap-0.5 rounded-10 bg-bg-white-0 p-1 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 max-[1100px]:grid max-[1100px]:w-full max-[1100px]:grid-cols-8">
        {semesters.map((semester) => (
          <AlignButton.Root
            key={semester}
            variant="neutral"
            mode={scope === semester ? "filled" : "ghost"}
            size="xsmall"
            className="max-[1100px]:min-w-0 max-[1100px]:px-0"
            aria-label={`Semester ${semester}`}
            aria-pressed={scope === semester}
            title={scope === semester ? "Tampilkan semua semester" : `Semester ${semester}`}
            onClick={() => onChange(scope === semester ? "all" : semester)}
          >
            {semester}
          </AlignButton.Root>
        ))}
      </div>
    </div>
  );
}
