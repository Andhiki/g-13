import type { Language } from "@g13/i18n";
import type { Node } from "@xyflow/react";
import {
  buildCourseGraph,
  createLaneNode,
  crossSemesterRelations,
  type CoursePlacement,
} from "@/graph/graph-builder";
import { LANE_X, LANE_STEP, type MapNode } from "@/graph/model";
import { lastPlanningSemester, semesterCredits } from "./schedule";
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
  const last = Math.min(
    lastPlanningSemester,
    Math.max(1, ...plan.courses.map((x) => x.semester), ...plan.activities.map((x) => x.semester)),
  );
  const semesters = Array.from({ length: last }, (_, i) => i + 1);
  const nodes: RoadmapNode[] = [
    {
      id: "roadmap-title",
      type: "title",
      hidden: selectedId !== null,
      position: { x: LANE_X + 12, y: 12 },
      data: { title: text("Roadmap personal"), summary },
      selectable: false,
    },
  ];
  const ids = new Set(plan.courses.map((x) => x.course.id));
  const relations = crossSemesterRelations(
    plan.relations.filter((x) => ids.has(x.source) && ids.has(x.target)),
    new Map(plan.courses.map((item) => [item.course.id, item.semester])),
  );
  const placements: CoursePlacement[] = [];
  const activityNodes: ActivityNode[] = [];
  for (const semester of semesters) {
    const list = plan.courses.filter((x) => x.semester === semester);
    const credit = semesterCredits(semester, plan.courses, plan.activities);
    const x = LANE_X + (semester - 1) * LANE_STEP;
    nodes.push(
      createLaneNode({
        id: `semester-${semester}`,
        title: text("roadmapSemester", {
          semester,
          credits: credit,
          suffix: semester > target ? text(" · di luar target") : "",
        }),
        position: { x, y: 292 },
        style: { width: 270, height: 40 },
        active: semester === target,
      }),
    );
    list.forEach((item, index) => {
      placements.push({
        course: item.course,
        position: { x: x + 12, y: 348 + index * 120 },
        className: `pointer-events-auto! roadmap-${item.kind}`,
      });
    });
    const activities = plan.activities.filter(
      (a) => a.semester === semester || (semester > a.semester && semester <= a.endSemester),
    );
    if (semester === target)
      activities.push({
        recommendedCredits: 0,
        id: "graduation",
        title: text("Target selesai {{v0}} semester", { v0: target }),
        semester,
        endSemester: semester,
        detail: text("Selesaikan semua persyaratan dan periksa catatan rencana."),
        fullSemester: false,
      });
    activities.forEach((activity, index) =>
      activityNodes.push({
        id: `${activity.id}-${semester}`,
        type: "activity",
        position: { x: x + 12, y: 348 + list.length * 120 + index * 190 },
        data: { activity },
        zIndex: 2,
      }),
    );
  }
  const { nodes: courseNodes, edges } = buildCourseGraph({
    placements,
    relations,
    selectedId,
    choose,
    edgeType: "routed",
    edgeStyle: (relation) => {
      const focused = selectedId === relation.source || selectedId === relation.target;
      return {
        stroke: focused ? "var(--color-primary-base)" : "var(--color-text-soft-400)",
        strokeWidth: focused ? 2.2 : 1.2,
      };
    },
    edgeZIndex: (relation) =>
      selectedId === relation.source || selectedId === relation.target ? 3 : 0,
  });
  nodes.push(...courseNodes, ...activityNodes);
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
