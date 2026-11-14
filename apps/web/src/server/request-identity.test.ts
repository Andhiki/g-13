import { expect, it } from "bun:test";
import { reviewClientIp } from "./request-identity";

it("uses Cloudflare's client IP and limits the fallback to local development", () => {
  expect(
    reviewClientIp(
      new Request("https://example.com", { headers: { "cf-connecting-ip": "192.0.2.1" } }),
    ),
  ).toBe("192.0.2.1");
  expect(reviewClientIp(new Request("http://localhost:5173"))).toBe("127.0.0.1");
  expect(reviewClientIp(new Request("http://127.0.0.1:5173"))).toBe("127.0.0.1");
  expect(reviewClientIp(new Request("https://example.com"))).toBeNull();
});
