// Derived styling. See THIRD_PARTY_NOTICES.md.
import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const progressBar = tv({
  slots: {
    root: "h-1.5 w-full rounded-full bg-bg-soft-200",
    progress:
      "h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none",
  },
  variants: {
    color: {
      blue: { progress: "bg-information-base" },
      red: { progress: "bg-error-base" },
      orange: { progress: "bg-warning-base" },
      green: { progress: "bg-success-base" },
    },
  },
  defaultVariants: { color: "blue" },
});

function Root({
  className,
  color,
  value = 0,
  max = 100,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof progressBar> & { value?: number; max?: number }) {
  const { root, progress } = progressBar({ color });
  const safeValue = Math.min(max, Math.max(value, 0));
  return (
    <div
      className={root({ className })}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={max}
      {...props}
    >
      <div className={progress()} style={{ width: `${(safeValue / max) * 100}%` }} />
    </div>
  );
}

export const AlignProgressBar = { Root };
