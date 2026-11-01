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
  const [blur, setBlur] = useState(true);
  useEffect(() => {
    setBlur(!document.documentElement.hasAttribute("data-no-blur"));
  }, []);

  function changeBlur(enabled: boolean) {
    setBlur(enabled);
    document.documentElement.toggleAttribute("data-no-blur", !enabled);
    try {
      localStorage.setItem("g13-blur", enabled ? "on" : "off");
    } catch {
      // The preference still applies for this session.
    }
  }

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
      <AlignModal.Content
        aria-describedby={undefined}
        className="flex max-w-[640px] max-h-[calc(100dvh-2rem)] flex-col overflow-hidden"
      >
        <div className="shrink-0 border-b border-stroke-soft-200 px-5 py-4 pr-14">
          <AlignModal.Title asChild>
            <Typography as="h2" variant="subtitle1">
              {t("settings.title")}
            </Typography>
          </AlignModal.Title>
        </div>
        <div className="min-h-0 space-y-6 overflow-y-auto px-5 py-5">
          <section
            aria-labelledby="settings-language"
            className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
          >
            <Typography as="h3" id="settings-language" variant="label" className="font-semibold">
              {t("settings.language")}
            </Typography>
            <LanguageSwitch />
          </section>
          <section
            aria-labelledby="settings-appearance"
            className="space-y-4 border-t border-stroke-soft-200 pt-6"
          >
            <Typography as="h3" id="settings-appearance" variant="label" className="font-semibold">
              {t("settings.appearance")}
            </Typography>
            <ThemeSwitch />
            <div className="flex min-h-11 items-center justify-between gap-4">
              <Typography as="label" htmlFor="backdrop-blur" variant="label">
                {t("settings.blur")}
              </Typography>
              <Switch.Root id="backdrop-blur" checked={blur} onCheckedChange={changeBlur} />
            </div>
          </section>

          <section
            aria-labelledby="settings-behaviour"
            className="space-y-3 border-t border-stroke-soft-200 pt-6"
          >
            <Typography as="h3" id="settings-behaviour" variant="label" className="font-semibold">
              {t("settings.behaviour")}
            </Typography>
            <div className="flex min-h-11 items-center justify-between gap-4">
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
        <div className="flex shrink-0 items-center border-t border-stroke-soft-200 px-5 py-3">
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
