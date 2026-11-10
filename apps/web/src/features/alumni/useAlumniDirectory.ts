import { useCallback, useEffect, useState } from "react";
import type { AlumniDirectoryData } from "./directory";

export type AlumniDirectoryState =
  | { status: "loading" }
  | { status: "ready"; data: AlumniDirectoryData }
  | { status: "unavailable" };

/**
 * Reads the sanitised directory from our own `/api/alumni` route.
 * The Strapi token stays on the server; the browser only ever sees this endpoint.
 * The response is cached by the edge, so revisits resolve without a network round trip.
 */
export function useAlumniDirectory(): AlumniDirectoryState & { reload: () => void } {
  const [state, setState] = useState<AlumniDirectoryState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
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
