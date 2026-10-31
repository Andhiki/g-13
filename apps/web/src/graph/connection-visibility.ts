import type { Edge } from "@xyflow/react";

export function connectionVisibility() {
  let incoming = new Set<string>();
  let outgoing = new Set<string>();
  const listeners = new Map<string, Set<() => void>>();
  return {
    incoming: (id: string) => incoming.has(id),
    outgoing: (id: string) => outgoing.has(id),
    subscribe(id: string, listener: () => void) {
      let subscriptions = listeners.get(id);
      if (!subscriptions) {
        subscriptions = new Set();
        listeners.set(id, subscriptions);
      }
      subscriptions.add(listener);
      return () => {
        subscriptions.delete(listener);
        if (!subscriptions.size) listeners.delete(id);
      };
    },
    update(edges: Edge[]) {
      const nextIncoming = new Set<string>();
      const nextOutgoing = new Set<string>();
      for (const edge of edges) {
        if (edge.hidden || !edge.data?.visible) continue;
        nextIncoming.add(edge.target);
        nextOutgoing.add(edge.source);
      }
      const previousIncoming = incoming;
      const previousOutgoing = outgoing;
      incoming = nextIncoming;
      outgoing = nextOutgoing;
      for (const [id, subscriptions] of listeners) {
        if (
          incoming.has(id) === previousIncoming.has(id) &&
          outgoing.has(id) === previousOutgoing.has(id)
        )
          continue;
        for (const listener of subscriptions) listener();
      }
    },
  };
}
