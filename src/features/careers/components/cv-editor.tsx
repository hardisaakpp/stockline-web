"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { PdfPreviewDialog } from "@/components/feedback/pdf-preview-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { previewCv, saveCv } from "../actions.server";
import type { Cv, ImportResult } from "../schemas";
import { useCareersError, useFieldProblems } from "../use-careers-error";
import { useCvDraft } from "../use-cv-draft";
import { usePdf } from "../use-pdf";
import { CvActionBar } from "./cv-action-bar";
import { CvDraftNotice } from "./cv-draft-notice";
import { CvErrorAlert } from "./cv-error-alert";
import { CvForm } from "./cv-form";
import { CvImportNotice } from "./cv-import-notice";

export function CvEditor({
  initial,
  saved,
  userId,
}: {
  initial: Cv;
  saved: boolean;
  /** Whose draft is kept in this browser. */
  userId: string;
}) {
  const t = useTranslations("careers.cv");
  const describe = useCareersError();
  const problemsOf = useFieldProblems();
  const [cv, setCv] = useState(initial);
  const [problems, setProblems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(saved);
  const [imported, setImported] = useState<ImportResult | null>(null);
  // The form's list inputs keep their own text, so a replaced CV needs a fresh form, not just new props.
  const [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState<"save" | "preview" | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [, startTransition] = useTransition();
  const pdf = usePdf();
  const draft = useCvDraft({ userId, cv, initial });

  const edit = (patch: Partial<Cv>) => {
    draft.touch();
    setCv((current) => ({ ...current, ...patch }));
  };

  const restoreDraft = () => {
    const restored = draft.restore();
    if (!restored) return;
    setCv(restored);
    setFormKey((key) => key + 1);
  };

  const onImported = (result: ImportResult) => {
    draft.touch();
    setCv(result.cv);
    setImported(result);
    setFormKey((key) => key + 1);
    setError(null);
    setProblems([]);
    toast.success(t("import.done"));
  };

  const run = (kind: "save" | "preview") => {
    // Set before the transition: inside an async transition React commits every update only when it
    // finishes, so the button label and the modal (with its spinner) would not appear while waiting.
    setBusy(kind);
    setError(null);
    setProblems([]);
    if (kind === "preview") setPreviewOpen(true);
    const sent = cv;
    startTransition(async () => {
      const result = kind === "save" ? await saveCv(sent) : await previewCv(cv);
      setBusy(null);
      if (!result.ok) {
        setPreviewOpen(false);
        setError(describe(result.error));
        setProblems(result.error.fieldErrors ? problemsOf(result.error.fieldErrors) : []);
        return;
      }
      if (kind === "save") {
        setHasSaved(true);
        draft.markSaved(sent);
        toast.success(t("saved"));
      } else {
        pdf.show(result.data as string);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <CvActionBar
        status={draft.dirty ? t("draft.dirty") : hasSaved ? t("draft.clean") : null}
        busy={busy}
        onImported={onImported}
        onPreview={() => run("preview")}
        onSave={() => run("save")}
      />

      {draft.offer && (
        <CvDraftNotice
          savedAt={draft.offer.savedAt}
          onRestore={restoreDraft}
          onDiscard={draft.discard}
        />
      )}
      {imported && <CvImportNotice result={imported} />}
      {!hasSaved && !imported && (
        <Alert>
          <AlertDescription>{t("notSaved")}</AlertDescription>
        </Alert>
      )}
      {error && <CvErrorAlert message={error} problems={problems} />}
      <CvForm key={formKey} cv={cv} onChange={edit} />

      <PdfPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={t("previewTitle")}
        url={pdf.url}
        loading={busy === "preview"}
        filename="hoja-de-vida.pdf"
      />
    </div>
  );
}
