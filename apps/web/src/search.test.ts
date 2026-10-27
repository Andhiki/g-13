import { describe, expect, test } from "bun:test";
import { validateCurriculumSearch } from "./search";

describe("curriculum search parameters", () => {
  test.each(["2021", 2021])("preserves a 2021 deep link parsed as %p", (kurikulum) => {
    expect(validateCurriculumSearch({ kurikulum, mk: "MII21-1203" })).toEqual({
      kurikulum: "2021",
      mk: "MII21-1203",
    });
  });

  test("defaults missing and invalid curricula to 2026", () => {
    for (const kurikulum of [undefined, "invalid", null, 2025]) {
      expect(validateCurriculumSearch({ kurikulum })).toEqual({
        kurikulum: "2026",
        mk: undefined,
      });
    }
  });

  test("accepts a 2026 course", () => {
    expect(validateCurriculumSearch({ kurikulum: 2026, mk: "PACS262101" })).toEqual({
      kurikulum: "2026",
      mk: "PACS262101",
    });
  });

  test.each(["missing", "MII21-1203", 123])("ignores an invalid 2026 course %p", (mk) => {
    expect(validateCurriculumSearch({ kurikulum: "2026", mk }).mk).toBeUndefined();
  });
});
