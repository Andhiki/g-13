import { createFileRoute } from "@tanstack/react-router";
import { getAdminIdentity } from "@/routes/-auth/client/auth";
import { LoginPage } from "./-components/LoginPage";
import { Typography } from "@/ui/typography";

export const Route = createFileRoute("/dashboard/login/")({
  head: () => ({
    meta: [{ title: "Admin sign-in" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  beforeLoad: async ({ context }) => ({ identity: await getAdminIdentity(context.queryClient) }),
  errorComponent: () => (
    <main className="mx-auto max-w-xl px-5 py-12">
      <Typography role="alert">Authentication is unavailable. Contact an administrator.</Typography>
    </main>
  ),
  component: () => <LoginPage identity={Route.useRouteContext().identity} />,
});
