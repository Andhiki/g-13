import { useEffect, useState } from "react";
import { RiSettings3Line } from "@remixicon/react";
import { useTranslation } from "react-i18next";
import { AlignButton } from "./button";
import { LanguageSwitch } from "./language-switch";
import { AlignLinkButton } from "./link-button";
import { AlignModal } from "./modal";
import { ThemeSwitch } from "./theme-switch";
import * as SegmentedControl from "./segmented-control";
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
      <AlignModal.Content aria-describedby={undefined}>
        <div className="border-b border-stroke-soft-200 p-5 pr-12">
          <AlignModal.Title asChild>
            <Typography as="h2" variant="subtitle1">
              {t("settings.title")}
            </Typography>
          </AlignModal.Title>
        </div>
        <div className="space-y-6 p-5">
          <div className="space-y-3">
            <Typography variant="label">{t("settings.language")}</Typography>
            <LanguageSwitch />
          </div>
          <div className="space-y-3">
            <Typography variant="label">{t("settings.theme")}</Typography>
            <ThemeSwitch />
          </div>
          <div className="space-y-3">
            <Typography variant="label">{t("settings.behaviour")}</Typography>
            <SegmentedControl.Root
              value={cursor}
              onValueChange={(value) => {
                if (value === "default" || value === "pointer") setCursor(value);
              }}
            >
              <SegmentedControl.List aria-label={t("settings.cursor")}>
                <SegmentedControl.Trigger
                  value="default"
                  className="focus-visible:ring-2 focus-visible:ring-primary-base"
                >
                  {t("settings.normalCursor")}
                </SegmentedControl.Trigger>
                <SegmentedControl.Trigger
                  value="pointer"
                  className="focus-visible:ring-2 focus-visible:ring-primary-base"
                >
                  {t("settings.pointerCursor")}
                </SegmentedControl.Trigger>
              </SegmentedControl.List>
            </SegmentedControl.Root>
          </div>
        </div>
        <div className="space-y-1 border-t border-stroke-soft-200 p-5">
          <Typography variant="paragraph" className="text-text-sub-600">
            {t("settings.contribute")}
          </Typography>
          <AlignLinkButton.Root asChild variant="primary" underline>
            <a href="https://github.com/Andhiki/g-13" target="_blank" rel="noopener noreferrer">
              {t("settings.contributeLink")}
            </a>
          </AlignLinkButton.Root>
        </div>
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
