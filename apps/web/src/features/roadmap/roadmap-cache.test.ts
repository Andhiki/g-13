import { expect, test } from "bun:test";
import { courseTitle } from "@g13/i18n";
import { getRoadmap } from "./roadmap-cache";
import { validateRoadmapSearch } from "./search";

const localize = {
  text: (key: string) => key,
  courseName: (course: Parameters<typeof courseTitle>[0]) => courseTitle(course, "id"),
};

test("roadmaps reuse equivalent answers across visits and separate language and planning changes", () => {
  const answers = validateRoadmapSearch({ kurikulum: "2026", minat: "Analisis Data" });
  const plan = getRoadmap(answers, "id", localize);
  expect(getRoadmap({ ...answers, hasil: true, langkah: "review" }, "id", localize)).toBe(plan);
  expect(getRoadmap({ ...answers, lulus: 7 }, "id", localize)).not.toBe(plan);
  expect(getRoadmap(answers, "en", localize)).not.toBe(plan);
});
