"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SwitchField } from "@/components/ui/form-controls";
import type { Cv, HiddenKey } from "../schemas";
import { ContactSection, ExperienceSection } from "./cv-sections";
import {
  CertificationsSection,
  EducationSection,
  LanguagesSection,
  ProjectsSection,
  ReferencesSection,
  SkillsSection,
} from "./cv-sections-more";

type SectionProps = {
  title: string;
  children: ReactNode;
  /** When given, the section gets a switch deciding whether it appears in the PDF. */
  toggle?: { id: HiddenKey; shown: boolean; onChange: (shown: boolean) => void };
};

function Section({ title, children, toggle }: SectionProps) {
  const t = useTranslations("careers.cv");
  const off = toggle !== undefined && !toggle.shown;
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        {toggle && (
          <SwitchField
            id={`show-${toggle.id}`}
            label={t("includeSection")}
            checked={toggle.shown}
            onCheckedChange={toggle.onChange}
          />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {off && <p className="text-xs text-muted-foreground">{t("hiddenNote")}</p>}
        <div className={off ? "space-y-4 opacity-60" : "space-y-4"}>{children}</div>
      </CardContent>
    </Card>
  );
}

/** Every section of the CV, each editing its own slice. */
export function CvForm({ cv, onChange: edit }: { cv: Cv; onChange: (patch: Partial<Cv>) => void }) {
  const t = useTranslations("careers.cv");
  const shown = (key: HiddenKey) => !cv.hidden.includes(key);
  const setShown = (key: HiddenKey, on: boolean) =>
    edit({ hidden: on ? cv.hidden.filter((k) => k !== key) : [...new Set([...cv.hidden, key])] });
  const toggle = (id: HiddenKey) => ({
    id,
    shown: shown(id),
    onChange: (on: boolean) => setShown(id, on),
  });
  return (
    <div className="space-y-6">
      <Section title={t("sections.main")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="cv-fullName"
            label={t("fields.fullName")}
            autoComplete="name"
            value={cv.fullName}
            onChange={(e) => edit({ fullName: e.target.value })}
          />
          <FormField
            id="cv-headline"
            label={t("fields.headline")}
            hint={t("fields.headlineHint")}
            value={cv.headline}
            onChange={(e) => edit({ headline: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="cv-summary">{t("fields.summary")}</Label>
            <SwitchField
              id="show-resumen"
              label={t("includeInPdf")}
              checked={shown("resumen")}
              onCheckedChange={(on) => setShown("resumen", on)}
            />
          </div>
          <Textarea
            id="cv-summary"
            rows={4}
            value={cv.summary}
            onChange={(e) => edit({ summary: e.target.value })}
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("includeHint")}</p>
      </Section>
      <Section title={t("sections.contact")}>
        <ContactSection
          value={cv.contact}
          onChange={(contact) => edit({ contact })}
          visibility={{ shown, setShown }}
        />
      </Section>
      <Section title={t("sections.education")} toggle={toggle("educacion")}>
        <EducationSection value={cv.education} onChange={(education) => edit({ education })} />
      </Section>
      <Section title={t("sections.experience")} toggle={toggle("experiencia")}>
        <ExperienceSection value={cv.experience} onChange={(experience) => edit({ experience })} />
      </Section>
      <Section title={t("sections.research")} toggle={toggle("investigacion")}>
        <ExperienceSection
          kind="research"
          value={cv.research}
          onChange={(research) => edit({ research })}
        />
      </Section>
      <Section title={t("sections.projects")} toggle={toggle("proyectos")}>
        <ProjectsSection value={cv.projects} onChange={(projects) => edit({ projects })} />
      </Section>
      <Section title={t("sections.skills")} toggle={toggle("habilidades")}>
        <SkillsSection value={cv.skills} onChange={(skills) => edit({ skills })} />
      </Section>
      <Section title={t("sections.certifications")} toggle={toggle("certificaciones")}>
        <CertificationsSection
          value={cv.certifications}
          onChange={(certifications) => edit({ certifications })}
        />
      </Section>
      <Section title={t("sections.languages")} toggle={toggle("idiomas")}>
        <LanguagesSection value={cv.languages} onChange={(languages) => edit({ languages })} />
      </Section>
      <Section title={t("sections.references")} toggle={toggle("referencias")}>
        <ReferencesSection value={cv.references} onChange={(references) => edit({ references })} />
      </Section>
    </div>
  );
}
