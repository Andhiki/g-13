import { describe, expect, test } from "bun:test";
import { curricula, deriveRelations } from "../../data";
import { validateCurriculumSearch } from "../../search";
import { buildMap } from "./map-layout";
import { coursesForScope } from "./scope";

for (const data of Object.values(curricula)) {
  describe(`${data.id} curriculum exploration`, () => {
    const relations = deriveRelations(data);
    const selected = data.id === "2021" ? "MII21-1203" : "PACS262201";
    const prerequisite = data.id === "2021" ? "MII21-1201" : "PAKF262105";
    const dependent = data.id === "2021" ? "MII21-2201" : "PACS262302";

    test("retains prerequisite and follow-on courses when opening a semester-filtered direct link", () => {
      const { mk } = validateCurriculumSearch({ kurikulum: data.id, mk: selected });
      const visible = coursesForScope(data, relations, "__all__", "2");
      const map = buildMap(data, visible, relations, mk!, "2", () => {});
      const courseNodes = map.nodes.filter((node) => node.type === "course");
      const states = new Map(courseNodes.map((node) => [node.id, node.data.state]));

      expect(states.get(selected)).toBe("selected");
      expect(states.get(prerequisite)).toBe("prerequisite");
      expect(states.get(dependent)).toBe("dependent");
      expect([...states.values()]).toContain("unrelated");
      expect(map.edges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ source: prerequisite, target: selected }),
          expect.objectContaining({ source: selected, target: dependent }),
        ]),
      );
      for (const edge of map.edges) {
        expect(edge.source === selected || edge.target === selected).toBe(true);
        const source = courseNodes.find((node) => node.id === edge.source);
        const target = courseNodes.find((node) => node.id === edge.target);
        expect(source?.data.outgoing).toContain(edge.target);
        expect(target?.data.incoming).toContain(edge.source);
      }
    });

    test("highlights an isolated selection without inventing relationships", () => {
      const isolated = data.all.find(
        (course) =>
          !relations.some(
            (relation) => relation.source === course.id || relation.target === course.id,
          ),
      )!;
      const map = buildMap(data, data.all, relations, isolated.id, "all", () => {});
      expect(map.nodes.find((node) => node.id === isolated.id)?.data).toMatchObject({
        state: "selected",
        incoming: [],
        outgoing: [],
      });
      expect(map.edges).toEqual([]);
      const overview = buildMap(data, data.all, relations, null, "all", () => {});
      expect(overview.edges).toEqual([]);
      expect(
        overview.nodes
          .filter((node) => node.type === "course")
          .every((node) => node.data.state === null),
      ).toBe(true);
    });
  });
}
