import type { Edge } from "@xyflow/react";

export function mapConnections(edges: Edge[], selectedId: string | null, hoveredId: string | null) {
  const core = edges.filter((edge) => !edge.data?.optional);
  return edges.map((edge, index) => {
    const emphasized = edge.source === hoveredId || edge.target === hoveredId;
    const selected = edge.source === selectedId || edge.target === selectedId;
    const coreIndex = core.indexOf(edge);
    return {
      ...edge,
      type: "routed",
      hidden: !!edge.data?.optional && !selected && !emphasized,
      zIndex: emphasized ? 4 : 1,
      style: {
        ...edge.style,
        opacity: (hoveredId ? !emphasized : selectedId && !selected) ? 0.18 : 1,
        ...(emphasized ? { stroke: "var(--color-primary-base)", strokeWidth: 2.4 } : {}),
      },
      data: {
        ...edge.data,
        charging: emphasized,
        traceOffset:
          coreIndex >= 0
            ? ((coreIndex + 1) / (core.length + 1) - 0.5) * 24
            : ((index + 1) / (edges.length + 1) - 0.5) * 23,
      },
    };
  });
}
