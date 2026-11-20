import { createFileRoute, redirect } from "@tanstack/react-router";
import { canModerate } from "@g13/auth";
import { Loading } from "@/ui/loading";
import { Typography } from "@/ui/typography";
import { loadAdminIdentity } from "@/routes/-auth/server/identity";
import { hasDashboardSessionCookie } from "../-shared/session-cookie-presence";
import { LoginPage } from "./-components/LoginPage";

export const Route = createFileRoute("/dashboard/login/")({
  head: () => ({
    meta: [{ title: "Sign in" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  loader: async () => {
    if (hasDashboardSessionCookie() === false) return { identity: null };
    const identity = await loadAdminIdentity();
    if (canModerate(identity?.role)) throw redirect({ to: "/dashboard/lecturer-reviews" });
    return { identity };
  },
  pendingComponent: () => (
    <main className="flex min-h-dvh w-full items-center justify-center bg-bg-white-0 px-4 py-12">
      <Loading tone="neutral" />
    </main>
  ),
  errorComponent: () => (
    <main className="mx-auto max-w-xl px-5 py-12">
      <Typography role="alert">Sign-in is unavailable. Contact an admin.</Typography>
    </main>
  ),
  component: () => <LoginPage identity={Route.useLoaderData().identity} />,
});
