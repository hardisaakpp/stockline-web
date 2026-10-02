import "server-only";
import { z } from "zod";
import { apiRequest, apiRequestVoid } from "@/lib/api/client";
import { requireAccessToken } from "@/features/auth/server";
import {
  auditEntrySchema,
  confirmResultSchema,
  differenceSchema,
  erpSubmissionSchema,
  orderActionsSchema,
  orderSchema,
  pagedOrdersSchema,
  proposalSchema,
  redistributionSchema,
  type OrderAction,
  type Plan,
} from "./schemas";

type Options = { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown };

/** Calls api-stockline with the signed-in user's access token (read from the HttpOnly cookie). */
async function authed<S extends z.ZodType>(path: string, schema: S, options: Options = {}) {
  return apiRequest(path, schema, { ...options, accessToken: await requireAccessToken() });
}

async function authedVoid(path: string, options: Options = {}) {
  await apiRequestVoid(path, { ...options, accessToken: await requireAccessToken() });
}

const orderPath = (id: string) => `/orders/${encodeURIComponent(id)}`;
const linePath = (id: string, productCode: string) =>
  `${orderPath(id)}/lines/${encodeURIComponent(productCode)}`;

export const ordersApi = {
  list: (query: string) => authed(`/orders?${query}`, pagedOrdersSchema),
  get: (id: string) => authed(orderPath(id), orderSchema),
  actions: (id: string) => authed(`${orderPath(id)}/actions`, orderActionsSchema),
  difference: (id: string) => authed(`${orderPath(id)}/difference`, differenceSchema),
  redistribution: (id: string) => authed(`${orderPath(id)}/redistribution`, redistributionSchema),
  proposal: (id: string) => authed(`${orderPath(id)}/redistribution/proposal`, proposalSchema),
  audit: (id: string) => authed(`${orderPath(id)}/audit-log`, z.array(auditEntrySchema)),
  erp: (id: string) => authed(`${orderPath(id)}/erp-submission`, erpSubmissionSchema),

  applyAction: (id: string, action: OrderAction) =>
    authed(`${orderPath(id)}/actions/${action}`, orderSchema, { method: "POST" }),
  confirmQuantity: (id: string, productCode: string, quantity: number) =>
    authed(`${linePath(id, productCode)}/confirmed-quantity`, orderSchema, {
      method: "PATCH",
      body: { quantity },
    }),
  changeCost: (id: string, productCode: string, cost: number | null) =>
    authed(`${linePath(id, productCode)}/cost`, orderSchema, { method: "PATCH", body: { cost } }),
  changeComment: (id: string, productCode: string, comment: string | null) =>
    authed(`${linePath(id, productCode)}/comment`, orderSchema, {
      method: "PATCH",
      body: { comment },
    }),
  correctProductCode: (id: string, productCode: string, newCode: string) =>
    authed(`${linePath(id, productCode)}/product-code`, orderSchema, {
      method: "PUT",
      body: { newCode },
    }),
  confirmBySupplier: (
    id: string,
    body: {
      acknowledgeDifference: boolean;
      children: { deliveryDate: string; portions: Record<string, number> }[];
    },
  ) => authed(`${orderPath(id)}/confirm`, confirmResultSchema, { method: "POST", body }),
  saveDraft: (id: string, plan: Plan) =>
    authed(`${orderPath(id)}/redistribution/draft`, orderSchema, { method: "PUT", body: plan }),
  confirmRedistribution: (id: string, plan: Plan) =>
    authed(`${orderPath(id)}/redistribution/confirm`, orderSchema, { method: "POST", body: plan }),
  requestErp: (id: string) => authedVoid(`${orderPath(id)}/erp-submission`, { method: "POST" }),
  discard: (id: string) => authedVoid(orderPath(id), { method: "DELETE" }),
};
