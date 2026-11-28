// Derived styling. See THIRD_PARTY_NOTICES.md.
import {
  Menu,
  MenuContent as MenuContentPrimitive,
  MenuItem as MenuItemPrimitive,
  MenuItemIcon as MenuItemIconPrimitive,
  MenuItemIndicator,
  MenuRadioGroup,
  MenuRadioItem as MenuRadioItemPrimitive,
  MenuSeparator as MenuSeparatorPrimitive,
  MenuTrigger as MenuTriggerPrimitive,
} from "@ui-sdk/react/menu";
import { RiCheckLine } from "@remixicon/react";
import { cn } from "cn";
import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";

const Root = Menu;

type AsChildProps = { asChild?: boolean; children?: ReactNode };

function childElementOf(children: ReactNode, name: string) {
  const nodes = Children.toArray(children);
  if (nodes.length !== 1 || !isValidElement(nodes[0])) {
    throw new Error(`${name} with asChild takes exactly one child element.`);
  }
  return nodes[0];
}

function Trigger({
  asChild,
  children,
  ...props
}: ComponentProps<typeof MenuTriggerPrimitive> & AsChildProps) {
  return (
    <MenuTriggerPrimitive
      render={asChild ? childElementOf(children, "Dropdown.Trigger") : undefined}
      {...props}
    >
      {asChild ? undefined : children}
    </MenuTriggerPrimitive>
  );
}

const RadioGroup = MenuRadioGroup;

function Content({
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof MenuContentPrimitive>) {
  return (
    <MenuContentPrimitive
      className={cn(
        "z-50 flex w-max flex-col gap-1 overflow-hidden rounded-2xl bg-bg-white-0 p-2 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200 data-[side=bottom]:origin-top data-[side=left]:origin-right data-[side=right]:origin-left data-[side=top]:origin-bottom data-starting-style:animate-in data-starting-style:fade-in-0 data-ending-style:animate-out data-ending-style:fade-out-0 data-ending-style:zoom-out-95 data-starting-style:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        typeof className === "string" ? className : undefined,
      )}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

function Item({
  asChild,
  className,
  children,
  ...props
}: ComponentProps<typeof MenuItemPrimitive> & AsChildProps) {
  return (
    <MenuItemPrimitive
      className={cn(
        "group/item relative flex cursor-[var(--interactive-cursor)] select-none items-center gap-2 rounded-lg p-2 text-xs font-medium text-text-strong-950 outline-none transition duration-200 ease-out data-highlighted:bg-bg-weak-50 data-disabled:text-text-disabled-300",
        typeof className === "string" ? className : undefined,
      )}
      render={asChild ? childElementOf(children, "Dropdown.Item") : undefined}
      {...props}
    >
      {asChild ? undefined : (children as ReactNode)}
    </MenuItemPrimitive>
  );
}

function Separator({ className, ...props }: ComponentProps<typeof MenuSeparatorPrimitive>) {
  return (
    <MenuSeparatorPrimitive
      className={cn(
        "my-1 h-px bg-stroke-soft-200",
        typeof className === "string" ? className : undefined,
      )}
      {...props}
    />
  );
}

function RadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof MenuRadioItemPrimitive>) {
  return (
    <MenuRadioItemPrimitive
      className={cn(
        "group/item relative flex cursor-[var(--interactive-cursor)] select-none items-center gap-2 rounded-lg p-2 text-paragraph-sm text-text-strong-950 outline-none transition duration-200 ease-out data-highlighted:bg-bg-weak-50 data-disabled:text-text-disabled-300",
        typeof className === "string" ? className : undefined,
      )}
      {...props}
    >
      {children as ReactNode}
      <span className="ml-auto flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
        <MenuItemIndicator render={<span />}>
          <RiCheckLine className="size-5 text-text-sub-600" />
        </MenuItemIndicator>
      </span>
    </MenuRadioItemPrimitive>
  );
}

function ItemIcon({ children, ...props }: ComponentProps<"div">) {
  return (
    <MenuItemIconPrimitive render={<div />} className="size-5 text-text-sub-600" {...props}>
      {children}
    </MenuItemIconPrimitive>
  );
}

export const AlignDropdown = {
  Root,
  Trigger,
  RadioGroup,
  Content,
  Item,
  Separator,
  RadioItem,
  ItemIcon,
};
