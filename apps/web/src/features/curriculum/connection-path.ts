import { svgDrawSmoothLinePath, type XYPosition } from "@tisoap/react-flow-smart-edge";

export function connectionPath(
  source: XYPosition,
  target: XYPosition,
  points: number[][],
  offset: number,
) {
  // Keep the node approaches horizontal; offset only the route between them.
  const shifted = points.map(([x, y]) => [x + offset, y + offset]);
  const start = shifted.findIndex(([x]) => x >= source.x + 24);
  let end = shifted.length - 1;
  while (end >= 0 && shifted[end][0] > target.x - 24) end--;
  const interior = start >= 0 && end >= start ? shifted.slice(start, end + 1) : [];
  return svgDrawSmoothLinePath(source, target, [
    [source.x + 16, source.y],
    ...interior,
    [target.x - 16, target.y],
  ]);
}
