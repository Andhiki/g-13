import { createI18n } from "../../i18n";
import { loadMessages } from "@g13/i18n/messages";
import { courseTitle } from "@g13/i18n";
import { buildRoadmap as planRoadmap } from "./planner";

const instance = createI18n({
  language: "id",
  namespace: "roadmap",
  messages: await loadMessages("id", "roadmap"),
  common: await loadMessages("id", "common"),
});
export const buildRoadmap = (answers: Parameters<typeof planRoadmap>[0]) =>
  planRoadmap(answers, {
    text: (key, values) =>
      instance.t(key, { ...values, ns: "roadmap", keySeparator: false, defaultValue: key }),
    courseName: (course) => courseTitle(course, "id"),
  });
