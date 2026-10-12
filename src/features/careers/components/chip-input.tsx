"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Values added one at a time (Enter, comma or leaving the field) and shown as removable chips, with one-click suggestions. */
export function ChipInput({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
  suggestions = [],
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
}) {
  const t = useTranslations("careers.offers.rules");
  const [text, setText] = useState("");

  const add = (raw: string) => {
    const next = [...value];
    for (const item of raw.split(",").map((part) => part.trim())) {
      if (item && !next.some((existing) => same(existing, item))) next.push(item);
    }
    if (next.length !== value.length) onChange(next);
    setText("");
  };
  const remove = (item: string) => onChange(value.filter((existing) => existing !== item));
  const offered = suggestions.filter((s) => !value.some((existing) => same(existing, s)));

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        {value.map((item) => (
          <Badge key={item} variant="secondary" className="h-6 gap-1 pr-1">
            {item}
            <button
              type="button"
              aria-label={t("remove", { item })}
              onClick={() => remove(item)}
              className="rounded-full p-0.5 outline-none hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden />
            </button>
          </Badge>
        ))}
        <input
          id={id}
          value={text}
          placeholder={value.length === 0 ? placeholder : undefined}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => add(text)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(text);
            } else if (e.key === "Backspace" && text === "" && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          className="min-w-28 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {offered.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{t("suggestions")}</span>
          {offered.map((s) => (
            <button
              key={s}
              type="button"
              aria-label={t("addSuggestion", { item: s })}
              onClick={() => add(s)}
              className="inline-flex items-center gap-0.5 rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus aria-hidden className="size-3" />
              {s}
            </button>
          ))}
        </div>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
