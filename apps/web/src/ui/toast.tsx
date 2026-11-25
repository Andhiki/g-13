// Derived toast styling. See THIRD_PARTY_NOTICES.md.
import {
  toast as sdkToast,
  ToastAction,
  Toast as ToastPrimitive,
  ToastDescription,
  ToastRegion,
  ToastTitle,
  type ToastOptions,
  type ToastRegionProps,
} from "@ui-sdk/react/toast";
import { RiCheckboxCircleFill } from "@remixicon/react";
import type { ReactElement, ReactNode } from "react";

type LegacyToastAction = Omit<NonNullable<ToastOptions<ReactNode>["action"]>, "onAction"> & {
  onClick?: () => unknown;
  onAction?: NonNullable<ToastOptions<ReactNode>["action"]>["onAction"];
};
type LegacyToastOptions = Omit<ToastOptions<ReactNode>, "action"> & {
  action?: LegacyToastAction;
};

type CustomToastOptions = Omit<ToastOptions<ReactNode>, "title" | "type"> & {
  className?: string;
};

let customToastCount = 0;

function custom(render: (id: string) => ReactElement, options: CustomToastOptions = {}): string {
  const id = options.id ?? `g13-custom-toast-${++customToastCount}`;
  const { className, data, ...toastOptions } = options;
  return sdkToast({
    ...toastOptions,
    id,
    title: render(id),
    data: { custom: true, className, value: data },
  });
}

function normalizeOptions(options?: LegacyToastOptions): ToastOptions<ReactNode> | undefined {
  if (!options) return undefined;
  const { action, ...rest } = options;
  if (!action) return rest;
  const { onClick, ...actionOptions } = action;
  return {
    ...rest,
    action: {
      ...actionOptions,
      onAction: onClick ? () => onClick() : actionOptions.onAction,
    },
  };
}

function normalizeMessage(
  message: ReactNode | LegacyToastOptions,
): ReactNode | ToastOptions<ReactNode> {
  if (
    message &&
    typeof message === "object" &&
    !Array.isArray(message) &&
    !("$$typeof" in message) &&
    ("title" in message || "description" in message || "action" in message || "type" in message)
  ) {
    return normalizeOptions(message as LegacyToastOptions) ?? {};
  }
  return message;
}

function addToast(message: ReactNode | LegacyToastOptions, options?: LegacyToastOptions) {
  return sdkToast(normalizeMessage(message), normalizeOptions(options));
}

function addToastWith(
  method: (
    message: ReactNode | ToastOptions<ReactNode>,
    options?: ToastOptions<ReactNode>,
  ) => string,
  message: ReactNode | LegacyToastOptions,
  options?: LegacyToastOptions,
) {
  return method(normalizeMessage(message), normalizeOptions(options));
}

type LegacyToastApi = {
  (message: ReactNode | LegacyToastOptions, options?: LegacyToastOptions): string;
  success: (message: ReactNode | LegacyToastOptions, options?: LegacyToastOptions) => string;
  error: (message: ReactNode | LegacyToastOptions, options?: LegacyToastOptions) => string;
  info: (message: ReactNode | LegacyToastOptions, options?: LegacyToastOptions) => string;
  warning: (message: ReactNode | LegacyToastOptions, options?: LegacyToastOptions) => string;
  loading: (message: ReactNode | LegacyToastOptions, options?: LegacyToastOptions) => string;
  promise: typeof sdkToast.promise;
  update: typeof sdkToast.update;
  dismiss: typeof sdkToast.dismiss;
  toasts: typeof sdkToast.toasts;
  subscribe: typeof sdkToast.subscribe;
  custom: typeof custom;
};

export const toast = Object.assign(addToast, sdkToast, {
  success: (message: ReactNode | LegacyToastOptions, options?: LegacyToastOptions) =>
    addToastWith(sdkToast.success, message, options),
  error: (message: ReactNode | LegacyToastOptions, options?: LegacyToastOptions) =>
    addToastWith(sdkToast.error, message, options),
  info: (message: ReactNode | LegacyToastOptions, options?: LegacyToastOptions) =>
    addToastWith(sdkToast.info, message, options),
  warning: (message: ReactNode | LegacyToastOptions, options?: LegacyToastOptions) =>
    addToastWith(sdkToast.warning, message, options),
  loading: (message: ReactNode | LegacyToastOptions, options?: LegacyToastOptions) =>
    addToastWith(sdkToast.loading, message, options),
  custom,
}) as LegacyToastApi;

function SuccessToast({ message }: { message: string }) {
  return (
    <div className="w-full rounded-lg bg-bg-white-0 px-2.5 py-2 text-paragraph-sm text-text-strong-950 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200">
      <div className="grid w-full auto-cols-auto grid-flow-col grid-cols-[auto_minmax(0,1fr)] items-start gap-2 transition duration-200 ease-out">
        <RiCheckboxCircleFill className="size-5 shrink-0 text-success-base" aria-hidden="true" />
        {message}
      </div>
    </div>
  );
}

type ToasterProps = Omit<ToastRegionProps, "side" | "align" | "children"> & {
  position?:
    "top-center" | "top-left" | "top-right" | "bottom-center" | "bottom-left" | "bottom-right";
  swipeDirections?: string[];
};

function Toaster({
  position = "bottom-center",
  swipeDirections: _swipeDirections,
  className,
  ...props
}: ToasterProps) {
  const [rawSide, rawAlign] = position.split("-") as [
    "top" | "bottom",
    "center" | "left" | "right",
  ];
  const side = rawSide;
  const normalizedAlign = rawAlign === "left" ? "start" : rawAlign === "right" ? "end" : "center";
  const positionClass =
    position === "top-center"
      ? "inset-x-4 top-4 bottom-auto mx-auto"
      : position === "top-left"
        ? "start-4 top-4 bottom-auto"
        : position === "top-right"
          ? "end-4 top-4 bottom-auto"
          : position === "bottom-left"
            ? "start-4 bottom-4 top-auto"
            : position === "bottom-right"
              ? "end-4 bottom-4 top-auto"
              : "inset-x-4 bottom-4 top-auto mx-auto";
  return (
    <ToastRegion
      side={side}
      align={normalizedAlign}
      className={`pointer-events-none fixed z-50 h-[var(--toast-front-height)] w-[min(356px,calc(100vw-2rem))] data-expanded:h-[calc(var(--toast-stack-height)+(var(--toast-count)-1)*12px)] ${positionClass} ${className ?? ""}`}
      {...props}
    >
      {(toastData) => {
        const customData =
          toastData.data && typeof toastData.data === "object" && "custom" in toastData.data
            ? (toastData.data as { custom?: boolean; className?: string })
            : undefined;
        return (
          <ToastPrimitive
            className={`${customData ? "pointer-events-auto absolute inset-x-0 bottom-0 z-[calc(100-var(--toast-index))] h-[var(--toast-height)] overflow-visible bg-transparent p-0 shadow-none ring-0" : "pointer-events-auto absolute inset-x-0 bottom-0 z-[calc(100-var(--toast-index))] h-[var(--toast-height)] overflow-hidden rounded-lg bg-bg-white-0 px-2.5 py-2 text-paragraph-sm text-text-strong-950 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200"} [--toast-y:calc(var(--toast-index)*-12px)] translate-x-[var(--toast-swipe-x,0px)] translate-y-[calc(var(--toast-y)+var(--toast-swipe-y,0px))] scale-[calc(1-var(--toast-index)*0.05)] transition-[translate,scale,opacity,height] duration-400 data-expanded:translate-y-[calc(-1*(var(--toast-offset)+var(--toast-index)*12px))] data-expanded:scale-100 data-swiping:transition-none data-starting-style:transition-none data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:data-front:translate-y-full ${customData?.className ?? ""}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0 flex-1">
                <ToastTitle />
                <ToastDescription />
              </div>
              <ToastAction className="shrink-0 rounded-md px-2 py-1 text-label-xs text-primary-base transition hover:bg-bg-weak-50 focus-visible:outline-2 focus-visible:outline-primary-base" />
            </div>
          </ToastPrimitive>
        );
      }}
    </ToastRegion>
  );
}

export { Toaster, SuccessToast };
