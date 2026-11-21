import { createLocalStorage, createPreference } from "@ui-sdk/core";
import { usePreference } from "@ui-sdk/react/preferences";

export type Cursor = "default" | "pointer";

export const cursorPreference = createPreference({
  values: ["default", "pointer"],
  defaultValue: "default",
  attribute: "data-cursor",
  global: true,
  storage: createLocalStorage("g13-cursor"),
});

export function useCursorPreference() {
  const { value } = usePreference(cursorPreference);
  return {
    cursor: value,
    setCursor: (cursor: Cursor) => {
      cursorPreference.set(cursor);
    },
  };
}
