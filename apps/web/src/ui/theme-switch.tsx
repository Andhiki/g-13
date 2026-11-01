import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { useThemePreference, type ThemeMode } from "./theme-preference";
import { Typography } from "./typography";
import { useTranslation } from "react-i18next";
import { AlignButton } from "./button";

export function ThemeSwitch() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { schemes, setScheme } = useThemePreference();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-5">
      <section aria-labelledby="settings-theme" className="space-y-3">
        <Typography as="h4" id="settings-theme" variant="label" className="text-text-strong-950">
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
              <AlignButton.Root
                key={mode}
                variant="neutral"
                mode="stroke"
                className="h-11 gap-1.5 px-2 aria-pressed:bg-primary-alpha-10 aria-pressed:text-text-strong-950 aria-pressed:ring-primary-base sm:grid sm:h-auto sm:justify-normal sm:gap-2.5 sm:rounded-[14px] sm:pt-2 sm:pb-3"
                aria-pressed={mounted && theme === mode}
                disabled={!mounted}
                onClick={() => setTheme(mode)}
              >
                <span
                  className="relative hidden aspect-[2.4] overflow-hidden rounded-lg border border-stroke-soft-200 sm:block"
                  aria-hidden="true"
                >
                  <ThemeMap
                    mode={mode === "dark" ? "dark" : "light"}
                    scheme={schemes[mode === "dark" ? "dark" : "light"]}
                  />
                  {mode === "system" && (
                    <span className="absolute inset-0 [clip-path:inset(0_0_0_50%)]">
                      <ThemeMap mode="dark" scheme={schemes.dark} />
                    </span>
                  )}
                </span>
                <span className="flex items-center justify-center gap-1.5">
                  <Icon className="size-4" aria-hidden="true" />
                  <Typography as="span" variant="label">
                    {t(`settings.${mode}`)}
                  </Typography>
                </span>
              </AlignButton.Root>
            );
          })}
        </div>
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

function ThemeMap({ mode, scheme }: { mode: ThemeMode; scheme: "omahti" | "himakom" }) {
  return (
    <span
      className="relative block h-full overflow-hidden bg-(--map-bg) text-(--map-text) [--map-bg:#fafafa] [--map-surface:#fff] [--map-line:#e5e5e5] [--map-text:#262626] [--map-accent:#b75310] data-[mode=dark]:[--map-bg:#171717] data-[mode=dark]:[--map-surface:#242424] data-[mode=dark]:[--map-line:#404040] data-[mode=dark]:[--map-text:#f5f5f5] data-[mode=dark]:[--map-accent:#ffa468] data-[scheme=himakom]:[--map-accent:#6246d6] data-[scheme=himakom]:data-[mode=dark]:[--map-bg:#191827] data-[scheme=himakom]:data-[mode=dark]:[--map-surface:#252337] data-[scheme=himakom]:data-[mode=dark]:[--map-line:#403b58] data-[scheme=himakom]:data-[mode=dark]:[--map-accent:#b5a1ff]"
      data-mode={mode}
      data-scheme={scheme}
    >
      <span className="flex h-[23%] items-center gap-[4%] border-b border-(--map-line) bg-(--map-surface) px-[7%]">
        <span className="size-[7%] min-h-[5px] min-w-[5px] rounded-sm bg-(--map-accent)" />
        <span className="h-[3px] w-[20%] rounded-full bg-(--map-line)" />
        <span className="ml-auto h-[3px] w-[12%] rounded-full bg-(--map-line)" />
      </span>
      <span className="absolute top-[39%] left-[8%] h-[3px] w-[26%] rounded-full bg-(--map-text) opacity-40" />
      <span className="absolute top-[67%] left-[15%] h-px w-[70%] bg-(--map-line)" />
      <span className="absolute top-[55%] left-[8%] h-[25%] w-[25%] rounded-[4px] border border-(--map-accent) bg-(--map-surface) p-[3%]">
        <span className="block h-[3px] w-[50%] rounded-full bg-(--map-accent)" />
        <span className="mt-[4px] block h-[3px] w-[85%] rounded-full bg-(--map-line)" />
      </span>
      <span className="absolute top-[55%] left-[38%] h-[25%] w-[25%] rounded-[4px] border border-(--map-line) bg-(--map-surface) p-[3%]">
        <span className="block h-[3px] w-[50%] rounded-full bg-(--map-accent) opacity-60" />
        <span className="mt-[4px] block h-[3px] w-[85%] rounded-full bg-(--map-line)" />
      </span>
      <span className="absolute top-[55%] left-[68%] h-[25%] w-[25%] rounded-[4px] border border-(--map-line) bg-(--map-surface) p-[3%]">
        <span className="block h-[3px] w-[50%] rounded-full bg-(--map-accent) opacity-60" />
        <span className="mt-[4px] block h-[3px] w-[85%] rounded-full bg-(--map-line)" />
      </span>
    </span>
  );
}
