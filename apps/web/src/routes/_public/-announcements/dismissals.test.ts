import { expect, test } from "bun:test";
import {
  DISMISSAL_RETENTION_MS,
  dismissAnnouncement,
  filterAnnouncementsNotDismissed,
  parseDismissedAnnouncements,
} from "./dismissals";

const now = 1_700_000_000_000;

test("parses valid dismissal records and prunes expired entries", () => {
  expect(parseDismissedAnnouncements(null, now)).toEqual({});
  expect(parseDismissedAnnouncements("not json", now)).toEqual({});
  expect(parseDismissedAnnouncements("[1,2]", now)).toEqual({});
  expect(parseDismissedAnnouncements('{"": 5}', now)).toEqual({});
  expect(
    parseDismissedAnnouncements(
      JSON.stringify({ fresh: now - 1000, stale: now - DISMISSAL_RETENTION_MS - 1 }),
      now,
    ),
  ).toEqual({ fresh: now - 1000 });
});

test("dismissing adds the announcement ID with the current time", () => {
  const dismissed = dismissAnnouncement({ other: now - 100 }, "announcement-1", now);
  expect(dismissed).toEqual({ other: now - 100, "announcement-1": now });
});

test("filters rows by their dismissed IDs", () => {
  const rows = [{ id: "announcement-1" }, { id: "announcement-2" }];
  expect(filterAnnouncementsNotDismissed(rows, { "announcement-1": now })).toEqual([
    { id: "announcement-2" },
  ]);
  expect(filterAnnouncementsNotDismissed(rows, {})).toEqual(rows);
});
