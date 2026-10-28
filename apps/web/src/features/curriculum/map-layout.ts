import type { Edge, Node } from "@xyflow/react";
import type { Course, Curriculum, Relation } from "@g13/curriculum";
import { mapCourseState, type MapCourseState } from "./map-state";
import { assignedCoreSemester, isCore } from "./course-utils";
import type { Scope } from "./scope";

type CourseNodeData = {
  kind: "course";
  course: Course;
  state: MapCourseState;
  incoming: string[];
  outgoing: string[];
  choose: (id: string) => void;
};
type LaneNodeData = {
  kind: "lane";
  title: string;
  active: boolean;
};
export type MapNode = Node<CourseNodeData, "course"> | Node<LaneNodeData, "lane">;
export type { CourseNodeData, LaneNodeData };

export const LANE_X = 48;
export const LANE_STEP = 360;
export const LANE_WIDTH = 270;
const CHOICE_COLUMNS = 3;
const ROW_STEP = 120;
const COURSE_X_OFFSET = 12;
const COURSE_Y_START = 156;

export function buildMap(
  data: Curriculum,
  visible: Course[],
  relations: Relation[],
  selectedId: string | null,
  scope: Scope,
  choose: (id: string) => void,
  anchor?: { x: number; y: number },
): {
  nodes: MapNode[];
  edges: Edge[];
  positions: Map<string, { x: number; y: number }>;
  relationCount: number;
} {
  const focusedRelations = selectedId
    ? relations.filter(
        (relation) => relation.source === selectedId || relation.target === selectedId,
      )
    : [];
  const focusedIds = new Set([
    selectedId,
    ...focusedRelations.flatMap((relation) => [relation.source, relation.target]),
  ]);
  const courses = selectedId ? data.all.filter((course) => focusedIds.has(course.id)) : visible;
  const visibleIds = new Set(courses.map((course) => course.id));
  const choiceStartX = LANE_X + 8 * LANE_STEP;
  const layoutCore = new Map<number, Course[]>();
  for (let term = 1; term <= 8; term += 1) {
    const courses = data.all
      .filter((course) => assignedCoreSemester(course) === term)
      .sort((a, b) => a.title.localeCompare(b.title, "id"));
    layoutCore.set(term, courses);
  }
  const choices = data.all
    .filter((course) => !isCore(course))
    .sort((a, b) => {
      const aGroup = a.placements.find((item) => item.section !== "core")?.group ?? "";
      const bGroup = b.placements.find((item) => item.section !== "core")?.group ?? "";
      return aGroup.localeCompare(bGroup, "id") || a.title.localeCompare(b.title, "id");
    });

  const nodes: MapNode[] = [];
  const positions = new Map<string, { x: number; y: number }>();
  for (let term = 1; term <= 8; term += 1) {
    const courses = layoutCore.get(term) ?? [];
    nodes.push({
      id: "lane-semester-" + term,
      type: "lane",
      position: { x: LANE_X + (term - 1) * LANE_STEP, y: 100 },
      className: "w-[270px]! h-10!",
      zIndex: -1,
      data: {
        kind: "lane",
        title: "Semester " + term,
        active: scope === String(term),
      },
      selectable: false,
      draggable: false,
      connectable: false,
    });
    courses.forEach((course, index) => {
      if (!visibleIds.has(course.id)) return;
      const position = {
        x: LANE_X + (term - 1) * LANE_STEP + COURSE_X_OFFSET,
        y: COURSE_Y_START + index * ROW_STEP,
      };
      positions.set(course.id, position);
    });
  }

  nodes.push({
    id: "lane-choices",
    type: "lane",
    position: { x: choiceStartX, y: 100 },
    className: "w-[990px]! h-10!",
    zIndex: -1,
    data: {
      kind: "lane",
      title: "Pilihan",
      active: scope === "choices",
    },
    selectable: false,
    draggable: false,
    connectable: false,
  });
  choices.forEach((course, index) => {
    if (!visibleIds.has(course.id)) return;
    const column = index % CHOICE_COLUMNS;
    const row = Math.floor(index / CHOICE_COLUMNS);
    const position = {
      x: choiceStartX + COURSE_X_OFFSET + column * LANE_STEP,
      y: COURSE_Y_START + row * ROW_STEP,
    };
    positions.set(course.id, position);
  });

  const availableRelations = relations.filter(
    (relation) => visibleIds.has(relation.source) && visibleIds.has(relation.target),
  );
  if (selectedId) {
    nodes.length = 0;
    const center = anchor ?? positions.get(selectedId)!;
    positions.set(selectedId, center);
    for (const side of ["source", "target"] as const) {
      const neighbors = focusedRelations
        .filter((relation) => relation[side] !== selectedId)
        .map((relation) => relation[side])
        .sort((a, b) => (positions.get(a)?.y ?? 0) - (positions.get(b)?.y ?? 0));
      neighbors.forEach((id, index) => {
        positions.set(id, {
          x: center.x + (side === "source" ? -LANE_STEP : LANE_STEP),
          y: center.y + (index - (neighbors.length - 1) / 2) * ROW_STEP,
        });
      });
    }
  }
  const connections = selectedId ? focusedRelations : availableRelations;
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const relation of connections) {
    outgoing.set(relation.source, [...(outgoing.get(relation.source) ?? []), relation.target]);
    incoming.set(relation.target, [...(incoming.get(relation.target) ?? []), relation.source]);
  }
  const byVerticalPosition = (left: string, right: string) =>
    (positions.get(left)?.y ?? 0) - (positions.get(right)?.y ?? 0);
  for (const course of courses) {
    const position = positions.get(course.id);
    if (!position) continue;
    nodes.push({
      id: course.id,
      type: "course",
      position,
      data: {
        kind: "course",
        course,
        state: mapCourseState(
          course.id,
          selectedId,
          incoming.get(course.id) ?? [],
          outgoing.get(course.id) ?? [],
        ),
        incoming: (incoming.get(course.id) ?? []).sort(byVerticalPosition),
        outgoing: (outgoing.get(course.id) ?? []).sort(byVerticalPosition),
        choose,
      },
      className: "pointer-events-auto!",
      zIndex: 2,
    });
  }

  const coreIds = new Set(data.all.filter(isCore).map((course) => course.id));
  const edges: Edge[] = connections.map((relation) => {
    const isPrerequisite = relation.target === selectedId;
    return {
      id: relation.source + "->" + relation.target,
      source: relation.source,
      sourceHandle: "out",
      target: relation.target,
      targetHandle: "in",
      type: "default",
      zIndex: 3,
      data: {
        optional: !coreIds.has(relation.source) || !coreIds.has(relation.target),
      },
      style: {
        stroke: selectedId
          ? isPrerequisite
            ? "var(--color-warning-dark)"
            : "var(--color-feature-dark)"
          : "var(--color-text-soft-400)",
        strokeWidth: selectedId ? 2.2 : 1.2,
      },
    };
  });
  return { nodes, edges, positions, relationCount: availableRelations.length };
}
