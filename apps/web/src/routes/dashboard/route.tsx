import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StatusPage } from "../-StatusPage";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Moderation" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: DashboardLayout,
  notFoundComponent: () => <StatusPage kind="notFound" />,
});

function DashboardLayout() {
  return (
    <div className="h-dvh overflow-hidden">
      <Outlet />
    </div>
  );
}
