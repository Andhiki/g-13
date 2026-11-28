import { describe, expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { consumeRateLimit, deriveRateLimitKey } from "@g13/db/rate-limit";
import { authRateLimits } from "@g13/db/schema/auth";
import { reviewSubmissionLimits } from "@g13/db/schema/lecturer-reviews";
import { createTestPlatformProxy } from "@/test/database";

describe("deriveRateLimitKey", () => {
  it("produces deterministic hex HMAC digests isolated by secret and identity", async () => {
    const first = await deriveRateLimitKey("secret-a", "identity-1");
    const repeat = await deriveRateLimitKey("secret-a", "identity-1");
    const otherSecret = await deriveRateLimitKey("secret-b", "identity-1");
    const otherIdentity = await deriveRateLimitKey("secret-a", "identity-2");

    expect(first).toBe(repeat);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toBe(otherSecret);
    expect(first).not.toBe(otherIdentity);
    expect(first).not.toContain("identity-1");
  });
});

describe("consumeRateLimit", () => {
  it("enforces limits, prunes expired buckets, and works across both D1 rate-limit tables", async () => {
    const platform = await createTestPlatformProxy();
    try {
      const db = createDatabase(platform.env.DB);
      const secret = "rate-limit-test-secret";

      for (const table of [authRateLimits, reviewSubmissionLimits]) {
        const now = 10_000;
        const expiresAt = 20_000;
        expect(
          await consumeRateLimit(db, table, {
            secret,
            identity: "bucket-a",
            limit: 2,
            now,
            expiresAt,
          }),
        ).toBe(true);
        expect(
          await consumeRateLimit(db, table, {
            secret,
            identity: "bucket-a",
            limit: 2,
            now: now + 100,
            expiresAt,
          }),
        ).toBe(true);
        expect(
          await consumeRateLimit(db, table, {
            secret,
            identity: "bucket-a",
            limit: 2,
            now: now + 200,
            expiresAt,
          }),
        ).toBe(false);

        // Once the window expires, the old row is pruned and the bucket resets.
        expect(
          await consumeRateLimit(db, table, {
            secret,
            identity: "bucket-a",
            limit: 2,
            now: expiresAt,
            expiresAt: expiresAt + 10_000,
          }),
        ).toBe(true);
      }
    } finally {
      await platform.dispose();
    }
  }, 30_000);
});
