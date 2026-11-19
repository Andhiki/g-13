import { createFileRoute } from "@tanstack/react-router";
import { getAdminIdentity } from "@/routes/-auth/client/auth";
import { hasDashboardSessionCookie } from "../-shared/session-cookie-presence";
import { Typography } from "@/ui/typography";
import { LoginPage } from "./-components/LoginPage";

export const Route = createFileRoute("/dashboard/login/")({
  head: () => ({
    meta: [{ title: "Sign in" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  beforeLoad: async ({ context }) => {
    if (hasDashboardSessionCookie() === false) return { identity: null };
    return { identity: await getAdminIdentity(context.queryClient) };
  },
  errorComponent: () => (
    <main className="mx-auto max-w-xl px-5 py-12">
      <Typography role="alert">Authentication is unavailable. Contact an administrator.</Typography>
    </main>
  ),
  component: () => <LoginPage identity={Route.useRouteContext().identity} />,
});
