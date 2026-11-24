import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Cursor = "default" | "pointer";
const CursorContext = createContext<{
  cursor: Cursor;
  setCursor: (cursor: Cursor) => void;
}>({ cursor: "default", setCursor: () => {} });

export function CursorProvider({ children }: { children: ReactNode }) {
  const [cursor, updateCursor] = useState<Cursor>("default");

  useEffect(() => {
    try {
      if (localStorage.getItem("g13-cursor") === "pointer") updateCursor("pointer");
    } catch {
      // Keep the default when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--interactive-cursor", cursor);
  }, [cursor]);

  function setCursor(value: Cursor) {
    updateCursor(value);
    try {
      localStorage.setItem("g13-cursor", value);
    } catch {
      // The preference still applies for this session.
    }
  }

  return <CursorContext value={{ cursor, setCursor }}>{children}</CursorContext>;
}

export function useCursorPreference() {
  return useContext(CursorContext);
}
