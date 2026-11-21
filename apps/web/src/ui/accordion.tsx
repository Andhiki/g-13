// Adapted from AlignUI Accordion v0.0.0; plain section styling requested for course details.

"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { RiAddLine, RiSubtractLine } from "@remixicon/react";

// Keep custom typography and color tokens: tailwind-merge treats both as text colors.
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" ");

const ACCORDION_ITEM_NAME = "AccordionItem";

const ACCORDION_ARROW_NAME = "AccordionArrow";
const ACCORDION_TRIGGER_NAME = "AccordionTrigger";
const ACCORDION_CONTENT_NAME = "AccordionContent";

const AccordionRoot = AccordionPrimitive.Root;
const AccordionHeader = AccordionPrimitive.Header;

const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...rest }, forwardedRef) => {
  return (
    <AccordionPrimitive.Item
      ref={forwardedRef}
      className={cn("group/accordion flow-root", className)}
      {...rest}
    />
  );
});
AccordionItem.displayName = ACCORDION_ITEM_NAME;

const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ children, className, ...rest }, forwardedRef) => {
  return (
    <AccordionPrimitive.Trigger
      ref={forwardedRef}
      className={cn(
        "flex min-h-11 w-full items-center justify-between gap-3 py-3 text-left text-label-sm text-text-strong-950",
        "rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-base",
        className,
      )}
      {...rest}
    >
      {children}
    </AccordionPrimitive.Trigger>
  );
});
AccordionTrigger.displayName = ACCORDION_TRIGGER_NAME;

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
          "group-data-[state=open]/accordion:hidden",
          className,
        )}
        {...rest}
      />
      <CloseIcon
        className={cn(
          "size-5 text-text-sub-600",
          // close
          "hidden group-data-[state=open]/accordion:block",
          className,
        )}
        {...rest}
      />
    </>
  );
}
AccordionArrow.displayName = ACCORDION_ARROW_NAME;

const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ children, className, ...rest }, forwardedRef) => {
  return (
    <AccordionPrimitive.Content
      ref={forwardedRef}
      forceMount
      className="grid grid-rows-[0fr] opacity-0 invisible pointer-events-none transition-[grid-template-rows,opacity,visibility] duration-200 ease-out data-[state=open]:grid-rows-[1fr] data-[state=open]:opacity-100 data-[state=open]:visible data-[state=open]:pointer-events-auto motion-reduce:transition-none"
      {...rest}
    >
      <div className="min-h-0 overflow-hidden">
        <div className={cn("text-paragraph-sm text-text-sub-600", className)}>{children}</div>
      </div>
    </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = ACCORDION_CONTENT_NAME;

export {
  AccordionRoot as Root,
  AccordionHeader as Header,
  AccordionItem as Item,
  AccordionTrigger as Trigger,
  AccordionArrow as Arrow,
  AccordionContent as Content,
};
