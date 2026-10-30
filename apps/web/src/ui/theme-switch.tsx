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
                className="grid gap-2.5 rounded-[14px] border border-stroke-soft-200 px-2 pt-2 pb-3 text-[13px] font-medium text-text-sub-600 hover:bg-bg-weak-25 focus-visible:outline-3 focus-visible:outline-offset-5 focus-visible:outline-primary-base aria-pressed:border-primary-base aria-pressed:bg-primary-alpha-10 aria-pressed:text-text-strong-950 aria-pressed:shadow-[0_0_0_2px_var(--color-primary-base)]"
                aria-pressed={mounted && theme === mode}
                disabled={!mounted}
                onClick={() => setTheme(mode)}
              >
                <span
                  className="flex aspect-[1.85] overflow-hidden rounded-lg border border-stroke-soft-200 bg-(--preview-bg) [--preview-bg:#fff] [--preview-line:#e5e5e5] [--preview-accent:#b75310] data-[scheme=himakom]:data-[mode=light]:[--preview-accent:#6246d6] data-[mode=dark]:[--preview-bg:#171717] data-[mode=dark]:[--preview-line:#353535] data-[mode=dark]:[--preview-accent:#ffa468] data-[scheme=himakom]:data-[mode=dark]:[--preview-bg:#191827] data-[scheme=himakom]:data-[mode=dark]:[--preview-line:#353149] data-[scheme=himakom]:data-[mode=dark]:[--preview-accent:#b5a1ff] data-[mode=system]:[--preview-accent:#737373] data-[mode=system]:bg-[linear-gradient(90deg,#fff_50%,#171717_50%)] [&_i]:mb-[5px] [&_i]:block [&_i]:h-[5px] [&_i]:rounded-[5px] [&_i]:bg-(--preview-line)"
                  data-mode={mode}
                  data-scheme={mode === "system" ? undefined : schemes[mode]}
                  aria-hidden="true"
                >
                  <span className="w-[23%] border-r border-(--preview-line) px-[5%] py-[10%]">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="relative flex-1 px-[7%] py-[15%] [&_i:first-child]:ml-auto [&_i:first-child]:w-[60%] [&_i:first-child]:bg-(--preview-accent) [&_i:nth-child(3)]:w-[60%]">
                    <i />
                    <i />
                    <i />
                    <span className="absolute right-[7%] bottom-[10%] left-[7%] h-[15%] rounded-[5px] border border-(--preview-line) after:absolute after:inset-y-0.5 after:right-0.5 after:aspect-square after:rounded-full after:bg-(--preview-accent) after:content-['']" />
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
            <div
              key={scheme}
              className="rounded-[14px] border border-stroke-soft-200 p-3 has-[button:hover]:bg-bg-weak-25"
            >
              <div className="flex justify-center gap-4 py-2 sm:gap-6">
                {(["light", "dark"] satisfies ThemeMode[]).map((mode) => {
                  const Icon = mode === "light" ? RiSunLine : RiMoonLine;
                  const selected = schemes[mode] === scheme;
                  return (
                    <button
                      key={mode}
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
