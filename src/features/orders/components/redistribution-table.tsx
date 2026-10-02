"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFormatters } from "@/i18n/formatters";
import { cn } from "@/lib/utils";
import { balance, isBalanced, orderedLocations, rowTotal, type Grid } from "../redistribution-math";
import type { OrderLocation, Redistribution } from "../schemas";

type Props = {
  lines: Redistribution["lines"];
  locations: readonly OrderLocation[];
  grid: Grid;
  /** When set, cells are inputs; otherwise they show the quantities. */
  onChange?: (productCode: string, locationCode: string, value: string) => void;
  /** Products the API reported problems for, highlighted in the table. */
  problemProducts?: ReadonlySet<string>;
};

export function RedistributionTable({ lines, locations, grid, onChange, problemProducts }: Props) {
  const t = useTranslations("orders.redistribution");
  const f = useFormatters();
  const columns = orderedLocations(locations);

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="sticky left-0 bg-card">{t("columns.product")}</TableHead>
            <TableHead className="text-right">{t("columns.confirmed")}</TableHead>
            {columns.map((location) => (
              <TableHead key={location.code} className="text-right">
                <span className="block">{location.name ?? location.code}</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  {location.code}
                </span>
              </TableHead>
            ))}
            <TableHead className="text-right">{t("columns.allocated")}</TableHead>
            <TableHead className="text-right">{t("columns.balance")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => {
            const row = grid[line.productCode];
            const left = balance(line.confirmedQuantity, row);
            const problem = problemProducts?.has(line.productCode);
            return (
              <TableRow key={line.productCode} className={cn(problem && "bg-destructive/5")}>
                <TableCell className="sticky left-0 bg-card font-medium">
                  {line.productCode}
                  {line.description && (
                    <span className="block max-w-48 truncate text-xs font-normal text-muted-foreground">
                      {line.description}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {f.quantity(line.confirmedQuantity)}
                </TableCell>
                {columns.map((location) => (
                  <TableCell key={location.code} className="text-right">
                    {onChange ? (
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={row?.[location.code] ?? ""}
                        aria-label={t("quantityIn", {
                          product: line.productCode,
                          location: location.name ?? location.code,
                        })}
                        onChange={(event) =>
                          onChange(line.productCode, location.code, event.target.value)
                        }
                        className="h-8 w-20 text-right tabular-nums"
                      />
                    ) : (
                      <span className="tabular-nums">
                        {row?.[location.code] ? f.quantity(Number(row[location.code])) : "—"}
                      </span>
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-right tabular-nums">
                  {f.quantity(rowTotal(row))}
                </TableCell>
                <TableCell className="text-right">
                  <BalanceCell value={left} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function BalanceCell({ value }: { value: number }) {
  const t = useTranslations("orders.redistribution");
  const f = useFormatters();
  const ok = isBalanced(value);

  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        ok
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "bg-amber-500/15 text-amber-800 dark:text-amber-300",
      )}
    >
      {ok
        ? t("balanceOk")
        : value > 0
          ? t("balanceShort", { count: f.quantity(value) })
          : t("balanceOver", { count: f.quantity(-value) })}
    </span>
  );
}
