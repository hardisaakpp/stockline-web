import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Translation } from "../schemas";

/** After a translation: it is a draft written by a model, so say what to check before saving. */
export function CvTranslationNotice({ result }: { result: Translation }) {
  const t = useTranslations("careers.cv.translate");
  const lines: string[] = [];
  for (const code of result.warnings) {
    const left = /^no-traducido:(\d+)$/.exec(code);
    if (left) lines.push(t("warnings.untranslated", { count: Number(left[1]) }));
  }
  return (
    <Alert>
      <AlertTitle>{t("noticeTitle")}</AlertTitle>
      <AlertDescription>
        <p>{t("noticeBody")}</p>
        {lines.length > 0 && (
          <ul className="mt-1 list-disc pl-5">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
