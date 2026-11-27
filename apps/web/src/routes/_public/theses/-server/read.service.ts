import type { createDatabase } from "@g13/db/client";
import {
  composeThesesIndex,
  toThesisDetail,
  type ThesesIndexData,
  type ThesisDetail,
} from "../-shared/thesis";
import {
  getPublishedThesisBySlug,
  getPublishedThesisCards,
  getPublishedThesisSitemap,
} from "./repository";

type Database = ReturnType<typeof createDatabase>;

export async function getThesesIndex(db: Database): Promise<ThesesIndexData> {
  return composeThesesIndex(await getPublishedThesisCards(db));
}

export async function getThesisDetail(db: Database, slug: string): Promise<ThesisDetail | null> {
  const record = await getPublishedThesisBySlug(db, slug);
  return record ? toThesisDetail(record) : null;
}

export async function getThesisSitemap(db: Database): Promise<{ slug: string; updatedAt: Date }[]> {
  return getPublishedThesisSitemap(db);
}
