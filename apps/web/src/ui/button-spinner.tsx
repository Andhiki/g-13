import type { ReactNode } from "react";
import { RiLoader4Line } from "@remixicon/react";
import { AnimatePresence, m } from "motion/react";

function ButtonSpinner({
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
          <RiLoader4Line className={`${iconClass} shrink-0 motion-safe:animate-spin`} />
        </m.span>
      )}
    </AnimatePresence>
  );
}

export type ButtonContentProps = {
  icon?: ReactNode;
  iconPosition?: "start" | "end";
};

export function ButtonContent({
  children,
  icon,
  iconPosition = "start",
  isLoading,
  size,
}: ButtonContentProps & {
  children: ReactNode;
  isLoading: boolean;
  size: "sm" | "md";
}) {
  const indicator = icon ? (
    <span
      aria-hidden="true"
      data-loading={isLoading || undefined}
      className="group/button-icon relative inline-flex shrink-0"
    >
      <span className="inline-flex transition-[opacity,translate] duration-180 group-data-loading/button-icon:-translate-y-1 group-data-loading/button-icon:opacity-0 motion-reduce:transition-none">
        {icon}
      </span>
      <span className="absolute inset-0 flex translate-y-1 items-center justify-center opacity-0 transition-[opacity,translate] duration-180 group-data-loading/button-icon:translate-y-0 group-data-loading/button-icon:opacity-100 motion-reduce:transition-none">
        <RiLoader4Line
          className={`${size === "sm" ? "size-3.5" : "size-4"} group-data-loading/button-icon:motion-safe:animate-spin`}
        />
      </span>
    </span>
  ) : (
    <ButtonSpinner isLoading={isLoading} size={size} />
  );

  return (
    <>
      {iconPosition === "start" && indicator}
      {children}
      {iconPosition === "end" && indicator}
    </>
  );
}
