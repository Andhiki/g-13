import { expect, test } from "bun:test";
import { getCurriculum, getRelations, listCurricula } from "@g13/curriculum";
import { buildMap } from "./map-layout";
import { assignedCoreSemester, isCore } from "./course-utils";

for (const { id } of listCurricula()) {
  test(`${id}: overview connections retain endpoint relations and identify optional courses`, () => {
    const data = getCurriculum(id);
    const relations = getRelations(id);
    const map = buildMap(data, data.all, relations, null, "all", () => {});
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
      const focused = buildMap(data, data.all, relations, relation.target, "all", () => {});
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
    const focused = buildMap(data, data.all, relations, selected, "all", () => {});
    expect(focused.edges.length).toBeGreaterThan(0);
    expect(
      focused.edges.every((edge) => edge.source === selected || edge.target === selected),
    ).toBe(true);
  });
}

for (const { id } of listCurricula()) {
  test(`${id}: empty trailing semester is omitted and electives follow the last occupied semester`, () => {
    const data = getCurriculum(id);
    const map = buildMap(data, data.all, getRelations(id), null, "all", () => {});
    expect(map.nodes.some((node) => node.id === "lane-semester-8")).toBe(false);
    expect(map.lastSemester).toBe(7);
    const seventh = map.nodes.find((node) => node.id === "lane-semester-7")!;
    const choices = map.nodes.find((node) => node.id === "lane-choices")!;
    expect(choices.position.x - seventh.position.x).toBe(360);
    const eighth = {
      ...data.core[0],
      id: "semester-eight-course",
      placements: data.core[0].placements.map((placement) => ({ ...placement, semester: 8 })),
    };
    const populated = { ...data, all: [...data.all, eighth], core: [...data.core, eighth] };
    const withEighth = buildMap(populated, populated.all, getRelations(id), null, "all", () => {});
    expect(withEighth.lastSemester).toBe(8);
    expect(withEighth.nodes.some((node) => node.id === "lane-semester-8")).toBe(true);
    expect(withEighth.positions.has(eighth.id)).toBe(true);
  });
}
