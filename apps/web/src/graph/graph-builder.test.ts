import { describe, expect, it } from "bun:test";
import { getCurriculum, type Relation } from "@g13/curriculum";
import {
  buildCourseGraph,
  createLaneNode,
  crossSemesterRelations,
  withCourseFocus,
} from "./graph-builder";

const [coreA, coreB] = getCurriculum("2021").core;
const elective = getCurriculum("2021").electives[0];

describe("crossSemesterRelations", () => {
  it("omits same-semester prerequisites without mutating the source relations", () => {
    const relations: Relation[] = [
      { source: "a", target: "b", timing: "before" },
      { source: "a", target: "c", timing: "before" },
      { source: "a", target: "elective", timing: "before" },
      { source: "elective", target: "unscheduled", timing: "before" },
    ];
    const semesters = new Map<string, number | null>([
      ["a", 2],
      ["b", 2],
      ["c", 3],
      ["elective", null],
      ["unscheduled", null],
    ]);

    expect(crossSemesterRelations(relations, semesters)).toEqual(relations.slice(1));
    expect(relations).toHaveLength(4);
  });
});

describe("createLaneNode", () => {
  it("builds non-selectable lane nodes with optional locking", () => {
    const lane = createLaneNode({
      id: "lane-1",
      title: "Semester 1",
      position: { x: 48, y: 100 },
      active: true,
      locked: true,
      zIndex: -1,
    });

    expect(lane).toMatchObject({
      id: "lane-1",
      type: "lane",
      position: { x: 48, y: 100 },
      selectable: false,
      draggable: false,
      connectable: false,
      zIndex: -1,
      data: { kind: "lane", title: "Semester 1", active: true },
    });
  });
});

describe("buildCourseGraph and withCourseFocus", () => {
  it("constructs course nodes with adjacency, focus state, and optional edge flags", () => {
    const choose = () => {};
    const relations: Relation[] = [
      { source: coreA.id, target: coreB.id, timing: "before" },
      { source: coreB.id, target: elective.id, timing: "before" },
    ];
    const { nodes, edges } = buildCourseGraph({
      placements: [
        { course: coreA, position: { x: 0, y: 100 } },
        { course: coreB, position: { x: 360, y: 100 } },
        {
          course: elective,
          position: { x: 720, y: 200 },
          className: "pointer-events-auto! custom",
        },
      ],
      relations,
      selectedId: coreB.id,
      choose,
      sortNeighborsByY: true,
    });

    expect(nodes.map((node) => [node.id, node.data.state])).toEqual([
      [coreA.id, "prerequisite"],
      [coreB.id, "selected"],
      [elective.id, "dependent"],
    ]);
    expect(nodes[2].className).toBe("pointer-events-auto! custom");
    expect(edges.map((edge) => [edge.id, edge.data?.optional])).toEqual([
      [`${coreA.id}->${coreB.id}`, false],
      [`${coreB.id}->${elective.id}`, true],
    ]);

    const refocused = withCourseFocus(nodes[0], coreA.id, choose, { x: 10, y: 20 });
    expect(refocused.data.state).toBe("selected");
    expect(refocused.position).toEqual({ x: 10, y: 20 });
  });
});
