// AlignUI SegmentedControl v0.0.0 — rebuilt on ui-sdk's segmented control.

"use client";

import * as React from "react";
import {
  SegmentedControl as SegmentedControlPrimitive,
  SegmentedControlIndicator as SegmentedControlIndicatorPrimitive,
  SegmentedControlItem as SegmentedControlItemPrimitive,
  type SegmentedControlItemProps,
  type SegmentedControlItemState,
  type SegmentedControlIndicatorState,
  type SegmentedControlOptions,
  type SegmentedControlState,
} from "@ui-sdk/react/segmented-control";
import type { PartProps } from "@ui-sdk/react/primitive";
import { clsx as cn } from "clsx";

// The wrappers merge static classes, so callers pass class strings, not render functions.
type ClassProps<Tag extends keyof React.JSX.IntrinsicElements, State> = Omit<
  PartProps<Tag, State>,
  "className" | "children"
> & {
  children?: React.ReactNode;
  className?: string;
};

type RootProps<T extends string = string> = Omit<
  ClassProps<"div", SegmentedControlState>,
  "defaultValue" | "onChange" | "onSelect"
> &
  SegmentedControlOptions<T>;

type ItemProps = Omit<ClassProps<"button", SegmentedControlItemState>, "value" | "onSelect"> &
  SegmentedControlItemProps;

type IndicatorProps = ClassProps<"span", SegmentedControlIndicatorState>;

function Root<T extends string>({ className, ...props }: RootProps<T>) {
  return (
    <SegmentedControlPrimitive
      className={cn(
        // track
        "relative isolate grid auto-cols-fr grid-flow-col gap-1 rounded-10 bg-bg-weak-50 p-1",
        className,
      )}
      {...props}
    />
  );
}

function Indicator({ className, ...props }: IndicatorProps) {
  return (
    <SegmentedControlIndicatorPrimitive
      className={cn(
        // floating bg: the CSS variables measure the checked item inside this track
        "absolute -z-10 rounded-md bg-bg-white-0 shadow-toggle-switch",
        "top-[var(--segmented-control-indicator-top)] left-[var(--segmented-control-indicator-left)]",
        "h-[var(--segmented-control-indicator-height)] w-[var(--segmented-control-indicator-width)]",
        "transition-[top,left,width,height] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
        // no slide-in on the first placement
        "data-[activation-direction=none]:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function Item({ className, ...props }: ItemProps) {
  return (
    <SegmentedControlItemPrimitive
      className={cn(
        // base; z-10 lifts the label above the indicator
        "relative z-10 flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-label-sm text-text-soft-400 outline-none pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2 pointer-coarse:before:size-full pointer-coarse:before:min-h-11 pointer-coarse:before:min-w-11 pointer-coarse:before:-translate-x-1/2 pointer-coarse:before:-translate-y-1/2 pointer-coarse:before:content-['']",
        "transition duration-200 ease-out",
        // focus
        "focus:outline-none",
        // checked
        "data-checked:text-text-strong-950",
        className,
      )}
      {...props}
    />
  );
}

export { Root, Indicator, Item };
