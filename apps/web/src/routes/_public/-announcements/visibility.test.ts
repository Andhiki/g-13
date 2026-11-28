import { expect, test } from "bun:test";
import { nextVisibilityChange, visibleAnnouncements } from "./visibility";

const now = 1_700_000_000_000;
const row = (id: string, startsAt: number, endsAt: number | null) => ({
  id,
  startsAt: new Date(startsAt),
  endsAt: endsAt === null ? null : new Date(endsAt),
});

test("an announcement disappears once its end passes, without a refetch", () => {
  const rows = [row("ending", now - 1000, now + 1000), row("open", now - 1000, null)];
  expect(visibleAnnouncements(rows, {}, now).map((r) => r.id)).toEqual(["ending", "open"]);
  expect(visibleAnnouncements(rows, {}, now + 999).map((r) => r.id)).toEqual(["ending", "open"]);
  // End is exclusive: at exactly endsAt the announcement is gone.
  expect(visibleAnnouncements(rows, {}, now + 1000).map((r) => r.id)).toEqual(["open"]);
});

test("dismissed and not-yet-started rows stay hidden", () => {
  const rows = [row("dismissed", now - 1, null), row("later", now + 5000, null)];
  expect(visibleAnnouncements(rows, { dismissed: now }, now)).toEqual([]);
  expect(visibleAnnouncements(rows, {}, now + 5000).map((r) => r.id)).toEqual([
    "dismissed",
    "later",
  ]);
});

test("the next visibility change is the nearest future start or end", () => {
  const rows = [row("a", now - 1, now + 3000), row("b", now + 2000, null), row("c", now - 1, null)];
  expect(nextVisibilityChange(rows, now)).toBe(now + 2000);
  expect(nextVisibilityChange(rows, now + 2000)).toBe(now + 3000);
  expect(nextVisibilityChange(rows, now + 3000)).toBeNull();
});
