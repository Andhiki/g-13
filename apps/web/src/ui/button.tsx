// Adapted from AlignUI Button v1.2. See docs/adr/0002-alignui-source.md and THIRD_PARTY_NOTICES.md.
import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { createTV, type VariantProps } from "tailwind-variants";
import { ButtonContent, type ButtonContentProps } from "./button-spinner";

const tv = createTV({
  twMergeConfig: { extend: { classGroups: { "font-size": ["text-label-sm", "text-label-xs"] } } },
});

export const buttonVariants = tv({
  base: [
    "group relative inline-flex items-center justify-center whitespace-nowrap outline-none",
    "transition duration-200 ease-out focus:outline-none",
    "disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 disabled:ring-transparent",
  ],
  variants: {
    variant: {
      primary: "focus-visible:outline-primary-base/55",
      neutral: "focus-visible:outline-stroke-strong-950/35",
      "neutral-inverse": "focus-visible:outline-stroke-strong-950/35",
      error: "focus-visible:outline-error-base/50",
    },
    mode: {
      filled: "",
      stroke: "ring-1 ring-inset",
      lighter: "ring-1 ring-inset",
      ghost: "ring-1 ring-inset",
    },
    size: {
      medium:
        "h-10 gap-3 rounded-10 px-3.5 text-label-sm focus-visible:outline-2 focus-visible:outline-offset-2",
      small:
        "h-9 gap-3 rounded-lg px-3 text-label-sm focus-visible:outline-2 focus-visible:outline-offset-1",
      xsmall:
        "h-8 gap-2.5 rounded-lg px-2.5 text-label-sm focus-visible:outline-[1.5px] focus-visible:outline-offset-1",
      xxsmall:
        "h-7 gap-2.5 rounded-lg px-2 text-label-xs focus-visible:outline-[1.5px] focus-visible:outline-offset-0",
    },
    iconOnly: { true: "" },
    compact: { true: "" },
  },
  compoundVariants: [
    {
      variant: "primary",
      mode: "filled",
      class: "bg-primary-base text-static-white hover:bg-primary-darker",
    },
    {
      variant: "primary",
      mode: "stroke",
      class:
        "bg-bg-white-0 text-primary-base ring-primary-base hover:bg-primary-alpha-10 hover:ring-transparent",
    },
    {
      variant: "primary",
      mode: "lighter",
      class:
        "bg-primary-alpha-10 text-primary-base ring-transparent hover:bg-bg-white-0 hover:ring-primary-base",
    },
    {
      variant: "primary",
      mode: "ghost",
      class: "bg-transparent text-primary-base ring-transparent hover:bg-primary-alpha-10",
    },
    {
      variant: "neutral",
      mode: "filled",
      class: "bg-bg-strong-950 text-text-white-0 hover:bg-bg-surface-800",
    },
    {
      variant: "neutral-inverse",
      mode: "filled",
      class: "bg-static-white text-static-black hover:bg-neutral-100",
    },
    {
      variant: "neutral",
      mode: "stroke",
      class:
        "bg-bg-white-0 text-text-sub-600 shadow-regular-xs ring-stroke-soft-200 hover:bg-bg-weak-50 hover:text-text-strong-950 hover:shadow-none hover:ring-transparent focus-visible:text-text-strong-950 focus-visible:ring-stroke-strong-950",
    },
    {
      variant: "neutral",
      mode: "lighter",
      class:
        "bg-bg-weak-50 text-text-sub-600 ring-transparent hover:bg-bg-white-0 hover:text-text-strong-950 hover:shadow-regular-xs hover:ring-stroke-soft-200 focus-visible:bg-bg-white-0 focus-visible:text-text-strong-950",
    },
    {
      variant: "neutral",
      mode: "ghost",
      class:
        "bg-transparent text-text-sub-600 ring-transparent hover:bg-bg-weak-50 hover:text-text-strong-950 focus-visible:text-text-strong-950",
    },
    {
      variant: "error",
      mode: "filled",
      class: "bg-error-base text-static-white hover:bg-red-700",
    },
    {
      variant: "error",
      mode: "stroke",
      class:
        "bg-bg-white-0 text-error-base ring-error-base hover:bg-red-alpha-10 hover:ring-transparent",
    },
    {
      variant: "error",
      mode: "lighter",
      class:
        "bg-red-alpha-10 text-error-base ring-transparent hover:bg-bg-white-0 hover:ring-error-base",
    },
    {
      variant: "error",
      mode: "ghost",
      class: "bg-transparent text-error-dark ring-transparent hover:bg-red-alpha-10",
    },
    {
      size: "medium",
      iconOnly: true,
      class: "size-10 p-0",
    },
    {
      size: "xsmall",
      iconOnly: true,
      class: "size-8 p-0",
    },
    {
      size: "xxsmall",
      iconOnly: true,
      class: "size-7 p-0",
    },
    {
      size: "small",
      compact: true,
      class: "gap-1.5 text-label-xs",
    },
    {
      size: "xxsmall",
      compact: true,
      class: "gap-1",
    },
  ],
  defaultVariants: { variant: "primary", mode: "filled", size: "medium" },
});

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> &
  ButtonContentProps & { asChild?: boolean; isLoading?: boolean };

function Root({
  asChild,
  className,
  variant,
  mode,
  size,
  iconOnly,
  compact,
  type = "button",
  isLoading = false,
  icon,
  iconPosition,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = buttonVariants({ variant, mode, size, iconOnly, compact, className });
  if (asChild)
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    );
  const spinnerSize = size === "xxsmall" || size === "xsmall" ? "sm" : "md";
  return (
    <button
      className={classes}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
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
    </button>
  );
}

export const AlignButton = { Root };
