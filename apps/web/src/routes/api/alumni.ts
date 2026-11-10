import { createFileRoute } from "@tanstack/react-router";
import { collectAlumni, type StrapiAlumniResponse } from "../../features/alumni/directory";
import { alumniCache, alumniUpstream, strapiToken } from "../../features/alumni/upstream";

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

        const pages: StrapiAlumniResponse[] = [];
        try {
          for (let page = 1; page <= alumniUpstream.maxPages; page++) {
            const response = await fetch(alumniUpstream.pageUrl(page), {
              headers: { authorization: `Bearer ${token}`, accept: "application/json" },
              signal: AbortSignal.timeout(alumniUpstream.timeoutMs),
            });
            if (!response.ok) throw new Error(`upstream ${response.status}`);
            const body = (await response.json()) as StrapiAlumniResponse;
            pages.push(body);
            const pageCount = body.meta?.pagination?.pageCount;
            if (typeof pageCount !== "number" || page >= pageCount) break;
          }
        } catch {
          // Never surface upstream detail: it can contain request URLs or token fragments.
          return Response.json(
            { error: "upstream" },
            { status: 502, headers: { "cache-control": "no-store" } },
          );
        }

        return Response.json(collectAlumni(pages), {
          headers: {
            "cache-control": alumniCache,
            "content-type": "application/json; charset=utf-8",
          },
        });
      },
    },
  },
});
