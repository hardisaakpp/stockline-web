"use client";

import { AlertCircle, Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { previewCv, saveCv } from "../actions.server";
import type { Cv } from "../schemas";
import { useCareersError, useFieldProblems } from "../use-careers-error";
import { usePdf } from "../use-pdf";
import { CvForm } from "./cv-form";

export function CvEditor({ initial, saved }: { initial: Cv; saved: boolean }) {
  const t = useTranslations("careers.cv");
  const describe = useCareersError();
  const problemsOf = useFieldProblems();
  const [cv, setCv] = useState(initial);
  const [problems, setProblems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(saved);
  const [busy, setBusy] = useState<"save" | "preview" | null>(null);
  const [, startTransition] = useTransition();
  const pdf = usePdf();

  const edit = (patch: Partial<Cv>) => setCv((current) => ({ ...current, ...patch }));

  const run = (kind: "save" | "preview") =>
    startTransition(async () => {
      setBusy(kind);
      setError(null);
      setProblems([]);
      const result = kind === "save" ? await saveCv(cv) : await previewCv(cv);
      setBusy(null);
      if (!result.ok) {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
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

      {!hasSaved && (
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

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <CvForm cv={cv} onChange={edit} />

        <Card className="xl:sticky xl:top-24">
          <CardContent>
            {pdf.url ? (
              <iframe
                title={t("previewTitle")}
                src={pdf.url}
                className="h-[75vh] w-full rounded-lg border"
              />
            ) : (
              <p className="px-6 py-16 text-center text-sm text-muted-foreground">
                {t("previewEmpty")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
