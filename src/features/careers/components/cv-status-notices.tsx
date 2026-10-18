import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CvLanguage, ImportResult, Translation } from "../schemas";
import { CvImportNotice } from "./cv-import-notice";
import { CvTranslationNotice } from "./cv-translation-notice";

/** Where the form's content came from when it was not typed: a file that was read, or a translation. */
export type CvNotice =
  { kind: "import"; result: ImportResult } | { kind: "translation"; result: Translation } | null;

/** What the person should know about the form right now: where a draft came from, or that nothing is saved yet. */
export function CvStatusNotices({
  lang,
  hasSaved,
  notice,
}: {
  lang: CvLanguage;
  hasSaved: boolean;
  notice: CvNotice;
}) {
  const t = useTranslations("careers.cv");
  if (notice?.kind === "import") return <CvImportNotice result={notice.result} />;
  if (notice?.kind === "translation") return <CvTranslationNotice result={notice.result} />;
  if (hasSaved) return null;
  return (
    <Alert>
      <AlertDescription>{lang === "en" ? t("english.notSaved") : t("notSaved")}</AlertDescription>
    </Alert>
  );
}
