import { type ReactNode } from "react";
import { RiSettings3Line } from "@remixicon/react";
import { useTranslation } from "react-i18next";
import { usePreference } from "@ui-sdk/react/preferences";
import { AlignButton } from "./button";
import { LanguageSwitch } from "./language-switch";
import { AlignLinkButton } from "./link-button";
import { AlignModal } from "./modal";
import { ThemeSwitch } from "./theme-switch";
import * as Switch from "./switch";
import { useCursorPreference } from "./cursor-preference";
import { blurPreference } from "./theme-preference";
import { Typography } from "./typography";

function SettingsSwitchRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <Typography as="label" htmlFor={id} variant="label">
        {label}
      </Typography>
      <Switch.Root id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function SettingsBody() {
  const { t } = useTranslation();
  const { cursor, setCursor } = useCursorPreference();
  const { value: blur } = usePreference(blurPreference);

  return (
    <AlignModal.Body className="space-y-6">
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
        <SettingsSwitchRow
          id="backdrop-blur"
          label={t("settings.blur")}
          checked={blur === "on"}
          onCheckedChange={(checked) => blurPreference.set(checked ? "on" : "off")}
        />
      </section>
      <section
        aria-labelledby="settings-behaviour"
        className="space-y-3 border-t border-stroke-soft-200 pt-6"
      >
        <Typography as="h3" id="settings-behaviour" variant="label" className="font-semibold">
          {t("settings.behaviour")}
        </Typography>
        <SettingsSwitchRow
          id="pointer-cursor"
          label={t("settings.pointerCursor")}
          checked={cursor === "pointer"}
          onCheckedChange={(checked) => setCursor(checked ? "pointer" : "default")}
        />
      </section>
    </AlignModal.Body>
  );
}

function SettingsFooter() {
  const { t } = useTranslation();
  return (
    <AlignModal.Footer className="justify-start py-3">
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
    </AlignModal.Footer>
  );
}

export function SettingsModal({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <AlignModal.Root open={open} onOpenChange={onOpenChange}>
      {children}
      <AlignModal.Content aria-describedby={undefined} className="max-w-[640px]">
        <AlignModal.Header className="pr-14">
          <AlignModal.Title asChild>
            <Typography as="h2" variant="subtitle1">
              {t("settings.title")}
            </Typography>
          </AlignModal.Title>
        </AlignModal.Header>
        <SettingsBody />
        <SettingsFooter />
      </AlignModal.Content>
    </AlignModal.Root>
  );
}

export function Settings() {
  const { t } = useTranslation();

  return (
    <SettingsModal>
      <AlignModal.Trigger asChild>
        <AlignButton.Root
          variant="neutral"
          mode="stroke"
          className="size-10 p-2.5"
          aria-label={t("settings.title")}
        >
          <RiSettings3Line aria-hidden="true" className="size-5" />
        </AlignButton.Root>
      </AlignModal.Trigger>
    </SettingsModal>
  );
}
