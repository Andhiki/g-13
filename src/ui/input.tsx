// Adapted from AlignUI Input v1.2. See docs/design-system.md and docs/licenses/alignui.txt.
import type { ComponentProps, ReactNode } from "react";
import { tv } from "tailwind-variants";

const inputVariants = tv({
  slots: {
    root: "group relative flex w-full overflow-hidden rounded-10 bg-bg-white-0 text-text-strong-950 shadow-regular-xs transition duration-200 ease-out divide-x divide-stroke-soft-200 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:ring-1 before:ring-inset before:ring-stroke-soft-200 before:transition before:duration-200 before:ease-out hover:shadow-none has-[input:focus]:shadow-button-important-focus has-[input:focus]:before:ring-stroke-strong-950 has-[input:disabled]:shadow-none has-[input:disabled]:before:ring-transparent",
    wrapper:
      "group/input-wrapper flex w-full cursor-text items-center gap-2 bg-bg-white-0 px-3 transition duration-200 ease-out hover:[&:not(&:has(input:focus))]:bg-bg-weak-50 has-[input:disabled]:pointer-events-none has-[input:disabled]:bg-bg-weak-50",
    input:
      "h-10 w-full bg-transparent bg-none text-paragraph-sm text-text-strong-950 outline-none transition duration-200 ease-out placeholder:select-none placeholder:text-text-soft-400 placeholder:transition placeholder:duration-200 placeholder:ease-out group-hover/input-wrapper:placeholder:text-text-sub-600 focus:outline-none group-has-[input:focus]:placeholder:text-text-sub-600 disabled:text-text-disabled-300 disabled:placeholder:text-text-disabled-300",
    icon: "flex size-5 shrink-0 select-none items-center justify-center transition duration-200 ease-out group-has-[:placeholder-shown]:text-text-soft-400 group-has-[:placeholder-shown]:group-hover/input-wrapper:text-text-sub-600 group-has-[:placeholder-shown]:group-has-[input:focus]/input-wrapper:text-text-sub-600 group-has-[input:disabled]/input-wrapper:text-text-disabled-300",
  },
});

type InputRootProps = ComponentProps<"div"> & { children: ReactNode };

function Root({ children, ...props }: InputRootProps) {
  const { root } = inputVariants();
  return (
    <div className={root()} {...props}>
      {children}
    </div>
  );
}

function Wrapper({ children, ...props }: ComponentProps<"div">) {
  const { wrapper } = inputVariants();
  return (
    <div className={wrapper()} {...props}>
      {children}
    </div>
  );
}

function Input(props: ComponentProps<"input">) {
  const { input } = inputVariants();
  return <input className={input()} {...props} />;
}

function Icon({ children, ...props }: ComponentProps<"div">) {
  const { icon } = inputVariants();
  return (
    <div className={icon()} {...props}>
      {children}
    </div>
  );
}

export const AlignInput = { Root, Wrapper, Input, Icon };
