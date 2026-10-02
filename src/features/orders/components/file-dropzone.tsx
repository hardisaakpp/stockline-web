"use client";

import { FileSpreadsheet, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const MAX_TEMPLATE_BYTES = 10 * 1024 * 1024;

export type FileProblem = "onlyXlsx" | "tooLarge";

/** Why a file cannot be used, or null when it is fine. Mirrors the limits api-stockline enforces. */
export function checkTemplateFile(file: { name: string; size: number }): FileProblem | null {
  if (!file.name.toLowerCase().endsWith(".xlsx")) return "onlyXlsx";
  return file.size > MAX_TEMPLATE_BYTES ? "tooLarge" : null;
}

type Props = {
  file: File | null;
  disabled?: boolean;
  onSelect: (file: File | null) => void;
  /** Called with the reason when a rejected file is chosen. */
  onReject: (problem: FileProblem) => void;
};

export function FileDropzone({ file, disabled, onSelect, onReject }: Props) {
  const t = useTranslations("orders.import");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = (candidate: File | undefined) => {
    if (!candidate) return;
    const problem = checkTemplateFile(candidate);
    if (problem) onReject(problem);
    else onSelect(candidate);
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <FileSpreadsheet className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSelect(null)}
          disabled={disabled}
          aria-label={t("remove")}
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <label
      htmlFor={inputId}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        accept(event.dataTransfer.files[0]);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors focus-within:ring-3 focus-within:ring-ring/50 hover:bg-muted/50",
        dragging && "border-primary bg-primary/5",
      )}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          accept(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Upload className="size-5" />
      </span>
      <span className="space-y-1">
        <span className="block font-medium">{t("dropTitle")}</span>
        <span className="block text-sm text-muted-foreground">{t("dropHint")}</span>
      </span>
    </label>
  );
}
