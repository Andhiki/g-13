import { test as base } from "@e2e-dev/web";
import { resetFixtures, seedSession, type Role } from "./database.ts";

export const test = base.extend<{
  reset: void;
  signIn: (role: Role, options?: { expired?: boolean }) => Promise<void>;
}>({
  // Reset per test attempt, not once per test: a retry must not see the
  // previous attempt's writes.
  reset: [
    async ({ browser }, use) => {
      await resetFixtures();
      // The fixture writes directly to D1, so clear any query cache left by
      // the prior scenario before this attempt starts.
      await browser.reload();
      await use();
    },
    { auto: true },
  ],
  signIn: async ({ browser }, use) => {
    await use(async (role, { expired = false } = {}) => {
      await browser.clearCookies();
      await browser.setCookies(await seedSession(role, expired));
    });
  },
});
