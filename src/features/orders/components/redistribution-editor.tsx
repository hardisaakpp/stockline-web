"use client";

import { Loader2, Save, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { ActionError } from "@/lib/actions/result";
import {
  confirmRedistribution,
  loadRedistributionProposal,
  saveRedistributionDraft,
} from "../actions.server";
import {
  allBalanced,
  gridFromAllocations,
  initialGrid,
  sameGrid,
  toPlan,
  type Grid,
} from "../redistribution-math";
import type { Redistribution } from "../schemas";
import { useErrorMessage } from "@/lib/actions/use-error-message";
import { RedistributionTable } from "./redistribution-table";

type Props = { orderId: string; view: Redistribution; editable: boolean };

/** Read-only distribution, or an editor that saves a draft and confirms a plan that adds up. */
export function RedistributionEditor({ orderId, view, editable }: Props) {
  const t = useTranslations("orders.redistribution");

  if (view.lines.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>;
  if (!editable) {
    const grid = gridFromAllocations(view.lines);
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("readOnlyIntro")}</p>
        <RedistributionTable lines={view.lines} locations={view.locations} grid={grid} />
      </div>
    );
  }
  return <EditableDistribution orderId={orderId} view={view} />;
}

function EditableDistribution({ orderId, view }: { orderId: string; view: Redistribution }) {
  const t = useTranslations("orders.redistribution");
  const describe = useErrorMessage();
  const [grid, setGrid] = useState<Grid>(() => initialGrid(view));
  const [baseline, setBaseline] = useState<Grid>(grid);
  const [error, setError] = useState<ActionError | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = !sameGrid(grid, baseline);
  const balanced = allBalanced(view.lines, grid);
  const problems = new Set(
    (error?.issues ?? []).flatMap((issue) => (issue.productCode ? [issue.productCode] : [])),
  );

  const edit = (productCode: string, locationCode: string, value: string) =>
    setGrid((current) => ({
      ...current,
      [productCode]: { ...current[productCode], [locationCode]: value },
    }));

  const run = (
    work: () => Promise<{ ok: boolean; error?: ActionError }>,
    success: string,
    onDone?: () => void,
  ) =>
    startTransition(async () => {
      setError(null);
      const result = await work();
      if (result.ok) {
        toast.success(success);
        onDone?.();
      } else if (result.error) {
        setError(result.error);
      }
      setConfirming(false);
    });

  const useProposal = () =>
    run(async () => {
      const result = await loadRedistributionProposal(orderId);
      if (result.ok) setGrid(gridFromAllocations(result.data.lines));
      return result;
    }, t("proposalLoaded"));
  const saveDraft = () =>
    run(
      () => saveRedistributionDraft(orderId, toPlan(view.lines, grid)),
      t("draftSaved"),
      () => setBaseline(grid),
    );
  const confirm = () =>
    run(() => confirmRedistribution(orderId, toPlan(view.lines, grid)), t("confirmed"));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("intro")}</p>
      <RedistributionTable
        lines={view.lines}
        locations={view.locations}
        grid={grid}
        onChange={edit}
        problemProducts={problems}
      />

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error.issues.length > 0 && <p className="mb-1 font-medium">{t("problems")}</p>}
          {describe(error)}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {dirty ? t("unsaved") : view.draft.length > 0 ? t("hasDraft") : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={useProposal}
            disabled={pending}
            title={t("useProposalHint")}
          >
            <Wand2 className="size-4" />
            {t("useProposal")}
          </Button>
          <Button variant="outline" onClick={saveDraft} disabled={pending || !dirty}>
            <Save className="size-4" />
            {t("saveDraft")}
          </Button>
          <Button onClick={() => setConfirming(true)} disabled={pending || !balanced}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {t("confirm")}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("confirmTitle")}
        description={t("confirmBody")}
        confirmLabel={t("confirm")}
        pending={pending}
        onConfirm={confirm}
      />
    </div>
  );
}
