import { expect, it } from "bun:test";
import { extractDashboardIdentity, parseDashboardIdentity } from "./identity";

it("parses valid dashboard identities and rejects malformed or unknown-role payloads", () => {
  expect(
    parseDashboardIdentity({
      id: "u1",
      name: "Admin User",
      email: "admin@example.test",
      role: "admin",
      image: "https://example.test/avatar.png",
    }),
  ).toEqual({
    id: "u1",
    name: "Admin User",
    email: "admin@example.test",
    role: "admin",
    image: "https://example.test/avatar.png",
  });

  expect(
    parseDashboardIdentity({
      id: "u2",
      name: "Maintainer User",
      role: "maintainer",
    }),
  ).toEqual({
    id: "u2",
    name: "Maintainer User",
    email: null,
    role: "maintainer",
    image: null,
  });

  expect(parseDashboardIdentity({ id: "u3", name: "Regular", role: "user" })).toEqual({
    id: "u3",
    name: "Regular",
    email: null,
    role: "user",
    image: null,
  });

  expect(parseDashboardIdentity(null)).toBeNull();
  expect(parseDashboardIdentity(undefined)).toBeNull();
  expect(parseDashboardIdentity({ id: "u4", name: "Invalid", role: "superadmin" })).toBeNull();
  expect(parseDashboardIdentity({ id: 123, name: "Bad Id", role: "admin" })).toBeNull();
  expect(parseDashboardIdentity({ id: "u5", role: "admin" })).toBeNull();
});

it("extracts dashboard identity from standard and infinite query payloads", () => {
  const identity = {
    id: "u1",
    name: "Maintainer",
    email: null,
    role: "maintainer" as const,
    image: null,
  };

  expect(extractDashboardIdentity({ rows: [], identity })).toEqual(identity);
  expect(extractDashboardIdentity({ pages: [{ rows: [], identity }], pageParams: [null] })).toEqual(
    identity,
  );
  expect(extractDashboardIdentity({ pages: [] })).toBeNull();
  expect(extractDashboardIdentity({ rows: [] })).toBeNull();
  expect(extractDashboardIdentity(null)).toBeNull();
});
