import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { AlignSelect } from "./select";

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

  return (
    <AlignSelect.Root variant="compact" value={selectedTheme} onValueChange={setTheme}>
      <AlignSelect.Trigger aria-label={`Tema tampilan: ${current.label}`}>
        <AlignSelect.Value>{`Tema: ${current.label}`}</AlignSelect.Value>
      </AlignSelect.Trigger>
      <AlignSelect.Content>
        {themes.map(({ value, label, Icon: OptionIcon }) => (
          <AlignSelect.Item key={value} value={value}>
            <AlignSelect.ItemIcon>
              <OptionIcon aria-hidden="true" />
            </AlignSelect.ItemIcon>
            <span>{label}</span>
          </AlignSelect.Item>
        ))}
      </AlignSelect.Content>
    </AlignSelect.Root>
  );
}
