import type { OrderStatus } from "./schemas";

export type StatusTone = "neutral" | "info" | "attention" | "success" | "danger";

/** Visual tone of each status: what a glance at the list should tell the reader. */
export const STATUS_TONE: Record<OrderStatus, StatusTone> = {
  Draft: "neutral",
  Submitted: "info",
  UnderReview: "info",
  ProductionConfirmed: "info",
  SupplierConfirmed: "attention",
  ProductionPostponed: "attention",
  ReadyForRedistribution: "attention",
  RedistributionConfirmed: "info",
  ErpSubmissionFailed: "danger",
  LogisticsPending: "attention",
  Sent: "success",
  DispatchAndInvoice: "success",
  Completed: "success",
  Rejected: "danger",
  Cancelled: "neutral",
  CancelledBySupplier: "danger",
};

/** The happy path an order follows; shown as a progress tracker on the detail page. */
export const MAIN_PATH: readonly OrderStatus[] = [
  "Draft",
  "Submitted",
  "UnderReview",
  "SupplierConfirmed",
  "RedistributionConfirmed",
  "Sent",
  "Completed",
];

/** Statuses that sit between two main-path steps, mapped to the step they have reached. */
const REACHED_STEP: Partial<Record<OrderStatus, OrderStatus>> = {
  ProductionConfirmed: "UnderReview",
  ReadyForRedistribution: "SupplierConfirmed",
  ErpSubmissionFailed: "RedistributionConfirmed",
  LogisticsPending: "RedistributionConfirmed",
  DispatchAndInvoice: "Sent",
};

/** Index of the main-path step an order has reached, or null when it left the path (rejected, cancelled, postponed). */
export function progressIndex(status: OrderStatus): number | null {
  const step = REACHED_STEP[status] ?? status;
  const index = MAIN_PATH.indexOf(step);
  return index === -1 ? null : index;
}

const OFF_PATH: readonly OrderStatus[] = [
  "Rejected",
  "Cancelled",
  "CancelledBySupplier",
  "ProductionPostponed",
];

export const isOffPath = (status: OrderStatus) => OFF_PATH.includes(status);

const TERMINAL: readonly OrderStatus[] = [
  "Completed",
  "Rejected",
  "Cancelled",
  "CancelledBySupplier",
];

export const isTerminal = (status: OrderStatus) => TERMINAL.includes(status);
