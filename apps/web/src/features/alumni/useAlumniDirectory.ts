import { useCallback, useEffect, useState } from "react";
import type { AlumniDirectoryData } from "./directory";

export type AlumniDirectoryState =
  | { status: "loading" }
  | { status: "ready"; data: AlumniDirectoryData }
  | { status: "unavailable" };

// Initial data comes from the server loader; retries use the cached API route.
export function useAlumniDirectory(
  initialData: AlumniDirectoryData | null,
): AlumniDirectoryState & { reload: () => void } {
  const [state, setState] = useState<AlumniDirectoryState>(
    initialData ? { status: "ready", data: initialData } : { status: "unavailable" },
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (attempt === 0) return;
    const controller = new AbortController();
    let active = true;
    setState({ status: "loading" });

    fetch("/api/alumni", { signal: controller.signal, headers: { accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        return (await response.json()) as AlumniDirectoryData;
      })
      .then((data) => {
        if (active) setState({ status: "ready", data });
      })
      .catch(() => {
        if (active && !controller.signal.aborted) setState({ status: "unavailable" });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  return { ...state, reload };
}
