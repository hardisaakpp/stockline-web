"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { SwitchField } from "@/components/ui/form-controls";
import { FormField } from "@/components/ui/form-field";
import type { Cv, HiddenKey } from "../schemas";
import { LinesInput, ListInput, Repeater } from "./list-inputs";

type SectionProps<K extends keyof Cv> = { value: Cv[K]; onChange: (value: Cv[K]) => void };
const orNull = (text: string) => text || null;

/** Per-entry switch: an entry that is off stays in the CV but is left out of the PDF. */
export function IncludeToggle({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (include: boolean) => void;
}) {
  const t = useTranslations("careers.cv");
  return (
    <SwitchField id={id} label={t("includeInPdf")} checked={checked} onCheckedChange={onChange} />
  );
}

type LinkRow = { label: string; url: string };

/** What the person can switch off in the contact block; `shown` says whether each is currently in the PDF. */
type ContactVisibility = {
  shown: (key: HiddenKey) => boolean;
  setShown: (key: HiddenKey, shown: boolean) => void;
};

export function ContactSection({
  value,
  onChange,
  visibility,
}: SectionProps<"contact"> & { visibility: ContactVisibility }) {
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SwitchField
          id="show-phone"
          label={t("contactShow.phone")}
          checked={visibility.shown("contacto.telefono")}
          onCheckedChange={(on) => visibility.setShown("contacto.telefono", on)}
        />
        <SwitchField
          id="show-location"
          label={t("contactShow.location")}
          checked={visibility.shown("contacto.ubicacion")}
          onCheckedChange={(on) => visibility.setShown("contacto.ubicacion", on)}
        />
        <SwitchField
          id="show-links"
          label={t("contactShow.links")}
          checked={visibility.shown("contacto.enlaces")}
          onCheckedChange={(on) => visibility.setShown("contacto.enlaces", on)}
        />
        <SwitchField
          id="show-icons"
          label={t("contactShow.icons")}
          checked={visibility.shown("contacto.iconos")}
          onCheckedChange={(on) => visibility.setShown("contacto.iconos", on)}
        />
      </div>
      <Repeater
        items={rows}
        onChange={setLinks}
        blank={() => ({ label: "", url: "" })}
        addLabel={t("add.link")}
        itemLabel={t("items.link")}
        summary={(item) => item.label || item.url}
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

/** Work and research share a shape (role, organization, dates, achievements); `kind` changes ids and labels, and only research asks for the project name. */
export function ExperienceSection({
  value,
  onChange,
  kind = "experience",
}: SectionProps<"experience"> & { kind?: "experience" | "research" }) {
  const t = useTranslations("careers.cv");
  const prefix = kind === "research" ? "res" : "exp";
  return (
    <Repeater
      items={value}
      onChange={onChange}
      addLabel={t(`add.${kind}`)}
      itemLabel={t(`items.${kind}`)}
      summary={(item) => [item.project, item.role, item.organization].filter(Boolean).join(" · ")}
      blank={() => ({
        project: null,
        role: "",
        organization: "",
        from: "",
        to: null,
        location: null,
        achievements: [],
        technologies: [],
        include: true,
      })}
      render={(item, i, update) => (
        <>
          <IncludeToggle
            id={`${prefix}-include-${i}`}
            checked={item.include}
            onChange={(include) => update({ include })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {kind === "research" && (
              <div className="sm:col-span-2">
                <FormField
                  id={`${prefix}-project-${i}`}
                  label={t("fields.researchProject")}
                  hint={t("fields.researchProjectHint")}
                  value={item.project ?? ""}
                  onChange={(e) => update({ project: orNull(e.target.value) })}
                />
              </div>
            )}
            <FormField
              id={`${prefix}-role-${i}`}
              label={t("fields.role")}
              value={item.role}
              onChange={(e) => update({ role: e.target.value })}
            />
            <FormField
              id={`${prefix}-org-${i}`}
              label={t("fields.organization")}
              value={item.organization}
              onChange={(e) => update({ organization: e.target.value })}
            />
            <FormField
              id={`${prefix}-city-${i}`}
              label={t("fields.city")}
              value={item.location ?? ""}
              onChange={(e) => update({ location: orNull(e.target.value) })}
            />
            <div className="hidden sm:block" />
            <FormField
              id={`${prefix}-from-${i}`}
              label={t("fields.from")}
              hint={t("fields.fromHint")}
              value={item.from}
              onChange={(e) => update({ from: e.target.value })}
            />
            <FormField
              id={`${prefix}-to-${i}`}
              label={t("fields.to")}
              hint={t("fields.toHint")}
              value={item.to ?? ""}
              onChange={(e) => update({ to: orNull(e.target.value) })}
            />
          </div>
          <LinesInput
            id={`${prefix}-ach-${i}`}
            label={t("fields.achievements")}
            hint={t("fields.achievementsHint")}
            value={item.achievements}
            onChange={(achievements) => update({ achievements })}
          />
          <ListInput
            id={`${prefix}-tech-${i}`}
            label={t("fields.technologies")}
            value={item.technologies}
            onChange={(technologies) => update({ technologies })}
          />
        </>
      )}
    />
  );
}
