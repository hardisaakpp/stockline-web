"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const parts = (text: string, separator: RegExp) =>
  text
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean);

function Labelled({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Comma-separated values. The raw text stays local so typing a comma or a space is never swallowed. */
export function ListInput({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const t = useTranslations("careers.cv.fields");
  const [text, setText] = useState(value.join(", "));
  return (
    <Labelled id={id} label={label} hint={hint ?? t("commaSeparated")}>
      <Input
        id={id}
        value={text}
        className="h-10"
        onChange={(e) => {
          setText(e.target.value);
          onChange(parts(e.target.value, /,/));
        }}
        onBlur={() => setText(value.join(", "))}
      />
    </Labelled>
  );
}

/** One item per line. */
export function LinesInput({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const t = useTranslations("careers.cv.fields");
  const [text, setText] = useState(value.join("\n"));
  return (
    <Labelled id={id} label={label} hint={hint ?? t("oneItemPerLine")}>
      <Textarea
        id={id}
        rows={Math.max(3, value.length + 1)}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parts(e.target.value, /\n/));
        }}
        onBlur={() => setText(value.join("\n"))}
      />
    </Labelled>
  );
}

type RepeaterProps<T> = {
  items: T[];
  onChange: (items: T[]) => void;
  blank: () => T;
  addLabel: string;
  /** Singular name used in the remove button's label. */
  itemLabel: string;
  render: (item: T, index: number, update: (patch: Partial<T>) => void) => ReactNode;
};

export function Repeater<T>({
  items,
  onChange,
  blank,
  addLabel,
  itemLabel,
  render,
}: RepeaterProps<T>) {
  const t = useTranslations("careers.cv");
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        // Index keys are safe: rows have no identity of their own and are only removed on request.
        <div key={index} className="relative space-y-4 rounded-lg border bg-muted/30 p-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            aria-label={t("remove", { item: itemLabel, number: index + 1 })}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <X className="size-4" />
          </Button>
          {render(item, index, (patch) =>
            onChange(items.map((current, i) => (i === index ? { ...current, ...patch } : current))),
          )}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => onChange([...items, blank()])}>
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </div>
  );
}
