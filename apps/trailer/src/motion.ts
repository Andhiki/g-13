import { Easing, interpolate } from "remotion";

export const ink = "#20211f";
export const muted = "#83857f";
export const orange = "#ed965d";
export const violet = "#8c74d9";

export function tween(time: number, start: number, end: number, from = 0, to = 1) {
  return interpolate(time, [start, end], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
}

export function appear(time: number, start: number, end: number) {
  return tween(time, start, start + 0.35) * (1 - tween(time, end - 0.35, end));
}

export function cursorMove(
  time: number,
  start: number,
  end: number,
  from: readonly [number, number],
  to: readonly [number, number],
  bend = 45,
) {
  const progress = interpolate(time, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.25, 1),
  });
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const distance = Math.hypot(dx, dy);
  const normalX = -dy / distance;
  const normalY = dx / distance;
  const arc = 4 * bend * progress * (1 - progress);
  const tangent = 4 * bend * (1 - 2 * progress);
  const heading = Math.atan2(dy, dx) * (180 / Math.PI);
  const turn =
    ((heading + 130 + 540) % 360) - 180 + Math.atan2(tangent, distance) * (180 / Math.PI);
  return {
    x: from[0] + dx * progress + normalX * arc,
    y: from[1] + dy * progress + normalY * arc,
    rotate: turn * Math.sin(Math.PI * progress),
  };
}

export function clickScale(time: number, clicks: readonly number[]) {
  return clicks.reduce(
    (scale, click) =>
      scale *
      interpolate(time - click, [-0.07, 0, 0.05, 0.17, 0.29], [1, 0.76, 0.76, 1.08, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      }),
    1,
  );
}
