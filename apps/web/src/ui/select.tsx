// Derived styling. See THIRD_PARTY_NOTICES.md.
import {
  Select as SelectPrimitive,
  SelectContent as SelectContentPrimitive,
  SelectItem as SelectItemPrimitive,
  SelectItemIcon as SelectItemIconPrimitive,
  SelectItemIndicator,
  SelectTrigger as SelectTriggerPrimitive,
  SelectValue as SelectValuePrimitive,
  type SelectProps,
} from "@ui-sdk/react/select";
import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react";
import { createCn } from "cn/config";
import { createContext, forwardRef, useContext, type ComponentProps, type ReactNode } from "react";

const cn = createCn({
  extend: { classGroups: { "font-size": ["text-paragraph-sm", "text-paragraph-xs"] } },
});

type SelectVariant = "default" | "compact";
const SelectContext = createContext<SelectVariant>("default");

type SelectRootProps = Omit<
  SelectProps<string, false>,
  "multiple" | "value" | "defaultValue" | "onValueChange"
> & {
  variant?: SelectVariant;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

function Root({ variant = "default", onValueChange, ...props }: SelectRootProps) {
  return (
    <SelectContext.Provider value={variant}>
      <SelectPrimitive
        {...props}
        onValueChange={
          onValueChange ? (value) => value !== null && onValueChange(value) : undefined
        }
      />
    </SelectContext.Provider>
  );
}

const Value = SelectValuePrimitive;

const Trigger = forwardRef<HTMLButtonElement, ComponentProps<typeof SelectTriggerPrimitive>>(
  function Trigger({ children, className, ...props }, forwardedRef) {
    const variant = useContext(SelectContext);
    return (
      <SelectTriggerPrimitive
        ref={forwardedRef}
        className={cn(
          "group/trigger flex h-10 min-h-10 min-w-0 shrink-0 items-center rounded-10 bg-bg-white-0 text-left text-paragraph-sm text-text-strong-950 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 outline-none transition duration-200 ease-out hover:bg-bg-weak-50 hover:ring-transparent focus:outline-none focus-visible:ring-stroke-strong-950 focus-visible:text-text-strong-950 data-placeholder:text-text-sub-600 data-disabled:pointer-events-none data-disabled:bg-bg-weak-50 data-disabled:text-text-disabled-300 data-disabled:shadow-none data-disabled:ring-transparent",
          variant === "compact"
            ? "w-auto gap-1 pl-3 pr-2.5 focus-visible:outline-[1.5px] focus-visible:outline-offset-1"
            : "w-full gap-2 pl-3 pr-2.5 focus-visible:outline-2 focus-visible:outline-offset-1",
          typeof className === "string" ? className : undefined,
        )}
        {...props}
      >
        {children as ReactNode}
        <RiArrowDownSLine className="ml-auto size-5 shrink-0 text-text-sub-600 transition duration-200 ease-out group-data-open/trigger:rotate-180" />
      </SelectTriggerPrimitive>
    );
  },
);
Trigger.displayName = "SelectTrigger";

function Content({
  className,
  children,
  viewportClassName,
  ...props
}: ComponentProps<typeof SelectContentPrimitive> & { viewportClassName?: string }) {
  return (
    <SelectContentPrimitive
      className={cn(
        "relative z-50 min-w-[var(--anchor-width)] max-w-[max(var(--anchor-width),320px)] max-h-[var(--available-height)] overflow-hidden rounded-2xl bg-bg-white-0 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200 origin-(--transform-origin) transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:transition-none",
        typeof className === "string" ? className : undefined,
      )}
      sideOffset={8}
      collisionPadding={8}
      {...props}
    >
      <div
        className={cn("max-h-[196px] w-full scroll-py-2 overflow-y-auto p-2", viewportClassName)}
      >
        {children as ReactNode}
      </div>
    </SelectContentPrimitive>
  );
}

function Item({ className, children, ...props }: ComponentProps<typeof SelectItemPrimitive>) {
  return (
    <SelectItemPrimitive
      className={cn(
        "group relative flex cursor-[var(--interactive-cursor)] select-none items-center gap-2 rounded-lg p-2 pr-9 text-paragraph-sm text-text-strong-950 transition duration-200 ease-out data-disabled:pointer-events-none data-disabled:text-text-disabled-300 data-highlighted:bg-bg-weak-50 data-highlighted:outline-0",
        typeof className === "string" ? className : undefined,
      )}
      {...props}
    >
      <span className="flex flex-1 items-center gap-2">
        {typeof children === "string" ? (
          <span className="line-clamp-1">{children}</span>
        ) : (
          (children as ReactNode)
        )}
      </span>
      <SelectItemIndicator render={<span />}>
        <RiCheckLine className="absolute right-2 top-1/2 size-5 shrink-0 -translate-y-1/2 text-text-sub-600" />
      </SelectItemIndicator>
    </SelectItemPrimitive>
  );
}

function ItemIcon({ children, ...props }: ComponentProps<"div">) {
  return (
    <SelectItemIconPrimitive
      render={<div />}
      className="size-5 shrink-0 text-text-sub-600"
      {...props}
    >
      {children}
    </SelectItemIconPrimitive>
  );
}

export const AlignSelect = { Root, Trigger, Value, Content, Item, ItemIcon };
