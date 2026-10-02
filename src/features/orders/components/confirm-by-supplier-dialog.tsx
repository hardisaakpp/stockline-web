"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFormatters } from "@/i18n/formatters";
import { confirmBySupplier } from "../actions.server";
import type { ActionError } from "@/lib/actions/result";
import {
  remainingByProduct,
  splitProblem,
  suggestedChild,
  toConfirmBody,
  type ChildDraft,
  type DifferenceLine,
} from "../difference-split";
import type { OrderDifference } from "../schemas";
import { useErrorMessage } from "@/lib/actions/use-error-message";
import { ChildOrdersEditor } from "./child-orders-editor";

type Props = {
  orderId: string;
  difference: OrderDifference;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
type Mode = "acknowledge" | "split";

export function ConfirmBySupplierDialog({ orderId, difference, open, onOpenChange }: Props) {
  const t = useTranslations("orders.difference");
  const tCommon = useTranslations("orders.common");
  const describe = useErrorMessage();
  const nextKey = useRef(0);
  const newKey = () => `child-${nextKey.current++}`;
  const lines = difference.lines;

  const [mode, setMode] = useState<Mode>("acknowledge");
  const [children, setChildren] = useState<ChildDraft[]>([]);
  const [error, setError] = useState<ActionError | null>(null);
  const [pending, startTransition] = useTransition();

  const remaining = remainingByProduct(lines, children);
  const blocked =
    difference.hasDifference && mode === "split" && splitProblem(lines, children) !== null;

  const chooseMode = (next: Mode) => {
    setMode(next);
    if (next === "split" && children.length === 0) setChildren([suggestedChild(lines, newKey())]);
  };
  const updateChild = (key: string, patch: Partial<ChildDraft>) =>
    setChildren((list) =>
      list.map((child) => (child.key === key ? { ...child, ...patch } : child)),
    );

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const body = difference.hasDifference
        ? toConfirmBody(mode, children)
        : { acknowledgeDifference: false, children: [] };
      const result = await confirmBySupplier(orderId, body);
      if (!result.ok) return setError(result.error);
      const created = result.data.childOrders;
      toast.success(
        created.length > 0
          ? t("createdChildren", {
              count: created.length,
              codes: created.map((c) => c.code).join(", "),
            })
          : t("confirmed"),
      );
      onOpenChange(false);
    });

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {difference.hasDifference ? t("intro") : t("noDifference")}
          </DialogDescription>
        </DialogHeader>

        {difference.hasDifference && (
          <div className="space-y-5">
            <DifferenceTable lines={lines} />

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">{t("chooseLabel")}</legend>
              {(["acknowledge", "split"] as const).map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="difference-mode"
                    value={option}
                    checked={mode === option}
                    onChange={() => chooseMode(option)}
                    className="mt-1 accent-[var(--primary)]"
                  />
                  <span>
                    <span className="block text-sm font-medium">{t(option)}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t(`${option}Hint`)}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>

            {mode === "split" && (
              <ChildOrdersEditor
                lines={lines}
                drafts={children}
                remaining={remaining}
                onUpdate={updateChild}
                onRemove={(key) => setChildren((list) => list.filter((c) => c.key !== key))}
                onAdd={() =>
                  setChildren((list) => [
                    ...list,
                    { key: newKey(), deliveryDate: "", portions: {} },
                  ])
                }
              />
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {describe(error)}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={submit} disabled={pending || blocked}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? t("submitting") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DifferenceTable({ lines }: { lines: readonly DifferenceLine[] }) {
  const t = useTranslations("orders.difference");
  const f = useFormatters();

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t("columns.product")}</TableHead>
            <TableHead className="text-right">{t("columns.requested")}</TableHead>
            <TableHead className="text-right">{t("columns.confirmed")}</TableHead>
            <TableHead className="text-right">{t("columns.missing")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.productCode}>
              <TableCell className="font-medium">{line.productCode}</TableCell>
              <TableCell className="text-right tabular-nums">
                {f.quantity(line.requested)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {f.quantity(line.confirmed)}
              </TableCell>
              <TableCell className="text-right font-medium text-amber-700 tabular-nums dark:text-amber-300">
                {f.quantity(line.difference)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
