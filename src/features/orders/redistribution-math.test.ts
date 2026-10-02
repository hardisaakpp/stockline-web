import { describe, expect, it } from "vitest";
import {
  allBalanced,
  balance,
  gridFromAllocations,
  initialGrid,
  isBalanced,
  orderedLocations,
  rowTotal,
  sameGrid,
  toPlan,
} from "./redistribution-math";

const lines = [
  {
    productCode: "A",
    description: null,
    requestedQuantity: 30,
    confirmedQuantity: 10,
    allocatedQuantity: 30,
    allocations: [
      { locationCode: "W", quantity: 6 },
      { locationCode: "S1", quantity: 4 },
    ],
  },
  {
    productCode: "B",
    description: null,
    requestedQuantity: 8,
    confirmedQuantity: 8,
    allocatedQuantity: 8,
    allocations: [{ locationCode: "W", quantity: 8 }],
  },
];

describe("initialGrid", () => {
  it("starts from the current allocations", () => {
    expect(initialGrid({ lines, draft: [] })).toEqual({ A: { W: "6", S1: "4" }, B: { W: "8" } });
  });

  it("prefers a saved draft, per product", () => {
    expect(
      initialGrid({ lines, draft: [{ productCode: "A", locationCode: "S1", quantity: 10 }] }),
    ).toEqual({
      A: { S1: "10" },
      B: { W: "8" },
    });
  });
});

describe("balance", () => {
  it("is what is left to assign", () => {
    expect(balance(10, { W: "6", S1: "2.5" })).toBe(1.5);
    expect(balance(10, { W: "12" })).toBe(-2);
    expect(balance(10, undefined)).toBe(10);
  });

  it("ignores empty, negative and non-numeric cells", () => {
    expect(rowTotal({ W: "", S1: "-4", S2: "abc", S3: "3" })).toBe(3);
  });

  it("tolerates rounding noise but not real differences", () => {
    expect(isBalanced(balance(1, { A: "0.3333", B: "0.3333", C: "0.3334" }))).toBe(true);
    expect(isBalanced(0.0005)).toBe(true);
    expect(isBalanced(0.01)).toBe(false);
  });

  it("checks every product", () => {
    expect(allBalanced(lines, { A: { W: "10" }, B: { W: "8" } })).toBe(true);
    expect(allBalanced(lines, { A: { W: "10" }, B: { W: "7" } })).toBe(false);
  });
});

describe("toPlan", () => {
  it("sends numeric allocations and omits empty or zero cells", () => {
    expect(toPlan(lines, { A: { W: "6.5", S1: "", S2: "0" }, B: {} })).toEqual({
      lines: [
        { productCode: "A", allocations: [{ locationCode: "W", quantity: 6.5 }] },
        { productCode: "B", allocations: [] },
      ],
    });
  });
});

describe("gridFromAllocations", () => {
  it("turns a proposal into a grid", () => {
    expect(
      gridFromAllocations([
        {
          productCode: "A",
          allocations: [
            { locationCode: "W", quantity: 1.3333 },
            { locationCode: "S1", quantity: 0 },
          ],
        },
      ]),
    ).toEqual({
      A: { W: "1.3333", S1: "" },
    });
  });
});

describe("sameGrid", () => {
  it("compares quantities, not formatting", () => {
    expect(sameGrid({ A: { W: "6" } }, { A: { W: "6.0", S1: "" } })).toBe(true);
    expect(sameGrid({ A: { W: "6" } }, { A: { W: "7" } })).toBe(false);
    expect(sameGrid({ A: { W: "6" } }, { A: {} })).toBe(false);
  });
});

describe("orderedLocations", () => {
  it("puts warehouses first and keeps the order within each kind", () => {
    const loc = (code: string, kind: "Warehouse" | "Store") => ({
      code,
      name: null,
      kind,
      supplyingWarehouseCode: null,
    });

    expect(
      orderedLocations([
        loc("S2", "Store"),
        loc("W2", "Warehouse"),
        loc("S1", "Store"),
        loc("W1", "Warehouse"),
      ]).map((l) => l.code),
    ).toEqual(["W2", "W1", "S2", "S1"]);
  });
});
