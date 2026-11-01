import { createContext, useContext, type ReactNode } from "react";
import { BaseEdge, ReactFlowProvider, type Edge, type EdgeProps } from "@xyflow/react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import type { RoutingResult } from "./connection-routing.worker";

export const ConnectionPaths = createContext<RoutingResult>(new Map());
export function EdgeRouting({ children }: { children: ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
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
