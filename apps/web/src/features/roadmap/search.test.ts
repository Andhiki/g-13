import { expect, test } from "bun:test";
import { validateRoadmapSearch } from "./search";
import { answerQuestion, firstUnanswered, quizQuestions } from "./quiz";
import { buildRoadmap } from "./planner.test-support";

const baseline = {
  kurikulum: "2026",
  minat: "Analisis Data",
  iup: "tidak",
  magang: "tidak",
  hasil: true,
};
test("URL validation rejects incompatible choices and skips conditional questions", () => {
  const answers = validateRoadmapSearch({
    ...baseline,
    paparan: "exchange",
    durasi: "penuh",
    lulus: "9",
    semesterPaparan: "3",
    ganti: { PACS262605: "PACS262307", MII211234: "missing" },
  });
  expect(answers.paparan).toBeUndefined();
  expect(answers.durasi).toBeUndefined();
  expect(answers.ganti).toBeUndefined();
  expect(answers.lulus).toBe(8);
  expect(answers.semesterPaparan).toBe(6);
  expect(quizQuestions(answers).map((x) => x.key)).toEqual(["kurikulum", "iup", "minat", "magang"]);
  expect(firstUnanswered(answers)).toBeUndefined();
});

test("a curriculum change clears incompatible recommendations and duration but retains IUP intent", () => {
  const initial = validateRoadmapSearch({
    ...baseline,
    iup: "ya",
    paparan: "exchange",
    magang: "ya",
    durasi: "penuh",
    ganti: { PACS262422: "PACS262307" },
  });
  const next = validateRoadmapSearch(answerQuestion(initial, "kurikulum", "2021"));
  expect(next.minat).toBeUndefined();
  expect(next.durasi).toBeUndefined();
  expect(next.ganti).toBeUndefined();
  expect(next.paparan).toBe("exchange");
  expect(firstUnanswered(next)?.key).toBe("minat");
});

test("malformed and partial result links resume the first unanswered question", () => {
  expect(
    firstUnanswered(
      validateRoadmapSearch({ hasil: true, kurikulum: "fake", minat: "Analisis Data" }),
    )?.key,
  ).toBe("kurikulum");
  expect(
    firstUnanswered(validateRoadmapSearch({ ...baseline, iup: "ya", paparan: "nonsense" }))?.key,
  ).toBe("paparan");
  expect(validateRoadmapSearch({ ...baseline, ganti: ["bad"] }).ganti).toBeUndefined();
  expect(validateRoadmapSearch({ ...baseline, ganti: null }).ganti).toBeUndefined();
  expect(validateRoadmapSearch({ ...baseline, minat: "Lab Sistem Cerdas" }).minat).toBeUndefined();
});

test("conditional answers survive Back, and leaving IUP removes an invalid no-minat exemption", () => {
  const initial = validateRoadmapSearch({
    ...baseline,
    iup: "ya",
    paparan: "double",
    minat: "tanpa-minat",
    magang: "ya",
    durasi: "pendek",
  });
  expect(quizQuestions(initial).map((x) => x.key)).toEqual([
    "kurikulum",
    "iup",
    "paparan",
    "minat",
    "magang",
    "durasi",
  ]);
  const next = validateRoadmapSearch(answerQuestion(initial, "iup", "tidak"));
  expect(next.paparan).toBeUndefined();
  expect(next.minat).toBeUndefined();
  expect(next.durasi).toBe("pendek");
});

test("shared elective replacements update the planned course and restore identically", () => {
  const answers = validateRoadmapSearch({ ...baseline, ganti: { PACS262422: "PACS262501" } });
  const plan = buildRoadmap(answers);
  expect(plan.courses.find((x) => x.originalId === "PACS262422")?.course.id).toBe("PACS262501");
  const restored = validateRoadmapSearch(JSON.parse(JSON.stringify(answers)));
  expect(buildRoadmap(restored)).toEqual(plan);
});

test("a shared link cannot replace required courses, wajib minat, or duplicate planned courses", () => {
  const answers = validateRoadmapSearch({
    ...baseline,
    ganti: { PACS262419: "PACS262501", PACS262605: "PACS262501", PACS262422: "PACS262307" },
  });
  const plan = buildRoadmap(answers);
  expect(plan.courses.find((x) => x.originalId === "PACS262419")?.course.id).toBe("PACS262419");
  expect(plan.courses.find((x) => x.originalId === "PACS262605")?.course.id).toBe("PACS262605");
  expect(plan.courses.find((x) => x.originalId === "PACS262422")?.course.id).toBe("PACS262422");
});

test("numeric curriculum query values accepted by the router restore a direct result link", () => {
  const answers = validateRoadmapSearch({ ...baseline, kurikulum: 2026 });
  expect(answers.kurikulum).toBe("2026");
  expect(firstUnanswered(answers)).toBeUndefined();
});

test("malformed JSON query objects cannot crash curriculum and semester validation", () => {
  const invalid = { toString: null };
  const answers = validateRoadmapSearch({
    kurikulum: invalid,
    lulus: invalid,
    semesterPaparan: invalid,
  });
  expect(answers.kurikulum).toBeUndefined();
  expect(answers.lulus).toBe(8);
  expect(answers.semesterPaparan).toBe(6);
});

test("2021 internship completes the quiz without duration and recommends 20 credits", () => {
  const answers = validateRoadmapSearch({
    ...baseline,
    kurikulum: "2021",
    minat: "Lab Sistem Cerdas",
    magang: "ya",
  });
  expect(quizQuestions(answers).some((question) => question.key === "durasi")).toBe(false);
  expect(firstUnanswered(answers)).toBeUndefined();
  expect(
    buildRoadmap(answers).activities.find((activity) => activity.id === "internship")
      ?.recommendedCredits,
  ).toBe(20);
});
