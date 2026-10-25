import { useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  MarkerType,
  type ReactFlowInstance,
  type Node,
  type NodeProps,
  type Edge,
} from "@xyflow/react";
import { RiAddLine, RiSubtractLine, RiExpandDiagonalLine } from "@remixicon/react";
import { AlignButton } from "../../ui/button";
import { CourseNode, LaneNode } from "../curriculum/components/MapNodes";
import { mapCourseState } from "../curriculum/map-state";
import { creditsFor } from "../curriculum/course-utils";
import type { MapNode } from "../curriculum/map-layout";
import type { Activity, Roadmap } from "./planner";

type ActivityNode = Node<{ activity: Activity }, "activity">;
type RoadmapNode = MapNode | ActivityNode;
function ActivityCard({ data }: NodeProps<ActivityNode>) {
  return (
    <div className="w-[246px] rounded-lg border border-primary-base bg-bg-white-0 p-4 text-text-strong-950">
      <p className="m-0 text-paragraph-xs text-primary-base">Kegiatan</p>
      <h3 className="mb-1 mt-1 text-label-sm">{data.activity.title}</h3>
      <p className="m-0 text-paragraph-xs text-text-sub-600">{data.activity.detail}</p>
    </div>
  );
}
const nodeTypes = { course: CourseNode, lane: LaneNode, activity: ActivityCard };

export function RoadmapGraph({
  plan,
  target,
  selectedId,
  choose,
}: {
  plan: Roadmap;
  target: number;
  selectedId: string | null;
  choose: (id: string) => void;
}) {
  const flow = useRef<ReactFlowInstance<RoadmapNode, Edge>>(null);
  const last = Math.max(target, ...plan.courses.map((x) => x.semester));
  const semesters = Array.from({ length: last }, (_, i) => i + 1);
  const { nodes, edges } = useMemo(() => {
    const nodes: RoadmapNode[] = [];
    const ids = new Set(plan.courses.map((x) => x.course.id));
    const relations = plan.relations.filter((x) => ids.has(x.source) && ids.has(x.target));
    for (const semester of semesters) {
      const list = plan.courses.filter((x) => x.semester === semester);
      const credit = list.reduce((sum, x) => sum + (creditsFor(x.course) ?? 0), 0);
      const x = (semester - 1) * 340;
      nodes.push({
        id: `semester-${semester}`,
        type: "lane",
        position: { x, y: 0 },
        style: { width: 270, height: 40 },
        data: {
          kind: "lane",
          title: `Semester ${semester} · ${credit} SKS${semester > target ? " · di luar target" : ""}`,
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
          position: { x: x + 12, y: 60 + index * 104 },
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
        (a) =>
          a.semester === semester ||
          (a.id === "exposure" &&
            a.title === "Double degree" &&
            semester > a.semester &&
            semester <= 8),
      );
      if (semester === target)
        activities.push({
          id: "graduation",
          title: `Target selesai ${target} semester`,
          semester,
          detail: "Selesaikan semua persyaratan dan periksa catatan rencana.",
          fullSemester: false,
        });
      activities.forEach((activity, index) =>
        nodes.push({
          id: `${activity.id}-${semester}`,
          type: "activity",
          position: { x: x + 12, y: 60 + list.length * 104 + index * 190 },
          data: { activity },
          zIndex: 2,
        }),
      );
    }
    const edges: Edge[] = relations.map((relation) => {
      const focused = selectedId === relation.source || selectedId === relation.target;
      const color = focused ? "var(--color-primary-base)" : "var(--color-stroke-sub-300)";
      return {
        id: `${relation.source}->${relation.target}`,
        source: relation.source,
        target: relation.target,
        sourceHandle: `out:${relation.target}`,
        targetHandle: `in:${relation.source}`,
        style: {
          stroke: color,
          strokeWidth: focused ? 2 : 1,
          opacity: selectedId && !focused ? 0.15 : 0.65,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color },
        zIndex: focused ? 3 : 0,
      };
    });
    return { nodes, edges };
  }, [plan, target, selectedId, choose]);
  return (
    <section
      className="relative h-full min-h-[440px] overflow-hidden rounded-xl border border-stroke-soft-200 bg-bg-weak-25"
      aria-label="Grafik roadmap kuliah"
    >
      <ReactFlow<RoadmapNode, Edge>
        className="absolute! inset-0"
        key={`${target}:${plan.activities.map((a) => a.semester).join()}`}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          flow.current = instance;
        }}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.08}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
        aria-label="Roadmap mata kuliah per semester"
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="var(--color-stroke-sub-300)"
          gap={24}
          size={1}
        />
      </ReactFlow>
      <div
        className="absolute inset-x-3 top-3 flex gap-1 overflow-x-auto rounded-lg bg-bg-white-0 p-1"
        role="group"
        aria-label="Navigasi semester"
      >
        {semesters.map((term) => (
          <AlignButton.Root
            key={term}
            variant="neutral"
            mode="ghost"
            size="xsmall"
            aria-label={`Lihat semester ${term}`}
            onClick={() =>
              flow.current?.setCenter((term - 1) * 340 + 135, 400, { zoom: 0.8, duration: 0 })
            }
          >
            {term}
          </AlignButton.Root>
        ))}
      </div>
      <div className="absolute bottom-3 left-3 flex gap-1 rounded-lg bg-bg-white-0 p-1">
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          size="xsmall"
          aria-label="Perbesar roadmap"
          onClick={() => flow.current?.zoomIn()}
        >
          <RiAddLine className="size-4" />
        </AlignButton.Root>
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          size="xsmall"
          aria-label="Perkecil roadmap"
          onClick={() => flow.current?.zoomOut()}
        >
          <RiSubtractLine className="size-4" />
        </AlignButton.Root>
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          size="xsmall"
          onClick={() => flow.current?.fitView({ padding: 0.1 })}
        >
          <RiExpandDiagonalLine className="size-4" /> Semua semester
        </AlignButton.Root>
      </div>
    </section>
  );
}
