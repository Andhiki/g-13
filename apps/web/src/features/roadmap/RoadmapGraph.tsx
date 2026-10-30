import { mapCourseState } from "../../graph/map-state";
import { useLocale } from "../../useLocale";
import { AlignButton } from "../../ui/button";
import { Typography } from "../../ui/typography";
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from "react";
import {
  Background,
  BackgroundVariant,
  getViewportForBounds,
  ReactFlow,
  useReactFlow,
  type NodeProps,
  type Edge,
} from "@xyflow/react";
import { ZoomControls } from "../../graph/ZoomControls";
import { GraphFocus } from "../../graph/GraphFocus";
import { EdgeRouting, routedEdgeTypes } from "../../graph/EdgeRouting";
import { CourseNode, LaneNode } from "../../graph/MapNodes";
import { mapConnections } from "../../graph/map-connections";
import { LANE_X, LANE_STEP, LANE_WIDTH } from "../../graph/model";
import { courseLayout } from "../../courses/layout";
import type { Roadmap } from "./planner";
import {
  getRoadmapGraph,
  type ActivityNode,
  type TitleNode,
  type RoadmapNode,
} from "./graph-layout";

const RoadmapTitleContext = createContext<{
  heading: RefObject<HTMLHeadingElement | null>;
  restart: () => void;
  shareLink: ReactNode;
} | null>(null);

function RoadmapTitle({ data }: NodeProps<TitleNode>) {
  const { text } = useLocale("roadmap");
  const title = useContext(RoadmapTitleContext);
  return (
    <div className="w-[540px]">
      <Typography
        ref={title?.heading}
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
      <div className="nodrag nopan mt-4 flex items-center gap-3">
        <AlignButton.Root
          variant="primary"
          mode="filled"
          className="pointer-events-auto"
          onClick={title?.restart}
        >
          {text("Coba lagi")}
        </AlignButton.Root>
        {title?.shareLink}
      </div>
    </div>
  );
}
function RoadmapFocus({
  selectedId,
  navigation,
  heading,
  stage,
  focusPositions,
  resetVersion,
}: {
  resetVersion: number;
  heading: RefObject<HTMLHeadingElement | null>;
  stage: RefObject<HTMLElement | null>;
  focusPositions: Map<string, { x: number; y: number }>;
  selectedId: string | null;
  navigation: { semester: number } | null;
}) {
  const { setViewport, setCenter, getNode } = useReactFlow();
  return (
    <GraphFocus
      selectedId={selectedId}
      navigation={navigation}
      resetKey={`roadmap:${resetVersion}`}
      onSemester={(semester) => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        void setCenter(LANE_X + (semester - 1) * LANE_STEP + LANE_WIDTH / 2, 420, {
          zoom: 0.72,
          duration: reducedMotion ? 0 : 600,
        });
      }}
      onCourse={() => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const points = [...focusPositions.values()];
        const bounds = stage.current!.getBoundingClientRect();
        const phone = window.matchMedia(courseLayout.phoneQuery).matches;
        const left = phone ? 16 : courseLayout.detailsWidth + 24;
        const top = phone ? 128 : 96;
        const width = bounds.width - left - 16;
        const height = bounds.height * (phone ? 0.55 : 1) - top - 24;
        const minX = Math.min(...points.map((point) => point.x));
        const minY = Math.min(...points.map((point) => point.y));
        const viewport = getViewportForBounds(
          {
            x: minX,
            y: minY,
            width: Math.max(...points.map((point) => point.x)) - minX + courseLayout.cardWidth + 2,
            height: Math.max(...points.map((point) => point.y)) - minY + courseLayout.cardHeight,
          },
          width,
          height,
          0.05,
          0.88,
          0.12,
        );
        void setViewport(
          { ...viewport, x: viewport.x + left, y: viewport.y + top },
          {
            duration: reducedMotion ? 0 : 150,
            ease: (t) => 1 - Math.pow(1 - t, 4),
            interpolate: "linear",
          },
        );
      }}
      onOverview={() => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const titleElement = heading.current!;
        const bounds = stage.current!.getBoundingClientRect();
        const title = getNode("roadmap-title")!;
        const phone = window.matchMedia(courseLayout.phoneQuery).matches;
        const left = Math.max(24, bounds.width * 0.075);
        const zoom = Math.min(
          phone ? 0.8 : 1.2,
          (bounds.width - left - 24) / titleElement.offsetWidth,
        );
        void setViewport(
          {
            x: left - title.position.x * zoom,
            y: bounds.height / 3 - title.position.y * zoom,
            zoom,
          },
          { duration: reducedMotion ? 0 : 1000 },
        );
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
  restart,
  shareLink,
  target,
  summary,
  selectedId,
  choose,
  close,
  onReset,
  navigation,
  onVisibleSemesters,
}: {
  plan: Roadmap;
  restart: () => void;
  shareLink: ReactNode;
  target: number;
  summary: string;
  selectedId: string | null;
  choose: (id: string) => void;
  close: () => void;
  onReset: () => void;
  navigation: { semester: number } | null;
  onVisibleSemesters: (semesters: number[]) => void;
}) {
  const { text, language } = useLocale("roadmap");
  const [resetVersion, setResetVersion] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const stage = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const graph = useMemo(
    () => getRoadmapGraph({ plan, target, summary, text }, language),
    [plan, target, summary, text, language],
  );
  const { semesters } = graph;
  const { focusIds, focusPositions } = useMemo(() => {
    const selectedCourse = graph.nodes.find(
      (node) => node.id === selectedId && node.type === "course",
    );
    const focusIds = new Set<string>();
    const focusPositions = new Map<string, { x: number; y: number }>();
    if (!selectedCourse || selectedCourse.type !== "course") return { focusIds, focusPositions };
    focusIds.add(selectedCourse.id);
    focusPositions.set(selectedCourse.id, selectedCourse.position);
    for (const [side, ids] of [
      ["source", selectedCourse.data.incoming],
      ["target", selectedCourse.data.outgoing],
    ] as const) {
      const neighbors = ids
        .map((id) => graph.nodes.find((node) => node.id === id))
        .filter((node): node is (typeof graph.nodes)[number] => node?.type === "course")
        .sort((a, b) => a.position.y - b.position.y);
      neighbors.forEach((neighbor, index) => {
        focusIds.add(neighbor.id);
        focusPositions.set(neighbor.id, {
          x: selectedCourse.position.x + (side === "source" ? -LANE_STEP : LANE_STEP),
          y: selectedCourse.position.y + (index - (neighbors.length - 1) / 2) * 120,
        });
      });
    }
    return { focusIds, focusPositions };
  }, [graph, selectedId]);
  const nodes = useMemo(
    () =>
      graph.nodes.map((node): RoadmapNode => {
        if (selectedId !== null && (node.type !== "course" || !focusIds.has(node.id)))
          return { ...node, hidden: true };
        if (node.type !== "course") return node;
        return {
          ...node,
          ...(selectedId !== null ? { position: focusPositions.get(node.id)! } : {}),
          data: {
            ...node.data,
            choose,
            state: mapCourseState(node.id, selectedId, node.data.incoming, node.data.outgoing),
          },
        };
      }),
    [graph, selectedId, choose, focusIds, focusPositions],
  );
  const edges = useMemo(
    () =>
      graph.edges
        .filter(
          (edge) => selectedId === null || (focusIds.has(edge.source) && focusIds.has(edge.target)),
        )
        .map((edge) => {
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
    [graph, selectedId, focusIds],
  );
  const revealedEdges = mapConnections(edges, selectedId, hoveredId);
  return (
    <section
      ref={stage}
      className="absolute inset-0 overflow-hidden bg-bg-weak-25"
      aria-label={text("Grafik roadmap personal")}
    >
      <RoadmapTitleContext.Provider value={{ heading, restart, shareLink }}>
        <EdgeRouting>
          <ReactFlow<RoadmapNode, Edge>
            className="absolute! inset-0"
            key={`${target}:${plan.activities.map((a) => a.semester).join()}`}
            nodes={nodes}
            edges={revealedEdges}
            nodeTypes={nodeTypes}
            edgeTypes={routedEdgeTypes}
            onPaneClick={close}
            onNodeMouseEnter={(_, node) => setHoveredId(node.type === "course" ? node.id : null)}
            onNodeMouseLeave={() => setHoveredId(null)}
            onFocusCapture={(event) =>
              setHoveredId(
                event.target.closest<HTMLElement>("[data-course]")?.dataset.course ?? null,
              )
            }
            onBlurCapture={() => setHoveredId(null)}
            defaultViewport={{ x: 10, y: 0, zoom: 0.68 }}
            onMoveEnd={(_, viewport) => {
              const width = stage.current?.clientWidth ?? 0;
              onVisibleSemesters(
                semesters.filter((term) => {
                  const left = viewport.x + (LANE_X + (term - 1) * LANE_STEP) * viewport.zoom;
                  const laneWidth = LANE_WIDTH * viewport.zoom;
                  return Math.min(width, left + laneWidth) - Math.max(0, left) >= laneWidth / 2;
                }),
              );
            }}
            minZoom={0.05}
            maxZoom={1.35}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnDoubleClick={false}
            panOnScroll
            zoomOnScroll={false}
            fitView={false}
            proOptions={{ hideAttribution: true }}
            aria-label={text("Roadmap mata kuliah per semester")}
          >
            <RoadmapFocus
              resetVersion={resetVersion}
              heading={heading}
              stage={stage}
              focusPositions={focusPositions}
              selectedId={selectedId}
              navigation={navigation}
            />
            <ZoomControls
              selected={selectedId !== null}
              lastSemester={semesters.length}
              shortcuts={[
                { key: "f", description: "Buka/tutup filter" },
                { key: "d", description: "Ganti tema" },
              ]}
              onReset={() => {
                onReset();
                setResetVersion((version) => version + 1);
              }}
            />
            <Background
              variant={BackgroundVariant.Dots}
              color="var(--color-stroke-sub-300)"
              gap={24}
              size={1}
            />
          </ReactFlow>
        </EdgeRouting>
      </RoadmapTitleContext.Provider>
    </section>
  );
}
