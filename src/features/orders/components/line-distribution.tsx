import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/formatters";
import type { OrderLine, OrderLocation } from "../schemas";
import { orderedLocations } from "../redistribution-math";

/** Units of one line at each location, warehouses first. Shown when a row is expanded. */
export function LineDistribution({
  line,
  locations,
  unitCost,
}: {
  line: OrderLine;
  locations: readonly OrderLocation[];
  unitCost: number | null;
}) {
  const t = useTranslations("orders.lines");
  const f = useFormatters();
  const byCode = new Map(line.allocations.map((a) => [a.locationCode, a.quantity]));
  const shown = orderedLocations(locations).filter(
    (location) => (byCode.get(location.code) ?? 0) > 0,
  );

  return (
    <div className="space-y-2 py-1">
      <p className="text-xs font-medium text-muted-foreground">{t("distribution")}</p>
      <ul className="flex flex-wrap gap-2">
        {shown.map((location) => (
          <li key={location.code} className="rounded-lg border bg-background px-3 py-1.5 text-sm">
            <span className="text-muted-foreground">{location.name ?? location.code}</span>{" "}
            <span className="font-medium tabular-nums">
              {f.quantity(byCode.get(location.code) ?? 0)}
            </span>
          </li>
        ))}
      </ul>
      {unitCost !== null && (
        <p className="text-xs text-muted-foreground">
          {t("columns.unitCost")}: <span className="tabular-nums">{f.currency(unitCost)}</span>
        </p>
      )}
    </div>
  );
}
