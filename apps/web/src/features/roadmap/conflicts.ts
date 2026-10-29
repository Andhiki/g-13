import { getAcademicRules, getCurriculum, defaultCurriculumId } from "@g13/curriculum";
import { creditsFor } from "../curriculum/course-utils";
import { planningLimit } from "./schedule";
import type { Course } from "@g13/curriculum";
import type { Roadmap } from "./planner";
import type { RoadmapSearch } from "./search";

export function findConflicts(
  plan: Roadmap,
  answers: RoadmapSearch,
  blocked: Set<number>,
  localize: {
    text: (key: string, values?: Record<string, unknown>) => string;
    courseName: (course: Course) => string;
  },
) {
  const curriculum = getCurriculum(answers.kurikulum ?? defaultCurriculumId);
  const rules = getAcademicRules(curriculum.id).scheduling;
  const conflicts: string[] = [];
  const after = plan.courses.filter((x) => x.semester > answers.lulus);
  if (after.length)
    conflicts.push(
      localize.text("{{v0}} mata kuliah masih berada setelah semester {{v1}}: {{v2}}.", {
        v0: after.length,
        v1: answers.lulus,
        v2: after.map((x) => localize.courseName(x.course)).join(", "),
      }),
    );
  if (plan.totalCredits < curriculum.totalCredits)
    conflicts.push(
      localize.text("Total masih kurang {{v0}} SKS dari minimum {{v1}} SKS.", {
        v0: curriculum.totalCredits - plan.totalCredits,
        v1: curriculum.totalCredits,
      }),
    );
  const semesters = new Set(plan.courses.map((x) => x.semester));
  for (const term of semesters) {
    const list = plan.courses.filter((x) => x.semester === term);
    const credits = list.reduce((sum, x) => sum + (creditsFor(x.course) ?? 0), 0);
    if (credits > planningLimit)
      conflicts.push(
        localize.text("Semester {{v0}} memuat {{v1}} SKS, melebihi batas perencanaan {{v2}} SKS.", {
          v0: term,
          v1: credits,
          v2: planningLimit,
        }),
      );
    const clashes = list.filter(
      (x) => x.kind !== "internship" && x.course.id !== rules.practicalWorkId,
    );
    if (blocked.has(term) && clashes.length)
      conflicts.push(
        localize.text(
          "Semester {{v0}} dicadangkan untuk kegiatan luar kampus, tetapi masih memuat {{v1}} mata kuliah UGM. Penyetaraan belum dikonfirmasi.",
          { v0: term, v1: clashes.length },
        ),
      );
    if (
      rules.communityService &&
      list.some((x) => x.course.id === rules.communityService?.courseId) &&
      list.filter((x) => !rules.communityService?.companionIds.includes(x.course.id)).length > 1
    )
      conflicts.push(
        localize.text(
          "Semester {{v0}}: jadwalkan KKN antar semester atau konfirmasikan batas kuliah bersamaan dengan KKN ke prodi.",
          { v0: term },
        ),
      );
  }
  for (const relation of plan.relations) {
    const source = plan.courses.find((x) => x.course.id === relation.source);
    const target = plan.courses.find((x) => x.course.id === relation.target);
    if (!target) continue;
    if (!source) {
      conflicts.push(
        localize.text("Prasyarat {{v0}} untuk {{v1}} belum ada dalam rencana.", {
          v0: relation.source,
          v1: localize.courseName(target.course),
        }),
      );
      continue;
    }
    const raw = target.course.placements.map((p) => p.prerequisiteRaw).join(" ");
    const concurrent =
      rules.starredPrerequisitesConcurrent &&
      raw.split(/[,;]+/).some(
        (token) =>
          token.includes("*") &&
          token.toLowerCase().includes(
            source.course.title
              .replace(/[\uF000-\uFFFF]/g, "")
              .trim()
              .toLowerCase(),
          ),
      );
    if (source.semester > target.semester || (source.semester === target.semester && !concurrent))
      conflicts.push(
        localize.text("{{v0}}: periksa urutan prasyarat {{v1}} pada semester {{v2}}.", {
          v0: localize.courseName(target.course),
          v1: localize.courseName(source.course),
          v2: source.semester,
        }),
      );
  }
  if (answers.iup === "ya" && answers.paparan === "undecided")
    conflicts.push(localize.text("International exposure IUP belum ditentukan."));
  if (answers.paparan === "double")
    conflicts.push(
      localize.text(
        "Target kelulusan double degree belum dapat dinilai tanpa durasi dan penyetaraan kampus mitra.",
      ),
    );
  if (answers.paparan === "exchange" && answers.magang === "ya" && answers.semesterPaparan === 6)
    conflicts.push(
      localize.text(
        "Pertukaran mahasiswa dan Magang sama-sama direncanakan di semester 6. Pindahkan exposure atau konfirmasikan jadwal kegiatan.",
      ),
    );
  return [...new Set(conflicts)];
}
