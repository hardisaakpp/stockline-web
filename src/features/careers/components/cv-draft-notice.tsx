"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** Offered when an earlier visit left unsaved work behind. */
export function CvDraftNotice({
  savedAt,
  onRestore,
  onDiscard,
}: {
  savedAt: number;
  onRestore: () => void;
  onDiscard: () => void;
}) {
  const t = useTranslations("careers.cv.draft");
  const format = useFormatter();
  return (
    <Alert role="status">
      <AlertTitle>
        {t("title", {
          when: format.dateTime(savedAt, { dateStyle: "medium", timeStyle: "short" }),
        })}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{t("text")}</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={onRestore}>
            {t("restore")}
          </Button>
          <Button size="sm" variant="outline" onClick={onDiscard}>
            {t("discard")}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
