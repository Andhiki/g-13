import { parseDate } from "@ui-sdk/react/date";

export type DateTimeParts = {
  date: string | null;
  time: string | null;
};

export type DateTimeControlIssue = {
  part: "date" | "time";
  message: string;
};

export const EMPTY_DATE_TIME_PARTS: DateTimeParts = { date: null, time: null };

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Formats an epoch millisecond timestamp as local `"YYYY-MM-DD"` and `"HH:MM"` parts. */
export function timestampToDateTimeParts(ms: number): DateTimeParts {
  const date = new Date(ms);
  return {
    date: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
    time: `${pad2(date.getHours())}:${pad2(date.getMinutes())}`,
  };
}

/**
 * Parses local date + time strings into epoch milliseconds. Defaults time to `"00:00"` when
 * a date is chosen without a time, and returns `null` when empty or out of calendar range.
 */
export function dateTimePartsToTimestamp(parts: DateTimeParts): number | null {
  if (!parts.date) return null;
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(parts.date);
  if (!dateMatch) return null;
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);

  const timeString = parts.time ?? "00:00";
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeString);
  if (!timeMatch) return null;
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59) return null;

  const constructed = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    constructed.getFullYear() !== year ||
    constructed.getMonth() !== month - 1 ||
    constructed.getDate() !== day
  ) {
    return null;
  }
  const timestamp = constructed.getTime();
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

export function hasPartialDateTime(parts: DateTimeParts): boolean {
  return parts.date === null && parts.time !== null;
}

export function resolveDateTimeControlIssue(input: {
  dateInvalid: boolean;
  dateValidationMessage: string;
  dateText: string;
  locale: string;
  timeInvalid: boolean;
  timeValidationMessage: string;
  hasPartialTime: boolean;
}): DateTimeControlIssue | null {
  if (input.dateInvalid) {
    return { part: "date", message: input.dateValidationMessage || "Enter a valid date." };
  }
  const trimmedDate = input.dateText.trim();
  if (trimmedDate !== "" && parseDate(trimmedDate, input.locale) === undefined) {
    return { part: "date", message: "Enter a valid date." };
  }
  if (input.timeInvalid || input.hasPartialTime) {
    return { part: "time", message: input.timeValidationMessage || "Enter a valid time." };
  }
  return null;
}
