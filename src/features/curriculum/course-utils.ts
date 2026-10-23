import type { Course } from "../../data";

export function isCore(course: Course) {
  return course.placements.some((placement) => placement.section === "core");
}

export function coreSemesters(course: Course) {
  return [
    ...new Set(
      course.placements
        .filter((placement) => placement.section === "core")
        .map((placement) => placement.semester)
        .filter((value): value is number => value !== null),
    ),
  ].sort((a, b) => a - b);
}

export function assignedCoreSemester(course: Course) {
  return coreSemesters(course)[0] ?? null;
}

export function creditsFor(course: Course) {
  return course.placements.find((placement) => placement.credits !== null)?.credits ?? null;
}

export function courseLabels(course: Course) {
  return [...new Set(course.placements.map((placement) => placement.label).filter(Boolean))];
}

export function semesterLabel(course: Course) {
  const terms = [
    ...new Set(course.placements.map((placement) => placement.semesterLabel).filter(Boolean)),
  ];
  return terms.length ? "Semester " + terms.join(" / ") : "Semester tidak dinyatakan";
}

export function requirementText(course: Course) {
  return [
    ...new Set(
      course.placements
        .map((placement) => placement.prerequisiteRaw)
        .filter((item) => item && item !== "-"),
    ),
  ];
}

export function sourceLocation(course: Course) {
  const locations = new Set<string>();
  for (const placement of course.placements) {
    if (placement.printedPage && placement.pdfPage)
      locations.add("Cetak hlm. " + placement.printedPage + " · PDF hlm. " + placement.pdfPage);
    else if (placement.printedPage) locations.add("Cetak hlm. " + placement.printedPage);
    else if (placement.pdfPage) locations.add("PDF hlm. " + placement.pdfPage);
  }
  return [...locations];
}

export function matches(course: Course, query: string) {
  const text = [
    course.title,
    course.englishTitle,
    course.code,
    ...course.placements.map((item) => item.group),
    ...course.placements.map((item) => item.prerequisiteRaw),
  ]
    .join(" ")
    .toLocaleLowerCase("id");
  return text.includes(query.trim().toLocaleLowerCase("id"));
}
