import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/en";
import type { ActionResult } from "@/lib/actions/result";
import type { Cv, ImportResult } from "../schemas";
import { CvEditor } from "./cv-editor";
import { CvImport, checkImportFile } from "./cv-import";
import { CvImportNotice } from "./cv-import-notice";

const importCv = vi.fn<(body: FormData) => Promise<ActionResult<ImportResult>>>();
vi.mock("../actions.server", () => ({
  importCv: (body: FormData) => importCv(body),
  saveCv: vi.fn(),
  previewCv: vi.fn(),
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
const imported = (cv: Partial<Cv> = {}, warnings: string[] = []): ImportResult => ({
  cv: { ...empty, fullName: "Ana Imported", ...cv },
  source: "pdf",
  warnings,
});

const wrap = (node: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {node}
    </NextIntlClientProvider>,
  );

const pdf = (name = "cv.pdf") => new File(["%PDF-1.4"], name, { type: "application/pdf" });

async function chooseFile(file: File) {
  await userEvent.click(screen.getByRole("button", { name: /^import$/i }));
  await userEvent.upload(screen.getByLabelText(/choose file/i, { selector: "input" }), file);
}

beforeEach(() => importCv.mockReset());

describe("checkImportFile", () => {
  it("accepts a PDF, a Word file and a ZIP, whatever the case, and nothing else", () => {
    for (const name of ["cv.pdf", "CV.DOCX", "linkedin.zip"]) {
      expect(checkImportFile({ name, size: 1000 })).toBeNull();
    }
    expect(checkImportFile({ name: "cv.exe", size: 10 })).toBe("onlyKnown");
    expect(checkImportFile({ name: "cv.doc", size: 10 })).toBe("onlyKnown");
  });

  it("refuses files over 5 MB, the same limit api-careers enforces", () => {
    expect(checkImportFile({ name: "cv.pdf", size: 5 * 1024 * 1024 })).toBeNull();
    expect(checkImportFile({ name: "cv.pdf", size: 5 * 1024 * 1024 + 1 })).toBe("tooLarge");
  });
});

describe("CvImport", () => {
  it("sends the chosen file and hands the draft over, closing the dialog", async () => {
    importCv.mockResolvedValue({ ok: true, data: imported() });
    const onImported = vi.fn();
    wrap(<CvImport onImported={onImported} />);

    await chooseFile(pdf());
    expect(screen.getByText("cv.pdf")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^import$/i }));

    await waitFor(() => expect(onImported).toHaveBeenCalledTimes(1));
    expect(onImported.mock.calls[0]![0].cv.fullName).toBe("Ana Imported");
    expect((importCv.mock.calls[0]![0].get("file") as File).name).toBe("cv.pdf");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("says why when the file is unusable, in the person's words, and keeps the dialog open", async () => {
    importCv.mockResolvedValue({
      ok: false,
      error: { code: "invalid", issues: [], apiCode: "import-sin-texto" },
    });
    const onImported = vi.fn();
    wrap(<CvImport onImported={onImported} />);

    await chooseFile(pdf("scan.pdf"));
    await userEvent.click(screen.getByRole("button", { name: /^import$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/looks like a scan/i);
    expect(onImported).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("rejects an unsupported file before sending anything", async () => {
    wrap(<CvImport onImported={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /^import$/i }));
    // `applyAccept: false`: a real person can still pick any file from the system dialog.
    await userEvent
      .setup({ applyAccept: false })
      .upload(
        screen.getByLabelText(/choose file/i, { selector: "input" }),
        new File(["x"], "virus.exe"),
      );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /only pdf, docx or the linkedin zip/i,
    );
    expect(importCv).not.toHaveBeenCalled();
  });

  it("explains how to get the LinkedIn file", async () => {
    wrap(<CvImport onImported={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /^import$/i }));
    expect(screen.getByText(/get a copy of your data/i)).toBeInTheDocument();
  });
});

describe("CvImportNotice", () => {
  it("names the source and words each warning code", () => {
    wrap(
      <CvImportNotice
        result={{
          ...imported(
            {
              references: [{ name: "Luis", role: "", contact: "", include: true }],
              hidden: ["referencias"],
            },
            ["no-verificado:3", "linkedin-sin-logros"],
          ),
          source: "linkedin",
        }}
      />,
    );
    expect(screen.getByText(/imported from linkedin/i)).toBeInTheDocument();
    expect(screen.getByText(/3 texts the reader could not find/i)).toBeInTheDocument();
    expect(screen.getByText(/does not export bulleted achievements/i)).toBeInTheDocument();
    expect(screen.getByText(/references were left out of the PDF/i)).toBeInTheDocument();
  });

  it("uses the singular for a single omitted text", () => {
    wrap(<CvImportNotice result={imported({}, ["no-verificado:1"])} />);
    expect(screen.getByText(/one text the reader could not find/i)).toBeInTheDocument();
  });
});

describe("CvEditor import", () => {
  it("replaces what the form shows, including fields that keep their own text", async () => {
    importCv.mockResolvedValue({
      ok: true,
      data: imported({
        experience: [
          {
            role: "Backend developer",
            organization: "Acme",
            from: "2022",
            to: null,
            location: null,
            achievements: ["Cut a query from 8 s to 300 ms"],
            technologies: [".NET", "SQL Server"],
            include: true,
          },
        ],
      }),
    });
    // The form already holds an entry at the same position: its inputs have their own (old) text.
    const before: Cv = {
      ...empty,
      fullName: "Old Name",
      experience: [
        {
          role: "Old role",
          organization: "Old org",
          from: "2010",
          to: null,
          location: null,
          achievements: ["Old achievement"],
          technologies: ["COBOL"],
          include: true,
        },
      ],
    };
    wrap(<CvEditor initial={before} saved userId="u1" />);
    expect(screen.getByLabelText("Achievements")).toHaveValue("Old achievement");

    await chooseFile(pdf());
    await userEvent.click(screen.getByRole("button", { name: /^import$/i }));

    await waitFor(() => expect(screen.getByLabelText("Full name")).toHaveValue("Ana Imported"));
    // List inputs seed their text once: they only show the import because the form was remounted.
    expect(screen.getByLabelText("Achievements")).toHaveValue("Cut a query from 8 s to 300 ms");
    expect(screen.getByLabelText("Technologies")).toHaveValue(".NET, SQL Server");
    expect(screen.getByText(/imported from a pdf/i)).toBeInTheDocument();
  });
});
