import { expect } from "e2e";
import { fixture } from "../fixtures/database.ts";
import { test } from "../fixtures/local-test.ts";

const queue = "/dashboard/lecturer-reviews";
const profile = `/lecturers/${fixture.lecturerId}`;

test("Maintainer can cancel, hide, and restore a review and its public rating", async ({
  app,
  screen,
  signIn,
}) => {
  await signIn("maintainer");
  await app.open(queue);
  const filter = screen.getByPlaceholder(/filter lecturer, course, text/i);
  await filter.fill("missing-do-not-match");
  await expect(screen.getByText("No matching reviews")).toBeVisible();
  await filter.fill(fixture.review);
  await screen.getByRole("button", { name: /inspect lecturer fixture.*seed author/i }).click();
  await expect(screen.getByText("Review details", { exact: true }).first()).toBeVisible();
  const hide = screen.getByRole("button", { name: "Hide", exact: true }).first();
  await hide.click();
  const confirmHide = screen.getByRole("dialog", { name: /^confirm hide$/i });
  await confirmHide.getByRole("button", { name: "Cancel" }).click();
  await expect(confirmHide).toBeHidden();
  await expect(hide).toBeVisible();
  await hide.press("Enter");
  await expect(confirmHide).toBeVisible();
  await confirmHide.getByRole("button", { name: "Hide review" }).click();
  await expect(
    screen
      .getByRole("article")
      .filter({ hasText: fixture.review })
      .getByText("Hidden", { exact: true }),
  ).toBeVisible();
  await app.open(profile);
  await expect(screen.getByText(fixture.review)).toBeHidden();
  await expect(screen.getByText(/\b1 (ulasan|review)\b/i).first()).toBeVisible();
  await expect(screen.getByRole("img", { name: /2\.0\/5/ })).toBeVisible();
  await app.open(queue);
  await filter.fill(fixture.review);
  await screen.getByRole("button", { name: "Restore", exact: true }).first().click();
  await screen
    .getByRole("dialog", { name: /^confirm restore$/i })
    .getByRole("button", { name: "Restore review" })
    .click();
  await expect(
    screen
      .getByRole("article")
      .filter({ hasText: fixture.review })
      .getByText("Published", { exact: true }),
  ).toBeVisible();
  await app.open(profile);
  await expect(screen.getByText(fixture.review)).toBeVisible();
  await expect(screen.getByText(/\b2 (ulasan|reviews)\b/i).first()).toBeVisible();
  await expect(screen.getByRole("img", { name: /3\.0\/5/ })).toBeVisible();
});

test("Deleting a disposable review removes it and its reaction control from the profile", async ({
  app,
  screen,
  signIn,
}) => {
  await signIn("maintainer");
  await app.open(queue);
  await screen.getByPlaceholder(/filter lecturer, course, text/i).fill(fixture.otherReview);
  await screen.getByRole("button", { name: "Delete", exact: true }).first().click();
  await screen
    .getByRole("dialog", { name: /^confirm delete$/i })
    .getByRole("button", { name: "Hold to Delete review" })
    .longPress({ duration: 1_000 });
  await expect(
    screen
      .getByRole("article")
      .filter({ hasText: fixture.otherReview })
      .getByText("Deleted", { exact: true }),
  ).toBeVisible();
  await app.open(profile);
  await expect(screen.getByText(fixture.review)).toBeVisible();
  await expect(screen.getByText(fixture.otherReview)).toBeHidden();
  await expect(screen.getByRole("button", { name: /^(sukai ulasan|like review)$/i })).toHaveCount(
    1,
  );
});
