import type { Edge } from "@xyflow/react";
import { connectionRoutes, type RoutingNode } from "./connection-routes";

export type RoutingRequest = { nodes: RoutingNode[]; edges: Edge[] };
export type RoutingResult = ReturnType<typeof connectionRoutes>;

self.onmessage = ({ data }: MessageEvent<RoutingRequest>) => {
  self.postMessage(connectionRoutes(data.nodes, data.edges, { includeUnrevealed: true }));
};
