"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFormatters } from "@/i18n/formatters";
import { changeLineComment, changeLineCost, confirmLineQuantity } from "../actions.server";
import type { OrderCapabilities } from "../capabilities";
import type { Order, OrderLine } from "../schemas";
import { CommentEditor } from "./comment-editor";
import { InlineNumberInput } from "./inline-number-input";
import { LineDistribution } from "./line-distribution";

type Props = { order: Order; caps: OrderCapabilities };

export function LinesTable({ order, caps }: Props) {
  const t = useTranslations("orders.lines");
  const f = useFormatters();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const toggle = (code: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(code)) next.add(code);
      return next;
    });

  if (order.lines.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>;

  const showCosts = caps.seesCosts;
  const colSpan = 7 + (showCosts ? 2 : 0) + (caps.seesRetailPrice ? 1 : 0);

  return (
    <div className="space-y-3">
      {caps.editLines && <p className="text-sm text-muted-foreground">{t("editableHint")}</p>}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead>{t("columns.product")}</TableHead>
              <TableHead>{t("columns.pack")}</TableHead>
              <TableHead className="text-right">{t("columns.requested")}</TableHead>
              <TableHead className="text-right">{t("columns.confirmed")}</TableHead>
              <TableHead className="text-right">{t("columns.allocated")}</TableHead>
              {showCosts && <TableHead className="text-right">{t("columns.cost")}</TableHead>}
              {showCosts && <TableHead className="text-right">{t("columns.discount")}</TableHead>}
              {caps.seesRetailPrice && (
                <TableHead className="text-right">{t("columns.retail")}</TableHead>
              )}
              <TableHead className="w-12">
                <span className="sr-only">{t("columns.comment")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => (
              <Fragment key={line.productCode}>
                <LineRow
                  line={line}
                  orderId={order.id}
                  caps={caps}
                  open={expanded.has(line.productCode)}
                  onToggle={() => toggle(line.productCode)}
                  f={f}
                />
                {expanded.has(line.productCode) && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={colSpan}>
                      <LineDistribution
                        line={line}
                        locations={order.locations}
                        unitCost={showCosts ? line.unitCost : null}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

type RowProps = {
  line: OrderLine;
  orderId: string;
  caps: OrderCapabilities;
  open: boolean;
  onToggle: () => void;
  f: ReturnType<typeof useFormatters>;
};

function LineRow({ line, orderId, caps, open, onToggle, f }: RowProps) {
  const t = useTranslations("orders.lines");
  const missing = line.requestedQuantity - line.confirmedQuantity;
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <TableRow>
      <TableCell className="pr-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={t(open ? "collapse" : "expand", { product: line.productCode })}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <Chevron className="size-4" />
        </button>
      </TableCell>
      <TableCell className="max-w-72">
        <div className="font-medium">{line.productCode}</div>
        {line.description && (
          <div className="truncate text-xs text-muted-foreground">{line.description}</div>
        )}
      </TableCell>
      <TableCell>{line.pack}</TableCell>
      <TableCell className="text-right tabular-nums">
        {f.quantity(line.requestedQuantity)}
      </TableCell>
      <TableCell className="text-right">
        {caps.editLines ? (
          <InlineNumberInput
            key={line.confirmedQuantity}
            value={line.confirmedQuantity}
            label={t("quantityFor", { product: line.productCode })}
            onCommit={(value) => confirmLineQuantity(orderId, line.productCode, value ?? 0)}
          />
        ) : (
          <span className="tabular-nums">{f.quantity(line.confirmedQuantity)}</span>
        )}
        {missing > 0 && (
          <span className="mt-1 block text-xs text-amber-700 dark:text-amber-300">
            {t("differenceChip", { count: f.quantity(missing) })}
          </span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{f.quantity(line.totalQuantity)}</TableCell>
      {caps.seesCosts && (
        <TableCell className="text-right">
          {caps.editCosts ? (
            <InlineNumberInput
              key={String(line.costWithoutTax)}
              value={line.costWithoutTax}
              label={t("costFor", { product: line.productCode })}
              allowEmpty
              onCommit={(value) => changeLineCost(orderId, line.productCode, value)}
            />
          ) : (
            <span className="tabular-nums">{f.currency(line.costWithoutTax)}</span>
          )}
        </TableCell>
      )}
      {caps.seesCosts && (
        <TableCell className="text-right tabular-nums">{f.percent(line.discount)}</TableCell>
      )}
      {caps.seesRetailPrice && (
        <TableCell className="text-right tabular-nums">{f.currency(line.retailPrice)}</TableCell>
      )}
      <TableCell>
        <CommentEditor
          comment={line.comment}
          productCode={line.productCode}
          editable={caps.editLines}
          onSave={(comment) => changeLineComment(orderId, line.productCode, comment)}
        />
      </TableCell>
    </TableRow>
  );
}
