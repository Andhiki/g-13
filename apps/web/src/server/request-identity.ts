export function reviewClientIp(request: Request): string | null {
  if (import.meta.env.MODE === "local-e2e") return "192.0.2.60";
  // Cloudflare overwrites this header. Local development uses the loopback identity.
  const host = new URL(request.url).hostname;
  return (
    request.headers.get("cf-connecting-ip") ??
    (host === "localhost" || host === "127.0.0.1" ? "127.0.0.1" : null)
  );
}
