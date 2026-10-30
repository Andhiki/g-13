import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { useThemePreference, type ThemeMode } from "./theme-preference";
import { Typography } from "./typography";
import { useTranslation } from "react-i18next";

export function ThemeSwitch() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { schemes, setScheme } = useThemePreference();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-5">
      <section aria-labelledby="settings-theme" className="space-y-3">
        <Typography as="h4" id="settings-theme" variant="labelSmall" className="text-text-sub-600">
          {t("settings.theme")}
        </Typography>
        <div
          className="grid grid-cols-3 gap-2 sm:gap-3"
          role="group"
          aria-labelledby="settings-theme"
        >
          {(["system", "light", "dark"] as const).map((mode) => {
            const Icon =
              mode === "system" ? RiComputerLine : mode === "light" ? RiSunLine : RiMoonLine;
            return (
              <button
                key={mode}
                type="button"
                className="theme-mode-card"
                aria-pressed={mounted && theme === mode}
                disabled={!mounted}
                onClick={() => setTheme(mode)}
              >
                <span className="theme-mode-preview" data-mode={mode} aria-hidden="true">
                  <span className="theme-preview-sidebar">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="theme-preview-body">
                    <i />
                    <i />
                    <i />
                    <span />
                  </span>
                </span>
                <span className="flex items-center justify-center gap-1.5">
                  <Icon className="size-4" aria-hidden="true" />
                  {t(`settings.${mode}`)}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <section aria-labelledby="settings-color-scheme" className="space-y-3">
        <Typography
          as="h4"
          id="settings-color-scheme"
          variant="labelSmall"
          className="text-text-sub-600"
        >
          {t("settings.colorScheme")}
        </Typography>
        <div className="grid grid-cols-2 gap-3">
          {(["omahti", "himakom"] as const).map((scheme) => (
            <div key={scheme} className="theme-palette-card">
              <div className="flex justify-center gap-4 py-2 sm:gap-6">
                {(["light", "dark"] satisfies ThemeMode[]).map((mode) => {
                  const Icon = mode === "light" ? RiSunLine : RiMoonLine;
                  const selected = schemes[mode] === scheme;
                  return (
                    <button
                      key={mode}
                      type="button"
                      className="theme-swatch"
                      data-scheme={scheme}
                      data-mode={mode}
                      aria-label={`${scheme === "omahti" ? "OmahTI" : "HIMAKOM"} · ${t(`settings.${mode}`)}`}
                      title={`${scheme === "omahti" ? "OmahTI" : "HIMAKOM"} · ${t(`settings.${mode}`)}`}
                      aria-pressed={mounted && selected}
                      disabled={!mounted}
                      onClick={() => setScheme(mode, scheme)}
                    >
                      {mounted && selected && (
                        <span className="theme-swatch-badge">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <Typography variant="label">{scheme === "omahti" ? "OmahTI" : "HIMAKOM"}</Typography>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
