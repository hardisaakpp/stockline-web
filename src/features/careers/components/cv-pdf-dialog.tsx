"use client";

import { useTranslations } from "next-intl";
import { PdfPreviewDialog } from "@/components/feedback/pdf-preview-dialog";
import type { CvLanguage } from "../schemas";

/** The PDF preview of the version being edited; the file is named for its language. */
export function CvPdfDialog({
  open,
  onOpenChange,
  url,
  loading,
  lang,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  loading: boolean;
  lang: CvLanguage;
}) {
  const t = useTranslations("careers.cv");
  return (
    <PdfPreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("previewTitle")}
      url={url}
      loading={loading}
      filename={lang === "en" ? "resume-en.pdf" : "hoja-de-vida.pdf"}
    />
  );
}
