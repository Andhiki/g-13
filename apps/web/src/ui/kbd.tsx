// Adapted from AlignUI Kbd v1.2. See docs/adr/0002-alignui-source.md and licenses/alignui.txt.
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

function Root({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={twMerge(
        "inline-flex h-5 w-fit items-center gap-0.5 whitespace-nowrap rounded bg-bg-white-0 px-1.5 text-text-soft-400 ring-1 ring-inset ring-stroke-soft-200",
        className,
      )}
      {...props}
    >
      <span className="text-subheading-2xs">{children}</span>
    </div>
  );
}

export const AlignKbd = { Root };
