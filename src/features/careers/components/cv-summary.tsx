import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Cv, CvExperience, HiddenKey } from "../schemas";

/** Read-only view of the saved CV: the same sections as the form, marking what stays out of the PDF. */
function Block({
  title,
  out,
  children,
}: {
  title: string;
  /** The section is switched off for the PDF. */
  out?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("careers.view");
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        {out && <Badge variant="secondary">{t("notInPdf")}</Badge>}
      </CardHeader>
      <CardContent className="space-y-4 text-sm">{children}</CardContent>
    </Card>
  );
}

function Entry({
  out,
  title,
  meta,
  children,
}: {
  out: boolean;
  title: string;
  meta?: string;
  children?: ReactNode;
}) {
  const t = useTranslations("careers.view");
  return (
    <div className={out ? "space-y-1 opacity-60" : "space-y-1"}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">{title}</p>
        {out && <Badge variant="outline">{t("notInPdf")}</Badge>}
      </div>
      {meta && <p className="text-muted-foreground">{meta}</p>}
      {children}
    </div>
  );
}

/** A list of entries, or the "no data" line when there are none. */
function Rows<T>({
  items,
  children,
}: {
  items: T[];
  children: (item: T, index: number) => ReactNode;
}) {
  const t = useTranslations("careers.view");
  if (items.length === 0) return <p className="text-muted-foreground">{t("none")}</p>;
  return items.map(children);
}

/** One contact line, dimmed and flagged when it is switched off for the PDF. */
function ContactLine({ text, out }: { text: string; out: boolean }) {
  const t = useTranslations("careers.view");
  return (
    <p className={out ? "opacity-60" : undefined}>
      {text}
      {out && ` (${t("notInPdf")})`}
    </p>
  );
}

const joined = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(" · ");

function Work({ items }: { items: CvExperience[] }) {
  const t = useTranslations("careers.view");
  return (
    <Rows items={items}>
      {(e, i) => (
        <Entry
          key={i}
          out={!e.include}
          title={joined(e.role, e.organization)}
          meta={joined(`${e.from} – ${e.to ?? t("current")}`, e.location)}
        >
          {e.achievements.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5">
              {e.achievements.map((a, j) => (
                <li key={j}>{a}</li>
              ))}
            </ul>
          )}
          {e.technologies.length > 0 && (
            <p className="text-muted-foreground italic">{e.technologies.join(", ")}</p>
          )}
        </Entry>
      )}
    </Rows>
  );
}

export function CvSummary({ cv }: { cv: Cv }) {
  const t = useTranslations("careers");
  const out = (key: HiddenKey) => cv.hidden.includes(key);

  return (
    <div className="space-y-6">
      <Block title={t("cv.sections.main")} out={out("resumen") && cv.summary !== ""}>
        <p className="text-base font-semibold">{cv.fullName}</p>
        {cv.headline && <p className="text-muted-foreground">{cv.headline}</p>}
        {cv.summary && <p className={out("resumen") ? "opacity-60" : undefined}>{cv.summary}</p>}
      </Block>
      <Block title={t("view.contact")}>
        <p>{cv.contact.email || t("view.none")}</p>
        {cv.contact.phone && <ContactLine text={cv.contact.phone} out={out("contacto.telefono")} />}
        {cv.contact.location && (
          <ContactLine text={cv.contact.location} out={out("contacto.ubicacion")} />
        )}
        {Object.entries(cv.contact.links).map(([label, url]) => (
          <ContactLine key={label} text={`${label}: ${url}`} out={out("contacto.enlaces")} />
        ))}
      </Block>
      <Block title={t("cv.sections.education")} out={out("educacion")}>
        <Rows items={cv.education}>
          {(d, i) => (
            <Entry
              key={i}
              out={!d.include}
              title={joined(d.title, d.institution)}
              meta={joined(`${d.from} – ${d.to ?? t("view.current")}`, d.location)}
            />
          )}
        </Rows>
      </Block>
      <Block title={t("cv.sections.experience")} out={out("experiencia")}>
        <Work items={cv.experience} />
      </Block>
      <Block title={t("cv.sections.research")} out={out("investigacion")}>
        <Work items={cv.research} />
      </Block>
      <Block title={t("cv.sections.projects")} out={out("proyectos")}>
        <Rows items={cv.projects}>
          {(p, i) => (
            <Entry key={i} out={!p.include} title={p.name} meta={p.url ?? undefined}>
              <p>{p.description}</p>
              {p.technologies.length > 0 && (
                <p className="text-muted-foreground italic">{p.technologies.join(", ")}</p>
              )}
            </Entry>
          )}
        </Rows>
      </Block>
      <Block title={t("cv.sections.skills")} out={out("habilidades")}>
        <Rows items={cv.skills}>
          {(g, i) => (
            <p key={i}>
              <span className="font-medium">{g.name}:</span> {g.items.join(", ")}
            </p>
          )}
        </Rows>
      </Block>
      <Block title={t("cv.sections.certifications")} out={out("certificaciones")}>
        <Rows items={cv.certifications}>
          {(c, i) => (
            <Entry key={i} out={!c.include} title={c.name} meta={joined(c.issuer, c.year)} />
          )}
        </Rows>
      </Block>
      <Block title={t("cv.sections.languages")} out={out("idiomas")}>
        <Rows items={cv.languages}>
          {(l, i) => <Entry key={i} out={!l.include} title={l.name} meta={l.level} />}
        </Rows>
      </Block>
      <Block title={t("cv.sections.references")} out={out("referencias")}>
        <Rows items={cv.references}>
          {(r, i) => (
            <Entry key={i} out={!r.include} title={r.name} meta={joined(r.role, r.contact)} />
          )}
        </Rows>
      </Block>
    </div>
  );
}
