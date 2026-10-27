// Adapted from AlignUI Table v1.2. See docs/design-system.md and docs/licenses/alignui.txt.
import { forwardRef, type ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

const Root = forwardRef<HTMLTableElement, ComponentProps<"table">>(
  ({ className, ...props }, ref) => (
    <div className={twMerge("w-full overflow-x-auto", className)}>
      <table ref={ref} className="w-full" {...props} />
    </div>
  ),
);
Root.displayName = "Table";

function Header(props: ComponentProps<"thead">) {
  return <thead {...props} />;
}

function Head({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={twMerge(
        "bg-bg-weak-50 px-3 py-2 text-left text-xs font-normal text-text-sub-600 first:rounded-l-lg last:rounded-r-lg",
        className,
      )}
      {...props}
    />
  );
}

function Body(props: ComponentProps<"tbody">) {
  return (
    <>
      <tbody aria-hidden="true" className="table-row h-2" />
      <tbody {...props} />
    </>
  );
}

function Row({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={twMerge("group/row", className)} {...props} />;
}

function Cell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={twMerge(
        "h-16 px-3 transition duration-200 ease-out first:rounded-l-xl last:rounded-r-xl group-hover/row:bg-bg-weak-50",
        className,
      )}
      {...props}
    />
  );
}

export const AlignTable = { Root, Header, Head, Body, Row, Cell };
