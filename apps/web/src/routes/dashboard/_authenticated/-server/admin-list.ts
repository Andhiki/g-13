import { and, isNotNull, isNull, sql, type SQL, type SQLWrapper } from "drizzle-orm";
import { ADMIN_PAGE_SIZE } from "../-shared/admin-pagination";
import { adminSearchCondition } from "./search";

type Role = string | null | undefined;

/** What a dashboard feature tells the list module about its table. */
export type AdminListSpec<Status extends string, Row> = {
  /** Who may read this list. Checked here even behind the route middleware. */
  canView: (role: Role) => boolean;
  statuses: readonly Status[];
  /** The rows each status tab holds; undefined means every row. */
  statusCondition: (status: Status) => SQL | undefined;
  /** Text columns a dashboard search matches. */
  searchColumns: SQLWrapper[];
  /** The feature's row query (joins, columns, order), filtered by `where`. */
  rows: (where: SQL | undefined, page: { limit: number; offset: number }) => Promise<Row[]>;
  /** Selects `counts` over the same joins as `rows`, filtered by `where`. */
  count: (
    counts: Record<string, SQL<number>>,
    where: SQL | undefined,
  ) => Promise<Record<string, number> | undefined>;
};

export type AdminListPage<Status extends string> = {
  offset: number;
  status: Status;
  query?: string;
};

export type AdminListData<Status extends string, Row> = {
  rows: Row[];
  /** Per-tab counts over the whole table, so tab badges ignore the search. */
  counts: Record<Status, number>;
  /** Rows in the current tab that match the search, for paging. */
  total: number;
};

export const softDeleteStatuses = ["active", "deleted"] as const;

/** Status tabs for tables that soft-delete through a `deletedAt` column. */
export function softDeleteCondition(deletedAt: SQLWrapper) {
  return (status: (typeof softDeleteStatuses)[number]) =>
    status === "active" ? isNull(deletedAt) : isNotNull(deletedAt);
}

function countOf(condition: SQL | undefined): SQL<number> {
  return condition
    ? sql<number>`coalesce(sum(case when ${condition} then 1 else 0 end), 0)`
    : sql<number>`count(*)`;
}

/**
 * One page of a dashboard list: the rows of a status tab matching a search,
 * the per-tab counts, and the total to page through. Returns null when the
 * actor may not view the list.
 */
export async function loadAdminList<Status extends string, Row>(
  spec: AdminListSpec<Status, Row>,
  actor: { role?: Role },
  page: AdminListPage<Status>,
): Promise<AdminListData<Status, Row> | null> {
  if (!spec.canView(actor.role)) return null;
  const search = adminSearchCondition(page.query ?? "", spec.searchColumns);
  const counts = Object.fromEntries(
    spec.statuses.map((status) => [status, countOf(spec.statusCondition(status))]),
  ) as Record<Status, SQL<number>>;
  const empty = Object.fromEntries(spec.statuses.map((status) => [status, 0])) as Record<
    Status,
    number
  >;
  const [rows, allCounts, matchingCounts] = await Promise.all([
    spec.rows(and(spec.statusCondition(page.status), search), {
      limit: ADMIN_PAGE_SIZE,
      offset: page.offset,
    }),
    spec.count(counts, undefined),
    search ? spec.count(counts, search) : undefined,
  ]);
  const tabCounts = (allCounts as Record<Status, number> | undefined) ?? empty;
  return {
    rows,
    counts: tabCounts,
    total: (search ? ((matchingCounts as Record<Status, number> | undefined) ?? empty) : tabCounts)[
      page.status
    ],
  };
}
