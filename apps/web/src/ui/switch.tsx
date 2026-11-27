// Derived styling. See THIRD_PARTY_NOTICES.md.
import { Switch as SwitchPrimitive, SwitchThumb } from "@ui-sdk/react/switch";
import * as React from "react";
import { cn } from "cn";

const Root = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive>
>(({ className, disabled, children, ...props }, ref) => (
  <SwitchPrimitive
    ref={ref}
    disabled={disabled}
    className={cn(
      "group/switch relative block h-5 w-8 shrink-0 rounded-full p-0.5 outline-none focus-visible:outline-[1.5px] focus-visible:outline-offset-1 focus-visible:outline-primary-base/55 pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2 pointer-coarse:before:size-11 pointer-coarse:before:-translate-x-1/2 pointer-coarse:before:-translate-y-1/2 pointer-coarse:before:content-['']",
      typeof className === "string" ? className : undefined,
    )}
    {...props}
  >
    <div
      className={cn(
        "h-4 w-7 rounded-full bg-bg-soft-200 p-0.5 outline-none transition duration-200 ease-out",
        "group-hover/switch:bg-bg-sub-300 group-focus-visible/switch:bg-bg-sub-300 group-active/switch:bg-bg-soft-200 group-data-checked/switch:bg-primary-base group-data-checked/switch:group-hover/switch:bg-primary-darker group-data-checked/switch:group-active/switch:bg-primary-base",
        "group-data-disabled/switch:bg-bg-white-0 group-data-disabled/switch:p-[3px] group-data-disabled/switch:ring-1 group-data-disabled/switch:ring-inset group-data-disabled/switch:ring-stroke-soft-200",
      )}
    >
      <SwitchThumb
        className={cn(
          "pointer-events-none relative block size-3 transition-transform duration-200 ease-out data-checked:translate-x-3",
          "before:absolute before:inset-y-0 before:left-1/2 before:w-3 before:-translate-x-1/2 before:rounded-full before:bg-static-white before:[mask:radial-gradient(circle_farthest-side_at_50%_50%,#0000_1.95px,#000_2.05px_100%)] after:absolute after:inset-y-0 after:left-1/2 after:w-3 after:-translate-x-1/2 after:rounded-full after:shadow-switch-thumb group-active/switch:scale-[.833]",
          "group-data-disabled/switch:size-2.5 group-data-disabled/switch:rounded-full group-data-disabled/switch:bg-bg-soft-200 group-data-disabled/switch:shadow-none",
        )}
      />
    </div>
    {children as React.ReactNode}
  </SwitchPrimitive>
));
Root.displayName = "Switch";

export { Root };
