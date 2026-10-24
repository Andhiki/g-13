import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { Course, Curriculum, Relation } from "../../data";
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
const ROW_STEP = 96;
const COURSE_X_OFFSET = 12;
const COURSE_Y_START = 156;

export function buildMap(
  data: Curriculum,
  visible: Course[],
  relations: Relation[],
  selectedId: string | null,
  scope: Scope,
  choose: (id: string) => void,
): {
  nodes: MapNode[];
  edges: Edge[];
  positions: Map<string, { x: number; y: number }>;
  relationCount: number;
} {
  const visibleIds = new Set(visible.map((course) => course.id));
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
      style: { width: LANE_WIDTH, height: 40, zIndex: -1 },
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
    style: {
      width: CHOICE_COLUMNS * LANE_WIDTH + (CHOICE_COLUMNS - 1) * (LANE_STEP - LANE_WIDTH),
      height: 40,
      zIndex: -1,
    },
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
  const focusedRelations = selectedId
    ? availableRelations.filter(
        (relation) => relation.source === selectedId || relation.target === selectedId,
      )
    : [];
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const relation of focusedRelations) {
    outgoing.set(relation.source, [...(outgoing.get(relation.source) ?? []), relation.target]);
    incoming.set(relation.target, [...(incoming.get(relation.target) ?? []), relation.source]);
  }
  const byVerticalPosition = (left: string, right: string) =>
    (positions.get(left)?.y ?? 0) - (positions.get(right)?.y ?? 0);
  for (const course of visible) {
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
      style: { pointerEvents: "all" },
      zIndex: 2,
    });
  }

  const edges: Edge[] = focusedRelations.map((relation) => {
    const isPrerequisite = relation.target === selectedId;
    const color = isPrerequisite ? "var(--map-prerequisite)" : "var(--map-dependent)";
    return {
      id: relation.source + "->" + relation.target,
      source: relation.source,
      sourceHandle: "out:" + relation.target,
      target: relation.target,
      targetHandle: "in:" + relation.source,
      type: "default",
      zIndex: 3,
      markerEnd: { type: MarkerType.ArrowClosed, color },
      style: { stroke: color, strokeWidth: 2.2, opacity: 1 },
    };
  });
  return { nodes, edges, positions, relationCount: availableRelations.length };
}
