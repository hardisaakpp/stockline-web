"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { savePreferences } from "../actions.server";
import type { Preferences } from "../schemas";
import { useCareersError } from "../use-careers-error";
import { FormField } from "@/components/ui/form-field";
import { ListInput } from "./list-inputs";

/** The years typed in the limit field: empty means no limit, anything else is a whole number within what api-careers accepts. */
export function parseYears(text: string): number | null {
  if (text.trim() === "") return null;
  const years = Math.trunc(Number(text));
  return Number.isFinite(years) ? Math.min(30, Math.max(0, years)) : null;
}

/** The hard rules: an offer that breaks any of them never appears in the list. */
export function PreferencesPanel({ initial }: { initial: Preferences }) {
  const t = useTranslations("careers.offers.rules");
  const describe = useCareersError();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = await savePreferences(value);
      if (result.ok) toast.success(t("saved"));
      else toast.error(describe(result.error));
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <ListInput
            id="rule-titles"
            label={t("excludeTitles")}
            hint={t("excludeTitlesHint")}
            value={value.excludeTitles}
            onChange={(excludeTitles) => setValue({ ...value, excludeTitles })}
          />
          <ListInput
            id="rule-text"
            label={t("excludeText")}
            hint={t("excludeTextHint")}
            value={value.excludeText}
            onChange={(excludeText) => setValue({ ...value, excludeText })}
          />
          <ListInput
            id="rule-locations"
            label={t("locations")}
            hint={t("locationsHint")}
            value={value.locations}
            onChange={(locations) => setValue({ ...value, locations })}
          />
          <ListInput
            id="rule-required"
            label={t("requiredTechnologies")}
            hint={t("requiredTechnologiesHint")}
            value={value.requiredTechnologies}
            onChange={(requiredTechnologies) => setValue({ ...value, requiredTechnologies })}
          />
          <FormField
            id="rule-max-years"
            label={t("maxYears")}
            hint={t("maxYearsHint")}
            type="number"
            min={0}
            max={30}
            inputMode="numeric"
            value={value.maxYears ?? ""}
            onChange={(e) => setValue({ ...value, maxYears: parseYears(e.target.value) })}
          />
        </div>
        <Button onClick={save} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {t("save")}
        </Button>
      </CardContent>
    </Card>
  );
}
