// Adapted from AlignUI CompactButton v0.0.0. See docs/adr/0002-alignui-source.md and THIRD_PARTY_NOTICES.md.
import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const compactButton = tv({
  base: [
    "relative flex shrink-0 items-center justify-center rounded-md outline-none",
    "transition duration-200 ease-out",
    "disabled:pointer-events-none disabled:border-transparent disabled:bg-transparent disabled:text-text-disabled-300 disabled:shadow-none",
    "border border-stroke-soft-200 bg-bg-white-0 text-text-sub-600 shadow-regular-xs",
    "hover:border-transparent hover:bg-bg-weak-50 hover:text-text-strong-950 hover:shadow-none",
    "focus-visible:outline-[1.5px] focus-visible:outline-offset-1 focus-visible:outline-stroke-strong-950/35 focus-visible:text-text-strong-950",
  ],
  variants: {
    size: { large: "size-6", medium: "size-5" },
  },
  defaultVariants: { size: "large" },
});

export function CompactButton({
  className,
  size,
  type = "button",
  ...props
}: ComponentProps<"button"> & VariantProps<typeof compactButton>) {
  return <button type={type} className={compactButton({ size, className })} {...props} />;
}
