import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { courseTitle, type Language } from "@g13/i18n";
import type { MessageNamespace } from "@g13/i18n/messages";
import type { Course } from "@g13/curriculum";

export function useLocale(namespace: MessageNamespace = "common") {
  const { t, i18n } = useTranslation(namespace);
  const language: Language = i18n.resolvedLanguage === "en" ? "en" : "id";
  const text = useCallback(
    (key: string, values: Record<string, unknown> = {}): string =>
      t(key, { ...values, keySeparator: false, defaultValue: key }),
    [t],
  );
  const courseName = useCallback((course: Course) => courseTitle(course, language), [language]);
  return { text, language, courseName };
}
