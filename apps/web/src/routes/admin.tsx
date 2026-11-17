import { createFileRoute, redirect } from "@tanstack/react-router";
import { canModerate } from "@g13/auth";
import { getAdminIdentity } from "../features/admin/client/auth";
import { moderationReviewsQuery } from "../features/admin/client/queries";
import { AdminPage } from "../features/admin/components/AdminPage";
import { Typography } from "../ui/typography";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Moderation" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  beforeLoad: async ({ context }) => {
    const identity = await getAdminIdentity(context.queryClient);
    if (!identity || !canModerate(identity.role)) throw redirect({ to: "/login" });
    return { identity };
  },
  loader: ({ context }) => context.queryClient.fetchQuery(moderationReviewsQuery()),
  errorComponent: () => (
    <main className="mx-auto max-w-xl px-5 py-12">
      <Typography role="alert">
        Admin access could not be verified. Sign in again or contact an administrator.
      </Typography>
    </main>
  ),
  component: () => {
    const { identity } = Route.useRouteContext();
    return <AdminPage identity={identity} />;
  },
});
