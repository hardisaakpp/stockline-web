import { describe, expect, it } from "vitest";
import {
  remainingByProduct,
  splitProblem,
  suggestedChild,
  toConfirmBody,
  type ChildDraft,
  type DifferenceLine,
} from "./difference-split";

const lines: DifferenceLine[] = [
  { productCode: "A", description: null, requested: 30, confirmed: 10, difference: 20 },
  { productCode: "B", description: null, requested: 18, confirmed: 8, difference: 10 },
];

const child = (deliveryDate: string, portions: Record<string, string>, key = "k"): ChildDraft => ({
  key,
  deliveryDate,
  portions,
});

describe("remainingByProduct", () => {
  it("subtracts what the child orders already take", () => {
    expect(
      remainingByProduct(lines, [
        child("2026-11-01", { A: "5", B: "10" }),
        child("2026-12-01", { A: "5" }, "k2"),
      ]),
    ).toEqual({
      A: 10,
      B: 0,
    });
  });

  it("goes negative when over-assigned and ignores junk input", () => {
    expect(remainingByProduct(lines, [child("d", { A: "25", B: "abc" })])).toEqual({
      A: -5,
      B: 10,
    });
    expect(remainingByProduct(lines, [child("d", { A: "-3", B: "" })])).toEqual({ A: 20, B: 10 });
  });

  it("avoids floating point noise", () => {
    const fractional: DifferenceLine[] = [
      { productCode: "A", description: null, requested: 1, confirmed: 0, difference: 0.3 },
    ];
    expect(
      remainingByProduct(fractional, [child("d", { A: "0.1" }), child("d", { A: "0.2" }, "k2")]),
    ).toEqual({ A: 0 });
  });
});

describe("splitProblem", () => {
  it("accepts a split that covers exactly the missing units", () => {
    expect(splitProblem(lines, [child("2026-11-01", { A: "20", B: "10" })])).toBeNull();
    expect(
      splitProblem(lines, [
        child("2026-11-01", { A: "12", B: "10" }),
        child("2026-12-01", { A: "8" }, "k2"),
      ]),
    ).toBeNull();
  });

  it("reports the first problem found", () => {
    expect(splitProblem(lines, [])).toBe("noChildren");
    expect(splitProblem(lines, [child("", { A: "20", B: "10" })])).toBe("missingDate");
    expect(
      splitProblem(lines, [
        child("2026-11-01", { A: "20", B: "10" }),
        child("2026-12-01", {}, "k2"),
      ]),
    ).toBe("emptyChild");
    expect(splitProblem(lines, [child("2026-11-01", { A: "19", B: "10" })])).toBe("unbalanced");
    expect(splitProblem(lines, [child("2026-11-01", { A: "21", B: "10" })])).toBe("unbalanced");
  });
});

describe("toConfirmBody", () => {
  it("acknowledging sends no child orders", () => {
    expect(toConfirmBody("acknowledge", [child("d", { A: "5" })])).toEqual({
      acknowledgeDifference: true,
      children: [],
    });
  });

  it("splitting sends numeric portions and drops zero ones", () => {
    expect(toConfirmBody("split", [child("2026-11-01", { A: "20", B: "0", C: "" })])).toEqual({
      acknowledgeDifference: false,
      children: [{ deliveryDate: "2026-11-01", portions: { A: 20 } }],
    });
  });
});

describe("suggestedChild", () => {
  it("takes all the missing units", () => {
    expect(suggestedChild(lines, "k1", "2026-11-01")).toEqual({
      key: "k1",
      deliveryDate: "2026-11-01",
      portions: { A: "20", B: "10" },
    });
    expect(splitProblem(lines, [suggestedChild(lines, "k1", "2026-11-01")])).toBeNull();
  });
});
