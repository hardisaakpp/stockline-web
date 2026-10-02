import { ArrowRight, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/formatters";
import { STATUS_TONE } from "../status";
import { ORDER_STATUSES, type AuditEntry, type OrderStatus } from "../schemas";
import { StatusBadge } from "./status-badge";

const isStatus = (value: string | null): value is OrderStatus =>
  (ORDER_STATUSES as readonly string[]).includes(value ?? "");

const KNOWN_ACTORS = ["Buyer", "Supplier", "SupplierProduction", "System"] as const;
const KNOWN_FIELDS = [
  "ConfirmedQuantity",
  "Cost",
  "UnitCost",
  "Comment",
  "ProductCode",
  "Status",
] as const;
type Known<T extends readonly string[]> = T[number];

function known<T extends readonly string[]>(list: T, value: string): value is Known<T> {
  return (list as readonly string[]).includes(value);
}

/** Status changes and field edits of an order, newest first. */
export function AuditTimeline({ entries }: { entries: readonly AuditEntry[] }) {
  const t = useTranslations("orders.history");
  const f = useFormatters();

  if (entries.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>;
  const value = (text: string | null) => text ?? t("empty_value");

  return (
    <ol className="relative space-y-5 border-l pl-6">
      {entries.map((entry, index) => {
        const isStatusChange = entry.type === "StatusChange";
        const actor = known(KNOWN_ACTORS, entry.actor) ? t(`actor.${entry.actor}`) : entry.actor;
        const field = known(KNOWN_FIELDS, entry.field) ? t(`fields.${entry.field}`) : entry.field;
        return (
          <li key={`${entry.at}-${index}`} className="relative">
            <span
              className={`absolute -left-[31px] flex size-5 items-center justify-center rounded-full border bg-background ${
                isStatusChange &&
                isStatus(entry.newValue) &&
                STATUS_TONE[entry.newValue] === "danger"
                  ? "border-destructive"
                  : ""
              }`}
            >
              {isStatusChange ? <ArrowRight className="size-3" /> : <Pencil className="size-3" />}
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              {isStatusChange && isStatus(entry.oldValue) && isStatus(entry.newValue) ? (
                <>
                  <StatusBadge status={entry.oldValue} />
                  <ArrowRight className="size-3.5 text-muted-foreground" aria-label={t("to")} />
                  <StatusBadge status={entry.newValue} />
                </>
              ) : (
                <span>
                  {entry.productCode
                    ? t("fieldChange", { field, product: entry.productCode })
                    : t("fieldChangeOrder", { field })}
                  :{" "}
                  <span className="text-muted-foreground line-through">
                    {value(entry.oldValue)}
                  </span>{" "}
                  <ArrowRight
                    className="inline size-3.5 text-muted-foreground"
                    aria-label={t("to")}
                  />{" "}
                  <span className="font-medium">{value(entry.newValue)}</span>
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {actor} · {f.dateTime(entry.at)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
