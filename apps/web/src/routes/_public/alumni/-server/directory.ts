import "@tanstack/react-start/server-only";
import type { ServerAdapters } from "@/server/adapters";
import { collectAlumni, type AlumniDirectoryData } from "../-shared/directory";
import { alumniCache, alumniCdnCache } from "./upstream";

type AlumniSource = Pick<ServerAdapters["alumni"], "token" | "fetchPages">;

export type AlumniDirectoryResult =
  | { status: "ok"; data: AlumniDirectoryData }
  | { status: "unconfigured" }
  | { status: "upstream-error" };

/** Fetches and sanitises the whole directory. Never throws. */
export async function loadAlumniDirectory(source: AlumniSource): Promise<AlumniDirectoryResult> {
  const token = source.token();
  if (!token) return { status: "unconfigured" };
  try {
    return { status: "ok", data: collectAlumni(await source.fetchPages(token)) };
  } catch {
    return { status: "upstream-error" };
  }
}

/**
 * The /api/alumni HTTP contract: cacheable JSON on success, an uncached 503 when
 * unconfigured, and an uncached 502 that never carries upstream detail (it can
 * contain request URLs or token fragments).
 */
export function alumniDirectoryResponse(result: AlumniDirectoryResult): Response {
  switch (result.status) {
    case "ok":
      return Response.json(result.data, {
        headers: {
          "cache-control": alumniCache,
          "cdn-cache-control": alumniCdnCache,
          "content-type": "application/json; charset=utf-8",
        },
      });
    case "unconfigured":
      return Response.json(
        { error: "unconfigured" },
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    case "upstream-error":
      return Response.json(
        { error: "upstream" },
        { status: 502, headers: { "cache-control": "no-store" } },
      );
  }
}
