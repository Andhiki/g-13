// Built on @ui-sdk/react/drawer. The sheet's translate, backdrop dim, drag, snap points and the
// reduced-motion fade belong to the library; this wrapper only owns surfaces and the asChild
// translation the call sites use.
import * as React from "react";
import {
  Drawer as UixDrawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerTitle,
  DrawerTrigger,
  type DrawerContentState,
  type DrawerHandleState,
  type DrawerProps,
  type DrawerSide,
  type SnapPoint,
} from "@ui-sdk/react/drawer";
import type { PartProps } from "@ui-sdk/react/primitive";
import { twMerge } from "tailwind-merge";

// Like Radix's asChild: the part's props land on the single child element. Narrowed with
// isValidElement so anything else fails loudly.
function childElementOf(children: React.ReactNode, name: string): React.ReactElement {
  const nodes = React.Children.toArray(children);
  if (nodes.length !== 1 || !React.isValidElement(nodes[0])) {
    throw new Error(`${name} with asChild takes exactly one child element.`);
  }
  return nodes[0];
}

function focusTargetAfterCallback(
  handler: (event: Event) => void,
  type: string,
): () => HTMLElement | null {
  return (): HTMLElement | null => {
    const event = new Event(type, { cancelable: true });
    handler(event);
    if (event.defaultPrevented) {
      return document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    return null;
  };
}

// Content needs the side to pick its sheet classes at merge time; a data-* variant cannot, because
// it would outrank a caller's own height class. Root shares it downward.
const SideContext = React.createContext<DrawerSide>("left");

type RootProps = Omit<
  DrawerProps,
  "onOpenChange" | "side" | "snapPoints" | "defaultSnapPoint" | "onSnapPointChange"
> & {
  side?: DrawerSide;
  onOpenChange?: (open: boolean) => void;
  snapPoints?: SnapPoint[];
  defaultSnapPoint?: SnapPoint;
  onSnapPointChange?: (snapPoint: SnapPoint) => void;
};

function Root({
  children,
  side = "left",
  onOpenChange,
  snapPoints,
  defaultSnapPoint,
  onSnapPointChange,
  ...props
}: RootProps) {
  return (
    <UixDrawer
      {...props}
      side={side}
      snapPoints={snapPoints}
      defaultSnapPoint={defaultSnapPoint}
      onSnapPointChange={onSnapPointChange ? (point) => onSnapPointChange(point) : undefined}
      onOpenChange={(open) => onOpenChange?.(open)}
    >
      <SideContext.Provider value={side}>{children}</SideContext.Provider>
    </UixDrawer>
  );
}

type TriggerProps = Omit<
  React.ComponentProps<typeof DrawerTrigger>,
  "children" | "className" | "render" | "style"
> & {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const Trigger = React.forwardRef<HTMLButtonElement, TriggerProps>(function Trigger(
  { asChild, className, children, ...props },
  ref,
) {
  return (
    <DrawerTrigger
      ref={ref}
      className={className}
      render={asChild ? childElementOf(children, "AlignDrawer.Trigger") : undefined}
      {...props}
    >
      {asChild ? undefined : children}
    </DrawerTrigger>
  );
});
Trigger.displayName = "AlignDrawerTrigger";

type ContentProps = Omit<
  PartProps<"div", DrawerContentState>,
  "children" | "className" | "render" | "style"
> & {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onOpenAutoFocus?: (event: Event) => void;
};

const Content = React.forwardRef<HTMLDivElement, ContentProps>(function Content(
  { className, style, onOpenAutoFocus, children, ...props },
  forwardedRef,
) {
  const side = React.useContext(SideContext);
  return (
    <>
      <DrawerBackdrop className="fixed inset-0 bg-overlay backdrop-blur-[10px]" />
      <DrawerContent
        {...props}
        ref={forwardedRef}
        initialFocus={
          onOpenAutoFocus
            ? focusTargetAfterCallback(onOpenAutoFocus, "align-drawer-open-auto-focus")
            : undefined
        }
        style={style}
        className={twMerge(
          "relative flex w-full max-w-[400px] flex-col overflow-y-auto overscroll-contain border-r border-stroke-soft-200 bg-bg-white-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] focus:outline-none",
          side === "bottom" &&
            "h-auto max-h-[85dvh] max-w-none rounded-t-10 border-t border-r-0 pt-0",
          className,
        )}
      >
        {children}
      </DrawerContent>
    </>
  );
});
Content.displayName = "AlignDrawerContent";

type HandleProps = Omit<PartProps<"button", DrawerHandleState>, "className" | "children"> & {
  className?: string;
  children?: React.ReactNode;
};

function Handle({ className, children, ...props }: HandleProps) {
  return (
    <div className={twMerge("flex shrink-0 justify-center", className)}>
      <DrawerHandle
        {...props}
        className="flex h-5 w-24 items-center justify-center rounded-lg outline-none select-none focus-visible:[&>span]:bg-primary-base"
      >
        <span className="h-1 w-10 rounded-full bg-stroke-soft-200" aria-hidden="true">
          {children}
        </span>
      </DrawerHandle>
    </div>
  );
}

type TitleProps = Omit<PartProps<"h2">, "children" | "className" | "render" | "style"> & {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

function Title({ asChild, className, children, ...props }: TitleProps) {
  return (
    <DrawerTitle
      className={className}
      render={asChild ? childElementOf(children, "AlignDrawer.Title") : undefined}
      {...props}
    >
      {asChild ? undefined : children}
    </DrawerTitle>
  );
}

type DescriptionProps = Omit<PartProps<"p">, "children" | "className" | "render" | "style"> & {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

function Description({ asChild, className, children, ...props }: DescriptionProps) {
  return (
    <DrawerDescription
      className={className}
      render={asChild ? childElementOf(children, "AlignDrawer.Description") : undefined}
      {...props}
    >
      {asChild ? undefined : children}
    </DrawerDescription>
  );
}

type CloseProps = Omit<
  React.ComponentProps<typeof DrawerClose>,
  "children" | "className" | "render" | "style"
> & {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const Close = React.forwardRef<HTMLButtonElement, CloseProps>(function Close(
  { asChild, className, children, ...props },
  ref,
) {
  return (
    <DrawerClose
      ref={ref}
      className={className}
      render={asChild ? childElementOf(children, "AlignDrawer.Close") : undefined}
      {...props}
    >
      {asChild ? undefined : children}
    </DrawerClose>
  );
});
Close.displayName = "AlignDrawerClose";

function Header({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={twMerge("flex items-center gap-3 border-stroke-soft-200 p-5", className)}
      {...props}
    />
  );
}

function Body({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={twMerge("flex-1 overscroll-contain", className)} {...props} />;
}

export const AlignDrawer = {
  Root,
  Trigger,
  Close,
  Content,
  Header,
  Title,
  Description,
  Body,
  Handle,
};

export type { SnapPoint };
