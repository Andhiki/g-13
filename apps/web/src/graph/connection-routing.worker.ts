import type { Edge } from "@xyflow/react";
import { connectionRoutes, type RoutingNode } from "./connection-routes";

export type RoutingRequest = { nodes: RoutingNode[]; edges: Edge[] };
export type RoutingResult = ReturnType<typeof connectionRoutes>;

self.onmessage = ({ data }: MessageEvent<{ id: number; request: RoutingRequest }>) => {
  self.postMessage({
    id: data.id,
    routes: connectionRoutes(data.request.nodes, data.request.edges, { includeUnrevealed: true }),
  });
};
