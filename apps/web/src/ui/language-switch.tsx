import { useRouter } from "@tanstack/react-router";
import type { Language } from "@g13/i18n";
import { useTranslation } from "react-i18next";
import { AlignButton } from "./button";

export function LanguageSwitch() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const language: Language = i18n.resolvedLanguage === "en" ? "en" : "id";
  const nextLanguage: Language = language === "id" ? "en" : "id";

  return (
    <AlignButton.Root
      variant="neutral"
      mode="stroke"
      className="h-10 min-w-10 px-2.5 text-xs font-semibold"
      aria-label={t("language.switchTo")}
      lang={language}
      onClick={() => {
        document.cookie = `g13-language=${nextLanguage}; Path=/; Max-Age=31536000; SameSite=Lax`;
        void router.invalidate();
      }}
    >
      {language.toUpperCase()}
    </AlignButton.Root>
  );
}
