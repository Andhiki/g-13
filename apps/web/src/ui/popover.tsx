// Derived styling. See THIRD_PARTY_NOTICES.md.

import {
  Popover,
  PopoverArrow,
  PopoverClose as PopoverClosePrimitive,
  PopoverContent as PopoverContentPrimitive,
  PopoverTrigger as PopoverTriggerPrimitive,
} from "@ui-sdk/react/popover";
import * as React from "react";
import { twMerge } from "tailwind-merge";

type AsChildProps = { asChild?: boolean; children?: React.ReactNode };

const PopoverAnchorContext = React.createContext<{
  anchor: HTMLElement | null;
  setAnchor: (anchor: HTMLElement | null) => void;
}>({ anchor: null, setAnchor: () => {} });

function PopoverRoot({ children, ...props }: React.ComponentProps<typeof Popover>) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  return (
    <Popover {...props}>
      <PopoverAnchorContext.Provider value={{ anchor, setAnchor }}>
        {children}
      </PopoverAnchorContext.Provider>
    </Popover>
  );
}

function childElementOf(children: React.ReactNode, name: string) {
  const nodes = React.Children.toArray(children);
  if (nodes.length !== 1 || !React.isValidElement(nodes[0])) {
    throw new Error(`${name} with asChild takes exactly one child element.`);
  }
  return nodes[0];
}

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof PopoverTriggerPrimitive> & AsChildProps
>(({ asChild, children, ...props }, forwardedRef) => (
  <PopoverTriggerPrimitive
    ref={forwardedRef}
    render={asChild ? childElementOf(children, "Popover.Trigger") : undefined}
    {...props}
  >
    {asChild ? undefined : children}
  </PopoverTriggerPrimitive>
));
PopoverTrigger.displayName = "PopoverTrigger";

const PopoverAnchor = React.forwardRef<HTMLElement, React.ComponentProps<"span"> & AsChildProps>(
  ({ asChild, children, ...props }, forwardedRef) => {
    const { setAnchor } = React.useContext(PopoverAnchorContext);
    const anchorRef = React.useCallback(
      (node: HTMLElement | null) => {
        setAnchor(node);
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef, setAnchor],
    );
    if (asChild) {
      const child = childElementOf(children, "Popover.Anchor") as React.ReactElement<
        Record<string, unknown>
      >;
      return React.cloneElement(child, {
        ...props,
        ref: anchorRef,
      } as Partial<typeof child.props>);
    }
    return (
      <span ref={anchorRef} {...props}>
        {children}
      </span>
    );
  },
);
PopoverAnchor.displayName = "PopoverAnchor";

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof PopoverContentPrimitive> & {
    showArrow?: boolean;
    unstyled?: boolean;
  }
>(
  (
    {
      children,
      className,
      align = "center",
      sideOffset = 12,
      collisionPadding = 12,
      arrowPadding = 12,
      showArrow = true,
      unstyled,
      ...rest
    },
    forwardedRef,
  ) => {
    const { anchor } = React.useContext(PopoverAnchorContext);
    const { anchor: explicitAnchor, ...contentProps } = rest;
    return (
      <PopoverContentPrimitive
        ref={forwardedRef}
        anchor={explicitAnchor ?? anchor ?? undefined}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        arrowPadding={arrowPadding}
        className={twMerge(
          !unstyled &&
            "w-max rounded-2xl bg-bg-white-0 p-5 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200",
          "z-50",
          "origin-(--transform-origin) transition-[opacity,scale] duration-150 ease-out data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95 motion-reduce:transition-none",
          typeof className === "string" ? className : undefined,
        )}
        {...contentProps}
      >
        {children as React.ReactNode}
        {showArrow && (
          <PopoverArrow className="size-[11px] -translate-y-[calc(50%+1px)] -rotate-45 rounded-bl-[3px] border border-stroke-soft-200 bg-bg-white-0 [clip-path:polygon(0_100%,0_0,100%_100%)]" />
        )}
      </PopoverContentPrimitive>
    );
  },
);
PopoverContent.displayName = "PopoverContent";

const PopoverClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof PopoverClosePrimitive> & {
    unstyled?: boolean;
  }
>(({ className, unstyled, ...rest }, forwardedRef) => (
  <PopoverClosePrimitive
    ref={forwardedRef}
    className={twMerge(
      !unstyled && "absolute right-4 top-4",
      typeof className === "string" ? className : undefined,
    )}
    {...rest}
  />
));
PopoverClose.displayName = "PopoverClose";

export const AlignPopover = {
  Root: PopoverRoot,
  Anchor: PopoverAnchor,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Close: PopoverClose,
};
