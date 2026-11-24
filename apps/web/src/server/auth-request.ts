const AUTH_ORIGIN_COOKIE = "g13-auth-origin";
const AUTH_ORIGIN_COOKIE_PATH = "/api/auth";
const AUTH_ORIGIN_COOKIE_MAX_AGE = 600;

function isLoopback(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function matchesAllowedHost(host: string, pattern: string) {
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(1);
    return host.length > suffix.length && host.endsWith(suffix);
  }
  return host === pattern;
}

function parseAllowedOrigin(value: string | null, allowedHosts: readonly string[]) {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopback(url.hostname))) {
    return null;
  }
  const host = url.host.toLowerCase();
  const allowed = allowedHosts.some((pattern) => matchesAllowedHost(host, pattern.toLowerCase()));
  return allowed ? url.origin : null;
}

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  for (const entry of cookieHeader.split(";")) {
    const separator = entry.indexOf("=");
    if (separator === -1) continue;
    if (entry.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(entry.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Resolves the host the browser actually opened. A proxy that rewrites the request
 * URL still forwards the browser's `Origin` on sign-in and our own callback cookie
 * on the provider redirect, so the OAuth callback can stay on the visited domain.
 */
export function resolveAuthOrigin(request: Request, allowedHosts: readonly string[]) {
  return (
    parseAllowedOrigin(request.headers.get("origin"), allowedHosts) ??
    parseAllowedOrigin(
      readCookie(request.headers.get("cookie"), AUTH_ORIGIN_COOKIE),
      allowedHosts,
    ) ??
    parseAllowedOrigin(request.headers.get("referer"), allowedHosts)
  );
}

/**
 * Feeds Better Auth the public origin through the trusted proxy headers. Client
 * supplied proxy headers are removed so they cannot override the resolved origin.
 */
export function prepareAuthRequest(request: Request, allowedHosts: readonly string[]) {
  const origin = resolveAuthOrigin(request, allowedHosts);
  const headers = new Headers(request.headers);
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");
  if (origin) {
    const url = new URL(origin);
    headers.set("x-forwarded-host", url.host);
    headers.set("x-forwarded-proto", url.protocol.slice(0, -1));
  }
  return { request: new Request(request, { headers }), origin };
}

function serializeOriginCookie(origin: string, maxAge: number, secure: boolean) {
  return `${AUTH_ORIGIN_COOKIE}=${encodeURIComponent(origin)}; Path=${AUTH_ORIGIN_COOKIE_PATH}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

/**
 * Keeps the browser-facing origin for the provider callback and clears it once
 * the callback has been handled.
 */
export function finalizeAuthResponse(request: Request, response: Response, origin: string | null) {
  const url = new URL(request.url);
  const isSignInStart = request.method === "POST" && url.pathname.startsWith("/api/auth/sign-in/");
  const isCallback = url.pathname.startsWith("/api/auth/callback/");
  const secure = (origin ? new URL(origin) : url).protocol === "https:";
  const setCookie = [];
  if (isSignInStart && origin && origin !== url.origin) {
    setCookie.push(serializeOriginCookie(origin, AUTH_ORIGIN_COOKIE_MAX_AGE, secure));
  }
  if (isCallback) setCookie.push(serializeOriginCookie("", 0, secure));
  if (setCookie.length === 0) return response;

  const headers = new Headers(response.headers);
  for (const cookie of setCookie) headers.append("set-cookie", cookie);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
