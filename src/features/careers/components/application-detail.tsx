"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/actions/result";
import { actOnApplication, applicationPdf, editLetter } from "../actions.server";
import type { ApplicationDetail } from "../schemas";
import { isFinal, nextActions, statusVariant } from "../status";
import { useCareersError } from "../use-careers-error";
import { usePdf } from "../use-pdf";

export function ApplicationDetailView({ detail }: { detail: ApplicationDetail }) {
  const t = useTranslations("careers.applications");
  const describe = useCareersError();
  const router = useRouter();
  const [letter, setLetter] = useState(detail.coverLetter);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const pdf = usePdf();
  const open = !isFinal(detail.status);
  const letterChanged = letter !== detail.coverLetter;

  /** Runs one action: shows what went wrong, or the success message, and refreshes what the server knows. */
  const run = (key: string, action: () => Promise<ActionResult<unknown>>, success?: string) =>
    startTransition(async () => {
      setBusy(key);
      const result = await action();
      setBusy(null);
      if (!result.ok) {
        toast.error(describe(result.error));
        return;
      }
      if (success) toast.success(success);
      router.refresh();
    });

  const showPdf = () =>
    startTransition(async () => {
      setBusy("pdf");
      const result = await applicationPdf(detail.id);
      setBusy(null);
      if (result.ok) pdf.show(result.data);
      else toast.error(describe(result.error));
    });

  return (
    <div className="space-y-6">
      <Link href="/careers/applications" className="text-sm text-muted-foreground hover:underline">
        ← {t("back")}
      </Link>
      <PageHeader
        title={detail.offer.title}
        description={[detail.offer.company, detail.offer.location].filter(Boolean).join(" · ")}
        actions={
          <Badge variant={statusVariant(detail.status)}>{t(`status.${detail.status}`)}</Badge>
        }
      />
      <Alert>
        <AlertDescription>{t("never")}</AlertDescription>
      </Alert>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("letter")}</CardTitle>
              <CardDescription>{t("letterHint")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                aria-label={t("letter")}
                rows={14}
                value={letter}
                disabled={!open}
                onChange={(e) => setLetter(e.target.value)}
              />
              {open && (
                <Button
                  variant="outline"
                  disabled={!letterChanged || busy !== null}
                  onClick={() =>
                    run("letter", () => editLetter(detail.id, letter), t("letterSaved"))
                  }
                >
                  {busy === "letter" && <Loader2 className="size-4 animate-spin" />}
                  {t("saveLetter")}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("next")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href={detail.offer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("openOffer")}
                <ExternalLink className="size-3.5" />
              </a>
              <div className="flex flex-wrap gap-2">
                {nextActions(detail.status).map((action) => (
                  <Button
                    key={action}
                    variant={action === "discard" ? "outline" : "default"}
                    disabled={busy !== null}
                    onClick={() =>
                      run(action, () => actOnApplication(detail.id, action), t(`done.${action}`))
                    }
                  >
                    {busy === action && <Loader2 className="size-4 animate-spin" />}
                    {t(`actions.${action}`)}
                  </Button>
                ))}
                {!open && <p className="text-sm text-muted-foreground">{t("final")}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <CvCard busy={busy === "pdf"} disabled={busy !== null} pdfUrl={pdf.url} onShow={showPdf} />
      </div>
    </div>
  );
}

function CvCard({
  busy,
  disabled,
  pdfUrl,
  onShow,
}: {
  busy: boolean;
  disabled: boolean;
  pdfUrl: string | null;
  onShow: () => void;
}) {
  const t = useTranslations("careers.applications");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cv")}</CardTitle>
        <CardDescription>{t("cvHint")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" onClick={onShow} disabled={disabled}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {pdfUrl ? t("refreshPdf") : t("showPdf")}
        </Button>
        {pdfUrl && (
          <iframe title={t("cv")} src={pdfUrl} className="h-[70vh] w-full rounded-lg border" />
        )}
      </CardContent>
    </Card>
  );
}
