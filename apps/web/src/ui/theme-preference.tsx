import { useTheme } from "next-themes";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeScheme = "omahti" | "himakom";
export type ThemeMode = "light" | "dark";
const modes: ThemeMode[] = ["light", "dark"];
const storageKey = (mode: ThemeMode) => `g13-theme-${mode}`;
const parseScheme = (value: string | null): ThemeScheme =>
  value === "himakom" ? "himakom" : "omahti";

export const themePreferenceScript = `try{for(const mode of ["light","dark"]){document.documentElement.setAttribute("data-"+mode+"-theme",localStorage.getItem("g13-theme-"+mode)==="himakom"?"himakom":"omahti")}}catch{}`;

const ThemePreferenceContext = createContext<{
  schemes: Record<ThemeMode, ThemeScheme>;
  setScheme: (mode: ThemeMode, scheme: ThemeScheme) => void;
}>({ schemes: { light: "omahti", dark: "omahti" }, setScheme: () => {} });

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [schemes, setSchemes] = useState<Record<ThemeMode, ThemeScheme>>({
    light: "omahti",
    dark: "omahti",
  });

  useEffect(() => {
    function sync() {
      for (const mode of modes) {
        try {
          const scheme = parseScheme(localStorage.getItem(storageKey(mode)));
          document.documentElement.setAttribute(`data-${mode}-theme`, scheme);
          setSchemes((current) => ({ ...current, [mode]: scheme }));
        } catch {
          // Keep session preferences when storage is unavailable.
        }
      }
    }
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    const color =
      resolvedTheme === "dark" ? (schemes.dark === "himakom" ? "#191827" : "#171717") : "#ffffff";
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.content = color;
    }
  }, [resolvedTheme, schemes]);

  function setScheme(mode: ThemeMode, scheme: ThemeScheme) {
    setSchemes((current) => ({ ...current, [mode]: scheme }));
    document.documentElement.setAttribute(`data-${mode}-theme`, scheme);
    try {
      localStorage.setItem(storageKey(mode), scheme);
    } catch {
      // The preference still applies for this session.
    }
  }

  return <ThemePreferenceContext value={{ schemes, setScheme }}>{children}</ThemePreferenceContext>;
}

export function useThemePreference() {
  return useContext(ThemePreferenceContext);
}
