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
