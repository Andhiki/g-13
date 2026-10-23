import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const themes = [
  { value: "light", label: "Terang", Icon: RiSunLine },
  { value: "dark", label: "Gelap", Icon: RiMoonLine },
  { value: "system", label: "Sistem", Icon: RiComputerLine },
] as const;

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const selectedTheme = mounted ? (theme ?? "system") : "system";
  const current = themes.find((item) => item.value === selectedTheme) ?? themes[2];
  const Icon = current.Icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="topbar-menu-trigger theme-menu-trigger"
        aria-label={`Tema tampilan: ${current.label}`}
      >
        <Icon aria-hidden="true" />
        <span>Tema: {current.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        aria-label="Pilih tema tampilan"
        className="theme-menu-content"
      >
        <DropdownMenuRadioGroup value={selectedTheme} onValueChange={setTheme}>
          {themes.map(({ value, label, Icon: OptionIcon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <OptionIcon aria-hidden="true" />
              <span>{label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
