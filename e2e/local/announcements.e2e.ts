import { expect } from "e2e";
import { test } from "../fixtures/local-test.ts";

test("Publishing and disabling an announcement updates the public banner", async ({
  app,
  browser,
  screen,
  signIn,
}) => {
  const dashboard = "/dashboard/announcements";
  const title = "Pengumuman pengujian";
  const message = "Pesan ini hanya tersedia selama pengumuman aktif.";
  const banner = screen.getByRole("region", { name: /pengumuman|announcement/i });
  const announcement = banner.getByText(title, { exact: true });

  await signIn("admin");
  await app.open(dashboard);
  await screen.getByRole("button", { name: "Add announcement", exact: true }).first().click();
  const form = screen.getByRole("dialog", { name: "Add announcement" });
  await form.getByRole("textbox", { name: "Title (Indonesian)" }).fill(title);
  await form.getByRole("textbox", { name: "Title (English)" }).fill("Test announcement");
  await form.getByRole("textbox", { name: "Message (Indonesian)" }).fill(message);
  await form
    .getByRole("textbox", { name: "Message (English)" })
    .fill("This message is only shown while the announcement is active.");
  await form.getByRole("button", { name: "Add announcement", exact: true }).click();
  await expect(form).toBeHidden();

  await browser.clearCookies();
  const active = browser.waitForResponse("**/_serverFn/**");
  await app.open("/faq");
  await expect(announcement).toBeVisible();
  await expect(banner.getByText(message, { exact: true })).toBeVisible();
  const activeResponse = await active;
  expect(await activeResponse.text()).toContain(title);

  await signIn("admin");
  await app.open(dashboard);
  const row = screen.getByRole("article").filter({ hasText: title });
  await row.getByRole("button", { name: "Disable", exact: true }).click();
  const confirmation = screen.getByRole("dialog", { name: "Confirm disable" });
  await confirmation.getByRole("button", { name: "Disable announcement" }).click();
  await expect(confirmation).toBeHidden();
  await expect(row).toHaveCount(0);

  await browser.clearCookies();
  const disabled = browser.waitForResponse(activeResponse.url);
  await app.open("/faq");
  const disabledResponse = await disabled;
  expect(disabledResponse.status).toBe(200);
  expect(await disabledResponse.text()).not.toContain(title);
  await expect(announcement).toHaveCount(0);
});
