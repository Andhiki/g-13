import { sql, type SQLWrapper } from "drizzle-orm";

export function adminSearchCondition(query: string, fields: SQLWrapper[]) {
  const needle = query.trim();
  if (!needle) return undefined;
  const text = sql.join(fields, sql` || ' ' || `);
  return sql`instr(lower(${text}), lower(${needle})) > 0`;
}
