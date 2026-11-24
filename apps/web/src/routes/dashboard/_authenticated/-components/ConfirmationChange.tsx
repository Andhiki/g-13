import type { ReactNode } from "react";
import { RiArrowRightLine } from "@remixicon/react";

export function ConfirmationChange({ from, to }: { from: ReactNode; to: ReactNode }) {
  return (
    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
      <div className="min-w-0 rounded-lg border border-stroke-soft-200 p-2.5">
        <p className="mb-1 text-label-xs text-text-sub-600">Current</p>
        {from}
      </div>
      <RiArrowRightLine aria-hidden="true" className="size-4 text-text-sub-600" />
      <div className="min-w-0 rounded-lg border border-primary-base/30 bg-primary-alpha-10 p-2.5">
        <p className="mb-1 text-label-xs text-text-sub-600">After confirmation</p>
        {to}
      </div>
    </div>
  );
}
