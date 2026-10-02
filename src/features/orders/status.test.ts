import { describe, expect, it } from "vitest";
import { ORDER_STATUSES } from "./schemas";
import { isOffPath, isTerminal, MAIN_PATH, progressIndex, STATUS_TONE } from "./status";

describe("order status helpers", () => {
  it("defines a tone for every status", () => {
    expect(Object.keys(STATUS_TONE).sort()).toEqual([...ORDER_STATUSES].sort());
  });

  it("places statuses on the main path, mapping in-between ones to the step reached", () => {
    expect(progressIndex("Draft")).toBe(0);
    expect(progressIndex("ProductionConfirmed")).toBe(progressIndex("UnderReview"));
    expect(progressIndex("ReadyForRedistribution")).toBe(progressIndex("SupplierConfirmed"));
    expect(progressIndex("ErpSubmissionFailed")).toBe(progressIndex("RedistributionConfirmed"));
    expect(progressIndex("DispatchAndInvoice")).toBe(progressIndex("Sent"));
    expect(progressIndex("Completed")).toBe(MAIN_PATH.length - 1);
  });

  it("has no position for statuses that left the path", () => {
    for (const status of [
      "Rejected",
      "Cancelled",
      "CancelledBySupplier",
      "ProductionPostponed",
    ] as const) {
      expect(progressIndex(status), status).toBeNull();
      expect(isOffPath(status), status).toBe(true);
    }
    expect(isOffPath("Sent")).toBe(false);
  });

  it("every status either is on the path or off it", () => {
    for (const status of ORDER_STATUSES) {
      expect(progressIndex(status) !== null || isOffPath(status), status).toBe(true);
    }
  });

  it("knows which statuses are final", () => {
    expect(isTerminal("Completed")).toBe(true);
    expect(isTerminal("Rejected")).toBe(true);
    expect(isTerminal("Sent")).toBe(false);
  });
});
