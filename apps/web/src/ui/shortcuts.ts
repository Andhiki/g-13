import { useEffect } from "react";
import { shortcuts, useShortcutHint, type ShortcutHandler } from "@ui-sdk/react/shortcuts";

/**
 * One shortcut registration. A bare function registers plain keys; the object
 * form adds what the registry needs to guard or list the shortcut: keys with
 * `allowInInput` fire while someone types, `repeat` fires on key hold, `when`
 * gates each press, and `description` feeds the keyboard-help panel.
 */
export type ShortcutAction =
  | ShortcutHandler
  | {
      run: ShortcutHandler;
      description?: string;
      allowInInput?: boolean;
      repeat?: boolean;
      when?: () => boolean;
    };

/**
 * Registers keyboard shortcuts while the component is mounted, in the shared
 * ui-sdk registry (one per page; ui-sdk popups register into the same one).
 * Keys are `+`-joined: "1", "/", "escape", "mod+k", "shift+g". Plain keys stay
 * quiet while someone types in a field, and page shortcuts pause while a modal
 * is open. Keys may appear and disappear between renders; handlers are always
 * the latest passed in.
 */
export function useKeyboardShortcuts(shortcutsByName: Record<string, ShortcutAction>) {
  useEffect(() => {
    const unregisters = Object.entries(shortcutsByName).map(([keys, action]) => {
      if (typeof action === "function") return shortcuts.register(keys, action);
      const { run, ...options } = action;
      return shortcuts.register(keys, run, options);
    });
    return () => unregisters.forEach((unregister) => unregister());
  });
}

export { shortcuts, useShortcutHint };
export type { ShortcutHandler };
