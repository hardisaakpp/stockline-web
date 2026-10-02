import "server-only";
import { cache } from "react";
import { ordersApi } from "./api";

/** One API call per render even when both `generateMetadata` and the page ask for the order. */
export const getOrder = cache((id: string) => ordersApi.get(id));
