import { useLocale } from "../../../useLocale";
import { Typography } from "../../../ui/typography";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Link } from "@tanstack/react-router";
import {
  Background,
  BackgroundVariant,
  ViewportPortal,
  useReactFlow,
  useStore,
  useNodes,
  useOnViewportChange,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import type { CurriculumId } from "@g13/curriculum";
import { AlignFancyButton } from "../../../ui/fancy-button";
import { EdgeRouting, routedEdgeTypes } from "../../../graph/EdgeRouting";
import { CourseNode, LaneNode } from "../../../graph/MapNodes";
import { GraphOrigin, MotionGraph } from "../../../graph/MotionGraph";
import { GraphFocus } from "../../../graph/GraphFocus";
import { ZoomControls } from "../../../graph/ZoomControls";
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
  stage,
  title,
}: {
  navigation: { semester: number } | null;
  curriculum: CurriculumId;
  resetVersion: number;
  selectedId: string | null;
  stage: RefObject<HTMLDivElement | null>;
  title: RefObject<HTMLDivElement | null>;
}) {
  const { setCenter, setViewport } = useReactFlow();
  return (
    <GraphFocus
      selectedId={selectedId}
      navigation={navigation}
      resetKey={`${curriculum}:${resetVersion}`}
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
  active,
  selectedId,
  onVisibleSemesters,
}: {
  active: boolean;
  selectedId: string | null;
  onVisibleSemesters: (semesters: number[]) => void;
}) {
  const flow = useReactFlow<MapNode>();
  const origin = useContext(GraphOrigin);
  const nodes = useNodes<MapNode>();
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);
  const semesterBounds = useMemo(() => {
    const bounds: { semester: number; x: number; bottom: number }[] = [];
    for (let semester = 1; semester <= 8; semester++) {
      if (!nodes.some((node) => node.id === `lane-semester-${semester}`)) continue;
      const x = LANE_X + (semester - 1) * LANE_STEP + origin.x;
      const bottom = Math.max(
        140,
        ...nodes
          .filter(
            (node) =>
              node.type === "course" &&
              isCore(node.data.course) &&
              node.position.x >= x &&
              node.position.x < x + LANE_WIDTH,
          )
          .map((node) => node.position.y + courseLayout.cardHeight),
      );
      bounds.push({ semester, x, bottom });
    }
    return bounds;
  }, [nodes, origin.x]);
  const update = useCallback(() => {
    if (!active) return;
    if (selectedId) {
      onVisibleSemesters([]);
      return;
    }
    const viewport = flow.getViewport();
    const semesters: number[] = [];
    const top = width < 1100 ? 116 : 76;
    const laneWidth = LANE_WIDTH * viewport.zoom;
    for (const { semester, x, bottom } of semesterBounds) {
      const left = viewport.x + x * viewport.zoom;
      if (
        Math.min(width, left + laneWidth) - Math.max(0, left) >= laneWidth / 2 &&
        viewport.y + bottom * viewport.zoom > top &&
        viewport.y + (100 + origin.y) * viewport.zoom < height
      ) {
        semesters.push(semester);
      }
    }
    onVisibleSemesters(semesters);
  }, [active, flow, selectedId, onVisibleSemesters, origin.y, semesterBounds, width, height]);
  useOnViewportChange({ onChange: update });
  useEffect(update, [update]);
  return null;
}

function MapTitle({
  selectedId,
  title,
}: {
  selectedId: string | null;
  title: RefObject<HTMLDivElement | null>;
}) {
  const { text } = useLocale();
  const origin = useContext(GraphOrigin);
  return (
    <ViewportPortal>
      {selectedId === null && (
        <div
          ref={title}
          data-map-title
          className="absolute -top-[144px] flex flex-col items-start gap-4 max-[650px]:-top-[104px]"
          style={{ left: LANE_X + 12 + origin.x, transform: `translateY(${origin.y}px)` }}
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
  );
}

export function CurriculumMap({
  stage,
  active,
  navigation,
  resetVersion,
  onReset,
  onVisibleSemesters,
  close,
  curriculum,
  selectedId,
  nodes,
  edges,
  lastSemester,
}: {
  stage: RefObject<HTMLDivElement | null>;
  active: boolean;
  navigation: { semester: number } | null;
  resetVersion: number;
  onReset: () => void;
  onVisibleSemesters: (semesters: number[]) => void;
  close: () => void;
  curriculum: CurriculumId;
  selectedId: string | null;
  nodes: MapNode[];
  edges: Edge[];
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
      <MotionGraph<MapNode>
        selectedId={selectedId}
        resetKey={`${curriculum}:${resetVersion}`}
        navigation={navigation}
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
        />
        <ZoomControls
          shortcuts={[
            { key: "f", description: "Buka/tutup filter" },
            { key: "v", description: "Ganti tampilan" },
            { key: "/", description: "Cari mata kuliah" },
            { key: "d", description: "Ganti tema" },
          ]}
          onReset={onReset}
          selected={selectedId !== null}
          lastSemester={lastSemester}
        />
        <SemesterViewport
          active={active}
          selectedId={selectedId}
          onVisibleSemesters={onVisibleSemesters}
        />
        <MapTitle selectedId={selectedId} title={title} />
        <Background
          className="bg-bg-weak-25"
          variant={BackgroundVariant.Dots}
          color="var(--color-stroke-sub-300)"
          gap={24}
          size={1.2}
        />
      </MotionGraph>
    </EdgeRouting>
  );
}
