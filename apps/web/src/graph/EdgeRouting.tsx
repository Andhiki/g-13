import { createContext, useLayoutEffect, useMemo, type ReactNode } from "react";
import {
  BaseEdge,
  getSmoothStepPath,
  ReactFlowProvider,
  useStore,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
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
  const path = getSmoothStepPath(props)[0];
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
          transition={{ duration: reducedMotion || props.data?.moving ? 0 : 0.15, ease: "easeOut" }}
        >
          <BaseEdge
            id={props.id}
            path={path}
            interactionWidth={props.interactionWidth}
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
