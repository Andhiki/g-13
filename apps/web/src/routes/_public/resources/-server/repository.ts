import { asc, isNull } from "drizzle-orm";
import { learningResources } from "@g13/db/schema/learning-resources";
import type { createDatabase } from "@g13/db/client";

type Database = ReturnType<typeof createDatabase>;

/**
 * Public read: explicit column allowlist, soft-deleted rows excluded, editorial order first.
 * Timestamps never leave the server.
 */
export async function listPublicResources(db: Database) {
  return db
    .select({
      id: learningResources.id,
      titleId: learningResources.titleId,
      titleEn: learningResources.titleEn,
      descriptionId: learningResources.descriptionId,
      descriptionEn: learningResources.descriptionEn,
      url: learningResources.url,
    })
    .from(learningResources)
    .where(isNull(learningResources.deletedAt))
    .orderBy(
      asc(learningResources.sortOrder),
      asc(learningResources.titleId),
      asc(learningResources.id),
    );
}
