"use client";

import { Languages, Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ImportResult } from "../schemas";
import { CvImport } from "./cv-import";

/**
 * Import, preview and save, pinned under the app header so they stay in reach however far down the form is.
 * `status` says whether there is unsaved work. `onTranslate` is only given on the English version.
 */
export function CvActionBar({
  status,
  busy,
  onImported,
  onPreview,
  onSave,
  onTranslate,
}: {
  status: string | null;
  busy: "save" | "preview" | "translate" | null;
  onImported: (result: ImportResult) => void;
  onPreview: () => void;
  onSave: () => void;
  onTranslate?: () => void;
}) {
  const t = useTranslations("careers.cv");
  return (
    <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-background/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <p role="status" className="min-w-0 text-xs text-muted-foreground">
        {status}
      </p>
      <div className="ml-auto flex items-center gap-2">
        {onTranslate && (
          <Button variant="outline" onClick={onTranslate} disabled={busy !== null}>
            {busy === "translate" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Languages className="size-4" />
            )}
            {busy === "translate" ? t("translate.running") : t("translate.button")}
          </Button>
        )}
        <CvImport onImported={onImported} />
        <Button variant="outline" onClick={onPreview} disabled={busy !== null}>
          {busy === "preview" && <Loader2 className="size-4 animate-spin" />}
          {busy === "preview" ? t("previewing") : t("preview")}
        </Button>
        <Button onClick={onSave} disabled={busy !== null}>
          {busy === "save" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {busy === "save" ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
