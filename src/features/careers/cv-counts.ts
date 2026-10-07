import type { Cv } from "./schemas";

export const SECTION_IDS = [
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
export type SectionId = (typeof SECTION_IDS)[number];

/**
 * How much information a section holds. A list section counts its entries; a fixed-field section (the main data,
 * the contact) counts its filled fields out of `total`. `total` is only set for the latter.
 */
export type SectionCount = { filled: number; total?: number };

const has = (text: string | null | undefined) => (text ?? "").trim() !== "";
const anyOf = (...texts: (string | null | undefined)[]) => texts.some(has);
/** Entries added but left blank carry no information, so they do not count. */
const entries = <T>(items: T[], isFilled: (item: T) => boolean) => items.filter(isFilled).length;

/** What each section of the CV holds right now: the number the form shows next to its title. */
export function sectionCounts(cv: Cv): Record<SectionId, SectionCount> {
  const main = [cv.fullName, cv.headline, cv.summary].filter(has).length;
  const contact =
    [cv.contact.email, cv.contact.phone, cv.contact.location].filter(has).length +
    (Object.keys(cv.contact.links).length > 0 ? 1 : 0);
  const work = (item: Cv["experience"][number]) =>
    anyOf(item.role, item.organization) || item.achievements.some(has);

  return {
    main: { filled: main, total: 3 },
    contact: { filled: contact, total: 4 },
    education: { filled: entries(cv.education, (e) => anyOf(e.title, e.institution)) },
    experience: { filled: entries(cv.experience, work) },
    research: { filled: entries(cv.research, work) },
    projects: { filled: entries(cv.projects, (p) => anyOf(p.name, p.description)) },
    skills: { filled: entries(cv.skills, (g) => has(g.name) || g.items.some(has)) },
    certifications: { filled: entries(cv.certifications, (c) => has(c.name)) },
    languages: { filled: entries(cv.languages, (l) => has(l.name)) },
    references: { filled: entries(cv.references, (r) => has(r.name)) },
  };
}
