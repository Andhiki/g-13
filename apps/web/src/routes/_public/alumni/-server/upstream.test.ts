import { expect, spyOn, test } from "bun:test";
import { alumniCache, alumniCdnCache, fetchAlumniPages, strapiOrigin } from "./upstream";

test("Strapi origin falls back to the canonical host for empty or invalid values", () => {
  const original = process.env.STRAPI_ORIGIN;
  try {
    delete process.env.STRAPI_ORIGIN;
    expect(strapiOrigin()).toBe("https://strapi.kagamailkomp.id");
    process.env.STRAPI_ORIGIN = "   ";
    expect(strapiOrigin()).toBe("https://strapi.kagamailkomp.id");
    process.env.STRAPI_ORIGIN = "not a url";
    expect(strapiOrigin()).toBe("https://strapi.kagamailkomp.id");
  } finally {
    if (original === undefined) delete process.env.STRAPI_ORIGIN;
    else process.env.STRAPI_ORIGIN = original;
  }
});

test("Strapi origin accepts a valid override and drops any path", () => {
  const original = process.env.STRAPI_ORIGIN;
  try {
    process.env.STRAPI_ORIGIN = "https://staging.example.com/some/path";
    expect(strapiOrigin()).toBe("https://staging.example.com");
  } finally {
    if (original === undefined) delete process.env.STRAPI_ORIGIN;
    else process.env.STRAPI_ORIGIN = original;
  }
});

test("fetches each upstream page and stops at the reported page count", async () => {
  const fetchSpy = spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(Response.json({ data: [1], meta: { pagination: { pageCount: 2 } } }))
    .mockResolvedValueOnce(Response.json({ data: [2], meta: { pagination: { pageCount: 2 } } }));
  try {
    const pages = await fetchAlumniPages("test-token");
    expect(pages.map((page) => page.data)).toEqual([[1], [2]]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(new URL(String(fetchSpy.mock.calls[1]?.[0])).searchParams.get("pagination[page]")).toBe(
      "2",
    );
    expect(fetchSpy.mock.calls[0]?.[1]?.headers).toEqual({
      authorization: "Bearer test-token",
      accept: "application/json",
    });
  } finally {
    fetchSpy.mockRestore();
  }
});

test("rejects upstream errors without returning partial pages", async () => {
  const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(null, { status: 503 }),
  );
  try {
    await expect(fetchAlumniPages("test-token")).rejects.toThrow("upstream 503");
  } finally {
    fetchSpy.mockRestore();
  }
});

test.each([null, { error: "unavailable" }, { data: {} }])(
  "rejects a successful upstream response with an invalid data envelope",
  async (body) => {
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(Response.json(body));
    try {
      await expect(fetchAlumniPages("test-token")).rejects.toThrow("Invalid alumni upstream data");
    } finally {
      fetchSpy.mockRestore();
    }
  },
);

test("rejects a successful upstream response without pagination metadata", async () => {
  const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ data: [1] }));
  try {
    await expect(fetchAlumniPages("test-token")).rejects.toThrow(
      "Invalid alumni upstream pagination",
    );
  } finally {
    fetchSpy.mockRestore();
  }
});

test("rejects a malformed later page instead of returning a partial directory", async () => {
  const fetchSpy = spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(Response.json({ data: [1], meta: { pagination: { pageCount: 2 } } }))
    .mockResolvedValueOnce(Response.json({ data: [], meta: { pagination: { pageCount: "2" } } }));
  try {
    await expect(fetchAlumniPages("test-token")).rejects.toThrow(
      "Invalid alumni upstream pagination",
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  } finally {
    fetchSpy.mockRestore();
  }
});

test("rejects directories larger than the upstream page limit instead of returning partial data", async () => {
  const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({ data: [1], meta: { pagination: { pageCount: 6 } } }),
  );
  try {
    await expect(fetchAlumniPages("test-token")).rejects.toThrow(
      "Alumni upstream page limit exceeded",
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  } finally {
    fetchSpy.mockRestore();
  }
});

test("accepts a valid empty directory", async () => {
  const body = { data: [], meta: { pagination: { pageCount: 0 } } };
  const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(Response.json(body));
  try {
    expect(await fetchAlumniPages("test-token")).toEqual([body]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  } finally {
    fetchSpy.mockRestore();
  }
});

test("directory policies allow stale serving with separate browser and edge freshness", () => {
  expect(alumniCache).toContain("max-age=300");
  expect(alumniCdnCache).toContain("max-age=3600");
  for (const policy of [alumniCache, alumniCdnCache]) {
    expect(policy).toContain("public");
    expect(policy).toContain("stale-while-revalidate=86400");
    expect(policy).toContain("stale-if-error=86400");
    expect(policy).not.toMatch(/s-maxage|must-revalidate|proxy-revalidate/);
  }
});
