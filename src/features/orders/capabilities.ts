import type { Role } from "@/features/auth";
import type { OrderStatus } from "./schemas";

/**
 * What a role may do with an order in a given status. This mirrors the rules enforced by
 * api-stockline so the UI only offers actions that can succeed; the API remains the authority.
 */
export type OrderCapabilities = {
  /** Change confirmed quantities and comments on lines. */
  editLines: boolean;
  /** Change line costs (production never sees costs, so it cannot edit them). */
  editCosts: boolean;
  seesCosts: boolean;
  seesRetailPrice: boolean;
  /** Edit the stock distribution across locations. */
  redistribute: boolean;
  /** Fix a wrong product code after the ERP rejected it. */
  correctProductCodes: boolean;
  discard: boolean;
  /** Push (or retry) the order to the ERP. */
  submitToErp: boolean;
  downloadSourceFile: boolean;
  viewErpDocuments: boolean;
};

const SUPPLIER_EDITABLE: readonly OrderStatus[] = ["UnderReview", "ProductionConfirmed"];
const REDISTRIBUTABLE: readonly OrderStatus[] = ["SupplierConfirmed", "ReadyForRedistribution"];
const ERP_SUBMITTABLE: readonly OrderStatus[] = [
  "RedistributionConfirmed",
  "ErpSubmissionFailed",
  "LogisticsPending",
];
const DISCARDABLE: readonly OrderStatus[] = ["Draft", "Submitted"];

export function orderCapabilities(role: Role, status: OrderStatus): OrderCapabilities {
  const isBuyer = role === "Buyer";
  const isSupplierSide = role === "Supplier" || role === "SupplierProduction";
  const supplierEditable = isSupplierSide && SUPPLIER_EDITABLE.includes(status);

  return {
    editLines: supplierEditable,
    editCosts: supplierEditable && role === "Supplier",
    seesCosts: role !== "SupplierProduction",
    seesRetailPrice: isBuyer,
    redistribute: isBuyer && REDISTRIBUTABLE.includes(status),
    correctProductCodes: isBuyer && status === "ErpSubmissionFailed",
    discard: isBuyer && DISCARDABLE.includes(status),
    submitToErp: isBuyer && ERP_SUBMITTABLE.includes(status),
    downloadSourceFile: isBuyer,
    viewErpDocuments: role !== "SupplierProduction",
  };
}

/** Supplier production only works on orders waiting for or under review; afterwards the supplier admin takes over. */
export const PRODUCTION_VISIBLE_STATUSES: readonly OrderStatus[] = ["Submitted", "UnderReview"];

/** Whether a role may open an order in this status (the API answers 404 otherwise, so existence is not revealed). */
export function canSeeStatus(role: Role, status: OrderStatus): boolean {
  return role !== "SupplierProduction" || PRODUCTION_VISIBLE_STATUSES.includes(status);
}
