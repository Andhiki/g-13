import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { hasDashboardSessionCookie } from "../-shared/session-cookie-presence";
import { useDashboardIdentity, useSyncDashboardIdentity } from "./-client/identity";
import { ModerationSidebar } from "./-components/ModerationNavigation";
import { AdminLayoutProvider, useAdminLayout } from "./-components/AdminLayoutContext";
import { notificationPopoverQuery } from "./notifications/-client/queries";
import { Typography } from "@/ui/typography";

export const Route = createFileRoute("/dashboard/_authenticated")({
  beforeLoad: () => {
    if (hasDashboardSessionCookie() === false) throw redirect({ to: "/dashboard/login" });
  },
  errorComponent: () => (
    <main className="mx-auto max-w-xl px-5 py-12">
      <Typography role="alert">
        Could not verify your access. Sign in again or contact an admin.
      </Typography>
    </main>
  ),
  component: () => (
    <AdminLayoutProvider>
      <AdminLayout />
    </AdminLayoutProvider>
  ),
});

function subscribeToWindowFocus(onChange: () => void) {
  window.addEventListener("focus", onChange);
  window.addEventListener("blur", onChange);
  return () => {
    window.removeEventListener("focus", onChange);
    window.removeEventListener("blur", onChange);
  };
}

function AdminLayout() {
  useSyncDashboardIdentity();
  const identity = useDashboardIdentity();
  const { sidebarOpen } = useAdminLayout();
  const focused = useSyncExternalStore(
    subscribeToWindowFocus,
    () => document.hasFocus(),
    () => false,
  );
  useQuery({
    ...notificationPopoverQuery(),
    enabled: !!identity,
    refetchInterval: focused ? 60_000 : false,
  });
  return (
    <main className="h-full min-h-0 bg-bg-weak-50 text-text-strong-950 md:p-1.5">
      <div className="relative h-full min-h-0 [--sidebar-width:220px] md:overflow-clip">
        <ModerationSidebar identity={identity} />
        {/* Reveal the stationary sidebar while keeping the panel’s far edge anchored. */}
        <section
          data-sidebar-open={sidebarOpen}
          className="relative flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden border-primary-base/20 bg-bg-white-0 md:rounded-xl md:border md:absolute md:inset-y-0 md:start-0 md:end-0 md:z-10 md:w-auto md:motion-safe:transition-[inset-inline-start] md:motion-safe:duration-200 md:motion-safe:ease-out md:data-[sidebar-open=true]:start-(--sidebar-width) motion-reduce:transition-none"
        >
          <Outlet />
        </section>
      </div>
    </main>
  );
}
