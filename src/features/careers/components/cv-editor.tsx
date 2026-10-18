"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { previewCv, saveCv } from "../actions.server";
import type { Cv, CvLanguage, ImportResult } from "../schemas";
import { useCareersError, useFieldProblems } from "../use-careers-error";
import { useCvDraft } from "../use-cv-draft";
import { usePdf } from "../use-pdf";
import { useTranslateCv } from "../use-translate-cv";
import { CvActionBar } from "./cv-action-bar";
import { CvDraftNotice } from "./cv-draft-notice";
import { CvEditorHeader } from "./cv-editor-header";
import { CvPdfDialog } from "./cv-pdf-dialog";
import { CvErrorAlert } from "./cv-error-alert";
import { CvForm } from "./cv-form";
import { CvStatusNotices, type CvNotice } from "./cv-status-notices";

export function CvEditor({
  initial,
  saved,
  userId,
  lang = "es",
}: {
  initial: Cv;
  saved: boolean;
  /** Whose draft is kept in this browser. */
  userId: string;
  /** Which version is being edited: each language is its own saved document, with its own local draft. */
  lang?: CvLanguage;
}) {
  const t = useTranslations("careers.cv");
  const describe = useCareersError();
  const problemsOf = useFieldProblems();
  const [cv, setCv] = useState(initial);
  const [problems, setProblems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(saved);
  const [notice, setNotice] = useState<CvNotice>(null);
  // The form's list inputs keep their own text, so a replaced CV needs a fresh form, not just new props.
  const [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState<"save" | "preview" | "translate" | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [, startTransition] = useTransition();
  const pdf = usePdf();
  // The Spanish key stays as it was, so drafts left before the English version existed still restore.
  const draft = useCvDraft({ userId: lang === "es" ? userId : `${userId}.${lang}`, cv, initial });

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

  const clearErrors = () => {
    setError(null);
    setProblems([]);
  };

  const onImported = (result: ImportResult) => {
    draft.touch();
    setCv(result.cv);
    setNotice({ kind: "import", result });
    setFormKey((key) => key + 1);
    clearErrors();
    toast.success(t("import.done"));
  };

  const run = (kind: "save" | "preview") => {
    // Set before the transition: inside an async transition React commits every update only when it
    // finishes, so the button label and the modal (with its spinner) would not appear while waiting.
    setBusy(kind);
    clearErrors();
    if (kind === "preview") setPreviewOpen(true);
    const sent = cv;
    startTransition(async () => {
      const result = kind === "save" ? await saveCv(sent, lang) : await previewCv(cv, lang);
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

  const translate = useTranslateCv({
    dirty: draft.dirty,
    onStart: () => {
      setBusy("translate");
      clearErrors();
    },
    onDone: (result) => {
      setBusy(null);
      draft.touch();
      setCv(result.cv);
      setNotice({ kind: "translation", result });
      setFormKey((key) => key + 1);
      toast.success(t("translate.done"));
    },
    onError: (failure) => {
      setBusy(null);
      setError(describe(failure));
    },
  });

  return (
    <div className="space-y-6">
      <CvEditorHeader lang={lang} />
      <CvActionBar
        status={draft.dirty ? t("draft.dirty") : hasSaved ? t("draft.clean") : null}
        busy={busy}
        onImported={onImported}
        onPreview={() => run("preview")}
        onSave={() => run("save")}
        onTranslate={lang === "en" ? translate : undefined}
      />
      {draft.offer && (
        <CvDraftNotice
          savedAt={draft.offer.savedAt}
          onRestore={restoreDraft}
          onDiscard={draft.discard}
        />
      )}
      <CvStatusNotices lang={lang} hasSaved={hasSaved} notice={notice} />
      {error && <CvErrorAlert message={error} problems={problems} />}
      <CvForm key={formKey} cv={cv} onChange={edit} />
      <CvPdfDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        url={pdf.url}
        loading={busy === "preview"}
        lang={lang}
      />
    </div>
  );
}
