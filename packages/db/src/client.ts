import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";

export function createDatabase(binding: D1Database): DrizzleD1Database & { $client: D1Database } {
  return drizzle(binding);
}
