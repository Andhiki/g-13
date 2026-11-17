import { Link } from "@tanstack/react-router";
import {
  RiChatCheckLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiGroupLine,
  RiLogoutBoxLine,
  RiMenuLine,
} from "@remixicon/react";
import { AlignButton } from "../../../ui/button";
import { AlignDrawer } from "../../../ui/drawer";
import { AlignTabMenuVertical as Tabs } from "../../../ui/tab-menu-vertical";
import { ModerationWordmark } from "./ModerationWordmark";

type Section = "reviews" | "users";
const sections = [
  { value: "reviews", label: "Lecturer reviews", Icon: RiChatCheckLine },
  { value: "users", label: "User access", Icon: RiGroupLine },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/brand/omahti-light.svg"
        alt="OmahTI"
        className="h-5 w-[50px] shrink-0 dark:hidden"
      />
      <img
        src="/brand/omahti-dark.svg"
        alt="OmahTI"
        className="hidden h-5 w-[50px] shrink-0 dark:block"
      />
      <ModerationWordmark className="h-4 w-auto" />
    </div>
  );
}

function NavigationFooter({
  onSignOut,
  mobile = false,
}: {
  onSignOut: () => void;
  mobile?: boolean;
}) {
  const publicLink = (
    <AlignButton.Root
      asChild
      variant="neutral"
      mode="ghost"
      size="xsmall"
      className="w-full justify-start gap-2 px-2 text-label-xs"
    >
      <Link to="/lecturers">
        <RiExternalLinkLine className="size-4" />
        Public reviews
      </Link>
    </AlignButton.Root>
  );
  const signOut = (
    <AlignButton.Root
      variant="neutral"
      mode="ghost"
      size="xsmall"
      className="w-full justify-start gap-2 px-2 text-label-xs"
      onClick={onSignOut}
    >
      <RiLogoutBoxLine className="size-4" />
      Sign out
    </AlignButton.Root>
  );
  return (
    <div className="mt-auto space-y-1 pt-4">
      {mobile ? <AlignDrawer.Close asChild>{publicLink}</AlignDrawer.Close> : publicLink}
      {mobile ? <AlignDrawer.Close asChild>{signOut}</AlignDrawer.Close> : signOut}
    </div>
  );
}

export function ModerationSidebar({
  manager,
  onSignOut,
}: {
  manager: boolean;
  onSignOut: () => void;
}) {
  return (
    <aside className="hidden w-[224px] shrink-0 flex-col px-2 py-3 md:flex">
      <div className="px-2">
        <Brand />
      </div>
      <Tabs.List aria-label="Moderation sections" className="mt-5 space-y-0.5">
        {sections
          .filter((section) => manager || section.value !== "users")
          .map(({ value, label, Icon }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="h-8 gap-2 rounded-md px-2 text-label-xs data-[state=active]:bg-bg-soft-200"
            >
              <Icon className="size-4" />
              {label}
            </Tabs.Trigger>
          ))}
      </Tabs.List>
      <NavigationFooter onSignOut={onSignOut} />
    </aside>
  );
}

export function MobileModerationMenu({
  manager,
  section,
  onSelect,
  onSignOut,
}: {
  manager: boolean;
  section: string;
  onSelect: (section: Section) => void;
  onSignOut: () => void;
}) {
  return (
    <AlignDrawer.Root>
      <AlignDrawer.Trigger asChild>
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          size="xsmall"
          className="w-8 px-0 md:hidden"
          aria-label="Open navigation"
        >
          <RiMenuLine className="size-5" />
        </AlignButton.Root>
      </AlignDrawer.Trigger>
      <AlignDrawer.Content side="left" className="max-w-[280px]">
        <AlignDrawer.Title className="sr-only">Moderation navigation</AlignDrawer.Title>
        <AlignDrawer.Description className="sr-only">
          Choose a moderation section or return to public reviews.
        </AlignDrawer.Description>
        <AlignDrawer.Header className="justify-between gap-2 px-4 py-4">
          <Brand />
          <AlignDrawer.Close asChild>
            <AlignButton.Root
              variant="neutral"
              mode="ghost"
              size="xsmall"
              className="w-8 shrink-0 px-0"
              aria-label="Close navigation"
            >
              <RiCloseLine className="size-5" />
            </AlignButton.Root>
          </AlignDrawer.Close>
        </AlignDrawer.Header>
        <AlignDrawer.Body className="flex min-h-0 flex-1 flex-col px-3 pb-4">
          <nav aria-label="Moderation sections" className="space-y-1">
            {sections
              .filter((item) => manager || item.value !== "users")
              .map(({ value, label, Icon }) => (
                <AlignDrawer.Close asChild key={value}>
                  <AlignButton.Root
                    variant="neutral"
                    mode="ghost"
                    size="small"
                    aria-pressed={section === value}
                    className="w-full justify-start gap-2 px-2 text-label-xs aria-pressed:bg-bg-soft-200 aria-pressed:text-text-strong-950"
                    onClick={() => onSelect(value)}
                  >
                    <Icon className="size-4" />
                    {label}
                  </AlignButton.Root>
                </AlignDrawer.Close>
              ))}
          </nav>
          <NavigationFooter mobile onSignOut={onSignOut} />
        </AlignDrawer.Body>
      </AlignDrawer.Content>
    </AlignDrawer.Root>
  );
}
