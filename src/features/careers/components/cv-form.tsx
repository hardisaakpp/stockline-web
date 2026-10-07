"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapseButton } from "@/components/ui/collapse-button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SwitchField } from "@/components/ui/form-controls";
import type { Cv, HiddenKey } from "../schemas";
import { useFolding } from "../use-folding";
import { ContactSection, ExperienceSection } from "./cv-sections";
import {
  CertificationsSection,
  EducationSection,
  LanguagesSection,
  ProjectsSection,
  ReferencesSection,
  SkillsSection,
} from "./cv-sections-more";

const SECTION_IDS = [
  "main",
  "contact",
  "education",
  "experience",
  "research",
  "projects",
  "skills",
  "certifications",
  "languages",
  "references",
] as const;
type SectionId = (typeof SECTION_IDS)[number];

type SectionProps = {
  id: SectionId;
  title: string;
  children: ReactNode;
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** When given, the section gets a switch deciding whether it appears in the PDF. */
  toggle?: { id: HiddenKey; shown: boolean; onChange: (shown: boolean) => void };
};

function Section({ id, title, children, collapsed, onToggleCollapse, toggle }: SectionProps) {
  const t = useTranslations("careers.cv");
  const off = toggle !== undefined && !toggle.shown;
  const panel = `section-${id}`;
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CollapseButton
          expanded={!collapsed}
          controls={panel}
          label={t(collapsed ? "expand" : "collapse", { title })}
          onClick={onToggleCollapse}
        >
          <CardTitle>{title}</CardTitle>
        </CollapseButton>
        {toggle && (
          <SwitchField
            id={`show-${toggle.id}`}
            label={t("includeSection")}
            checked={toggle.shown}
            onCheckedChange={toggle.onChange}
          />
        )}
      </CardHeader>
      {/* Hidden, not unmounted: what was typed in a collapsed section is still there when it opens. */}
      <CardContent id={panel} hidden={collapsed} className="space-y-4">
        {off && <p className="text-xs text-muted-foreground">{t("hiddenNote")}</p>}
        <div className={off ? "space-y-4 opacity-60" : "space-y-4"}>{children}</div>
      </CardContent>
    </Card>
  );
}

/** Every section of the CV, each editing its own slice. */
export function CvForm({ cv, onChange: edit }: { cv: Cv; onChange: (patch: Partial<Cv>) => void }) {
  const t = useTranslations("careers.cv");
  const { fold, collapseAll, expandAll } = useFolding(SECTION_IDS);
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
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={collapseAll}>
          {t("collapseAll")}
        </Button>
        <Button variant="ghost" size="sm" onClick={expandAll}>
          {t("expandAll")}
        </Button>
      </div>
      <Section {...fold("main")} title={t("sections.main")}>
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
      <Section {...fold("contact")} title={t("sections.contact")}>
        <ContactSection
          value={cv.contact}
          onChange={(contact) => edit({ contact })}
          visibility={{ shown, setShown }}
        />
      </Section>
      <Section {...fold("education")} title={t("sections.education")} toggle={toggle("educacion")}>
        <EducationSection value={cv.education} onChange={(education) => edit({ education })} />
      </Section>
      <Section
        {...fold("experience")}
        title={t("sections.experience")}
        toggle={toggle("experiencia")}
      >
        <ExperienceSection value={cv.experience} onChange={(experience) => edit({ experience })} />
      </Section>
      <Section
        {...fold("research")}
        title={t("sections.research")}
        toggle={toggle("investigacion")}
      >
        <ExperienceSection
          kind="research"
          value={cv.research}
          onChange={(research) => edit({ research })}
        />
      </Section>
      <Section {...fold("projects")} title={t("sections.projects")} toggle={toggle("proyectos")}>
        <ProjectsSection value={cv.projects} onChange={(projects) => edit({ projects })} />
      </Section>
      <Section {...fold("skills")} title={t("sections.skills")} toggle={toggle("habilidades")}>
        <SkillsSection value={cv.skills} onChange={(skills) => edit({ skills })} />
      </Section>
      <Section
        {...fold("certifications")}
        title={t("sections.certifications")}
        toggle={toggle("certificaciones")}
      >
        <CertificationsSection
          value={cv.certifications}
          onChange={(certifications) => edit({ certifications })}
        />
      </Section>
      <Section {...fold("languages")} title={t("sections.languages")} toggle={toggle("idiomas")}>
        <LanguagesSection value={cv.languages} onChange={(languages) => edit({ languages })} />
      </Section>
      <Section
        {...fold("references")}
        title={t("sections.references")}
        toggle={toggle("referencias")}
      >
        <ReferencesSection value={cv.references} onChange={(references) => edit({ references })} />
      </Section>
    </div>
  );
}
