import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/problem";
import type { ImportIssue } from "../schemas";
import { checkTemplateFile, MAX_TEMPLATE_BYTES } from "./file-dropzone";
import { toImportFailure } from "./import-client";
import { sortIssues } from "./import-issues";

describe("checkTemplateFile", () => {
  it("accepts .xlsx files up to the limit, in any letter case", () => {
    expect(checkTemplateFile({ name: "order.xlsx", size: 1000 })).toBeNull();
    expect(checkTemplateFile({ name: "ORDER.XLSX", size: MAX_TEMPLATE_BYTES })).toBeNull();
  });

  it("rejects other formats and oversized files", () => {
    expect(checkTemplateFile({ name: "order.csv", size: 10 })).toBe("onlyXlsx");
    expect(checkTemplateFile({ name: "order.xls", size: 10 })).toBe("onlyXlsx");
    expect(checkTemplateFile({ name: "order.xlsx", size: MAX_TEMPLATE_BYTES + 1 })).toBe(
      "tooLarge",
    );
  });
});

const issue = (severity: "Error" | "Warning", code: string): ImportIssue => ({
  severity,
  code,
  message: code,
  row: null,
  field: null,
  suggestions: null,
});

describe("sortIssues", () => {
  it("lists errors before warnings, keeping the original order within each group", () => {
    const sorted = sortIssues([
      issue("Warning", "w1"),
      issue("Error", "e1"),
      issue("Warning", "w2"),
      issue("Error", "e2"),
    ]);

    expect(sorted.map((i) => i.code)).toEqual(["e1", "e2", "w1", "w2"]);
  });

  it("does not mutate its input", () => {
    const input = [issue("Warning", "w"), issue("Error", "e")];

    sortIssues(input);

    expect(input.map((i) => i.code)).toEqual(["w", "e"]);
  });
});

describe("toImportFailure", () => {
  const issues = [
    {
      severity: "Error",
      code: "REQUIRED_FIELD",
      message: "x",
      row: 2,
      field: "A",
      suggestions: null,
    },
  ];

  it("classifies a duplicate order code", () => {
    expect(toImportFailure(new ApiError(409, "exists", { issues }))).toMatchObject({
      kind: "duplicate",
      issues,
    });
  });

  it.each([400, 413, 422])("treats HTTP %i as a problem with the file", (status) => {
    expect(toImportFailure(new ApiError(status, "bad", { issues })).kind).toBe("invalid");
  });

  it("treats outages and unknown errors as a failed upload", () => {
    expect(toImportFailure(new ApiError(503, "down")).kind).toBe("failed");
    expect(toImportFailure(new Error("boom"))).toEqual({ kind: "failed", message: "", issues: [] });
  });

  it("ignores malformed findings", () => {
    expect(toImportFailure(new ApiError(422, "bad", { issues: [{ nope: 1 }] })).issues).toEqual([]);
  });
});
