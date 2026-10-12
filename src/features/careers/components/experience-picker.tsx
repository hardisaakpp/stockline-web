"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** The limits worth offering as one click; a saved value outside them still shows, selected. */
const PRESETS = [null, 1, 3, 5] as const;

/** «How much experience may an offer ask for»: a few choices instead of a bare number. */
export function ExperiencePicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const t = useTranslations("careers.offers.rules.experience");
  const options: (number | null)[] =
    value === null || (PRESETS as readonly (number | null)[]).includes(value)
      ? [...PRESETS]
      : [...PRESETS, value].sort((a, b) => (a ?? -1) - (b ?? -1));
  const label = (years: number | null) =>
    years === null ? t("any") : years === 1 ? t("junior") : t("upTo", { years });
  const explanation =
    value === null
      ? t("hintAny")
      : value < 5
        ? t("hintSenior", { years: value })
        : t("hintMore", { years: value });

  return (
    <div className="flex flex-col gap-2">
      <span id="rule-experience-label" className="text-sm font-medium">
        {t("title")}
      </span>
      <div role="group" aria-labelledby="rule-experience-label" className="flex flex-wrap gap-2">
        {options.map((years) => (
          <button
            key={years ?? "any"}
            type="button"
            aria-pressed={value === years}
            onClick={() => onChange(years)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              value === years
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {label(years)}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{explanation}</p>
    </div>
  );
}
