import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import {
  getViewportForBounds,
  getBezierPath,
  BaseEdge,
  type EdgeProps,
  Background,
  BackgroundVariant,
  ReactFlow,
  useReactFlow,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import type { CurriculumId } from "../../../data";
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
  const [displayed, setDisplayed] = useState({ nodes, edgeProgress: 0 });
  const current = useRef(nodes);

  useLayoutEffect(() => {
    const selected = nodes.find((node) => node.type === "course" && node.data.state === "selected");
    const previous = new Map(current.current.map((node) => [node.id, node]));
    const targetIds = new Set(nodes.map((node) => node.id));
    const update = (seconds: number) => {
      const outgoing = Math.max(0, 1 - seconds / 0.18);
      const incoming = Math.min(1, Math.max(0, (seconds - 0.7) / 0.25));
      const frame = nodes.map((node) => {
        if (!selected || node.id === selected.id) return node;
        const old = previous.get(node.id);
        if (outgoing > 0 && old) {
          return withOpacity(
            { ...node, position: old.position },
            outgoing * Number(old.style?.opacity ?? 1),
          );
        }
        return withOpacity(node, incoming);
      });
      if (selected && outgoing > 0) {
        for (const old of previous.values()) {
          if (!targetIds.has(old.id)) {
            frame.push(withOpacity(old, outgoing * Number(old.style?.opacity ?? 1)));
          }
        }
      }
      current.current = frame;
      setDisplayed({
        nodes: frame,
        edgeProgress: Math.min(1, Math.max(0, (seconds - 0.95) / 0.35)),
      });
    };
    if (!selected || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      update(1.3);
      return;
    }
    update(0);
    const animation = animate(0, 1.3, { duration: 1.3, ease: "linear", onUpdate: update });
    return () => animation.stop();
  }, [nodes]);

  return displayed;
}

function RevealingEdge(props: EdgeProps<Edge<{ progress: number }>>) {
  const [path] = getBezierPath(props);
  const progress = props.data!.progress;
  return (
    <BaseEdge
      id={props.id}
      path={path}
      pathLength={1}
      markerEnd={progress === 1 ? props.markerEnd : undefined}
      style={{ strokeDasharray: 1, strokeDashoffset: 1 - progress }}
    />
  );
}

const edgeTypes = { reveal: RevealingEdge };

function ViewportFocus({
  focusKey,
  focusTarget,
  scope,
  group,
  selectedId,
  positions,
}: {
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
    let cancelled = false;
    const timer = window.setTimeout(async () => {
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
        if (!reducedMotion) {
          const selected = positions.get(selectedId)!;
          const focused = getViewportForBounds(
            { ...selected, width: 248, height: 82 },
            width,
            height,
            0.05,
            0.88,
            0.12,
          );
          await setViewport(
            { ...focused, x: focused.x + left, y: focused.y + top },
            { duration: 650, ease: (t) => 1 - Math.pow(1 - t, 4), interpolate: "linear" },
          );
          if (cancelled) return;
        }
        setViewport(target, {
          duration: reducedMotion ? 0 : 250,
          ease: (t) => 1 - Math.pow(1 - t, 4),
          interpolate: "linear",
        });
        return;
      }
      if (scope === "choices" || group !== "__all__") {
        setCenter(LANE_X + 8 * LANE_STEP + 430, 350, {
          zoom: 0.58,
          duration: reducedMotion ? 0 : 1000,
        });
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
      setCenter(phone ? 250 : 900, 360, {
        zoom: phone ? 0.64 : focusTarget === "2021" ? 0.58 : 0.68,
        duration: reducedMotion ? 0 : 1000,
      });
    }, 30);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [focusKey, focusTarget, scope, group, selectedId, positions, setCenter, setViewport]);
  return null;
}

export function CurriculumMap({
  close,
  curriculum,
  scope,
  group,
  selectedId,
  nodes,
  edges,
  positions,
}: {
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
  const revealedEdges =
    reveal.edgeProgress > 0
      ? edges.map((edge) => ({ ...edge, type: "reveal", data: { progress: reveal.edgeProgress } }))
      : [];
  return (
    <ReactFlow<MapNode, Edge>
      key={curriculum}
      className="absolute! inset-0 z-0 bg-transparent!"
      proOptions={{ hideAttribution: true }}
      onPaneClick={close}
      nodes={reveal.nodes}
      edges={revealedEdges}
      edgeTypes={edgeTypes}
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
        focusKey={focusKey}
        focusTarget={curriculum}
        scope={scope}
        group={group}
        selectedId={selectedId}
        positions={positions}
      />
      <Background
        className="bg-bg-weak-25"
        variant={BackgroundVariant.Dots}
        color="var(--color-stroke-sub-300)"
        gap={24}
        size={1.2}
      />
    </ReactFlow>
  );
}
