import { expect, test } from "bun:test";
import { getCurriculum } from "@g13/curriculum";
import { courseTitle } from "@g13/i18n";
import { loadMessages } from "@g13/i18n/messages";
import { createI18n, messageNamespace } from "./i18n";
import { planningInput } from "./features/roadmap/planning-input";
import { formatConflict } from "./features/roadmap/conflict-format";
import { buildRoadmap } from "./features/roadmap/planner";
import { validateRoadmapSearch } from "./features/roadmap/search";
import { examArchive } from "./features/exam-archive/catalog";
import { browseArchive } from "./features/exam-archive/archive";

const common = await loadMessages("en", "common");
const roadmap = await loadMessages("en", "roadmap");
const instance = createI18n({ language: "en", namespace: "roadmap", messages: roadmap, common });
const text = (key: string, values?: Record<string, unknown>) =>
  instance.t(key, { ...values, ns: "roadmap", keySeparator: false, defaultValue: key });

test("English roadmap messages preserve planning results and localize course names", () => {
  const plan = buildRoadmap(
    planningInput(
      validateRoadmapSearch({
        kurikulum: "2026",
        minat: "Analisis Data",
        iup: "ya",
        paparan: "double",
        magang: "tidak",
        lulus: 7,
      }),
    )!,
  );
  expect(plan.totalCredits).toBeGreaterThanOrEqual(144);
  const conflicts = plan.conflicts
    .map((conflict) =>
      formatConflict(conflict, { text, courseName: (course) => courseTitle(course, "en") }),
    )
    .join(" ");
  expect(conflicts).toContain("partner university");
  expect(conflicts).not.toContain("mata kuliah");
  expect(
    text("roadmapSummary", {
      curriculum: "2026",
      interest: "Data Analysis",
      target: 7,
      activities: "Double degree",
      review: "Review notes",
    }),
  ).toContain("your goal of finishing in 7 semesters");
});

test("all course categories and prerequisite fragments have English resources", () => {
  for (const id of ["2021", "2026"] as const)
    for (const course of getCurriculum(id).all) {
      expect(course.englishTitle.trim()).not.toBe("");
      for (const placement of course.placements) {
        for (const value of [
          placement.label,
          placement.group,
          ...placement.prerequisiteRaw.split(/[,\n;]+/).map((part) => part.trim()),
        ].filter((part) => part && part !== "-"))
          expect(common[value], `${course.id}: ${value}`).toBeDefined();
      }
    }
});

test("every exam course has English display text and is searchable in either language", async () => {
  const messages = await loadMessages("en", "exam");
  for (const course of examArchive) expect(messages[course.name]).toBeDefined();
  const displayName = (course: (typeof examArchive)[number]) => messages[course.name];
  const english = browseArchive({ location: [], query: "programming", displayName, locale: "en" });
  const indonesian = browseArchive({
    location: [],
    query: "pemrograman",
    displayName,
    locale: "en",
  });
  expect(english.entries.length).toBeGreaterThan(0);
  expect(indonesian.entries.length).toBeGreaterThan(0);
});

test("request instances retain their own language and resource namespaces", () => {
  const id = createI18n({
    language: "id",
    namespace: "resources",
    messages: { example: "Contoh" },
    common: { control: "Kontrol" },
  });
  expect(instance.language).toBe("en");
  expect(id.language).toBe("id");
  expect(instance.hasResourceBundle("id", "resources")).toBe(false);
});

test("literal UI translation keys exist in their page or shared namespace", async () => {
  const namespaces = new Map<string, Record<string, string>>([["common", common]]);
  for (const namespace of ["roadmap", "exam", "resources", "alumni"] as const) {
    namespaces.set(namespace, await loadMessages("en", namespace));
  }
  for (const file of new Bun.Glob("**/*.{ts,tsx}").scanSync({ cwd: import.meta.dir })) {
    if (file.includes(".test") || file.endsWith(".gen.ts")) continue;
    const namespace =
      file.match(/features\/([^/]+)/)?.[1]?.replace("exam-archive", "exam") ?? "common";
    const messages = namespaces.get(namespace) ?? common;
    const source = await Bun.file(`${import.meta.dir}/${file}`).text();
    for (const match of source.matchAll(/\btext\(\s*("(?:\\.|[^"\\])*")/g)) {
      const key: string = JSON.parse(match[1]);
      expect(
        messages[key] ?? common[key] ?? messages[`${key}_other`] ?? common[`${key}_other`],
        `${file}: ${key}`,
      ).toBeDefined();
    }
  }
});

test("namespace selection follows case-insensitive routes and trailing slashes", () => {
  for (const namespace of ["roadmap", "exam", "resources", "alumni"] as const) {
    expect(messageNamespace(`/${namespace}`)).toBe(namespace);
    expect(messageNamespace(`/${namespace.toUpperCase()}/`)).toBe(namespace);
  }
  expect(messageNamespace("/")).toBe("common");
  expect(messageNamespace("/missing-route")).toBe("common");
});
