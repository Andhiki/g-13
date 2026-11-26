import { createErrorReporter, normalizeRequestPath as normalizePath } from "@g13/error-reporting";

export { REQUEST_ID_HEADER } from "@g13/error-reporting";

export function normalizeRequestPath(pathname: string): string {
  const path = normalizePath(pathname);
  if (/^\/lecturers\/[^/]+$/.test(path)) return "/lecturers/:lecturerId";
  if (/^\/_serverFn\/[^/]+$/.test(path)) return "/_serverFn/:serverFn";
  return path;
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
