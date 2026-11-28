import { sql, type SQLWrapper } from "drizzle-orm";

/**
 * Searches exactly `fields`, in order. `columns` must map every field and no
 * others, so the page's shared field list is also what the UI may highlight.
 */
export function adminSearchCondition<const F extends string>(
  query: string,
  fields: readonly F[],
  columns: Record<NoInfer<F>, SQLWrapper>,
) {
  const needle = query.trim();
  if (!needle) return undefined;
  const text = sql.join(
    fields.map((field) => columns[field]),
    sql` || ' ' || `,
  );
  return sql`instr(lower(${text}), lower(${needle})) > 0`;
}
