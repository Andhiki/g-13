type Point = { x: number; y: number };

// Course cards are 246 × 82; expand by the moving card's size and a 12px gap.
export function courseMotion(start: Point, end: Point, selected?: Point) {
  const direct = (t: number) => ({
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  });
  if (!selected) return direct;
  const left = selected.x - 258;
  const right = selected.x + 258;
  const top = selected.y - 94;
  const bottom = selected.y + 94;
  const dx = end.x - start.x;
  if (dx === 0) return direct;
  const entry = Math.max(0, Math.min((left - start.x) / dx, (right - start.x) / dx));
  const exit = Math.min(1, Math.max((left - start.x) / dx, (right - start.x) / dx));
  if (entry >= exit) return direct;
  const entryY = direct(entry).y;
  const exitY = direct(exit).y;
  if (Math.max(entryY, exitY) <= top || Math.min(entryY, exitY) >= bottom) return direct;

  let detourY =
    Math.abs(start.y - top) + Math.abs(end.y - top) <=
    Math.abs(start.y - bottom) + Math.abs(end.y - bottom)
      ? top
      : bottom;
  if (entry === 0) {
    // An interrupted animation may start alongside the selected card.
    if (start.y > top && start.y < bottom) return direct;
    detourY = start.y;
  }
  if (exit === 1) {
    if (end.y > top && end.y < bottom) return direct;
    detourY = end.y;
  }
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (t: number) => ({
    x: direct(t).x,
    y:
      t < entry
        ? start.y + (detourY - start.y) * smooth(t / entry)
        : t > exit
          ? detourY + (end.y - detourY) * smooth((t - exit) / (1 - exit))
          : detourY,
  });
}
