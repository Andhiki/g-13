import { creditsFor } from "../curriculum/course-utils";
import type { PlannedCourse } from "./planner";
import type { RoadmapSearch } from "./search";
import type { Relation } from "../../data";

export const planningLimit = 24;

export function scheduleCourses(
  courses: PlannedCourse[],
  relations: Relation[],
  answers: RoadmapSearch,
  blocked: Set<number>,
) {
  const is26 = answers.kurikulum !== "2021";
  const endIds = is26 ? ["PACS262701", "PACS262702"] : ["MII21-4003", "MII21-4002"];
  const proposalId = is26 ? "PACS262611" : "MII21-4001";
  const internshipSemester = answers.paparan === "internship" ? answers.semesterPaparan : 6;
  for (const item of courses) {
    if (item.course.id === "PACS262412" && answers.paparan !== "double") item.semester = 5;
    if (endIds.includes(item.course.id)) item.semester = answers.lulus;
    if (item.course.id === proposalId && is26) item.semester = answers.lulus - 1;
    if (item.kind === "internship" || item.course.id === "PACS262605")
      item.semester = answers.magang === "ya" ? internshipSemester : 6;
    if (
      item.kind === "required" &&
      !endIds.includes(item.course.id) &&
      !(item.course.id === "PACS262605" && answers.magang === "ya")
    ) {
      while (blocked.has(item.semester)) item.semester++;
    }
  }
  const fixedSixthTermCredits = courses
    .filter((x) => x.semester === 6 && (x.kind === "required" || x.kind === "internship"))
    .reduce((sum, x) => sum + (creditsFor(x.course) ?? 0), 0);
  if (is26 && fixedSixthTermCredits > planningLimit) {
    const kknIds = ["UNKU260014", "UNKU260015", "UNKU260011", "UNKU260016"];
    for (const item of courses.filter((x) => kknIds.includes(x.course.id) && x.semester === 6)) {
      item.semester = 7;
      while (blocked.has(item.semester)) item.semester++;
    }
  }
  const placed = courses.filter((x) => x.kind === "required" || x.kind === "internship");
  const load = (term: number) =>
    placed
      .filter((x) => x.semester === term)
      .reduce((sum, x) => sum + (creditsFor(x.course) ?? 0), 0);
  // shortcut: source guidance and resolved course links only; use an academic rules engine when complete offering and equivalency data exist.
  for (const item of courses.filter((x) => x.kind === "interest" || x.kind === "elective")) {
    const prereqs = relations
      .filter((r) => r.target === item.course.id)
      .map((r) => courses.find((x) => x.course.id === r.source))
      .filter((x) => x !== undefined);
    let term = item.semester;
    while (
      term < 14 &&
      (blocked.has(term) ||
        load(term) + (creditsFor(item.course) ?? 0) > planningLimit ||
        prereqs.some((x) => x.semester >= term))
    )
      term += is26 ? 1 : 2;
    item.semester = term;
    placed.push(item);
  }
  const proposal = courses.find((x) => x.course.id === proposalId);
  if (proposal && is26) {
    const requirements = courses.filter(
      (x) =>
        (x.kind === "required" || x.kind === "interest") &&
        !endIds.includes(x.course.id) &&
        x !== proposal,
    );
    proposal.semester = Math.max(proposal.semester, ...requirements.map((x) => x.semester));
    while (blocked.has(proposal.semester)) proposal.semester++;
    for (const item of courses.filter((x) => endIds.includes(x.course.id)))
      item.semester = Math.max(item.semester, proposal.semester + 1);
  }
  for (const item of courses.filter((x) => endIds.includes(x.course.id))) {
    while (blocked.has(item.semester)) item.semester++;
  }
}
