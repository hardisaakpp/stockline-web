import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/en";
import type { Cv } from "../schemas";
import { CvForm } from "./cv-form";

const empty: Cv = {
  fullName: "Ana",
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

const seen = vi.fn<(cv: Cv) => void>();
const latest = (): Cv => seen.mock.lastCall![0];

function Harness({ initial }: { initial: Cv }) {
  const [cv, setCv] = useState(initial);
  useEffect(() => seen(cv), [cv]);
  return <CvForm cv={cv} onChange={(patch) => setCv((c) => ({ ...c, ...patch }))} />;
}

const renderForm = (initial: Cv = empty) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Harness initial={initial} />
    </NextIntlClientProvider>,
  );

describe("CvForm PDF switches", () => {
  beforeEach(() => seen.mockReset());

  it("shows everything by default", () => {
    renderForm();
    for (const sw of screen.getAllByRole("switch")) expect(sw).toBeChecked();
  });

  it("switching a section off hides it from the PDF and switching it on again restores it", async () => {
    renderForm();
    expect(screen.getAllByRole("switch", { name: /show this section/i })).toHaveLength(8);

    await userEvent.click(document.getElementById("show-investigacion")!);
    expect(latest().hidden).toEqual(["investigacion"]);

    await userEvent.click(document.getElementById("show-investigacion")!);
    expect(latest().hidden).toEqual([]);
  });

  it("switches contact details and the summary independently", async () => {
    renderForm();
    await userEvent.click(document.getElementById("show-phone")!);
    await userEvent.click(document.getElementById("show-resumen")!);
    expect(latest().hidden.sort()).toEqual(["contacto.telefono", "resumen"]);
  });

  it("new entries start included, and an entry can be left out without being deleted", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: /add language/i }));
    expect(latest().languages).toEqual([{ name: "", level: "", include: true }]);

    await userEvent.click(document.getElementById("lang-include-0")!);
    expect(latest().languages).toHaveLength(1);
    expect(latest().languages[0]!.include).toBe(false);
  });

  it("can add the new sections: certifications and research", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: /add certification/i }));
    await userEvent.click(screen.getByRole("button", { name: /add research/i }));
    expect(latest().certifications).toHaveLength(1);
    expect(latest().research[0]).toMatchObject({ include: true, location: null });
  });
});
