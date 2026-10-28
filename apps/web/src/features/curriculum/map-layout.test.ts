import { expect, test } from "bun:test";
import { getCurriculum, getRelations, listCurricula } from "@g13/curriculum";
import { buildMap } from "./map-layout";
import { mapConnections } from "./map-connections";
import { isCore } from "./course-utils";

for (const { id } of listCurricula()) {
  test(`${id}: overview connections retain distinct ports and identify optional courses`, () => {
    const data = getCurriculum(id);
    const relations = getRelations(id);
    const map = buildMap(data, data.all, relations, null, "all", () => {});
    expect(map.edges.length).toBe(relations.length);
    expect(
      new Set(mapConnections(map.edges, null, null).map((edge) => edge.data?.traceOffset)).size,
    ).toBe(relations.length);
    for (const edge of map.edges) {
      const source = map.nodes.find((node) => node.id === edge.source);
      const target = map.nodes.find((node) => node.id === edge.target);
      if (source?.data.kind !== "course" || target?.data.kind !== "course")
        throw new Error("Connection endpoints must be courses");
      expect(source.data.outgoing).toContain(edge.target);
      expect(target.data.incoming).toContain(edge.source);
      expect(edge.data?.optional).toBe(!isCore(source.data.course) || !isCore(target.data.course));
    }
    const selected = relations[0].target;
    const focused = buildMap(data, data.all, relations, selected, "all", () => {});
    expect(focused.edges.length).toBeGreaterThan(0);
    expect(
      focused.edges.every((edge) => edge.source === selected || edge.target === selected),
    ).toBe(true);
  });
}
