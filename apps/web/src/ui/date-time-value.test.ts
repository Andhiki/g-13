import { describe, expect, test } from "bun:test";
import { datePattern } from "@ui-sdk/react/date";
import {
  dateTimePartsToTimestamp,
  EMPTY_DATE_TIME_PARTS,
  hasPartialDateTime,
  resolveDateTimeControlIssue,
  timestampToDateTimeParts,
} from "./date-time-value";

describe("date-time-value", () => {
  test("round-trips a local timestamp at minute precision", () => {
    const localMs = new Date(2026, 10, 24, 14, 35, 0, 0).getTime();
    const parts = timestampToDateTimeParts(localMs);
    expect(parts).toEqual({ date: "2026-11-24", time: "14:35" });
    expect(dateTimePartsToTimestamp(parts)).toBe(localMs);
  });

  test("defaults time to midnight when only a date is provided", () => {
    const expected = new Date(2026, 10, 24, 0, 0, 0, 0).getTime();
    expect(dateTimePartsToTimestamp({ date: "2026-11-24", time: null })).toBe(expected);
  });

  test("returns null for empty parts or missing date", () => {
    expect(dateTimePartsToTimestamp(EMPTY_DATE_TIME_PARTS)).toBeNull();
    expect(dateTimePartsToTimestamp({ date: null, time: "09:30" })).toBeNull();
  });

  test("rejects calendar overflow and out-of-range times", () => {
    expect(dateTimePartsToTimestamp({ date: "2026-02-31", time: "12:00" })).toBeNull();
    expect(dateTimePartsToTimestamp({ date: "2026-11-24", time: "24:00" })).toBeNull();
    expect(dateTimePartsToTimestamp({ date: "2026-11-24", time: "12:60" })).toBeNull();
    expect(dateTimePartsToTimestamp({ date: "1970-01-01", time: "00:00" })).toBeNull();
  });

  test("flags partial time-only values", () => {
    expect(hasPartialDateTime({ date: null, time: "09:00" })).toBe(true);
    expect(hasPartialDateTime(EMPTY_DATE_TIME_PARTS)).toBe(false);
    expect(hasPartialDateTime({ date: "2026-11-24", time: "09:00" })).toBe(false);
    expect(hasPartialDateTime({ date: "2026-11-24", time: null })).toBe(false);
  });

  test("rejects invalid date drafts while allowing an empty optional field", () => {
    expect(
      resolveDateTimeControlIssue({
        dateInvalid: true,
        dateValidationMessage: "Enter a valid date.",
        dateText: "abc",
        locale: "en",
        timeInvalid: false,
        timeValidationMessage: "",
        hasPartialTime: false,
      }),
    ).toEqual({ part: "date", message: "Enter a valid date." });

    expect(
      resolveDateTimeControlIssue({
        dateInvalid: false,
        dateValidationMessage: "",
        dateText: "abc",
        locale: "id",
        timeInvalid: false,
        timeValidationMessage: "",
        hasPartialTime: false,
      }),
    ).toEqual({ part: "date", message: "Enter a valid date." });

    expect(
      resolveDateTimeControlIssue({
        dateInvalid: false,
        dateValidationMessage: "",
        dateText: "",
        locale: "id",
        timeInvalid: false,
        timeValidationMessage: "",
        hasPartialTime: false,
      }),
    ).toBeNull();
  });

  test("rejects incomplete or invalid time segments", () => {
    expect(
      resolveDateTimeControlIssue({
        dateInvalid: false,
        dateValidationMessage: "",
        dateText: "24/11/2026",
        locale: "id",
        timeInvalid: true,
        timeValidationMessage: "Enter a valid time.",
        hasPartialTime: true,
      }),
    ).toEqual({ part: "time", message: "Enter a valid time." });

    expect(
      resolveDateTimeControlIssue({
        dateInvalid: false,
        dateValidationMessage: "",
        dateText: "24/11/2026",
        locale: "id",
        timeInvalid: false,
        timeValidationMessage: "",
        hasPartialTime: true,
      }),
    ).toEqual({ part: "time", message: "Enter a valid time." });
  });

  test("uses locale-ordered date patterns and validates locale-ordered date text", () => {
    const idPattern = datePattern("id");
    const enPattern = datePattern("en");
    expect(idPattern.fields).toEqual(["day", "month", "year"]);
    expect(idPattern.placeholder).not.toBe(enPattern.placeholder);

    expect(
      resolveDateTimeControlIssue({
        dateInvalid: false,
        dateValidationMessage: "",
        dateText: "03/04/2026",
        locale: "id",
        timeInvalid: false,
        timeValidationMessage: "",
        hasPartialTime: false,
      }),
    ).toBeNull();

    expect(
      resolveDateTimeControlIssue({
        dateInvalid: false,
        dateValidationMessage: "",
        dateText: "03/04/2026",
        locale: "en",
        timeInvalid: false,
        timeValidationMessage: "",
        hasPartialTime: false,
      }),
    ).toBeNull();
  });
});
