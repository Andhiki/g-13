import { useEffect, useState } from "react";
import { RiSettings3Line } from "@remixicon/react";
import { useTranslation } from "react-i18next";
import { AlignButton } from "./button";
import { LanguageSwitch } from "./language-switch";
import { AlignLinkButton } from "./link-button";
import { AlignModal } from "./modal";
import { ThemeSwitch } from "./theme-switch";
import * as Switch from "./switch";
import { useCursorPreference } from "./cursor-preference";
import { Typography } from "./typography";

export function Settings() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { t } = useTranslation();
  const { cursor, setCursor } = useCursorPreference();

  return (
    <AlignModal.Root>
      <AlignModal.Trigger asChild>
        <AlignButton.Root
          variant="neutral"
          mode="stroke"
          className="size-10 p-2.5"
          aria-label={t("settings.title")}
          disabled={!mounted}
        >
          <RiSettings3Line aria-hidden="true" className="size-5" />
        </AlignButton.Root>
      </AlignModal.Trigger>
      <AlignModal.Content aria-describedby={undefined} className="max-w-[380px]">
        <div className="border-b border-stroke-soft-200 px-4 py-3 pr-12">
          <AlignModal.Title asChild>
            <Typography as="h2" variant="subtitle2">
              {t("settings.title")}
            </Typography>
          </AlignModal.Title>
        </div>
        <div className="space-y-3 px-4 py-3">
          <section aria-labelledby="settings-appearance" className="space-y-1">
            <Typography
              as="h3"
              id="settings-appearance"
              variant="labelSmall"
              className="text-text-sub-600"
            >
              {t("settings.appearance")}
            </Typography>
            <div className="flex items-center justify-between gap-4">
              <Typography variant="label">{t("settings.language")}</Typography>
              <LanguageSwitch />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Typography variant="label">{t("settings.theme")}</Typography>
              <ThemeSwitch />
            </div>
          </section>
          <section aria-labelledby="settings-behaviour" className="space-y-1">
            <Typography
              as="h3"
              id="settings-behaviour"
              variant="labelSmall"
              className="text-text-sub-600"
            >
              {t("settings.behaviour")}
            </Typography>
            <div className="flex min-h-7 items-center justify-between gap-4">
              <Typography as="label" htmlFor="pointer-cursor" variant="label">
                {t("settings.pointerCursor")}
              </Typography>
              <Switch.Root
                id="pointer-cursor"
                checked={cursor === "pointer"}
                onCheckedChange={(checked) => setCursor(checked ? "pointer" : "default")}
              />
            </div>
          </section>
        </div>
        <div className="border-t border-stroke-soft-200 px-4 py-3">
          <AlignLinkButton.Root
            asChild
            variant="gray"
            size="small"
            underline
            className="h-auto whitespace-normal text-left"
          >
            <a href="https://github.com/Andhiki/g-13" target="_blank" rel="noopener noreferrer">
              <Typography as="span" variant="caption">
                {t("settings.contributeLink")}
              </Typography>
            </a>
          </AlignLinkButton.Root>
        </div>
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
