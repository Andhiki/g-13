// Adapted from AlignUI Select v1.2. See docs/design-system.md and docs/licenses/alignui.txt.
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as SelectPrimitive from "@radix-ui/react-select";
import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react";
import { twMerge } from "tailwind-merge";
import { createContext, useContext, type ComponentProps } from "react";

type SelectVariant = "default" | "compact";
const SelectContext = createContext<SelectVariant>("default");

function Root({
  variant = "default",
  ...props
}: ComponentProps<typeof SelectPrimitive.Root> & { variant?: SelectVariant }) {
  return (
    <SelectContext.Provider value={variant}>
      <SelectPrimitive.Root {...props} />
    </SelectContext.Provider>
  );
}
const Value = SelectPrimitive.Value;

function Trigger({
  children,
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  const variant = useContext(SelectContext);
  return (
    <SelectPrimitive.Trigger
      className={twMerge(
        "group/trigger flex h-10 min-h-10 min-w-0 shrink-0 items-center rounded-10 bg-bg-white-0 text-left text-paragraph-sm text-text-strong-950 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 outline-none transition duration-200 ease-out hover:bg-bg-weak-50 hover:ring-transparent focus:shadow-button-important-focus focus:outline-none focus:ring-stroke-strong-950 focus:text-text-strong-950 data-[placeholder]:text-text-sub-600 disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 disabled:shadow-none disabled:ring-transparent",
        variant === "compact" ? "w-auto gap-1 pl-3 pr-2.5" : "w-full gap-2 pl-3 pr-2.5",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <RiArrowDownSLine className="ml-auto size-5 shrink-0 text-text-sub-600 transition duration-200 ease-out group-data-[state=open]/trigger:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function Content({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={twMerge(
          "relative z-50 overflow-hidden rounded-2xl bg-bg-white-0 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200 min-w-[--radix-select-trigger-width] max-w-[max(var(--radix-select-trigger-width),320px)] max-h-[--radix-select-content-available-height] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        position="popper"
        sideOffset={8}
        collisionPadding={8}
        {...props}
      >
        <ScrollArea.Root type="auto">
          <SelectPrimitive.Viewport asChild>
            <ScrollArea.Viewport
              style={{ overflowY: undefined }}
              className="max-h-[196px] w-full scroll-py-2 overflow-auto p-2"
            >
              {children}
            </ScrollArea.Viewport>
          </SelectPrimitive.Viewport>
          <ScrollArea.Scrollbar orientation="vertical">
            <ScrollArea.Thumb className="!w-1 rounded bg-bg-soft-200" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function Item({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={twMerge(
        "group relative flex cursor-pointer select-none items-center gap-2 rounded-lg p-2 pr-9 text-paragraph-sm text-text-strong-950 transition duration-200 ease-out data-[disabled]:pointer-events-none data-[disabled]:text-text-disabled-300 data-[highlighted]:bg-bg-weak-50 data-[highlighted]:outline-0",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText asChild>
        <span className="flex flex-1 items-center gap-2">
          {typeof children === "string" ? (
            <span className="line-clamp-1">{children}</span>
          ) : (
            children
          )}
        </span>
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator asChild>
        <RiCheckLine className="absolute right-2 top-1/2 size-5 shrink-0 -translate-y-1/2 text-text-sub-600" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function ItemIcon({ children, ...props }: ComponentProps<"div">) {
  return (
    <div className="size-5 shrink-0 text-text-sub-600" {...props}>
      {children}
    </div>
  );
}

export const AlignSelect = { Root, Trigger, Value, Content, Item, ItemIcon };
