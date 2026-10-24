import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { AlignButton } from "./button";
import { AlignDropdown } from "./dropdown";

const themes = [
  { value: "light", label: "Terang", Icon: RiSunLine },
  { value: "dark", label: "Gelap", Icon: RiMoonLine },
  { value: "system", label: "Sistem", Icon: RiComputerLine },
] as const;

export function ThemeSwitch() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const transitioning = useRef(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const selectedTheme = mounted ? (theme ?? "system") : "system";
  const current = themes.find((item) => item.value === selectedTheme) ?? themes[2];
  const CurrentIcon = current.Icon;

  const changeTheme = (value: string) => {
    if (transitioning.current) return;
    const nextResolved =
      value === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : value;
    if (
      nextResolved === resolvedTheme ||
      document.hidden ||
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(value);
      return;
    }

    transitioning.current = true;
    // Let the menu close before capturing the old page.
    requestAnimationFrame(() => {
      const root = document.documentElement;
      root.classList.add("theme-transition");
      try {
        const transition = document.startViewTransition(() => {
          flushSync(() => setTheme(value));
        });
        void transition.finished
          .catch(() => {})
          .finally(() => {
            root.classList.remove("theme-transition");
            transitioning.current = false;
          });
      } catch {
        setTheme(value);
        root.classList.remove("theme-transition");
        transitioning.current = false;
      }
    });
  };

  return (
    <AlignDropdown.Root>
      <AlignDropdown.Trigger asChild>
        <AlignButton.Root
          variant="neutral"
          mode="stroke"
          size="medium"
          className="size-10 p-2.5"
          aria-label={`Pilih tema tampilan. Saat ini ${current.label}.`}
          title={`Tema tampilan: ${current.label}`}
        >
          <CurrentIcon className="size-5" aria-hidden="true" />
        </AlignButton.Root>
      </AlignDropdown.Trigger>
      <AlignDropdown.Content
        align="end"
        aria-label="Pilih tema tampilan"
        className="data-[state=closed]:animate-none"
      >
        <AlignDropdown.RadioGroup value={selectedTheme} onValueChange={changeTheme}>
          {themes.map(({ value, label, Icon: OptionIcon }) => (
            <AlignDropdown.RadioItem key={value} value={value}>
              <AlignDropdown.ItemIcon>
                <OptionIcon className="size-5" aria-hidden="true" />
              </AlignDropdown.ItemIcon>
              <span>{label}</span>
            </AlignDropdown.RadioItem>
          ))}
        </AlignDropdown.RadioGroup>
      </AlignDropdown.Content>
    </AlignDropdown.Root>
  );
}
