// Derived styling. See THIRD_PARTY_NOTICES.md.
import { RiCloseLine } from "@remixicon/react";
import * as React from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  type DialogContentState,
} from "@ui-sdk/react/dialog";
import type { PartProps } from "@ui-sdk/react/primitive";
import { createCn } from "cn/config";
import { useLocale } from "../useLocale";
import { CompactButton } from "./compact-button";

const cn = createCn({
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

// The asChild part's props land on the single child element. Narrowing with isValidElement keeps
// the render contract explicit and fails loudly for invalid composition.
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
      className={cn(!asChild && "text-label-sm text-text-strong-950", className)}
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
      className={cn(!asChild && "text-paragraph-xs text-text-sub-600", className)}
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
  // Legacy focus-hook names are kept so existing call sites remain source-compatible. ui-sdk owns
  // Escape through its layer stack, so there is no escape hook to expose here.
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
};

// The legacy focus callbacks fired with a cancelable event and delegated focus to the caller when
// prevented. The closest ui-sdk equivalent is initialFocus/finalFocus: run the callback, and when
// it prevented, treat whatever it focused as the focus target. Without a prevented callback,
// ui-sdk keeps its own auto-focus/trigger-return behavior.
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

function Root({ presentation = "auto", ...props }: React.ComponentProps<typeof Dialog>) {
  return <Dialog presentation={presentation} {...props} />;
}

const ModalContext = React.createContext({ open: false, showClose: true });

export function useModalOpen() {
  return React.useContext(ModalContext).open;
}

function ModalPanel({
  open,
  showClose,
  closeLabel,
  children,
}: {
  open: boolean;
  showClose: boolean;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const [lastOpenChildren, setLastOpenChildren] = React.useState(children);

  // The SDK keeps the panel visible on exit even if the caller clears its content on close.
  if (open && children !== lastOpenChildren) setLastOpenChildren(children);

  return (
    <ModalContext.Provider value={{ open, showClose }}>
      <div inert={!open} className="relative flex min-h-0 flex-auto flex-col overflow-hidden">
        {open ? children : lastOpenChildren}
        {showClose && (
          <DialogClose
            data-drawer-no-drag=""
            render={
              <CompactButton className="absolute top-4 right-4 z-10" aria-label={closeLabel} />
            }
          >
            <RiCloseLine aria-hidden="true" />
          </DialogClose>
        )}
      </div>
    </ModalContext.Provider>
  );
}

function Header({ className, ...props }: React.ComponentProps<"div">) {
  const { showClose } = React.useContext(ModalContext);
  return (
    <div
      data-slot="modal-header"
      className={cn(
        "shrink-0 border-b border-stroke-soft-200 px-5 py-4",
        showClose && "pr-12",
        className,
      )}
      {...props}
    />
  );
}

function Body({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-body"
      className={cn("min-h-0 flex-auto overflow-y-auto overscroll-contain p-5", className)}
      {...props}
    />
  );
}

function Footer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-footer"
      className={cn(
        "flex shrink-0 items-center justify-end gap-2 border-t border-stroke-soft-200 px-5 py-3.5",
        className,
      )}
      {...props}
    />
  );
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
      <>
        <DialogBackdrop
          className={cn(
            "fixed inset-0 z-50 bg-overlay backdrop-blur-[10px] transition-opacity duration-150 ease-[ease] data-starting-style:opacity-0 data-ending-style:opacity-0",
            overlayClassName,
          )}
        />
        <DialogContent
          ref={ref}
          {...props}
          initialFocus={
            onOpenAutoFocus
              ? focusTargetAfterCallback(onOpenAutoFocus, "open-auto-focus")
              : undefined
          }
          finalFocus={
            onCloseAutoFocus
              ? focusTargetAfterCallback(onCloseAutoFocus, "close-auto-focus")
              : undefined
          }
          className={cn(
            "fixed inset-0 z-50 m-auto flex h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[400px] flex-col overflow-hidden rounded-20 bg-bg-white-0 shadow-regular-md focus:outline-none transition-[opacity,scale] duration-150 ease-[ease] data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95",
            "data-[presentation=sheet]:relative data-[presentation=sheet]:inset-auto data-[presentation=sheet]:my-0 data-[presentation=sheet]:h-auto data-[presentation=sheet]:max-h-[85dvh] data-[presentation=sheet]:w-full data-[presentation=sheet]:max-w-none data-[presentation=sheet]:rounded-b-none data-[presentation=sheet]:transition-none data-[presentation=sheet]:data-starting-style:scale-100 data-[presentation=sheet]:data-starting-style:opacity-100 data-[presentation=sheet]:data-ending-style:scale-100 data-[presentation=sheet]:data-ending-style:opacity-100 data-[presentation=sheet]:after:pointer-events-none data-[presentation=sheet]:after:absolute data-[presentation=sheet]:after:inset-x-0 data-[presentation=sheet]:after:top-full data-[presentation=sheet]:after:h-24 data-[presentation=sheet]:after:bg-inherit data-[presentation=sheet]:after:content-['']",
            className,
            "data-[presentation=sheet]:overflow-visible",
          )}
        >
          {(state) => (
            <>
              {state.presentation === "sheet" && (
                <div aria-hidden="true" className="flex shrink-0 justify-center pt-2.5 pb-1">
                  <span className="h-1 w-10 rounded-full bg-stroke-soft-200" />
                </div>
              )}
              <ModalPanel open={state.open} showClose={showClose} closeLabel={text("Tutup dialog")}>
                {children}
              </ModalPanel>
              {state.presentation === "sheet" && (
                <div aria-hidden="true" className="h-[env(safe-area-inset-bottom)] shrink-0" />
              )}
            </>
          )}
        </DialogContent>
      </>
    );
  },
);
Content.displayName = "ModalContent";

export const AlignModal = {
  Root,
  Trigger,
  Close,
  Title,
  Description,
  Content,
  Header,
  Body,
  Footer,
};
