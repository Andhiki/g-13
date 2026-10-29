import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import * as SegmentedControl from "./segmented-control";
import { useTranslation } from "react-i18next";

export function ThemeSwitch() {
  const { t } = useTranslation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const transitioning = useRef(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const changeTheme = (value: "system" | "light" | "dark") => {
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

  return (
    <SegmentedControl.Root
      value={mounted ? theme : "system"}
      onValueChange={(value) => {
        if (value === "system" || value === "light" || value === "dark") changeTheme(value);
      }}
    >
      <SegmentedControl.List aria-label={t("settings.theme")}>
        <SegmentedControl.Trigger
          value="system"
          disabled={!mounted}
          className="focus-visible:ring-2 focus-visible:ring-primary-base"
        >
          <RiComputerLine className="size-4" aria-hidden="true" />
          {t("settings.system")}
        </SegmentedControl.Trigger>
        <SegmentedControl.Trigger
          value="dark"
          disabled={!mounted}
          className="focus-visible:ring-2 focus-visible:ring-primary-base"
        >
          <RiMoonLine className="size-4" aria-hidden="true" />
          {t("settings.dark")}
        </SegmentedControl.Trigger>
        <SegmentedControl.Trigger
          value="light"
          disabled={!mounted}
          className="focus-visible:ring-2 focus-visible:ring-primary-base"
        >
          <RiSunLine className="size-4" aria-hidden="true" />
          {t("settings.light")}
        </SegmentedControl.Trigger>
      </SegmentedControl.List>
    </SegmentedControl.Root>
  );
}
