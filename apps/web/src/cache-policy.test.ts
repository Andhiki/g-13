import { expect, test } from "bun:test";
import { cachePolicy } from "./cache-policy";

const request = (path: string, method = "GET") =>
  new Request(`https://example.com${path}`, { method });

test("only successful alumni page GETs and the existing API policy are cacheable", () => {
  expect(cachePolicy(request("/alumni/all"), new Response())).toBe(
    "public, max-age=3600, stale-while-revalidate=86400, stale-if-error=86400",
  );
  expect(cachePolicy(request("/alumni/all"), new Response(null, { status: 503 }))).toBe("no-store");
  expect(cachePolicy(request("/alumni/all", "POST"), new Response())).toBe("no-store");
  expect(cachePolicy(request("/api/alumni"), new Response())).toBe("no-store");
  expect(
    cachePolicy(
      request("/api/alumni"),
      new Response(null, { headers: { "Cache-Control": "public, max-age=300" } }),
    ),
  ).toBe("public, max-age=300");
  expect(cachePolicy(request("/"), new Response())).toBe("no-store");
});
