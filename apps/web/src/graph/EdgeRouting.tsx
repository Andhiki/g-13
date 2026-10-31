import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import {
  BaseEdge,
  ReactFlowProvider,
  useStore,
  useStoreApi,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import type { RoutingResult } from "./connection-routing.worker";
import { connectionVisibility } from "./connection-visibility";

export const ConnectionPaths = createContext<RoutingResult>(new Map());
export const ConnectionVisibility = createContext(connectionVisibility());

function VisibleConnections({ children }: { children: ReactNode }) {
  const store = useStoreApi();
  const [visibility] = useState(connectionVisibility);
  useLayoutEffect(() => {
    visibility.update(store.getState().edges);
    return store.subscribe((state, previous) => {
      if (state.edges !== previous.edges) visibility.update(state.edges);
    });
  }, [store, visibility]);
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
  props: EdgeProps<Edge<{ visible: boolean; charging: boolean; moving: boolean; active: boolean }>>,
) {
  const paths = useContext(ConnectionPaths);
  const path = paths.get(props.id)?.path;
  const reducedMotion = useReducedMotion();
  const { opacity = 1, ...style } = props.style ?? {};
  return (
    <AnimatePresence>
      {path && props.data?.visible !== false && (
        <m.g
          key={props.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: props.data?.moving ? 0 : opacity }}
          exit={{ opacity: 0 }}
          transition={{
            duration:
              reducedMotion || props.data?.moving || props.data?.active === false ? 0 : 0.15,
            ease: "easeOut",
          }}
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
              className="pointer-events-none animate-[course-connection-charge_9s_linear_infinite] fill-none stroke-[3] [stroke-linecap:round] [stroke-dasharray:0.012_0.988] motion-reduce:hidden"
              style={{
                stroke: "var(--color-text-strong-950)",
                animationPlayState:
                  props.data.moving || props.data.active === false ? "paused" : "running",
              }}
            />
          )}
        </m.g>
      )}
    </AnimatePresence>
  );
}

export const routedEdgeTypes = { routed: RoutedEdge };
