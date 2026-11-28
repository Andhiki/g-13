import { expect, test } from "bun:test";
import { parseAlumniDirectory } from "../-shared/directory";
import { alumniCache, alumniCdnCache } from "./upstream";
import { alumniDirectoryResponse, loadAlumniDirectory } from "./directory";

const page = {
  data: [
    { id: 2, name: "Bima", batch: 2020, kontak: { linkedin: "linkedin.com/in/bima" } },
    { id: 1, name: "Alya", batch: 2021 },
  ],
  meta: { pagination: { page: 1, pageCount: 1, total: 2 } },
};
const source = (pages: () => Promise<unknown[]>, token: string | null = "token") => ({
  token: () => token ?? undefined,
  fetchPages: pages as never,
});

test("a configured directory responds with sanitised, cacheable data that round-trips", async () => {
  const response = alumniDirectoryResponse(await loadAlumniDirectory(source(async () => [page])));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe(alumniCache);
  expect(response.headers.get("cdn-cache-control")).toBe(alumniCdnCache);
  const data = parseAlumniDirectory(await response.json());
  expect(data?.items.map((item) => item.name)).toEqual(["Alya", "Bima"]);
  expect(data?.items[1]?.linkedin).toBe("https://www.linkedin.com/in/bima");
});

test("an unconfigured directory is an uncached 503 without calling upstream", async () => {
  let calls = 0;
  const result = await loadAlumniDirectory(
    source(async () => {
      calls++;
      return [];
    }, null),
  );
  const response = alumniDirectoryResponse(result);
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(calls).toBe(0);
});

test("an upstream failure is an uncached 502 that leaks no detail", async () => {
  const response = alumniDirectoryResponse(
    await loadAlumniDirectory(
      source(async () => {
        throw new Error("https://strapi.example/api?token=secret-fragment");
      }),
    ),
  );
  expect(response.status).toBe(502);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.text()).not.toContain("secret");
});

test("directory JSON that is not directory data is rejected", () => {
  for (const value of [
    null,
    { error: "upstream" },
    { items: [{ id: 1, name: "A" }], batches: [], total: 1 },
    { items: [], batches: [], total: -1 },
  ]) {
    expect(parseAlumniDirectory(value)).toBeNull();
  }
  expect(parseAlumniDirectory({ items: [], batches: [], total: 0 })).toEqual({
    items: [],
    batches: [],
    total: 0,
  });
});
