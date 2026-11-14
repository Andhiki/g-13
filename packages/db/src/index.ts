import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { schema } from "./schema";

export function createDatabase(
  binding: D1Database,
): DrizzleD1Database<typeof schema> & { $client: D1Database } {
  return drizzle(binding, { schema });
}

export { courses, professors, reviewLikes, reviews, schema } from "./schema";
