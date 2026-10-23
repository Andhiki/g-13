import { useTheme } from "next-themes";
import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { CompactButton } from "./compact-button";

const themes = [
  { value: "light", label: "Tema terang", Icon: RiSunLine },
  { value: "dark", label: "Tema gelap", Icon: RiMoonLine },
  { value: "system", label: "Ikuti tema perangkat", Icon: RiComputerLine },
] as const;

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-switch" role="group" aria-label="Tema tampilan">
      {themes.map(({ value, label, Icon }) => (
        <CompactButton
          key={value}
          className="theme-option size-9"
          aria-label={label}
          title={label}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
        >
          <Icon className="size-5" aria-hidden="true" />
        </CompactButton>
      ))}
    </div>
  );
}
