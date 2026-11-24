import { createFileRoute, notFound } from "@tanstack/react-router";
import { ThesisDetailPage } from "./theses/-components/ThesisDetailPage";
import { loadThesisDetail } from "./theses/-server/handler";
import { jsonLdFor, metaDescriptionFor } from "./theses/-shared/thesis";
import { Loading } from "@/ui/loading";

const siteOrigin = "https://csugm.andhiki.tech";

export const Route = createFileRoute("/_public/theses/$slug")({
  loader: async ({ params }) => {
    const thesis = await loadThesisDetail({ data: { slug: params.slug } });
    if (!thesis) throw notFound();
    return thesis;
  },
  pendingMs: 150,
  pendingMinMs: 300,
  pendingComponent: () => (
    <main className="flex min-h-[calc(100dvh-var(--app-header-height))]">
      <Loading />
    </main>
  ),
  head: ({ match }) => {
    const thesis = match.loaderData;
    const directoryTitle = match.context.common["Thesis directory"];
    if (!thesis) {
      return {
        meta: [{ title: directoryTitle }, { property: "og:title", content: directoryTitle }],
      };
    }
    const title = `${thesis.title} · ${directoryTitle}`;
    const description = metaDescriptionFor(thesis, directoryTitle);
    return {
      meta: [
        { title },
        { property: "og:title", content: title },
        { name: "description", content: description },
        { property: "og:description", content: description },
        {
          "script:ld+json": jsonLdFor(
            thesis,
            `${siteOrigin}/theses/${encodeURIComponent(thesis.slug)}`,
          ),
        },
      ],
    };
  },
  component: () => <ThesisDetailPage thesis={Route.useLoaderData()} />,
});
