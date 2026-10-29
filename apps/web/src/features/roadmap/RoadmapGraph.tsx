import { useLocale } from "../../useLocale";
import { Typography } from "../../ui/typography";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  useReactFlow,
  type ReactFlowInstance,
  type NodeProps,
  type Edge,
  type Viewport,
} from "@xyflow/react";
import { EdgeRouting, routedEdgeTypes } from "../curriculum/components/EdgeRouting";
import { CourseNode, LaneNode } from "../curriculum/components/MapNodes";
import { mapConnections } from "../curriculum/map-connections";
import { LANE_X, LANE_STEP } from "../curriculum/map-layout";
import type { Roadmap } from "./planner";
import {
  buildRoadmapGraph,
  type ActivityNode,
  type TitleNode,
  type RoadmapNode,
} from "./graph-layout";

function RoadmapTitle({ data, positionAbsoluteX, positionAbsoluteY }: NodeProps<TitleNode>) {
  const { text } = useLocale("roadmap");
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
    <div className="w-[540px]">
      <Typography
        ref={heading}
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
  const { text } = useLocale("roadmap");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const flow = useRef<ReactFlowInstance<RoadmapNode, Edge>>(null);
  const stage = useRef<HTMLElement>(null);
  const previousSelection = useRef(selectedId);
  const overview = useRef<{ viewport: Viewport; navigation: typeof navigation } | null>(null);
  useEffect(() => {
    const instance = flow.current;
    if (!instance) return;
    if (previousSelection.current === null && selectedId !== null) {
      overview.current = { viewport: instance.getViewport(), navigation };
    }
    if (previousSelection.current !== null && selectedId === null) {
      const saved = overview.current;
      overview.current = null;
      if (saved && saved.navigation === navigation) {
        const timer = window.setTimeout(() => {
          const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          void flow.current?.setViewport(saved.viewport, { duration: reducedMotion ? 0 : 150 });
        }, 30);
        previousSelection.current = selectedId;
        return () => window.clearTimeout(timer);
      }
    }
    previousSelection.current = selectedId;
  }, [selectedId, navigation]);
  useEffect(() => {
    if (navigation)
      void flow.current?.setCenter(LANE_X + (navigation.semester - 1) * LANE_STEP + 135, 420, {
        zoom: 0.8,
        duration: 0,
      });
  }, [navigation]);
  const { nodes, edges, semesters } = useMemo(
    () => buildRoadmapGraph({ plan, target, summary, selectedId, choose, text }),
    [plan, target, summary, selectedId, choose, text],
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
          aria-label={text("Roadmap mata kuliah per semester")}
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
