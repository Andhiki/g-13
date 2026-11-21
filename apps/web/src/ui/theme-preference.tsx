import { createColorScheme, createLocalStorage, createPreference } from "@ui-sdk/core";
import { Preferences, usePreference } from "@ui-sdk/react/preferences";
import { useEffect, type ReactNode } from "react";
import { cursorPreference } from "./cursor-preference";

export type ThemeScheme = "omahti" | "himakom";
export type ThemeMode = "light" | "dark";

const schemes = ["omahti", "himakom"] as const;

// The mode is "system" unless an explicit choice is saved under the key
// next-themes used, so existing visitors keep theirs.
export const themeMode = createColorScheme({
  storage: createLocalStorage("curriculum-theme"),
  global: true,
});

export const lightThemePreference = createPreference({
  values: schemes,
  defaultValue: "omahti",
  attribute: "data-light-theme",
  global: true,
  storage: createLocalStorage("g13-theme-light"),
});

export const darkThemePreference = createPreference({
  values: schemes,
  defaultValue: "omahti",
  attribute: "data-dark-theme",
  global: true,
  storage: createLocalStorage("g13-theme-dark"),
});

export const blurPreference = createPreference({
  values: ["on", "off"],
  defaultValue: "on",
  attribute: "data-blur",
  global: true,
  storage: createLocalStorage("g13-blur"),
});

// The dark styles select on the `.dark` class (alignui.css), which the
// preference layer cannot write: preferencesScript only sets data-*
// attributes. This applies the saved mode before the first paint, the way
// next-themes' script used to.
export const darkModeScript = `try{var theme=localStorage.getItem("curriculum-theme");document.documentElement.classList.toggle("dark",theme==="dark"||(theme!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))}catch(e){}`;

export function AppPreferences({ children }: { children: ReactNode }) {
  useEffect(() => {
    const applyBlur = ({ value }: { value: "on" | "off" }) => {
      document.documentElement.toggleAttribute("data-no-blur", value === "off");
    };
    const applyCursor = ({ value }: { value: "default" | "pointer" }) => {
      document.documentElement.style.setProperty("--interactive-cursor", value);
    };
    const syncThemeColor = () => {
      const color =
        themeMode.get().resolved === "dark"
          ? darkThemePreference.get().value === "himakom"
            ? "#191827"
            : "#171717"
          : "#ffffff";
      for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
        meta.content = color;
      }
    };
    const syncMode = () => {
      document.documentElement.classList.toggle("dark", themeMode.get().resolved === "dark");
      syncThemeColor();
    };
    const stops = [
      themeMode.subscribe(syncMode),
      darkThemePreference.subscribe(syncThemeColor),
      blurPreference.subscribe(applyBlur),
      cursorPreference.subscribe(applyCursor),
    ];
    syncMode();
    return () => stops.forEach((stop) => stop());
  }, []);

  return (
    <Preferences
      preferences={[
        themeMode,
        lightThemePreference,
        darkThemePreference,
        blurPreference,
        cursorPreference,
      ]}
    >
      {children}
    </Preferences>
  );
}

export function useThemePreference() {
  const light = usePreference(lightThemePreference);
  const dark = usePreference(darkThemePreference);
  return {
    schemes: { light: light.value, dark: dark.value },
    setScheme: (mode: ThemeMode, scheme: ThemeScheme) =>
      (mode === "light" ? lightThemePreference : darkThemePreference).set(scheme),
  };
}

export function useThemeMode() {
  return usePreference(themeMode);
}
