import type { Edge } from "@xyflow/react";
import type { RoutingNode } from "./connection-routes";
import type { RoutingRequest, RoutingResult } from "./connection-routing.worker";

const routes = new Map<string, Promise<RoutingResult>>();

export function routingRequest(nodes: RoutingNode[], edges: Edge[]): RoutingRequest {
  return {
    nodes,
    edges: edges.map(({ id, source, target, hidden, data }) => ({
      id,
      source,
      target,
      hidden,
      data: { optional: data?.optional },
    })),
  };
}

export function getConnectionRoutes(key: string, request: RoutingRequest) {
  let pending = routes.get(key);
  if (!pending) {
    pending = new Promise<RoutingResult>((resolve, reject) => {
      const worker = new Worker(new URL("./connection-routing.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = ({ data }: MessageEvent<RoutingResult>) => {
        worker.terminate();
        resolve(data);
      };
      worker.onerror = (event) => {
        worker.terminate();
        reject(new Error(event.message));
      };
      worker.postMessage(request);
    }).catch((error: unknown) => {
      routes.delete(key);
      throw error;
    });
    routes.set(key, pending);
  }
  return pending;
}
