// Derived styling. See THIRD_PARTY_NOTICES.md.
import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const badgeVariants = tv(
  {
    base: "inline-flex items-center justify-center whitespace-nowrap rounded-full leading-none transition duration-200 ease-out",
    variants: {
      size: {
        small: "h-4 gap-1 px-1.5 text-[10px] leading-3",
        medium: "h-5 gap-1.5 px-2 text-label-2xs",
      },
      variant: {
        filled: "bg-faded-base text-static-white",
        light: "bg-faded-light text-faded-dark",
        lighter: "bg-faded-lighter text-faded-base",
        stroke: "ring-1 ring-inset ring-current text-faded-base",
        information: "bg-information-light text-information-dark",
        warning: "bg-warning-light text-warning-dark",
      },
      shape: {
        pill: "",
        tag: "h-auto rounded-xl px-2.5 py-1 leading-4 whitespace-normal",
      },
    },
    defaultVariants: { variant: "filled", size: "small", shape: "pill" },
  },
  {
    twMergeConfig: {
      extend: { classGroups: { "font-size": ["text-label-xs", "text-label-2xs"] } },
    },
  },
);

type BadgeProps = ComponentProps<"div"> & VariantProps<typeof badgeVariants>;

function Root({ className, variant, size, shape, ...props }: BadgeProps) {
  return <div className={badgeVariants({ variant, size, shape, className })} {...props} />;
}

export const AlignBadge = { Root };
