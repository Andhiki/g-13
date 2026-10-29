// Adapted from AlignUI Toast and Alert. See docs/adr/0002-alignui-source.md and licenses/alignui.txt.
import type { ReactElement } from "react";
import { RiCheckboxCircleFill } from "@remixicon/react";
import { toast as sonnerToast, Toaster, type ToasterProps } from "sonner";

const defaultOptions: ToasterProps = {
  className: "group/toast",
  position: "bottom-center",
};

const toast = {
  ...sonnerToast,
  custom: (render: (id: string | number) => ReactElement, options: ToasterProps = {}) =>
    sonnerToast.custom(render, { ...defaultOptions, ...options }),
};

function SuccessToast({ message }: { message: string }) {
  return (
    <div className="w-full rounded-lg bg-bg-white-0 px-2.5 py-2 text-paragraph-sm text-text-strong-950 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200">
      <div className="grid w-full auto-cols-auto grid-flow-col grid-cols-[auto_minmax(0,1fr)] items-start gap-2 transition duration-200 ease-out group-data-[expanded=false]/toast:group-data-[front=false]/toast:opacity-0">
        <RiCheckboxCircleFill className="size-5 shrink-0 text-success-base" aria-hidden="true" />
        {message}
      </div>
    </div>
  );
}

export { toast, Toaster, SuccessToast };
