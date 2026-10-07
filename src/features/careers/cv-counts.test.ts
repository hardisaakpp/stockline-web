import { describe, expect, it } from "vitest";
import { sectionCounts } from "./cv-counts";
import type { Cv } from "./schemas";

const empty: Cv = {
  fullName: "",
  headline: "",
  summary: "",
  contact: { email: "", links: {}, phone: null, location: null },
  experience: [],
  research: [],
  projects: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  references: [],
  hidden: [],
};
const job = (over: Partial<Cv["experience"][number]> = {}): Cv["experience"][number] => ({
  role: "",
  organization: "",
  from: "",
  to: null,
  location: null,
  achievements: [],
  technologies: [],
  include: true,
  ...over,
});

describe("sectionCounts", () => {
  it("an empty CV has nothing in any section", () => {
    const counts = sectionCounts(empty);
    expect(Object.values(counts).every((c) => c.filled === 0)).toBe(true);
    expect(counts.main.total).toBe(3);
    expect(counts.contact.total).toBe(4);
    expect(counts.experience.total).toBeUndefined(); // list sections count entries: no total
  });

  it("counts the filled fields of the main data and the contact", () => {
    const counts = sectionCounts({
      ...empty,
      fullName: "Ana",
      summary: "APIs",
      contact: { email: "a@b.co", phone: "099", location: null, links: { GitHub: "https://x.co" } },
    });
    expect(counts.main).toEqual({ filled: 2, total: 3 });
    expect(counts.contact).toEqual({ filled: 3, total: 4 }); // email + phone + links (location is empty)
  });

  it("text with only spaces is not information", () => {
    const counts = sectionCounts({
      ...empty,
      fullName: "   ",
      contact: { email: " ", phone: "  ", location: "\n", links: {} },
    });
    expect(counts.main.filled).toBe(0);
    expect(counts.contact.filled).toBe(0);
  });

  it("counts entries, however many links one contact has", () => {
    const counts = sectionCounts({
      ...empty,
      contact: {
        ...empty.contact,
        links: { a: "https://a.co", b: "https://b.co", c: "https://c.co" },
      },
    });
    expect(counts.contact.filled).toBe(1); // «has links» is one field, not three
  });

  it("a blank entry that was only added does not count; one with any content does", () => {
    const counts = sectionCounts({
      ...empty,
      experience: [
        job(),
        job({ role: "Developer" }),
        job({ achievements: ["Cut a query"] }),
        job({ achievements: ["  "] }),
      ],
      education: [
        { title: "", institution: "", from: "", to: null, location: null, include: true },
      ],
      languages: [
        { name: "English", level: "B2", include: true },
        { name: "", level: "C1", include: true }, // a level with no language is still a blank entry
      ],
    });
    expect(counts.experience.filled).toBe(2);
    expect(counts.education.filled).toBe(0);
    expect(counts.languages.filled).toBe(1);
  });

  it("counts entries that are switched off for the PDF: they are still information", () => {
    const counts = sectionCounts({ ...empty, experience: [job({ role: "Dev", include: false })] });
    expect(counts.experience.filled).toBe(1);
  });

  it("counts every list section on its own", () => {
    const counts = sectionCounts({
      ...empty,
      research: [job({ role: "Researcher" })],
      projects: [{ name: "P", description: "", url: null, technologies: [], include: true }],
      skills: [
        { name: "", items: ["Python"] },
        { name: "Backend", items: [] },
        { name: "", items: [] },
      ],
      certifications: [{ name: "Scrum", issuer: "", year: "", include: true }],
      references: [{ name: "Luis", role: "", contact: "", include: true }],
    });
    expect(counts.research.filled).toBe(1);
    expect(counts.projects.filled).toBe(1);
    expect(counts.skills.filled).toBe(2);
    expect(counts.certifications.filled).toBe(1);
    expect(counts.references.filled).toBe(1);
  });
});
