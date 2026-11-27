// Derived styling. See THIRD_PARTY_NOTICES.md.
import type { ComponentProps } from "react";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs";
import { cn } from "cn";

function Root(props: Omit<ComponentProps<typeof Tabs>, "orientation">) {
  return <Tabs orientation="vertical" {...props} />;
}

function List({ className, ...props }: ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      className={cn("w-full space-y-2", typeof className === "string" ? className : undefined)}
      {...props}
    />
  );
}

function Trigger({ className, ...props }: ComponentProps<typeof TabsTab>) {
  return (
    <TabsTab
      className={cn(
        "group/tab-item grid w-full auto-cols-auto grid-flow-col grid-cols-[auto_minmax(0,1fr)] items-center gap-1.5 rounded-lg p-2 text-left text-label-sm text-text-sub-600 outline-none transition duration-200 ease-out hover:bg-bg-weak-50 focus-visible:ring-2 focus-visible:ring-primary-base data-selected:bg-bg-weak-50 data-selected:text-text-strong-950",
        typeof className === "string" ? className : undefined,
      )}
      {...props}
    />
  );
}

export const AlignTabMenuVertical = { Root, List, Trigger, Content: TabsPanel };
