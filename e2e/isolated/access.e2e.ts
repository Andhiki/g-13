import { expect } from "e2e";
import { test as browserTest } from "@e2e-dev/web";
import { test } from "../isolated-test.ts";
import { protectedRoutes } from "../routes.ts";
import { isolatedOrigin } from "../targets.ts";

const queueURL = /\/dashboard\/lecturer-reviews\/?(?:[?#]|$)/;
const loginURL = /\/dashboard\/login\/?(?:[?#]|$)/;

for (const path of protectedRoutes) {
  browserTest(
    `${path} redirects signed-out visitors to sign-in`,
    async ({ app, browser, screen }) => {
      await app.open(path);
      await expect(browser).toHaveURL(loginURL);
      await expect(screen.getByRole("button", { name: "Sign in with GitHub" })).toBeVisible();
    },
  );
}

browserTest(
  "GitHub sign-in starts the real isolated OAuth handoff",
  async ({ app, browser, screen }) => {
    await browser.route("https://github.com/login/oauth/authorize**", (route) =>
      route.fulfill({ status: 200, body: "GitHub OAuth handoff" }),
    );
    await app.open("/dashboard/login");
    await screen.getByRole("button", { name: "Sign in with GitHub" }).click();
    await expect(browser).toHaveURL(/^https:\/\/github\.com\/login\/oauth\/authorize\?/);
    const url = new URL(await browser.url());
    expect(url.searchParams.get("client_id")).toBe("isolated-e2e-client");
    expect(url.searchParams.get("redirect_uri")).toBe(`${isolatedOrigin}/api/auth/callback/github`);
    expect(url.searchParams.get("state")).toBeTruthy();
  },
);

for (const role of ["maintainer", "admin"] as const) {
  test(`${role} lands on moderation and sees role-appropriate navigation`, async ({
    app,
    browser,
    screen,
    signIn,
  }) => {
    await signIn(role);
    for (const path of ["/dashboard", "/dashboard/login"]) {
      await app.open(path);
      await expect(browser).toHaveURL(queueURL);
      await expect(screen.getByRole("heading", { name: "Lecturer reviews" })).toBeVisible();
    }
    const navigation = screen.getByRole("navigation", { name: "Moderation sections" });
    await expect(navigation.getByRole("link", { name: "Courses" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "User access" })).toBeVisible({
      visible: role === "admin",
    });
  });
}

test("Expired and regular sessions cannot open moderation", async ({
  app,
  browser,
  screen,
  signIn,
}) => {
  await signIn("maintainer", { expired: true });
  await app.open("/dashboard");
  await expect(browser).toHaveURL(loginURL);
  await expect(screen.getByRole("button", { name: "Sign in with GitHub" })).toBeVisible();
  await signIn("user");
  await app.open("/dashboard");
  await expect(browser).toHaveURL(loginURL);
  await expect(screen.getByText("Your account is awaiting approval.")).toBeVisible();
});

test("A maintainer cannot open user management directly", async ({
  app,
  browser,
  screen,
  signIn,
}) => {
  await signIn("maintainer");
  await app.open("/dashboard/users");
  await expect(browser).toHaveURL(queueURL);
  await expect(screen.getByRole("heading", { name: "User access" })).toBeHidden();
});

test("Admin grants and revokes access and can cancel a role change", async ({
  app,
  browser,
  screen,
  signIn,
}) => {
  await signIn("admin");
  await app.open("/dashboard/users");
  await expect(screen.getByRole("heading", { name: "User access" })).toBeVisible();
  const inspect = screen.getByRole("button", { name: /inspect account fixture user/i });
  const account = screen.getByRole("article").filter({ has: inspect });
  await inspect.click();
  const change = screen.getByRole("button", { name: /^approve account$|^change role$/i }).first();
  await change.click();
  const roles = screen.getByRole("radiogroup", { name: "Choose role" });
  await roles.getByRole("radio", { name: /maintainer/i }).click();
  await screen.getByRole("button", { name: "Approve", exact: true }).click();
  let confirmation = screen.getByRole("dialog", { name: "Confirm role change" });
  await confirmation.getByRole("button", { name: "Cancel" }).click();
  await expect(account.getByText("Pending", { exact: true })).toBeVisible();

  if (!(await roles.isVisible())) await change.click();
  await roles.getByRole("radio", { name: /maintainer/i }).click();
  await screen.getByRole("button", { name: "Approve", exact: true }).click();
  await confirmation.getByRole("button", { name: /^(confirm|approve|save role)$/i }).click();
  await expect(account.getByText("Maintainer", { exact: true })).toBeVisible();
  await signIn("user");
  await app.open("/dashboard");
  await expect(browser).toHaveURL(queueURL);

  await signIn("admin");
  await app.open("/dashboard/users");
  await inspect.click();
  await screen.getByRole("button", { name: "Change role" }).click();
  await roles.getByRole("radio", { name: /^(user|regular user|no access)/i }).click();
  await screen.getByRole("button", { name: "Save role" }).click();
  confirmation = screen.getByRole("dialog", { name: "Revoke access" });
  await confirmation.getByRole("button", { name: /^(confirm|revoke access|revoke)$/i }).click();
  await expect(account.getByText("Pending", { exact: true })).toBeVisible();
  await screen.getByRole("button", { name: /inspect account fixture admin/i }).click();
  await expect(screen.getByRole("button", { name: "Change role" })).toBeHidden();
  await signIn("user");
  await app.open("/dashboard");
  await expect(screen.getByText("Your account is awaiting approval.")).toBeVisible();
});
