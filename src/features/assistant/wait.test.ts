import { describe, expect, it } from "vitest";
import { describeWait } from "./wait";

describe("describeWait", () => {
  it("rounds up to whole minutes under an hour, never showing zero", () => {
    expect(describeWait(1)).toEqual({ unit: "minutes", count: 1 });
    expect(describeWait(61)).toEqual({ unit: "minutes", count: 2 });
    expect(describeWait(3599)).toEqual({ unit: "minutes", count: 60 });
  });

  it("rounds up to whole hours from one hour on", () => {
    expect(describeWait(3600)).toEqual({ unit: "hours", count: 1 });
    expect(describeWait(3601)).toEqual({ unit: "hours", count: 2 });
    expect(describeWait(3 * 3600)).toEqual({ unit: "hours", count: 3 });
  });

  it("treats a negative wait as the minimum", () => {
    expect(describeWait(-5)).toEqual({ unit: "minutes", count: 1 });
  });
});
