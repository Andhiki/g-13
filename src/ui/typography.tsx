import { createElement, type ComponentPropsWithRef } from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const typographyVariants = tv(
  {
    variants: {
      variant: {
        title: "text-title-h4",
        subtitle1: "text-label-lg",
        subtitle2: "text-label-md",
        paragraph: "text-paragraph-sm",
        caption: "text-paragraph-xs",
        label: "text-label-sm",
        labelSmall: "text-label-xs",
        graphTitle: "text-[72px] font-semibold tracking-[-0.03em] max-[650px]:text-[30px]",
        question: "text-[26px] font-semibold leading-tight tracking-[-0.03em] sm:text-[32px]",
      },
    },
    defaultVariants: { variant: "paragraph" },
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
  | "dt"
  | "dd";
type TypographyProps<T extends TextElement> = ComponentPropsWithRef<T> &
  VariantProps<typeof typographyVariants> & { as?: T };

export function Typography<T extends TextElement = "p">({
  as,
  variant,
  className,
  ...props
}: TypographyProps<T>) {
  return createElement(as ?? "p", {
    ...props,
    className: typographyVariants({ variant, className }),
  });
}
