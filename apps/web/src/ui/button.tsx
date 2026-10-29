// Adapted from AlignUI Button v1.2. See docs/adr/0002-alignui-source.md and licenses/alignui.txt.
import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { tv, type VariantProps } from "tailwind-variants";

export const buttonVariants = tv({
  base: [
    "group relative inline-flex items-center justify-center whitespace-nowrap outline-none",
    "transition duration-200 ease-out focus:outline-none",
    "disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 disabled:ring-transparent",
  ],
  variants: {
    variant: { primary: "", neutral: "", "neutral-inverse": "", error: "" },
    mode: {
      filled: "",
      stroke: "ring-1 ring-inset",
      lighter: "ring-1 ring-inset",
      ghost: "ring-1 ring-inset",
    },
    size: {
      medium: "h-10 gap-3 rounded-10 px-3.5 text-label-sm",
      small: "h-9 gap-3 rounded-lg px-3 text-label-sm",
      xsmall: "h-8 gap-2.5 rounded-lg px-2.5 text-label-sm",
      xxsmall: "h-7 gap-2.5 rounded-lg px-2 text-label-sm",
    },
  },
  compoundVariants: [
    {
      variant: "primary",
      mode: "filled",
      class:
        "bg-primary-base text-static-white hover:bg-primary-darker focus-visible:shadow-button-primary-focus",
    },
    {
      variant: "primary",
      mode: "stroke",
      class:
        "bg-bg-white-0 text-primary-base ring-primary-base hover:bg-primary-alpha-10 hover:ring-transparent focus-visible:shadow-button-primary-focus",
    },
    {
      variant: "primary",
      mode: "lighter",
      class:
        "bg-primary-alpha-10 text-primary-base ring-transparent hover:bg-bg-white-0 hover:ring-primary-base focus-visible:shadow-button-primary-focus",
    },
    {
      variant: "primary",
      mode: "ghost",
      class:
        "bg-transparent text-primary-base ring-transparent hover:bg-primary-alpha-10 focus-visible:shadow-button-primary-focus",
    },
    {
      variant: "neutral",
      mode: "filled",
      class:
        "bg-bg-strong-950 text-text-white-0 hover:bg-bg-surface-800 focus-visible:shadow-button-important-focus",
    },
    {
      variant: "neutral-inverse",
      mode: "filled",
      class:
        "bg-static-white text-static-black hover:bg-neutral-100 focus-visible:shadow-button-important-focus",
    },
    {
      variant: "neutral",
      mode: "stroke",
      class:
        "bg-bg-white-0 text-text-sub-600 shadow-regular-xs ring-stroke-soft-200 hover:bg-bg-weak-50 hover:text-text-strong-950 hover:shadow-none hover:ring-transparent focus-visible:text-text-strong-950 focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong-950",
    },
    {
      variant: "neutral",
      mode: "lighter",
      class:
        "bg-bg-weak-50 text-text-sub-600 ring-transparent hover:bg-bg-white-0 hover:text-text-strong-950 hover:shadow-regular-xs hover:ring-stroke-soft-200 focus-visible:bg-bg-white-0 focus-visible:text-text-strong-950 focus-visible:shadow-button-important-focus",
    },
    {
      variant: "neutral",
      mode: "ghost",
      class:
        "bg-transparent text-text-sub-600 ring-transparent hover:bg-bg-weak-50 hover:text-text-strong-950 focus-visible:text-text-strong-950 focus-visible:shadow-button-important-focus",
    },
    {
      variant: "error",
      mode: "filled",
      class:
        "bg-error-base text-static-white hover:bg-red-700 focus-visible:shadow-button-error-focus",
    },
    {
      variant: "error",
      mode: "stroke",
      class:
        "bg-bg-white-0 text-error-base ring-error-base hover:bg-red-alpha-10 hover:ring-transparent focus-visible:shadow-button-error-focus",
    },
    {
      variant: "error",
      mode: "lighter",
      class:
        "bg-red-alpha-10 text-error-base ring-transparent hover:bg-bg-white-0 hover:ring-error-base focus-visible:shadow-button-error-focus",
    },
    {
      variant: "error",
      mode: "ghost",
      class:
        "bg-transparent text-error-base ring-transparent hover:bg-red-alpha-10 focus-visible:shadow-button-error-focus",
    },
  ],
  defaultVariants: { variant: "primary", mode: "filled", size: "medium" },
});

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Root({ asChild, className, variant, mode, size, type = "button", ...props }: ButtonProps) {
  const classes = buttonVariants({ variant, mode, size, className });
  if (asChild) return <Slot className={classes} {...props} />;
  return <button className={classes} type={type} {...props} />;
}

export const AlignButton = { Root };
