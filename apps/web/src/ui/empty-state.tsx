import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";
import { Typography } from "./typography";

const emptyStateVariants = tv({
  base: "mx-auto flex w-full max-w-sm flex-col py-8 sm:py-10",
  variants: {
    align: {
      left: "items-start text-left",
      center: "items-center text-center",
      right: "items-end text-right",
    },
  },
  defaultVariants: { align: "left" },
});

function Root({
  align,
  className,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof emptyStateVariants>) {
  return <div className={emptyStateVariants({ align, className })} {...props} />;
}

function Icon({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={twMerge("mb-4 text-text-sub-600 [&>svg]:size-8", className)}
      {...props}
    />
  );
}

function Title({ className, ...props }: ComponentProps<"h3">) {
  return (
    <Typography
      as="h3"
      variant="subtitle2"
      className={twMerge("m-0 text-text-strong-950", className)}
      {...props}
    />
  );
}

function Description({ className, ...props }: ComponentProps<"p">) {
  return (
    <Typography
      as="p"
      variant="paragraph"
      className={twMerge("mb-0 mt-2 text-pretty text-text-sub-600", className)}
      {...props}
    />
  );
}

function Actions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={twMerge("mt-4 flex flex-wrap items-center gap-2", className)} {...props} />
  );
}

export const AlignEmptyState = { Root, Icon, Title, Description, Actions };
