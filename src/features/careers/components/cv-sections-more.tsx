"use client";

import { useTranslations } from "next-intl";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Cv } from "../schemas";
import { IncludeToggle } from "./cv-sections";
import { ListInput, Repeater } from "./list-inputs";

type SectionProps<K extends keyof Cv> = { value: Cv[K]; onChange: (value: Cv[K]) => void };
const orNull = (text: string) => text || null;

export function ProjectsSection({ value, onChange }: SectionProps<"projects">) {
  const t = useTranslations("careers.cv");
  return (
    <Repeater
      items={value}
      onChange={onChange}
      addLabel={t("add.project")}
      itemLabel={t("items.project")}
      blank={() => ({ name: "", description: "", url: null, technologies: [], include: true })}
      render={(item, i, update) => (
        <>
          <IncludeToggle
            id={`prj-include-${i}`}
            checked={item.include}
            onChange={(include) => update({ include })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id={`prj-name-${i}`}
              label={t("fields.projectName")}
              value={item.name}
              onChange={(e) => update({ name: e.target.value })}
            />
            <FormField
              id={`prj-url-${i}`}
              label={t("fields.projectUrl")}
              value={item.url ?? ""}
              onChange={(e) => update({ url: orNull(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`prj-desc-${i}`}>{t("fields.description")}</Label>
            <Textarea
              id={`prj-desc-${i}`}
              rows={2}
              value={item.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>
          <ListInput
            id={`prj-tech-${i}`}
            label={t("fields.technologies")}
            value={item.technologies}
            onChange={(technologies) => update({ technologies })}
          />
        </>
      )}
    />
  );
}

export function EducationSection({ value, onChange }: SectionProps<"education">) {
  const t = useTranslations("careers.cv");
  return (
    <Repeater
      items={value}
      onChange={onChange}
      addLabel={t("add.education")}
      itemLabel={t("items.education")}
      blank={() => ({
        title: "",
        institution: "",
        from: "",
        to: null,
        location: null,
        include: true,
      })}
      render={(item, i, update) => (
        <>
          <IncludeToggle
            id={`edu-include-${i}`}
            checked={item.include}
            onChange={(include) => update({ include })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id={`edu-title-${i}`}
              label={t("fields.degree")}
              value={item.title}
              onChange={(e) => update({ title: e.target.value })}
            />
            <FormField
              id={`edu-inst-${i}`}
              label={t("fields.institution")}
              value={item.institution}
              onChange={(e) => update({ institution: e.target.value })}
            />
            <FormField
              id={`edu-from-${i}`}
              label={t("fields.from")}
              value={item.from}
              onChange={(e) => update({ from: e.target.value })}
            />
            <FormField
              id={`edu-to-${i}`}
              label={t("fields.to")}
              value={item.to ?? ""}
              onChange={(e) => update({ to: orNull(e.target.value) })}
            />
            <FormField
              id={`edu-city-${i}`}
              label={t("fields.city")}
              value={item.location ?? ""}
              onChange={(e) => update({ location: orNull(e.target.value) })}
            />
          </div>
        </>
      )}
    />
  );
}

export function SkillsSection({ value, onChange }: SectionProps<"skills">) {
  const t = useTranslations("careers.cv");
  return (
    <Repeater
      items={value}
      onChange={onChange}
      addLabel={t("add.skills")}
      itemLabel={t("items.skills")}
      blank={() => ({ name: "", items: [] })}
      render={(item, i, update) => (
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <FormField
            id={`skill-name-${i}`}
            label={t("fields.skillGroup")}
            value={item.name}
            onChange={(e) => update({ name: e.target.value })}
          />
          <ListInput
            id={`skill-items-${i}`}
            label={t("fields.skillItems")}
            value={item.items}
            onChange={(items) => update({ items })}
          />
        </div>
      )}
    />
  );
}

export function CertificationsSection({ value, onChange }: SectionProps<"certifications">) {
  const t = useTranslations("careers.cv");
  return (
    <Repeater
      items={value}
      onChange={onChange}
      addLabel={t("add.certification")}
      itemLabel={t("items.certification")}
      blank={() => ({ name: "", issuer: "", year: "", include: true })}
      render={(item, i, update) => (
        <>
          <IncludeToggle
            id={`cert-include-${i}`}
            checked={item.include}
            onChange={(include) => update({ include })}
          />
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr_6rem]">
            <FormField
              id={`cert-name-${i}`}
              label={t("fields.certName")}
              value={item.name}
              onChange={(e) => update({ name: e.target.value })}
            />
            <FormField
              id={`cert-issuer-${i}`}
              label={t("fields.issuer")}
              value={item.issuer}
              onChange={(e) => update({ issuer: e.target.value })}
            />
            <FormField
              id={`cert-year-${i}`}
              label={t("fields.year")}
              value={item.year}
              onChange={(e) => update({ year: e.target.value })}
            />
          </div>
        </>
      )}
    />
  );
}

export function LanguagesSection({ value, onChange }: SectionProps<"languages">) {
  const t = useTranslations("careers.cv");
  return (
    <Repeater
      items={value}
      onChange={onChange}
      addLabel={t("add.language")}
      itemLabel={t("items.language")}
      blank={() => ({ name: "", level: "", include: true })}
      render={(item, i, update) => (
        <>
          <IncludeToggle
            id={`lang-include-${i}`}
            checked={item.include}
            onChange={(include) => update({ include })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id={`lang-name-${i}`}
              label={t("fields.language")}
              value={item.name}
              onChange={(e) => update({ name: e.target.value })}
            />
            <FormField
              id={`lang-level-${i}`}
              label={t("fields.level")}
              hint={t("fields.levelHint")}
              value={item.level}
              onChange={(e) => update({ level: e.target.value })}
            />
          </div>
        </>
      )}
    />
  );
}

export function ReferencesSection({ value, onChange }: SectionProps<"references">) {
  const t = useTranslations("careers.cv");
  return (
    <Repeater
      items={value}
      onChange={onChange}
      addLabel={t("add.reference")}
      itemLabel={t("items.reference")}
      blank={() => ({ name: "", role: "", contact: "", include: true })}
      render={(item, i, update) => (
        <>
          <IncludeToggle
            id={`ref-include-${i}`}
            checked={item.include}
            onChange={(include) => update({ include })}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              id={`ref-name-${i}`}
              label={t("fields.refName")}
              value={item.name}
              onChange={(e) => update({ name: e.target.value })}
            />
            <FormField
              id={`ref-role-${i}`}
              label={t("fields.refRole")}
              value={item.role}
              onChange={(e) => update({ role: e.target.value })}
            />
            <FormField
              id={`ref-contact-${i}`}
              label={t("fields.refContact")}
              value={item.contact}
              onChange={(e) => update({ contact: e.target.value })}
            />
          </div>
        </>
      )}
    />
  );
}
