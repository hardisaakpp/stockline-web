import { can, PERMISSIONS, type User } from "@/features/auth";
import { ORDER_STATUSES } from "@/features/orders";

/** A tool as Xia needs it: a name, what it is for, and the JSON Schema of its arguments. */
export type ToolDefinition = {
  nombre: string;
  descripcion: string;
  parametros: Record<string, unknown>;
};

export const TOOL_NAMES = ["search_orders", "get_order", "orders_summary"] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

/** The model picks a status from plain language, so each one says what it means in everyday words. */
const STATUS_HELP =
  "Exact status of the order. Draft=draft; Submitted=sent to the supplier; UnderReview=being reviewed by the supplier; " +
  "SupplierConfirmed=confirmed by the supplier; ReadyForRedistribution=ready to redistribute; " +
  "RedistributionConfirmed=redistribution confirmed; ErpSubmissionFailed=sending to the ERP failed (error); " +
  "Sent=sent to the ERP successfully; Completed=completed; Cancelled=cancelled; Rejected=rejected.";

const DEFINITIONS: Record<ToolName, ToolDefinition> = {
  search_orders: {
    nombre: "search_orders",
    descripcion:
      "Searches the purchase orders the user can see. Use it to list or filter orders by status, text, or the ones waiting for the user.",
    parametros: {
      type: "object",
      properties: {
        status: { type: "string", enum: [...ORDER_STATUSES], description: STATUS_HELP },
        search: {
          type: "string",
          description: "Text to look for in the order code or the supplier.",
        },
        pending_for_me: {
          type: "boolean",
          description: "Only orders where it is the user's turn to act.",
        },
        limit: { type: "integer", description: "Maximum results, 1 to 10." },
      },
    },
  },
  get_order: {
    nombre: "get_order",
    descripcion:
      "Gets the details of ONE order by its code (for example PO-2026-001): status, quantities, totals and what the user can do next.",
    parametros: {
      type: "object",
      properties: { order_code: { type: "string", description: "The order code." } },
      required: ["order_code"],
    },
  },
  orders_summary: {
    nombre: "orders_summary",
    descripcion:
      "The user's headline numbers: total orders, open orders, orders waiting for the user, ERP failures, and the count per status.",
    parametros: { type: "object", properties: {} },
  },
};

/** Tools this person may use: only those they hold the permission for. (The API checks again on every call.) */
export function toolsFor(user: Pick<User, "permissions">): ToolDefinition[] {
  const tools: ToolDefinition[] = [];
  if (can(user, PERMISSIONS.ordersView)) {
    tools.push(DEFINITIONS.search_orders, DEFINITIONS.get_order);
  }
  if (can(user, PERMISSIONS.dashboardView)) tools.push(DEFINITIONS.orders_summary);
  return tools;
}
