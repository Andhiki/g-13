import { RiLoader4Line } from "@remixicon/react";
import { AnimatePresence, m } from "motion/react";

export function ButtonSpinner({
  isLoading = false,
  size = "md",
}: {
  isLoading?: boolean;
  size?: "sm" | "md";
}) {
  const iconClass = size === "sm" ? "size-3.5" : "size-4";
  return (
    <AnimatePresence initial={false}>
      {isLoading && (
        <m.span
          key="button-spinner"
          aria-hidden="true"
          initial={{ width: 0, opacity: 0, x: 8, marginRight: -6 }}
          animate={{ width: "auto", opacity: 1, x: 0, marginRight: 0 }}
          exit={{ width: 0, opacity: 0, x: 8, marginRight: -6 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          className="inline-flex shrink-0 items-center justify-center overflow-hidden"
        >
          <RiLoader4Line className={`${iconClass} shrink-0 animate-spin`} />
        </m.span>
      )}
    </AnimatePresence>
  );
}
