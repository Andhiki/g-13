import { expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { createTestPlatformProxy } from "@/test/database";
import { seedThesisFixtures, thesisFixtures } from "./fixtures";
import { getThesisDetail, getThesesIndex, getThesisSitemap } from "./read.service";

it("returns only published theses, withholds unconsented content, and keeps supervisor fallbacks", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await seedThesisFixtures(db);

    const index = await getThesesIndex(db);
    expect(index.items.map((item) => item.slug)).toEqual([
      thesisFixtures.full.id,
      thesisFixtures.noAbstractConsent.id,
      thesisFixtures.metadataOnly.id,
    ]);
    expect(index.years).toEqual([2026, 2025, 2024]);
    expect(index.types).toEqual(["skripsi"]);
    expect(index.fields).toEqual(["Rekayasa Perangkat Lunak dan Data", "Sistem Cerdas"]);
    expect(JSON.stringify(index)).not.toContain("Abstrak ini tidak boleh");
    expect(JSON.stringify(index)).not.toContain("This abstract must not");
    expect(JSON.stringify(index)).not.toContain("ayu.contoh@example.com");

    expect(index.items[0]?.supervisors).toEqual([
      { name: "Dr. Nur Rokhman", lecturerId: "nur-rokhman", role: "main" },
      { name: "Dr. Pembimbing Eksternal", lecturerId: null, role: "co" },
    ]);
    expect(index.items[1]?.supervisors).toEqual([
      { name: "Dr. Nur Rokhman", lecturerId: "nur-rokhman", role: null },
    ]);
    expect(index.items[2]?.supervisors).toEqual([
      { name: "Dr. Dosen Terhapus, M.Kom.", lecturerId: null, role: null },
    ]);

    const full = await getThesisDetail(db, thesisFixtures.full.id);
    expect(full?.abstract).toContain("Penelitian ini");
    expect(full?.abstractEn).toContain("This study");
    expect(full?.contact).toEqual({ channel: "email", value: "ayu.contoh@example.com" });
    expect(full?.repositoryUrl).toBe(thesisFixtures.full.repositoryUrl);

    const noConsent = await getThesisDetail(db, thesisFixtures.noAbstractConsent.id);
    expect(noConsent?.abstract).toBeNull();
    expect(noConsent?.abstractEn).toBeNull();
    expect(noConsent?.contact).toBeNull();

    const metadataOnly = await getThesisDetail(db, thesisFixtures.metadataOnly.id);
    expect(metadataOnly?.supervisors).toEqual([
      { name: "Dr. Dosen Terhapus, M.Kom.", lecturerId: null, role: null },
    ]);

    expect(await getThesisDetail(db, "missing")).toBeNull();
    expect(await getThesisDetail(db, thesisFixtures.draft.id)).toBeNull();
    expect(await getThesisDetail(db, thesisFixtures.hidden.id)).toBeNull();
    expect(await getThesisDetail(db, thesisFixtures.deleted.id)).toBeNull();

    const sitemap = await getThesisSitemap(db);
    expect(sitemap.map((entry) => entry.slug)).toEqual([
      thesisFixtures.full.id,
      thesisFixtures.noAbstractConsent.id,
      thesisFixtures.metadataOnly.id,
    ]);
  } finally {
    await platform.dispose();
  }
}, 30_000);
