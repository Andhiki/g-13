import type { Edge } from "@xyflow/react";

export function mapConnections(edges: Edge[], selectedId: string | null, hoveredId: string | null) {
  return edges.map((edge) => {
    const emphasized = edge.source === hoveredId || edge.target === hoveredId;
    const selected = edge.source === selectedId || edge.target === selectedId;
    return {
      ...edge,
      type: "routed",
      hidden: false,
      zIndex: emphasized ? 4 : 1,
      style: {
        ...edge.style,
        opacity: (hoveredId ? !emphasized : selectedId && !selected)
          ? 0.18
          : edge.data?.optional
            ? 0.65
            : 1,
        ...(emphasized ? { stroke: "var(--color-primary-base)", strokeWidth: 2.4 } : {}),
      },
      data: {
        ...edge.data,
        visible: !edge.data?.optional || selected || emphasized,
        charging: selected || emphasized,
      },
    };
  });
}
