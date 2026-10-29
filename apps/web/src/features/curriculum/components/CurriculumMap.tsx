import { useLocale } from "../../../useLocale";
import { Typography } from "../../../ui/typography";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Link } from "@tanstack/react-router";
import {
  getViewportForBounds,
  Background,
  BackgroundVariant,
  ReactFlow,
  ViewportPortal,
  useReactFlow,
  useOnViewportChange,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import type { CurriculumId } from "@g13/curriculum";
import { AlignFancyButton } from "../../../ui/fancy-button";
import { EdgeRouting, routedEdgeTypes } from "../../../graph/EdgeRouting";
import { CourseNode, LaneNode } from "../../../graph/MapNodes";
import { GraphFocus } from "../../../graph/GraphFocus";
import { ZoomControls } from "./ZoomControls";
import { LANE_X, LANE_STEP, LANE_WIDTH, type MapNode } from "../../../graph/model";
import { courseLayout } from "../../../courses/layout";
import { isCore } from "../../../courses/course-utils";
import { mapConnections } from "../../../graph/map-connections";

const nodeTypes: NodeTypes = { course: CourseNode, lane: LaneNode };

function ViewportFocus({
  navigation,
  curriculum,
  resetVersion,
  selectedId,
  positions,
  stage,
  title,
}: {
  navigation: { semester: number } | null;
  curriculum: CurriculumId;
  resetVersion: number;
  selectedId: string | null;
  positions: Map<string, { x: number; y: number }>;
  stage: RefObject<HTMLDivElement | null>;
  title: RefObject<HTMLDivElement | null>;
}) {
  const { setCenter, setViewport } = useReactFlow();
  return (
    <GraphFocus
      selectedId={selectedId}
      navigation={navigation}
      resetKey={`${curriculum}:${resetVersion}`}
      onCourse={() => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const points = [...positions.values()];
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
      onSemester={(semester) => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        void setCenter(LANE_X + (semester - 1) * LANE_STEP + LANE_WIDTH / 2, 420, {
          zoom: 0.72,
          duration: reducedMotion ? 0 : 600,
        });
      }}
      onOverview={() => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const phone = window.matchMedia(courseLayout.phoneQuery).matches;
        const heading = title.current!;
        const bounds = stage.current!.getBoundingClientRect();
        const left = Math.max(24, bounds.width * 0.075);
        const zoom = Math.min(phone ? 0.8 : 1.2, (bounds.width - left - 24) / heading.offsetWidth);
        void setViewport(
          {
            x: left - (LANE_X + 12) * zoom,
            y: bounds.height / 3 - heading.offsetTop * zoom,
            zoom,
          },
          { duration: reducedMotion ? 0 : 1000 },
        );
      }}
    />
  );
}

function SemesterViewport({
  stage,
  selectedId,
  onVisibleSemesters,
}: {
  stage: RefObject<HTMLDivElement | null>;
  selectedId: string | null;
  onVisibleSemesters: (semesters: number[]) => void;
}) {
  const flow = useReactFlow<MapNode>();
  const update = useCallback(() => {
    if (selectedId) {
      onVisibleSemesters([]);
      return;
    }
    const bounds = stage.current!.getBoundingClientRect();
    const viewport = flow.getViewport();
    const semesters: number[] = [];
    const nodes = flow.getNodes();
    const top = window.matchMedia("(width < 1100px)").matches ? 116 : 76;
    for (let semester = 1; semester <= 8; semester++) {
      if (!nodes.some((node) => node.id === `lane-semester-${semester}`)) continue;
      const laneX = LANE_X + (semester - 1) * LANE_STEP;
      const left = viewport.x + laneX * viewport.zoom;
      const width = LANE_WIDTH * viewport.zoom;
      const bottom = Math.max(
        140,
        ...nodes
          .filter(
            (node) =>
              node.type === "course" &&
              isCore(node.data.course) &&
              node.position.x >= laneX &&
              node.position.x < laneX + LANE_WIDTH,
          )
          .map((node) => node.position.y + courseLayout.cardHeight),
      );
      if (
        Math.min(bounds.width, left + width) - Math.max(0, left) >= width / 2 &&
        viewport.y + bottom * viewport.zoom > top &&
        viewport.y + 100 * viewport.zoom < bounds.height
      ) {
        semesters.push(semester);
      }
    }
    onVisibleSemesters(semesters);
  }, [flow, selectedId, onVisibleSemesters, stage]);
  useOnViewportChange({ onChange: update });
  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);
  return null;
}

export function CurriculumMap({
  stage,
  navigation,
  resetVersion,
  onReset,
  onVisibleSemesters,
  close,
  curriculum,
  selectedId,
  nodes,
  edges,
  positions,
  lastSemester,
}: {
  stage: RefObject<HTMLDivElement | null>;
  navigation: { semester: number } | null;
  resetVersion: number;
  onReset: () => void;
  onVisibleSemesters: (semesters: number[]) => void;
  close: () => void;
  curriculum: CurriculumId;
  selectedId: string | null;
  nodes: MapNode[];
  edges: Edge[];
  positions: Map<string, { x: number; y: number }>;
  lastSemester: number;
}) {
  const { text } = useLocale();
  const title = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const revealedEdges = useMemo(
    () => mapConnections(edges, selectedId, hoveredId),
    [edges, selectedId, hoveredId],
  );
  return (
    <EdgeRouting>
      <ReactFlow<MapNode, Edge>
        key={curriculum}
        className="absolute! inset-0 z-0 bg-transparent!"
        proOptions={{ hideAttribution: true }}
        onPaneClick={close}
        onNodeMouseEnter={(_, node) => setHoveredId(node.type === "course" ? node.id : null)}
        onNodeMouseLeave={() => setHoveredId(null)}
        onFocusCapture={(event) =>
          setHoveredId(event.target.closest<HTMLElement>("[data-course]")?.dataset.course ?? null)
        }
        onBlurCapture={() => setHoveredId(null)}
        nodes={nodes}
        edges={revealedEdges}
        edgeTypes={routedEdgeTypes}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 10, y: 0, zoom: 0.68 }}
        minZoom={0.05}
        maxZoom={1.35}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        fitView={false}
        aria-label={text("Peta kurikulum Ilmu Komputer UGM")}
      >
        <ViewportFocus
          stage={stage}
          title={title}
          navigation={navigation}
          curriculum={curriculum}
          resetVersion={resetVersion}
          selectedId={selectedId}
          positions={positions}
        />
        <ZoomControls
          onReset={onReset}
          selected={selectedId !== null}
          lastSemester={lastSemester}
        />
        <SemesterViewport
          stage={stage}
          selectedId={selectedId}
          onVisibleSemesters={onVisibleSemesters}
        />
        <ViewportPortal>
          {selectedId === null && (
            <div
              ref={title}
              data-map-title
              className="absolute -top-[144px] flex flex-col items-start gap-4 max-[650px]:-top-[104px]"
              style={{ left: LANE_X + 12 }}
            >
              <Typography
                as="h1"
                variant="graphTitle"
                className="m-0 whitespace-nowrap text-text-strong-950"
              >
                {text("Everything CS UGM")}
              </Typography>
              <Typography as="p" variant="paragraph" className="m-0 max-w-xl text-text-sub-600">
                {text(
                  "Jelajahi mata kuliah, pahami prasyarat, dan rencanakan perjalanan kuliah Ilmu Komputer UGM.",
                )}
              </Typography>
              <AlignFancyButton.Root asChild className="pointer-events-auto nodrag nopan">
                <Link to="/roadmap" search={{ lulus: 8, semesterPaparan: 6 }}>
                  {text("Buat roadmap sendiri")}
                </Link>
              </AlignFancyButton.Root>
            </div>
          )}
        </ViewportPortal>
        <Background
          className="bg-bg-weak-25"
          variant={BackgroundVariant.Dots}
          color="var(--color-stroke-sub-300)"
          gap={24}
          size={1.2}
        />
      </ReactFlow>
    </EdgeRouting>
  );
}
