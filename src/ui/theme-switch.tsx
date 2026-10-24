import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { RiMoonLine, RiSunLine } from "@remixicon/react";
import { AlignButton } from "./button";

export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap";
  const Icon = isDark ? RiSunLine : RiMoonLine;

  return (
    <AlignButton.Root
      type="button"
      variant="neutral"
      mode="stroke"
      size="medium"
      className="size-10 p-2.5"
      aria-label={label}
      title={label}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Icon className="size-5" aria-hidden="true" />
    </AlignButton.Root>
  );
}
