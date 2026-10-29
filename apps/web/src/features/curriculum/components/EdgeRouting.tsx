import { createContext, useContext, useLayoutEffect, useMemo, type ReactNode } from "react";
import { BaseEdge, ReactFlowProvider, useStore, type Edge, type EdgeProps } from "@xyflow/react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { connectionRoutes, type RoutingNode } from "../connection-routes";

const Routes = createContext<ReturnType<typeof connectionRoutes>>(new Map());

function MeasuredRouting({ children }: { children: ReactNode }) {
  const measuredNodes = useStore(
    (state) =>
      Array.from(state.nodeLookup.values()).filter(
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
            x: position.x + (output ? output.x + output.width / 2 : width),
            y: position.y + (output ? output.y + output.height / 2 : height / 2),
          },
          target: {
            x: position.x + (input ? input.x + input.width / 2 : 0),
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
  const routes = useMemo(
    () => connectionRoutes(nodes, edges, { includeUnrevealed: true }),
    [nodes, edges],
  );
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

function RoutedEdge(props: EdgeProps<Edge<{ visible: boolean; charging: boolean }>>) {
  const route = useContext(Routes).get(props.id);
  const reducedMotion = useReducedMotion();
  const { opacity = 1, ...style } = props.style ?? {};
  return (
    <AnimatePresence>
      {route && props.data?.visible !== false && (
        <m.g
          key={props.id}
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.15, ease: "easeOut" }}
        >
          <BaseEdge
            id={props.id}
            path={route.path}
            interactionWidth={props.interactionWidth}
            data-routed="true"
            className="transition-[stroke,stroke-width] duration-150 motion-reduce:transition-none"
            style={style}
          />
          {props.data?.charging && (
            <path
              d={route.path}
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
