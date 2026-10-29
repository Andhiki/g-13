// Adapted from AlignUI FancyButton v0.0.0. See docs/adr/0002-alignui-source.md and licenses/alignui.txt.
import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { tv } from "tailwind-variants";

const fancyButton = tv({
  base: [
    "group relative inline-flex items-center justify-center whitespace-nowrap text-label-sm outline-none",
    "h-10 gap-3 rounded-10 px-3.5 transition duration-200 ease-out",
    "bg-primary-base text-static-white dark:text-static-black shadow-fancy-buttons-primary focus-visible:shadow-button-primary-focus",
    "disabled:pointer-events-none disabled:text-text-disabled-300",
    "disabled:bg-bg-weak-50 disabled:bg-none disabled:shadow-none disabled:before:hidden disabled:after:hidden",
    "before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-[inherit]",
    "before:bg-gradient-to-b before:p-px before:from-static-white/[.12] before:to-transparent",
    "before:[mask-clip:content-box,border-box] before:[mask-composite:exclude] before:[mask-image:linear-gradient(#fff_0_0),linear-gradient(#fff_0_0)]",
    "after:absolute after:inset-0 after:rounded-[inherit] after:bg-gradient-to-b after:from-static-white after:to-transparent",
    "after:pointer-events-none after:opacity-[.16] after:transition after:duration-200 after:ease-out hover:after:opacity-[.24]",
  ],
});

function Root({
  asChild = false,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={fancyButton({ className })}
      type={asChild ? undefined : type}
      {...props}
    />
  );
}

export const AlignFancyButton = { Root };
