import { svgDrawSmoothStepLinePath, type XYPosition } from "@tisoap/react-flow-smart-edge";

const roundedPath = svgDrawSmoothStepLinePath({ borderRadius: 12 });

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

export function connectionPath(source: XYPosition, target: XYPosition, points: number[][]) {
  return roundedPath(source, target, connectionCorners(source, target, points));
}
