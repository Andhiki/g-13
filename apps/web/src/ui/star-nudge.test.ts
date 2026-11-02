import { expect, test } from "bun:test";
import {
  parseStarNudgeState,
  recordCourseOpen,
  STAR_NUDGE_THRESHOLD,
  type StarNudgeState,
} from "./star-nudge";

function openCourses(ids: string[]): { state: StarNudgeState; shows: boolean[] } {
  let state = parseStarNudgeState(null);
  const shows = ids.map((id) => {
    const next = recordCourseOpen(state, id);
    state = next.state;
    return next.show;
  });
  return { state, shows };
}

test("shows the star nudge once after five distinct courses", () => {
  const { state, shows } = openCourses(["a", "b", "c", "d", "e", "f"]);
  expect(STAR_NUDGE_THRESHOLD).toBe(5);
  expect(shows).toEqual([false, false, false, false, true, false]);
  expect(state.courses).toEqual(["a", "b", "c", "d", "e"]);
  expect(state.dismissed).toBe(true);
});

test("reopening the same course does not count again", () => {
  const { state, shows } = openCourses(["a", "a", "b", "a", "c", "d", "e"]);
  expect(shows).toEqual([false, false, false, false, false, false, true]);
  expect(state.courses).toEqual(["a", "b", "c", "d", "e"]);
});

test("ignores courses after the nudge is dismissed", () => {
  const dismissed = parseStarNudgeState('{"courses":["a"],"dismissed":true}');
  expect(recordCourseOpen(dismissed, "b")).toEqual({ state: dismissed, show: false });
});

test("recovers from malformed stored state", () => {
  expect(parseStarNudgeState(null)).toEqual({ courses: [], dismissed: false });
  expect(parseStarNudgeState("not json")).toEqual({ courses: [], dismissed: false });
  expect(parseStarNudgeState('{"courses":["a","a",2,null],"dismissed":true}')).toEqual({
    courses: ["a"],
    dismissed: true,
  });
});
