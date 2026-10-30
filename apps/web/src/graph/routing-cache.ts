import type { Edge } from "@xyflow/react";
import type { RoutingNode } from "./connection-routes";
import type { RoutingRequest, RoutingResult } from "./connection-routing.worker";

const routes = new Map<string, Promise<RoutingResult>>();
const pending = new Map<
  number,
  { resolve: (routes: RoutingResult) => void; reject: (error: Error) => void }
>();
let worker: Worker | undefined;
let requestId = 0;

function routingWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./connection-routing.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.onmessage = ({ data }: MessageEvent<{ id: number; routes: RoutingResult }>) => {
    pending.get(data.id)!.resolve(data.routes);
    pending.delete(data.id);
  };
  worker.onerror = (event) => {
    worker!.terminate();
    worker = undefined;
    for (const request of pending.values()) request.reject(new Error(event.message));
    pending.clear();
  };
  return worker;
}

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
  let result = routes.get(key);
  if (!result) {
    result = new Promise<RoutingResult>((resolve, reject) => {
      const active = routingWorker();
      const id = requestId++;
      pending.set(id, { resolve, reject });
      active.postMessage({ id, request });
    }).catch((error: unknown) => {
      routes.delete(key);
      throw error;
    });
    routes.set(key, result);
  }
  return result;
}
