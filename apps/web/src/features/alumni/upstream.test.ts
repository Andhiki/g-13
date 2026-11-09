import { expect, test } from "bun:test";
import { alumniCache, strapiOrigin } from "./upstream";

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

test("the directory response is cacheable at the edge but revalidates in the browser", () => {
  expect(alumniCache).toContain("public");
  expect(alumniCache).toContain("max-age=300");
  expect(alumniCache).toContain("s-maxage=3600");
  expect(alumniCache).toContain("stale-while-revalidate");
});
