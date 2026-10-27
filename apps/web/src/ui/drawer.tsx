// Adapted from AlignUI Drawer v1.2. See docs/design-system.md and docs/licenses/alignui.txt.
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { twMerge } from "tailwind-merge";
import type { ComponentProps } from "react";

const Root = DialogPrimitive.Root;
const Trigger = DialogPrimitive.Trigger;
const Close = DialogPrimitive.Close;
const Title = DialogPrimitive.Title;
const Description = DialogPrimitive.Description;

const drawerMotion =
  "data-[state=open]:duration-200 data-[state=open]:ease-out data-[state=open]:animate-in data-[state=closed]:duration-200 data-[state=closed]:ease-in data-[state=closed]:animate-out data-[state=closed]:pointer-events-none";

function Content({
  className,
  children,
  modal = true,
  side = "left",
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { modal?: boolean; side?: "left" | "bottom" }) {
  if (!modal) {
    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className={twMerge(
            "fixed inset-y-0 left-0 z-50 w-full max-w-[400px] overflow-y-auto border-r border-stroke-soft-200 bg-bg-white-0",
            drawerMotion,
            "data-[state=open]:slide-in-from-left-full data-[state=closed]:slide-out-to-left-full",
            className,
          )}
          {...props}
        >
          <div className="relative flex size-full flex-col">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  }
  const bottom = side === "bottom";
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={twMerge(
          "fixed inset-0 z-50 grid grid-cols-1 place-items-start overflow-hidden bg-overlay backdrop-blur-[10px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=closed]:duration-200",
          bottom && "items-end",
        )}
      >
        <DialogPrimitive.Content
          className={twMerge(
            "size-full max-w-[400px] overflow-y-auto border-r border-stroke-soft-200 bg-bg-white-0",
            drawerMotion,
            bottom
              ? "data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full"
              : "data-[state=open]:slide-in-from-left-full data-[state=closed]:slide-out-to-left-full",
            bottom &&
              "fixed inset-x-0 bottom-0 h-auto max-h-[85dvh] max-w-none rounded-t-10 border-t border-r-0",
            className,
          )}
          {...props}
        >
          <div className="relative flex size-full flex-col">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Overlay>
    </DialogPrimitive.Portal>
  );
}

function Header({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={twMerge("flex items-center gap-3 border-stroke-soft-200 p-5", className)}
      {...props}
    />
  );
}

function Body({ className, ...props }: ComponentProps<"div">) {
  return <div className={twMerge("flex-1", className)} {...props} />;
}

export const AlignDrawer = { Root, Trigger, Close, Content, Header, Title, Description, Body };
