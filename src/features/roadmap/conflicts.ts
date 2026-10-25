import { creditsFor } from "../curriculum/course-utils";
import { planningLimit } from "./schedule";
import type { Roadmap } from "./planner";
import type { RoadmapSearch } from "./search";

export function findConflicts(plan: Roadmap, answers: RoadmapSearch, blocked: Set<number>) {
  const conflicts: string[] = [];
  const after = plan.courses.filter((x) => x.semester > answers.lulus);
  if (after.length)
    conflicts.push(
      `${after.length} mata kuliah masih berada setelah semester ${answers.lulus}: ${after.map((x) => x.course.title).join(", ")}.`,
    );
  if (plan.totalCredits < 144)
    conflicts.push(`Total masih kurang ${144 - plan.totalCredits} SKS dari minimum 144 SKS.`);
  const semesters = new Set(plan.courses.map((x) => x.semester));
  for (const term of semesters) {
    const list = plan.courses.filter((x) => x.semester === term);
    const credits = list.reduce((sum, x) => sum + (creditsFor(x.course) ?? 0), 0);
    if (credits > planningLimit)
      conflicts.push(
        `Semester ${term} memuat ${credits} SKS, melebihi batas perencanaan ${planningLimit} SKS.`,
      );
    const clashes = list.filter((x) => x.kind !== "internship" && x.course.id !== "PACS262605");
    if (blocked.has(term) && clashes.length)
      conflicts.push(
        `Semester ${term} dicadangkan untuk kegiatan luar kampus, tetapi masih memuat ${clashes.length} mata kuliah UGM. Penyetaraan belum dikonfirmasi.`,
      );
    if (
      answers.kurikulum === "2021" &&
      list.some((x) => x.course.id === "UNU22-2001") &&
      list.filter((x) => !["UNU22-2001", "UNU22-2002", "UNU22-2004"].includes(x.course.id)).length >
        1
    )
      conflicts.push(
        `Semester ${term}: jadwalkan KKN antar semester atau konfirmasikan batas kuliah bersamaan dengan KKN ke prodi.`,
      );
  }
  for (const relation of plan.relations) {
    const source = plan.courses.find((x) => x.course.id === relation.source);
    const target = plan.courses.find((x) => x.course.id === relation.target);
    if (!target) continue;
    if (!source) {
      conflicts.push(
        `Prasyarat ${relation.source} untuk ${target.course.title} belum ada dalam rencana.`,
      );
      continue;
    }
    const raw = target.course.placements.map((p) => p.prerequisiteRaw).join(" ");
    const concurrent =
      answers.kurikulum === "2021" &&
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
        `${target.course.title}: periksa urutan prasyarat ${source.course.title} pada semester ${source.semester}.`,
      );
  }
  if (answers.iup === "ya" && answers.paparan === "undecided")
    conflicts.push("International exposure IUP belum ditentukan.");
  if (answers.paparan === "double")
    conflicts.push(
      "Target kelulusan double degree belum dapat dinilai tanpa durasi dan penyetaraan kampus mitra.",
    );
  if (answers.paparan === "exchange" && answers.magang === "ya" && answers.semesterPaparan === 6)
    conflicts.push(
      "Pertukaran mahasiswa dan Magang sama-sama direncanakan di semester 6. Pindahkan exposure atau konfirmasikan jadwal kegiatan.",
    );
  return [...new Set(conflicts)];
}
