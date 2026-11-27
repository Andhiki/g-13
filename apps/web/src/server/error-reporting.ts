import { createErrorReporter, normalizeRequestPath as normalizePath } from "@g13/error-reporting";

export { REQUEST_ID_HEADER } from "@g13/error-reporting";

const staticPaths = new Set([
  "/",
  "/alumni",
  "/alumni/all",
  "/api/alumni",
  "/api/auth",
  "/dashboard",
  "/dashboard/announcements",
  "/dashboard/courses",
  "/dashboard/lecturer-reviews",
  "/dashboard/lecturers",
  "/dashboard/login",
  "/dashboard/notifications",
  "/dashboard/resources",
  "/dashboard/theses",
  "/dashboard/users",
  "/exam",
  "/faq",
  "/lecturers",
  "/resources",
  "/roadmap",
  "/sitemap.xml",
  "/theses",
]);

export function normalizeRequestPath(pathname: string): string {
  const path = normalizePath(pathname);
  if (staticPaths.has(path)) return path;
  if (/^\/lecturers\/[^/]+$/.test(path)) return "/lecturers/:lecturerId";
  if (/^\/theses\/[^/]+$/.test(path)) return "/theses/:slug";
  if (path.startsWith("/api/auth/")) return "/api/auth/:action";
  if (/^\/_serverFn\/[^/]+$/.test(path)) return "/_serverFn/:serverFn";
  return "/:unknown";
}

export const {
  buildServerErrorEvent,
  buildServerResponseEvent,
  reportError,
  withServerErrorReporting,
} = createErrorReporter({
  service: "g-13",
  environment: import.meta.env.MODE ?? "development",
  normalizePath: normalizeRequestPath,
});
