import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardRoutePending } from "./-components/DashboardPending";
import { dashboardHomeQuery } from "./-home/client/queries";
import { DashboardHome } from "./-home/components/DashboardHome";

export const Route = createFileRoute("/dashboard/_authenticated/")({
  loader: async ({ context }) => {
    try {
      return await context.queryClient.fetchQuery(dashboardHomeQuery());
    } catch (error) {
      if (error instanceof Response && (error.status === 401 || error.status === 403))
        throw redirect({ to: "/dashboard/login" });
      throw error;
    }
  },
  pendingComponent: DashboardRoutePending,
  component: () => <DashboardHome initialData={Route.useLoaderData()} />,
});
