import { describe, expect, it } from "vitest";
import { barLayout, shares } from "./chart-math";

describe("barLayout", () => {
  it("scales bars to the tallest value and spaces them evenly", () => {
    const bars = barLayout([0, 5, 10], 100, 50, 10);

    expect(bars.map((b) => b.width)).toEqual([
      26.666666666666668, 26.666666666666668, 26.666666666666668,
    ]);
    expect(bars[2]).toMatchObject({ height: 50, y: 0 });
    expect(bars[1]).toMatchObject({ height: 25, y: 25 });
    expect(bars[1]!.x).toBeCloseTo(36.67, 1);
  });

  it("keeps a hairline for zero days and handles all-zero or empty data", () => {
    expect(barLayout([0, 0], 100, 50)[0]!.height).toBe(1);
    expect(barLayout([], 100, 50)).toEqual([]);
  });

  it("never draws a tiny non-zero value as invisible", () => {
    expect(barLayout([1, 1000], 100, 50)[0]!.height).toBeGreaterThanOrEqual(2);
  });
});

describe("shares", () => {
  it("adds up to exactly 100", () => {
    expect(shares([1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(100);
    expect(shares([3, 3, 1]).reduce((a, b) => a + b, 0)).toBe(100);
    expect(shares([1])).toEqual([100]);
  });

  it("is zero when there is nothing to share", () => {
    expect(shares([0, 0])).toEqual([0, 0]);
    expect(shares([])).toEqual([]);
  });

  it("keeps the order of the input", () => {
    expect(shares([50, 25, 25])).toEqual([50, 25, 25]);
  });
});
