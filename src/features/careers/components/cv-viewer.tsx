"use client";

import { Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { PdfPreviewDialog } from "@/components/feedback/pdf-preview-dialog";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { savedCvPdf } from "../actions.server";
import type { Cv, CvLanguage } from "../schemas";
import { useCareersError } from "../use-careers-error";
import { usePdf } from "../use-pdf";
import { CvLanguageTabs } from "./cv-language-tabs";
import { CvSummary } from "./cv-summary";

/** The saved CV, read-only, next to its PDF. Editing happens in the form. */
export function CvViewer({ cv, lang = "es" }: { cv: Cv; lang?: CvLanguage }) {
  const t = useTranslations("careers.view");
  const describe = useCareersError();
  const [busy, startTransition] = useTransition();
  const pdf = usePdf();
  const [open, setOpen] = useState(false);

  const showPdf = () => {
    // Opened before the transition: inside an async transition React commits updates only when it
    // finishes, so the modal (with its spinner) would not appear while the PDF is generated.
    setOpen(true);
    startTransition(async () => {
      const result = await savedCvPdf(lang);
      if (result.ok) {
        pdf.show(result.data as string);
      } else {
        setOpen(false);
        toast.error(describe(result.error));
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
            <CvLanguageTabs lang={lang} path="/careers/cv-view" />
            <ButtonLink
              href={lang === "en" ? "/careers/cv?lang=en" : "/careers/cv"}
              variant="outline"
            >
              <Pencil className="size-4" />
              {t("edit")}
            </ButtonLink>
            <Button onClick={showPdf} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? t("loadingPdf") : t("showPdf")}
            </Button>
          </>
        }
      />
      <p className="text-xs text-muted-foreground">{t("legend")}</p>
      <CvSummary cv={cv} />

      <PdfPreviewDialog
        open={open}
        onOpenChange={setOpen}
        title={t("pdfTitle")}
        url={pdf.url}
        loading={busy}
        filename={lang === "en" ? "resume-en.pdf" : "hoja-de-vida.pdf"}
      />
    </div>
  );
}
