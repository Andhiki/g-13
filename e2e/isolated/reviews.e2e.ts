import { expect } from "e2e";
import { randomUUID } from "node:crypto";
import { fillReview, profile } from "./review-form.ts";
import { exhaustReviewLimit, fixture } from "../database.ts";
import { test } from "../isolated-test.ts";
import { notFound } from "../routes.ts";
import { isolatedOrigin } from "../targets.ts";

const profileCount = (count: number) => new RegExp(`\\b${count} (ulasan|reviews?)\\b`, "i");

test("Find a lecturer by course and filter and sort the published reviews", async ({
  app,
  screen,
}) => {
  await app.open("/lecturers");
  const search = screen.getByLabel(/cari dosen atau mata kuliah|search lecturers or courses/i);
  await search.fill("Unknown Lecturer E2E");
  await expect(screen.getByText(/tidak ada dosen atau|no lecturers or/i)).toBeVisible();
  await search.fill(fixture.course);
  await screen
    .getByRole("link", { name: new RegExp(fixture.lecturer) })
    .first()
    .click();
  await expect(screen.getByRole("heading", { name: fixture.lecturer })).toBeVisible();
  await expect(screen.getByText(profileCount(2)).first()).toBeVisible();
  await expect(screen.getByRole("img", { name: /3\.0\/5/ })).toBeVisible();
  await expect(screen.getByText("Hidden fixture review")).toBeHidden();
  const filter = screen.getByRole("combobox", { name: /filter mata kuliah|course filter/i });
  await filter.click();
  await screen.getByRole("option", { name: new RegExp(fixture.course) }).click();
  await expect(screen.getByText(fixture.review)).toBeVisible();
  await expect(screen.getByText(fixture.otherReview)).toBeHidden();
  await filter.click();
  await screen.getByRole("option", { name: /semua mata kuliah|all courses/i }).click();
  await expect(screen.getByText(fixture.otherReview)).toBeVisible();
  await screen.getByRole("combobox", { name: /urutan ulasan|review order/i }).click();
  await screen.getByRole("option", { name: /terlama|oldest first/i }).click();
  await expect(screen.getByRole("article").first()).toContainText(fixture.review);
});

test("Empty and unknown lecturer profiles show their distinct recovery screens", async ({
  app,
  screen,
  browser,
}) => {
  await app.open(`/lecturers/${fixture.emptyLecturerId}`);
  await expect(screen.getByRole("heading", { name: "Empty Lecturer Fixture" })).toBeVisible();
  await expect(screen.getByText(/belum ada ulasan|no reviews yet/i).first()).toBeVisible();
  await app.open("/lecturers/e2e-does-not-exist");
  await expect(screen.getByRole("heading", { name: notFound })).toBeVisible();
  await screen.getByRole("link", { name: /^(kembali|back)$/i }).click();
  await expect.poll(async () => new URL(await browser.url()).origin).toBe(isolatedOrigin);
});

for (const author of [undefined, "E2E Reviewer"]) {
  test(`Publish ${author ? "a named" : "an anonymous"} review and update the summary`, async ({
    app,
    browser,
    screen,
  }) => {
    const body = `This e2e review explains helpful examples ${randomUUID()}.`;
    await (await fillReview({ app, browser, screen }, body, { author })).click();
    const review = screen.getByRole("article").filter({ hasText: body });
    await expect(review).toBeVisible();
    await expect(review.getByText(author ?? /anonim|anonymous/i)).toBeVisible();
    await expect(screen.getByText(profileCount(3)).first()).toBeVisible();
    await expect(screen.getByRole("img", { name: /3\.7\/5/ })).toBeVisible();
  });
}

for (const failure of [
  {
    name: "verification rejected",
    rejected: true,
    text: /verifikasi keamanan gagal|security verification failed/i,
  },
  {
    name: "submission limit reached",
    rejected: false,
    text: /batas pengiriman tercapai|submission limit reached/i,
  },
  {
    name: "named review without a name",
    rejected: false,
    author: "",
    text: /isi nama tampilan|enter a display name/i,
  },
]) {
  test(`Review submission recovery: ${failure.name}`, async ({ app, browser, screen }) => {
    if (failure.name === "submission limit reached") await exhaustReviewLimit("submission");
    const body = `This disposable review should never appear ${randomUUID()}.`;
    await (await fillReview({ app, browser, screen }, body, failure)).click();
    await expect(screen.getByRole("dialog").getByText(failure.text)).toBeVisible();
    await expect(screen.getByRole("article").filter({ hasText: body })).toBeHidden();
  });
}

test("Required review fields show validation and receive focus", async ({ app, screen }) => {
  await app.open(profile);
  await screen
    .getByRole("button", { name: /^(tulis ulasan|write a review)$/i })
    .first()
    .click();
  const dialog = screen.getByRole("dialog");
  await dialog.getByRole("button", { name: /kirim ulasan|submit review/i }).click();
  await expect(dialog.getByRole("combobox", { name: /^(mata kuliah|course)$/i })).toBeFocused();
  await expect(
    dialog.getByRole("combobox", { name: /^(semester|periode|term)$/i }),
  ).toHaveAttribute("aria-invalid", "true");
  await expect(dialog.getByLabel(/pengalamanmu|pengalaman anda|your experience/i)).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(
    dialog.getByText(/pilih nilai dari 1 hingga 5|choose a rating from 1 to 5/i),
  ).toHaveCount(3);
});

const like = /^(sukai ulasan|like review)$/i;
const unlike = /^(batalkan suka ulasan|unlike review)$/i;

test("Like, reload, and unlike a published review", async ({ app, browser, screen }) => {
  await app.open(profile);
  const review = screen.getByRole("article").filter({ hasText: fixture.review });
  await expect(screen.getByText("Hidden fixture review")).toBeHidden();
  await expect(review.getByRole("button", { name: like })).toHaveText("0");
  await review.getByRole("button", { name: like }).click();
  const unlikeButton = review.getByRole("button", { name: unlike });
  await expect(unlikeButton).toHaveText("1");
  // Wait for the write to settle; reloading during the optimistic update loses it.
  await expect(unlikeButton).toBeEnabled();
  await browser.reload();
  await expect(review.getByRole("button", { name: unlike })).toHaveText("1");
  await review.getByRole("button", { name: unlike }).click();
  await expect(review.getByRole("button", { name: like })).toHaveText("0");
});

test("A rate-limited like rolls back the count and pressed state", async ({ app, screen }) => {
  await exhaustReviewLimit("like");
  await app.open(profile);
  const review = screen.getByRole("article").filter({ hasText: fixture.review });
  await review.getByRole("button", { name: like }).click();
  await expect(
    screen.getByText(/could not update like|gagal.*suka|tidak dapat memperbarui suka/i),
  ).toBeVisible();
  await expect(review.getByRole("button", { name: like })).toHaveText("0");
});
