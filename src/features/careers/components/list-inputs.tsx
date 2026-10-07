"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CollapseButton } from "@/components/ui/collapse-button";
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
  /** One line that stands for an entry while it is collapsed (e.g. «Developer · Acme»). */
  summary: (item: T) => string;
  render: (item: T, index: number, update: (patch: Partial<T>) => void) => ReactNode;
};

export function Repeater<T>({
  items,
  onChange,
  blank,
  addLabel,
  itemLabel,
  summary,
  render,
}: RepeaterProps<T>) {
  const t = useTranslations("careers.cv");
  const base = useId();
  // Collapsed entries by position. The body stays mounted (just hidden), so what was typed is not lost.
  const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(new Set());

  const toggle = (index: number) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(index)) next.add(index);
      return next;
    });

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    // Entries after the removed one move up a position: their collapsed state follows them.
    setCollapsed((current) => {
      const shifted = [...current].filter((i) => i !== index).map((i) => (i > index ? i - 1 : i));
      return new Set(shifted);
    });
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const open = !collapsed.has(index);
        const panel = `${base}-${index}`;
        const title = summary(item).trim() || `${itemLabel} ${index + 1}`;
        return (
          // Index keys are safe: rows have no identity of their own and are only removed on request.
          <div key={index} className="space-y-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-2">
              <CollapseButton
                expanded={open}
                controls={panel}
                label={t(open ? "collapse" : "expand", { title })}
                onClick={() => toggle(index)}
                className="flex-1"
              >
                <span className="truncate text-sm font-medium">{title}</span>
              </CollapseButton>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("remove", { item: itemLabel, number: index + 1 })}
                onClick={() => remove(index)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div id={panel} hidden={!open} className="space-y-4">
              {render(item, index, (patch) =>
                onChange(
                  items.map((current, i) => (i === index ? { ...current, ...patch } : current)),
                ),
              )}
            </div>
          </div>
        );
      })}
      <Button type="button" variant="outline" onClick={() => onChange([...items, blank()])}>
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </div>
  );
}
