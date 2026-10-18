"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CollapseButton } from "@/components/ui/collapse-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { moveItem } from "../reorder";
import { DragHandle } from "./drag-handle";
import { EmphasisTextarea } from "./emphasis-textarea";
import { useRowDrag } from "./use-row-drag";

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
      <EmphasisTextarea
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
  /** Lets the person drag entries (or use ↑ ↓ on the handle) to put them in any order. */
  reorderable?: boolean;
};

/** Each entry keeps the same key for its whole life, so its inputs and collapsed state follow it when it moves. */
type Keys = { list: number[]; next: number };

/** The keys always match the items: when the list is replaced from outside, they are cut or extended at the end. */
function syncKeys(keys: Keys, count: number): Keys {
  if (keys.list.length === count) return keys;
  const list = keys.list.slice(0, count);
  let next = keys.next;
  while (list.length < count) list.push(next++);
  return { list, next };
}

export function Repeater<T>({
  items,
  onChange,
  blank,
  addLabel,
  itemLabel,
  summary,
  render,
  reorderable = false,
}: RepeaterProps<T>) {
  const t = useTranslations("careers.cv");
  const base = useId();
  const [stored, setStored] = useState<Keys>(() => ({
    list: items.map((_, i) => i),
    next: items.length,
  }));
  const keys = syncKeys(stored, items.length);
  if (keys !== stored) setStored(keys);
  // Collapsed entries by key. The body stays mounted (just hidden), so what was typed is not lost.
  const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(new Set());

  const toggle = (key: number) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const add = () => {
    onChange([...items, blank()]);
    setStored({ list: [...keys.list, keys.next], next: keys.next + 1 });
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    setStored({ ...keys, list: keys.list.filter((_, i) => i !== index) });
  };

  const move = (from: number, to: number) => {
    if (from === to) return;
    onChange(moveItem(items, from, to));
    setStored({ ...keys, list: moveItem(keys.list, from, to) });
  };

  const rows = useRowDrag(items.length, move);

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const key = keys.list[index] ?? index;
        const open = !collapsed.has(key);
        const panel = `${base}-${key}`;
        const title = summary(item).trim() || `${itemLabel} ${index + 1}`;
        const bar = rows.bar(index);
        return (
          <div
            key={key}
            data-reorder-card
            onDragOver={reorderable ? (event) => rows.over(event, index) : undefined}
            onDrop={reorderable ? rows.drop : undefined}
            className={cn(
              "relative space-y-4 rounded-lg border bg-muted/30 p-4",
              rows.dragging === index && "opacity-50",
            )}
          >
            {bar && (
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-x-0 h-0.5 rounded bg-primary",
                  bar === "after" ? "-bottom-2.5" : "-top-2.5",
                )}
              />
            )}
            <div className="flex items-center justify-between gap-2">
              {reorderable && (
                <DragHandle
                  label={t("reorder", { title, number: index + 1, total: items.length })}
                  hint={t("reorderHint")}
                  onKeyDown={(event) => rows.keyboard(event, index)}
                  onStart={() => rows.start(index)}
                  onEnd={rows.end}
                />
              )}
              <CollapseButton
                expanded={open}
                controls={panel}
                label={t(open ? "collapse" : "expand", { title })}
                onClick={() => toggle(key)}
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
      <Button type="button" variant="outline" onClick={add}>
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </div>
  );
}
