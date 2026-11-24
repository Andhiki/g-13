import { createFileRoute } from "@tanstack/react-router";
import { ThesesIndexPage } from "./theses/-components/ThesesIndexPage";
import { loadThesesIndex } from "./theses/-server/handler";
import { Loading } from "@/ui/loading";

export const Route = createFileRoute("/_public/theses/")({
  loader: () => loadThesesIndex(),
  pendingMs: 150,
  pendingMinMs: 300,
  pendingComponent: () => (
    <main className="flex min-h-[calc(100dvh-var(--app-header-height))]">
      <Loading />
    </main>
  ),
  head: ({ match }) => ({
    meta: [
      { title: match.context.common["Thesis directory"] },
      { property: "og:title", content: match.context.common["Thesis directory"] },
      {
        name: "description",
        content:
          match.context.common[
            "Explore Ilmu Komputer UGM theses by title, author, supervisor, year, and keyword."
          ],
      },
      {
        property: "og:description",
        content:
          match.context.common[
            "Explore Ilmu Komputer UGM theses by title, author, supervisor, year, and keyword."
          ],
      },
    ],
  }),
  component: () => <ThesesIndexPage state={Route.useLoaderData()} />,
});
