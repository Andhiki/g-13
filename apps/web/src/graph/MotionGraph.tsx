import { createContext, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import {
  ReactFlow,
  useReactFlow,
  useStore,
  type Edge,
  type Node,
  type ReactFlowProps,
  type Viewport,
  type XYPosition,
} from "@xyflow/react";
import { courseLayout } from "../courses/layout";

export const GraphOrigin = createContext<XYPosition>({ x: 0, y: 0 });

const duration = 400;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const mix = (from: number, to: number, t: number) => from + (to - from) * t;

function focusViewport(
  nodes: Node[],
  selected: Node,
  width: number,
  height: number,
  sheetHeight: number,
): Viewport {
  const phone = window.matchMedia(courseLayout.phoneQuery).matches;
  const left = phone ? 16 : courseLayout.detailsWidth + 24;
  const top = phone ? 128 : 96;
  const availableWidth = Math.max(1, width - left - 16);
  const availableHeight = Math.max(
    1,
    height - top - 24 - (phone ? (innerHeight * sheetHeight) / 100 : 0),
  );
  const center = {
    x: selected.position.x + courseLayout.cardWidth / 2,
    y: selected.position.y + courseLayout.cardHeight / 2,
  };
  const radiusX = Math.max(
    ...nodes.map(
      (node) =>
        Math.abs(node.position.x + courseLayout.cardWidth / 2 - center.x) +
        courseLayout.cardWidth / 2,
    ),
  );
  const radiusY = Math.max(
    ...nodes.map(
      (node) =>
        Math.abs(node.position.y + courseLayout.cardHeight / 2 - center.y) +
        courseLayout.cardHeight / 2,
    ),
  );
  const zoom = Math.max(
    0.05,
    Math.min(0.88, availableWidth / (radiusX * 2.24), availableHeight / (radiusY * 2.24)),
  );
  return {
    x: left + availableWidth / 2 - center.x * zoom,
    y: top + availableHeight / 2 - center.y * zoom,
    zoom,
  };
}

export function MotionGraph<N extends Node>({
  nodes,
  edges,
  selectedId,
  resetKey,
  navigation,
  sheetHeight = courseLayout.sheetHeights[0],
  onMoveStart,
  onMoveEnd,
  ...props
}: ReactFlowProps<N, Edge> & {
  nodes: N[];
  edges: Edge[];
  selectedId: string | null;
  resetKey: string;
  navigation: { semester: number } | null;
  sheetHeight?: number;
}) {
  const { getViewport, setViewport, viewportInitialized } = useReactFlow();
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);
  const [displayed, setDisplayed] = useState(nodes);
  const [moving, setMoving] = useState(false);
  const current = useRef(displayed);
  const currentEdges = useRef(edges);
  const [leavingEdges, setLeavingEdges] = useState<Edge[]>([]);
  const previous = useRef({ selectedId, resetKey, navigation });
  const cameraMoving = useRef(false);
  const inFlight = useRef(false);
  const offset = useRef<XYPosition>({ x: 0, y: 0 });
  const settled = useEffectEvent(() => onMoveEnd?.(null, getViewport()));

  useLayoutEffect(() => {
    if (!viewportInitialized) return;
    const before = previous.current;
    const reset = before.resetKey !== resetKey || before.navigation !== navigation;
    const selectionChanged = before.selectedId !== selectedId;
    previous.current = { selectedId, resetKey, navigation };
    if (reset) offset.current = { x: 0, y: 0 };
    const edgeIds = new Set(edges.map((edge) => edge.id));
    const outgoing = inFlight.current
      ? [...currentEdges.current, ...leavingEdges]
      : currentEdges.current;
    setLeavingEdges(outgoing.filter((edge) => !edgeIds.has(edge.id)));
    currentEdges.current = edges;
    const starts = new Map(current.current.map((node) => [node.id, node]));
    const anchorId = selectedId ?? before.selectedId;
    const anchor = starts.get(anchorId ?? "");
    const destination = nodes.find((node) => node.id === anchorId);
    if (!reset && selectionChanged && anchor && destination) {
      offset.current = {
        x: anchor.position.x - destination.position.x,
        y: anchor.position.y - destination.position.y,
      };
    }
    const targets = nodes
      .filter((node) => !node.hidden)
      .map((node) => ({
        ...node,
        position: { x: node.position.x + offset.current.x, y: node.position.y + offset.current.y },
      }));
    const targetIds = new Set(targets.map((node) => node.id));
    const leaving = current.current.filter((node) => !targetIds.has(node.id));
    const startViewport = getViewport();
    const selected = targets.find((node) => node.id === selectedId);
    const endViewport = selected
      ? focusViewport(targets, selected, width, height, sheetHeight)
      : startViewport;
    cameraMoving.current = selected !== undefined && !reset;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate =
      !reset && (selectionChanged || selectedId !== null || inFlight.current) && !reducedMotion;
    inFlight.current = animate;
    let frame = 0;
    const started = performance.now();
    setMoving(animate);
    const render = (time: number) => {
      const progress = animate ? Math.min(1, (time - started) / duration) : 1;
      const t = ease(progress);
      const next = targets.map((node) => {
        const start = starts.get(node.id);
        const opacity = start && !start.hidden ? Number(start.style?.opacity ?? 1) : 0;
        return {
          ...node,
          position: {
            x: mix(start?.position.x ?? node.position.x, node.position.x, t),
            y: mix(start?.position.y ?? node.position.y, node.position.y, t),
          },
          style: { ...node.style, opacity: mix(opacity, 1, t) },
        };
      });
      if (progress < 1) {
        for (const node of leaving)
          next.push({
            ...node,
            style: {
              ...node.style,
              opacity: Number(node.style?.opacity ?? 1) * (1 - t),
              pointerEvents: "none",
            },
          });
      }
      current.current = next;
      setDisplayed(next);
      if (cameraMoving.current)
        void setViewport({
          x: mix(startViewport.x, endViewport.x, t),
          y: mix(startViewport.y, endViewport.y, t),
          zoom: mix(startViewport.zoom, endViewport.zoom, t),
        });
      if (progress < 1) frame = requestAnimationFrame(render);
      else {
        inFlight.current = false;
        setMoving(false);
        frame = requestAnimationFrame(settled);
      }
    };
    render(started);
    return () => cancelAnimationFrame(frame);
  }, [
    nodes,
    selectedId,
    resetKey,
    navigation,
    viewportInitialized,
    width,
    height,
    sheetHeight,
    getViewport,
    setViewport,
  ]);

  const opacity = new Map(displayed.map((node) => [node.id, Number(node.style?.opacity ?? 1)]));
  const edgeIds = new Set(edges.map((edge) => edge.id));
  const visibleEdges = moving
    ? [...edges, ...leavingEdges.filter((edge) => !edgeIds.has(edge.id))]
    : edges;
  return (
    <GraphOrigin.Provider value={offset.current}>
      <ReactFlow<N, Edge>
        {...props}
        onMoveEnd={onMoveEnd}
        onMoveStart={(event, viewport) => {
          if (event) cameraMoving.current = false;
          onMoveStart?.(event, viewport);
        }}
        nodes={displayed}
        edges={visibleEdges.map((edge) => ({
          ...edge,
          style: {
            ...edge.style,
            opacity:
              Number(edge.style?.opacity ?? 1) *
              Math.min(opacity.get(edge.source) ?? 0, opacity.get(edge.target) ?? 0),
          },
          data: { ...edge.data, moving },
        }))}
      />
    </GraphOrigin.Provider>
  );
}
