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
      <div className="relative h-full min-h-0 [--sidebar-width:220px] [--sidebar-slide-duration:200ms] md:overflow-clip">
        <ModerationSidebar identity={identity} />
        {/* Keep the panel full-width while it slides, then fit it beside the sidebar. */}
        <section
          data-sidebar-open={sidebarOpen}
          className="relative flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden border-primary-base/20 bg-bg-white-0 md:rounded-xl md:border md:transition-[translate,width] md:[transition-duration:var(--sidebar-slide-duration),0s] md:ease-out md:data-[sidebar-open=true]:w-[calc(100%-var(--sidebar-width))] md:data-[sidebar-open=true]:translate-x-(--sidebar-width) md:data-[sidebar-open=true]:[transition-delay:0s,var(--sidebar-slide-duration)] md:rtl:data-[sidebar-open=true]:-translate-x-(--sidebar-width) motion-reduce:transition-none"
        >
          <Outlet />
        </section>
      </div>
    </main>
  );
}
