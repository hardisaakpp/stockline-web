"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/run";
import { inputs } from "./action-input";
import type { ActionResult } from "@/lib/actions/result";
import { ordersApi } from "./api";
import type { Plan, Order, OrderAction } from "./schemas";

const refresh = (orderId: string) => {
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
};

export async function applyOrderAction(
  orderId: string,
  action: OrderAction,
): Promise<ActionResult<Order>> {
  return runAction(inputs.applyAction, [orderId, action], async ([id, a]) => {
    const order = await ordersApi.applyAction(id, a);
    refresh(id);
    return order;
  });
}

export async function confirmLineQuantity(orderId: string, productCode: string, quantity: number) {
  return runAction(
    inputs.confirmQuantity,
    [orderId, productCode, quantity],
    async ([id, code, qty]) => {
      const order = await ordersApi.confirmQuantity(id, code, qty);
      refresh(id);
      return order;
    },
  );
}

export async function changeLineCost(orderId: string, productCode: string, cost: number | null) {
  return runAction(inputs.changeCost, [orderId, productCode, cost], async ([id, code, value]) => {
    const order = await ordersApi.changeCost(id, code, value);
    refresh(id);
    return order;
  });
}

export async function changeLineComment(
  orderId: string,
  productCode: string,
  comment: string | null,
) {
  return runAction(
    inputs.changeComment,
    [orderId, productCode, comment],
    async ([id, code, text]) => {
      const order = await ordersApi.changeComment(id, code, text || null);
      refresh(id);
      return order;
    },
  );
}

export async function correctProductCode(orderId: string, productCode: string, newCode: string) {
  return runAction(
    inputs.correctProductCode,
    [orderId, productCode, newCode],
    async ([id, code, next]) => {
      const order = await ordersApi.correctProductCode(id, code, next);
      refresh(id);
      return order;
    },
  );
}

export async function confirmBySupplier(
  orderId: string,
  body: {
    acknowledgeDifference: boolean;
    children: { deliveryDate: string; portions: Record<string, number> }[];
  },
) {
  return runAction(inputs.confirmBySupplier, [orderId, body], async ([id, payload]) => {
    const result = await ordersApi.confirmBySupplier(id, payload);
    refresh(id);
    return result;
  });
}

export async function loadRedistributionProposal(orderId: string) {
  return runAction(inputs.orderOnly, [orderId], ([id]) => ordersApi.proposal(id));
}

export async function saveRedistributionDraft(orderId: string, plan: Plan) {
  return runAction(inputs.plan, [orderId, plan], async ([id, p]) => {
    const order = await ordersApi.saveDraft(id, p);
    refresh(id);
    return order;
  });
}

export async function confirmRedistribution(orderId: string, plan: Plan) {
  return runAction(inputs.plan, [orderId, plan], async ([id, p]) => {
    const order = await ordersApi.confirmRedistribution(id, p);
    refresh(id);
    return order;
  });
}

export async function requestErpSubmission(orderId: string) {
  return runAction(inputs.orderOnly, [orderId], async ([id]) => {
    await ordersApi.requestErp(id);
    refresh(id);
  });
}

export async function discardOrder(orderId: string) {
  return runAction(inputs.orderOnly, [orderId], async ([id]) => {
    await ordersApi.discard(id);
    revalidatePath("/orders");
  });
}
