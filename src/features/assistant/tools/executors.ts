import "server-only";
import { z } from "zod";
import type { User } from "@/features/auth";
import { dashboardApi } from "@/features/dashboard/server";
import { ORDER_STATUSES, toApiQuery } from "@/features/orders";
import { ordersApi } from "@/features/orders/server";
import { ApiError } from "@/lib/api/problem";
import { TOOL_NAMES, toolsFor, type ToolName } from "./definitions";
import { clean } from "./sanitize";

/** A way for the person to open an order the answer talks about. Built from data, never from the model's words. */
export type Reference = { id: string; code: string };

export type ToolOutcome = {
  /** What the model sees: JSON made only of structured fields, never free text such as order comments. */
  content: string;
  references: Reference[];
};

const MAX_RESULTS = 10;

const searchOrdersArgs = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  search: z.string().trim().max(80).optional(),
  pending_for_me: z.boolean().optional(),
  limit: z.number().int().min(1).max(MAX_RESULTS).optional(),
});
const getOrderArgs = z.object({ order_code: z.string().trim().min(1).max(40) });
const noArgs = z.object({});

const outcome = (value: unknown, references: Reference[] = []): ToolOutcome => ({
  content: JSON.stringify(value),
  references,
});

type Summary = Awaited<ReturnType<typeof ordersApi.list>>["items"][number];

const brief = (order: Summary) => ({
  code: order.code,
  status: order.status,
  supplier: clean(order.supplierName),
  orderDate: order.orderDate,
  deliveryDate: order.deliveryDate,
  requestedQuantity: order.requestedQuantity,
  confirmedQuantity: order.confirmedQuantity,
});

async function searchOrders(args: unknown, user: User): Promise<ToolOutcome> {
  const input = searchOrdersArgs.parse(args);
  const query = toApiQuery(
    {
      q: input.search || undefined,
      status: input.status,
      pending: input.pending_for_me ?? false,
      mine: false,
      page: 1,
      sort: "orderDate",
      desc: true,
    },
    user.id,
  );
  const page = await ordersApi.list(query);
  const shown = page.items.slice(0, input.limit ?? 5);
  return outcome(
    { totalMatching: page.totalCount, shown: shown.length, orders: shown.map(brief) },
    shown.map((order) => ({ id: order.id, code: order.code })),
  );
}

async function getOrder(args: unknown): Promise<ToolOutcome> {
  const { order_code: code } = getOrderArgs.parse(args);
  const found = await ordersApi.list(
    toApiQuery(
      { q: code, mine: false, pending: false, page: 1, sort: "orderDate", desc: true },
      "",
    ),
  );
  const match = found.items.find((order) => order.code.toLowerCase() === code.toLowerCase());
  if (!match) return outcome({ error: "not_found" });

  const [order, actions] = await Promise.all([
    ordersApi.get(match.id),
    ordersApi.actions(match.id),
  ]);
  return outcome(
    {
      code: order.header.code,
      status: order.status,
      supplier: clean(order.header.supplierName),
      orderDate: order.header.orderDate,
      deliveryDate: order.header.deliveryDate,
      lines: order.lines.length,
      totals: order.totals ?? null,
      availableActions: actions.actions,
    },
    [{ id: match.id, code: order.header.code }],
  );
}

async function ordersSummary(): Promise<ToolOutcome> {
  const summary = await dashboardApi.summary();
  return outcome({
    totalOrders: summary.totalOrders,
    openOrders: summary.openOrders,
    awaitingMyAction: summary.awaitingMyAction,
    erpFailures: summary.erpFailures,
    byStatus: summary.byStatus,
  });
}

const isToolName = (name: string): name is ToolName =>
  (TOOL_NAMES as readonly string[]).includes(name);

/**
 * Runs one tool on behalf of the person, with their own session. The model's arguments are untrusted input:
 * they are validated here, and anything wrong or forbidden becomes a short error code instead of an exception,
 * so one failed lookup does not end the conversation.
 */
export async function executeTool(name: string, args: unknown, user: User): Promise<ToolOutcome> {
  if (!isToolName(name) || !toolsFor(user).some((tool) => tool.nombre === name)) {
    return outcome({ error: "unknown_tool" });
  }
  try {
    switch (name) {
      case "search_orders":
        return await searchOrders(args, user);
      case "get_order":
        return await getOrder(args);
      case "orders_summary":
        noArgs.parse(args);
        return await ordersSummary();
    }
  } catch (error) {
    if (error instanceof z.ZodError) return outcome({ error: "invalid_arguments" });
    if (error instanceof ApiError) {
      return outcome({
        error:
          error.status === 404 ? "not_found" : error.status === 403 ? "forbidden" : "unavailable",
      });
    }
    throw error;
  }
}
