"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapseButton } from "@/components/ui/collapse-button";
import { savePreferences } from "../actions.server";
import type { Preferences } from "../schemas";
import { useCareersError } from "../use-careers-error";
import { ChipInput } from "./chip-input";
import { ExperiencePicker } from "./experience-picker";

const NONE: Preferences = {
  excludeTitles: [],
  excludeText: [],
  locations: [],
  requiredTechnologies: [],
  maxYears: null,
};

const SUGGESTED = {
  excludeTitles: ["senior", "lead", "manager", "principal", "sales", "recruiter"],
  excludeText: ["security clearance", "US citizens only", "unpaid"],
  locations: ["worldwide", "latam", "ecuador", "usa", "remote"],
  requiredTechnologies: [".net", "c#", "react", "typescript", "python", "sql"],
};

/** How many of the five filters are doing something. */
export function activeCount(p: Preferences): number {
  return (
    [p.excludeTitles, p.excludeText, p.locations, p.requiredTechnologies].filter(
      (l) => l.length > 0,
    ).length + (p.maxYears === null ? 0 : 1)
  );
}

/** The hard rules: an offer that breaks any of them never appears in the list. */
export function PreferencesPanel({ initial }: { initial: Preferences }) {
  const t = useTranslations("careers.offers.rules");
  const describe = useCareersError();
  const panel = useId();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  // With filters already in place the panel starts folded: the list is what the person came for.
  const [collapsed, setCollapsed] = useState(activeCount(initial) > 0);
  const [pending, startTransition] = useTransition();
  const active = activeCount(value);
  const dirty = JSON.stringify(value) !== JSON.stringify(saved);
  const set = (patch: Partial<Preferences>) => setValue({ ...value, ...patch });

  const save = (next: Preferences) =>
    startTransition(async () => {
      const result = await savePreferences(next);
      if (result.ok) {
        setSaved(next);
        toast.success(t("saved"));
      } else toast.error(describe(result.error));
    });
  const clear = () => {
    setValue(NONE);
    save(NONE);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CollapseButton
          expanded={!collapsed}
          controls={panel}
          label={t(collapsed ? "expand" : "collapse")}
          onClick={() => setCollapsed(!collapsed)}
        >
          <CardTitle>{t("title")}</CardTitle>
          <Badge variant={active > 0 ? "secondary" : "outline"}>
            {t("active", { count: active })}
          </Badge>
        </CollapseButton>
        {active > 0 && (
          <Button variant="ghost" size="sm" onClick={clear} disabled={pending}>
            {t("clear")}
          </Button>
        )}
      </CardHeader>
      <CardContent id={panel} hidden={collapsed} className="space-y-6">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <ExperiencePicker value={value.maxYears} onChange={(maxYears) => set({ maxYears })} />
        <div className="grid gap-6 md:grid-cols-2">
          <ChipInput
            id="rule-locations"
            label={t("locations")}
            hint={t("locationsHint")}
            placeholder={t("locationsPlaceholder")}
            suggestions={SUGGESTED.locations}
            value={value.locations}
            onChange={(locations) => set({ locations })}
          />
          <ChipInput
            id="rule-required"
            label={t("requiredTechnologies")}
            hint={t("requiredTechnologiesHint")}
            placeholder={t("requiredPlaceholder")}
            suggestions={SUGGESTED.requiredTechnologies}
            value={value.requiredTechnologies}
            onChange={(requiredTechnologies) => set({ requiredTechnologies })}
          />
          <ChipInput
            id="rule-titles"
            label={t("excludeTitles")}
            hint={t("excludeTitlesHint")}
            placeholder={t("excludeTitlesPlaceholder")}
            suggestions={SUGGESTED.excludeTitles}
            value={value.excludeTitles}
            onChange={(excludeTitles) => set({ excludeTitles })}
          />
          <ChipInput
            id="rule-text"
            label={t("excludeText")}
            hint={t("excludeTextHint")}
            placeholder={t("excludeTextPlaceholder")}
            suggestions={SUGGESTED.excludeText}
            value={value.excludeText}
            onChange={(excludeText) => set({ excludeText })}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => save(value)} disabled={pending || !dirty}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {t("save")}
          </Button>
          {dirty && <span className="text-xs text-muted-foreground">{t("unsaved")}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
