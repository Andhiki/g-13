import { mapCourseState } from "../curriculum/map-state";
import { useLocale } from "../../useLocale";
import { Typography } from "../../ui/typography";
import { useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  useReactFlow,
  type NodeProps,
  type Edge,
} from "@xyflow/react";
import { GraphFocus } from "../../ui/graph-focus";
import { EdgeRouting, routedEdgeTypes } from "../curriculum/components/EdgeRouting";
import { CourseNode, LaneNode } from "../curriculum/components/MapNodes";
import { mapConnections } from "../curriculum/map-connections";
import { LANE_X, LANE_STEP } from "../curriculum/map-layout";
import type { Roadmap } from "./planner";
import {
  getRoadmapGraph,
  type ActivityNode,
  type TitleNode,
  type RoadmapNode,
} from "./graph-layout";

function RoadmapTitle({ data }: NodeProps<TitleNode>) {
  const { text } = useLocale("roadmap");
  return (
    <div className="w-[540px]">
      <Typography
        data-roadmap-title
        as="h1"
        variant="graphTitle"
        className="m-0 whitespace-nowrap text-text-strong-950"
      >
        {text(data.title)}
      </Typography>
      <Typography as="p" variant="paragraph" className="mb-0 mt-3 text-text-sub-600">
        {data.summary}
      </Typography>
    </div>
  );
}
function RoadmapFocus({
  selectedId,
  navigation,
}: {
  selectedId: string | null;
  navigation: { semester: number } | null;
}) {
  const { setViewport, setCenter, getNode } = useReactFlow();
  return (
    <GraphFocus
      selectedId={selectedId}
      navigation={navigation}
      resetKey="roadmap"
      onSemester={(semester) => {
        void setCenter(LANE_X + (semester - 1) * LANE_STEP + 135, 420, { zoom: 0.8, duration: 0 });
      }}
      onOverview={() => {
        const heading = document.querySelector<HTMLElement>("[data-roadmap-title]")!;
        const stage = heading.closest(".react-flow")!.getBoundingClientRect();
        const title = getNode("roadmap-title")!;
        const phone = window.matchMedia("(width < 650px)").matches;
        const left = Math.max(24, stage.width * 0.075);
        const zoom = Math.min(phone ? 0.8 : 1.2, (stage.width - left - 24) / heading.offsetWidth);
        void setViewport({
          x: left - title.position.x * zoom,
          y: stage.height / 3 - title.position.y * zoom,
          zoom,
        });
      }}
    />
  );
}

function ActivityCard({ data }: NodeProps<ActivityNode>) {
  const { text } = useLocale("roadmap");
  return (
    <div className="w-[246px] rounded-lg border border-primary-base bg-bg-white-0 p-4 text-text-strong-950">
      <Typography as="p" variant="caption" className="m-0 text-primary-base">
        {text("Kegiatan")}
      </Typography>
      <Typography as="h3" variant="label" className="mb-1 mt-1">
        {text(data.activity.title)}
      </Typography>
      <Typography as="p" variant="caption" className="m-0 text-text-sub-600">
        {text(data.activity.detail)}
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
  summary,
  selectedId,
  choose,
  navigation,
  onVisibleSemesters,
}: {
  plan: Roadmap;
  target: number;
  summary: string;
  selectedId: string | null;
  choose: (id: string) => void;
  navigation: { semester: number } | null;
  onVisibleSemesters: (semesters: number[]) => void;
}) {
  const { text, language } = useLocale("roadmap");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const stage = useRef<HTMLElement>(null);
  const graph = useMemo(
    () => getRoadmapGraph({ plan, target, summary, text }, language),
    [plan, target, summary, text, language],
  );
  const { semesters } = graph;
  const nodes = useMemo(
    () =>
      graph.nodes.map((node): RoadmapNode => {
        if (node.type === "title") return { ...node, hidden: selectedId !== null };
        if (node.type !== "course") return node;
        return {
          ...node,
          data: {
            ...node.data,
            choose,
            state: mapCourseState(node.id, selectedId, node.data.incoming, node.data.outgoing),
          },
        };
      }),
    [graph, selectedId, choose],
  );
  const edges = useMemo(
    () =>
      graph.edges.map((edge) => {
        const focused = selectedId === edge.source || selectedId === edge.target;
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: focused ? "var(--color-primary-base)" : "var(--color-text-soft-400)",
            strokeWidth: focused ? 2.2 : 1.2,
          },
          zIndex: focused ? 3 : 0,
        };
      }),
    [graph, selectedId],
  );
  const revealedEdges = mapConnections(edges, selectedId, hoveredId);
  return (
    <section
      ref={stage}
      className="absolute inset-0 overflow-hidden bg-bg-weak-25"
      aria-label={text("Grafik roadmap kuliah")}
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
          aria-label={text("Roadmap mata kuliah per semester")}
        >
          <RoadmapFocus selectedId={selectedId} navigation={navigation} />
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
