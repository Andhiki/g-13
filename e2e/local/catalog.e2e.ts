import { expect } from "e2e";
import { randomUUID } from "node:crypto";
import { fixture } from "../fixtures/database.ts";
import { test } from "../fixtures/local-test.ts";
import { profile } from "../fixtures/review-form.ts";

for (const catalog of [
  {
    path: "courses",
    kind: "course",
    heading: "Courses",
    filter: /filter code or course name/i,
    group: "Name",
    label: "Indonesian",
  },
  {
    path: "lecturers",
    kind: "lecturer",
    heading: "Lecturers",
    filter: /filter lecturer name or slug/i,
    group: undefined,
    label: "Full name",
  },
]) {
  test(`Create, edit, delete, and restore a ${catalog.kind}`, async ({
    app,
    browser,
    screen,
    signIn,
  }) => {
    await signIn("maintainer");
    await app.open(`/dashboard/${catalog.path}`);
    await expect(screen.getByRole("heading", { name: catalog.heading })).toBeVisible();
    const filter = screen.getByPlaceholder(catalog.filter);
    const title = `Add ${catalog.kind}`;
    const name = `E2E Disposable Record ${randomUUID().slice(0, 8)}`;
    const revised = `${name} Revised`;
    await filter.fill("nonexistent record");
    await expect(screen.getByText(`No matching ${catalog.path}`)).toBeVisible();
    await filter.clear();
    await screen.getByRole("button", { name: title }).first().click();
    const form = screen.getByRole("dialog", { name: title });
    const field = (root: typeof form) =>
      catalog.group
        ? root.getByRole("group", { name: catalog.group }).getByLabel(catalog.label)
        : root.getByLabel(catalog.label);
    const submit = form.getByRole("button", { name: title });
    await submit.click();
    await expect(field(form)).toHaveAttribute("aria-invalid", "true");
    if (catalog.kind === "course") {
      await form.getByLabel("Code").fill(`E2ETEST${randomUUID().slice(0, 8)}`);
      await form.getByRole("group", { name: "Name" }).getByLabel("English").fill(name);
    }
    await field(form).fill(name);
    await submit.click();
    await expect(form).toBeHidden();

    await filter.fill(name);
    await expect(screen.getByTestId("search-match").filter({ hasText: name }).first()).toBeVisible();
    await screen.getByRole("button", { name: /inspect.*e2e disposable record/i }).click();
    await expect(
      screen.getByText(`${catalog.kind} details`, { exact: false }).first(),
    ).toBeVisible();
    const inspectorLabel =
      catalog.kind === "course" ? "Selected course details" : "Selected lecturer details";
    const inspector = screen.getByRole("complementary", { name: inspectorLabel });
    const edit = inspector.getByRole("button", { name: "Edit", exact: true });
    await edit.click();
    const editForm = screen.getByRole("dialog", { name: `Edit ${catalog.kind}` });
    await field(editForm).fill("Canceled edit");
    await editForm.getByRole("button", { name: "Cancel" }).click();
    await expect(screen.getByText("Canceled edit")).toBeHidden();
    await expect(editForm).toBeHidden();
    // The exit overlay still eats pointer clicks; activate the trigger by keyboard.
    await edit.press("Enter");
    await field(editForm).fill(revised);
    if (catalog.kind === "course")
      await editForm.getByRole("group", { name: "Name" }).getByLabel("English").fill(revised);
    await editForm.getByRole("button", { name: "Save changes" }).click();
    await expect(editForm).toBeHidden();
    await browser.reload();
    await filter.fill(revised);
    await expect(screen.getByText(revised, { exact: true }).first()).toBeVisible();

    const remove = inspector.getByRole("button", { name: "Delete", exact: true });
    const confirmDelete = screen.getByRole("dialog", { name: "Confirm delete" });
    await remove.click();
    await confirmDelete.getByRole("button", { name: "Cancel" }).click();
    await expect(confirmDelete).toBeHidden();
    await expect(remove).toBeVisible();
    // The exit overlay still eats pointer clicks; reopen by keyboard.
    await remove.press("Enter");
    await confirmDelete
      .getByRole("button", { name: `Hold to Delete ${catalog.kind}` })
      .longPress({ duration: 1_000 });
    await expect(
      screen.getByRole("button", { name: /inspect.*e2e disposable record/i }),
    ).toBeHidden();
    // The delete dialog exit overlay can intercept a pointer click.
    await screen.getByRole("button", { name: /^deleted\b/i }).press("Enter");
    await expect(screen.getByText(revised, { exact: true }).first()).toBeVisible();
    await screen.getByRole("button", { name: "Restore", exact: true }).first().click();
    const confirmRestore = screen.getByRole("dialog", { name: "Confirm restore" });
    await confirmRestore.getByRole("button", { name: `Restore ${catalog.kind}` }).click();
    await expect(confirmRestore).toBeHidden();
    // The restore dialog's exit overlay can eat the first pointer click.
    await screen.getByRole("button", { name: /^active\b/i }).press("Enter");
    await expect(screen.getByText(revised, { exact: true }).first()).toBeVisible();
  });
}

test("A deleted course is unavailable for new reviews and its published reviews remain", async ({
  app,
  screen,
  signIn,
}) => {
  await signIn("maintainer");
  await app.open("/dashboard/courses");
  await screen.getByPlaceholder(/filter code or course name/i).fill("E2E101");
  await screen.getByRole("button", { name: "Delete", exact: true }).first().click();
  await screen
    .getByRole("dialog", { name: "Confirm delete" })
    .getByRole("button", { name: "Hold to Delete course" })
    .longPress({ duration: 1_000 });
  await expect(screen.getByText("No matching courses")).toBeVisible();
  await app.open(profile);
  await expect(screen.getByText(fixture.review)).toBeVisible();
  await screen
    .getByRole("button", { name: /^(tulis ulasan|write a review)$/i })
    .first()
    .click();
  const course = screen
    .getByRole("dialog")
    .getByRole("combobox", { name: /^(mata kuliah|course)$/i });
  await course.fill("E2E");
  await expect(screen.getByRole("option", { name: /E2E102/i })).toBeVisible();
  await expect(screen.getByRole("option", { name: /E2E101/i })).toBeHidden();
});

test("A deleted lecturer is removed from public search and the profile review entry", async ({
  app,
  screen,
  signIn,
}) => {
  await signIn("maintainer");
  await app.open("/dashboard/lecturers");
  await screen.getByPlaceholder(/filter lecturer name or slug/i).fill(fixture.lecturerId);
  await screen.getByRole("button", { name: "Delete", exact: true }).first().click();
  await screen
    .getByRole("dialog", { name: "Confirm delete" })
    .getByRole("button", { name: "Hold to Delete lecturer" })
    .longPress({ duration: 1_000 });
  await expect(screen.getByText("No matching lecturers")).toBeVisible();
  await app.open("/lecturers");
  await screen
    .getByLabel(/cari dosen atau mata kuliah|search lecturers or courses/i)
    .fill(fixture.lecturer);
  await expect(
    screen.getByRole("link", { name: new RegExp(`^${fixture.lecturer}\\b`, "i") }),
  ).toBeHidden();
  await app.open(profile);
  await expect(
    screen.getByRole("heading", { name: /halaman tidak ditemukan|page not found/i }),
  ).toBeVisible();
  await expect(screen.getByRole("button", { name: /tulis ulasan|write a review/i })).toBeHidden();
});
