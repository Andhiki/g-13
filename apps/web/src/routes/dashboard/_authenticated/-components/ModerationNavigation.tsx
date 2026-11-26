import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { Role } from "@g13/auth";
import {
  RiArrowDownSLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiLogoutBoxLine,
  RiMenuLine,
  RiSettings3Line,
  RiUser3Line,
} from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { AlignDrawer } from "@/ui/drawer";
import { AlignDropdown } from "@/ui/dropdown";
import { SettingsModal } from "@/ui/settings";
import { Typography } from "@/ui/typography";
import { authClient } from "@/routes/-auth/client/auth";
import { useDashboardIdentity, type DashboardIdentity } from "../-client/identity";
import { useAdminLayout } from "./AdminLayoutContext";
import { NotificationsPopover } from "./NotificationsPopover";
import { getVisibleSectionGroups, type ModerationSection } from "./navigation-sections";

const navLinkClass =
  "flex w-full items-center gap-2 rounded-lg px-2.5 text-label-xs text-text-sub-600 outline-none transition-colors hover:bg-bg-soft-200/60 hover:text-text-strong-950 focus-visible:outline-[1.5px] focus-visible:outline-offset-0 focus-visible:outline-stroke-strong-950/35 aria-[current=page]:bg-bg-soft-200 aria-[current=page]:font-medium aria-[current=page]:text-text-strong-950";

const SKELETON_GROUPS = [
  { key: "primary", headingWidth: "w-16", itemWidths: ["w-28", "w-24", "w-28"] },
  { key: "secondary", headingWidth: "w-12", itemWidths: ["w-20", "w-20", "w-32"] },
] as const;

type AccountProps = { userName: string; userEmail?: string | null; userImage?: string | null };

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function AccountAvatarIcon({
  userImage,
  failedImage,
  onImageError,
}: {
  userImage?: string | null;
  failedImage: string | null;
  onImageError: () => void;
}) {
  if (userImage && userImage !== failedImage) {
    return (
      <img
        src={userImage}
        alt=""
        className="size-5 shrink-0 rounded-full object-cover"
        onError={onImageError}
      />
    );
  }
  return <RiUser3Line aria-hidden="true" className="size-5 shrink-0 p-0.5 text-text-sub-600" />;
}

function AccountMenuDropdown({
  firstName,
  userEmail,
  userImage,
  failedImage,
  onImageError,
  onOpenSettings,
  onSignOut,
}: {
  firstName: string;
  userEmail?: string | null;
  userImage?: string | null;
  failedImage: string | null;
  onImageError: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}) {
  return (
    <AlignDropdown.Root>
      <AlignDropdown.Trigger asChild>
        <AlignButton.Root
          variant="nav"
          size="xsmall"
          className="min-w-0 justify-start"
          aria-label="Account menu"
        >
          <AccountAvatarIcon
            userImage={userImage}
            failedImage={failedImage}
            onImageError={onImageError}
          />
          <span className="truncate font-medium">{firstName}</span>
          <RiArrowDownSLine aria-hidden="true" className="size-3.5 shrink-0 text-text-sub-600" />
        </AlignButton.Root>
      </AlignDropdown.Trigger>
      <AlignDropdown.Content
        side="top"
        align="start"
        sideOffset={8}
        className="w-[232px] max-w-[calc(100vw-24px)] gap-0.5 rounded-xl p-1"
      >
        {userEmail && (
          <div className="truncate px-2 py-1 text-xs text-text-sub-600">{userEmail}</div>
        )}
        <AlignDropdown.Item asChild className="px-2 py-1">
          <Link to="/lecturers">
            <RiExternalLinkLine className="size-4 shrink-0 text-text-sub-600" />
            Public view
          </Link>
        </AlignDropdown.Item>
        <AlignDropdown.Item className="px-2 py-1" onSelect={onOpenSettings}>
          <RiSettings3Line className="size-4 shrink-0 text-text-sub-600" />
          Settings
        </AlignDropdown.Item>
        <AlignDropdown.Separator className="my-0.5" />
        <AlignDropdown.Item
          className="px-2 py-1 text-error-base data-[highlighted]:bg-error-lighter"
          onSelect={onSignOut}
        >
          <RiLogoutBoxLine className="size-4 shrink-0" />
          Sign out
        </AlignDropdown.Item>
      </AlignDropdown.Content>
    </AlignDropdown.Root>
  );
}

function NavigationFooter({
  userName,
  userEmail,
  userImage,
  mobile = false,
}: AccountProps & { mobile?: boolean }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [signOutError, setSignOutError] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const firstName = getFirstName(userName);

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

  return (
    <div className="mt-auto pt-4">
      {signOutError && (
        <div className="mb-1.5 px-2">
          <Typography role="alert" variant="caption" color="danger">
            Sign-out failed. Try again.
          </Typography>
        </div>
      )}
      <div className="flex items-center justify-between gap-1 border-t border-stroke-soft-200 pt-2">
        <AccountMenuDropdown
          firstName={firstName}
          userEmail={userEmail}
          userImage={userImage}
          failedImage={failedImage}
          onImageError={() => userImage && setFailedImage(userImage)}
          onOpenSettings={() => setSettingsOpen(true)}
          onSignOut={() => void signOut()}
        />
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
        {!mobile && <NotificationsPopover />}
      </div>
    </div>
  );
}

function ModerationNavItem({
  section,
  closeOnNavigate,
}: {
  section: ModerationSection;
  closeOnNavigate: boolean;
}) {
  const { to, label, Icon } = section;
  const link = (
    <Link to={to} className={`${navLinkClass} ${closeOnNavigate ? "min-h-11" : "h-8"}`}>
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
  if (!closeOnNavigate) return link;
  return <AlignDrawer.Close asChild>{link}</AlignDrawer.Close>;
}

function ModerationNavSections({
  role,
  closeOnNavigate = false,
}: {
  role: Role;
  closeOnNavigate?: boolean;
}) {
  const groups = getVisibleSectionGroups(role);
  return (
    <nav aria-label="Moderation sections" className="space-y-4">
      {groups.map((group) => (
        <div key={group.heading} className="space-y-1">
          <div className="px-2.5">
            <Typography variant="caption" color="muted">
              {group.heading}
            </Typography>
          </div>
          <div className="space-y-0.5">
            {group.items.map((section) => (
              <ModerationNavItem
                key={section.to}
                section={section}
                closeOnNavigate={closeOnNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function ModerationSkeletonGroup({
  group,
  mobile,
}: {
  group: (typeof SKELETON_GROUPS)[number];
  mobile: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="px-2.5 py-0.5">
        <div
          className={`h-3 animate-pulse rounded bg-bg-soft-200/80 motion-reduce:animate-none ${group.headingWidth}`}
        />
      </div>
      <div className="space-y-0.5">
        {group.itemWidths.map((widthClass, index) => (
          <div
            key={`${group.key}-${index}`}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 ${mobile ? "min-h-11" : "h-8"}`}
          >
            <div className="size-4 shrink-0 animate-pulse rounded bg-bg-soft-200/80 motion-reduce:animate-none" />
            <div
              className={`h-3 animate-pulse rounded bg-bg-soft-200/70 motion-reduce:animate-none ${widthClass}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ModerationSidebarSkeleton({ mobile = false }: { mobile?: boolean }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading navigation"
      className="flex min-h-0 flex-1 flex-col"
    >
      <span className="sr-only">Loading navigation</span>
      <div aria-hidden="true" className="space-y-4">
        {SKELETON_GROUPS.map((group) => (
          <ModerationSkeletonGroup key={group.key} group={group} mobile={mobile} />
        ))}
      </div>
      <div aria-hidden="true" className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-1 border-t border-stroke-soft-200 pt-2">
          <div className="flex h-7 items-center gap-2 px-2">
            <div className="size-5 shrink-0 animate-pulse rounded-full bg-bg-soft-200/80 motion-reduce:animate-none" />
            <div className="h-3 w-16 animate-pulse rounded bg-bg-soft-200/80 motion-reduce:animate-none" />
          </div>
          {!mobile && (
            <div className="size-7 shrink-0 animate-pulse rounded-lg bg-bg-soft-200/70 motion-reduce:animate-none" />
          )}
        </div>
      </div>
    </div>
  );
}

export function ModerationSidebar({ identity }: { identity?: DashboardIdentity }) {
  const { sidebarOpen } = useAdminLayout();
  return (
    <div
      inert={!sidebarOpen}
      data-open={sidebarOpen}
      className="hidden w-0 shrink-0 overflow-clip transition-[width] duration-200 ease-out data-[open=true]:w-[220px] md:block motion-reduce:transition-none"
    >
      <aside id="moderation-sidebar" className="flex h-full w-[220px] flex-col py-2.5 pl-1 pr-2.5">
        {identity ? (
          <>
            <ModerationNavSections role={identity.role} />
            <NavigationFooter
              userName={identity.name}
              userEmail={identity.email}
              userImage={identity.image}
            />
          </>
        ) : (
          <ModerationSidebarSkeleton />
        )}
      </aside>
    </div>
  );
}

function MobileDrawerContent({ identity }: { identity?: DashboardIdentity }) {
  return (
    <AlignDrawer.Content className="max-w-[220px]">
      <AlignDrawer.Title className="sr-only">Moderation navigation</AlignDrawer.Title>
      <AlignDrawer.Description className="sr-only">
        Choose a moderation section or return to public reviews.
      </AlignDrawer.Description>
      <AlignDrawer.Header className="justify-end px-2 py-1.5">
        <AlignDrawer.Close asChild>
          <AlignButton.Root
            variant="neutral"
            mode="ghost"
            size="xsmall"
            iconOnly
            className="shrink-0"
            aria-label="Close navigation"
          >
            <RiCloseLine className="size-5" />
          </AlignButton.Root>
        </AlignDrawer.Close>
      </AlignDrawer.Header>
      <AlignDrawer.Body className="flex min-h-0 flex-1 flex-col px-2 pb-2">
        {identity ? (
          <>
            <ModerationNavSections role={identity.role} closeOnNavigate />
            <NavigationFooter
              userName={identity.name}
              userEmail={identity.email}
              userImage={identity.image}
              mobile
            />
          </>
        ) : (
          <ModerationSidebarSkeleton mobile />
        )}
      </AlignDrawer.Body>
    </AlignDrawer.Content>
  );
}

export function MobileModerationMenu() {
  const identity = useDashboardIdentity();
  return (
    <AlignDrawer.Root side="left">
      <AlignDrawer.Trigger asChild>
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          size="xsmall"
          iconOnly
          className="md:hidden"
          aria-label="Open navigation"
        >
          <RiMenuLine className="size-5" />
        </AlignButton.Root>
      </AlignDrawer.Trigger>
      <MobileDrawerContent identity={identity} />
    </AlignDrawer.Root>
  );
}
