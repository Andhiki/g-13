import { Typography } from "../../../ui/typography";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  type Viewport,
} from "@xyflow/react";
import type { CurriculumId } from "@g13/curriculum";
import { AlignFancyButton } from "../../../ui/fancy-button";
import { EdgeRouting, routedEdgeTypes } from "./EdgeRouting";
import { CourseNode, LaneNode } from "./MapNodes";
import { LANE_X, LANE_STEP, LANE_WIDTH, type MapNode } from "../map-layout";
import { isCore } from "../course-utils";
import { mapConnections } from "../map-connections";

const nodeTypes: NodeTypes = { course: CourseNode, lane: LaneNode };

function ViewportFocus({
  navigation,
  focusKey,
  selectedId,
  positions,
}: {
  navigation: { semester: number } | null;
  focusKey: string;
  selectedId: string | null;
  positions: Map<string, { x: number; y: number }>;
}) {
  const { getViewport, setCenter, setViewport } = useReactFlow();
  const previousSelection = useRef(selectedId);
  const overview = useRef<{ viewport: Viewport; navigation: typeof navigation } | null>(null);
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      if (selectedId) {
        if (previousSelection.current === null) {
          overview.current = { viewport: getViewport(), navigation };
        }
        previousSelection.current = selectedId;
        const points = [...positions.values()];
        const stage = document.querySelector("[data-map-stage]")!.getBoundingClientRect();
        const phone = window.matchMedia("(width < 650px)").matches;
        const left = phone ? 16 : 424;
        const top = phone ? 128 : 96;
        const width = stage.width - left - 16;
        const height = stage.height * (phone ? 0.55 : 1) - top - 24;
        const minX = Math.min(...points.map((point) => point.x));
        const minY = Math.min(...points.map((point) => point.y));
        const viewport = getViewportForBounds(
          {
            x: minX,
            y: minY,
            width: Math.max(...points.map((point) => point.x)) - minX + 248,
            height: Math.max(...points.map((point) => point.y)) - minY + 82,
          },
          width,
          height,
          0.05,
          0.88,
          0.12,
        );
        const target = { ...viewport, x: viewport.x + left, y: viewport.y + top };
        setViewport(target, {
          duration: reducedMotion ? 0 : 150,
          ease: (t) => 1 - Math.pow(1 - t, 4),
          interpolate: "linear",
        });
        return;
      }
      previousSelection.current = null;
      const saved = overview.current;
      overview.current = null;
      if (saved && saved.navigation === navigation) {
        setViewport(saved.viewport, { duration: reducedMotion ? 0 : 150 });
        return;
      }
      if (navigation) {
        setCenter(LANE_X + (navigation.semester - 1) * LANE_STEP + LANE_WIDTH / 2, 420, {
          zoom: 0.72,
          duration: reducedMotion ? 0 : 600,
        });
        return;
      }
      const phone = window.matchMedia("(width < 650px)").matches;
      const title = document.querySelector<HTMLElement>("[data-map-title]")!;
      const stage = document.querySelector("[data-map-stage]")!.getBoundingClientRect();
      const left = Math.max(24, stage.width * 0.075);
      const zoom = Math.min(phone ? 0.8 : 1.2, (stage.width - left - 24) / title.offsetWidth);
      setViewport(
        {
          x: left - (LANE_X + 12) * zoom,
          y: stage.height / 3 - title.offsetTop * zoom,
          zoom,
        },
        { duration: reducedMotion ? 0 : 1000 },
      );
    }, 30);
    return () => {
      window.clearTimeout(timer);
    };
  }, [navigation, focusKey, selectedId, positions, getViewport, setCenter, setViewport]);
  return null;
}

function SemesterViewport({
  selectedId,
  onVisibleSemesters,
}: {
  selectedId: string | null;
  onVisibleSemesters: (semesters: number[]) => void;
}) {
  const flow = useReactFlow<MapNode>();
  const update = useCallback(() => {
    if (selectedId) {
      onVisibleSemesters([]);
      return;
    }
    const stage = document.querySelector("[data-map-stage]")!.getBoundingClientRect();
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
          .map((node) => node.position.y + 82),
      );
      if (
        Math.min(stage.width, left + width) - Math.max(0, left) >= width / 2 &&
        viewport.y + bottom * viewport.zoom > top &&
        viewport.y + 100 * viewport.zoom < stage.height
      ) {
        semesters.push(semester);
      }
    }
    onVisibleSemesters(semesters);
  }, [flow, selectedId, onVisibleSemesters]);
  useOnViewportChange({ onChange: update });
  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);
  return null;
}

export function CurriculumMap({
  navigation,
  onVisibleSemesters,
  close,
  curriculum,
  selectedId,
  nodes,
  edges,
  positions,
}: {
  navigation: { semester: number } | null;
  onVisibleSemesters: (semesters: number[]) => void;
  close: () => void;
  curriculum: CurriculumId;
  selectedId: string | null;
  nodes: MapNode[];
  edges: Edge[];
  positions: Map<string, { x: number; y: number }>;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const focusKey = [curriculum, selectedId ?? ""].join(":");
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
        aria-label="Peta kurikulum Ilmu Komputer UGM"
      >
        <ViewportFocus
          navigation={navigation}
          focusKey={focusKey}
          selectedId={selectedId}
          positions={positions}
        />
        <SemesterViewport selectedId={selectedId} onVisibleSemesters={onVisibleSemesters} />
        <ViewportPortal>
          {selectedId === null && (
            <div
              data-map-title
              className="absolute -top-[144px] flex flex-col items-start gap-4 max-[650px]:-top-[104px]"
              style={{ left: LANE_X + 12 }}
            >
              <Typography
                as="h1"
                variant="graphTitle"
                className="m-0 whitespace-nowrap text-text-strong-950"
              >
                Everything CS UGM
              </Typography>
              <Typography as="p" variant="paragraph" className="m-0 max-w-xl text-text-sub-600">
                Jelajahi mata kuliah, pahami prasyarat, dan rencanakan perjalanan kuliah Ilmu
                Komputer UGM.
              </Typography>
              <AlignFancyButton.Root asChild className="pointer-events-auto nodrag nopan">
                <Link to="/roadmap" search={{ lulus: 8, semesterPaparan: 6 }}>
                  Buat roadmap sendiri
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
