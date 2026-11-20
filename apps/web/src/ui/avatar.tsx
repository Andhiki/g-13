// Adapted from AlignUI Avatar. See docs/adr/0002-alignui-source.md and THIRD_PARTY_NOTICES.md.
import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const avatar = tv(
  {
    base: "relative flex shrink-0 select-none items-center justify-center rounded-full bg-bg-soft-200 text-center uppercase text-text-strong-950",
    variants: {
      size: {
        "24": "size-6 text-label-xs",
        "32": "size-8 text-label-sm",
        "40": "size-10 text-label-md",
      },
    },
    defaultVariants: { size: "32" },
  },
  {
    twMergeConfig: {
      extend: { classGroups: { "font-size": ["text-label-md", "text-label-sm", "text-label-xs"] } },
    },
  },
);

function Root({ size, className, ...props }: ComponentProps<"div"> & VariantProps<typeof avatar>) {
  return <div className={avatar({ size, className })} {...props} />;
}

export const AlignAvatar = { Root };
