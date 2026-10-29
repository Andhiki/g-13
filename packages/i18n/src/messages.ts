import type { Language } from "./index";

export type MessageNamespace = "common" | "roadmap" | "exam" | "resources" | "alumni";
export type Messages = Record<string, string>;

const loaders = {
  id: {
    common: () => import("./locales/id/common.json").then((module) => module.default),
    roadmap: () => import("./locales/id/roadmap.json").then((module) => module.default),
    exam: () => import("./locales/id/exam.json").then((module) => module.default),
    resources: () => import("./locales/id/resources.json").then((module) => module.default),
    alumni: () => import("./locales/id/alumni.json").then((module) => module.default),
  },
  en: {
    common: () => import("./locales/en/common.json").then((module) => module.default),
    roadmap: () => import("./locales/en/roadmap.json").then((module) => module.default),
    exam: () => import("./locales/en/exam.json").then((module) => module.default),
    resources: () => import("./locales/en/resources.json").then((module) => module.default),
    alumni: () => import("./locales/en/alumni.json").then((module) => module.default),
  },
};

const messages = new Map<string, Promise<Messages>>();

export function loadMessages(language: Language, namespace: MessageNamespace): Promise<Messages> {
  const key = `${language}:${namespace}`;
  let pending = messages.get(key);
  if (!pending) {
    pending = loaders[language][namespace]().catch((error: unknown) => {
      messages.delete(key);
      throw error;
    });
    messages.set(key, pending);
  }
  return pending;
}
