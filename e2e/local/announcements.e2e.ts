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

test("Announcement modal keeps header and footer fixed while scrolling and switches ui-sdk variants", async ({
  app,
  browser,
  screen,
  signIn,
}) => {
  await signIn("admin");
  await app.open("/dashboard/announcements");
  await screen.getByRole("button", { name: "Add announcement", exact: true }).first().click();

  const form = screen.getByRole("dialog", { name: "Add announcement" });
  await expect(form).toBeVisible();
  await form.getByRole("textbox", { name: "CTA link (optional)" }).fill("https://example.com");

  const variants = form.getByRole("radiogroup", { name: "Variant" });
  await expect(variants.getByRole("radio", { name: "Primary" })).toBeChecked();
  await variants.getByRole("radio", { name: "Error" }).click();
  await expect(variants.getByRole("radio", { name: "Error" })).toBeChecked();
  await expect(variants.getByRole("radio", { name: "Primary" })).not.toBeChecked();

  const layout = await browser.evaluate(async () => {
    const dialog = document.querySelector<HTMLElement>('[role="dialog"][data-open]');
    if (!dialog) return null;
    await Promise.all(
      dialog.getAnimations({ subtree: true }).map((animation) => animation.finished),
    );
    const header = dialog.querySelector<HTMLElement>('[data-slot="modal-header"]');
    const body = dialog.querySelector<HTMLElement>('[data-slot="modal-body"]');
    const footer = dialog.querySelector<HTMLElement>('[data-slot="modal-footer"]');
    if (!header || !body || !footer) return null;

    const dialogOverflow = dialog.scrollHeight > dialog.clientHeight;
    const bodyOverflow = body.scrollHeight > body.clientHeight;
    const headerBefore = header.getBoundingClientRect();
    const footerBefore = footer.getBoundingClientRect();

    body.scrollTop = body.scrollHeight;

    const headerAfter = header.getBoundingClientRect();
    const footerAfter = footer.getBoundingClientRect();

    return {
      dialogOverflow,
      bodyOverflow,
      scrollTop: body.scrollTop,
      headerTopDelta: Math.abs(headerAfter.top - headerBefore.top),
      footerBottomDelta: Math.abs(footerAfter.bottom - footerBefore.bottom),
      footerBottom: footerAfter.bottom,
      viewportHeight: window.innerHeight,
    };
  });

  expect(layout).not.toBeNull();
  expect(layout?.dialogOverflow).toBe(false);
  expect(layout?.bodyOverflow).toBe(true);
  expect(layout?.scrollTop).toBeGreaterThan(0);
  expect(layout?.headerTopDelta).toBeLessThanOrEqual(0.5);
  expect(layout?.footerBottomDelta).toBeLessThanOrEqual(0.5);
  expect(layout?.footerBottom).toBeLessThanOrEqual(layout?.viewportHeight ?? 0);

  await form.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(form).toBeHidden();
});
