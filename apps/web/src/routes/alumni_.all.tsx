import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { AlumniDirectory } from "../features/alumni/AlumniDirectory";
import { Loading } from "../ui/loading";

const loadDirectory = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchAlumniPages, strapiToken } = await import("../features/alumni/upstream");
  const { collectAlumni } = await import("../features/alumni/directory");
  const token = strapiToken();
  try {
    if (!token) throw new Error("Strapi token not configured");
    return collectAlumni(await fetchAlumniPages(token));
  } catch {
    setResponseStatus(503, "Service Unavailable");
    return null;
  }
});

// The trailing underscore keeps this route outside the `/alumni` layout, so the
// featured page keeps its own header and this directory owns a full-width view.
export const Route = createFileRoute("/alumni_/all")({
  loader: () => loadDirectory(),
  pendingMs: 150,
  pendingMinMs: 300,
  pendingComponent: () => (
    <main className="flex min-h-[calc(100dvh-var(--app-header-height))]">
      <Loading />
    </main>
  ),
  head: ({ match }) => ({
    meta: [
      { title: match.context.common["Semua alumni"] },
      { property: "og:title", content: match.context.common["Semua alumni"] },
      {
        name: "description",
        content:
          match.context.common[
            "Direktori alumni Ilmu Komputer UGM: cari berdasarkan nama, angkatan, atau tempat berkarya."
          ],
      },
      {
        property: "og:description",
        content:
          match.context.common[
            "Direktori alumni Ilmu Komputer UGM: cari berdasarkan nama, angkatan, atau tempat berkarya."
          ],
      },
    ],
  }),
  component: () => <AlumniDirectory initialData={Route.useLoaderData()} />,
});
