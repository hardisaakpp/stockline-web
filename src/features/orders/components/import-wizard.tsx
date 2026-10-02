"use client";

import { ArrowRight, CheckCircle2, Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileDropzone } from "./file-dropzone";
import type { ImportFailure } from "./import-client";
import { ImportIssuesTable, ValidationSummary } from "./import-issues";
import { useImportFlow } from "./use-import-flow";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button-link";

export function ImportWizard() {
  const t = useTranslations("orders.import");
  const flow = useImportFlow();
  const { phase, checked, file, busy } = flow;

  if (phase.name === "imported")
    return <ImportSuccess orderId={phase.orderId} onAnother={() => flow.select(null)} />;

  return (
    <div className="space-y-6">
      <FileDropzone file={file} disabled={busy} onSelect={flow.select} onReject={flow.setProblem} />
      {flow.problem && (
        <p role="alert" className="text-sm text-destructive">
          {t(flow.problem)}
        </p>
      )}
      {flow.failure && <FailureMessage failure={flow.failure} />}

      {file && <CheckBar flow={flow} />}

      {checked && <ValidationSummary result={checked} />}
      <ImportIssuesTable issues={flow.findings} />

      {checked?.errors === 0 && (
        <div className="flex justify-end">
          <Button size="lg" onClick={flow.runImport} disabled={busy}>
            {phase.name === "importing" && <Loader2 className="size-4 animate-spin" />}
            {phase.name === "importing" ? t("importing") : t("import")}
          </Button>
        </div>
      )}
      {checked && checked.errors > 0 && (
        <p className="text-sm text-muted-foreground">{t("fixAndRetry")}</p>
      )}

      <ButtonAnchor variant="link" className="px-0" href="/samples/order-template.xlsx" download>
        <Download className="size-4" />
        {t("downloadSample")}
      </ButtonAnchor>
    </div>
  );
}

function ImportSuccess({ orderId, onAnother }: { orderId: string; onAnother: () => void }) {
  const t = useTranslations("orders.import");

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border bg-card px-6 py-14 text-center">
      <CheckCircle2 className="size-10 text-emerald-600" />
      <p className="text-lg font-semibold">{t("imported")}</p>
      <div className="flex gap-2">
        <ButtonLink href={`/orders/${orderId}`}>
          {t("viewOrder")}
          <ArrowRight className="size-4" />
        </ButtonLink>
        <Button variant="outline" onClick={onAnother}>
          {t("importAnother")}
        </Button>
      </div>
    </div>
  );
}

const FAILURE_TEXT = {
  duplicate: "duplicate",
  invalid: "fixAndRetry",
  failed: "uploadFailed",
} as const;

function FailureMessage({ failure }: { failure: ImportFailure }) {
  const t = useTranslations("orders.import");
  const detail = failure.kind === "invalid" && failure.message ? ` (${failure.message})` : "";

  return (
    <p role="alert" className="text-sm text-destructive">
      {t(FAILURE_TEXT[failure.kind])}
      {detail}
    </p>
  );
}

function CheckBar({ flow }: { flow: ReturnType<typeof useImportFlow> }) {
  const t = useTranslations("orders.import");
  const validating = flow.phase.name === "validating";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <Switch
          id="check-erp"
          checked={flow.checkErp}
          onCheckedChange={flow.setCheckErp}
          disabled={flow.busy}
        />
        <div className="space-y-0.5">
          <Label htmlFor="check-erp">{t("checkErp")}</Label>
          <p className="text-xs text-muted-foreground">{t("checkErpHint")}</p>
        </div>
      </div>
      <Button onClick={flow.check} disabled={flow.busy}>
        {validating && <Loader2 className="size-4 animate-spin" />}
        {validating ? t("validating") : t("validate")}
      </Button>
    </div>
  );
}
