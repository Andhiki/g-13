import type { CSSProperties } from "react";
import type { Edge } from "@xyflow/react";
import type { Course, Relation } from "@g13/curriculum";
import { isCore } from "@/courses/course-utils";
import type { CourseNodeData, LaneNodeData, MapCourseState, MapNode } from "./model";

export type CourseNode = Extract<MapNode, { type: "course" }>;
export type LaneNode = Extract<MapNode, { type: "lane" }>;

function courseSelectionState(
  courseId: string,
  selectedId: string | null,
  incoming: string[],
  outgoing: string[],
): MapCourseState {
  if (!selectedId) return null;
  if (courseId === selectedId) return "selected";
  if (outgoing.includes(selectedId)) return "prerequisite";
  if (incoming.includes(selectedId)) return "dependent";
  return "unrelated";
}

/** Filters out prerequisites that fall in the same semester as their target course. */
export function crossSemesterRelations(
  relations: Relation[],
  semesters: ReadonlyMap<string, number | null>,
): Relation[] {
  return relations.filter(({ source, target }) => {
    const sourceSemester = semesters.get(source);
    const targetSemester = semesters.get(target);
    return sourceSemester == null || targetSemester == null || sourceSemester !== targetSemester;
  });
}

export function createLaneNode(options: {
  id: string;
  title: string;
  position: { x: number; y: number };
  active?: boolean;
  style?: CSSProperties;
  className?: string;
  zIndex?: number;
  locked?: boolean;
}): LaneNode {
  const data: LaneNodeData = {
    kind: "lane",
    title: options.title,
    active: options.active ?? false,
  };
  return {
    id: options.id,
    type: "lane",
    position: options.position,
    ...(options.style ? { style: options.style } : {}),
    ...(options.className ? { className: options.className } : {}),
    ...(options.zIndex !== undefined ? { zIndex: options.zIndex } : {}),
    data,
    selectable: false,
    ...(options.locked ? { draggable: false, connectable: false } : {}),
  };
}

/** Updates a course node's focus state, click handler, and optional focused position. */
export function withCourseFocus(
  node: CourseNode,
  selectedId: string | null,
  choose: (id: string) => void,
  position?: { x: number; y: number },
): CourseNode {
  return {
    ...node,
    ...(position ? { position } : {}),
    data: {
      ...node.data,
      choose,
      state: courseSelectionState(node.id, selectedId, node.data.incoming, node.data.outgoing),
    },
  };
}

export type CoursePlacement = {
  course: Course;
  position: { x: number; y: number };
  className?: string;
};

export function buildCourseGraph(options: {
  placements: CoursePlacement[];
  relations: Relation[];
  selectedId: string | null;
  choose: (id: string) => void;
  sortNeighborsByY?: boolean;
  coreIds?: ReadonlySet<string>;
  edgeType?: "default" | "routed";
  edgeStyle?: (relation: Relation) => CSSProperties;
  edgeZIndex?: (relation: Relation) => number;
}): { nodes: CourseNode[]; edges: Edge[] } {
  const { placements, relations, selectedId, choose } = options;
  const positions = new Map(placements.map(({ course, position }) => [course.id, position]));
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const relation of relations) {
    outgoing.set(relation.source, [...(outgoing.get(relation.source) ?? []), relation.target]);
    incoming.set(relation.target, [...(incoming.get(relation.target) ?? []), relation.source]);
  }
  const byVerticalPosition = (left: string, right: string) =>
    (positions.get(left)?.y ?? 0) - (positions.get(right)?.y ?? 0);

  const nodes: CourseNode[] = placements.map(({ course, position, className }) => {
    const courseIncoming = incoming.get(course.id) ?? [];
    const courseOutgoing = outgoing.get(course.id) ?? [];
    if (options.sortNeighborsByY) {
      courseIncoming.sort(byVerticalPosition);
      courseOutgoing.sort(byVerticalPosition);
    }
    const data: CourseNodeData = {
      kind: "course",
      course,
      state: courseSelectionState(course.id, selectedId, courseIncoming, courseOutgoing),
      incoming: courseIncoming,
      outgoing: courseOutgoing,
      choose,
    };
    return {
      id: course.id,
      type: "course",
      position,
      data,
      className: className ?? "pointer-events-auto!",
      zIndex: 2,
    };
  });

  const coreIds =
    options.coreIds ??
    new Set(placements.filter(({ course }) => isCore(course)).map(({ course }) => course.id));
  const edgeType = options.edgeType ?? "routed";
  const edges: Edge[] = relations.map((relation) => ({
    id: `${relation.source}->${relation.target}`,
    type: edgeType,
    source: relation.source,
    target: relation.target,
    sourceHandle: "out",
    targetHandle: "in",
    data: {
      optional: !coreIds.has(relation.source) || !coreIds.has(relation.target),
    },
    ...(options.edgeStyle ? { style: options.edgeStyle(relation) } : {}),
    ...(options.edgeZIndex ? { zIndex: options.edgeZIndex(relation) } : {}),
  }));

  return { nodes, edges };
}
