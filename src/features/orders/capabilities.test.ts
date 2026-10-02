import { describe, expect, it } from "vitest";
import { canSeeStatus, orderCapabilities } from "./capabilities";
import { ORDER_STATUSES } from "./schemas";

describe("orderCapabilities", () => {
  it("lets only the supplier side edit lines, and only while the order is in review", () => {
    for (const status of ORDER_STATUSES) {
      const inReview = status === "UnderReview" || status === "ProductionConfirmed";
      expect(orderCapabilities("Supplier", status).editLines, status).toBe(inReview);
      expect(orderCapabilities("SupplierProduction", status).editLines, status).toBe(inReview);
      expect(orderCapabilities("Buyer", status).editLines, status).toBe(false);
    }
  });

  it("hides costs from production, so production cannot edit them", () => {
    expect(orderCapabilities("SupplierProduction", "UnderReview")).toMatchObject({
      seesCosts: false,
      editCosts: false,
      editLines: true,
    });
    expect(orderCapabilities("Supplier", "UnderReview")).toMatchObject({
      seesCosts: true,
      editCosts: true,
    });
    expect(orderCapabilities("Buyer", "UnderReview").editCosts).toBe(false);
  });

  it("shows retail prices to the buyer only", () => {
    expect(orderCapabilities("Buyer", "Draft").seesRetailPrice).toBe(true);
    expect(orderCapabilities("Supplier", "Draft").seesRetailPrice).toBe(false);
    expect(orderCapabilities("SupplierProduction", "Draft").seesRetailPrice).toBe(false);
  });

  it("allows redistribution by the buyer once the supplier has confirmed", () => {
    expect(orderCapabilities("Buyer", "SupplierConfirmed").redistribute).toBe(true);
    expect(orderCapabilities("Buyer", "ReadyForRedistribution").redistribute).toBe(true);
    expect(orderCapabilities("Buyer", "UnderReview").redistribute).toBe(false);
    expect(orderCapabilities("Buyer", "RedistributionConfirmed").redistribute).toBe(false);
    expect(orderCapabilities("Supplier", "SupplierConfirmed").redistribute).toBe(false);
  });

  it("limits discarding to the buyer, before the supplier starts", () => {
    expect(orderCapabilities("Buyer", "Draft").discard).toBe(true);
    expect(orderCapabilities("Buyer", "Submitted").discard).toBe(true);
    expect(orderCapabilities("Buyer", "UnderReview").discard).toBe(false);
    expect(orderCapabilities("Supplier", "Draft").discard).toBe(false);
  });

  it("lets the buyer push to the ERP, retry after a failure and fix product codes only then", () => {
    expect(orderCapabilities("Buyer", "RedistributionConfirmed").submitToErp).toBe(true);
    expect(orderCapabilities("Buyer", "ErpSubmissionFailed").submitToErp).toBe(true);
    expect(orderCapabilities("Buyer", "SupplierConfirmed").submitToErp).toBe(false);
    expect(orderCapabilities("Supplier", "RedistributionConfirmed").submitToErp).toBe(false);
    expect(orderCapabilities("Buyer", "ErpSubmissionFailed").correctProductCodes).toBe(true);
    expect(orderCapabilities("Buyer", "RedistributionConfirmed").correctProductCodes).toBe(false);
  });

  it("keeps the source file and ERP documents away from production", () => {
    expect(orderCapabilities("Buyer", "Draft").downloadSourceFile).toBe(true);
    expect(orderCapabilities("Supplier", "Draft").downloadSourceFile).toBe(false);
    expect(orderCapabilities("SupplierProduction", "Sent").viewErpDocuments).toBe(false);
    expect(orderCapabilities("Supplier", "Sent").viewErpDocuments).toBe(true);
  });

  it("restricts supplier production to orders in review", () => {
    expect(canSeeStatus("SupplierProduction", "Submitted")).toBe(true);
    expect(canSeeStatus("SupplierProduction", "UnderReview")).toBe(true);
    expect(canSeeStatus("SupplierProduction", "ProductionConfirmed")).toBe(false);
    expect(canSeeStatus("SupplierProduction", "Draft")).toBe(false);
    for (const role of ["Buyer", "Supplier"] as const) {
      expect(canSeeStatus(role, "ProductionConfirmed")).toBe(true);
    }
  });
});
