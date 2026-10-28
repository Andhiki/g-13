import { Typography } from "../../ui/typography";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { mapConnections } from "../curriculum/map-connections";
import { creditsFor, isCore } from "../curriculum/course-utils";
import { LANE_X, LANE_STEP, type MapNode } from "../curriculum/map-layout";
import type { Activity, Roadmap } from "./planner";

type ActivityNode = Node<{ activity: Activity }, "activity">;
type TitleNode = Node<{ title: string }, "title">;
type RoadmapNode = MapNode | ActivityNode | TitleNode;

function RoadmapTitle({ data, positionAbsoluteX, positionAbsoluteY }: NodeProps<TitleNode>) {
  const heading = useRef<HTMLHeadingElement>(null);
  const { setViewport, viewportInitialized } = useReactFlow();
  useEffect(() => {
    if (!viewportInitialized || !heading.current) return;
    const stage = heading.current.closest(".react-flow")!.getBoundingClientRect();
    const phone = window.matchMedia("(width < 650px)").matches;
    const left = Math.max(24, stage.width * 0.075);
    const zoom = Math.min(
      phone ? 0.8 : 1.2,
      (stage.width - left - 24) / heading.current.offsetWidth,
    );
    void setViewport({
      x: left - positionAbsoluteX * zoom,
      y: stage.height / 3 - positionAbsoluteY * zoom,
      zoom,
    });
  }, [viewportInitialized, setViewport, positionAbsoluteX, positionAbsoluteY]);
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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
          position: { x: x + 12, y: 220 + index * 120 },
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
          position: { x: x + 12, y: 220 + list.length * 120 + index * 190 },
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
    return { nodes, edges };
  }, [plan, target, selectedId, choose]);
  const progress = useMemo(
    () => connectionReveal(edges.some((edge) => edge.target === selectedId)),
    [edges, selectedId],
  );
  const revealedEdges = mapConnections(edges, selectedId, hoveredId).map((edge) => ({
    ...edge,
    data: {
      ...edge.data,
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
      className="absolute inset-0 overflow-hidden bg-bg-weak-25"
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
          onNodeMouseEnter={(_, node) => setHoveredId(node.type === "course" ? node.id : null)}
          onNodeMouseLeave={() => setHoveredId(null)}
          onFocusCapture={(event) =>
            setHoveredId(event.target.closest<HTMLElement>("[data-course]")?.dataset.course ?? null)
          }
          onBlurCapture={() => setHoveredId(null)}
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
