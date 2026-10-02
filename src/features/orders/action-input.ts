import { z } from "zod";
import { ACTION_META } from "./actions";
import { ORDER_ACTIONS } from "./schemas";

/**
 * Validation of what a Server Action receives. Server Actions are public endpoints, so nothing
 * from the client is trusted even though the UI only sends sensible values.
 */
const orderId = z.uuid();
const productCode = z.string().trim().min(1).max(60);
const quantity = z.number().finite().min(0).max(1_000_000_000);
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Only actions a person may trigger: system-only transitions are never accepted from the browser. */
const userAction = z.enum(ORDER_ACTIONS).refine((action) => action in ACTION_META);

const planSchema = z.object({
  lines: z
    .array(
      z.object({
        productCode,
        allocations: z
          .array(z.object({ locationCode: z.string().trim().min(1).max(40), quantity }))
          .max(200),
      }),
    )
    .max(5000),
});

export const inputs = {
  applyAction: z.tuple([orderId, userAction]),
  confirmQuantity: z.tuple([orderId, productCode, quantity]),
  changeCost: z.tuple([orderId, productCode, quantity.nullable()]),
  changeComment: z.tuple([orderId, productCode, z.string().trim().max(500).nullable()]),
  correctProductCode: z.tuple([orderId, productCode, productCode]),
  confirmBySupplier: z.tuple([
    orderId,
    z.object({
      acknowledgeDifference: z.boolean(),
      children: z
        .array(z.object({ deliveryDate: calendarDate, portions: z.record(productCode, quantity) }))
        .max(50),
    }),
  ]),
  plan: z.tuple([orderId, planSchema]),
  orderOnly: z.tuple([orderId]),
};
