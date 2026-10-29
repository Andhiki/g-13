import { useEffect, useRef, useState } from "react";

type SharedLink = {
  selection: string;
  url: string;
  status: "copied" | "manual";
};

export function useSharedLink({
  selection,
  copiedDuration,
}: {
  selection: string;
  copiedDuration?: number;
}) {
  const [result, setResult] = useState<SharedLink | null>(null);
  const attempt = useRef<{ selection: string; url: string } | null>(null);

  useEffect(() => {
    attempt.current = null;
    setResult(null);
    return () => {
      attempt.current = null;
    };
  }, [selection]);

  useEffect(() => {
    if (result?.status !== "copied" || copiedDuration === undefined) return;
    const timer = window.setTimeout(() => setResult(null), copiedDuration);
    return () => window.clearTimeout(timer);
  }, [result, copiedDuration]);

  async function copyLink() {
    const snapshot = { selection, url: window.location.href };
    attempt.current = snapshot;
    let status: SharedLink["status"] = "copied";
    try {
      await navigator.clipboard.writeText(snapshot.url);
    } catch {
      status = "manual";
    }
    if (attempt.current !== snapshot || window.location.href !== snapshot.url) return false;
    setResult({ ...snapshot, status });
    return status === "copied";
  }

  function dismiss() {
    attempt.current = null;
    setResult(null);
  }

  return { share: result?.selection === selection ? result : null, copyLink, dismiss };
}
