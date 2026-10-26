import type { ReactNode } from "react";
import { BaseEdge, ReactFlowProvider, useStore, type Edge, type EdgeProps } from "@xyflow/react";
import { SmartEdgeProvider, useSmartEdgePath } from "@tisoap/react-flow-smart-edge";

// Leave a routing corridor in the 14px gap between course rows.
const pathOptions = { nodePadding: 4, gridRatio: 4, borderRadius: 4 };

function MeasuredRouting({ children }: { children: ReactNode }) {
  const nodes = useStore(
    (state) => Array.from(state.nodeLookup.values()),
    (previous, next) =>
      previous.length === next.length && previous.every((node, index) => node === next[index]),
  );
  return (
    <SmartEdgeProvider
      nodes={nodes.filter((node) => node.type !== "lane" && !node.hidden)}
      options={{
        preset: "smoothstep",
        routeOnlyWhenBlocked: false,
        ...pathOptions,
      }}
    >
      {children}
    </SmartEdgeProvider>
  );
}

export function EdgeRouting({ children }: { children: ReactNode }) {
  return (
    <ReactFlowProvider>
      <MeasuredRouting>{children}</MeasuredRouting>
    </ReactFlowProvider>
  );
}

function RoutedEdge(props: EdgeProps<Edge<{ progress?: number }>>) {
  const { route } = useSmartEdgePath({
    ...props,
    preset: "smoothstep",
    options: pathOptions,
  });
  if (route?.kind !== "routed") return null;
  const progress = props.data?.progress ?? 1;
  return (
    <BaseEdge
      id={props.id}
      path={route.svgPathString}
      pathLength={1}
      markerStart={props.markerStart}
      markerEnd={progress === 1 ? props.markerEnd : undefined}
      interactionWidth={props.interactionWidth}
      data-routed="true"
      style={{ ...props.style, strokeDasharray: 1, strokeDashoffset: 1 - progress }}
    />
  );
}

export const routedEdgeTypes = { routed: RoutedEdge };
