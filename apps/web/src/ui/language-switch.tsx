import type { Language } from "@g13/i18n";
import { useTranslation } from "react-i18next";
import { AlignButton } from "./button";

export function LanguageSwitch() {
  const { i18n, t } = useTranslation();
  const language: Language = i18n.resolvedLanguage === "en" ? "en" : "id";
  const nextLanguage: Language = language === "id" ? "en" : "id";

  return (
    <AlignButton.Root
      variant="neutral"
      mode="stroke"
      className="h-10 min-w-10 px-2.5 text-xs font-semibold"
      aria-label={t("language.switchTo")}
      lang={nextLanguage}
      onClick={() => void i18n.changeLanguage(nextLanguage)}
    >
      {language.toUpperCase()}
    </AlignButton.Root>
  );
}
