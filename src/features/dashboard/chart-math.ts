export type Bar = { x: number; y: number; width: number; height: number };

/**
 * Geometry of a bar chart in a `width` × `height` box: one bar per value, scaled to the tallest one.
 * Zero values keep a hairline so the day is still visible on the axis.
 */
export function barLayout(
  values: readonly number[],
  width: number,
  height: number,
  gap = 4,
): Bar[] {
  if (values.length === 0) return [];
  const max = Math.max(...values, 1);
  const barWidth = (width - gap * (values.length - 1)) / values.length;
  return values.map((value, index) => {
    const barHeight = value === 0 ? 1 : Math.max(2, (value / max) * height);
    return {
      x: index * (barWidth + gap),
      y: height - barHeight,
      width: barWidth,
      height: barHeight,
    };
  });
}

/** Share of each count in the total, as percentages that add up to 100 (largest remainder). */
export function shares(counts: readonly number[]): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return counts.map(() => 0);
  const exact = counts.map((count) => (count / total) * 100);
  const floors = exact.map(Math.floor);
  let left = 100 - floors.reduce((sum, value) => sum + value, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, rest: value - floors[index]! }))
    .sort((a, b) => b.rest - a.rest);
  for (const { index } of byRemainder) {
    if (left-- <= 0) break;
    floors[index]! += 1;
  }
  return floors;
}
