// Adapted from AlignUI Switch v1.2. See docs/adr/0002-alignui-source.md and licenses/alignui.txt.
import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { clsx } from "clsx";

const Root = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, disabled, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    disabled={disabled}
    className={clsx(
      "group/switch block h-5 w-8 shrink-0 p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-primary-base focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  >
    <div
      className={clsx(
        "h-4 w-7 rounded-full bg-bg-soft-200 p-0.5 outline-none transition duration-200 ease-out",
        !disabled &&
          "group-hover/switch:bg-bg-sub-300 group-focus-visible/switch:bg-bg-sub-300 group-active/switch:bg-bg-soft-200 group-data-[state=checked]/switch:bg-primary-base group-hover:data-[state=checked]/switch:bg-primary-darker group-active:data-[state=checked]/switch:bg-primary-base",
        disabled && "bg-bg-white-0 p-[3px] ring-1 ring-inset ring-stroke-soft-200",
      )}
    >
      <SwitchPrimitive.Thumb
        className={clsx(
          "pointer-events-none relative block size-3 transition-transform duration-200 ease-out data-[state=checked]:translate-x-3",
          !disabled &&
            "before:absolute before:inset-y-0 before:left-1/2 before:w-3 before:-translate-x-1/2 before:rounded-full before:bg-static-white before:[mask:radial-gradient(circle_farthest-side_at_50%_50%,#0000_1.95px,#000_2.05px_100%)] after:absolute after:inset-y-0 after:left-1/2 after:w-3 after:-translate-x-1/2 after:rounded-full after:shadow-switch-thumb group-active/switch:scale-[.833]",
          disabled && "size-2.5 rounded-full bg-bg-soft-200 shadow-none",
        )}
      />
    </div>
  </SwitchPrimitive.Root>
));
Root.displayName = "Switch";

export { Root };
