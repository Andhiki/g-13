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
  RiBookOpenLine,
  RiChatCheckLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiGroupLine,
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
    ],
  },
  {
    heading: "Catalog",
    items: [
      { to: "/dashboard/courses", label: "Courses", Icon: RiBookOpenLine },
      { to: "/dashboard/lecturers", label: "Lecturers", Icon: RiUserVoiceLine },
    ],
  },
] satisfies ModerationSectionGroup[];

const navLinkClass =
  "flex w-full items-center gap-2 rounded-lg px-2.5 text-label-xs text-text-sub-600 outline-none transition-colors hover:bg-bg-soft-200/60 hover:text-text-strong-950 focus-visible:outline-[1.5px] focus-visible:outline-offset-0 focus-visible:outline-stroke-strong-950/35 aria-[current=page]:bg-bg-soft-200 aria-[current=page]:font-medium aria-[current=page]:text-text-strong-950";

type AccountProps = { userName: string; userImage?: string | null };

function NavigationFooter({
  userName,
  userImage,
  mobile = false,
}: AccountProps & { mobile?: boolean }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [signOutError, setSignOutError] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  return (
    <div className="mt-auto pt-4">
      {signOutError && (
        <Typography role="alert" variant="caption" className="mb-1.5 block px-2 text-error-base">
          Sign-out failed. Try again.
        </Typography>
      )}
      <div className="flex items-center gap-1 border-t border-stroke-soft-200 pt-2">
        <AlignDropdown.Root>
          <AlignDropdown.Trigger asChild>
            <AlignButton.Root
              variant="neutral"
              mode="ghost"
              size="xsmall"
              className="h-8 min-w-0 flex-1 justify-start gap-2 rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-2 text-label-xs text-text-strong-950 hover:border-stroke-strong-950/20 hover:bg-bg-soft-200/60 data-[state=open]:bg-bg-soft-200"
              aria-label="Account menu"
            >
              {userImage && userImage !== failedImage ? (
                <img
                  src={userImage}
                  alt=""
                  className="size-5 shrink-0 rounded-full object-cover"
                  onError={() => setFailedImage(userImage)}
                />
              ) : (
                <RiUser3Line
                  aria-hidden="true"
                  className="size-5 shrink-0 p-0.5 text-text-sub-600"
                />
              )}
              <span className="truncate font-medium">{userName}</span>
            </AlignButton.Root>
          </AlignDropdown.Trigger>
          <AlignDropdown.Content
            side={mobile ? "top" : "right"}
            align="end"
            sideOffset={8}
            className="w-[180px] rounded-xl p-1.5"
          >
            <AlignDropdown.Item asChild className="px-2 py-1.5">
              <Link to="/lecturers">
                <RiExternalLinkLine className="size-4 shrink-0 text-text-sub-600" />
                Public view
              </Link>
            </AlignDropdown.Item>
            <AlignDropdown.Item className="px-2 py-1.5" onSelect={() => setSettingsOpen(true)}>
              <RiSettings3Line className="size-4 shrink-0 text-text-sub-600" />
              Settings
            </AlignDropdown.Item>
            <AlignDropdown.Separator />
            <AlignDropdown.Item
              className="px-2 py-1.5 text-error-base data-[highlighted]:bg-error-lighter"
              onSelect={() => void signOut()}
            >
              <RiLogoutBoxLine className="size-4 shrink-0" />
              Sign out
            </AlignDropdown.Item>
          </AlignDropdown.Content>
        </AlignDropdown.Root>
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
        {!mobile && <NotificationsPopover />}
      </div>
    </div>
  );
}

export function ModerationSidebar({
  manager,
  userName,
  userImage,
}: AccountProps & { manager: boolean }) {
  const { sidebarOpen } = useAdminLayout();
  return (
    <div
      inert={!sidebarOpen}
      data-open={sidebarOpen}
      className="hidden w-0 shrink-0 overflow-clip transition-[width] duration-200 ease-out data-[open=true]:w-[220px] md:block motion-reduce:transition-none"
    >
      <aside id="moderation-sidebar" className="flex h-full w-[220px] flex-col py-2.5 pl-2 pr-3.5">
        <nav aria-label="Moderation sections" className="space-y-4">
          {sectionGroups.map((group) => {
            const items = group.items.filter(
              (section) => manager || section.to !== "/dashboard/users",
            );
            if (items.length === 0) return null;
            return (
              <div key={group.heading} className="space-y-1">
                <Typography variant="caption" className="px-2.5 text-text-sub-600">
                  {group.heading}
                </Typography>
                <div className="space-y-0.5">
                  {items.map(({ to, label, Icon }) => (
                    <Link key={to} to={to} className={`${navLinkClass} h-8`}>
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <NavigationFooter userName={userName} userImage={userImage} />
      </aside>
    </div>
  );
}

export function MobileModerationMenu({
  manager,
  userName,
  userImage,
}: AccountProps & { manager: boolean }) {
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
      <AlignDrawer.Content side="left" className="max-w-[220px]">
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
              className="w-8 shrink-0 px-0"
              aria-label="Close navigation"
            >
              <RiCloseLine className="size-5" />
            </AlignButton.Root>
          </AlignDrawer.Close>
        </AlignDrawer.Header>
        <AlignDrawer.Body className="flex min-h-0 flex-1 flex-col px-2 pb-2">
          <nav aria-label="Moderation sections" className="space-y-4">
            {sectionGroups.map((group) => {
              const items = group.items.filter(
                (section) => manager || section.to !== "/dashboard/users",
              );
              if (items.length === 0) return null;
              return (
                <div key={group.heading} className="space-y-1">
                  <Typography variant="caption" className="px-2.5 text-text-sub-600">
                    {group.heading}
                  </Typography>
                  <div className="space-y-0.5">
                    {items.map(({ to, label, Icon }) => (
                      <AlignDrawer.Close asChild key={to}>
                        <Link to={to} className={`${navLinkClass} h-8`}>
                          <Icon className="size-4 shrink-0" />
                          <span className="truncate">{label}</span>
                        </Link>
                      </AlignDrawer.Close>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
          <NavigationFooter userName={userName} userImage={userImage} mobile />
        </AlignDrawer.Body>
      </AlignDrawer.Content>
    </AlignDrawer.Root>
  );
}
