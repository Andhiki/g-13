import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PublicFrame } from "./-PublicFrame";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <PublicFrame>
      <Outlet />
    </PublicFrame>
  );
}
