"use client";

import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions/result";
import { useErrorMessage } from "@/lib/actions/use-error-message";

type Props = {
  value: number | null;
  /** Accessible name, e.g. "Confirmed quantity for SKU-1001". */
  label: string;
  /** Saves the new value. `null` means the field was cleared (only when `allowEmpty`). */
  onCommit: (value: number | null) => Promise<ActionResult<unknown>>;
  allowEmpty?: boolean;
  className?: string;
};

/** Parses what the user typed: a non-negative number, null for an empty field, or "invalid". */
export function parseInput(text: string, allowEmpty: boolean): number | null | "invalid" {
  const trimmed = text.trim();
  if (trimmed === "") return allowEmpty ? null : "invalid";
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : "invalid";
}

/**
 * A number that saves itself: edit, then press Enter or leave the field. Escape reverts.
 * The parent re-keys it with the saved value, so it always shows what the server holds.
 */
export function InlineNumberInput({
  value,
  label,
  onCommit,
  allowEmpty = false,
  className,
}: Props) {
  const t = useTranslations("orders.lines");
  const describe = useErrorMessage();
  const initial = value === null ? "" : String(value);
  const [text, setText] = useState(initial);
  const [invalid, setInvalid] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const parsed = parseInput(text, allowEmpty);
    if (parsed === "invalid") {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (parsed === value) return;

    startTransition(async () => {
      const result = await onCommit(parsed);
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } else {
        toast.error(describe(result.error));
        setText(initial);
      }
    });
  };

  return (
    <div className="relative inline-flex items-center">
      <Input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={text}
        disabled={pending}
        aria-label={label}
        aria-invalid={invalid || undefined}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setText(initial);
            setInvalid(false);
          }
        }}
        className={cn(
          "h-8 w-24 [appearance:textfield] pr-7 text-right tabular-nums [&::-webkit-inner-spin-button]:appearance-none",
          className,
        )}
      />
      <span
        className="pointer-events-none absolute right-2 flex size-4 items-center justify-center"
        aria-live="polite"
      >
        {pending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
        {saved && (
          <>
            <Check className="size-3.5 text-emerald-600" />
            <span className="sr-only">{t("saved")}</span>
          </>
        )}
      </span>
    </div>
  );
}
