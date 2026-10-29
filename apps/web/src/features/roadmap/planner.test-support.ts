import { createI18n } from "../../i18n";
import { loadMessages } from "@g13/i18n/messages";
import { courseTitle } from "@g13/i18n";
import { planningInput } from "./planning-input";
import { formatConflict } from "./conflict-format";
import type { RoadmapSearch } from "./search";
import { buildRoadmap as planRoadmap } from "./planner";

const instance = createI18n({
  language: "id",
  namespace: "roadmap",
  messages: await loadMessages("id", "roadmap"),
  common: await loadMessages("id", "common"),
});
export function buildRoadmap(answers: RoadmapSearch) {
  const input = planningInput(answers);
  if (!input) throw new Error("Incomplete planning fixture");
  return planRoadmap(input);
}

export function conflictMessages(plan: ReturnType<typeof planRoadmap>) {
  return plan.conflicts.map((conflict) =>
    formatConflict(conflict, {
      text: (key, values) =>
        instance.t(key, { ...values, ns: "roadmap", keySeparator: false, defaultValue: key }),
      courseName: (course) => courseTitle(course, "id"),
    }),
  );
}
