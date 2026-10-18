import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "@/messages/en";
import type { Cv } from "../schemas";
import { CvSummary } from "./cv-summary";

const cv: Cv = {
  fullName: "Ana Example",
  headline: "Backend engineer",
  summary: "APIs in .NET.",
  contact: {
    email: "ana@example.com",
    links: { GitHub: "https://github.com/ana" },
    phone: "099",
    location: null,
  },
  experience: [
    {
      role: "Developer",
      organization: "Acme",
      from: "2022-03",
      to: null,
      location: "Quito",
      achievements: ["Cut a query from 8 s to 300 ms"],
      technologies: [".NET"],
      include: true,
      project: null,
    },
    {
      role: "Intern",
      organization: "OldCo",
      from: "2020",
      to: "2021",
      location: null,
      achievements: [],
      technologies: [],
      include: false,
      project: null,
    },
  ],
  research: [],
  projects: [],
  education: [],
  skills: [{ name: "Languages", items: ["C#", "TypeScript"] }],
  certifications: [{ name: "Scrum", issuer: "Certiprof", year: "2024", include: true }],
  languages: [],
  references: [],
  hidden: ["contacto.telefono", "habilidades"],
};

const renderSummary = (over: Partial<Cv> = {}) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CvSummary cv={{ ...cv, ...over }} />
    </NextIntlClientProvider>,
  );

describe("CvSummary", () => {
  it("shows what is saved, including open-ended dates and cities", () => {
    renderSummary();
    expect(screen.getByText("Ana Example")).toBeInTheDocument();
    expect(screen.getByText("Developer · Acme")).toBeInTheDocument();
    expect(screen.getByText("2022-03 – present · Quito")).toBeInTheDocument();
    expect(screen.getByText("Cut a query from 8 s to 300 ms")).toBeInTheDocument();
    expect(screen.getByText("Scrum")).toBeInTheDocument();
  });

  it("flags what stays out of the PDF: entries, sections and contact details", () => {
    renderSummary();
    // the entry that is switched off
    const intern = screen.getByText("Intern · OldCo").parentElement!;
    expect(within(intern).getByText("Not in the PDF")).toBeInTheDocument();
    // the phone
    expect(screen.getByText("099 (Not in the PDF)")).toBeInTheDocument();
    // the whole skills section: its header badge
    const skills = screen.getByText("Skills").closest("[data-slot='card']") as HTMLElement;
    expect(within(skills).getByText("Not in the PDF")).toBeInTheDocument();
    // included things carry no flag
    const certs = screen.getByText("Certifications").closest("[data-slot='card']") as HTMLElement;
    expect(within(certs).queryByText("Not in the PDF")).not.toBeInTheDocument();
  });

  it("leads a research entry with its project name", () => {
    renderSummary({
      research: [
        {
          role: "Researcher",
          organization: "EPN",
          from: "2025-10",
          to: null,
          location: null,
          achievements: [],
          technologies: [],
          include: true,
          project: "Smart Lab",
        },
      ],
    });
    expect(screen.getByText("Smart Lab · Researcher · EPN")).toBeInTheDocument();
  });

  it("says so when a section has no data", () => {
    renderSummary();
    const research = screen.getByText("Research").closest("[data-slot='card']") as HTMLElement;
    expect(within(research).getByText("No data")).toBeInTheDocument();
  });
});
