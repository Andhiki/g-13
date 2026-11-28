import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { AlumniDirectory } from "./alumni/-components/AlumniDirectory";
import { parseAlumniDirectory } from "./alumni/-shared/directory";
import { Loading } from "@/ui/loading";

const loadDirectory = createServerFn({ method: "GET" }).handler(async () => {
  const { env } = await import("cloudflare:workers");
  try {
    const { serverAdapters } = await import("@/server/adapters");
    if (serverAdapters.alumni.outage(getRequest())) throw new Error("Directory outage");
    // Service-binding fetches share Workers Cache with browser requests to this endpoint,
    // so most page loads never reach Strapi. The cached JSON is checked like any other.
    const response = await env.ALUMNI.fetch("https://alumni.internal/api/alumni");
    if (!response.ok) throw new Error("Directory unavailable");
    const data = parseAlumniDirectory(await response.json());
    if (!data) throw new Error("Invalid directory data");
    return data;
  } catch {
    setResponseStatus(503, "Service Unavailable");
    return null;
  }
});

// The trailing underscore keeps this route outside the `/alumni` layout, so the
// featured page keeps its own header and this directory owns a full-width view.
export const Route = createFileRoute("/_public/alumni_/all")({
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
