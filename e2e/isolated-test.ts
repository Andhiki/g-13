import { test as base } from "@e2e-dev/web";
import { resetFixtures, seedSession, type Role } from "./database.ts";

export const test = base.extend<{
  reset: void;
  signIn: (role: Role, options?: { expired?: boolean }) => Promise<void>;
}>({
  // Reset per test attempt, not once per test: a retry must not see the
  // previous attempt's writes.
  reset: [
    async ({}, use) => {
      await resetFixtures();
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
