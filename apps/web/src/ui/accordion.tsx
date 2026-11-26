// Derived styling. See THIRD_PARTY_NOTICES.md.

"use client";

import * as React from "react";
import {
  Accordion as AccordionPrimitive,
  AccordionHeader as AccordionHeaderPrimitive,
  AccordionItem as AccordionItemPrimitive,
  AccordionPanel,
  AccordionTrigger as AccordionTriggerPrimitive,
} from "@ui-sdk/react/accordion";
import { RiAddLine, RiSubtractLine } from "@remixicon/react";

// Keep custom typography and color tokens: tailwind-merge treats both as text colors.
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" ");

type AccordionSdkProps = React.ComponentProps<typeof AccordionPrimitive>;
type AccordionChangeDetails = Parameters<NonNullable<AccordionSdkProps["onValueChange"]>>[1];
type AccordionRootProps = Omit<
  AccordionSdkProps,
  "multiple" | "defaultValue" | "value" | "onValueChange"
> & {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[], details: AccordionChangeDetails) => void;
};

function AccordionRoot({
  type = "single",
  collapsible = false,
  defaultValue,
  value,
  onValueChange,
  ...props
}: AccordionRootProps) {
  const multiple = type === "multiple";
  const toValues = (next: string | string[] | undefined) => {
    if (next === undefined) return undefined;
    const values = Array.isArray(next) ? next : [next];
    return multiple ? values : values.slice(0, 1);
  };
  const handleValueChange: AccordionSdkProps["onValueChange"] = onValueChange
    ? (next, details) => onValueChange(multiple ? next : (next[0] ?? ""), details)
    : undefined;

  return (
    <AccordionPrimitive
      multiple={multiple}
      collapsible={collapsible}
      defaultValue={toValues(defaultValue)}
      value={toValues(value)}
      onValueChange={handleValueChange}
      {...props}
    />
  );
}

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof AccordionItemPrimitive>
>(({ className, ...rest }, forwardedRef) => {
  return (
    <AccordionItemPrimitive
      ref={forwardedRef}
      className={cn(
        "group/accordion flow-root",
        typeof className === "string" ? className : undefined,
      )}
      {...rest}
    />
  );
});
AccordionItem.displayName = "AccordionItem";

const AccordionHeader = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof AccordionHeaderPrimitive>
>(({ className, ...rest }, forwardedRef) => (
  <AccordionHeaderPrimitive
    ref={forwardedRef}
    className={typeof className === "string" ? className : undefined}
    {...rest}
  />
));
AccordionHeader.displayName = "AccordionHeader";

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof AccordionTriggerPrimitive>
>(({ children, className, ...rest }, forwardedRef) => {
  return (
    <AccordionTriggerPrimitive
      ref={forwardedRef}
      className={cn(
        "flex min-h-11 w-full items-center justify-between gap-3 py-3 text-left text-label-sm text-text-strong-950",
        "rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-base",
        typeof className === "string" ? className : undefined,
      )}
      {...rest}
    >
      {children as React.ReactNode}
    </AccordionTriggerPrimitive>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

type AccordionArrowProps = React.HTMLAttributes<HTMLDivElement> & {
  openIcon?: React.ElementType;
  closeIcon?: React.ElementType;
};

// open/close
function AccordionArrow({
  className,
  openIcon: OpenIcon = RiAddLine,
  closeIcon: CloseIcon = RiSubtractLine,
  ...rest
}: AccordionArrowProps) {
  return (
    <>
      <OpenIcon
        className={cn(
          "size-5 text-text-soft-400",
          "transition duration-200 ease-out",
          // hover
          "group-hover/accordion:text-text-sub-600",
          // open
          "group-data-open/accordion:hidden",
          typeof className === "string" ? className : undefined,
        )}
        {...rest}
      />
      <CloseIcon
        className={cn(
          "size-5 text-text-sub-600",
          // close
          "hidden group-data-open/accordion:block",
          className,
        )}
        {...rest}
      />
    </>
  );
}
AccordionArrow.displayName = "AccordionArrow";

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof AccordionPanel>
>(({ children, className, ...rest }, forwardedRef) => {
  return (
    <AccordionPanel
      ref={forwardedRef}
      keepMounted
      className="grid grid-rows-[0fr] opacity-0 invisible pointer-events-none transition-[grid-template-rows,opacity,visibility] duration-200 ease-out data-open:grid-rows-[1fr] data-open:opacity-100 data-open:visible data-open:pointer-events-auto motion-reduce:transition-none"
      {...rest}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            "text-paragraph-sm text-text-sub-600",
            typeof className === "string" ? className : undefined,
          )}
        >
          {children as React.ReactNode}
        </div>
      </div>
    </AccordionPanel>
  );
});
AccordionContent.displayName = "AccordionContent";

export {
  AccordionRoot as Root,
  AccordionHeader as Header,
  AccordionItem as Item,
  AccordionTrigger as Trigger,
  AccordionArrow as Arrow,
  AccordionContent as Content,
};
