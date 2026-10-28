import { useLayoutEffect, type ReactNode } from "react";
import { BaseEdge, ReactFlowProvider, useStore, type Edge, type EdgeProps } from "@xyflow/react";
import { SmartEdgeProvider, useSmartEdgePath } from "@tisoap/react-flow-smart-edge";

import { connectionPath } from "../connection-path";

// Leave a routing corridor in the 14px gap between roadmap rows.
const pathOptions = { nodePadding: 4, gridRatio: 4, borderRadius: 16 };
const routingOptions = {
  preset: "smoothstep",
  routeOnlyWhenBlocked: false,
  ...pathOptions,
} as const;

function MeasuredRouting({ children }: { children: ReactNode }) {
  const nodes = useStore(
    (state) =>
      Array.from(state.nodeLookup.values())
        .filter((node) => node.type !== "lane" && !node.hidden)
        .map((node) => ({
          id: node.id,
          data: {},
          position: {
            x: node.internals.positionAbsolute.x - 40,
            y: node.internals.positionAbsolute.y,
          },
          measured: { width: (node.measured.width ?? 0) + 80, height: node.measured.height ?? 0 },
        })),
    (previous, next) =>
      previous.length === next.length &&
      previous.every((node, index) => {
        const other = next[index];
        return (
          node.id === other.id &&
          node.position.x === other.position.x &&
          node.position.y === other.position.y &&
          node.measured.width === other.measured.width &&
          node.measured.height === other.measured.height
        );
      }),
  );
  return (
    <SmartEdgeProvider nodes={nodes} options={routingOptions}>
      {children}
    </SmartEdgeProvider>
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
      <MeasuredRouting>
        <ZoomDetail />
        {children}
      </MeasuredRouting>
    </ReactFlowProvider>
  );
}

function RoutedEdge(
  props: EdgeProps<
    Edge<{
      reveal?: number;
      animationKey?: string | null;
      startedAt?: number;
      charging?: boolean;
      traceOffset?: number;
    }>
  >,
) {
  const { route } = useSmartEdgePath({
    ...props,
    preset: "smoothstep",
    options:
      props.data?.traceOffset === undefined
        ? pathOptions
        : { ...pathOptions, nodePadding: 13, gridRatio: 2 },
  });
  const straight = useStore((state) => {
    if (Math.abs(props.sourceY - props.targetY) > 0.01 || props.targetX <= props.sourceX)
      return false;
    return !Array.from(state.nodeLookup.values()).some((node) => {
      if (
        node.id === props.source ||
        node.id === props.target ||
        node.type === "lane" ||
        node.hidden
      )
        return false;
      const { x, y } = node.internals.positionAbsolute;
      const { width = 0, height = 0 } = node.measured;
      return (
        x - pathOptions.nodePadding < props.targetX &&
        x + width + pathOptions.nodePadding > props.sourceX &&
        y - pathOptions.nodePadding < props.sourceY &&
        y + height + pathOptions.nodePadding > props.sourceY
      );
    });
  });
  const routed = route?.kind === "routed";
  const delay = props.data?.reveal;
  const startedAt = props.data?.startedAt;
  useLayoutEffect(() => {
    if (
      !routed ||
      delay === undefined ||
      startedAt === undefined ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const path = document.getElementById(props.id);
    if (!path) return;
    const animation = path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: 450,
      delay: delay * 1000,
      easing: "cubic-bezier(0.333333, 0, 0.666667, 1)",
      fill: "both",
    });
    animation.startTime = startedAt;
    return () => animation.cancel();
  }, [routed, props.id, props.data?.animationKey, delay, startedAt]);
  if (route?.kind !== "routed") return null;
  const offset = props.data?.traceOffset;
  const path =
    offset === undefined
      ? straight
        ? `M ${props.sourceX},${props.sourceY} L ${props.targetX},${props.targetY}`
        : route.svgPathString
      : connectionPath(
          { x: props.sourceX, y: props.sourceY },
          { x: props.targetX, y: props.targetY },
          route.points,
          offset,
        );
  return (
    <>
      <BaseEdge
        key={props.data?.animationKey}
        id={props.id}
        path={path}
        pathLength={1}
        interactionWidth={props.interactionWidth}
        data-routed="true"
        style={{ ...props.style, strokeDasharray: 1, strokeDashoffset: 0 }}
      />
      {props.data?.charging && (
        <path
          d={path}
          pathLength={1}
          className="course-connection-charge"
          style={{ stroke: "var(--color-text-strong-950)" }}
        />
      )}
    </>
  );
}

export const routedEdgeTypes = { routed: RoutedEdge };

export function connectionReveal(hasPrerequisites: boolean, delay = 0) {
  return {
    startedAt: performance.now(),
    incoming: delay,
    outgoing: delay + (hasPrerequisites ? 0.45 : 0),
  };
}
