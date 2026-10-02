import { z } from "zod";
import { ApiError } from "@/lib/api/problem";
import { importIssueSchema, importResultSchema, importValidationSchema } from "../schemas";

/** Browser-side calls for the import wizard. They go through the BFF, which attaches the session token. */
export type ImportFailure = {
  kind: "duplicate" | "invalid" | "failed";
  message: string;
  issues: z.infer<typeof importIssueSchema>[];
};

const issuesSchema = z.array(importIssueSchema);

function formData(file: File): FormData {
  const body = new FormData();
  body.set("file", file);
  return body;
}

async function post(path: string, file: File, checkErp: boolean): Promise<Response> {
  const query = checkErp ? "?validateErp=true" : "";
  try {
    return await fetch(`/api/bff/orders/${path}${query}`, { method: "POST", body: formData(file) });
  } catch {
    throw new ApiError(503, "unreachable");
  }
}

export async function validateTemplate(file: File, checkErp: boolean) {
  const response = await post("import/validate", file, checkErp);
  if (!response.ok) throw await ApiError.fromResponse(response);
  return importValidationSchema.parse(await response.json());
}

export async function importTemplate(file: File, checkErp: boolean) {
  const response = await post("import", file, checkErp);
  if (!response.ok) throw await ApiError.fromResponse(response);
  return importResultSchema.parse(await response.json());
}

/** Classifies an import error so the wizard can show the right message and the file's findings. */
export function toImportFailure(error: unknown): ImportFailure {
  if (!(error instanceof ApiError)) return { kind: "failed", message: "", issues: [] };
  const issues = issuesSchema.safeParse(error.extensions.issues);
  const list = issues.success ? issues.data : [];
  if (error.status === 409) return { kind: "duplicate", message: error.message, issues: list };
  if (error.status === 422 || error.status === 400 || error.status === 413) {
    return { kind: "invalid", message: error.message, issues: list };
  }
  return { kind: "failed", message: error.message, issues: list };
}
