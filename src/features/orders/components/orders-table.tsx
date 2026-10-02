import { ArrowDown, ArrowUp, GitBranch } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFormatters } from "@/i18n/formatters";
import { toSearchParams, type OrderListParams, type SortField } from "../list-params";
import type { OrderSummary } from "../schemas";
import { StatusBadge } from "./status-badge";

function SortLink({
  field,
  label,
  params,
}: {
  field: SortField;
  label: string;
  params: OrderListParams;
}) {
  const t = useTranslations("orders.list");
  const active = params.sort === field;
  // Clicking the active column flips the direction; a new column starts with its natural direction.
  const desc = active ? !params.desc : field === "orderDate";
  const query = toSearchParams({ ...params, sort: field, desc, page: 1 }).toString();

  return (
    <Link
      href={query ? `/orders?${query}` : "/orders"}
      title={t("sortBy", { column: label })}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      {active &&
        (params.desc ? (
          <ArrowDown className="size-3.5" aria-hidden="true" />
        ) : (
          <ArrowUp className="size-3.5" aria-hidden="true" />
        ))}
    </Link>
  );
}

export function OrdersTable({
  orders,
  params,
}: {
  orders: OrderSummary[];
  params: OrderListParams;
}) {
  const t = useTranslations("orders.list");
  const f = useFormatters();
  const columns = (
    key:
      | "code"
      | "supplier"
      | "status"
      | "orderDate"
      | "delivery"
      | "lines"
      | "requested"
      | "confirmed"
      | "updated",
  ) => t(`columns.${key}`);
  const ariaSort = (field: SortField) =>
    params.sort === field ? (params.desc ? "descending" : "ascending") : undefined;

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead aria-sort={ariaSort("code")}>
              <SortLink field="code" label={columns("code")} params={params} />
            </TableHead>
            <TableHead>{columns("supplier")}</TableHead>
            <TableHead aria-sort={ariaSort("status")}>
              <SortLink field="status" label={columns("status")} params={params} />
            </TableHead>
            <TableHead aria-sort={ariaSort("orderDate")}>
              <SortLink field="orderDate" label={columns("orderDate")} params={params} />
            </TableHead>
            <TableHead className="hidden xl:table-cell">{columns("delivery")}</TableHead>
            <TableHead className="text-right">{columns("lines")}</TableHead>
            <TableHead className="text-right">{columns("requested")}</TableHead>
            <TableHead className="text-right">{columns("confirmed")}</TableHead>
            <TableHead className="hidden 2xl:table-cell">{columns("updated")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const short = order.confirmedQuantity < order.requestedQuantity;
            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    {order.parentOrderId && (
                      <GitBranch
                        className="size-3.5 text-muted-foreground"
                        aria-label={t("childOrder")}
                      />
                    )}
                    {order.code}
                  </Link>
                </TableCell>
                <TableCell>{order.supplierName}</TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap">{f.date(order.orderDate)}</TableCell>
                <TableCell className="hidden whitespace-nowrap xl:table-cell">
                  {f.date(order.deliveryDate)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {f.quantity(order.lineCount)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {f.quantity(order.requestedQuantity)}
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums ${short ? "text-amber-700 dark:text-amber-300" : ""}`}
                >
                  {f.quantity(order.confirmedQuantity)}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground 2xl:table-cell">
                  {f.dateTime(order.modifiedAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
