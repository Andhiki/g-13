// Derived styling. See THIRD_PARTY_NOTICES.md.
import type { ComponentProps, MouseEvent } from "react";
import { Children, isValidElement } from "react";
import { Button } from "@ui-sdk/react/button";
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
  children,
  onClick,
  type,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof linkButtonVariants> & { asChild?: boolean }) {
  const classes = linkButtonVariants({ variant, size, underline, className });
  const handleClick = onClick
    ? (event: MouseEvent<HTMLElement>) => onClick(event as MouseEvent<HTMLButtonElement>)
    : undefined;
  if (asChild) {
    const child = Children.toArray(children);
    if (child.length !== 1 || !isValidElement(child[0])) {
      throw new Error("LinkButton.Root with asChild takes exactly one child element.");
    }
    return (
      <Button render={child[0]} className={classes} type={type} onClick={handleClick} {...props} />
    );
  }
  return (
    <Button className={classes} type={type ?? "button"} onClick={handleClick} {...props}>
      {children}
    </Button>
  );
}

export const AlignLinkButton = { Root };
