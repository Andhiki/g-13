import { Typography } from "../../../ui/typography";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { EdgeRouting, routedEdgeTypes, connectionReveal } from "./EdgeRouting";
import { CourseNode, LaneNode } from "./MapNodes";
import { LANE_X, LANE_STEP, LANE_WIDTH, type MapNode } from "../map-layout";
import type { Scope } from "../scope";

const nodeTypes: NodeTypes = { course: CourseNode, lane: LaneNode };

function withOpacity(node: MapNode, opacity: number): MapNode {
  if (opacity === 1) return node;
  return {
    ...node,
    style: { ...node.style, opacity },
    domAttributes: { ...node.domAttributes, inert: true },
  };
}

function useCourseReveal(nodes: MapNode[]) {
  const [displayed, setDisplayed] = useState({ nodes });
  const current = useRef(nodes);

  useLayoutEffect(() => {
    const selected = nodes.find((node) => node.type === "course" && node.data.state === "selected");
    const previous = new Map(current.current.map((node) => [node.id, node]));
    const targetIds = new Set(nodes.map((node) => node.id));
    const show = (frame: MapNode[]) => {
      current.current = frame;
      setDisplayed({ nodes: frame });
    };
    if (!selected || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      show(nodes);
      return;
    }
    const startedAt = performance.now();
    const animations: Animation[] = [];
    const fade = (element: HTMLElement, from: string, to: number, duration: number, delay = 0) => {
      const animation = element.animate([{ opacity: from }, { opacity: to }], {
        duration,
        fill: "both",
      });
      animation.startTime = startedAt + delay;
      animations.push(animation);
    };
    const outgoing = [...document.querySelectorAll<HTMLElement>(".react-flow__node")]
      .filter((element) => element.dataset.id !== selected.id)
      .map((element) => ({ element, opacity: getComputedStyle(element).opacity }));
    for (const { element, opacity } of outgoing) fade(element, opacity, 0, 180);
    show([
      ...nodes.map((node) =>
        node.id === selected.id
          ? node
          : withOpacity({ ...node, position: previous.get(node.id)?.position ?? node.position }, 0),
      ),
      ...[...previous.values()]
        .filter((node) => !targetIds.has(node.id))
        .map((node) => withOpacity(node, 0)),
    ]);
    const timers = [
      window.setTimeout(
        () => show(nodes.map((node) => (node.id === selected.id ? node : withOpacity(node, 0)))),
        180,
      ),
      window.setTimeout(() => {
        for (const node of nodes) {
          if (node.id === selected.id) continue;
          const element = document.querySelector<HTMLElement>(
            `.react-flow__node[data-id="${CSS.escape(node.id)}"]`,
          );
          if (element) fade(element, "0", 1, 250, 700);
        }
      }, 700),
      window.setTimeout(() => show(nodes), 950),
    ];
    return () => {
      timers.forEach(window.clearTimeout);
      animations.forEach((animation) => animation.cancel());
    };
  }, [nodes]);

  return displayed;
}

function ViewportFocus({
  navigation,
  focusKey,
  focusTarget,
  scope,
  group,
  selectedId,
  positions,
}: {
  navigation: { semester: number } | null;
  focusKey: string;
  focusTarget: CurriculumId;
  scope: Scope;
  group: string;
  selectedId: string | null;
  positions: Map<string, { x: number; y: number }>;
}) {
  const { setCenter, setViewport } = useReactFlow();
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      if (selectedId) {
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
      if (navigation) {
        setCenter(LANE_X + (navigation.semester - 1) * LANE_STEP + LANE_WIDTH / 2, 420, {
          zoom: 0.72,
          duration: reducedMotion ? 0 : 600,
        });
        return;
      }
      if (scope === "choices" || group !== "__all__") {
        const points = [...positions.values()].filter((point) => point.x >= LANE_X + 8 * LANE_STEP);
        if (!points.length) return;
        const stage = document.querySelector("[data-map-stage]")!.getBoundingClientRect();
        const compact = window.matchMedia("(width < 1100px)").matches;
        const left = 16;
        const top = compact ? 128 : 96;
        const right = compact ? 16 : 332;
        const minX = Math.min(...points.map((point) => point.x));
        const minY = Math.min(...points.map((point) => point.y));
        const viewport = getViewportForBounds(
          {
            x: minX,
            y: minY,
            width: Math.max(...points.map((point) => point.x)) - minX + 248,
            height: Math.max(...points.map((point) => point.y)) - minY + 82,
          },
          Math.max(1, stage.width - left - right),
          Math.max(1, stage.height - top - 72),
          0.05,
          0.88,
          0.12,
        );
        setViewport(
          { ...viewport, x: viewport.x + left, y: viewport.y + top },
          {
            duration: reducedMotion ? 0 : 1000,
          },
        );
        return;
      }
      if (scope !== "all") {
        const term = Number(scope);
        setCenter(LANE_X + (term - 1) * LANE_STEP + LANE_WIDTH / 2, 420, {
          zoom: 0.72,
          duration: reducedMotion ? 0 : 1000,
        });
        return;
      }
      const phone = window.matchMedia("(width < 650px)").matches;
      const title = document.querySelector<HTMLElement>("[data-map-title]")!;
      const heading = title.querySelector("h1")!;
      const stage = document.querySelector("[data-map-stage]")!.getBoundingClientRect();
      setCenter(LANE_X + 12 + title.offsetWidth / 2, title.offsetTop + heading.offsetHeight / 2, {
        zoom: Math.min(
          phone ? 0.64 : focusTarget === "2021" ? 0.58 : 0.68,
          (stage.width - 32) / title.offsetWidth,
        ),
        duration: reducedMotion ? 0 : 1000,
      });
    }, 30);
    return () => {
      window.clearTimeout(timer);
    };
  }, [
    navigation,
    focusKey,
    focusTarget,
    scope,
    group,
    selectedId,
    positions,
    setCenter,
    setViewport,
  ]);
  return null;
}

function SemesterViewport({
  selectedId,
  onVisibleSemesters,
}: {
  selectedId: string | null;
  onVisibleSemesters: (semesters: number[]) => void;
}) {
  const flow = useReactFlow();
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
      const laneX = LANE_X + (semester - 1) * LANE_STEP;
      const left = viewport.x + laneX * viewport.zoom;
      const width = LANE_WIDTH * viewport.zoom;
      const bottom = Math.max(
        140,
        ...nodes
          .filter(
            (node) =>
              node.type === "course" &&
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
  scope,
  group,
  selectedId,
  nodes,
  edges,
  positions,
}: {
  navigation: { semester: number } | null;
  onVisibleSemesters: (semesters: number[]) => void;
  close: () => void;
  curriculum: CurriculumId;
  scope: Scope;
  group: string;
  selectedId: string | null;
  nodes: MapNode[];
  edges: Edge[];
  positions: Map<string, { x: number; y: number }>;
}) {
  const focusKey = [curriculum, scope, group, selectedId ?? ""].join(":");
  const reveal = useCourseReveal(nodes);
  const progress = useMemo(
    () =>
      connectionReveal(
        edges.some((edge) => edge.target === selectedId),
        1.05,
      ),
    [edges, selectedId],
  );
  const revealedEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        type: "routed",
        data: {
          reveal: edge.target === selectedId ? progress.incoming : progress.outgoing,
          animationKey: selectedId,
          startedAt: progress.startedAt,
        },
      })),
    [edges, selectedId, progress.incoming, progress.outgoing],
  );
  return (
    <EdgeRouting>
      <ReactFlow<MapNode, Edge>
        key={curriculum}
        className="absolute! inset-0 z-0 bg-transparent!"
        proOptions={{ hideAttribution: true }}
        onPaneClick={close}
        nodes={reveal.nodes}
        edges={revealedEdges}
        edgeTypes={routedEdgeTypes}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 10, y: 0, zoom: 0.68 }}
        minZoom={0.05}
        maxZoom={1.35}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
        fitView={false}
        aria-label="Peta kurikulum Ilmu Komputer UGM"
      >
        <ViewportFocus
          navigation={navigation}
          focusKey={focusKey}
          focusTarget={curriculum}
          scope={scope}
          group={group}
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
                CS UGM Roadmap (Alpha)
              </Typography>
              <AlignFancyButton.Root asChild className="pointer-events-auto nodrag nopan">
                <Link to="/roadmap" search={{ lulus: 8, semesterPaparan: 6 }}>
                  Buat roadmap kuliah
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
      {!selectedId &&
        (scope === "choices" || group !== "__all__") &&
        ![...positions.values()].some((point) => point.x >= LANE_X + 8 * LANE_STEP) && (
          <p
            role="status"
            className="pointer-events-none absolute inset-x-4 top-36 text-center text-paragraph-sm text-text-sub-600"
          >
            Tidak ada mata kuliah pilihan untuk filter ini.
          </p>
        )}
    </EdgeRouting>
  );
}
