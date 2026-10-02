import { z } from "zod";
import { ORDER_STATUSES, orderSummarySchema } from "@/features/orders";

export const dashboardSchema = z.object({
  totalOrders: z.number(),
  openOrders: z.number(),
  awaitingMyAction: z.number(),
  erpFailures: z.number(),
  byStatus: z.array(z.object({ status: z.enum(ORDER_STATUSES), count: z.number() })),
  last30Days: z.array(z.object({ date: z.string(), count: z.number() })),
  recent: z.array(orderSummarySchema),
});
export type DashboardSummary = z.infer<typeof dashboardSchema>;
