import { createElement, type ComponentPropsWithRef } from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const typographyVariants = tv(
  {
    variants: {
      variant: {
        title: "font-display text-title-h4",
        pageTitle: "font-display text-title-h3 sm:text-title-h2",
        subtitle1: "font-display text-label-lg",
        subtitle2: "font-display text-label-md",
        paragraph: "text-paragraph-sm",
        caption: "text-paragraph-xs",
        code: "font-mono text-paragraph-xs",
        label: "text-label-sm",
        labelSmall: "text-label-xs",
        graphTitle: "font-display text-title-h1 max-[650px]:text-title-h4",
        question: "font-display text-title-h5 sm:text-title-h4",
      },
      weight: {
        inherit: "",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      },
      color: {
        inherit: "",
        strong: "text-text-strong-950",
        muted: "text-text-sub-600",
        soft: "text-text-soft-400",
        brand: "text-primary-base",
        danger: "text-error-base",
      },
    },
    defaultVariants: { variant: "paragraph", weight: "inherit", color: "inherit" },
  },
  {
    twMergeConfig: {
      extend: {
        classGroups: {
          "font-size": [
            {
              text: [
                (value: string) =>
                  /^(title-h[1-6]|label-(2xs|xs|sm|md|lg|xl)|paragraph-(xs|sm|md|lg|xl))$/.test(
                    value,
                  ),
              ],
            },
          ],
        },
      },
    },
  },
);

type TextElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "label"
  | "small"
  | "strong"
  | "time"
  | "dt"
  | "dd";
type TypographyProps<T extends TextElement> = ComponentPropsWithRef<T> &
  VariantProps<typeof typographyVariants> & { as?: T };

export function Typography<T extends TextElement = "p">({
  as,
  variant,
  weight,
  color,
  className,
  ...props
}: TypographyProps<T>) {
  return createElement(as ?? "p", {
    ...props,
    className: typographyVariants({
      variant,
      weight,
      color,
      className: [as?.startsWith("h") && "font-display", className],
    }),
  });
}
