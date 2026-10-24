import { useEffect } from "react";
import {
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
  const { setCenter } = useReactFlow();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (selectedId) {
        const position = positions.get(selectedId);
        if (position) {
          const zoom = 0.88;
          const stageHeight =
            document.querySelector(".map-stage")?.getBoundingClientRect().height ??
            window.innerHeight;
          const phoneOffset = window.matchMedia("(width < 650px)").matches
            ? (stageHeight * 0.12) / zoom
            : 0;
          const panelOffset = window.matchMedia("(width < 650px)").matches ? 0 : 200 / zoom;
          setCenter(position.x + 124 - panelOffset, position.y + 40 + phoneOffset, {
            zoom,
            duration: 350,
          });
        }
        return;
      }
      if (scope === "choices" || group !== "__all__") {
        setCenter(LANE_X + 8 * LANE_STEP + 430, 350, { zoom: 0.58, duration: 350 });
        return;
      }
      if (scope !== "all") {
        const term = Number(scope);
        setCenter(LANE_X + (term - 1) * LANE_STEP + LANE_WIDTH / 2, 420, {
          zoom: 0.72,
          duration: 350,
        });
        return;
      }
      const phone = window.matchMedia("(width < 650px)").matches;
      setCenter(phone ? 250 : 900, 360, {
        zoom: phone ? 0.64 : focusTarget === "2021" ? 0.58 : 0.68,
        duration: 350,
      });
    }, 30);
    return () => window.clearTimeout(timer);
  }, [focusKey, focusTarget, scope, group, selectedId, positions, setCenter]);
  return null;
}

export function CurriculumMap({
  curriculum,
  scope,
  group,
  selectedId,
  nodes,
  edges,
  positions,
}: {
  curriculum: CurriculumId;
  scope: Scope;
  group: string;
  selectedId: string | null;
  nodes: MapNode[];
  edges: Edge[];
  positions: Map<string, { x: number; y: number }>;
}) {
  const focusKey = [curriculum, scope, group, selectedId ?? ""].join(":");
  return (
    <ReactFlow<MapNode, Edge>
      key={curriculum}
      proOptions={{ hideAttribution: true }}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      defaultViewport={{ x: 10, y: 0, zoom: 0.68 }}
      minZoom={0.18}
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
        variant={BackgroundVariant.Dots}
        color="var(--color-stroke-sub-300)"
        gap={24}
        size={1.2}
      />
    </ReactFlow>
  );
}
