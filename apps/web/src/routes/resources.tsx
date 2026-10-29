import { createFileRoute } from "@tanstack/react-router";
import { ResourcesPage } from "../features/resources/ResourcesPage";

export const Route = createFileRoute("/resources")({
  head: ({ match }) => ({
    meta: [
      { title: match.context.common["Helpful Resources"] },
      {
        name: "description",
        content:
          match.context.common[
            "Useful computer science learning, thesis writing, and exam archive resources."
          ],
      },
    ],
  }),
  component: ResourcesPage,
});
