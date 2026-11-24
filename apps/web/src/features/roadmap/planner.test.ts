import { expect, test } from "bun:test";
import { buildRoadmap, conflictMessages } from "./planner.test-support";
import { validateRoadmapSearch } from "./search";

const baseline = { kurikulum: "2026", minat: "Analisis Data", iup: "tidak", magang: "tidak" };

test("a new 2026 student gets every required course once, selected wajib minat, and enough electives", () => {
  const plan = buildRoadmap(validateRoadmapSearch(baseline));
  expect(plan.requiredCredits).toBe(109);
  expect(
    plan.courses
      .filter((x) => x.kind === "interest")
      .map((x) => x.course.id)
      .sort(),
  ).toEqual(["PACS262419", "PACS262504", "PACS262526"]);
  expect(plan.totalCredits).toBeGreaterThanOrEqual(144);
  expect(new Set(plan.courses.map((x) => x.course.id)).size).toBe(plan.courses.length);
  expect(plan.courses.find((x) => x.course.id === "PACS262605")?.semester).toBe(6);
});

test("2021 uses one neutral religion choice, replaces slots, and counts 104 required SKS", () => {
  const plan = buildRoadmap(
    validateRoadmapSearch({
      ...baseline,
      kurikulum: "2021",
      minat: "Lab Rekayasa Perangkat Lunak dan Data",
    }),
  );
  expect(plan.requiredCredits).toBe(104);
  expect(
    plan.courses.filter((x) => /Agama/.test(x.course.title)).map((x) => x.course.title),
  ).toEqual(["Agama"]);
  expect(plan.courses.some((x) => x.course.id.startsWith("2021-slot"))).toBe(false);
  expect(plan.courses.some((x) => x.course.id === "PACS262605")).toBe(false);
  expect(plan.courses.filter((x) => x.course.id === "MII21-4002")).toHaveLength(1);
  expect(plan.totalCredits).toBeGreaterThanOrEqual(144);
});

test("the eight-semester scenario finishes the thesis in semester eight, not seven", () => {
  const plan = buildRoadmap(validateRoadmapSearch(baseline));
  expect(plan.courses.find((x) => x.course.id === "PACS262702")?.semester).toBe(8);
});

for (const [tier, code, credits] of [
  ["pendek", "PACS262608", 4],
  ["menengah", "PACS262606", 8],
  ["panjang", "PACS262607", 12],
  ["penuh", "PACS262609", 16],
] as const)
  test(`2026 ${tier} Magang counts one tier with Kerja Praktik in the same semester`, () => {
    const plan = buildRoadmap(validateRoadmapSearch({ ...baseline, magang: "ya", durasi: tier }));
    const internship = plan.courses.find((x) => x.course.id === code)!;
    expect(internship.course.placements[0].credits).toBe(credits);
    expect(plan.courses.filter((x) => x.kind === "internship")).toHaveLength(1);
    expect(plan.courses.find((x) => x.course.id === "PACS262605")?.semester).toBe(
      internship.semester,
    );
    expect(plan.totalCredits).toBeGreaterThanOrEqual(144);
  });

test("2021 internship recommendations replace elective credits without inventing courses", () => {
  const plan = buildRoadmap(
    validateRoadmapSearch({
      ...baseline,
      kurikulum: "2021",
      minat: "Lab Sistem Cerdas",
      magang: "ya",
      durasi: "semester",
    }),
  );
  expect(plan.courses.filter((x) => x.kind === "internship")).toHaveLength(0);
  expect(plan.activities.find((x) => x.id === "internship")?.fullSemester).toBe(true);
  expect(plan.activities.find((x) => x.id === "internship")?.recommendedCredits).toBe(20);
  expect(plan.totalCredits).toBeGreaterThanOrEqual(144);
  const without = buildRoadmap(
    validateRoadmapSearch({ ...baseline, kurikulum: "2021", minat: "Lab Sistem Cerdas" }),
  );
  expect(plan.courses.filter((x) => x.kind === "elective").length).toBeLessThan(
    without.courses.filter((x) => x.kind === "elective").length,
  );
});

for (const durasi of ["singkat", "semester"]) {
  test(`2021 ${durasi} internship recommendation is counted once for international exposure`, () => {
    const plan = buildRoadmap(
      validateRoadmapSearch({
        ...baseline,
        kurikulum: "2021",
        minat: "Lab Sistem Cerdas",
        magang: "ya",
        durasi,
        iup: "ya",
        paparan: "internship",
        semesterPaparan: 7,
      }),
    );
    expect(plan.activities).toHaveLength(1);
    expect(plan.activities[0].recommendedCredits).toBe(20);
    expect(plan.activities[0].semester).toBe(7);
    expect(plan.totalCredits).toBeGreaterThanOrEqual(144);
  });
}

for (const semesterPaparan of [6, 7])
  test(`international internship in semester ${semesterPaparan} is one activity and one credit award`, () => {
    const plan = buildRoadmap(
      validateRoadmapSearch({
        ...baseline,
        iup: "ya",
        paparan: "internship",
        semesterPaparan,
        magang: "ya",
        durasi: "penuh",
      }),
    );
    expect(plan.activities).toHaveLength(1);
    expect(plan.activities[0].semester).toBe(semesterPaparan);
    expect(plan.courses.find((x) => x.kind === "internship")?.semester).toBe(semesterPaparan);
    expect(plan.courses.find((x) => x.course.id === "PACS262605")?.semester).toBe(semesterPaparan);
  });

test("short exposure does not reserve a semester; an undecided exposure stays unresolved", () => {
  const short = buildRoadmap(validateRoadmapSearch({ ...baseline, iup: "ya", paparan: "course" }));
  expect(short.activities[0].fullSemester).toBe(false);
  expect(short.courses.find((x) => x.course.id === "PACS262605")?.semester).toBe(6);
  const undecided = buildRoadmap(
    validateRoadmapSearch({ ...baseline, iup: "ya", paparan: "undecided" }),
  );
  expect(conflictMessages(undecided)).toContain("International exposure IUP belum ditentukan.");
});

test("double degree can omit 2026 minat and never pretends a host plan is verified", () => {
  const plan = buildRoadmap(
    validateRoadmapSearch({ ...baseline, iup: "ya", paparan: "double", minat: "tanpa-minat" }),
  );
  expect(plan.courses.filter((x) => x.kind === "interest")).toHaveLength(0);
  expect(conflictMessages(plan).join(" ")).toContain("kampus mitra");
  expect(plan.activities[0].fullSemester).toBe(true);
});

test("a blocked seven-semester scenario keeps work after the target visible", () => {
  const plan = buildRoadmap(
    validateRoadmapSearch({
      ...baseline,
      lulus: 7,
      iup: "ya",
      paparan: "exchange",
      semesterPaparan: 7,
    }),
  );
  expect(plan.courses.some((x) => x.semester > 7)).toBe(true);
  expect(conflictMessages(plan).join(" ")).toContain("setelah semester 7");
});

test("the regular 2026 plan fits eight semesters while preserving source prerequisite ambiguities", () => {
  const plan = buildRoadmap(validateRoadmapSearch(baseline));
  expect(conflictMessages(plan).some((text) => text.includes("belum ada dalam rencana"))).toBe(
    false,
  );
  expect(
    conflictMessages(plan).some(
      (text) => text.includes("Praktikum Pemrograman") && text.includes("Pemrograman"),
    ),
  ).toBe(true);
  expect(plan.courses.every((x) => x.semester <= 8)).toBe(true);
});

test("unstarred same-semester prerequisites on required courses remain visible as source conflicts", () => {
  const plan = buildRoadmap(
    validateRoadmapSearch({
      ...baseline,
      kurikulum: "2021",
      minat: "Lab Rekayasa Perangkat Lunak dan Data",
    }),
  );
  expect(
    conflictMessages(plan).some(
      (text) => text.includes("Sistem Digital") && text.includes("Algoritma dan Struktur Data"),
    ),
  ).toBe(true);
});

test("a long 2026 internship moves the KKN group to its alternative semester before reporting overload", () => {
  const plan = buildRoadmap(
    validateRoadmapSearch({ ...baseline, magang: "ya", durasi: "panjang", lulus: 8 }),
  );
  expect(plan.courses.find((x) => x.course.id === "UNKU260014")?.semester).toBe(7);
  expect(conflictMessages(plan).some((text) => text.includes("melebihi batas"))).toBe(false);
});

test("both graduation targets retain unique required courses for every minat and exposure semester", async () => {
  const { interests } = await import("./options");
  for (const kurikulum of ["2021", "2026"] as const)
    for (const minat of interests(kurikulum))
      for (const lulus of [7, 8])
        for (const semesterPaparan of [6, 7]) {
          const plan = buildRoadmap(
            validateRoadmapSearch({
              kurikulum,
              minat: minat.value,
              lulus,
              semesterPaparan,
              iup: "ya",
              paparan: "exchange",
              magang: "tidak",
            }),
          );
          expect(plan.requiredCredits).toBe(kurikulum === "2026" ? 109 : 104);
          expect(plan.totalCredits).toBeGreaterThanOrEqual(144);
          expect(new Set(plan.courses.map((x) => x.course.id)).size).toBe(plan.courses.length);
          expect(plan.courses.filter((x) => x.kind === "required")).toHaveLength(
            kurikulum === "2026" ? 46 : 44,
          );
        }
});

test("all curriculum and internship scenarios stay within eight semesters", () => {
  for (const kurikulum of ["2021", "2026"]) {
    for (const durasi of kurikulum === "2021"
      ? ["singkat", "semester"]
      : ["pendek", "menengah", "panjang", "penuh"]) {
      for (const lulus of [7, 8]) {
        const plan = buildRoadmap(
          validateRoadmapSearch({
            ...baseline,
            kurikulum,
            minat: kurikulum === "2021" ? "Lab Sistem Cerdas" : baseline.minat,
            magang: "ya",
            durasi,
            lulus,
          }),
        );
        expect(plan.courses.every((course) => course.semester <= 8)).toBe(true);
        expect(plan.activities.every((activity) => activity.endSemester <= 8)).toBe(true);
      }
    }
  }
});
