import { describe, expect, it } from "vitest";
import { availableTabs, pickTab } from "./tabs";

describe("availableTabs", () => {
  it("shows only lines and history while the order is still being prepared", () => {
    expect(availableTabs("Buyer", "Draft")).toEqual(["lines", "history"]);
    expect(availableTabs("Supplier", "UnderReview")).toEqual(["lines", "history"]);
  });

  it("adds redistribution once the supplier confirmed, and ERP once the distribution is final", () => {
    expect(availableTabs("Buyer", "SupplierConfirmed")).toEqual([
      "lines",
      "redistribution",
      "history",
    ]);
    expect(availableTabs("Buyer", "RedistributionConfirmed")).toEqual([
      "lines",
      "redistribution",
      "erp",
      "history",
    ]);
    expect(availableTabs("Buyer", "ErpSubmissionFailed")).toContain("erp");
  });

  it("never shows redistribution or ERP to supplier production", () => {
    expect(availableTabs("SupplierProduction", "Sent")).toEqual(["lines", "history"]);
  });

  it("keeps closed-without-delivery orders simple", () => {
    expect(availableTabs("Buyer", "Cancelled")).toEqual(["lines", "history"]);
    expect(availableTabs("Buyer", "Rejected")).toEqual(["lines", "history"]);
  });
});

describe("pickTab", () => {
  const available = ["lines", "history"] as const;

  it("uses the requested tab when it is available", () => {
    expect(pickTab("history", available)).toBe("history");
    expect(pickTab(["history", "lines"], available)).toBe("history");
  });

  it("falls back to lines for missing, unknown or unavailable tabs", () => {
    expect(pickTab(undefined, available)).toBe("lines");
    expect(pickTab("bogus", available)).toBe("lines");
    expect(pickTab("erp", available)).toBe("lines");
  });
});
