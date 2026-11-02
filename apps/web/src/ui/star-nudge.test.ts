import { expect, test } from "bun:test";
import {
  afterCourseOpen,
  afterRoadmapCreated,
  afterStarGiven,
  parseStarNudgeState,
  STAR_NUDGE_COOLDOWN_MS,
  STAR_NUDGE_THRESHOLD,
  type StarNudgeState,
} from "./star-nudge";

const empty = parseStarNudgeState(null);
const now = 1_700_000_000_000;
const hour = STAR_NUDGE_COOLDOWN_MS;

function openCourses(
  state: StarNudgeState,
  ids: string[],
  at: number,
): { state: StarNudgeState; shows: boolean[] } {
  const shows: boolean[] = [];
  for (const id of ids) {
    const result = afterCourseOpen(state, id, at);
    state = result.state;
    shows.push(result.show);
  }
  return { state, shows };
}

test("shows once after five distinct courses and resets the window", () => {
  const { state, shows } = openCourses(empty, ["a", "b", "c", "d", "e"], now);
  expect(STAR_NUDGE_THRESHOLD).toBe(5);
  expect(shows).toEqual([false, false, false, false, true]);
  expect(state).toEqual({ starred: false, courses: [], lastShownAt: now });
});

test("reopening the same course does not count again", () => {
  const { shows } = openCourses(empty, ["a", "a", "b", "a", "c", "d", "e"], now);
  expect(shows).toEqual([false, false, false, false, false, false, true]);
});

test("waits one hour before nudging again", () => {
  const first = openCourses(empty, ["a", "b", "c", "d", "e"], now);
  const blocked = openCourses(first.state, ["f", "g", "h", "i", "j"], now + hour - 1);
  expect(blocked.shows).toEqual([false, false, false, false, false]);
  expect(blocked.state.courses).toEqual(["f", "g", "h", "i", "j"]);

  const later = afterCourseOpen(blocked.state, "k", now + hour);
  expect(later.show).toBe(true);
  expect(later.state).toEqual({ starred: false, courses: [], lastShownAt: now + hour });
});

test("stops after the star link is clicked", () => {
  const starred = afterStarGiven(empty);
  expect(afterCourseOpen(starred, "a", now)).toEqual({ state: starred, show: false });
  expect(afterRoadmapCreated(starred, now)).toEqual({ state: starred, show: false });
});

test("shows on every roadmap creation until starred", () => {
  let state = empty;
  const shows: boolean[] = [];
  for (const at of [now, now, now + hour]) {
    const result = afterRoadmapCreated(state, at);
    state = result.state;
    shows.push(result.show);
  }
  expect(shows).toEqual([true, true, true]);
});

test("roadmap nudge starts the drawer cooldown", () => {
  const created = afterRoadmapCreated(empty, now);
  const { shows } = openCourses(created.state, ["a", "b", "c", "d", "e"], now + hour - 1);
  expect(shows).toEqual([false, false, false, false, false]);
});

test("recovers from malformed and legacy stored state", () => {
  expect(parseStarNudgeState(null)).toEqual(empty);
  expect(parseStarNudgeState("not json")).toEqual(empty);
  expect(
    parseStarNudgeState('{"courses":["a","a",2,null],"dismissed":true,"lastShownOn":"2026-11-02"}'),
  ).toEqual({ starred: false, courses: ["a"], lastShownAt: null });
});
