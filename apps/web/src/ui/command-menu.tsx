// Adapted from AlignUI CommandMenu v1.2. See docs/adr/0002-alignui-source.md and THIRD_PARTY_NOTICES.md.
import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  type CommandInputState,
  type CommandItemProps,
  type CommandItemState,
  type CommandListState,
  type CommandProps,
  type CommandShortcutState,
} from "@ui-sdk/react/command";
import type { PartProps } from "@ui-sdk/react/primitive";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";
import { AlignModal } from "./modal";

// The wrappers merge static classes, so callers pass class strings, not render functions.
type ClassProps<State> = Omit<PartProps<"div", State>, "className" | "children"> & {
  children?: React.ReactNode;
  className?: string;
};
type InputProps = Omit<PartProps<"input", CommandInputState>, "className"> & {
  className?: string;
};
type ItemProps = Omit<
  ClassProps<CommandItemState>,
  "value" | "defaultValue" | "onChange" | "onSelect"
> &
  CommandItemProps;

type DialogProps = CommandProps & {
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  onCloseAutoFocus?: React.ComponentProps<typeof AlignModal.Content>["onCloseAutoFocus"];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function Dialog({
  children,
  className,
  overlayClassName,
  onCloseAutoFocus,
  open,
  onOpenChange,
  ...props
}: DialogProps) {
  return (
    <AlignModal.Root open={open} onOpenChange={onOpenChange}>
      <AlignModal.Content
        overlayClassName={twMerge("justify-start pt-20", overlayClassName)}
        showClose={false}
        onCloseAutoFocus={onCloseAutoFocus}
        className={twMerge(
          "flex max-h-full max-w-[720px] flex-col overflow-hidden rounded-2xl",
          className,
        )}
      >
        <Command
          className={twMerge(
            "grid min-h-0 auto-cols-auto grid-flow-row divide-y divide-stroke-soft-200",
            "max-[650px]:flex-1 max-[650px]:grid-rows-[auto_minmax(0,1fr)_auto]",
          )}
          {...props}
        >
          {children}
        </Command>
      </AlignModal.Content>
    </AlignModal.Root>
  );
}

const DialogTitle = AlignModal.Title;
const DialogDescription = AlignModal.Description;

function Input({ className, ...props }: InputProps) {
  return (
    <CommandInput
      className={twMerge(
        "w-full bg-transparent text-paragraph-sm text-text-strong-950 outline-none transition duration-200 ease-out placeholder:[transition:inherit] placeholder:text-text-soft-400 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

const listVariants = tv({
  base: "flex min-h-0 flex-1 flex-col divide-y divide-stroke-soft-200 overflow-auto",
  variants: { elevated: { true: "shadow-regular-md" } },
});

function List({
  className,
  elevated,
  ...props
}: ClassProps<CommandListState> & VariantProps<typeof listVariants>) {
  return <CommandList className={listVariants({ elevated, className })} {...props} />;
}

function Group({ className, ...props }: ClassProps<Record<string, never>>) {
  return <CommandGroup className={twMerge("relative px-2 py-3", className)} {...props} />;
}

const Empty = CommandEmpty;
const Separator = CommandSeparator;

const itemVariants = tv({
  base: [
    "flex items-center gap-3 rounded-10 bg-bg-white-0",
    "cursor-[var(--interactive-cursor)] text-paragraph-sm text-text-strong-950",
    "transition duration-200 ease-out data-highlighted:bg-bg-weak-50",
  ],
  variants: {
    size: { small: "px-3 py-2.5", medium: "px-3 py-3" },
  },
  defaultVariants: { size: "small" },
});

function Item({ className, size, ...props }: ItemProps & VariantProps<typeof itemVariants>) {
  return <CommandItem className={itemVariants({ size, className })} {...props} />;
}

function Shortcut({ className, ...props }: ClassProps<CommandShortcutState>) {
  return (
    <CommandShortcut
      className={twMerge("ms-auto text-label-xs text-text-sub-600", className)}
      {...props}
    />
  );
}

export const AlignCommandMenu = {
  Root: Command,
  Dialog,
  DialogTitle,
  DialogDescription,
  Input,
  List,
  Group,
  Empty,
  Item,
  Separator,
  Shortcut,
};
