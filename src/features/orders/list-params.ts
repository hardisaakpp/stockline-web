import { z } from "zod";
import { ORDER_STATUSES, type OrderStatus } from "./schemas";

export const PAGE_SIZE = 20;
export const SORT_FIELDS = ["orderDate", "code", "status"] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export type OrderListParams = {
  q?: string;
  status?: OrderStatus;
  /** Only orders created by the signed-in user. */
  mine: boolean;
  /** Only orders waiting for the signed-in user to act. */
  pending: boolean;
  from?: string;
  to?: string;
  page: number;
  sort: SortField;
  desc: boolean;
};

const dateParam = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Reads list filters from URL search params, ignoring anything malformed instead of failing. */
export function parseListParams(
  raw: Record<string, string | string[] | undefined>,
): OrderListParams {
  const get = (key: string) => first(raw[key]);
  const status = ORDER_STATUSES.find((s) => s === get("status"));
  // No `sort` param means the default (newest first); otherwise a `-` prefix means descending.
  const sortParam = get("sort");
  const sort = SORT_FIELDS.find((f) => f === sortParam?.replace(/^[-+]/, "")) ?? "orderDate";
  const desc =
    sortParam === undefined || !SORT_FIELDS.some((f) => f === sortParam.replace(/^[-+]/, ""))
      ? true
      : sortParam.startsWith("-");
  const page = Number.parseInt(get("page") ?? "1", 10);
  const q = get("q")?.trim();
  const from = dateParam.safeParse(get("from"));
  const to = dateParam.safeParse(get("to"));

  return {
    q: q || undefined,
    status,
    mine: get("mine") === "1",
    pending: get("pending") === "1",
    from: from.success ? from.data : undefined,
    to: to.success ? to.data : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    sort,
    desc,
  };
}

/** Query string for the page URL: only values that differ from the defaults. */
export function toSearchParams(params: Partial<OrderListParams>): URLSearchParams {
  const search = new URLSearchParams();
  const entries: [string, string | undefined][] = [
    ["q", params.q],
    ["status", params.status],
    ["mine", params.mine ? "1" : undefined],
    ["pending", params.pending ? "1" : undefined],
    ["from", params.from],
    ["to", params.to],
    ["page", params.page && params.page > 1 ? String(params.page) : undefined],
  ];
  for (const [key, value] of entries) if (value) search.set(key, value);

  const sort = params.sort ?? "orderDate";
  const desc = params.desc ?? sort === "orderDate";
  if (sort !== "orderDate" || !desc) search.set("sort", `${desc ? "-" : "+"}${sort}`);
  return search;
}

/** Query string for `GET /orders` on api-stockline. */
export function toApiQuery(params: OrderListParams, userId: string): string {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(PAGE_SIZE),
    sort: `${params.desc ? "-" : ""}${params.sort}`,
  });
  if (params.q) search.set("search", params.q);
  if (params.status) search.set("status", params.status);
  if (params.from) search.set("dateFrom", params.from);
  if (params.to) search.set("dateTo", params.to);
  if (params.pending) search.set("pendingMyAction", "true");
  if (params.mine) search.set("createdBy", userId);
  return search.toString();
}

export const hasActiveFilters = (params: OrderListParams) =>
  Boolean(params.q || params.status || params.mine || params.pending || params.from || params.to);
