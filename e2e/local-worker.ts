export const localE2eResourceName = "g-13-local-e2e";
export const localE2eDatabaseId = "a0000000-0000-4000-8000-000000000066";

export function localOrigin(url: string | undefined) {
  if (!url) throw new Error("The local E2E Worker URL is missing");
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" || parsed.hostname !== "127.0.0.1" || !parsed.port) {
    throw new Error("The local E2E Worker requires a loopback URL with an explicit port");
  }
  return parsed.origin;
}
