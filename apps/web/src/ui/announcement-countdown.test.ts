import { describe, expect, test } from "bun:test";
import { resolveAnnouncementCountdown } from "./announcement-countdown";

const second = 1_000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;

describe("resolveAnnouncementCountdown", () => {
  test("shows days and hours at and above a day", () => {
    expect(resolveAnnouncementCountdown(day + 2 * hour, 0)).toEqual({
      state: "countdown",
      parts: [
        { unit: "day", value: 1 },
        { unit: "hour", value: 2 },
      ],
      summary: { unit: "day", value: 1 },
    });
    expect(resolveAnnouncementCountdown(day, 0)).toEqual({
      state: "countdown",
      parts: [{ unit: "day", value: 1 }],
      summary: { unit: "day", value: 1 },
    });
  });

  test("shows hours and minutes at and above an hour", () => {
    expect(resolveAnnouncementCountdown(2 * hour + 5 * minute, 0)).toEqual({
      state: "countdown",
      parts: [
        { unit: "hour", value: 2 },
        { unit: "minute", value: 5 },
      ],
      summary: { unit: "hour", value: 2 },
    });
    expect(resolveAnnouncementCountdown(hour, 0)).toEqual({
      state: "countdown",
      parts: [{ unit: "hour", value: 1 }],
      summary: { unit: "hour", value: 1 },
    });
  });

  test("shows minutes until the last minute, then ceils seconds", () => {
    expect(resolveAnnouncementCountdown(59 * minute, 0)).toEqual({
      state: "countdown",
      parts: [{ unit: "minute", value: 59 }],
      summary: { unit: "minute", value: 59 },
    });
    expect(resolveAnnouncementCountdown(minute - 1, 0)).toEqual({
      state: "countdown",
      parts: [{ unit: "second", value: 60 }],
      summary: "less-than-minute",
    });
    expect(resolveAnnouncementCountdown(1, 0)).toEqual({
      state: "countdown",
      parts: [{ unit: "second", value: 1 }],
      summary: "less-than-minute",
    });
  });

  test("returns happening-now at and after the target", () => {
    expect(resolveAnnouncementCountdown(100, 100)).toEqual({ state: "happening-now" });
    expect(resolveAnnouncementCountdown(100, 101)).toEqual({ state: "happening-now" });
  });
});
