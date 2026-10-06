"use client";

import { AlertCircle, Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { PdfPreviewDialog } from "@/components/feedback/pdf-preview-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { previewCv, saveCv } from "../actions.server";
import type { Cv, ImportResult } from "../schemas";
import { useCareersError, useFieldProblems } from "../use-careers-error";
import { usePdf } from "../use-pdf";
import { CvForm } from "./cv-form";
import { CvImport } from "./cv-import";
import { CvImportNotice } from "./cv-import-notice";

export function CvEditor({ initial, saved }: { initial: Cv; saved: boolean }) {
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

  const edit = (patch: Partial<Cv>) => setCv((current) => ({ ...current, ...patch }));

  const onImported = (result: ImportResult) => {
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
    startTransition(async () => {
      const result = kind === "save" ? await saveCv(cv) : await previewCv(cv);
      setBusy(null);
      if (!result.ok) {
        setPreviewOpen(false);
        setError(describe(result.error));
        setProblems(result.error.fieldErrors ? problemsOf(result.error.fieldErrors) : []);
        return;
      }
      if (kind === "save") {
        setHasSaved(true);
        toast.success(t("saved"));
      } else {
        pdf.show(result.data as string);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <CvImport onImported={onImported} />
            <Button variant="outline" onClick={() => run("preview")} disabled={busy !== null}>
              {busy === "preview" && <Loader2 className="size-4 animate-spin" />}
              {busy === "preview" ? t("previewing") : t("preview")}
            </Button>
            <Button onClick={() => run("save")} disabled={busy !== null}>
              {busy === "save" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {busy === "save" ? t("saving") : t("save")}
            </Button>
          </>
        }
      />

      {imported && <CvImportNotice result={imported} />}
      {!hasSaved && !imported && (
        <Alert>
          <AlertDescription>{t("notSaved")}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {error}
            {problems.length > 0 && (
              <>
                {" "}
                {t("problems")}
                <ul className="mt-1 list-disc pl-5">
                  {problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

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
