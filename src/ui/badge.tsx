// Adapted from AlignUI Badge v1.2. See docs/design-system.md and docs/licenses/alignui.txt.
import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const badgeVariants = tv({
  base: "inline-flex items-center justify-center rounded-full leading-none transition duration-200 ease-out",
  variants: {
    size: {
      small: "h-4 gap-1.5 px-2 text-subheading-2xs",
      medium: "h-5 gap-1.5 px-2 text-label-xs",
    },
    variant: {
      filled: "bg-faded-base text-static-white",
      light: "bg-faded-light text-faded-dark",
      lighter: "bg-faded-lighter text-faded-base",
      stroke: "ring-1 ring-inset ring-current text-faded-base",
    },
  },
  defaultVariants: { variant: "filled", size: "small" },
});

type BadgeProps = ComponentProps<"div"> & VariantProps<typeof badgeVariants>;

function Root({ className, variant, size, ...props }: BadgeProps) {
  return <div className={badgeVariants({ variant, size, className })} {...props} />;
}

export const AlignBadge = { Root };
