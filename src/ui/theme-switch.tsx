import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { AlignButton } from "./button";
import { AlignDropdown } from "./dropdown";

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
  const CurrentIcon = current.Icon;

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
      <AlignDropdown.Content align="end" aria-label="Pilih tema tampilan">
        <AlignDropdown.RadioGroup value={selectedTheme} onValueChange={setTheme}>
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
