"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Cv } from "../schemas";
import {
  ContactSection,
  EducationSection,
  ExperienceSection,
  ProjectsSection,
  SkillsSection,
} from "./cv-sections";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

/** Every section of the CV, each editing its own slice. */
export function CvForm({ cv, onChange: edit }: { cv: Cv; onChange: (patch: Partial<Cv>) => void }) {
  const t = useTranslations("careers.cv");
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
          <Label htmlFor="cv-summary">{t("fields.summary")}</Label>
          <Textarea
            id="cv-summary"
            rows={4}
            value={cv.summary}
            onChange={(e) => edit({ summary: e.target.value })}
          />
        </div>
      </Section>
      <Section title={t("sections.contact")}>
        <ContactSection value={cv.contact} onChange={(contact) => edit({ contact })} />
      </Section>
      <Section title={t("sections.experience")}>
        <ExperienceSection value={cv.experience} onChange={(experience) => edit({ experience })} />
      </Section>
      <Section title={t("sections.projects")}>
        <ProjectsSection value={cv.projects} onChange={(projects) => edit({ projects })} />
      </Section>
      <Section title={t("sections.education")}>
        <EducationSection value={cv.education} onChange={(education) => edit({ education })} />
      </Section>
      <Section title={t("sections.skills")}>
        <SkillsSection value={cv.skills} onChange={(skills) => edit({ skills })} />
      </Section>
    </div>
  );
}
