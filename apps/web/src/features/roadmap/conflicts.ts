import { getAcademicRules, getCurriculum } from "@g13/curriculum";
import { creditsFor } from "../../courses/course-utils";
import { planningLimit } from "./schedule";
import type { Course } from "@g13/curriculum";
import type { Roadmap } from "./planner";
import type { PlanningInput } from "./planning-input";

export type Conflict = { key: string; values: Record<string, string | number | Course | Course[]> };

export function findConflicts(plan: Roadmap, answers: PlanningInput, blocked: Set<number>) {
  const curriculum = getCurriculum(answers.kurikulum);
  const rules = getAcademicRules(curriculum.id).scheduling;
  const conflicts: Conflict[] = [];
  const message = (key: string, values: Conflict["values"] = {}): Conflict => ({ key, values });
  const after = plan.courses.filter((x) => x.semester > answers.lulus);
  if (after.length)
    conflicts.push(
      message("{{v0}} mata kuliah masih berada setelah semester {{v1}}: {{v2}}.", {
        v0: after.length,
        v1: answers.lulus,
        v2: after.map((x) => x.course),
      }),
    );
  if (plan.totalCredits < curriculum.totalCredits)
    conflicts.push(
      message("Total masih kurang {{v0}} SKS dari minimum {{v1}} SKS.", {
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
        message("Semester {{v0}} memuat {{v1}} SKS, melebihi batas perencanaan {{v2}} SKS.", {
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
        message(
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
        message(
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
        message("Prasyarat {{v0}} untuk {{v1}} belum ada dalam rencana.", {
          v0: relation.source,
          v1: target.course,
        }),
      );
      continue;
    }
    const concurrent = relation.timing === "concurrent";
    if (source.semester > target.semester || (source.semester === target.semester && !concurrent))
      conflicts.push(
        message("{{v0}}: periksa urutan prasyarat {{v1}} pada semester {{v2}}.", {
          v0: target.course,
          v1: source.course,
          v2: source.semester,
        }),
      );
  }
  if (answers.exposure.kind === "undecided")
    conflicts.push(message("International exposure IUP belum ditentukan."));
  if (answers.exposure.kind === "double")
    conflicts.push(
      message(
        "Target kelulusan double degree belum dapat dinilai tanpa durasi dan penyetaraan kampus mitra.",
      ),
    );
  if (
    answers.exposure.kind === "exchange" &&
    answers.internship.kind !== "none" &&
    answers.semesterPaparan === 6
  )
    conflicts.push(
      message(
        "Pertukaran mahasiswa dan Magang sama-sama direncanakan di semester 6. Pindahkan exposure atau konfirmasikan jadwal kegiatan.",
      ),
    );
  return [...new Map(conflicts.map((conflict) => [JSON.stringify(conflict), conflict])).values()];
}
