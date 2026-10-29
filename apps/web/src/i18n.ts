import { createInstance, type i18n } from "i18next";
import { initReactI18next } from "react-i18next";
import { i18nOptions, resources, type Language } from "@g13/i18n";
import type { MessageNamespace, Messages } from "@g13/i18n/messages";

export function createI18n({
  language,
  namespace,
  messages,
  common,
}: {
  language: Language;
  namespace: MessageNamespace;
  messages: Messages;
  common: Messages;
}): i18n {
  const instance = createInstance();
  instance.use(initReactI18next);
  void instance.init({
    ...i18nOptions,
    resources: { [language]: { ...resources[language], common, [namespace]: messages } },
    lng: language,
    initAsync: false,
  });
  return instance;
}

export function messageNamespace(pathname: string): MessageNamespace {
  switch (pathname.replace(/\/+$/, "").toLowerCase()) {
    case "/roadmap":
      return "roadmap";
    case "/exam":
      return "exam";
    case "/resources":
      return "resources";
    case "/alumni":
      return "alumni";
    default:
      return "common";
  }
}
