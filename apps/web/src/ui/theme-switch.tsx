import { useLocale } from "../useLocale";
import { useTheme } from "next-themes";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { RiMoonLine, RiSunLine } from "@remixicon/react";
import { AlignButton } from "./button";

export function ThemeSwitch() {
  const { text } = useLocale("common");
  const { resolvedTheme, setTheme } = useTheme();
  const transitioning = useRef(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? text("Ganti ke tema terang") : text("Ganti ke tema gelap");
  const Icon = isDark ? RiSunLine : RiMoonLine;

  const changeTheme = (value: "light" | "dark") => {
    if (transitioning.current) return;
    if (
      value === resolvedTheme ||
      document.hidden ||
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(value);
      return;
    }

    transitioning.current = true;
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

  useKeyboardShortcuts(mounted ? { d: () => changeTheme(isDark ? "light" : "dark") } : {});

  return (
    <AlignButton.Root
      type="button"
      variant="neutral"
      mode="stroke"
      size="medium"
      className="size-10 p-2.5"
      aria-label={text(label)}
      title={text("{{v0}} (D)", { v0: label })}
      aria-keyshortcuts="D"
      disabled={!mounted}
      onClick={() => changeTheme(isDark ? "light" : "dark")}
    >
      <Icon className="size-5" aria-hidden="true" />
    </AlignButton.Root>
  );
}
