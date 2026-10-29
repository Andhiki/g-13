// Adapted from AlignUI Breadcrumb v1.2. See docs/adr/0002-alignui-source.md and licenses/alignui.txt.
import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type BreadcrumbProps = ComponentProps<"div"> & { asChild?: boolean };

function Root({ asChild, className, ...props }: BreadcrumbProps) {
  const Component = asChild ? Slot : "div";
  return <Component className={twMerge("flex flex-wrap gap-1.5", className)} {...props} />;
}

function Item({ asChild, active, className, ...props }: BreadcrumbProps & { active?: boolean }) {
  const Component = asChild ? Slot : "div";
  return (
    <Component
      className={twMerge(
        clsx(
          "flex items-center gap-1.5 transition-colors duration-200 ease-out",
          "text-label-sm text-text-sub-600",
          active
            ? "text-text-strong-950"
            : "underline decoration-transparent hover:text-text-strong-950 hover:decoration-current",
        ),
        className,
      )}
      {...props}
    />
  );
}

function ArrowIcon({ asChild, className, ...props }: BreadcrumbProps) {
  const Component = asChild ? Slot : "div";
  return (
    <Component
      className={twMerge(
        "flex size-5 select-none items-center justify-center text-text-disabled-300",
        className,
      )}
      {...props}
    />
  );
}

export const AlignBreadcrumb = { Root, Item, ArrowIcon };
