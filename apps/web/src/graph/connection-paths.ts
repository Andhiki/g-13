import type { XYPosition } from "@xyflow/react";

export function connectionPaths() {
  let paths: ReadonlyMap<string, XYPosition[]> = new Map();
  const listeners = new Set<() => void>();
  return {
    get: (id: string) => paths.get(id),
    has: (id: string) => paths.has(id),
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update(next: ReadonlyMap<string, XYPosition[]>) {
      paths = next;
      for (const listener of listeners) listener();
    },
  };
}
