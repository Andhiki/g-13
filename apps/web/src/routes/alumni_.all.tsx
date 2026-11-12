import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AlumniDirectory } from "../features/alumni/AlumniDirectory";

const loadDirectory = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchAlumniPages, strapiToken } = await import("../features/alumni/upstream");
  const { collectAlumni } = await import("../features/alumni/directory");
  const token = strapiToken();
  if (!token) return null;
  try {
    return collectAlumni(await fetchAlumniPages(token));
  } catch {
    return null;
  }
});

// The trailing underscore keeps this route outside the `/alumni` layout, so the
// featured page keeps its own header and this directory owns a full-width view.
export const Route = createFileRoute("/alumni_/all")({
  loader: () => loadDirectory(),
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
