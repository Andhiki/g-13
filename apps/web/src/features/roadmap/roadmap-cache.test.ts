import { expect, test } from "bun:test";
import { getRoadmap } from "./roadmap-cache";
import { planningInput } from "./planning-input";
import { validateRoadmapSearch } from "./search";

const baseline = { kurikulum: "2026", minat: "Analisis Data", iup: "tidak", magang: "tidak" };

test("equivalent planning inputs reuse a plan independently of quiz navigation", () => {
  const input = planningInput(validateRoadmapSearch(baseline))!;
  const plan = getRoadmap(input);
  expect(
    getRoadmap(
      planningInput(validateRoadmapSearch({ ...baseline, hasil: true, langkah: "review" }))!,
    ),
  ).toBe(plan);
  expect(getRoadmap({ ...input, lulus: 7 })).not.toBe(plan);
});

test("incomplete or incompatible quiz answers cannot enter the planner", () => {
  for (const answers of [
    {},
    { ...baseline, iup: "ya", paparan: "invalid" },
    { ...baseline, magang: "ya" },
    { ...baseline, minat: "unknown" },
    { ...baseline, kurikulum: "2021", minat: "Lab Sistem Cerdas", magang: "ya", durasi: "penuh" },
  ])
    expect(planningInput(validateRoadmapSearch(answers))).toBeNull();
});

test("replacement order does not change planning identity", () => {
  const first = planningInput(
    validateRoadmapSearch({
      ...baseline,
      ganti: { PACS262422: "PACS262501", PACS262526: "PACS262307" },
    }),
  )!;
  const second = planningInput(
    validateRoadmapSearch({
      ...baseline,
      ganti: { PACS262526: "PACS262307", PACS262422: "PACS262501" },
    }),
  )!;
  expect(getRoadmap(first)).toBe(getRoadmap(second));
});
