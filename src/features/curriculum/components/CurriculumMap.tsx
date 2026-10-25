import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import {
  getViewportForBounds,
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

function useAnimatedNodes(nodes: MapNode[]) {
  const [displayed, setDisplayed] = useState(nodes);
  const current = useRef(nodes);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const previous = new Map(current.current.map((node) => [node.id, node.position]));
    const starts = nodes.map((node) => previous.get(node.id) ?? node.position);
    const moving = nodes.some(
      (node, index) => node.position.x !== starts[index]!.x || node.position.y !== starts[index]!.y,
    );
    const update = (progress: number) => {
      const frame = nodes.map((node, index) => ({
        ...node,
        position: {
          x: starts[index]!.x + (node.position.x - starts[index]!.x) * progress,
          y: starts[index]!.y + (node.position.y - starts[index]!.y) * progress,
        },
      }));
      current.current = frame;
      setDisplayed(frame);
    };
    if (reducedMotion || !moving) {
      update(1);
      return;
    }
    update(0);
    const animation = animate(0, 1, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: update,
    });
    return () => animation.stop();
  }, [nodes]);

  return displayed;
}

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
        setViewport(
          { ...viewport, x: viewport.x + left, y: viewport.y + top },
          {
            duration: reducedMotion ? 0 : 1000,
            ease: (t) => 1 - Math.pow(1 - t, 4),
            interpolate: "linear",
          },
        );
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
    return () => window.clearTimeout(timer);
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
  const animatedNodes = useAnimatedNodes(nodes);
  return (
    <ReactFlow<MapNode, Edge>
      key={curriculum}
      className="absolute! inset-0 z-0 bg-transparent!"
      proOptions={{ hideAttribution: true }}
      onPaneClick={close}
      nodes={animatedNodes}
      edges={edges}
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
