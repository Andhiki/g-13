import { createFileRoute } from "@tanstack/react-router";
import { learningResourcesQueryOptions } from "./resources/-client/queries";
import { ResourcesPage } from "./resources/-components/ResourcesPage";

export const Route = createFileRoute("/_public/resources")({
  loader: async ({ context }) => {
    await context.queryClient.fetchQuery(learningResourcesQueryOptions());
  },
  head: ({ match }) => ({
    meta: [
      { title: match.context.common["Helpful Resources"] },
      { property: "og:title", content: match.context.common["Helpful Resources"] },
      {
        name: "description",
        content:
          match.context.common[
            "Useful computer science learning, thesis writing, and exam archive resources."
          ],
      },
      {
        property: "og:description",
        content:
          match.context.common[
            "Useful computer science learning, thesis writing, and exam archive resources."
          ],
      },
    ],
  }),
  component: ResourcesPage,
});
