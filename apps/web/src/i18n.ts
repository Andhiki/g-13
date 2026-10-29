import LanguageDetector from "i18next-browser-languagedetector";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { i18nOptions } from "@g13/i18n";

void i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    ...i18nOptions,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "g13-language",
    },
  });

export default i18n;
