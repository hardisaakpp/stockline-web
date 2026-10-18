import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionResult } from "@/lib/actions/result";
import messages from "@/messages/en";
import { parseCvLanguage, type Translation } from "../schemas";
import type { Cv } from "../schemas";
import { CvEditor } from "./cv-editor";
import { CvLanguageTabs } from "./cv-language-tabs";

const saveCv = vi.fn<(cv: Cv, lang?: string) => Promise<ActionResult<void>>>();
const previewCv = vi.fn<(cv: Cv, lang?: string) => Promise<ActionResult<string>>>();
const translateCv = vi.fn<() => Promise<ActionResult<Translation>>>();
vi.mock("../actions.server", () => ({
  saveCv: (cv: Cv, lang?: string) => saveCv(cv, lang),
  previewCv: (cv: Cv, lang?: string) => previewCv(cv, lang),
  translateCv: () => translateCv(),
  importCv: vi.fn(),
}));

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
const translated: Cv = { ...empty, fullName: "Ana", headline: "Full Stack Developer" };

const wrap = (ui: React.ReactElement) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );

beforeEach(() => {
  window.localStorage.clear();
  saveCv.mockReset();
  previewCv.mockReset();
  translateCv.mockReset();
  saveCv.mockResolvedValue({ ok: true, data: undefined });
  URL.createObjectURL = vi.fn(() => "blob:fake-pdf");
  URL.revokeObjectURL = vi.fn();
});

describe("parseCvLanguage", () => {
  it("is English only for ?lang=en; anything else is Spanish", () => {
    expect(parseCvLanguage("en")).toBe("en");
    expect(parseCvLanguage("es")).toBe("es");
    expect(parseCvLanguage("fr")).toBe("es");
    expect(parseCvLanguage(undefined)).toBe("es");
    expect(parseCvLanguage(["en"])).toBe("es");
  });
});

describe("CvLanguageTabs", () => {
  it("links to each version and marks the current one", () => {
    wrap(<CvLanguageTabs lang="en" path="/careers/cv" />);
    expect(screen.getByRole("link", { name: "Español" })).toHaveAttribute("href", "/careers/cv");
    const english = screen.getByRole("link", { name: "English" });
    expect(english).toHaveAttribute("href", "/careers/cv?lang=en");
    expect(english).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Español" })).not.toHaveAttribute("aria-current");
  });
});

describe("CvEditor in English", () => {
  it("offers to translate only on the English version", () => {
    const { unmount } = wrap(<CvEditor initial={empty} saved userId="u1" />);
    expect(
      screen.queryByRole("button", { name: /translate from spanish/i }),
    ).not.toBeInTheDocument();
    unmount();
    wrap(<CvEditor initial={empty} saved={false} userId="u1" lang="en" />);
    expect(screen.getByRole("heading", { name: "English CV" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /translate from spanish/i })).toBeInTheDocument();
    expect(screen.getByText(/have not saved the english version yet/i)).toBeInTheDocument();
  });

  it("fills the form with the translation, warns to review it and saves it as English", async () => {
    translateCv.mockResolvedValue({
      ok: true,
      data: { cv: translated, warnings: ["no-traducido:2"] },
    });
    wrap(<CvEditor initial={empty} saved={false} userId="u1" lang="en" />);

    await userEvent.click(screen.getByRole("button", { name: /translate from spanish/i }));

    await waitFor(() =>
      expect(screen.getByLabelText("Headline")).toHaveValue("Full Stack Developer"),
    );
    expect(screen.getByText(/automatically translated draft/i)).toBeInTheDocument();
    expect(screen.getByText(/2 texts were left in spanish/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() =>
      expect(saveCv).toHaveBeenCalledWith(expect.objectContaining({ fullName: "Ana" }), "en"),
    );
  });

  it("shows the error when the translation fails and leaves the form alone", async () => {
    translateCv.mockResolvedValue({
      ok: false,
      error: { code: "unavailable", issues: [], apiCode: "ai-unavailable" },
    });
    wrap(<CvEditor initial={translated} saved userId="u1" lang="en" />);

    await userEvent.click(screen.getByRole("button", { name: /translate from spanish/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/ai service is not available/i);
    expect(screen.getByLabelText("Headline")).toHaveValue("Full Stack Developer");
  });

  it("asks before replacing unsaved work, and keeps it if the person says no", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    wrap(<CvEditor initial={translated} saved userId="u1" lang="en" />);
    await userEvent.type(screen.getByLabelText("Headline"), " II");

    await userEvent.click(screen.getByRole("button", { name: /translate from spanish/i }));

    expect(confirm).toHaveBeenCalled();
    expect(translateCv).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it("renders the preview in English and names the file for it", async () => {
    previewCv.mockResolvedValue({ ok: true, data: btoa("%PDF-1.4") });
    wrap(<CvEditor initial={translated} saved userId="u1" lang="en" />);

    await userEvent.click(screen.getByRole("button", { name: /^preview$/i }));

    await waitFor(() => expect(previewCv).toHaveBeenCalledWith(translated, "en"));
    expect(await screen.findByRole("link", { name: /download/i })).toHaveAttribute(
      "download",
      "resume-en.pdf",
    );
  });

  it("keeps a separate local draft for each language", async () => {
    wrap(<CvEditor initial={translated} saved userId="u1" lang="en" />);
    await userEvent.type(screen.getByLabelText("Headline"), " II");
    await waitFor(() =>
      expect(window.localStorage.getItem("stockline.careers.cv-draft.u1.en")).not.toBeNull(),
    );
    expect(window.localStorage.getItem("stockline.careers.cv-draft.u1")).toBeNull();
  });
});
