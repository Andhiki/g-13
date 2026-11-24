// Adapted from AlignUI TabMenuVertical. See docs/adr/0002-alignui-source.md and THIRD_PARTY_NOTICES.md.
import type { ComponentProps } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { twMerge } from "tailwind-merge";

function Root(props: Omit<ComponentProps<typeof Tabs.Root>, "orientation">) {
  return <Tabs.Root orientation="vertical" {...props} />;
}

function List({ className, ...props }: ComponentProps<typeof Tabs.List>) {
  return <Tabs.List className={twMerge("w-full space-y-2", className)} {...props} />;
}

function Trigger({ className, ...props }: ComponentProps<typeof Tabs.Trigger>) {
  return (
    <Tabs.Trigger
      className={twMerge(
        "group/tab-item grid w-full auto-cols-auto grid-flow-col grid-cols-[auto_minmax(0,1fr)] items-center gap-1.5 rounded-lg p-2 text-left text-label-sm text-text-sub-600 outline-none transition duration-200 ease-out hover:bg-bg-weak-50 focus-visible:ring-2 focus-visible:ring-primary-base data-[state=active]:bg-bg-weak-50 data-[state=active]:text-text-strong-950",
        className,
      )}
      {...props}
    />
  );
}

export const AlignTabMenuVertical = { Root, List, Trigger, Content: Tabs.Content };
