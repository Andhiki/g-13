import { usePreference } from "@ui-sdk/react/preferences";
import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { useThemePreference, themeMode, type ThemeMode } from "./theme-preference";
import { Typography } from "./typography";
import { useTranslation } from "react-i18next";
import * as SegmentedControl from "./segmented-control";

export function ThemeSwitch() {
  const { t } = useTranslation();
  const mode = usePreference(themeMode);
  const { schemes, setScheme } = useThemePreference();

  return (
    <div className="space-y-5">
      <section aria-labelledby="settings-theme" className="flex items-center justify-between gap-4">
        <Typography as="h4" id="settings-theme" variant="label" color="strong">
          {t("settings.theme")}
        </Typography>
        <SegmentedControl.Root
          className="w-36 shrink-0"
          value={mode.value}
          onValueChange={(next) => {
            if (next === "system" || next === "light" || next === "dark") themeMode.set(next);
          }}
          aria-labelledby="settings-theme"
        >
          <SegmentedControl.Indicator />
          {(["system", "light", "dark"] as const).map((choice) => {
            const Icon =
              choice === "system" ? RiComputerLine : choice === "light" ? RiSunLine : RiMoonLine;
            return (
              <SegmentedControl.Item
                key={choice}
                value={choice}
                aria-label={t(`settings.${choice}`)}
                title={t(`settings.${choice}`)}
                className="focus-visible:ring-2 focus-visible:ring-primary-base"
              >
                <Icon className="size-4" aria-hidden="true" />
              </SegmentedControl.Item>
            );
          })}
        </SegmentedControl.Root>
      </section>
      <section aria-labelledby="settings-color-scheme" className="space-y-3">
        <Typography as="h4" id="settings-color-scheme" variant="label" color="strong">
          {t("settings.colorScheme")}
        </Typography>
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
          {(["light", "dark"] satisfies ThemeMode[]).map((mode) => (
            <div
              key={mode}
              className="rounded-[14px] border border-stroke-soft-200 p-3 hover:bg-bg-weak-25"
            >
              <Typography variant="label" className="mb-3">
                {t(`settings.${mode}`)}
              </Typography>
              <div className="flex justify-around gap-3">
                {(["omahti", "himakom"] as const).map((scheme) => {
                  const Icon = mode === "light" ? RiSunLine : RiMoonLine;
                  const selected = schemes[mode] === scheme;
                  return (
                    <div key={scheme} className="flex flex-col items-center gap-3 py-2">
                      <button
                        type="button"
                        className="relative aspect-square w-[clamp(44px,8vw,56px)] rounded-full bg-[radial-gradient(circle_at_65%_25%,#f3c7a4,transparent_65%),linear-gradient(#fafafa,#fafafa)] shadow-[inset_0_0_0_1px_#00000010,inset_0_-3px_8px_#00000015,0_2px_4px_#00000010] data-[mode=dark]:bg-[radial-gradient(circle_at_65%_25%,#a15b32,transparent_70%),linear-gradient(#171717,#171717)] data-[scheme=himakom]:bg-[radial-gradient(circle_at_65%_25%,#8b73e5,transparent_65%),linear-gradient(#f5f3fc,#f5f3fc)] data-[scheme=himakom]:data-[mode=dark]:bg-[radial-gradient(circle_at_65%_25%,#7654dc,transparent_70%),linear-gradient(#191827,#191827)] aria-pressed:outline-2 aria-pressed:outline-offset-5 aria-pressed:outline-primary-base focus-visible:outline-3 focus-visible:outline-offset-5 focus-visible:outline-primary-base"
                        data-scheme={scheme}
                        data-mode={mode}
                        aria-label={`${scheme === "omahti" ? "OmahTI" : "HIMAKOM"} · ${t(`settings.${mode}`)}`}
                        title={`${scheme === "omahti" ? "OmahTI" : "HIMAKOM"} · ${t(`settings.${mode}`)}`}
                        aria-pressed={selected}
                        onClick={() => setScheme(mode, scheme)}
                      >
                        {selected && (
                          <span className="absolute -right-[5px] -bottom-[5px] grid size-7 place-items-center rounded-full border border-stroke-sub-300 bg-bg-white-0 text-text-strong-950">
                            <Icon className="size-4" aria-hidden="true" />
                          </span>
                        )}
                      </button>
                      <Typography as="span" variant="labelSmall">
                        {scheme === "omahti" ? "OmahTI" : "HIMAKOM"}
                      </Typography>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
