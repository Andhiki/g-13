// Adapted from AlignUI Modal v1.2. See docs/adr/0002-alignui-source.md and THIRD_PARTY_NOTICES.md.
// Built on @ui-sdk/react/dialog. The dialog part renders full screen and holds the dimmed,
// blurred centering surface (it is today's overlay, including every overlayClassName override),
// while the card inside restores the pre-refactor panel styling. Presses outside the layer fall
// through the pointer-events-none surface, so ui-sdk still sees them as outside presses.
import { RiCloseLine } from "@remixicon/react";
import * as React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  type DialogContentState,
} from "@ui-sdk/react/dialog";
import type { PartProps } from "@ui-sdk/react/primitive";
import { extendTailwindMerge } from "tailwind-merge";
import { useLocale } from "../useLocale";
import { CompactButton } from "./compact-button";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            (value: string) =>
              /^(title-h[1-6]|label-(2xs|xs|sm|md|lg|xl)|paragraph-(xs|sm|md|lg|xl))$/.test(value),
          ],
        },
      ],
    },
  },
});

// Like Radix's asChild: the part's props land on the single child element. Narrowed with
// isValidElement so no cast is needed and anything else fails loudly, as Radix does.
function childElementOf(children: React.ReactNode, name: string): React.ReactElement {
  const nodes = React.Children.toArray(children);
  if (nodes.length !== 1 || !React.isValidElement(nodes[0])) {
    throw new Error(`${name} with asChild takes exactly one child element.`);
  }
  return nodes[0];
}

type ModalTitleProps = Omit<
  React.ComponentProps<typeof DialogTitle>,
  "children" | "className" | "render" | "style"
> & {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
};

const Title = React.forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ asChild, className, children, ...props }, ref) => (
    <DialogTitle
      ref={ref}
      className={twMerge(!asChild && "text-label-sm text-text-strong-950", className)}
      render={asChild ? childElementOf(children, "Modal.Title") : undefined}
      {...props}
    />
  ),
);
Title.displayName = "ModalTitle";

type ModalDescriptionProps = Omit<
  React.ComponentProps<typeof DialogDescription>,
  "children" | "className" | "render" | "style"
> & {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
};

const Description = React.forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
  ({ asChild, className, children, ...props }, ref) => (
    <DialogDescription
      ref={ref}
      className={twMerge(!asChild && "text-paragraph-xs text-text-sub-600", className)}
      render={asChild ? childElementOf(children, "Modal.Description") : undefined}
      {...props}
    />
  ),
);
Description.displayName = "ModalDescription";

type ModalTriggerProps = Omit<
  React.ComponentProps<typeof DialogTrigger>,
  "children" | "className" | "render" | "style"
> & {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
};

const Trigger = React.forwardRef<HTMLButtonElement, ModalTriggerProps>(
  ({ asChild, className, children, ...props }, ref) => (
    <DialogTrigger
      ref={ref}
      className={className}
      render={asChild ? childElementOf(children, "Modal.Trigger") : undefined}
      {...props}
    />
  ),
);
Trigger.displayName = "ModalTrigger";

type ModalCloseProps = Omit<
  React.ComponentProps<typeof DialogClose>,
  "children" | "className" | "render" | "style"
> & {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
};

const Close = React.forwardRef<HTMLButtonElement, ModalCloseProps>(
  ({ asChild, className, children, ...props }, ref) => (
    <DialogClose
      ref={ref}
      className={className}
      render={asChild ? childElementOf(children, "Modal.Close") : undefined}
      {...props}
    />
  ),
);
Close.displayName = "ModalClose";

type ModalContentProps = Omit<
  PartProps<"div", DialogContentState>,
  "children" | "className" | "render" | "style"
> & {
  children?: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  showClose?: boolean;
  // Radix-era name for the focus hooks, kept so the call sites read the same. ui-sdk owns Escape
  // through its layer stack, so there is no escape hook to expose any more.
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
};

// Radix's onOpenAutoFocus/onCloseAutoFocus fired with a cancelable event and delegated focus to
// the caller when it was prevented. The closest ui-sdk equivalent is initialFocus/finalFocus: run
// the callback, and when it prevented, treat whatever it focused as the focus target. Without a
// prevented callback, ui-sdk keeps its own auto-focus/trigger-return behavior.
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

const Content = React.forwardRef<HTMLDivElement, ModalContentProps>(
  (
    {
      className,
      overlayClassName,
      children,
      showClose = true,
      onOpenAutoFocus,
      onCloseAutoFocus,
      ...props
    },
    ref,
  ) => {
    const { text } = useLocale("common");
    return (
      <DialogContent
        {...props}
        initialFocus={
          onOpenAutoFocus ? focusTargetAfterCallback(onOpenAutoFocus, "open-auto-focus") : undefined
        }
        finalFocus={
          onCloseAutoFocus
            ? focusTargetAfterCallback(onCloseAutoFocus, "close-auto-focus")
            : undefined
        }
        className={twMerge(
          "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto overscroll-contain bg-overlay pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] backdrop-blur-[10px] pointer-events-none focus:outline-none transition-[opacity] duration-150 ease-[ease] data-starting-style:opacity-0 data-ending-style:opacity-0 group/modal",
          overlayClassName,
        )}
      >
        <div
          ref={ref}
          className={twMerge(
            "pointer-events-auto relative max-h-full w-full max-w-[400px] overflow-y-auto rounded-20 bg-bg-white-0 shadow-regular-md focus:outline-none transition-[opacity,scale] duration-150 ease-[ease] group-data-starting-style/modal:opacity-0 group-data-starting-style/modal:scale-95 group-data-ending-style/modal:opacity-0 group-data-ending-style/modal:scale-95",
            className,
          )}
        >
          {children}
          {showClose && (
            <DialogClose
              render={
                <CompactButton
                  className="absolute top-4 right-4"
                  aria-label={text("Tutup dialog")}
                />
              }
            >
              <RiCloseLine aria-hidden="true" />
            </DialogClose>
          )}
        </div>
      </DialogContent>
    );
  },
);
Content.displayName = "ModalContent";

export const AlignModal = {
  Root: Dialog,
  Trigger,
  Close,
  Title,
  Description,
  Content,
};
