import { test as base } from "@e2e-dev/web";
import { resetFixtures, seedSession, type Role } from "./database.ts";

export const test = base.extend<{
  signIn: (role: Role, options?: { expired?: boolean }) => Promise<void>;
}>({
  signIn: async ({ browser }, use) => {
    await use(async (role, { expired = false } = {}) => {
      await browser.clearCookies();
      await browser.setCookies(await seedSession(role, expired));
    });
  },
});

test.beforeEach(async () => {
  await resetFixtures();
});
