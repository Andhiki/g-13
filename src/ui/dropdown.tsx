// Adapted from AlignUI Dropdown v1.2. See docs/design-system.md and docs/licenses/alignui.txt.
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { RiCheckLine } from "@remixicon/react";
import { twMerge } from "tailwind-merge";
import type { ComponentProps } from "react";

const Root = DropdownPrimitive.Root;
const Trigger = DropdownPrimitive.Trigger;
const RadioGroup = DropdownPrimitive.RadioGroup;

function Content({
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        className={twMerge(
          "z-50 w-max overflow-hidden rounded-2xl bg-bg-white-0 p-2 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200 flex flex-col gap-1 data-[side=bottom]:origin-top data-[side=left]:origin-right data-[side=right]:origin-left data-[side=top]:origin-bottom data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        sideOffset={sideOffset}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

function RadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownPrimitive.RadioItem>) {
  return (
    <DropdownPrimitive.RadioItem
      className={twMerge(
        "group/item relative flex cursor-pointer select-none items-center gap-2 rounded-lg p-2 text-paragraph-sm text-text-strong-950 outline-none transition duration-200 ease-out data-[highlighted]:bg-bg-weak-50 data-[disabled]:text-text-disabled-300",
        className,
      )}
      {...props}
    >
      {children}
      <span className="ml-auto flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
        <DropdownPrimitive.ItemIndicator asChild>
          <RiCheckLine className="size-5 text-text-sub-600" />
        </DropdownPrimitive.ItemIndicator>
      </span>
    </DropdownPrimitive.RadioItem>
  );
}

function ItemIcon({ children, ...props }: ComponentProps<"div">) {
  return (
    <div className="size-5 text-text-sub-600" {...props}>
      {children}
    </div>
  );
}

export const AlignDropdown = { Root, Trigger, RadioGroup, Content, RadioItem, ItemIcon };
