import { expect, it } from "bun:test";
import { getVisibleSectionGroups } from "./navigation-sections";

function visiblePaths(role: Parameters<typeof getVisibleSectionGroups>[0]) {
  return getVisibleSectionGroups(role).map((group) => ({
    heading: group.heading,
    paths: group.items.map((item) => item.to),
  }));
}

it("shows all moderation and catalog sections to admins", () => {
  expect(visiblePaths("admin")).toEqual([
    {
      heading: "Moderation",
      paths: [
        "/dashboard/lecturer-reviews",
        "/dashboard/theses",
        "/dashboard/users",
        "/dashboard/announcements",
      ],
    },
    {
      heading: "Catalog",
      paths: ["/dashboard/courses", "/dashboard/lecturers", "/dashboard/resources"],
    },
  ]);
});

it("hides admin-only sections from maintainers", () => {
  expect(visiblePaths("maintainer")).toEqual([
    {
      heading: "Moderation",
      paths: ["/dashboard/lecturer-reviews", "/dashboard/theses"],
    },
    {
      heading: "Catalog",
      paths: ["/dashboard/courses", "/dashboard/lecturers", "/dashboard/resources"],
    },
  ]);
});

it("hides all sections for regular users or unverified roles", () => {
  expect(getVisibleSectionGroups("user")).toEqual([]);
  expect(getVisibleSectionGroups(null)).toEqual([]);
  expect(getVisibleSectionGroups(undefined)).toEqual([]);
});
