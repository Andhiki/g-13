// Adapted from AlignUI LinkButton v1.2. See docs/adr/0002-alignui-source.md and licenses/alignui.txt.
import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { tv, type VariantProps } from "tailwind-variants";

const linkButtonVariants = tv(
  {
    base: [
      "group inline-flex items-center justify-center whitespace-nowrap outline-none",
      "transition duration-200 ease-out underline decoration-transparent underline-offset-[3px]",
      "hover:decoration-current focus:outline-none focus-visible:underline",
      "disabled:pointer-events-none disabled:text-text-disabled-300 disabled:no-underline",
    ],
    variants: {
      variant: {
        gray: "text-text-sub-600 focus-visible:text-text-strong-950",
        black: "text-text-strong-950",
        primary: "text-primary-base hover:text-primary-darker",
        error: "text-error-base hover:text-red-700",
        modifiable: "",
      },
      size: {
        medium: "h-5 gap-1 text-label-sm",
        small: "h-4 gap-1 text-label-xs",
      },
      underline: { true: "decoration-current" },
    },
    defaultVariants: { variant: "gray", size: "medium" },
  },
  {
    twMergeConfig: {
      extend: {
        classGroups: {
          "font-size": [{ text: ["label-sm", "label-xs"] }],
        },
      },
    },
  },
);

function Root({
  asChild,
  variant,
  size,
  underline,
  className,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof linkButtonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return (
    <Component className={linkButtonVariants({ variant, size, underline, className })} {...props} />
  );
}

export const AlignLinkButton = { Root };
