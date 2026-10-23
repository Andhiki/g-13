// Adapted from AlignUI CommandMenu v1.2. See docs/design-system.md and docs/licenses/alignui.txt.
import * as React from "react";
import { Command } from "cmdk";
import type { DialogContentProps, DialogProps } from "@radix-ui/react-dialog";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";
import { AlignModal } from "./modal";

type DialogComponentProps = DialogProps & {
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  onCloseAutoFocus?: DialogContentProps["onCloseAutoFocus"];
  shouldFilter?: boolean;
};

function Dialog({
  children,
  className,
  overlayClassName,
  onCloseAutoFocus,
  shouldFilter = true,
  ...props
}: DialogComponentProps) {
  return (
    <AlignModal.Root {...props}>
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
          shouldFilter={shouldFilter}
          className={twMerge(
            "divide-y divide-stroke-soft-200",
            "grid min-h-0 auto-cols-auto grid-flow-row max-[650px]:flex-1 max-[650px]:grid-rows-[auto_minmax(0,1fr)]",
            "[&>[cmdk-label]+*]:!border-t-0",
          )}
        >
          {children}
        </Command>
      </AlignModal.Content>
    </AlignModal.Root>
  );
}

const DialogTitle = AlignModal.Title;
const DialogDescription = AlignModal.Description;

const Input = React.forwardRef<
  React.ComponentRef<typeof Command.Input>,
  React.ComponentPropsWithoutRef<typeof Command.Input>
>(({ className, ...props }, ref) => (
  <Command.Input
    ref={ref}
    className={twMerge(
      "w-full bg-transparent text-paragraph-sm text-text-strong-950 outline-none transition duration-200 ease-out placeholder:[transition:inherit] placeholder:text-text-soft-400 focus:outline-none",
      className,
    )}
    {...props}
  />
));
Input.displayName = "CommandInput";

const List = React.forwardRef<
  React.ComponentRef<typeof Command.List>,
  React.ComponentPropsWithoutRef<typeof Command.List>
>(({ className, ...props }, ref) => (
  <Command.List
    ref={ref}
    className={twMerge(
      "flex max-h-min min-h-0 flex-1 flex-col [&>[cmdk-list-sizer]]:divide-y [&>[cmdk-list-sizer]]:divide-stroke-soft-200 [&>[cmdk-list-sizer]]:overflow-auto",
      className,
    )}
    {...props}
  />
));
List.displayName = "CommandList";

const Group = React.forwardRef<
  React.ComponentRef<typeof Command.Group>,
  React.ComponentPropsWithoutRef<typeof Command.Group>
>(({ className, ...props }, ref) => (
  <Command.Group
    ref={ref}
    className={twMerge(
      "relative px-2 py-3",
      "[&>[cmdk-group-heading]]:text-label-xs [&>[cmdk-group-heading]]:text-text-sub-600",
      "[&>[cmdk-group-heading]]:mb-2 [&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:pt-1",
      className,
    )}
    {...props}
  />
));
Group.displayName = "CommandGroup";

const Empty = Command.Empty;

const itemVariants = tv({
  base: [
    "flex items-center gap-3 rounded-10 bg-bg-white-0",
    "cursor-pointer text-paragraph-sm text-text-strong-950",
    "transition duration-200 ease-out data-[selected=true]:bg-bg-weak-50",
  ],
  variants: {
    size: { small: "px-3 py-2.5", medium: "px-3 py-3" },
  },
  defaultVariants: { size: "small" },
});

type ItemProps = VariantProps<typeof itemVariants> &
  React.ComponentPropsWithoutRef<typeof Command.Item>;

const Item = React.forwardRef<React.ComponentRef<typeof Command.Item>, ItemProps>(
  ({ className, size, ...props }, ref) => (
    <Command.Item ref={ref} className={itemVariants({ size, className })} {...props} />
  ),
);
Item.displayName = "CommandItem";

export const AlignCommandMenu = {
  Dialog,
  DialogTitle,
  DialogDescription,
  Input,
  List,
  Group,
  Empty,
  Item,
};
