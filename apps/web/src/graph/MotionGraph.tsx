import { createContext, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { ConnectionPaths } from "./EdgeRouting";
import { getConnectionRoutes, routingRequest } from "./routing-cache";
import type { RoutingNode } from "./connection-routes";
import { courseLayout } from "../courses/layout";

export const GraphOrigin = createContext<XYPosition>({ x: 0, y: 0 });

const duration = 400;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const mix = (from: number, to: number, t: number) => from + (to - from) * t;

function focusViewport(nodes: Node[], selected: Node, width: number, height: number): Viewport {
  const phone = window.matchMedia(courseLayout.phoneQuery).matches;
  const left = phone ? 16 : courseLayout.detailsWidth + 24;
  const top = phone ? 128 : 96;
  const availableWidth = Math.max(1, width - left - 16);
  const availableHeight = Math.max(
    1,
    height - top - 24 - (phone ? (innerHeight * courseLayout.sheetHeights[0]) / 100 : 0),
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
    phone ? 0.65 : 0.05,
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
  active = true,
  onMoveStart,
  onMoveEnd,
  ...props
}: ReactFlowProps<N, Edge> & {
  nodes: N[];
  edges: Edge[];
  selectedId: string | null;
  resetKey: string;
  navigation: { semester: number } | null;
  active?: boolean;
}) {
  const { getViewport, setViewport, getInternalNode, viewportInitialized } = useReactFlow();
  const [routes, setRoutes] = useState<Awaited<ReturnType<typeof getConnectionRoutes>>>(new Map());
  const [initialized, setInitialized] = useState(false);
  const nodesInitialized = useStore(
    (state) =>
      initialized ||
      (state.nodeLookup.size > 0 &&
        Array.from(state.nodeLookup.values()).every(
          (node) =>
            node.hidden ||
            node.type === "lane" ||
            (node.measured.width &&
              node.measured.height &&
              (node.type !== "course" || node.internals.handleBounds !== undefined)),
        )),
  );
  const element = useStore((state) => state.domNode);
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);
  const [displayed, setDisplayed] = useState(nodes);
  const [moving, setMoving] = useState(false);
  const current = useRef(displayed);
  const measurements = useRef(new Map<string, Omit<RoutingNode, "id" | "position">>());
  const [routingError, setRoutingError] = useState<Error>();
  const previous = useRef({ selectedId, resetKey, navigation, active });
  const cameraMoving = useRef(false);
  const inFlight = useRef(false);
  const offset = useRef<XYPosition>({ x: 0, y: 0 });
  const settled = useEffectEvent(() => {
    if (active) onMoveEnd?.(null, getViewport());
  });

  useLayoutEffect(() => {
    if (!viewportInitialized || !nodesInitialized || !element) return;
    const before = previous.current;
    const reset = before.resetKey !== resetKey || before.navigation !== navigation;
    const selectionChanged = before.selectedId !== selectedId;
    const returning = !reset && selectionChanged && selectedId === null;
    previous.current = { selectedId, resetKey, navigation, active };
    if (reset) offset.current = { x: 0, y: 0 };
    const elements = new Map(
      Array.from(element.querySelectorAll<HTMLElement>(".react-flow__node")).map((node) => [
        node.dataset.id,
        node,
      ]),
    );
    const snapshot =
      active && inFlight.current
        ? current.current.map((node) => {
            const element = elements.get(node.id);
            if (!element) return node;
            const style = getComputedStyle(element);
            const transform = new DOMMatrixReadOnly(style.transform);
            return {
              ...node,
              measured: getInternalNode(node.id)?.measured ?? node.measured,
              position: { x: transform.m41, y: transform.m42 },
              style: { ...node.style, opacity: Number(style.opacity), transition: "none" },
            };
          })
        : current.current;
    current.current = snapshot;
    setDisplayed(snapshot);
    const starts = new Map(snapshot.map((node) => [node.id, node]));
    const anchorId = selectedId ?? before.selectedId;
    const anchor = starts.get(anchorId ?? "");
    const destination = nodes.find((node) => node.id === anchorId);
    if (!reset && selectionChanged && anchor && destination) {
      offset.current = {
        x: anchor.position.x - destination.position.x,
        y: anchor.position.y - destination.position.y,
      };
    }
    const measure = (node: N) => {
      const internal = getInternalNode(node.id);
      if (
        internal?.measured.width &&
        internal.measured.height &&
        (node.type !== "course" || internal.internals.handleBounds)
      ) {
        const width = internal.measured.width;
        const height = internal.measured.height;
        const output = internal.internals.handleBounds?.source?.find(
          (handle) => handle.id === "out",
        );
        const input = internal.internals.handleBounds?.target?.find((handle) => handle.id === "in");
        measurements.current.set(node.id, {
          measured: { width, height },
          source: {
            x: output ? output.x + output.width : width,
            y: output ? output.y + output.height / 2 : height / 2,
          },
          target: { x: input ? input.x : 0, y: input ? input.y + input.height / 2 : height / 2 },
        });
      }
      return (
        measurements.current.get(node.id) ?? {
          measured: { width: courseLayout.cardWidth, height: courseLayout.cardHeight },
          source: { x: courseLayout.cardWidth, y: courseLayout.cardHeight / 2 },
          target: { x: 0, y: courseLayout.cardHeight / 2 },
        }
      );
    };
    const targets = nodes
      .filter((node) => !node.hidden)
      .map((node) => ({
        ...node,
        measured: measure(node).measured,
        position: { x: node.position.x + offset.current.x, y: node.position.y + offset.current.y },
      }));
    const targetIds = new Set(targets.map((node) => node.id));
    const leaving = current.current.filter((node) => !targetIds.has(node.id));
    const startViewport = getViewport();
    const selected = targets.find((node) => node.id === selectedId);
    const endViewport = selected ? focusViewport(targets, selected, width, height) : startViewport;
    cameraMoving.current = selected !== undefined && !reset && before.active === active;
    if (!active) void setViewport(startViewport);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate =
      active &&
      before.active &&
      !reset &&
      (selectionChanged || selectedId !== null || inFlight.current) &&
      !reducedMotion;
    inFlight.current = animate;
    setMoving(true);
    let frame = 0;
    let cancelled = false;
    let started = 0;
    let nodeProgress = 0;
    let routesReady = false;
    const movingNode = targets.find((node) => {
      const start = starts.get(node.id);
      return (
        start &&
        Math.hypot(start.position.x - node.position.x, start.position.y - node.position.y) > 0.01
      );
    });
    const movingElement = movingNode ? elements.get(movingNode.id) : undefined;
    let nodeAnimation: Animation | undefined;
    const render = (time: number) => {
      // Follow the CSS clock: React may commit card destinations after this loop starts.
      nodeAnimation ??= movingElement
        ?.getAnimations()
        .find(
          (animation) =>
            animation instanceof CSSTransition && animation.transitionProperty === "transform",
        );
      const cssTime = nodeAnimation?.currentTime;
      const cssDuration = nodeAnimation?.effect?.getComputedTiming().duration;
      const animationDuration = typeof cssDuration === "number" ? cssDuration : duration;
      let elapsed = time - started;
      if (movingElement && (nodeAnimation || elapsed < duration))
        elapsed = typeof cssTime === "number" ? cssTime : 0;
      nodeProgress = animate ? Math.max(nodeProgress, Math.min(1, elapsed / animationDuration)) : 1;
      const progress = nodeProgress;
      const t = ease(progress);
      if (cameraMoving.current)
        void setViewport({
          x: mix(startViewport.x, endViewport.x, t),
          y: mix(startViewport.y, endViewport.y, t),
          zoom: mix(startViewport.zoom, endViewport.zoom, t),
        });
      if (progress < 1) frame = requestAnimationFrame(render);
      else if (routesReady) {
        inFlight.current = false;
        setMoving(false);
        current.current = targets;
        setDisplayed(targets);
        if (active) frame = requestAnimationFrame(settled);
      }
    };
    const start = () => {
      const transition = animate
        ? `transform ${duration}ms cubic-bezier(0.333333, 1, 0.666667, 1), opacity ${duration}ms cubic-bezier(0.333333, 1, 0.666667, 1)`
        : "none";
      const next: N[] = targets.map((node) => ({
        ...node,
        style: { ...node.style, opacity: 1, transition },
      }));
      if (animate) {
        for (const node of leaving)
          next.push({
            ...node,
            style: { ...node.style, opacity: 0, transition, pointerEvents: "none" },
          });
      }
      current.current = next;
      setDisplayed(next);
      started = performance.now();
      if (returning && animate) frame = requestAnimationFrame(render);
      else render(started);
    };
    start();
    const routingNodes = targets
      .filter((node) => node.type !== "lane")
      .map((node): RoutingNode => {
        const { measured, source, target } = measure(node);
        return {
          id: node.id,
          position: node.position,
          measured,
          source: { x: node.position.x + source.x, y: node.position.y + source.y },
          target: { x: node.position.x + target.x, y: node.position.y + target.y },
        };
      });
    const request = routingRequest(routingNodes, edges);
    getConnectionRoutes(JSON.stringify(request), request).then(
      (routes) => {
        if (cancelled) return;
        setRoutes(routes);
        setInitialized(true);
        routesReady = true;
        cancelAnimationFrame(frame);
        if (animate) frame = requestAnimationFrame(render);
        else render(performance.now());
      },
      (error: Error) => {
        if (!cancelled) setRoutingError(error);
      },
    );
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [
    nodes,
    active,
    selectedId,
    resetKey,
    navigation,
    viewportInitialized,
    nodesInitialized,
    width,
    height,
    getViewport,
    setViewport,
    getInternalNode,
    element,
  ]);

  if (routingError) throw routingError;

  const visibleEdges = useMemo(
    () => edges.map((edge) => ({ ...edge, data: { ...edge.data, moving, active } })),
    [edges, moving, active],
  );
  return (
    <GraphOrigin.Provider value={offset.current}>
      <ConnectionPaths.Provider value={routes}>
        <ReactFlow<N, Edge>
          {...props}
          data-graph-active={active}
          onMoveEnd={onMoveEnd}
          onMoveStart={(event, viewport) => {
            if (event) cameraMoving.current = false;
            onMoveStart?.(event, viewport);
          }}
          nodes={displayed}
          edges={visibleEdges}
        />
      </ConnectionPaths.Provider>
    </GraphOrigin.Provider>
  );
}
