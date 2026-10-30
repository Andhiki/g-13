import type { Edge } from "@xyflow/react";
import type { Course, Curriculum, Relation } from "@g13/curriculum";
import { mapCourseState } from "../../graph/map-state";
import { assignedCoreSemester, isCore } from "../../courses/course-utils";
import { semesterRelations } from "../../graph/semester-relations";

import { LANE_X, LANE_STEP, LANE_WIDTH, type MapNode } from "../../graph/model";
const CHOICE_COLUMNS = 8;
const CHOICE_ROWS = 6;
const ROW_STEP = 120;
const COURSE_X_OFFSET = 12;
const COURSE_Y_START = 156;

function shortenConnections(semesters: Map<number, Course[]>, relations: Relation[]) {
  const rows = new Map<string, number>();
  for (const courses of semesters.values())
    courses.forEach((course, row) => rows.set(course.id, row));
  const neighbors = new Map<string, string[]>();
  for (const { source, target } of relations) {
    if (!rows.has(source) || !rows.has(target)) continue;
    neighbors.set(source, [...(neighbors.get(source) ?? []), target]);
    neighbors.set(target, [...(neighbors.get(target) ?? []), source]);
  }
  for (const courses of semesters.values()) {
    courses.sort((a, b) => Number(neighbors.has(b.id)) - Number(neighbors.has(a.id)));
    courses.forEach((course, row) => rows.set(course.id, row));
  }
  const distance = (id: string, row: number) =>
    (neighbors.get(id) ?? []).reduce(
      (sum, neighbor) => sum + Math.abs(row - rows.get(neighbor)!),
      0,
    );
  let improved = true;
  while (improved) {
    improved = false;
    for (const courses of semesters.values()) {
      for (let a = 0; a < courses.length; a++) {
        for (let b = a + 1; b < courses.length; b++) {
          const first = courses[a],
            second = courses[b];
          if (
            distance(first.id, b) + distance(second.id, a) >=
            distance(first.id, a) + distance(second.id, b)
          )
            continue;
          courses[a] = second;
          courses[b] = first;
          rows.set(first.id, b);
          rows.set(second.id, a);
          improved = true;
        }
      }
    }
  }
}

export function createMapLayout(data: Curriculum, relations: Relation[]) {
  const graphRelations = semesterRelations(
    relations,
    new Map(data.all.map((course) => [course.id, assignedCoreSemester(course)])),
  );
  const lastSemester = Math.max(1, ...data.core.map((course) => assignedCoreSemester(course) ?? 0));
  const layoutCore = new Map<number, Course[]>();
  for (let term = 1; term <= lastSemester; term += 1) {
    const courses = data.all
      .filter((course) => assignedCoreSemester(course) === term)
      .sort((a, b) => a.title.localeCompare(b.title, "id"));
    layoutCore.set(term, courses);
  }
  shortenConnections(layoutCore, graphRelations);
  const choiceGroups = new Map<string, Course[]>();
  for (const course of data.all.filter((course) => !isCore(course))) {
    const group =
      course.placements.find((item) => item.section !== "core" && item.group.trim())?.group ??
      "Miscellaneous";
    const grouped = choiceGroups.get(group) ?? [];
    grouped.push(course);
    choiceGroups.set(group, grouped);
  }
  const groups = [...choiceGroups].sort(([a], [b]) =>
    a === "Miscellaneous" ? 1 : b === "Miscellaneous" ? -1 : a.localeCompare(b, "id"),
  );
  const choiceStartY =
    COURSE_Y_START +
    Math.max(0, ...[...layoutCore.values()].map((courses) => courses.length)) * ROW_STEP +
    80;

  const nodes: MapNode[] = [];
  const positions = new Map<string, { x: number; y: number }>();
  for (let term = 1; term <= lastSemester; term += 1) {
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
        active: false,
      },
      selectable: false,
      draggable: false,
      connectable: false,
    });
    courses.forEach((course, index) => {
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
    position: { x: LANE_X, y: choiceStartY },
    style: { width: (CHOICE_COLUMNS - 1) * LANE_STEP + LANE_WIDTH, height: 40 },
    zIndex: -1,
    data: {
      kind: "lane",
      title: "Mata Kuliah Pilihan",
      active: false,
    },
    selectable: false,
    draggable: false,
    connectable: false,
  });
  const choiceMembers = new Map<string, string[]>();
  let groupY = choiceStartY + 64;
  let column = 0;
  let rowHeight = 0;
  for (const [group, courses] of groups) {
    courses.sort((a, b) => a.title.localeCompare(b.title, "id"));
    for (let offset = 0; offset < courses.length; offset += CHOICE_COLUMNS * CHOICE_ROWS) {
      const chunk = courses.slice(offset, offset + CHOICE_COLUMNS * CHOICE_ROWS);
      const columns = Math.ceil(chunk.length / CHOICE_ROWS);
      if (column + columns > CHOICE_COLUMNS) {
        groupY += 72 + rowHeight * ROW_STEP + 64;
        column = 0;
        rowHeight = 0;
      }
      const x = LANE_X + column * LANE_STEP;
      const id = `lane-choice-group-${group}${offset ? `-${offset}` : ""}`;
      choiceMembers.set(
        id,
        chunk.map((course) => course.id),
      );
      nodes.push({
        id,
        type: "lane",
        position: { x, y: groupY },
        style: { width: (columns - 1) * LANE_STEP + LANE_WIDTH, height: 56 },
        zIndex: -1,
        data: { kind: "lane", title: group, active: false },
        selectable: false,
        draggable: false,
        connectable: false,
      });
      chunk.forEach((course, index) => {
        positions.set(course.id, {
          x: x + COURSE_X_OFFSET + Math.floor(index / CHOICE_ROWS) * LANE_STEP,
          y: groupY + 72 + (index % CHOICE_ROWS) * ROW_STEP,
        });
      });
      column += columns;
      rowHeight = Math.max(rowHeight, Math.min(CHOICE_ROWS, chunk.length));
    }
  }

  return { data, graphRelations, nodes, positions, lastSemester, choiceMembers };
}

export function buildMap(
  layout: ReturnType<typeof createMapLayout>,
  visible: Course[],
  selectedId: string | null,
  choose: (id: string) => void,
) {
  const { data, graphRelations, lastSemester } = layout;
  const focusedRelations = selectedId
    ? graphRelations.filter(
        (relation) => relation.source === selectedId || relation.target === selectedId,
      )
    : [];
  const focusedIds = new Set([
    selectedId,
    ...focusedRelations.flatMap((relation) => [relation.source, relation.target]),
  ]);
  const courses = selectedId ? data.all.filter((course) => focusedIds.has(course.id)) : visible;
  const visibleIds = new Set(courses.map((course) => course.id));
  const nodes = layout.nodes.filter((node) => {
    const members = layout.choiceMembers.get(node.id);
    return !members || members.some((id) => visibleIds.has(id));
  });
  const positions = new Map([...layout.positions].filter(([id]) => visibleIds.has(id)));
  const availableRelations = graphRelations.filter(
    (relation) => visibleIds.has(relation.source) && visibleIds.has(relation.target),
  );
  if (selectedId) {
    nodes.length = 0;
    const center = positions.get(selectedId)!;
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
  return { nodes, edges, positions, relationCount: availableRelations.length, lastSemester };
}
