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
import { cn } from "cn";

// The asChild part's props land on the single child element. Narrowing with isValidElement keeps
// the render contract explicit and fails loudly for invalid composition.
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

const DrawerContext = React.createContext<{
  side: DrawerSide;
  modal: boolean | "trap-focus";
}>({ side: "left", modal: true });

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
  modal = true,
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
      modal={modal}
      snapPoints={snapPoints}
      defaultSnapPoint={defaultSnapPoint}
      onSnapPointChange={onSnapPointChange ? (point) => onSnapPointChange(point) : undefined}
      onOpenChange={(open) => onOpenChange?.(open)}
    >
      <DrawerContext.Provider value={{ side, modal }}>{children}</DrawerContext.Provider>
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
  const { side, modal } = React.useContext(DrawerContext);
  return (
    <>
      {modal === true && (
        <DrawerBackdrop className="fixed inset-0 bg-overlay backdrop-blur-[10px]" />
      )}
      <DrawerContent
        {...props}
        ref={forwardedRef}
        initialFocus={
          onOpenAutoFocus
            ? focusTargetAfterCallback(onOpenAutoFocus, "align-drawer-open-auto-focus")
            : undefined
        }
        style={style}
        className={cn(
          "relative flex w-full max-w-[400px] flex-col border-stroke-soft-200 bg-bg-white-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] focus:outline-none after:pointer-events-none after:absolute after:bg-inherit after:content-[''] data-[side=left]:border-r data-[side=left]:after:inset-y-0 data-[side=left]:after:right-full data-[side=left]:after:w-24 data-[side=right]:border-l data-[side=right]:after:inset-y-0 data-[side=right]:after:left-full data-[side=right]:after:w-24 data-[side=bottom]:border-t data-[side=bottom]:after:-inset-x-px data-[side=bottom]:after:top-full data-[side=bottom]:after:h-24 data-[side=top]:border-b data-[side=top]:after:-inset-x-px data-[side=top]:after:bottom-full data-[side=top]:after:h-24",
          (side === "bottom" || side === "top") && "h-auto max-h-[85dvh] max-w-none",
          side === "bottom" && "rounded-t-10 pt-0",
          side === "top" && "rounded-b-10 pb-0",
          className,
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain rounded-[inherit]">
          {children}
        </div>
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
    <div className={cn("flex shrink-0 justify-center py-1.5", className)}>
      <DrawerHandle
        {...props}
        className="relative flex h-6 w-24 cursor-grab items-center justify-center rounded-lg outline-none select-none active:cursor-grabbing before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[''] focus-visible:[&>span]:bg-primary-base"
      >
        <span className="h-1 w-10 rounded-full bg-stroke-soft-200" aria-hidden="true">
          {children}
        </span>
      </DrawerHandle>
    </div>
  );
}

function Grip({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex shrink-0 justify-center pt-2.5 pb-1", className)}
      {...props}
    >
      <span className="h-1 w-10 rounded-full bg-stroke-soft-200" />
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
      className={cn("flex items-center gap-3 border-stroke-soft-200 p-5", className)}
      {...props}
    />
  );
}

function Body({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", className)}
      {...props}
    />
  );
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
  Grip,
};

export type { SnapPoint };
