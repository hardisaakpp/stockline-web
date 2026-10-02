"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { paletteFor } from "../notification-palette";
import { useTopicLabels } from "../topic-labels";

export function AudienceFilter({
  audiences,
  active,
  onChange,
}: {
  audiences: string[];
  active: string | null;
  onChange: (audience: string | null) => void;
}) {
  const t = useTranslations("admin.notifications");
  const labels = useTopicLabels();
  return (
    <div className="flex flex-wrap gap-2">
      <AudiencePill active={active === null} onClick={() => onChange(null)}>
        {t("allAudiences")}
      </AudiencePill>
      {audiences.map((a) => (
        <AudiencePill
          key={a}
          active={active === a}
          dot={paletteFor(a).dot}
          onClick={() => onChange(a)}
        >
          {labels.audience(a)}
        </AudiencePill>
      ))}
    </div>
  );
}

function AudiencePill({
  active,
  dot,
  onClick,
  children,
}: {
  active: boolean;
  dot?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted",
      )}
    >
      {dot && <span className={cn("size-1.5 shrink-0 rounded-full", dot)} />}
      {children}
    </button>
  );
}
