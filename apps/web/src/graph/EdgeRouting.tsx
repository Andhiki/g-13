import {
  createContext,
  useContext,
  useLayoutEffect,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BaseEdge,
  getBezierPath,
  ReactFlowProvider,
  useStore,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import type { RoutingNode } from "./connection-routes";
import type { RoutingResult } from "./connection-routing.worker";
import { getConnectionRoutes, routingRequest } from "./routing-cache";

const emptyRoutes: RoutingResult = new Map();
const Routes = createContext(emptyRoutes);

function MeasuredRouting({ children }: { children: ReactNode }) {
  const moving = useStore((state) => state.edges.some((edge) => edge.data?.moving));
  const measuredNodes = useStore(
    (state) =>
      state.edges.some((edge) => edge.data?.moving)
        ? []
        : Array.from(state.nodeLookup.values()).filter(
            (node) =>
              node.type !== "lane" && !node.hidden && node.measured.width && node.measured.height,
          ),
    (previous, next) =>
      previous.length === next.length &&
      previous.every((node, index) => {
        const other = next[index];
        const position = node.internals.positionAbsolute;
        const otherPosition = other.internals.positionAbsolute;
        return (
          node.id === other.id &&
          position.x === otherPosition.x &&
          position.y === otherPosition.y &&
          node.measured.width === other.measured.width &&
          node.measured.height === other.measured.height &&
          node.internals.handleBounds === other.internals.handleBounds
        );
      }),
  );
  const nodes = useMemo(
    () =>
      measuredNodes.map((node): RoutingNode => {
        const position = node.internals.positionAbsolute;
        const width = node.measured.width ?? 0;
        const height = node.measured.height ?? 0;
        const output = node.internals.handleBounds?.source?.find((handle) => handle.id === "out");
        const input = node.internals.handleBounds?.target?.find((handle) => handle.id === "in");
        return {
          id: node.id,
          position,
          measured: { width, height },
          source: {
            x: position.x + (output ? output.x + output.width : width),
            y: position.y + (output ? output.y + output.height / 2 : height / 2),
          },
          target: {
            x: position.x + (input ? input.x : 0),
            y: position.y + (input ? input.y + input.height / 2 : height / 2),
          },
        };
      }),
    [measuredNodes],
  );
  const edges = useStore(
    (state) => state.edges,
    (previous, next) =>
      previous.length === next.length &&
      previous.every(
        (edge, index) =>
          edge.id === next[index].id &&
          edge.source === next[index].source &&
          edge.target === next[index].target &&
          edge.hidden === next[index].hidden &&
          edge.data?.optional === next[index].data?.optional,
      ),
  );
  const request = useMemo(() => routingRequest(nodes, moving ? [] : edges), [nodes, edges, moving]);
  const routingKey = useMemo(() => JSON.stringify(request), [request]);
  const [result, setResult] = useState<{ key: string; routes: RoutingResult }>();
  const [error, setError] = useState<Error>();
  useEffect(() => {
    let active = true;
    getConnectionRoutes(routingKey, request).then(
      (routes) => {
        if (active) setResult({ key: routingKey, routes });
      },
      (error: Error) => {
        if (active) setError(error);
      },
    );
    return () => {
      active = false;
    };
  }, [request, routingKey]);
  if (error) throw error;
  const routes = result?.key === routingKey ? result.routes : emptyRoutes;
  return <Routes.Provider value={routes}>{children}</Routes.Provider>;
}

function ZoomDetail() {
  const compact = useStore((state) => state.transform[2] < 0.7);
  const element = useStore((state) => state.domNode);
  useLayoutEffect(() => {
    if (!element) return;
    element.dataset.compactNodes = String(compact);
    return () => {
      delete element.dataset.compactNodes;
    };
  }, [element, compact]);
  return null;
}

export function EdgeRouting({ children }: { children: ReactNode }) {
  return (
    <ReactFlowProvider>
      <MeasuredRouting>
        <ZoomDetail />
        {children}
      </MeasuredRouting>
    </ReactFlowProvider>
  );
}

function RoutedEdge(
  props: EdgeProps<Edge<{ visible: boolean; charging: boolean; moving: boolean }>>,
) {
  const route = useContext(Routes).get(props.id);
  const start = route?.points[0];
  const end = route?.points.at(-1);
  const routed =
    !props.data?.moving &&
    start &&
    end &&
    Math.abs(start[0] - props.sourceX) < 1 &&
    Math.abs(start[1] - props.sourceY) < 1 &&
    Math.abs(end[0] - props.targetX) < 1 &&
    Math.abs(end[1] - props.targetY) < 1;
  const path = routed ? route.path : getBezierPath(props)[0];
  const reducedMotion = useReducedMotion();
  const { opacity = 1, ...style } = props.style ?? {};
  return (
    <AnimatePresence>
      {props.data?.visible !== false && (
        <m.g
          key={props.id}
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.15, ease: "easeOut" }}
        >
          <BaseEdge
            id={props.id}
            path={path}
            interactionWidth={props.interactionWidth}
            data-routed={routed ? "true" : undefined}
            className="transition-[stroke,stroke-width] duration-150 motion-reduce:transition-none"
            style={style}
          />
          {props.data?.charging && (
            <path
              d={path}
              pathLength={1}
              className="course-connection-charge"
              style={{ stroke: "var(--color-text-strong-950)" }}
            />
          )}
        </m.g>
      )}
    </AnimatePresence>
  );
}

export const routedEdgeTypes = { routed: RoutedEdge };
