import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import messages from "@/messages/en";
import type { Cv } from "../schemas";
import { CvForm } from "./cv-form";

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

function Harness({ initial }: { initial: Cv }) {
  const [cv, setCv] = useState(initial);
  return <CvForm cv={cv} onChange={(patch) => setCv((c) => ({ ...c, ...patch }))} />;
}

const renderForm = (initial: Cv = empty) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Harness initial={initial} />
    </NextIntlClientProvider>,
  );

// Role queries leave out what is hidden, so these count only the entries that are open.
const languageFields = () => screen.queryAllByRole("textbox", { name: "Language" });

describe("collapsible sections", () => {
  it("starts expanded and every section has a button saying what it will do", () => {
    renderForm();
    for (const name of [/collapse contact/i, /collapse education/i, /collapse languages/i]) {
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-expanded", "true");
    }
  });

  it("collapses a section: its fields leave the page, the others stay", async () => {
    renderForm();
    expect(screen.getByLabelText("Email")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: /collapse contact/i }));

    expect(screen.getByLabelText("Email")).not.toBeVisible(); // still mounted (it keeps its text), just hidden
    expect(screen.getByRole("button", { name: /expand contact/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByLabelText("Full name")).toBeVisible(); // another section is untouched
  });

  it("keeps what was typed in a section while it is collapsed", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText("Email"), "ana@example.com");

    await userEvent.click(screen.getByRole("button", { name: /collapse contact/i }));
    await userEvent.click(screen.getByRole("button", { name: /expand contact/i }));

    expect(screen.getByLabelText("Email")).toHaveValue("ana@example.com");
  });

  it("collapses and expands everything at once", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: /collapse all/i }));
    expect(screen.getByLabelText("Email")).not.toBeVisible();
    expect(screen.getByLabelText("Full name")).not.toBeVisible();
    expect(screen.getAllByRole("button", { name: /^expand /i }).length).toBeGreaterThanOrEqual(10);

    await userEvent.click(screen.getByRole("button", { name: /expand all/i }));
    expect(screen.getByLabelText("Email")).toBeVisible();
    expect(screen.getByLabelText("Full name")).toBeVisible();
  });
});

describe("collapsible entries", () => {
  const twoLanguages = (): Cv => ({
    ...empty,
    languages: [
      { name: "English", level: "B2", include: true },
      { name: "Spanish", level: "Native", include: true },
    ],
  });

  it("an entry shows its summary when collapsed and keeps its text", async () => {
    renderForm(twoLanguages());
    expect(languageFields()).toHaveLength(2);

    await userEvent.click(screen.getByRole("button", { name: /collapse english/i }));

    // The collapsed header still names it, and the other entry is untouched.
    expect(screen.getByRole("button", { name: /expand english/i })).toBeInTheDocument();
    expect(languageFields()).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: /expand english/i }));
    expect(languageFields()[0]).toHaveValue("English");
  });

  it("the summary follows what is typed, and an unnamed entry is called by its number", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: /add language/i }));
    expect(screen.getByRole("button", { name: /collapse language 1/i })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Language"), "French");
    expect(screen.getByRole("button", { name: /collapse french/i })).toBeInTheDocument();
  });

  it("removing an entry moves the collapsed state with the entries that follow it", async () => {
    renderForm(twoLanguages());
    await userEvent.click(screen.getByRole("button", { name: /collapse spanish/i }));

    await userEvent.click(screen.getByRole("button", { name: /remove language 1/i }));

    // «Spanish» is now entry 1 and is still collapsed; «English» is gone.
    expect(screen.getByRole("button", { name: /expand spanish/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("button", { name: /english/i })).not.toBeInTheDocument();
  });

  it("a new entry starts expanded", async () => {
    renderForm(twoLanguages());
    await userEvent.click(screen.getByRole("button", { name: /collapse english/i }));
    await userEvent.click(screen.getByRole("button", { name: /collapse spanish/i }));

    await userEvent.click(screen.getByRole("button", { name: /add language/i }));

    const fresh = screen.getByRole("button", { name: /collapse language 3/i });
    expect(fresh).toHaveAttribute("aria-expanded", "true");
    expect(languageFields()).toHaveLength(1);
  });
});
