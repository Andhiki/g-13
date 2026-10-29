import { expect, test } from "bun:test";
import { getCurriculum, getRelations, listCurricula } from "@g13/curriculum";
import { buildMap, createMapLayout, anchorMap } from "./map-layout";
import { assignedCoreSemester, isCore } from "./course-utils";

for (const { id } of listCurricula()) {
  test(`${id}: overview connections retain endpoint relations and identify optional courses`, () => {
    const data = getCurriculum(id);
    const relations = getRelations(id);
    const map = buildMap(createMapLayout(data, relations), data.all, null, () => {});
    const semesters = new Map(data.all.map((course) => [course.id, assignedCoreSemester(course)]));
    const sameSemester = relations.filter(
      (relation) =>
        semesters.get(relation.source) !== null &&
        semesters.get(relation.source) === semesters.get(relation.target),
    );
    expect(map.edges.length).toBe(relations.length - sameSemester.length);
    expect(map.relationCount).toBe(map.edges.length);
    for (const relation of sameSemester) {
      expect(
        map.edges.some(
          (edge) => edge.source === relation.source && edge.target === relation.target,
        ),
      ).toBe(false);
      const focused = buildMap(
        createMapLayout(data, relations),
        data.all,
        relation.target,
        () => {},
      );
      expect(focused.edges.some((edge) => edge.source === relation.source)).toBe(false);
    }
    for (const edge of map.edges) {
      const source = map.nodes.find((node) => node.id === edge.source);
      const target = map.nodes.find((node) => node.id === edge.target);
      if (source?.data.kind !== "course" || target?.data.kind !== "course")
        throw new Error("Connection endpoints must be courses");
      expect(source.data.outgoing).toContain(edge.target);
      expect(target.data.incoming).toContain(edge.source);
      expect(edge.data?.optional).toBe(!isCore(source.data.course) || !isCore(target.data.course));
    }
    const selected = map.edges[0].target;
    const focused = buildMap(createMapLayout(data, relations), data.all, selected, () => {});
    expect(focused.edges.length).toBeGreaterThan(0);
    expect(
      focused.edges.every((edge) => edge.source === selected || edge.target === selected),
    ).toBe(true);
  });
}

for (const { id } of listCurricula()) {
  test(`${id}: empty trailing semester is omitted and electives sit below every semester`, () => {
    const data = getCurriculum(id);
    const map = buildMap(createMapLayout(data, getRelations(id)), data.all, null, () => {});
    expect(map.nodes.some((node) => node.id === "lane-semester-8")).toBe(false);
    expect(map.lastSemester).toBe(7);
    const choices = map.nodes.find((node) => node.id === "lane-choices")!;
    const coreNodes = map.nodes.filter(
      (node) => node.type === "course" && isCore(node.data.course),
    );
    expect(choices.position.x).toBe(48);
    expect(choices.position.y).toBeGreaterThan(
      Math.max(...coreNodes.map((node) => node.position.y + 82)),
    );
    const electives = map.nodes.filter(
      (node) => node.type === "course" && !isCore(node.data.course),
    );
    expect(electives.length).toBe(data.all.filter((course) => !isCore(course)).length);
    expect(new Set(electives.map((node) => node.id)).size).toBe(electives.length);
    for (const node of electives) {
      if (node.type !== "course") throw new Error("Expected elective course node");
      const group = node.data.course.placements.find(
        (placement) => placement.section !== "core",
      )!.group;
      const heading = map.nodes.find(
        (node) => node.data.kind === "lane" && node.data.title === group,
      )!;
      expect(node.position.x).toBeGreaterThanOrEqual(heading.position.x + 12);
      expect(node.position.x + 246).toBeLessThanOrEqual(
        heading.position.x + Number(heading.style!.width),
      );
      expect(node.position.y).toBeLessThan(heading.position.y + 72 + 6 * 120);
      expect(node.position.y).toBeGreaterThan(heading.position.y + 56);
      expect(node.position.x).toBeLessThan(48 + 8 * 360);
    }
    const eighth = {
      ...data.core[0],
      id: "semester-eight-course",
      placements: data.core[0].placements.map((placement) => ({ ...placement, semester: 8 })),
    };
    const populated = { ...data, all: [...data.all, eighth], core: [...data.core, eighth] };
    const withEighth = buildMap(
      createMapLayout(populated, getRelations(id)),
      populated.all,
      null,
      () => {},
    );
    expect(withEighth.lastSemester).toBe(8);
    expect(withEighth.nodes.some((node) => node.id === "lane-semester-8")).toBe(true);
    expect(withEighth.positions.has(eighth.id)).toBe(true);
  });
}

test("ungrouped electives appear under Miscellaneous and extra groups wrap below", () => {
  const data = getCurriculum("2026");
  const template = data.electives.find((course) => !isCore(course))!;
  const electives = Array.from({ length: 10 }, (_, index) => ({
    ...template,
    id: `choice-${index}`,
    placements: template.placements.map((placement) => ({
      ...placement,
      group: index === 9 ? "" : `Group ${index}`,
    })),
  }));
  const fixture = { ...data, all: [...data.core, ...electives], electives };
  const map = buildMap(createMapLayout(fixture, []), fixture.all, null, () => {});
  const first = map.positions.get("choice-0")!;
  const wrapped = map.positions.get("choice-8")!;
  expect(wrapped.x).toBe(first.x);
  expect(wrapped.y).toBeGreaterThan(first.y + 82);
  const fallback = map.nodes.find(
    (node) => node.data.kind === "lane" && node.data.title === "Miscellaneous",
  )!;
  expect(fallback).toBeDefined();
  expect(map.positions.get("choice-9")!.x).toBe(fallback.position.x + 12);
  const filtered = buildMap(createMapLayout(fixture, []), [electives[9]], null, () => {});
  expect(filtered.positions.size).toBe(1);
  expect(filtered.positions.get("choice-9")).toEqual(map.positions.get("choice-9"));
  expect(filtered.nodes.filter((node) => node.id.startsWith("lane-choice-group-")).length).toBe(1);
});

for (const count of [6, 7, 48, 49]) {
  test(`an elective category with ${count} courses caps columns at six rows and wraps within eight columns`, () => {
    const data = getCurriculum("2026");
    const template = data.electives.find((course) => !isCore(course))!;
    const electives = Array.from({ length: count }, (_, index) => ({
      ...template,
      id: `choice-${index}`,
      title: `Course ${String(index).padStart(2, "0")}`,
      placements: template.placements.map((placement) => ({ ...placement, group: "Test group" })),
    }));
    const fixture = { ...data, all: [...data.core, ...electives], electives };
    const map = buildMap(createMapLayout(fixture, []), fixture.all, null, () => {});
    const positions = electives.map((course) => map.positions.get(course.id)!);
    expect(new Set(positions.map(({ x, y }) => `${x}:${y}`)).size).toBe(count);
    const first = positions[0];
    expect(positions[5].y).toBe(first.y + 5 * 120);
    if (count > 6) {
      expect(positions[6]).toEqual({ x: first.x + 360, y: first.y });
    }
    for (const position of positions) {
      expect(position.x).toBeLessThan(48 + 8 * 360);
    }
    if (count <= 48) {
      expect(Math.max(...positions.map((position) => position.y))).toBe(first.y + 5 * 120);
    } else {
      expect(positions[48].x).toBe(first.x);
      expect(positions[48].y).toBeGreaterThan(first.y + 6 * 120);
    }
  });
}

for (const { id } of listCurricula()) {
  test(`${id}: semester rows shorten prerequisite connections and stay stable when filtered`, () => {
    const data = getCurriculum(id);
    const relations = getRelations(id);
    const map = buildMap(createMapLayout(data, relations), data.all, null, () => {});
    const alphabetical = new Map<string, number>();
    for (let term = 1; term <= map.lastSemester; term++) {
      const courses = data.all
        .filter((course) => assignedCoreSemester(course) === term)
        .sort((a, b) => a.title.localeCompare(b.title, "id"));
      courses.forEach((course, row) => alphabetical.set(course.id, 156 + row * 120));
      const positions = courses.map((course) => map.positions.get(course.id)!);
      expect(new Set(positions.map(({ x }) => x)).size).toBe(courses.length ? 1 : 0);
      expect(new Set(positions.map(({ y }) => y)).size).toBe(courses.length);
      for (const position of positions) expect(position.x).toBe(60 + (term - 1) * 360);
    }
    const connections = map.edges.filter(
      (edge) => alphabetical.has(edge.source) && alphabetical.has(edge.target),
    );
    const before = connections.reduce(
      (sum, edge) =>
        sum + Math.abs(alphabetical.get(edge.source)! - alphabetical.get(edge.target)!),
      0,
    );
    const after = connections.reduce(
      (sum, edge) =>
        sum + Math.abs(map.positions.get(edge.source)!.y - map.positions.get(edge.target)!.y),
      0,
    );
    expect(after).toBeLessThan(before);
    const subset = data.core.slice(0, 5);
    const filtered = buildMap(createMapLayout(data, relations), subset, null, () => {});
    for (const course of subset)
      expect(filtered.positions.get(course.id)).toEqual(map.positions.get(course.id));
    expect(buildMap(createMapLayout(data, relations), data.all, null, () => {}).positions).toEqual(
      map.positions,
    );
  });
}

for (const { id } of listCurricula()) {
  test(`${id}: prepared layouts can build every focus view without changing overview geometry`, () => {
    const data = getCurriculum(id);
    const layout = createMapLayout(data, getRelations(id));
    const overview = buildMap(layout, data.all, null, () => {});
    const original = new Map(layout.positions);
    for (const course of data.all) {
      const focused = buildMap(layout, data.all, course.id, () => {});
      const before = new Map(focused.positions);
      const anchor = { x: 700, y: 300 };
      const anchored = anchorMap(focused, course.id, anchor);
      expect(anchored.positions.get(course.id)).toEqual(anchor);
      const center = focused.positions.get(course.id)!;
      for (const node of anchored.nodes) {
        const position = focused.positions.get(node.id)!;
        expect(node.position).toEqual({
          x: position.x + anchor.x - center.x,
          y: position.y + anchor.y - center.y,
        });
      }
      expect(focused.positions).toEqual(before);
    }
    expect(layout.positions).toEqual(original);
    expect(overview.positions).toEqual(original);
  });
}
