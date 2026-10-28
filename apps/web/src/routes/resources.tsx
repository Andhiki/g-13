import { createFileRoute } from "@tanstack/react-router";
import { ResourcesPage } from "../features/resources/ResourcesPage";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Helpful Resources" },
      {
        name: "description",
        content: "Useful computer science learning, thesis writing, and exam archive resources.",
      },
    ],
  }),
  component: ResourcesPage,
});
