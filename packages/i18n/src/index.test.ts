import { expect, test } from "bun:test";
import { createInstance } from "i18next";
import { courseTitle, i18nOptions, resolveLanguage } from "./index";
import { loadMessages, type MessageNamespace } from "./messages";

const namespaces: MessageNamespace[] = ["common", "roadmap", "exam", "resources", "alumni"];
for (const namespace of namespaces) {
  test(`${namespace} has matching ID/EN keys and interpolation values`, async () => {
    const id = await loadMessages("id", namespace);
    const en = await loadMessages("en", namespace);
    expect(Object.keys(id).sort()).toEqual(Object.keys(en).sort());
    for (const [language, messages] of [
      ["id", id],
      ["en", en],
    ] as const) {
      const instance = createInstance();
      await instance.init({
        ...i18nOptions,
        lng: language,
        resources: { [language]: { [namespace]: messages } },
      });
      for (const [key, value] of Object.entries(messages)) {
        const values = Object.fromEntries(
          [...value.matchAll(/\{\{(\w+)\}\}/g)].map((match) => [match[1], 2]),
        );
        const translated = instance.t(key, { ...values, ns: namespace, keySeparator: false });
        expect(String(translated), `${language}/${namespace}: ${key}`).toBe(
          value.replace(/\{\{\w+\}\}/g, "2"),
        );
      }
    }
    for (const key of Object.keys(id)) {
      expect(en[key].trim()).not.toBe("");
      expect(id[key].match(/\{\{\w+\}\}/g)?.sort() ?? []).toEqual(
        en[key].match(/\{\{\w+\}\}/g)?.sort() ?? [],
      );
    }
  });
}

test("language cookies win over weighted browser language preferences", () => {
  expect(resolveLanguage("id", "en-US,en;q=0.9")).toBe("id");
  expect(resolveLanguage("en", "id")).toBe("en");
  expect(resolveLanguage(undefined, "fr, en-GB;q=0.8,id;q=0.9")).toBe("id");
  expect(resolveLanguage("invalid", "fr,en-US;q=0.8,id;q=0.2")).toBe("en");
  expect(resolveLanguage(undefined, "en;q=0,id;q=bogus")).toBe("id");
  expect(resolveLanguage(undefined, "fr")).toBe("id");
});

test("course names use the requested language with an Indonesian fallback", () => {
  const course = { title: "Basis Data", englishTitle: "Database" };
  expect(courseTitle(course, "id")).toBe("Basis Data");
  expect(courseTitle(course, "en")).toBe("Database");
  expect(courseTitle({ ...course, englishTitle: " " }, "en")).toBe("Basis Data");
});

test("API consumers can create independent instances from shared resources", async () => {
  const id = createInstance();
  const en = createInstance();
  await Promise.all([
    id.init({ ...i18nOptions, lng: "id" }),
    en.init({ ...i18nOptions, lng: "en" }),
  ]);
  expect(id.t("navigation.examArchive")).toBe("Arsip Ujian");
  expect(String(en.t("navigation.examArchive"))).toBe("Exam archive");
  await en.changeLanguage("id");
  expect(id.language).toBe("id");
});
