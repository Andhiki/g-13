import type { Language } from "@g13/i18n";
import type { Edge, Node } from "@xyflow/react";
import { mapCourseState } from "../../graph/map-state";
import { semesterRelations } from "../../graph/semester-relations";
import { creditsFor, isCore } from "../../courses/course-utils";
import { LANE_X, LANE_STEP, type MapNode } from "../../graph/model";
import type { Activity, Roadmap } from "./planner";

export type ActivityNode = Node<{ activity: Activity }, "activity">;
export type TitleNode = Node<{ title: string; summary: string }, "title">;
export type RoadmapNode = MapNode | ActivityNode | TitleNode;

export function buildRoadmapGraph({
  plan,
  target,
  summary,
  selectedId,
  choose,
  text,
}: {
  plan: Roadmap;
  target: number;
  summary: string;
  selectedId: string | null;
  choose: (id: string) => void;
  text: (key: string, values?: Record<string, unknown>) => string;
}) {
  const last = Math.max(
    1,
    ...plan.courses.map((x) => x.semester),
    ...plan.activities.map((x) => x.semester),
  );
  const semesters = Array.from({ length: last }, (_, i) => i + 1);
  const nodes: RoadmapNode[] = [
    {
      id: "roadmap-title",
      type: "title",
      hidden: selectedId !== null,
      position: { x: LANE_X + 12, y: 12 },
      data: { title: text("Roadmap kuliah"), summary },
      selectable: false,
    },
  ];
  const ids = new Set(plan.courses.map((x) => x.course.id));
  const relations = semesterRelations(
    plan.relations.filter((x) => ids.has(x.source) && ids.has(x.target)),
    new Map(plan.courses.map((item) => [item.course.id, item.semester])),
  );
  for (const semester of semesters) {
    const list = plan.courses.filter((x) => x.semester === semester);
    const credit = list.reduce((sum, x) => sum + (creditsFor(x.course) ?? 0), 0);
    const x = LANE_X + (semester - 1) * LANE_STEP;
    nodes.push({
      id: `semester-${semester}`,
      type: "lane",
      position: { x, y: 228 },
      style: { width: 270, height: 40 },
      data: {
        kind: "lane",
        title: text("roadmapSemester", {
          semester,
          credits: credit,
          suffix: semester > target ? text(" · di luar target") : "",
        }),
        active: semester === target,
      },
      selectable: false,
    });
    list.forEach((item, index) => {
      const incoming = relations.filter((r) => r.target === item.course.id).map((r) => r.source);
      const outgoing = relations.filter((r) => r.source === item.course.id).map((r) => r.target);
      nodes.push({
        id: item.course.id,
        type: "course",
        position: { x: x + 12, y: 284 + index * 120 },
        data: {
          kind: "course",
          course: item.course,
          state: mapCourseState(item.course.id, selectedId, incoming, outgoing),
          incoming,
          outgoing,
          choose,
        },
        className: `pointer-events-auto! roadmap-${item.kind}`,
        zIndex: 2,
      });
    });
    const activities = plan.activities.filter(
      (a) => a.semester === semester || (semester > a.semester && semester <= a.endSemester),
    );
    if (semester === target)
      activities.push({
        id: "graduation",
        title: text("Target selesai {{v0}} semester", { v0: target }),
        semester,
        endSemester: semester,
        detail: text("Selesaikan semua persyaratan dan periksa catatan rencana."),
        fullSemester: false,
      });
    activities.forEach((activity, index) =>
      nodes.push({
        id: `${activity.id}-${semester}`,
        type: "activity",
        position: { x: x + 12, y: 284 + list.length * 120 + index * 190 },
        data: { activity },
        zIndex: 2,
      }),
    );
  }
  const coreIds = new Set(
    plan.courses.filter((item) => isCore(item.course)).map((item) => item.course.id),
  );
  const edges: Edge[] = relations.map((relation) => {
    const focused = selectedId === relation.source || selectedId === relation.target;
    const color = focused ? "var(--color-primary-base)" : "var(--color-text-soft-400)";
    return {
      id: `${relation.source}->${relation.target}`,
      type: "routed",
      source: relation.source,
      target: relation.target,
      sourceHandle: "out",
      targetHandle: "in",
      data: { optional: !coreIds.has(relation.source) || !coreIds.has(relation.target) },
      style: {
        stroke: color,
        strokeWidth: focused ? 2.2 : 1.2,
      },
      zIndex: focused ? 3 : 0,
    };
  });
  return { nodes, edges, semesters };
}

const graphs = new WeakMap<Roadmap, Map<string, ReturnType<typeof buildRoadmapGraph>>>();

export function getRoadmapGraph(
  input: Omit<Parameters<typeof buildRoadmapGraph>[0], "selectedId" | "choose">,
  language: Language,
) {
  let prepared = graphs.get(input.plan);
  if (!prepared) {
    prepared = new Map();
    graphs.set(input.plan, prepared);
  }
  const key = JSON.stringify([language, input.target, input.summary]);
  let graph = prepared.get(key);
  if (!graph) {
    graph = buildRoadmapGraph({ ...input, selectedId: null, choose: () => {} });
    prepared.set(key, graph);
  }
  return graph;
}
