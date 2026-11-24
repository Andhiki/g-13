import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { AlumniDirectory } from "../features/alumni/AlumniDirectory";
import type { AlumniDirectoryData } from "../features/alumni/directory";
import { Loading } from "../ui/loading";

const loadDirectory = createServerFn({ method: "GET" }).handler(async () => {
  const { env } = await import("cloudflare:workers");
  try {
    // Service-binding fetches share Workers Cache with browser requests to this endpoint.
    const response = await env.ALUMNI.fetch("https://alumni.internal/api/alumni");
    if (!response.ok) throw new Error("Directory unavailable");
    const data: AlumniDirectoryData = await response.json();
    return data;
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
