"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Cv } from "../schemas";
import { LinesInput, ListInput, Repeater } from "./list-inputs";

type SectionProps<K extends keyof Cv> = { value: Cv[K]; onChange: (value: Cv[K]) => void };
const orNull = (text: string) => text || null;

type LinkRow = { label: string; url: string };

export function ContactSection({ value, onChange }: SectionProps<"contact">) {
  const t = useTranslations("careers.cv");
  // Rows live here because a new row has no label yet, and the stored shape (label -> url) cannot hold that.
  const [rows, setRows] = useState<LinkRow[]>(() =>
    Object.entries(value.links).map(([label, url]) => ({ label, url })),
  );
  const setLinks = (next: LinkRow[]) => {
    setRows(next);
    onChange({
      ...value,
      links: Object.fromEntries(
        next.filter((r) => r.label.trim()).map((r) => [r.label.trim(), r.url]),
      ),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          id="contact-email"
          label={t("fields.email")}
          type="email"
          autoComplete="email"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
        />
        <FormField
          id="contact-phone"
          label={t("fields.phone")}
          autoComplete="tel"
          value={value.phone ?? ""}
          onChange={(e) => onChange({ ...value, phone: orNull(e.target.value) })}
        />
        <FormField
          id="contact-location"
          label={t("fields.location")}
          value={value.location ?? ""}
          onChange={(e) => onChange({ ...value, location: orNull(e.target.value) })}
        />
      </div>
      <Repeater
        items={rows}
        onChange={setLinks}
        blank={() => ({ label: "", url: "" })}
        addLabel={t("add.link")}
        itemLabel={t("items.link")}
        render={(row, index, update) => (
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <FormField
              id={`link-label-${index}`}
              label={t("fields.linkLabel")}
              placeholder="GitHub"
              value={row.label}
              onChange={(e) => update({ label: e.target.value })}
            />
            <FormField
              id={`link-url-${index}`}
              label={t("fields.linkUrl")}
              placeholder="https://github.com/…"
              value={row.url}
              onChange={(e) => update({ url: e.target.value })}
            />
          </div>
        )}
      />
    </div>
  );
}

export function ExperienceSection({ value, onChange }: SectionProps<"experience">) {
  const t = useTranslations("careers.cv");
  return (
    <Repeater
      items={value}
      onChange={onChange}
      addLabel={t("add.experience")}
      itemLabel={t("items.experience")}
      blank={() => ({
        role: "",
        organization: "",
        from: "",
        to: null,
        achievements: [],
        technologies: [],
      })}
      render={(item, i, update) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id={`exp-role-${i}`}
              label={t("fields.role")}
              value={item.role}
              onChange={(e) => update({ role: e.target.value })}
            />
            <FormField
              id={`exp-org-${i}`}
              label={t("fields.organization")}
              value={item.organization}
              onChange={(e) => update({ organization: e.target.value })}
            />
            <FormField
              id={`exp-from-${i}`}
              label={t("fields.from")}
              hint={t("fields.fromHint")}
              value={item.from}
              onChange={(e) => update({ from: e.target.value })}
            />
            <FormField
              id={`exp-to-${i}`}
              label={t("fields.to")}
              hint={t("fields.toHint")}
              value={item.to ?? ""}
              onChange={(e) => update({ to: orNull(e.target.value) })}
            />
          </div>
          <LinesInput
            id={`exp-ach-${i}`}
            label={t("fields.achievements")}
            hint={t("fields.achievementsHint")}
            value={item.achievements}
            onChange={(achievements) => update({ achievements })}
          />
          <ListInput
            id={`exp-tech-${i}`}
            label={t("fields.technologies")}
            value={item.technologies}
            onChange={(technologies) => update({ technologies })}
          />
        </>
      )}
    />
  );
}

export function ProjectsSection({ value, onChange }: SectionProps<"projects">) {
  const t = useTranslations("careers.cv");
  return (
    <Repeater
      items={value}
      onChange={onChange}
      addLabel={t("add.project")}
      itemLabel={t("items.project")}
      blank={() => ({ name: "", description: "", url: null, technologies: [] })}
      render={(item, i, update) => (
        <>
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
      blank={() => ({ title: "", institution: "", from: "", to: null })}
      render={(item, i, update) => (
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
        </div>
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
