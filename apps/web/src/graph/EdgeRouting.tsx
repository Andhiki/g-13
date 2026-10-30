import { createContext, useContext, useLayoutEffect, useMemo, type ReactNode } from "react";
import {
  BaseEdge,
  ReactFlowProvider,
  useStore,
  type Edge,
  type EdgeProps,
  type XYPosition,
} from "@xyflow/react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { routePath } from "./route-motion";

export const ConnectionPaths = createContext<ReadonlyMap<string, XYPosition[]>>(new Map());

export const ConnectionVisibility = createContext({
  incoming: new Set<string>(),
  outgoing: new Set<string>(),
});

function VisibleConnections({ children }: { children: ReactNode }) {
  const edges = useStore(
    (state) => state.edges,
    (previous, next) =>
      previous.length === next.length &&
      previous.every(
        (edge, index) =>
          edge.source === next[index].source &&
          edge.target === next[index].target &&
          edge.hidden === next[index].hidden &&
          edge.data?.visible === next[index].data?.visible,
      ),
  );
  const visibility = useMemo(() => {
    const incoming = new Set<string>();
    const outgoing = new Set<string>();
    for (const edge of edges) {
      if (edge.hidden || !edge.data?.visible) continue;
      incoming.add(edge.target);
      outgoing.add(edge.source);
    }
    return { incoming, outgoing };
  }, [edges]);
  return (
    <ConnectionVisibility.Provider value={visibility}>{children}</ConnectionVisibility.Provider>
  );
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
      <ZoomDetail />
      <VisibleConnections>{children}</VisibleConnections>
    </ReactFlowProvider>
  );
}

function RoutedEdge(
  props: EdgeProps<Edge<{ visible: boolean; charging: boolean; moving: boolean }>>,
) {
  const points = useContext(ConnectionPaths).get(props.id);
  const path =
    points && props.data?.visible !== false
      ? routePath(
          points,
          { x: props.sourceX, y: props.sourceY },
          { x: props.targetX, y: props.targetY },
        )
      : undefined;
  const reducedMotion = useReducedMotion();
  const { opacity = 1, ...style } = props.style ?? {};
  return (
    <AnimatePresence>
      {path && props.data?.visible !== false && (
        <m.g
          key={props.id}
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion || props.data?.moving ? 0 : 0.15, ease: "easeOut" }}
        >
          <BaseEdge
            id={props.id}
            path={path}
            data-routed="true"
            interactionWidth={props.interactionWidth}
            className="transition-[stroke,stroke-width] duration-150 motion-reduce:transition-none"
            style={style}
          />
          {props.data?.charging && (
            <path
              d={path}
              pathLength={1}
              className="course-connection-charge"
              style={{
                stroke: "var(--color-text-strong-950)",
                animationPlayState: props.data.moving ? "paused" : "running",
              }}
            />
          )}
        </m.g>
      )}
    </AnimatePresence>
  );
}

export const routedEdgeTypes = { routed: RoutedEdge };
