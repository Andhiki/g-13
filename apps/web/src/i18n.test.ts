import { expect, test } from "bun:test";
import { loadMessages } from "@g13/i18n/messages";
import { createI18n, messageNamespace } from "./i18n";
import { examArchive } from "./features/exam-archive/catalog";
import { browseArchive } from "./features/exam-archive/archive";

const common = await loadMessages("en", "common");
const roadmap = await loadMessages("en", "roadmap");
const instance = createI18n({ language: "en", namespace: "roadmap", messages: roadmap, common });
test("exam courses are searchable in either language", async () => {
  const messages = await loadMessages("en", "exam");
  const displayName = (course: (typeof examArchive)[number]) => messages[course.name];
  const english = browseArchive({ location: [], query: "programming", displayName, locale: "en" });
  const indonesian = browseArchive({
    location: [],
    query: "pemrograman",
    displayName,
    locale: "en",
  });
  expect(english.entries.length).toBeGreaterThan(0);
  expect(indonesian.entries.length).toBeGreaterThan(0);
});

test("request instances retain their own language and resource namespaces", () => {
  const id = createI18n({
    language: "id",
    namespace: "resources",
    messages: { example: "Contoh" },
    common: { control: "Kontrol" },
  });
  expect(instance.language).toBe("en");
  expect(id.language).toBe("id");
  expect(instance.hasResourceBundle("id", "resources")).toBe(false);
});

test("namespace selection follows case-insensitive routes and trailing slashes", () => {
  for (const namespace of ["roadmap", "exam", "resources", "alumni"] as const) {
    expect(messageNamespace(`/${namespace}`)).toBe(namespace);
    expect(messageNamespace(`/${namespace.toUpperCase()}/`)).toBe(namespace);
  }
  expect(messageNamespace("/")).toBe("common");
  expect(messageNamespace("/missing-route")).toBe("common");
});
