import { expect, test } from "bun:test";
import { hiddenNotificationTypes } from "./audience";

test("hides privileged notification types from roles that lost access", () => {
  expect(hiddenNotificationTypes("admin")).toEqual([]);
  expect(hiddenNotificationTypes("maintainer")).toEqual(["user.pending_approval"]);
  expect(hiddenNotificationTypes("user")).toEqual(["review.created", "user.pending_approval"]);
  expect(hiddenNotificationTypes(undefined)).toEqual(["review.created", "user.pending_approval"]);
});
