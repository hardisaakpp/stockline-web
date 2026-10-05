"use client";

import { FileUp, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { importCv } from "../actions.server";
import { IMPORT_EXTENSIONS, MAX_IMPORT_BYTES, type ImportResult } from "../schemas";
import { useCareersError } from "../use-careers-error";

/** Why a file cannot be sent, or null when it is fine. Mirrors what api-careers accepts. */
export function checkImportFile(file: {
  name: string;
  size: number;
}): "onlyKnown" | "tooLarge" | null {
  const name = file.name.toLowerCase();
  if (!IMPORT_EXTENSIONS.some((extension) => name.endsWith(extension))) return "onlyKnown";
  return file.size > MAX_IMPORT_BYTES ? "tooLarge" : null;
}

/** Reads an existing CV (PDF, Word, or the LinkedIn data ZIP) into a draft for the form. Nothing is saved here. */
export function CvImport({ onImported }: { onImported: (result: ImportResult) => void }) {
  const t = useTranslations("careers.cv.import");
  const describe = useCareersError();
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const choose = (candidate: File | undefined) => {
    if (!candidate) return;
    const problem = checkImportFile(candidate);
    setError(problem ? t(problem) : null);
    setFile(problem ? null : candidate);
  };

  const run = () => {
    if (!file) return;
    startTransition(async () => {
      const body = new FormData();
      body.set("file", file);
      const result = await importCv(body);
      if (!result.ok) {
        setError(describe(result.error));
        return;
      }
      setOpen(false);
      setFile(null);
      setError(null);
      onImported(result.data);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
      <DialogTrigger render={<Button variant="outline" />}>
        <FileUp className="size-4" />
        {t("button")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {file ? (
            <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={busy}
                aria-label={t("remove")}
                onClick={() => setFile(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <label
              htmlFor={inputId}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors focus-within:ring-3 focus-within:ring-ring/50 hover:bg-muted/50"
            >
              <input
                ref={input}
                id={inputId}
                type="file"
                accept={IMPORT_EXTENSIONS.join(",")}
                className="sr-only"
                onChange={(event) => {
                  choose(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <FileUp className="size-5 text-muted-foreground" />
              <span className="font-medium">{t("choose")}</span>
              <span className="text-sm text-muted-foreground">{t("drop")}</span>
            </label>
          )}

          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <details className="rounded-lg border p-3 text-sm">
            <summary className="cursor-pointer font-medium">{t("linkedinTitle")}</summary>
            <p className="mt-2 text-muted-foreground">{t("linkedinBody")}</p>
          </details>
          <p className="text-xs text-muted-foreground">{t("replaces")}</p>
          {busy && <p className="text-xs text-muted-foreground">{t("slow")}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            {t("cancel")}
          </Button>
          <Button onClick={run} disabled={!file || busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? t("running") : t("run")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
