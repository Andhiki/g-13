import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { canManageUsers, canModerate } from "@g13/auth";
import { getAdminIdentity } from "../../-auth/client/auth";
import { ModerationSidebar } from "./-components/ModerationNavigation";
import { AdminLayoutProvider } from "./-components/AdminLayoutContext";
import { Typography } from "@/ui/typography";

export const Route = createFileRoute("/dashboard/_authenticated")({
  head: () => ({
    meta: [{ title: "Moderation" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  beforeLoad: async ({ context }) => {
    const identity = await getAdminIdentity(context.queryClient);
    if (!identity || !canModerate(identity.role)) throw redirect({ to: "/dashboard/login" });
    return { identity };
  },
  errorComponent: () => (
    <main className="mx-auto max-w-xl px-5 py-12">
      <Typography role="alert">
        Admin access could not be verified. Sign in again or contact an administrator.
      </Typography>
    </main>
  ),
  component: AdminLayout,
});

function AdminLayout() {
  const { identity } = Route.useRouteContext();
  return (
    <AdminLayoutProvider>
      <main className="h-full min-h-0 bg-bg-weak-50 text-text-strong-950 md:p-1.5">
        <div className="flex h-full min-h-0 flex-col md:flex-row">
          <ModerationSidebar manager={canManageUsers(identity.role)} />
          <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-stroke-soft-200 bg-bg-white-0 md:rounded-xl md:border">
            <Outlet />
          </section>
        </div>
      </main>
    </AdminLayoutProvider>
  );
}
