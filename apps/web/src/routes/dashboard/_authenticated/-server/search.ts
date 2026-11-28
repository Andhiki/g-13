import { sql, type SQLWrapper } from "drizzle-orm";

export function adminSearchCondition(query: string, fields: SQLWrapper[]) {
  const needle = query.trim();
  if (!needle) return undefined;
  const text = sql.join(fields, sql` || ' ' || `);
  return sql`instr(lower(${text}), lower(${needle})) > 0`;
}

/**
 * Orders a page's search columns by its shared field list. `columns` must map
 * every field and no others, so the UI can highlight exactly what is searched.
 */
export function adminSearchColumns<const F extends string>(
  fields: readonly F[],
  columns: Record<NoInfer<F>, SQLWrapper>,
): SQLWrapper[] {
  return fields.map((field) => columns[field]);
}
