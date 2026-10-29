import type { Language } from "@g13/i18n";
import { defaultCurriculumId } from "@g13/curriculum";
import { buildRoadmap, type Roadmap } from "./planner";
import type { RoadmapSearch } from "./search";

const plans = new Map<string, Roadmap>();

export function getRoadmap(
  answers: RoadmapSearch,
  language: Language,
  localize: Parameters<typeof buildRoadmap>[1],
) {
  const key = JSON.stringify([
    language,
    answers.kurikulum ?? defaultCurriculumId,
    answers.minat,
    answers.iup,
    answers.paparan,
    answers.magang,
    answers.durasi,
    answers.lulus,
    answers.semesterPaparan,
    Object.entries(answers.ganti ?? {}).sort(([a], [b]) => a.localeCompare(b)),
  ]);
  let plan = plans.get(key);
  if (!plan) {
    plan = buildRoadmap(answers, localize);
    plans.set(key, plan);
  }
  return plan;
}
