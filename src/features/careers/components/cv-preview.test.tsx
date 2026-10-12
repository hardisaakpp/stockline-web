import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PdfPreviewDialog } from "@/components/feedback/pdf-preview-dialog";
import type { ActionResult } from "@/lib/actions/result";
import messages from "@/messages/en";
import type { Cv } from "../schemas";
import { CvEditor } from "./cv-editor";
import { CvViewer } from "./cv-viewer";

const previewCv = vi.fn<(cv: Cv) => Promise<ActionResult<string>>>();
const savedCvPdf = vi.fn<() => Promise<ActionResult<string>>>();
vi.mock("../actions.server", () => ({
  previewCv: (cv: Cv) => previewCv(cv),
  savedCvPdf: () => savedCvPdf(),
  saveCv: vi.fn(),
  importCv: vi.fn(),
}));

const cv: Cv = {
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

const wrap = (node: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {node}
    </NextIntlClientProvider>,
  );

beforeEach(() => {
  previewCv.mockReset();
  savedCvPdf.mockReset();
  URL.createObjectURL = vi.fn(() => "blob:fake-pdf");
  URL.revokeObjectURL = vi.fn();
});

describe("PdfPreviewDialog", () => {
  it("shows a spinner while the PDF is generated and no download yet", () => {
    wrap(<PdfPreviewDialog open onOpenChange={vi.fn()} title="Preview" url={null} loading />);
    expect(screen.getByRole("status")).toHaveTextContent(/generating the pdf/i);
    expect(screen.queryByTitle("Preview")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /download/i })).not.toBeInTheDocument();
  });

  it("shows the document and a download link once it is ready", () => {
    wrap(
      <PdfPreviewDialog
        open
        onOpenChange={vi.fn()}
        title="Preview"
        url="blob:fake-pdf"
        filename="cv.pdf"
      />,
    );
    expect(screen.getByTitle("Preview")).toHaveAttribute("src", "blob:fake-pdf");
    const download = screen.getByRole("link", { name: /download/i });
    expect(download).toHaveAttribute("href", "blob:fake-pdf");
    expect(download).toHaveAttribute("download", "cv.pdf");
  });

  it("renders nothing while closed", () => {
    wrap(<PdfPreviewDialog open={false} onOpenChange={vi.fn()} title="Preview" url="blob:x" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("CvEditor preview", () => {
  it("opens the modal at once, then shows the PDF in it", async () => {
    let finish!: (r: ActionResult<string>) => void;
    previewCv.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    wrap(<CvEditor initial={cv} saved userId="u1" />);

    await userEvent.click(screen.getByRole("button", { name: /^preview$/i }));
    // Still generating: the modal is already open with a spinner.
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();

    finish({ ok: true, data: btoa("%PDF-1.4") });
    await waitFor(() =>
      expect(screen.getByTitle("PDF preview")).toHaveAttribute("src", "blob:fake-pdf"),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("closes the modal and shows the error when the PDF cannot be generated", async () => {
    previewCv.mockResolvedValue({
      ok: false,
      error: { code: "unavailable", issues: [], apiCode: "ai-unavailable" },
    });
    wrap(<CvEditor initial={cv} saved userId="u1" />);

    await userEvent.click(screen.getByRole("button", { name: /^preview$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/ai service is not available/i);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("no longer keeps a cramped preview panel next to the form", () => {
    wrap(<CvEditor initial={cv} saved userId="u1" />);
    expect(screen.queryByTitle("PDF preview")).not.toBeInTheDocument();
    expect(screen.queryByText(/press “preview”/i)).not.toBeInTheDocument();
  });
});

describe("CvViewer PDF", () => {
  it("opens the modal at once and shows the saved PDF in it", async () => {
    let finish!: (r: ActionResult<string>) => void;
    savedCvPdf.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    wrap(<CvViewer cv={cv} />);

    await userEvent.click(screen.getByRole("button", { name: /view pdf/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();

    finish({ ok: true, data: btoa("%PDF-1.4") });
    await waitFor(() =>
      expect(screen.getByTitle("PDF of the saved CV")).toHaveAttribute("src", "blob:fake-pdf"),
    );
  });

  it("closes the modal when the PDF cannot be generated", async () => {
    savedCvPdf.mockResolvedValue({
      ok: false,
      error: { code: "unavailable", issues: [], apiCode: "ai-unavailable" },
    });
    wrap(<CvViewer cv={cv} />);

    await userEvent.click(screen.getByRole("button", { name: /view pdf/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
