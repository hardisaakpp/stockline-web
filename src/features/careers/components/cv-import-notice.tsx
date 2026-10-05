import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ImportResult } from "../schemas";

/** After an import: where the data came from and what the person should look at before saving. */
export function CvImportNotice({ result }: { result: ImportResult }) {
  const t = useTranslations("careers.cv.import");
  const lines: string[] = [];
  for (const code of result.warnings) {
    const unverified = /^no-verificado:(\d+)$/.exec(code);
    if (unverified) lines.push(t("warnings.unverified", { count: Number(unverified[1]) }));
    else if (code === "linkedin-sin-logros") lines.push(t("warnings.linkedinNoAchievements"));
  }
  if (result.cv.references.length > 0 && result.cv.hidden.includes("referencias")) {
    lines.push(t("warnings.referencesHidden"));
  }

  return (
    <Alert>
      <AlertTitle>{t("noticeTitle", { source: t(`source.${result.source}`) })}</AlertTitle>
      {lines.length > 0 && (
        <AlertDescription>
          <ul className="mt-1 list-disc pl-5">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </AlertDescription>
      )}
    </Alert>
  );
}
