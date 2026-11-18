import { useState } from "react";
import {
  Link,
  useRouter,
  type AbsoluteToPath,
  type RegisteredRouter,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  type RemixiconComponentType,
  RiChatCheckLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiGroupLine,
  RiLogoutBoxLine,
  RiMenuLine,
} from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { AlignDrawer } from "@/ui/drawer";
import { Typography } from "@/ui/typography";
import { authClient } from "@/routes/-auth/client/auth";
import { ModerationWordmark } from "./ModerationWordmark";

type ModerationSection = {
  to: AbsoluteToPath<RegisteredRouter, string>;
  label: string;
  Icon: RemixiconComponentType;
};

const sections = [
  { to: "/dashboard/lecturer-reviews", label: "Lecturer reviews", Icon: RiChatCheckLine },
  { to: "/dashboard/users", label: "User access", Icon: RiGroupLine },
] satisfies ModerationSection[];

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

function NavigationFooter({ mobile = false }: { mobile?: boolean }) {
  const [signOutError, setSignOutError] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  async function signOut() {
    setSignOutError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setSignOutError(true);
        return;
      }
      queryClient.clear();
      await router.navigate({ to: "/dashboard/login" });
    } catch {
      setSignOutError(true);
    }
  }

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
  const signOutButton = (
    <AlignButton.Root
      variant="neutral"
      mode="ghost"
      size="xsmall"
      className="w-full justify-start gap-2 px-2 text-label-xs"
      onClick={() => void signOut()}
    >
      <RiLogoutBoxLine className="size-4" />
      Sign out
    </AlignButton.Root>
  );

  return (
    <div className="mt-auto space-y-1 pt-4">
      {mobile ? <AlignDrawer.Close asChild>{publicLink}</AlignDrawer.Close> : publicLink}
      {signOutButton}
      {signOutError && (
        <Typography role="alert" variant="caption" className="px-2 text-error-base">
          Sign-out failed. Try again.
        </Typography>
      )}
    </div>
  );
}

export function ModerationSidebar({ manager }: { manager: boolean }) {
  return (
    <aside className="hidden w-[224px] shrink-0 flex-col px-2 py-3 md:flex">
      <div className="px-2">
        <Brand />
      </div>
      <nav aria-label="Moderation sections" className="mt-5 space-y-0.5">
        {sections
          .filter((section) => manager || section.to !== "/dashboard/users")
          .map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-label-xs text-text-sub-600 hover:bg-bg-weak-50 aria-[current=page]:bg-bg-soft-200 aria-[current=page]:text-text-strong-950"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
      </nav>
      <NavigationFooter />
    </aside>
  );
}

export function MobileModerationMenu({ manager }: { manager: boolean }) {
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
              .filter((section) => manager || section.to !== "/dashboard/users")
              .map(({ to, label, Icon }) => (
                <AlignDrawer.Close asChild key={to}>
                  <Link
                    to={to}
                    className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-label-xs text-text-sub-600 hover:bg-bg-weak-50 aria-[current=page]:bg-bg-soft-200 aria-[current=page]:text-text-strong-950"
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                </AlignDrawer.Close>
              ))}
          </nav>
          <NavigationFooter mobile />
        </AlignDrawer.Body>
      </AlignDrawer.Content>
    </AlignDrawer.Root>
  );
}
