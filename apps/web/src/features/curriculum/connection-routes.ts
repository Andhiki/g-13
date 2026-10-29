import { Position, type Edge, type XYPosition } from "@xyflow/react";
import { getSmartEdge, pathfindingJumpPointNoDiagonal } from "@tisoap/react-flow-smart-edge";
import { connectionCorners, connectionPath } from "./connection-path";

export type RoutingNode = {
  id: string;
  position: XYPosition;
  measured: { width: number; height: number };
  source: XYPosition;
  target: XYPosition;
};
type Vertical = { x: number; top: number; bottom: number };
const clearance = 12;
const spacing = 6;

function blocked(a: number[], b: number[], nodes: RoutingNode[]) {
  return nodes.some(
    ({ position: { x, y }, measured: { width, height } }) =>
      Math.max(a[0], b[0]) > x - clearance &&
      Math.min(a[0], b[0]) < x + width + clearance &&
      Math.max(a[1], b[1]) > y - clearance &&
      Math.min(a[1], b[1]) < y + height + clearance,
  );
}

export function connectionRoutes(
  nodes: RoutingNode[],
  edges: Edge[],
  options: { includeUnrevealed?: boolean } = {},
) {
  const routes = new Map<string, { path: string; points: number[][] }>();
  const occupied: Vertical[] = [];
  const obstacles = nodes.map((node) => ({ ...node, data: {} }));
  const routable = edges
    .filter((edge) => !edge.hidden && (options.includeUnrevealed || edge.data?.visible !== false))
    .sort((a, b) => Number(!!a.data?.optional) - Number(!!b.data?.optional));
  for (const edge of routable) {
    const source = nodes.find((node) => node.id === edge.source)?.source;
    const target = nodes.find((node) => node.id === edge.target)?.target;
    if (!source || !target) continue;
    const otherNodes = nodes.filter((node) => node.id !== edge.source && node.id !== edge.target);
    if (
      source.y === target.y &&
      target.x > source.x &&
      !blocked([source.x, source.y], [target.x, target.y], otherNodes)
    ) {
      routes.set(edge.id, {
        path: `M ${source.x},${source.y} L ${target.x},${target.y}`,
        points: [
          [source.x, source.y],
          [target.x, target.y],
        ],
      });
      continue;
    }
    const route = getSmartEdge({
      nodes: obstacles,
      sourceX: source.x,
      sourceY: source.y,
      targetX: target.x,
      targetY: target.y,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {
        nodePadding: clearance,
        gridRatio: 4,
        generatePath: pathfindingJumpPointNoDiagonal,
      },
    });
    if (route instanceof Error) continue;
    const points = connectionCorners(source, target, route.points);
    for (let index = 1; index < points.length - 2; index++) {
      const a = points[index];
      const b = points[index + 1];
      if (a[0] !== b[0] || a[1] === b[1]) continue;
      const top = Math.min(a[1], b[1]);
      const bottom = Math.max(a[1], b[1]);
      let left = -Infinity;
      let right = Infinity;
      for (const node of nodes) {
        if (
          node.position.y - clearance >= bottom ||
          node.position.y + node.measured.height + clearance <= top
        )
          continue;
        const nodeRight = node.position.x + node.measured.width + clearance;
        const nodeLeft = node.position.x - clearance;
        if (nodeRight <= a[0]) left = Math.max(left, nodeRight);
        if (nodeLeft >= a[0]) right = Math.min(right, nodeLeft);
      }
      const center = Number.isFinite(left) && Number.isFinite(right) ? (left + right) / 2 : a[0];
      const candidates = Array.from(
        {
          length:
            Number.isFinite(left) && Number.isFinite(right)
              ? Math.ceil((right - left) / spacing) + 1
              : occupied.length * 2 + 1,
        },
        (_, slot) => center + (slot % 2 ? -1 : 1) * Math.ceil(slot / 2) * spacing,
      );
      const x = candidates.find((candidate) => {
        if (candidate <= left || candidate >= right) return false;
        if (
          occupied.some(
            (run) =>
              Math.abs(run.x - candidate) < spacing &&
              run.top < bottom + clearance &&
              run.bottom > top - clearance,
          )
        )
          return false;
        const start = [candidate, a[1]];
        const end = [candidate, b[1]];
        return (
          !blocked(start, end, nodes) &&
          !blocked(points[index - 1], start, otherNodes) &&
          !blocked(end, points[index + 2], otherNodes)
        );
      });
      if (x !== undefined) a[0] = b[0] = x;
      occupied.push({ x: a[0], top, bottom });
    }
    routes.set(edge.id, { path: connectionPath(source, target, points), points });
  }
  return routes;
}
