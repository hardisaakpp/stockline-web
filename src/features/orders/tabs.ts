import type { Role } from "@/features/auth";
import { orderCapabilities } from "./capabilities";
import type { OrderStatus } from "./schemas";

export const TAB_NAMES = ["lines", "redistribution", "erp", "history"] as const;
export type TabName = (typeof TAB_NAMES)[number];

const AFTER_SUPPLIER_CONFIRMATION: readonly OrderStatus[] = [
  "SupplierConfirmed",
  "ReadyForRedistribution",
  "RedistributionConfirmed",
  "ErpSubmissionFailed",
  "LogisticsPending",
  "Sent",
  "DispatchAndInvoice",
  "Completed",
];

const AFTER_REDISTRIBUTION: readonly OrderStatus[] = AFTER_SUPPLIER_CONFIRMATION.slice(2);

/** Sections worth showing for an order: the later ones appear once the order has reached that stage. */
export function availableTabs(role: Role, status: OrderStatus): TabName[] {
  const caps = orderCapabilities(role, status);
  const tabs: TabName[] = ["lines"];
  if (role !== "SupplierProduction" && AFTER_SUPPLIER_CONFIRMATION.includes(status))
    tabs.push("redistribution");
  if (caps.viewErpDocuments && AFTER_REDISTRIBUTION.includes(status)) tabs.push("erp");
  tabs.push("history");
  return tabs;
}

/** The requested tab when it exists for this order, otherwise the first one. */
export function pickTab(
  requested: string | string[] | undefined,
  available: readonly TabName[],
): TabName {
  const value = Array.isArray(requested) ? requested[0] : requested;
  return available.find((tab) => tab === value) ?? "lines";
}
