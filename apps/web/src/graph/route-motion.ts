import type { XYPosition } from "@xyflow/react";

function flattenRoute(path: string) {
  const tokens = path.match(/[MLC]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  const points: XYPosition[] = [];
  let position = { x: 0, y: 0 };
  let index = 0;
  const point = () => ({ x: Number(tokens[index++]), y: Number(tokens[index++]) });
  while (index < tokens.length) {
    const command = tokens[index++];
    if (command === "M" || command === "L") {
      position = point();
      points.push(position);
    } else if (command === "C") {
      const first = point();
      const second = point();
      const end = point();
      for (let step = 1; step <= 16; step++) {
        const t = step / 16;
        const u = 1 - t;
        points.push({
          x:
            u ** 3 * position.x +
            3 * u ** 2 * t * first.x +
            3 * u * t ** 2 * second.x +
            t ** 3 * end.x,
          y:
            u ** 3 * position.y +
            3 * u ** 2 * t * first.y +
            3 * u * t ** 2 * second.y +
            t ** 3 * end.y,
        });
      }
      position = end;
    } else {
      throw new Error(`Unsupported connector command: ${command}`);
    }
  }
  return points;
}

function routeDistances(points: XYPosition[]) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++)
    lengths.push(
      lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y),
    );
  return { lengths, length: lengths.at(-1) ?? 0 };
}

export function routeLength(path: string) {
  return routeDistances(flattenRoute(path)).length;
}

export function routeSamples(path: string, count: number) {
  return resampleRoute(flattenRoute(path), count);
}

export function resampleRoute(points: XYPosition[], count: number) {
  const { lengths, length } = routeDistances(points);
  let segment = 1;
  return Array.from({ length: count }, (_, index): XYPosition => {
    const distance = (length * index) / (count - 1);
    while (segment < points.length - 1 && lengths[segment] < distance) segment++;
    const start = points[segment - 1];
    const end = points[segment] ?? start;
    const span = lengths[segment] - lengths[segment - 1];
    const t = span ? (distance - lengths[segment - 1]) / span : 0;
    return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
  });
}

export function mixRoute(start: XYPosition[], end: XYPosition[], t: number) {
  return end.map((point, index) => ({
    x: start[index].x + (point.x - start[index].x) * t,
    y: start[index].y + (point.y - start[index].y) * t,
  }));
}

export function routePath(points: XYPosition[], source: XYPosition, target: XYPosition) {
  return `M${source.x},${source.y} ${points
    .slice(1, -1)
    .map((point) => `L${point.x},${point.y}`)
    .join(" ")} L${target.x},${target.y}`;
}
