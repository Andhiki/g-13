import type { Course } from "@g13/curriculum";
import type { Conflict } from "./conflicts";

export function formatConflict(
  conflict: Conflict,
  localize: {
    text: (key: string, values?: Record<string, unknown>) => string;
    courseName: (course: Course) => string;
  },
) {
  const values = Object.fromEntries(
    Object.entries(conflict.values).map(([key, value]) => [
      key,
      Array.isArray(value)
        ? value.map(localize.courseName).join(", ")
        : typeof value === "object"
          ? localize.courseName(value)
          : value,
    ]),
  );
  return localize.text(conflict.key, values);
}
