import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionResult } from "@/lib/actions/result";
import messages from "@/messages/en";
import { parseDraft, readRaw, writeDraft } from "../cv-draft";
import type { Cv } from "../schemas";
import { CvEditor } from "./cv-editor";

const saveCv = vi.fn<(cv: Cv) => Promise<ActionResult<void>>>();
vi.mock("../actions.server", () => ({
  saveCv: (cv: Cv) => saveCv(cv),
  previewCv: vi.fn(),
  importCv: vi.fn(),
}));

const base: Cv = {
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

const wrap = (userId = "u1") =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CvEditor initial={base} saved userId={userId} />
    </NextIntlClientProvider>,
  );
const name = () => screen.getByLabelText("Full name");
const stored = (userId = "u1") => parseDraft(readRaw(userId));

beforeEach(() => {
  window.localStorage.clear();
  saveCv.mockReset();
  saveCv.mockResolvedValue({ ok: true, data: undefined });
});

describe("CV draft", () => {
  it("starts as everything saved, with no draft written", () => {
    wrap();
    expect(screen.getByText("Everything saved.")).toBeInTheDocument();
    expect(readRaw("u1")).toBeNull();
  });

  it("keeps what is typed as a draft once typing pauses", async () => {
    wrap();
    await userEvent.type(name(), " Pérez");

    expect(screen.getByText(/unsaved changes\. they are kept as a draft/i)).toBeInTheDocument();
    await waitFor(() => expect(stored()?.cv.fullName).toBe("Ana Pérez"), { timeout: 3000 });
  });

  it("offers the draft of an earlier visit, and restoring puts it in the form", async () => {
    writeDraft("u1", { ...base, fullName: "Ana María" });
    wrap();

    expect(await screen.findByText(/you have unsaved changes from/i)).toBeInTheDocument();
    expect(name()).toHaveValue("Ana");
    await userEvent.click(screen.getByRole("button", { name: "Restore" }));

    expect(name()).toHaveValue("Ana María");
    expect(screen.queryByText(/you have unsaved changes from/i)).not.toBeInTheDocument();
  });

  it("discarding removes the draft and leaves the saved CV", async () => {
    writeDraft("u1", { ...base, fullName: "Ana María" });
    wrap();
    await userEvent.click(await screen.findByRole("button", { name: "Discard" }));

    expect(name()).toHaveValue("Ana");
    expect(readRaw("u1")).toBeNull();
  });

  it("does not overwrite a pending draft before the person chooses", async () => {
    writeDraft("u1", { ...base, fullName: "Ana María" });
    wrap();
    await screen.findByText(/you have unsaved changes from/i);
    await userEvent.type(name(), "x");
    await act(() => new Promise((resolve) => setTimeout(resolve, 1200)));

    expect(stored()?.cv.fullName).toBe("Ana María");
    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
  });

  it("a draft equal to what is saved is not offered", () => {
    writeDraft("u1", base);
    wrap();
    expect(screen.queryByText(/you have unsaved changes from/i)).not.toBeInTheDocument();
  });

  it("never shows another person's draft", () => {
    writeDraft("u2", { ...base, fullName: "Someone else" });
    wrap("u1");
    expect(screen.queryByText(/you have unsaved changes from/i)).not.toBeInTheDocument();
  });

  it("saving clears the draft and says everything is saved", async () => {
    wrap();
    await userEvent.type(name(), "!");
    await waitFor(() => expect(stored()).not.toBeNull(), { timeout: 3000 });
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(readRaw("u1")).toBeNull());
    expect(saveCv).toHaveBeenCalledWith({ ...base, fullName: "Ana!" });
    expect(screen.getByText("Everything saved.")).toBeInTheDocument();
  });

  it("warns before the tab is closed with unsaved changes, and not otherwise", async () => {
    wrap();
    const closing = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(closing()).toBe(false);
    await userEvent.type(name(), "!");
    expect(closing()).toBe(true);
  });
});
