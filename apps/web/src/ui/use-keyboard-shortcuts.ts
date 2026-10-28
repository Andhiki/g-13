import { useEffect, useEffectEvent } from "react";

export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      event.repeat ||
      event.isComposing ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      (event.shiftKey && event.key !== "/") ||
      (event.target instanceof Element &&
        event.target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'))
    )
      return;
    const key = event.key.toLowerCase();
    if (!Object.hasOwn(shortcuts, key)) return;
    event.preventDefault();
    shortcuts[key]();
  });
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
