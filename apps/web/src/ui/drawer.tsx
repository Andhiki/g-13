import { Slot } from "@radix-ui/react-slot";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MutableRefObject,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";

type DrawerContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  modal: boolean;
  contentId: string;
  titleId: string;
  descriptionId: string;
  triggerRef: MutableRefObject<HTMLElement | null>;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) throw new Error("AlignDrawer components must be used inside AlignDrawer.Root");
  return context;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

type RootProps = {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
};

function Root({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  modal = true,
}: RootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolledOpen;
  const triggerRef = useRef<HTMLElement | null>(null);
  const id = useId();

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen === open) return;
      if (!controlled) setUncontrolledOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [controlled, onOpenChange, open],
  );

  const context = useMemo(
    () => ({
      open,
      setOpen,
      modal,
      contentId: `${id}-content`,
      titleId: `${id}-title`,
      descriptionId: `${id}-description`,
      triggerRef,
    }),
    [id, modal, open, setOpen],
  );

  return <DrawerContext.Provider value={context}>{children}</DrawerContext.Provider>;
}

type TriggerProps = ComponentPropsWithoutRef<"button"> & { asChild?: boolean };

const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(function Trigger(
  { asChild = false, onClick, ...props },
  forwardedRef,
) {
  const { open, setOpen, contentId, triggerRef } = useDrawer();
  const Component = asChild ? Slot : "button";
  const ref = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      assignRef(forwardedRef, node);
    },
    [forwardedRef, triggerRef],
  );

  return (
    <Component
      ref={ref}
      type={asChild ? undefined : "button"}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? contentId : undefined}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(true);
      }}
    />
  );
});

type CloseProps = ComponentPropsWithoutRef<"button"> & { asChild?: boolean };

const Close = forwardRef<HTMLButtonElement, CloseProps>(function Close(
  { asChild = false, onClick, ...props },
  forwardedRef,
) {
  const { setOpen } = useDrawer();
  const Component = asChild ? Slot : "button";

  return (
    <Component
      ref={forwardedRef}
      type={asChild ? undefined : "button"}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(false);
      }}
    />
  );
});

type CancelableEvent = {
  defaultPrevented: boolean;
  preventDefault: () => void;
};

type ContentProps = Omit<ComponentPropsWithoutRef<"div">, "onOpenAutoFocus"> & {
  modal?: boolean;
  side?: "left" | "bottom";
  onOpenAutoFocus?: (event: CancelableEvent) => void;
  onInteractOutside?: (event: PointerEvent) => void;
};

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const drawerMotion =
  "data-[state=open]:duration-200 data-[state=open]:ease-out data-[state=open]:animate-in data-[state=closed]:duration-200 data-[state=closed]:ease-in data-[state=closed]:animate-out data-[state=closed]:[animation-fill-mode:forwards] data-[state=closed]:pointer-events-none motion-reduce:animate-none";

const Content = forwardRef<HTMLDivElement, ContentProps>(function Content(
  {
    className,
    children,
    modal,
    side = "left",
    id,
    role,
    tabIndex,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    onOpenAutoFocus,
    onInteractOutside,
    onAnimationEnd,
    ...props
  },
  forwardedRef,
) {
  const context = useDrawer();
  const isModal = modal ?? context.modal;
  const { open, setOpen } = context;
  const [present, setPresent] = useState(open);
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;
  const onOpenAutoFocusRef = useRef(onOpenAutoFocus);
  const onInteractOutsideRef = useRef(onInteractOutside);
  onOpenAutoFocusRef.current = onOpenAutoFocus;
  onInteractOutsideRef.current = onInteractOutside;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }
    if (!present) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
    const timeout = window.setTimeout(() => setPresent(false), duration);
    return () => window.clearTimeout(timeout);
  }, [open, present]);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      assignRef(forwardedRef, node);
    },
    [forwardedRef],
  );

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!open || !present || !mounted || !content) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const body = document.body;
    const portal = portalRef.current;
    const previousOverflow = body.style.overflow;
    const inertSiblings = isModal
      ? [...body.children]
          .filter((child): child is HTMLElement => child instanceof HTMLElement && child !== portal)
          .map((child) => ({ child, inert: child.inert }))
      : [];

    if (isModal) {
      for (const { child } of inertSiblings) child.inert = true;
      body.style.overflow = "hidden";
    }

    const focusable = () => [...content.querySelectorAll<HTMLElement>(focusableSelector)];
    const onKeyDown = (event: KeyboardEvent) => {
      const insideListbox =
        event.target instanceof Element && event.target.closest('[role="listbox"]') !== null;
      if (insideListbox && (event.key === "Escape" || event.key === "Tab")) return;
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        event.stopPropagation();
        setOpenRef.current(false);
        return;
      }
      if (!isModal || event.key !== "Tab") return;
      const elements = focusable();
      if (!elements.length) {
        event.preventDefault();
        content.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || !content.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !content.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      const insideListbox =
        event.target instanceof Element && event.target.closest('[role="listbox"]') !== null;
      if (!isModal || content.contains(event.target as Node) || insideListbox) return;
      (focusable()[0] ?? content).focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (isModal || content.contains(event.target as Node)) return;
      onInteractOutsideRef.current?.(event);
      if (!event.defaultPrevented) setOpenRef.current(false);
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("pointerdown", onPointerDown, true);

    const focusEvent: CancelableEvent = {
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
    };
    onOpenAutoFocusRef.current?.(focusEvent);
    if (!focusEvent.defaultPrevented && !content.contains(document.activeElement)) {
      (focusable()[0] ?? content).focus({ preventScroll: true });
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      if (isModal) {
        for (const { child, inert } of inertSiblings) child.inert = inert;
        body.style.overflow = previousOverflow;
      }
      const restoreTarget =
        previousFocus?.isConnected && previousFocus !== body
          ? previousFocus
          : context.triggerRef.current;
      restoreTarget?.focus({ preventScroll: true });
    };
  }, [context.triggerRef, isModal, mounted, open, present]);

  const handleOverlayPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    onInteractOutsideRef.current?.(event.nativeEvent);
    if (!event.defaultPrevented && !event.nativeEvent.defaultPrevented) setOpen(false);
  };

  if (!present || !mounted) return null;

  const bottom = side === "bottom";
  const state = open ? "open" : "closed";
  const contentClassName = twMerge(
    isModal
      ? "size-full max-w-[400px] overflow-y-auto overscroll-contain pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] border-r border-stroke-soft-200 bg-bg-white-0"
      : "fixed inset-y-0 left-0 z-50 w-full max-w-[400px] overflow-y-auto overscroll-contain pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] border-r border-stroke-soft-200 bg-bg-white-0",
    drawerMotion,
    isModal && bottom
      ? "data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full fixed inset-x-0 bottom-0 h-auto max-h-[85dvh] pt-0 max-w-none rounded-t-10 border-t border-r-0"
      : "data-[state=open]:slide-in-from-left-full data-[state=closed]:slide-out-to-left-full",
    className,
  );
  const panel = (
    <div
      ref={setRefs}
      id={id ?? context.contentId}
      role={role ?? "dialog"}
      tabIndex={tabIndex ?? -1}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? context.titleId}
      aria-describedby={ariaDescribedBy ?? context.descriptionId}
      aria-modal={isModal && open ? true : undefined}
      data-state={state}
      className={contentClassName}
      onAnimationEnd={onAnimationEnd}
      {...props}
    >
      <div className="relative flex size-full flex-col">{children}</div>
    </div>
  );
  const content = (
    <div
      ref={portalRef}
      data-align-drawer-portal=""
      className="contents"
      aria-hidden={!open || undefined}
      inert={!open}
    >
      {isModal ? (
        <div
          className={twMerge(
            "fixed inset-0 z-50 grid grid-cols-1 place-items-start overflow-hidden bg-overlay backdrop-blur-[10px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:[animation-fill-mode:forwards] data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=closed]:duration-200 motion-reduce:animate-none",
            bottom && "items-end",
          )}
          data-state={state}
          onPointerDown={handleOverlayPointerDown}
        >
          {panel}
        </div>
      ) : (
        panel
      )}
    </div>
  );

  return createPortal(content, document.body);
});

type TitleProps = ComponentPropsWithoutRef<"h2"> & { asChild?: boolean };

function Title({ asChild = false, ...props }: TitleProps) {
  const { titleId } = useDrawer();
  const Component = asChild ? Slot : "h2";
  return <Component id={props.id ?? titleId} {...props} />;
}

type DescriptionProps = ComponentPropsWithoutRef<"p"> & { asChild?: boolean };

function Description({ asChild = false, ...props }: DescriptionProps) {
  const { descriptionId } = useDrawer();
  const Component = asChild ? Slot : "p";
  return <Component id={props.id ?? descriptionId} {...props} />;
}

function Header({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={twMerge("flex items-center gap-3 border-stroke-soft-200 p-5", className)}
      {...props}
    />
  );
}

function Body({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={twMerge("flex-1 overscroll-contain", className)} {...props} />;
}

export const AlignDrawer = { Root, Trigger, Close, Content, Header, Title, Description, Body };
