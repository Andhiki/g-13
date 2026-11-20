import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Moderation" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: () => <Outlet />,
});
