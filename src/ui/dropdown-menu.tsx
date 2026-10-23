// Adapted from AlignUI Dropdown v0.0.0. See docs/licenses/alignui.txt.
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { tv } from "tailwind-variants";

export const dropdownMenuTrigger = tv({
  base: "inline-flex min-h-9 cursor-pointer items-center justify-between gap-2 rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-2.5 text-label-sm text-text-strong-950 shadow-regular-xs hover:bg-bg-weak-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-base [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-text-sub-600",
  variants: {
    full: { true: "min-h-10 w-full text-left" },
    theme: { true: "min-w-[132px] max-[700px]:min-w-[120px]" },
    mobile: { true: "max-[700px]:min-h-11 max-[700px]:max-w-[min(190px,46vw)]" },
    touch: { true: "max-[650px]:min-h-11" },
  },
});

const dropdownContent = tv({
  base: "z-50 flex w-max min-w-[200px] max-w-[min(340px,calc(100vw-24px))] flex-col gap-1 overflow-hidden rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-1.5 text-text-strong-950 shadow-regular-md",
});

const dropdownRadioItem = tv({
  base: "relative flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-paragraph-sm text-text-strong-950 hover:bg-bg-weak-50 focus:bg-bg-weak-50 focus:outline-none data-[state=checked]:text-primary-base [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-text-sub-600 data-[state=checked]:[&_svg]:text-primary-base",
});

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export function DropdownMenuContent({
  className = "",
  sideOffset = 8,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={dropdownContent({ className })}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuRadioItem({
  className = "",
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem className={dropdownRadioItem({ className })} {...props}>
      <span
        className="inline-flex w-[18px] shrink-0 justify-center text-primary-base"
        aria-hidden="true"
      >
        <DropdownMenuPrimitive.ItemIndicator>✓</DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}
