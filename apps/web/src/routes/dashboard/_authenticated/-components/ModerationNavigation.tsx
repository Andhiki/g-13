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
import { AlignAvatar } from "@/ui/avatar";
import { AlignButton } from "@/ui/button";
import { AlignDrawer } from "@/ui/drawer";
import { Typography } from "@/ui/typography";
import { authClient } from "@/routes/-auth/client/auth";
import { NotificationsPopover } from "./NotificationsPopover";

type ModerationSection = {
  to: AbsoluteToPath<RegisteredRouter, string>;
  label: string;
  Icon: RemixiconComponentType;
};

const sections = [
  { to: "/dashboard/lecturer-reviews", label: "Lecturer reviews", Icon: RiChatCheckLine },
  { to: "/dashboard/users", label: "User access", Icon: RiGroupLine },
] satisfies ModerationSection[];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function NavigationFooter({ userName, mobile = false }: { userName: string; mobile?: boolean }) {
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
      className="h-8 w-full justify-start gap-2 rounded-lg px-2.5 text-label-xs text-text-sub-600"
    >
      <Link to="/lecturers">
        <RiExternalLinkLine className="size-4 shrink-0" />
        Public reviews
      </Link>
    </AlignButton.Root>
  );
  const signOutButton = (
    <AlignButton.Root
      variant="neutral"
      mode="ghost"
      size="xsmall"
      className="h-8 w-full justify-start gap-2 rounded-lg px-2.5 text-label-xs text-text-sub-600"
      onClick={() => void signOut()}
    >
      <RiLogoutBoxLine className="size-4 shrink-0" />
      Sign out
    </AlignButton.Root>
  );

  return (
    <div className="mt-auto space-y-2 pt-4">
      <div className="space-y-0.5">
        {mobile ? <AlignDrawer.Close asChild>{publicLink}</AlignDrawer.Close> : publicLink}
        {signOutButton}
        {signOutError && (
          <Typography role="alert" variant="caption" className="px-2.5 text-error-base">
            Sign-out failed. Try again.
          </Typography>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-stroke-soft-200 px-1.5 pt-2.5">
        <AlignAvatar.Root size="24">{getInitials(userName)}</AlignAvatar.Root>
        <span className="min-w-0 flex-1 truncate text-label-xs font-medium text-text-strong-950">
          {userName}
        </span>
        <NotificationsPopover side={mobile ? "top" : "right"} />
      </div>
    </div>
  );
}

export function ModerationSidebar({ manager, userName }: { manager: boolean; userName: string }) {
  return (
    <aside className="hidden w-[220px] shrink-0 flex-col px-2 py-2 md:flex">
      <nav aria-label="Moderation sections" className="space-y-0.5">
        {sections
          .filter((section) => manager || section.to !== "/dashboard/users")
          .map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-label-xs text-text-sub-600 transition-colors hover:bg-bg-soft-200/60 hover:text-text-strong-950 aria-[current=page]:bg-bg-soft-200 aria-[current=page]:font-medium aria-[current=page]:text-text-strong-950"
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
      </nav>
      <NavigationFooter userName={userName} />
    </aside>
  );
}

export function MobileModerationMenu({
  manager,
  userName,
}: {
  manager: boolean;
  userName: string;
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
        <AlignDrawer.Header className="justify-end px-3 py-2.5">
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
        <AlignDrawer.Body className="flex min-h-0 flex-1 flex-col px-2.5 pb-3">
          <nav aria-label="Moderation sections" className="space-y-1">
            {sections
              .filter((section) => manager || section.to !== "/dashboard/users")
              .map(({ to, label, Icon }) => (
                <AlignDrawer.Close asChild key={to}>
                  <Link
                    to={to}
                    className="flex h-10 w-full items-center gap-2 rounded-lg px-2.5 text-label-xs text-text-sub-600 transition-colors hover:bg-bg-soft-200/60 hover:text-text-strong-950 aria-[current=page]:bg-bg-soft-200 aria-[current=page]:font-medium aria-[current=page]:text-text-strong-950"
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                </AlignDrawer.Close>
              ))}
          </nav>
          <NavigationFooter userName={userName} mobile />
        </AlignDrawer.Body>
      </AlignDrawer.Content>
    </AlignDrawer.Root>
  );
}
