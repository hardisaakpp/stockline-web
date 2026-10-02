/** Server-only entry point of the orders feature (data loading and Server Actions). */
export { ordersApi } from "./api";
export { getOrder } from "./queries";
export * from "./actions.server";
export { OrderDetail } from "./order-detail";
