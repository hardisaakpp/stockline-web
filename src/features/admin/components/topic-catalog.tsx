"use client";

import { Eye, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { paletteFor } from "../notification-palette";
import type { EmailTopic } from "../schemas";
import { useTopicLabels } from "../topic-labels";

export function TopicCatalog({
  topics,
  selected,
  onSelect,
  onDragStart,
  onDragEnd,
  onPreview,
}: {
  topics: EmailTopic[];
  selected: string | null;
  onSelect: (topic: string) => void;
  onDragStart: (topic: string, event: React.DragEvent) => void;
  onDragEnd: () => void;
  onPreview: (topic: EmailTopic) => void;
}) {
  const t = useTranslations("admin.notifications");
  const labels = useTopicLabels();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const byAudience = new Map<string, EmailTopic[]>();
    for (const topic of topics) {
      const text = `${labels.title(topic)} ${labels.audience(topic.audience)}`.toLowerCase();
      if (needle && !text.includes(needle)) continue;
      byAudience.set(topic.audience, [...(byAudience.get(topic.audience) ?? []), topic]);
    }
    return [...byAudience.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `labels` is rebuilt every render but only depends on the locale
  }, [topics, query]);
  const shown = groups.reduce((total, [, list]) => total + list.length, 0);

  return (
    <aside className="w-full shrink-0 overflow-hidden rounded-lg border bg-card shadow-sm lg:sticky lg:top-4 lg:w-80">
      <div className="space-y-3 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">{t("catalogTitle")}</h2>
          <span className="text-xs whitespace-nowrap text-muted-foreground">
            {t("catalogCount", { shown, total: topics.length })}
          </span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("catalogSearch")}
            aria-label={t("catalogSearch")}
            className="h-9 pl-9"
          />
        </div>
      </div>

      <div className="max-h-[28rem] space-y-3 overflow-y-auto p-3">
        {groups.map(([audience, list]) => (
          <div key={audience}>
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <span className={cn("size-1.5 shrink-0 rounded-full", paletteFor(audience).dot)} />
              {labels.audience(audience)}
            </p>
            <ul className="space-y-1">
              {list.map((topic) => (
                <li key={topic.topic} className="flex items-stretch gap-1">
                  <button
                    type="button"
                    draggable
                    aria-pressed={selected === topic.topic}
                    title={labels.description(topic)}
                    onDragStart={(event) => onDragStart(topic.topic, event)}
                    onDragEnd={onDragEnd}
                    onClick={() => onSelect(topic.topic)}
                    className={cn(
                      "flex-1 cursor-grab truncate rounded-lg border px-3 py-2 text-left text-xs transition-colors active:cursor-grabbing",
                      selected === topic.topic
                        ? paletteFor(audience).selected
                        : paletteFor(audience).subtle,
                    )}
                  >
                    {labels.title(topic)}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreview(topic)}
                    aria-label={t("previewTopic", { topic: labels.title(topic) })}
                    className="rounded-lg border px-2 text-muted-foreground hover:bg-muted"
                  >
                    <Eye className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {topics.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">{t("noTopics")}</p>
        )}
        {topics.length > 0 && groups.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">{t("catalogNoMatch")}</p>
        )}
      </div>
    </aside>
  );
}
