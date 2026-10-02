import { describe, expect, it } from "vitest";
import { inputs } from "./action-input";

const id = "01a0f90b-bf20-7b34-b657-fbf09390bc48";

describe("action input validation", () => {
  it("accepts user-triggerable actions and rejects system-only or unknown ones", () => {
    expect(inputs.applyAction.safeParse([id, "Submit"]).success).toBe(true);
    expect(inputs.applyAction.safeParse([id, "MarkSent"]).success).toBe(false);
    expect(inputs.applyAction.safeParse([id, "DropTable"]).success).toBe(false);
  });

  it("requires a real order id", () => {
    expect(inputs.orderOnly.safeParse(["../../etc/passwd"]).success).toBe(false);
    expect(inputs.orderOnly.safeParse([id]).success).toBe(true);
  });

  it("rejects negative, infinite and non-numeric quantities", () => {
    expect(inputs.confirmQuantity.safeParse([id, "SKU-1", 5]).success).toBe(true);
    expect(inputs.confirmQuantity.safeParse([id, "SKU-1", 0]).success).toBe(true);
    expect(inputs.confirmQuantity.safeParse([id, "SKU-1", -1]).success).toBe(false);
    expect(inputs.confirmQuantity.safeParse([id, "SKU-1", Number.POSITIVE_INFINITY]).success).toBe(
      false,
    );
    expect(inputs.confirmQuantity.safeParse([id, "SKU-1", "5"]).success).toBe(false);
  });

  it("allows clearing a cost but not setting a negative one", () => {
    expect(inputs.changeCost.safeParse([id, "SKU-1", null]).success).toBe(true);
    expect(inputs.changeCost.safeParse([id, "SKU-1", -0.5]).success).toBe(false);
  });

  it("limits comments and product codes", () => {
    expect(inputs.changeComment.safeParse([id, "SKU-1", "x".repeat(501)]).success).toBe(false);
    expect(inputs.changeComment.safeParse([id, "SKU-1", null]).success).toBe(true);
    expect(inputs.confirmQuantity.safeParse([id, "", 1]).success).toBe(false);
    expect(inputs.confirmQuantity.safeParse([id, "x".repeat(61), 1]).success).toBe(false);
  });

  it("validates a redistribution plan", () => {
    const plan = {
      lines: [{ productCode: "SKU-1", allocations: [{ locationCode: "ST-001", quantity: 1.5 }] }],
    };

    expect(inputs.plan.safeParse([id, plan]).success).toBe(true);
    expect(
      inputs.plan.safeParse([
        id,
        {
          lines: [
            { productCode: "SKU-1", allocations: [{ locationCode: "ST-001", quantity: -1 }] },
          ],
        },
      ]).success,
    ).toBe(false);
    expect(inputs.plan.safeParse([id, { lines: "nope" }]).success).toBe(false);
  });

  it("validates the production-difference handling", () => {
    const valid = {
      acknowledgeDifference: false,
      children: [{ deliveryDate: "2026-11-01", portions: { "SKU-1": 20 } }],
    };

    expect(inputs.confirmBySupplier.safeParse([id, valid]).success).toBe(true);
    expect(
      inputs.confirmBySupplier.safeParse([
        id,
        { ...valid, children: [{ deliveryDate: "soon", portions: {} }] },
      ]).success,
    ).toBe(false);
  });
});
