import { useEffect, useState } from "react";
import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { adminSearchMaxLength } from "../-shared/admin-search";
import {
  getNextAdminPageOffset,
  getPreviousAdminPageOffset,
  hasNextAdminPage,
} from "../-shared/admin-pagination";

type AdminListResult<Status extends string> = {
  rows: unknown[];
  counts: Record<Status, number>;
  total: number;
};

/**
 * Client state for a dashboard list: the debounced search, the status tab, the
 * page, and the query that loads them. Changing the search or the tab returns
 * to the first page. While a search is debouncing, the list shows as pending
 * rather than showing rows for the previous search.
 */
export function useAdminList<
  Status extends string,
  Data extends AdminListResult<Status>,
  Key extends QueryKey,
>(
  initialStatus: NoInfer<Status>,
  listQuery: (
    offset: number,
    status: Status,
    needle: string,
  ) => UseQueryOptions<Data, Error, Data, Key>,
  initialCounts: Record<Status, number>,
) {
  const [query, setQuery] = useState("");
  const [needle, setNeedle] = useState("");
  const [offset, setOffset] = useState(0);
  const [status, setStatusState] = useState<Status>(initialStatus);
  const nextNeedle = query.trim().slice(0, adminSearchMaxLength);
  const searchPending = nextNeedle !== needle;

  useEffect(() => {
    if (nextNeedle === needle) return;
    const timer = setTimeout(() => {
      setOffset(0);
      setNeedle(nextNeedle);
    }, 200);
    return () => clearTimeout(timer);
  }, [nextNeedle, needle]);

  const result = useQuery(listQuery(offset, status, needle));
  const total = result.data?.total ?? 0;

  return {
    query,
    setQuery,
    needle,
    searchPending,
    status,
    /** Switches tab and returns to the first page. */
    setStatus(next: Status) {
      setStatusState(next);
      setOffset(0);
    },
    offset,
    result,
    counts: result.data?.counts ?? initialCounts,
    listState: {
      isPending: searchPending || result.isPending,
      isError: !searchPending && result.isError,
    },
    rows: (searchPending ? [] : (result.data?.rows ?? [])) as Data["rows"],
    total,
    page: {
      hasNext: hasNextAdminPage(offset, total),
      previous: () => setOffset(getPreviousAdminPageOffset(offset)),
      next: () => setOffset(getNextAdminPageOffset(offset)),
    },
  };
}
