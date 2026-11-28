// Derived styling. See THIRD_PARTY_NOTICES.md.
import type { ComponentProps, MouseEvent } from "react";
import { Children, isValidElement } from "react";
import { Button } from "@ui-sdk/react/button";
import { createTV, type VariantProps } from "tailwind-variants";
import { ButtonContent, type ButtonContentProps } from "./button-spinner";

const tv = createTV({
  twMergeConfig: { extend: { classGroups: { "font-size": ["text-label-sm", "text-label-xs"] } } },
});

const fancyButton = tv({
  base: [
    "group relative inline-flex items-center justify-center whitespace-nowrap outline-none",
    "transition duration-200 ease-out focus:outline-none",
    "bg-primary-base text-static-white dark:text-static-black shadow-fancy-buttons-primary focus-visible:outline-primary-base/55",
    "disabled:pointer-events-none disabled:text-text-disabled-300",
    "disabled:bg-bg-weak-50 disabled:bg-none disabled:shadow-none disabled:before:hidden disabled:after:hidden",
    "before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-[inherit]",
    "before:bg-linear-to-b before:p-px before:from-static-white/[.12] before:to-transparent",
    "before:[mask-clip:content-box,border-box] before:[mask-composite:exclude] before:[mask-image:linear-gradient(#fff_0_0),linear-gradient(#fff_0_0)]",
    "after:absolute after:inset-0 after:rounded-[inherit] after:bg-linear-to-b after:from-static-white after:to-transparent",
    "after:pointer-events-none after:opacity-[.16] after:transition after:duration-200 after:ease-out hover:after:opacity-[.24]",
  ],
  variants: {
    size: {
      medium:
        "h-10 gap-3 rounded-10 px-3.5 text-label-sm focus-visible:outline-2 focus-visible:outline-offset-2",
      small:
        "h-9 gap-2.5 rounded-lg px-3 text-label-sm focus-visible:outline-2 focus-visible:outline-offset-1",
      xsmall:
        "h-8 gap-2 rounded-lg px-3 text-label-sm focus-visible:outline-[1.5px] focus-visible:outline-offset-1",
      xxsmall:
        "h-7 gap-1.5 rounded-lg px-2.5 text-label-xs focus-visible:outline-[1.5px] focus-visible:outline-offset-0",
    },
    compact: { true: "" },
  },
  compoundVariants: [
    {
      size: "small",
      compact: true,
      class: "gap-1.5 text-label-xs",
    },
    {
      size: "medium",
      compact: true,
      class: "gap-2 px-3",
    },
  ],
  defaultVariants: { size: "medium" },
});

type FancyButtonProps = ComponentProps<"button"> &
  VariantProps<typeof fancyButton> &
  ButtonContentProps & { asChild?: boolean; isLoading?: boolean };

function Root({
  asChild = false,
  size,
  compact,
  className,
  type = "button",
  isLoading = false,
  icon,
  iconPosition,
  disabled,
  children,
  onClick,
  ...props
}: FancyButtonProps) {
  const classes = fancyButton({ size, compact, className });
  const handleClick = onClick
    ? (event: MouseEvent<HTMLElement>) => onClick(event as MouseEvent<HTMLButtonElement>)
    : undefined;
  if (asChild) {
    const child = Children.toArray(children);
    if (child.length !== 1 || !isValidElement(child[0])) {
      throw new Error("FancyButton.Root with asChild takes exactly one child element.");
    }
    return (
      <Button
        render={child[0]}
        className={classes}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        onClick={handleClick}
        {...props}
      />
    );
  }
  const spinnerSize = size === "xxsmall" || size === "xsmall" ? "sm" : "md";
  return (
    <Button
      className={classes}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      onClick={handleClick}
      {...props}
    >
      <ButtonContent
        icon={icon}
        iconPosition={iconPosition}
        isLoading={isLoading}
        size={spinnerSize}
      >
        {children}
      </ButtonContent>
    </Button>
  );
}

export const AlignFancyButton = { Root };
