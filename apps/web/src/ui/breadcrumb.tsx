// Derived styling. See THIRD_PARTY_NOTICES.md.
import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type BreadcrumbProps = ComponentProps<"div"> & { asChild?: boolean };

function childElementOf(children: ReactNode, name: string) {
  const nodes = Children.toArray(children);
  if (nodes.length !== 1 || !isValidElement(nodes[0])) {
    throw new Error(`${name} with asChild takes exactly one child element.`);
  }
  return nodes[0];
}

function renderChild(
  children: ReactNode,
  name: string,
  className: string | undefined,
  props: Record<string, unknown>,
) {
  const child = childElementOf(children, name) as ReactElement<{ className?: string }>;
  const childProps = {
    ...props,
    className: twMerge(
      className,
      typeof child.props.className === "string" ? child.props.className : undefined,
    ),
  } as Partial<typeof child.props>;
  return cloneElement(child, childProps);
}

function Root({ asChild, className, ...props }: BreadcrumbProps) {
  const classes = twMerge("flex flex-wrap gap-1.5", className);
  const { children, ...rest } = props;
  return asChild ? (
    renderChild(children, "Breadcrumb.Root", classes, rest)
  ) : (
    <div className={classes} {...props} />
  );
}

function Item({ asChild, active, className, ...props }: BreadcrumbProps & { active?: boolean }) {
  const classes = twMerge(
    clsx(
      "flex items-center gap-1.5 transition-colors duration-200 ease-out",
      "text-label-sm text-text-sub-600",
      active
        ? "text-text-strong-950"
        : "underline decoration-transparent hover:text-text-strong-950 hover:decoration-current",
    ),
    className,
  );
  const { children, ...rest } = props;
  return asChild ? (
    renderChild(children, "Breadcrumb.Item", classes, rest)
  ) : (
    <div className={classes} {...props} />
  );
}

function ArrowIcon({ asChild, className, ...props }: BreadcrumbProps) {
  const classes = twMerge(
    "flex size-5 select-none items-center justify-center text-text-disabled-300",
    className,
  );
  const { children, ...rest } = props;
  return asChild ? (
    renderChild(children, "Breadcrumb.ArrowIcon", classes, rest)
  ) : (
    <div className={classes} {...props} />
  );
}

export const AlignBreadcrumb = { Root, Item, ArrowIcon };
