import { useEffect, useState } from "react";
import { adminSearchMaxLength } from "../-shared/admin-search";

export function useAdminSearch() {
  const [query, setQuery] = useState("");
  const [needle, setNeedle] = useState("");
  const [offset, setOffset] = useState(0);
  const nextNeedle = query.trim().slice(0, adminSearchMaxLength);

  useEffect(() => {
    if (nextNeedle === needle) return;
    const timer = setTimeout(() => {
      setOffset(0);
      setNeedle(nextNeedle);
    }, 200);
    return () => clearTimeout(timer);
  }, [nextNeedle, needle]);

  return { query, setQuery, needle, offset, setOffset, searchPending: nextNeedle !== needle };
}
