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
  RiArrowDownSLine,
  RiBookOpenLine,
  RiChatCheckLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiGroupLine,
  RiLinksLine,
  RiMegaphoneLine,
  RiLogoutBoxLine,
  RiMenuLine,
  RiSettings3Line,
  RiUser3Line,
  RiUserVoiceLine,
} from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { AlignDrawer } from "@/ui/drawer";
import { AlignDropdown } from "@/ui/dropdown";
import { SettingsModal } from "@/ui/settings";
import { Typography } from "@/ui/typography";
import { authClient } from "@/routes/-auth/client/auth";
import { useAdminLayout } from "./AdminLayoutContext";
import { NotificationsPopover } from "./NotificationsPopover";

type ModerationSection = {
  to: AbsoluteToPath<RegisteredRouter, string>;
  label: string;
  Icon: RemixiconComponentType;
};

type ModerationSectionGroup = {
  heading: string;
  items: ModerationSection[];
};

const sectionGroups = [
  {
    heading: "Moderation",
    items: [
      { to: "/dashboard/lecturer-reviews", label: "Lecturer reviews", Icon: RiChatCheckLine },
      { to: "/dashboard/users", label: "User access", Icon: RiGroupLine },
      { to: "/dashboard/announcements", label: "Announcements", Icon: RiMegaphoneLine },
    ],
  },
  {
    heading: "Catalog",
    items: [
      { to: "/dashboard/courses", label: "Courses", Icon: RiBookOpenLine },
      { to: "/dashboard/lecturers", label: "Lecturers", Icon: RiUserVoiceLine },
      { to: "/dashboard/resources", label: "Learning resources", Icon: RiLinksLine },
    ],
  },
] satisfies ModerationSectionGroup[];

const navLinkClass =
  "flex w-full items-center gap-2 rounded-lg px-2.5 text-label-xs text-text-sub-600 outline-none transition-colors hover:bg-bg-soft-200/60 hover:text-text-strong-950 focus-visible:outline-[1.5px] focus-visible:outline-offset-0 focus-visible:outline-stroke-strong-950/35 aria-[current=page]:bg-bg-soft-200 aria-[current=page]:font-medium aria-[current=page]:text-text-strong-950";

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
  manager,
  closeOnNavigate = false,
}: {
  manager: boolean;
  closeOnNavigate?: boolean;
}) {
  return (
    <nav aria-label="Moderation sections" className="space-y-4">
      {sectionGroups.map((group) => {
        const items = group.items.filter(
          (section) =>
            manager ||
            (section.to !== "/dashboard/users" && section.to !== "/dashboard/announcements"),
        );
        if (items.length === 0) return null;
        return (
          <div key={group.heading} className="space-y-1">
            <div className="px-2.5">
              <Typography variant="caption" color="muted">
                {group.heading}
              </Typography>
            </div>
            <div className="space-y-0.5">
              {items.map((section) => (
                <ModerationNavItem
                  key={section.to}
                  section={section}
                  closeOnNavigate={closeOnNavigate}
                />
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function ModerationSidebar({
  manager,
  userName,
  userEmail,
  userImage,
}: AccountProps & { manager: boolean }) {
  const { sidebarOpen } = useAdminLayout();
  return (
    <div
      inert={!sidebarOpen}
      data-open={sidebarOpen}
      className="hidden w-0 shrink-0 overflow-clip transition-[width] duration-200 ease-out data-[open=true]:w-[220px] md:block motion-reduce:transition-none"
    >
      <aside id="moderation-sidebar" className="flex h-full w-[220px] flex-col py-2.5 pl-1 pr-2.5">
        <ModerationNavSections manager={manager} />
        <NavigationFooter userName={userName} userEmail={userEmail} userImage={userImage} />
      </aside>
    </div>
  );
}

function MobileDrawerContent({
  manager,
  userName,
  userEmail,
  userImage,
}: AccountProps & { manager: boolean }) {
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
        <ModerationNavSections manager={manager} closeOnNavigate />
        <NavigationFooter userName={userName} userEmail={userEmail} userImage={userImage} mobile />
      </AlignDrawer.Body>
    </AlignDrawer.Content>
  );
}

export function MobileModerationMenu({
  manager,
  userName,
  userEmail,
  userImage,
}: AccountProps & { manager: boolean }) {
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
      <MobileDrawerContent
        manager={manager}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
      />
    </AlignDrawer.Root>
  );
}
