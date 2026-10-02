"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormatters } from "@/i18n/formatters";
import type { ChildDraft, DifferenceLine } from "../difference-split";

type Props = {
  lines: readonly DifferenceLine[];
  drafts: readonly ChildDraft[];
  remaining: Record<string, number>;
  onUpdate: (key: string, patch: Partial<ChildDraft>) => void;
  onRemove: (key: string) => void;
  onAdd: () => void;
};

/** Splits the units production could not make into child orders, each with its own delivery date. */
export function ChildOrdersEditor({ lines, drafts, remaining, onUpdate, onRemove, onAdd }: Props) {
  const t = useTranslations("orders.difference");
  const f = useFormatters();

  return (
    <div className="space-y-4">
      {drafts.map((child, index) => (
        <div key={child.key} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-end justify-between gap-3">
            <p className="text-sm font-medium">{t("childOrder", { number: index + 1 })}</p>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor={`${child.key}-date`} className="text-xs text-muted-foreground">
                  {t("deliveryDate")}
                </Label>
                <Input
                  id={`${child.key}-date`}
                  type="date"
                  value={child.deliveryDate}
                  onChange={(event) => onUpdate(child.key, { deliveryDate: event.target.value })}
                  className="h-8 w-40"
                />
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("removeChild", { number: index + 1 })}
                onClick={() => onRemove(child.key)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {lines.map((line) => (
              <div
                key={line.productCode}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <Label
                  htmlFor={`${child.key}-${line.productCode}`}
                  className="font-normal text-muted-foreground"
                >
                  {line.productCode}
                </Label>
                <Input
                  id={`${child.key}-${line.productCode}`}
                  type="number"
                  min={0}
                  step="any"
                  aria-label={t("portion", { product: line.productCode })}
                  value={child.portions[line.productCode] ?? ""}
                  onChange={(event) =>
                    onUpdate(child.key, {
                      portions: { ...child.portions, [line.productCode]: event.target.value },
                    })
                  }
                  className="h-8 w-24 text-right tabular-nums"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-4" />
          {t("addChild")}
        </Button>
        <ul
          className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
          aria-live="polite"
        >
          {lines.map((line) => {
            const left = remaining[line.productCode] ?? 0;
            return (
              <li key={line.productCode}>
                {line.productCode}:{" "}
                {left < 0
                  ? t("over", { count: f.quantity(-left) })
                  : t("remaining", { count: left })}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
