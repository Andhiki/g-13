import { expect, test } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { createTestPlatformProxy } from "@/test/database";
import { allowReviewAction } from "./rate-limit";

const secret = "test-secret-".repeat(4);
const now = 3_600_000;

test("likes have per-browser quotas shared across networks and IP backstop quotas", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const allow = (ip: string, browserId: string) =>
      allowReviewAction(db, { ip, browserId, secret, now }, "like");
    const browserA = crypto.randomUUID();
    const browserB = crypto.randomUUID();
    const sharedIp = "198.51.100.23";

    for (let attempt = 0; attempt < 60; attempt++) {
      expect(await allow(sharedIp, browserA)).toBe(true);
      expect(await allow(sharedIp, browserB)).toBe(true);
    }
    expect(await allow(sharedIp, browserA)).toBe(false);
    expect(await allow(sharedIp, browserB)).toBe(false);

    // The browser quota follows browser A when its IP changes.
    expect(await allow("198.51.100.24", browserA)).toBe(false);

    // Five rotated browser identifiers can use the 300-per-IP backstop.
    const backstopIp = "2001:db8:1:2::1";
    for (let browser = 0; browser < 5; browser++) {
      const browserId = crypto.randomUUID();
      for (let attempt = 0; attempt < 60; attempt++) {
        expect(await allow(backstopIp, browserId)).toBe(true);
      }
    }
    expect(await allow("2001:db8:1:2::2", crypto.randomUUID())).toBe(false);
    expect(await allow("2001:db8:1:3::1", crypto.randomUUID())).toBe(true);
  } finally {
    await platform.dispose();
  }
}, 30_000);

test("likes without a browser identifier use the strict IP quota", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const attempt = (browserId?: string | null) =>
      allowReviewAction(db, { ip: "203.0.113.8", browserId, secret, now }, "like");

    for (let count = 0; count < 60; count++) {
      expect(await attempt(null)).toBe(true);
    }
    expect(await attempt(undefined)).toBe(false);
  } finally {
    await platform.dispose();
  }
}, 30_000);
