"use client";

import { Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { savedCvPdf } from "../actions.server";
import type { Cv } from "../schemas";
import { useCareersError } from "../use-careers-error";
import { usePdf } from "../use-pdf";
import { CvSummary } from "./cv-summary";

/** The saved CV, read-only, next to its PDF. Editing happens in the form. */
export function CvViewer({ cv }: { cv: Cv }) {
  const t = useTranslations("careers.view");
  const describe = useCareersError();
  const [busy, startTransition] = useTransition();
  const pdf = usePdf();

  const showPdf = () =>
    startTransition(async () => {
      const result = await savedCvPdf();
      if (result.ok) pdf.show(result.data as string);
      else toast.error(describe(result.error));
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <ButtonLink href="/careers/cv" variant="outline">
              <Pencil className="size-4" />
              {t("edit")}
            </ButtonLink>
            <Button onClick={showPdf} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? t("loadingPdf") : pdf.url ? t("refreshPdf") : t("showPdf")}
            </Button>
          </>
        }
      />
      <p className="text-xs text-muted-foreground">{t("legend")}</p>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <CvSummary cv={cv} />
        <Card className="xl:sticky xl:top-24">
          <CardContent>
            {pdf.url ? (
              <iframe
                title={t("pdfTitle")}
                src={pdf.url}
                className="h-[75vh] w-full rounded-lg border"
              />
            ) : (
              <p className="px-6 py-16 text-center text-sm text-muted-foreground">
                {t("pdfEmpty")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
