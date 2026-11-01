import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { useThemePreference, type ThemeMode } from "./theme-preference";
import { Typography } from "./typography";
import { useTranslation } from "react-i18next";
import * as SegmentedControl from "./segmented-control";

export function ThemeSwitch() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { schemes, setScheme } = useThemePreference();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-5">
      <section aria-labelledby="settings-theme" className="flex items-center justify-between gap-4">
        <Typography as="h4" id="settings-theme" variant="label" className="text-text-strong-950">
          {t("settings.theme")}
        </Typography>
        <SegmentedControl.Root
          className="w-36 shrink-0"
          activationMode="manual"
          value={mounted ? (theme ?? "system") : "system"}
          onValueChange={(mode) => {
            if (mode === "system" || mode === "light" || mode === "dark") setTheme(mode);
          }}
        >
          <SegmentedControl.List aria-labelledby="settings-theme">
            {(["system", "light", "dark"] as const).map((mode) => {
              const Icon =
                mode === "system" ? RiComputerLine : mode === "light" ? RiSunLine : RiMoonLine;
              return (
                <SegmentedControl.Trigger
                  key={mode}
                  value={mode}
                  aria-label={t(`settings.${mode}`)}
                  title={t(`settings.${mode}`)}
                  disabled={!mounted}
                  className="focus-visible:ring-2 focus-visible:ring-primary-base"
                >
                  <Icon className="size-4" aria-hidden="true" />
                </SegmentedControl.Trigger>
              );
            })}
          </SegmentedControl.List>
        </SegmentedControl.Root>
      </section>
      <section aria-labelledby="settings-color-scheme" className="space-y-3">
        <Typography
          as="h4"
          id="settings-color-scheme"
          variant="label"
          className="text-text-strong-950"
        >
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
                        aria-pressed={mounted && selected}
                        disabled={!mounted}
                        onClick={() => setScheme(mode, scheme)}
                      >
                        {mounted && selected && (
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
