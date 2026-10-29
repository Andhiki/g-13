import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import type { Language } from "@g13/i18n";
import { loadMessages } from "@g13/i18n/messages";
import { useTranslation } from "react-i18next";
import { messageNamespace } from "../i18n";
import * as SegmentedControl from "./segmented-control";
import { toast } from "./toast";

export function LanguageSwitch() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const [pending, setPending] = useState(false);
  const language: Language = i18n.resolvedLanguage === "en" ? "en" : "id";

  async function changeLanguage(nextLanguage: Language) {
    if (nextLanguage === language) return;
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
    <SegmentedControl.Root
      activationMode="manual"
      value={language}
      onValueChange={(value) => {
        if (value === "id" || value === "en") void changeLanguage(value);
      }}
    >
      <SegmentedControl.List aria-label={t("settings.language")} aria-busy={pending}>
        <SegmentedControl.Trigger
          value="id"
          lang="id"
          disabled={pending}
          className="focus-visible:ring-2 focus-visible:ring-primary-base"
        >
          Bahasa Indonesia
        </SegmentedControl.Trigger>
        <SegmentedControl.Trigger
          value="en"
          lang="en"
          disabled={pending}
          className="focus-visible:ring-2 focus-visible:ring-primary-base"
        >
          English
        </SegmentedControl.Trigger>
      </SegmentedControl.List>
    </SegmentedControl.Root>
  );
}
