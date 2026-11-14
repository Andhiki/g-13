export function cachePolicy(request: Request, response: Response): string {
  const path = new URL(request.url).pathname;
  if (path === "/api/alumni") return response.headers.get("Cache-Control") ?? "no-store";
  const isAlumniPage = request.method === "GET" && path === "/alumni/all";
  return isAlumniPage && response.ok
    ? "public, max-age=3600, stale-while-revalidate=86400, stale-if-error=86400"
    : "no-store";
}
