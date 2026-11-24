import { expect, it } from "bun:test";
import { sql } from "drizzle-orm";
import { createDatabase } from "@g13/db/client";
import { lecturers } from "@g13/db/schema/lecturers";
import { theses } from "@g13/db/schema/theses";
import { thesisFields } from "@g13/db/schema/thesis-fields";
import { createTestPlatformProxy } from "@/test/database";
import { getThesisDetail, getThesesIndex } from "@/routes/_public/theses/-server/read.service";
import { THESIS_ADMIN_ERRORS } from "../-shared/errors";
import { createThesisSchema, updateThesisSchema, type CreateThesisInput } from "../-shared/schemas";
import { getAdminThesisById } from "./repository";
import { changeThesisLifecycle, createThesis, inspectTheses, updateThesis } from "./service";

const admin = { id: "admin", role: "admin" };
const maintainer = { id: "maintainer", role: "maintainer" };
const regularUser = { id: "user", role: "user" };

const baseInput = {
  slug: "contoh-skripsi-2026",
  title: "Contoh Skripsi",
  authorName: "Ayu Contoh",
  authorBatch: 2022,
  year: 2026,
  type: "skripsi" as const,
  fieldIds: ["lab-sc-sistem-cerdas", "lab-rpld-rekayasa-perangkat-lunak-dan-data"],
  language: "id" as const,
  abstract: "Abstrak contoh.",
  abstractEn: "Example abstract.",
  keywords: ["machine learning", "evaluasi"],
  repositoryUrl: "https://example.com/thesis",
  contactChannel: "email" as const,
  contactValue: "ayu@example.com",
  abstractPublic: true,
  contactPublic: true,
  consentDate: "2025-08-14",
  consentSource: "https://github.com/Andhiki/g-13/issues/999",
  status: "draft" as const,
  supervisors: [
    { lecturerId: "nur-rokhman", name: "Dr. Nur Rokhman", role: "main" as const },
    { lecturerId: null, name: "Dr. Pembimbing Eksternal", role: "co" as const },
  ],
};

function makeInput(overrides: Partial<CreateThesisInput> = {}): CreateThesisInput {
  return createThesisSchema.parse({ ...baseInput, ...overrides });
}

it("rejects invalid consent, public content, URLs, and empty supervisor lists", () => {
  expect(
    createThesisSchema.safeParse({
      ...baseInput,
      status: "published",
      consentDate: null,
      consentSource: null,
      abstractPublic: false,
      contactPublic: false,
    }).success,
  ).toBe(false);
  expect(createThesisSchema.safeParse({ ...baseInput, consentDate: "2025-02-29" }).success).toBe(
    false,
  );
  expect(
    createThesisSchema.safeParse({
      ...baseInput,
      abstract: null,
      abstractEn: null,
      abstractPublic: true,
    }).success,
  ).toBe(false);
  expect(
    createThesisSchema.safeParse({ ...baseInput, contactValue: null, contactPublic: true }).success,
  ).toBe(false);
  expect(
    createThesisSchema.safeParse({ ...baseInput, repositoryUrl: "javascript:alert(1)" }).success,
  ).toBe(false);
  expect(createThesisSchema.safeParse({ ...baseInput, supervisors: [] }).success).toBe(false);
});

it("enforces roles, consent, slug uniqueness, lifecycle, and public visibility", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await db.insert(lecturers).values({ id: "nur-rokhman", name: "Dr. Nur Rokhman" });
    await db.insert(thesisFields).values([
      {
        id: "lab-sc-sistem-cerdas",
        name: "Lab SC (Sistem Cerdas)",
        lab: "Lab SC",
        position: 47,
      },
      {
        id: "lab-rpld-rekayasa-perangkat-lunak-dan-data",
        name: "Lab RPLD (Rekayasa Perangkat Lunak dan Data)",
        lab: "Lab RPLD",
        position: 60,
      },
    ]);
    const input = makeInput();

    expect(await inspectTheses(db, regularUser)).toEqual({
      data: null,
      error: THESIS_ADMIN_ERRORS.FORBIDDEN,
    });
    expect(await createThesis(db, regularUser, input)).toEqual({
      data: null,
      error: THESIS_ADMIN_ERRORS.FORBIDDEN,
    });

    const created = await createThesis(db, maintainer, input);
    expect(created).toEqual({ data: { id: "contoh-skripsi-2026" }, error: null });
    const id = created.data!.id;
    const record = await getAdminThesisById(db, id);
    expect(record).toMatchObject({
      id,
      title: "Contoh Skripsi",
      status: "draft",
      consentSource: "https://github.com/Andhiki/g-13/issues/999",
    });
    expect(record?.consentAt?.toISOString()).toBe("2025-08-14T00:00:00.000Z");
    expect(record?.supervisors).toEqual([
      { name: "Dr. Nur Rokhman", lecturerId: "nur-rokhman", role: "main" },
      { name: "Dr. Pembimbing Eksternal", lecturerId: null, role: "co" },
    ]);
    expect(record?.keywords).toEqual(["evaluasi", "machine learning"]);
    expect(record?.fields).toEqual([
      {
        id: "lab-rpld-rekayasa-perangkat-lunak-dan-data",
        name: "Lab RPLD (Rekayasa Perangkat Lunak dan Data)",
        lab: "Lab RPLD",
      },
      { id: "lab-sc-sistem-cerdas", name: "Lab SC (Sistem Cerdas)", lab: "Lab SC" },
    ]);
    expect((await getThesesIndex(db)).items).toHaveLength(0);

    expect(await createThesis(db, admin, makeInput({ title: "Another" }))).toEqual({
      data: null,
      error: THESIS_ADMIN_ERRORS.SLUG_TAKEN,
    });

    const noConsent = await createThesis(
      db,
      admin,
      makeInput({
        slug: "tanpa-izin-2026",
        consentDate: null,
        consentSource: null,
        abstractPublic: false,
        contactPublic: false,
      }),
    );
    const noConsentId = noConsent.data!.id;
    expect(
      await changeThesisLifecycle(db, admin, { thesisId: noConsentId, action: "publish" }),
    ).toEqual({ data: null, error: THESIS_ADMIN_ERRORS.CONSENT_REQUIRED });

    expect(await changeThesisLifecycle(db, admin, { thesisId: id, action: "publish" })).toEqual({
      data: { thesisId: id, action: "publish" },
      error: null,
    });
    const publicIndex = await getThesesIndex(db);
    expect(publicIndex.items.map((item) => item.slug)).toEqual([id]);
    expect(JSON.stringify(publicIndex)).not.toContain("Abstrak contoh");
    expect(JSON.stringify(publicIndex)).not.toContain("ayu@example.com");
    const publicDetail = await getThesisDetail(db, id);
    expect(publicDetail?.abstract).toBe("Abstrak contoh.");
    expect(publicDetail?.contact).toEqual({ channel: "email", value: "ayu@example.com" });

    await changeThesisLifecycle(db, admin, { thesisId: id, action: "hide" });
    expect((await getThesesIndex(db)).items).toHaveLength(0);
    expect(await getThesisDetail(db, id)).toBeNull();

    const current = await getAdminThesisById(db, id);
    const updatedInput = updateThesisSchema.parse({
      thesisId: id,
      ...baseInput,
      title: "Contoh Skripsi Diperbarui",
      status: "hidden",
      keywords: ["evaluasi", "prediksi"],
      supervisors: [
        { lecturerId: null, name: "Dr. Pembimbing Eksternal", role: "co" },
        { lecturerId: "nur-rokhman", name: "Dr. Nur Rokhman", role: "main" },
      ],
    });
    expect(await updateThesis(db, maintainer, updatedInput)).toEqual({
      data: { thesisId: id },
      error: null,
    });
    const updated = await getAdminThesisById(db, id);
    expect(updated?.title).toBe("Contoh Skripsi Diperbarui");
    expect(updated?.supervisors.map((supervisor) => supervisor.name)).toEqual([
      "Dr. Pembimbing Eksternal",
      "Dr. Nur Rokhman",
    ]);
    expect(updated?.keywords).toEqual(["evaluasi", "prediksi"]);
    expect(updated?.consentAt).toEqual(current?.consentAt);

    await changeThesisLifecycle(db, admin, { thesisId: id, action: "publish" });
    expect((await getThesisDetail(db, id))?.title).toBe("Contoh Skripsi Diperbarui");

    await changeThesisLifecycle(db, admin, { thesisId: id, action: "delete" });
    expect(await getThesisDetail(db, id)).toBeNull();
    const deletedList = await inspectTheses(db, admin, 0, "deleted");
    expect(deletedList.data).toMatchObject({
      rows: [{ id }],
      counts: { deleted: 1 },
    });

    await changeThesisLifecycle(db, admin, { thesisId: id, action: "restore" });
    const [restored, restoredPublicDetail] = await Promise.all([
      getAdminThesisById(db, id),
      getThesisDetail(db, id),
    ]);
    expect(restored).toMatchObject({ status: "draft", deletedAt: null });
    expect(restoredPublicDetail).toBeNull();

    const draftList = await inspectTheses(db, maintainer, 0, "draft");
    const drafts = draftList.data?.rows.map(({ id: thesisId }) => thesisId);
    expect(drafts?.sort()).toEqual([id, noConsentId].sort());
    expect(draftList.data).toMatchObject({
      counts: { draft: 2 },
      lecturers: [{ id: "nur-rokhman", name: "Dr. Nur Rokhman" }],
    });
    expect(draftList.data?.fields).toEqual([
      {
        id: "lab-rpld-rekayasa-perangkat-lunak-dan-data",
        name: "Lab RPLD (Rekayasa Perangkat Lunak dan Data)",
        lab: "Lab RPLD",
      },
      { id: "lab-sc-sistem-cerdas", name: "Lab SC (Sistem Cerdas)", lab: "Lab SC" },
    ]);

    const auto = await createThesis(
      db,
      admin,
      makeInput({ slug: undefined, title: "Judul Otomatis", year: 2025 }),
    );
    expect(auto.data?.id).toBe("judul-otomatis-2025");

    await changeThesisLifecycle(db, admin, { thesisId: id, action: "publish" });
    const publishedList = await inspectTheses(db, admin, 0, "published");
    expect(publishedList.data?.counts.published).toBe(1);
    expect(publishedList.data?.rows.map((row) => row.id)).toEqual([id]);
    expect((await getThesesIndex(db)).items[0]?.title).toBe("Contoh Skripsi Diperbarui");
  } finally {
    await platform.dispose();
  }
}, 30_000);

it("finds theses beyond the first page and publishes an English-only abstract", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await db.run(sql`
      with recursive numbers(n) as (values (1) union all select n + 1 from numbers where n < 51)
      insert into ${theses} (id, title, author_name, year, updated_at)
      select 'page-row-' || n, 'Example thesis ' || n, 'Sample author', 2026, 4070908800000
      from numbers
    `);
    const input = makeInput({
      slug: "english-only",
      title: "Zebra thesis",
      language: "en",
      abstract: null,
      fieldIds: [],
      supervisors: [{ name: "Example supervisor", lecturerId: null, role: null }],
    });
    expect(await createThesis(db, maintainer, input)).toEqual({
      data: { id: "english-only" },
      error: null,
    });
    expect((await inspectTheses(db, maintainer)).data?.rows.map((row) => row.id)).not.toContain(
      "english-only",
    );
    const search = await inspectTheses(db, maintainer, 0, "draft", "ZEBRA");
    expect(search.data?.counts.draft).toBe(1);
    expect(search.data?.rows.map((row) => row.id)).toEqual(["english-only"]);
    expect(
      await changeThesisLifecycle(db, maintainer, { thesisId: "english-only", action: "publish" }),
    ).toEqual({ data: { thesisId: "english-only", action: "publish" }, error: null });
    expect(await getThesisDetail(db, "english-only")).toMatchObject({
      abstract: null,
      abstractEn: "Example abstract.",
    });
  } finally {
    await platform.dispose();
  }
});
