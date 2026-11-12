import { createFileRoute } from "@tanstack/react-router";
import { collectAlumni } from "../../features/alumni/directory";
import { alumniCache, fetchAlumniPages, strapiToken } from "../../features/alumni/upstream";

export const Route = createFileRoute("/api/alumni")({
  server: {
    handlers: {
      GET: async () => {
        const token = strapiToken();
        if (!token) {
          return Response.json(
            { error: "unconfigured" },
            { status: 503, headers: { "cache-control": "no-store" } },
          );
        }

        try {
          return Response.json(collectAlumni(await fetchAlumniPages(token)), {
            headers: {
              "cache-control": alumniCache,
              "content-type": "application/json; charset=utf-8",
            },
          });
        } catch {
          // Never surface upstream detail: it can contain request URLs or token fragments.
          return Response.json(
            { error: "upstream" },
            { status: 502, headers: { "cache-control": "no-store" } },
          );
        }
      },
    },
  },
});
