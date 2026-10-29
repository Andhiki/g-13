import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import type { Language } from "@g13/i18n";
import { loadMessages } from "@g13/i18n/messages";
import { useTranslation } from "react-i18next";
import { messageNamespace } from "../i18n";
import { AlignButton } from "./button";
import { toast } from "./toast";

export function LanguageSwitch() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const [pending, setPending] = useState(false);
  const language: Language = i18n.resolvedLanguage === "en" ? "en" : "id";
  const nextLanguage: Language = language === "id" ? "en" : "id";

  async function changeLanguage() {
    const pathname = router.state.location.pathname;
    setPending(true);
    try {
      await Promise.all([
        loadMessages(nextLanguage, "common"),
        loadMessages(nextLanguage, messageNamespace(pathname)),
      ]);
      if (router.state.location.pathname !== pathname) return;
      router.update({ context: { ...router.options.context, language: nextLanguage } });
      try {
        document.cookie = `g13-language=${nextLanguage}; Path=/; Max-Age=31536000; SameSite=Lax`;
      } catch {
        // The router retains the selection when cookies cannot be persisted.
      }
      await router.invalidate();
    } catch {
      toast.error(t("language.loadFailed"), {
        action: { label: t("language.reload"), onClick: () => window.location.reload() },
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <AlignButton.Root
      variant="neutral"
      mode="stroke"
      className="h-10 min-w-10 px-2.5 text-xs font-semibold"
      aria-label={t("language.switchTo")}
      lang={language}
      disabled={pending}
      aria-busy={pending}
      onClick={() => void changeLanguage()}
    >
      {language.toUpperCase()}
    </AlignButton.Root>
  );
}
