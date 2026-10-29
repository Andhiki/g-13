import type { XYPosition } from "@xyflow/react";

type Obstacle = { position: XYPosition; measured: { width: number; height: number } };

export function connectionCorners(source: XYPosition, target: XYPosition, points: number[][]) {
  const corners: number[][] = [];
  for (const point of [[source.x, source.y], ...points, [target.x, target.y]]) {
    const last = corners.at(-1);
    if (last && last[0] === point[0] && last[1] === point[1]) continue;
    const previous = corners.at(-2);
    if (
      previous &&
      last &&
      ((previous[0] === last[0] && last[0] === point[0]) ||
        (previous[1] === last[1] && last[1] === point[1]))
    )
      corners.pop();
    corners.push(point);
  }
  return corners;
}

export function connectionPath(
  source: XYPosition,
  target: XYPosition,
  points: number[][],
  obstacles: Obstacle[],
) {
  const corners = connectionCorners(source, target, points);
  let path = `M ${source.x},${source.y}`;
  for (let index = 1; index < corners.length - 1; index++) {
    const [x, y] = corners[index];
    const previous = corners[index - 1];
    const next = corners[index + 1];
    const incoming = Math.hypot(x - previous[0], y - previous[1]);
    const outgoing = Math.hypot(next[0] - x, next[1] - y);
    let radius = Math.min(48, incoming / 2, outgoing / 2);
    // Keep the entire bend's bounding square outside the cards.
    for (const { position, measured } of obstacles) {
      radius = Math.min(
        radius,
        Math.max(
          position.x - x,
          x - position.x - measured.width,
          position.y - y,
          y - position.y - measured.height,
          0,
        ),
      );
    }
    const ux = (x - previous[0]) / incoming;
    const uy = (y - previous[1]) / incoming;
    const vx = (next[0] - x) / outgoing;
    const vy = (next[1] - y) / outgoing;
    const entry = (distance: number) =>
      `${x - ux * radius * distance},${y - uy * radius * distance}`;
    const exit = (distance: number) =>
      `${x + vx * radius * distance},${y + vy * radius * distance}`;
    // Collinear controls at each end bring curvature to zero at the straight runs.
    path += ` L ${entry(1)} C ${entry(0.625)} ${entry(0.375)} ${x + (vx - ux) * radius * 0.1875},${y + (vy - uy) * radius * 0.1875}`;
    path += ` C ${exit(0.375)} ${exit(0.625)} ${exit(1)}`;
  }
  return `${path} L ${target.x},${target.y}`;
}
