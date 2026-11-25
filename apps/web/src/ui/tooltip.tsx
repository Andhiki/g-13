// Derived styling. See THIRD_PARTY_NOTICES.md.
import {
  Tooltip,
  TooltipArrow,
  TooltipContent as TooltipContentPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
} from "@ui-sdk/react/tooltip";
import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const tooltipVariants = tv(
  {
    slots: {
      content: [
        "z-50 shadow-tooltip",
        "data-starting-style:animate-in data-starting-style:fade-in-0 data-starting-style:zoom-in-95 data-ending-style:animate-out data-ending-style:fade-out-0 data-ending-style:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      ],
      arrow: "-translate-y-1/2 -rotate-45 border [clip-path:polygon(0_100%,0_0,100%_100%)]",
    },
    variants: {
      size: {
        xsmall: { content: "rounded px-1.5 py-0.5 text-paragraph-xs", arrow: "rounded-bl-sm" },
        small: { content: "rounded-md px-2.5 py-1 text-paragraph-sm", arrow: "rounded-bl-[3px]" },
        medium: { content: "rounded-xl p-3 text-label-sm", arrow: "rounded-bl-sm" },
      },
      variant: {
        dark: {
          content: "bg-bg-strong-950 text-text-white-0",
          arrow: "border-stroke-strong-950 bg-bg-strong-950",
        },
        light: {
          content: "bg-bg-white-0 text-text-strong-950 ring-1 ring-stroke-soft-200",
          arrow: "border-stroke-soft-200 bg-bg-white-0",
        },
      },
    },
    compoundVariants: [
      { size: "xsmall", variant: "dark", class: { arrow: "size-1.5" } },
      { size: "xsmall", variant: "light", class: { arrow: "size-2" } },
      { size: ["small", "medium"], variant: "dark", class: { arrow: "size-2" } },
      { size: ["small", "medium"], variant: "light", class: { arrow: "size-2.5" } },
    ],
    defaultVariants: { size: "small", variant: "dark" },
  },
  { twMerge: false },
);

function Provider({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

type AsChildProps = { asChild?: boolean; children?: React.ReactNode };
type TooltipContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof TooltipContentPrimitive>,
  "className" | "children"
> &
  VariantProps<typeof tooltipVariants> & {
    className?: string;
    children?: React.ReactNode;
  };

function childElementOf(children: React.ReactNode, name: string) {
  const nodes = React.Children.toArray(children);
  if (nodes.length !== 1 || !React.isValidElement(nodes[0])) {
    throw new Error(`${name} with asChild takes exactly one child element.`);
  }
  return nodes[0];
}

const Trigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof TooltipTriggerPrimitive> & AsChildProps
>(({ asChild, children, ...props }, forwardedRef) => (
  <TooltipTriggerPrimitive
    ref={forwardedRef}
    render={asChild ? childElementOf(children, "Tooltip.Trigger") : undefined}
    {...props}
  >
    {asChild ? undefined : children}
  </TooltipTriggerPrimitive>
));
Trigger.displayName = "TooltipTrigger";

const Content = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ size, variant, className, children, sideOffset = 4, ...rest }, forwardedRef) => {
    const { content, arrow } = tooltipVariants({ size, variant });
    return (
      <TooltipContentPrimitive
        ref={forwardedRef}
        sideOffset={sideOffset}
        className={content({ class: className })}
        {...rest}
      >
        {children as React.ReactNode}
        <TooltipArrow className={arrow()} />
      </TooltipContentPrimitive>
    );
  },
);
Content.displayName = "TooltipContent";

export const AlignTooltip = {
  Provider,
  Root: Tooltip,
  Trigger,
  Content,
};
