// Adapted from AlignUI Modal v1.2. See docs/design-system.md and docs/licenses/alignui.txt.
import { useLocale } from "../useLocale";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { RiCloseLine } from "@remixicon/react";
import { twMerge } from "tailwind-merge";
import { CompactButton } from "./compact-button";

const Root = DialogPrimitive.Root;
const Title = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, asChild, ...props }, ref) => (
  <DialogPrimitive.Title
    asChild={asChild}
    ref={ref}
    className={twMerge(!asChild && "text-label-sm text-text-strong-950", className)}
    {...props}
  />
));
Title.displayName = "ModalTitle";

const Description = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, asChild, ...props }, ref) => (
  <DialogPrimitive.Description
    asChild={asChild}
    ref={ref}
    className={twMerge(!asChild && "text-paragraph-xs text-text-sub-600", className)}
    {...props}
  />
));
Description.displayName = "ModalDescription";

const Overlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={twMerge(
      "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-overlay p-4 backdrop-blur-[10px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
Overlay.displayName = "ModalOverlay";

const Content = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    overlayClassName?: string;
    showClose?: boolean;
  }
>(({ className, overlayClassName, children, showClose = true, ...props }, ref) => {
  const { text } = useLocale("common");
  return (
    <DialogPrimitive.Portal>
      <Overlay className={overlayClassName}>
        <DialogPrimitive.Content
          ref={ref}
          className={twMerge(
            "relative w-full max-w-[400px] rounded-20 bg-bg-white-0 shadow-regular-md focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            className,
          )}
          {...props}
        >
          {children}
          {showClose && (
            <DialogPrimitive.Close asChild>
              <CompactButton className="absolute top-4 right-4" aria-label={text("Tutup dialog")}>
                <RiCloseLine aria-hidden="true" />
              </CompactButton>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </Overlay>
    </DialogPrimitive.Portal>
  );
});
Content.displayName = "ModalContent";

export const AlignModal = {
  Root,
  Trigger: DialogPrimitive.Trigger,
  Close: DialogPrimitive.Close,
  Title,
  Description,
  Content,
};
