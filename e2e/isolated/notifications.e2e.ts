import { expect } from "e2e";
import { fixture } from "../database.ts";
import { test } from "../isolated-test.ts";
import { fillReview } from "./review-form.ts";

const path = "/dashboard/notifications";
const newReview = /ulasan dosen baru|new lecturer review/i;
const unread = /^(belum dibaca|unread)( \d+)?$/i;
const all = /^(semua|all)( \d+)?$/i;
const markRead = /^(tandai dibaca|mark as read)$/i;
const emptyUnread = /semua notifikasi sudah dibaca|you're all caught up|no unread notifications/i;

test("Mark a notification read, archive it, and verify the maintainer audience", async ({
  app,
  screen,
  signIn,
}) => {
  await signIn("maintainer");
  await app.open(path);
  await expect(
    screen.getByRole("heading", { name: /^(notifikasi|notifications)$/i }),
  ).toBeVisible();
  await expect(
    screen.getByText(/akun baru menunggu persetujuan|new account awaiting approval/i),
  ).toBeHidden();
  await screen.getByRole("button", { name: unread }).click();
  await expect(screen.getByText(newReview)).toBeVisible();
  await screen.getByRole("button", { name: markRead }).click();
  await expect(screen.getByText(emptyUnread).first()).toBeVisible();
  await screen.getByRole("button", { name: all }).click();
  await expect(screen.getByText(newReview)).toBeVisible();
  await expect(screen.getByRole("button", { name: markRead })).toBeHidden();
  await screen.getByRole("button", { name: /^(arsipkan|archive)$/i }).click();
  await expect(screen.getByText(newReview)).toBeHidden();
  await screen.getByRole("button", { name: /diarsipkan|archived/i }).click();
  await expect(screen.getByText(newReview)).toBeVisible();
});

test("A failed notification update leaves it actionable, then mark all as read succeeds", async ({
  app,
  browser,
  screen,
  signIn,
}) => {
  await signIn("maintainer");
  await app.open(path);
  await screen.getByRole("button", { name: unread }).click();
  const mark = screen.getByRole("button", { name: markRead });
  await expect(mark).toBeVisible();
  const serverRPC = "**/_serverFn/**";
  await browser.route(serverRPC, (route) =>
    route.request.method === "POST" ? route.abort() : route.fallback(),
  );
  await mark.click();
  await expect(
    screen.getByText(/status notifikasi gagal|notification could not be updated/i),
  ).toBeVisible();
  await expect(mark).toBeEnabled();
  await browser.unroute(serverRPC);
  await screen.getByRole("button", { name: /tandai semua dibaca|mark all as read/i }).click();
  await expect(screen.getByText(emptyUnread).first()).toBeVisible();
});

test("A pending review notification opens the matching moderation inspector", async ({
  app,
  browser,
  screen,
  signIn,
}) => {
  const body = "This review should send a unique notification to each moderator.";
  await (
    await fillReview({ app, browser, screen }, body, {
      author: "Notification Fixture",
      pending: true,
    })
  ).click();
  await expect(screen.getByText(/menunggu moderasi|awaiting moderation/i)).toBeVisible();
  await signIn("maintainer");
  await app.open(path);
  const item = screen.getByRole("listitem").filter({ hasText: "Notification Fixture" });
  await expect(item.getByText(newReview)).toBeVisible();
  await item.getByRole("link", { name: /buka detail|open details/i }).click();
  await expect(browser).toHaveURL(/\/dashboard\/lecturer-reviews\/?\?.*review/i);
  await expect(screen.getByText("Review details", { exact: true }).first()).toBeVisible();
  await expect(screen.getByText(body).last()).toBeVisible();
  await expect(screen.getByText(fixture.lecturer, { exact: true }).first()).toBeVisible();
});

test("A published review does not notify moderators", async ({ app, browser, screen, signIn }) => {
  const body = "This review publishes immediately and should not notify moderators.";
  await (
    await fillReview({ app, browser, screen }, body, { author: "Published Fixture" })
  ).click();
  await expect(screen.getByRole("article").filter({ hasText: body })).toBeVisible();
  await signIn("maintainer");
  await app.open(path);
  await expect(
    screen.getByRole("listitem").filter({ hasText: "Published Fixture" }),
  ).toHaveCount(0);
});
