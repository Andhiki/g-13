// Adapted from AlignUI Kbd v1.2. See docs/design-system.md and docs/licenses/alignui.txt.
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

function Root({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={twMerge(
        "flex h-5 items-center gap-0.5 whitespace-nowrap rounded bg-bg-white-0 px-1.5 text-subheading-xs text-text-soft-400 ring-1 ring-inset ring-stroke-soft-200",
        className,
      )}
      {...props}
    />
  );
}

export const AlignKbd = { Root };
