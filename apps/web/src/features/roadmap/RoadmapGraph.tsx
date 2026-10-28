import { Typography } from "../../ui/typography";
import { useEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  useReactFlow,
  type ReactFlowInstance,
  type Node,
  type NodeProps,
  type Edge,
} from "@xyflow/react";
import {
  EdgeRouting,
  routedEdgeTypes,
  connectionReveal,
} from "../curriculum/components/EdgeRouting";
import { CourseNode, LaneNode } from "../curriculum/components/MapNodes";
import { mapCourseState } from "../curriculum/map-state";
import { creditsFor } from "../curriculum/course-utils";
import { LANE_X, LANE_STEP, type MapNode } from "../curriculum/map-layout";
import type { Activity, Roadmap } from "./planner";

type ActivityNode = Node<{ activity: Activity }, "activity">;
type TitleNode = Node<{ title: string }, "title">;
type RoadmapNode = MapNode | ActivityNode | TitleNode;

function RoadmapTitle({ data, positionAbsoluteX, positionAbsoluteY }: NodeProps<TitleNode>) {
  const heading = useRef<HTMLHeadingElement>(null);
  const { setCenter, viewportInitialized } = useReactFlow();
  useEffect(() => {
    if (!viewportInitialized || !heading.current) return;
    const { offsetWidth: width, offsetHeight: height } = heading.current;
    void setCenter(positionAbsoluteX + width / 2, positionAbsoluteY + height / 2, {
      zoom: Math.min(0.8, (window.innerWidth - 32) / width),
    });
  }, [viewportInitialized, setCenter, positionAbsoluteX, positionAbsoluteY]);
  return (
    <Typography
      ref={heading}
      as="h1"
      variant="graphTitle"
      className="m-0 whitespace-nowrap text-text-strong-950"
    >
      {data.title}
    </Typography>
  );
}
function ActivityCard({ data }: NodeProps<ActivityNode>) {
  return (
    <div className="w-[246px] rounded-lg border border-primary-base bg-bg-white-0 p-4 text-text-strong-950">
      <Typography as="p" variant="caption" className="m-0 text-primary-base">
        Kegiatan
      </Typography>
      <Typography as="h3" variant="label" className="mb-1 mt-1">
        {data.activity.title}
      </Typography>
      <Typography as="p" variant="caption" className="m-0 text-text-sub-600">
        {data.activity.detail}
      </Typography>
    </div>
  );
}
const nodeTypes = {
  course: CourseNode,
  lane: LaneNode,
  activity: ActivityCard,
  title: RoadmapTitle,
};

export function RoadmapGraph({
  plan,
  target,
  selectedId,
  choose,
  navigation,
  onVisibleSemesters,
}: {
  plan: Roadmap;
  target: number;
  selectedId: string | null;
  choose: (id: string) => void;
  navigation: { semester: number } | null;
  onVisibleSemesters: (semesters: number[]) => void;
}) {
  const flow = useRef<ReactFlowInstance<RoadmapNode, Edge>>(null);
  const stage = useRef<HTMLElement>(null);
  useEffect(() => {
    if (navigation)
      void flow.current?.setCenter(LANE_X + (navigation.semester - 1) * LANE_STEP + 135, 420, {
        zoom: 0.8,
        duration: 0,
      });
  }, [navigation]);
  const last = Math.max(target, ...plan.courses.map((x) => x.semester));
  const semesters = Array.from({ length: last }, (_, i) => i + 1);
  const { nodes, edges } = useMemo(() => {
    const nodes: RoadmapNode[] = [
      {
        id: "roadmap-title",
        type: "title",
        hidden: selectedId !== null,
        position: { x: LANE_X + 12, y: 12 },
        data: { title: "Roadmap kuliah" },
        selectable: false,
      },
    ];
    const ids = new Set(plan.courses.map((x) => x.course.id));
    const relations = plan.relations.filter((x) => ids.has(x.source) && ids.has(x.target));
    for (const semester of semesters) {
      const list = plan.courses.filter((x) => x.semester === semester);
      const credit = list.reduce((sum, x) => sum + (creditsFor(x.course) ?? 0), 0);
      const x = LANE_X + (semester - 1) * LANE_STEP;
      nodes.push({
        id: `semester-${semester}`,
        type: "lane",
        position: { x, y: 164 },
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
          position: { x: x + 12, y: 220 + index * 96 },
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
          position: { x: x + 12, y: 220 + list.length * 96 + index * 190 },
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
        type: "routed",
        source: relation.source,
        target: relation.target,
        sourceHandle: `out:${relation.target}`,
        targetHandle: `in:${relation.source}`,
        style: {
          stroke: color,
          strokeWidth: focused ? 2 : 1,
          opacity: selectedId && !focused ? 0.15 : 0.65,
        },
        zIndex: focused ? 3 : 0,
      };
    });
    return { nodes, edges };
  }, [plan, target, selectedId, choose]);
  const progress = useMemo(
    () => connectionReveal(edges.some((edge) => edge.target === selectedId)),
    [edges, selectedId],
  );
  const revealedEdges = edges.map((edge) => ({
    ...edge,
    data: {
      animationKey: selectedId,
      startedAt: progress.startedAt,
      reveal:
        edge.target === selectedId
          ? progress.incoming
          : edge.source === selectedId
            ? progress.outgoing
            : undefined,
    },
  }));
  return (
    <section
      ref={stage}
      className="fixed inset-0 h-dvh overflow-hidden bg-bg-weak-25"
      aria-label="Grafik roadmap kuliah"
    >
      <EdgeRouting>
        <ReactFlow<RoadmapNode, Edge>
          className="absolute! inset-0"
          key={`${target}:${plan.activities.map((a) => a.semester).join()}`}
          nodes={nodes}
          edges={revealedEdges}
          nodeTypes={nodeTypes}
          edgeTypes={routedEdgeTypes}
          onInit={(instance) => {
            flow.current = instance;
          }}
          defaultViewport={{ x: 10, y: 0, zoom: 0.68 }}
          onMoveEnd={(_, viewport) => {
            const width = stage.current?.clientWidth ?? 0;
            onVisibleSemesters(
              semesters.filter((term) => {
                const left = viewport.x + (LANE_X + (term - 1) * LANE_STEP) * viewport.zoom;
                const laneWidth = 270 * viewport.zoom;
                return Math.min(width, left + laneWidth) - Math.max(0, left) >= laneWidth / 2;
              }),
            );
          }}
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
      </EdgeRouting>
    </section>
  );
}
