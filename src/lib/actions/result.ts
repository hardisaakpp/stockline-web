import { z } from "zod";
import { ApiError } from "../api/problem";
/** A rule violation reported by the API (e.g. quantities that do not add up). */
export const issueSchema = z.object({
  code: z.string(),
  message: z.string(),
  productCode: z.string().nullish(),
  locationCode: z.string().nullish(),
});
export type ValidationIssue = z.infer<typeof issueSchema>;

/** Why a mutation failed, in terms the interface can translate (`orders.errors.<code>`). */
export type ErrorCode =
  "unauthorized" | "forbidden" | "notFound" | "conflict" | "invalid" | "unavailable" | "unknown";

export type ActionError = {
  code: ErrorCode;
  /** The API's own explanation (English). Shown only when the interface has nothing better. */
  message?: string;
  /** Rule violations found by the API, e.g. quantities that do not add up. */
  issues: ValidationIssue[];
  /** The API's own stable code (e.g. `cv-missing`), when it sent one: lets a module word a specific case. */
  apiCode?: string;
  /** Per-field problems (`field` -> codes), when the API sent them. */
  fieldErrors?: Record<string, string[]>;
};

export type ActionFailure = { ok: false; error: ActionError };
export type ActionResult<T = void> = { ok: true; data: T } | ActionFailure;

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });

const issuesSchema = z.array(issueSchema);
const fieldErrorsSchema = z.record(z.string(), z.array(z.string()));

function codeForStatus(status: number): ErrorCode {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  if (status === 409) return "conflict";
  if (status === 400 || status === 422) return "invalid";
  return status === 429 || status >= 500 ? "unavailable" : "unknown";
}

/** Turns anything thrown while calling the API into a result the client can render. */
export function toActionError(error: unknown): ActionFailure {
  if (error instanceof ApiError) {
    const issues = issuesSchema.safeParse(error.extensions.issues);
    const fieldErrors = fieldErrorsSchema.safeParse(error.extensions.errors);
    const apiCode = typeof error.extensions.code === "string" ? error.extensions.code : undefined;
    return {
      ok: false,
      error: {
        code: codeForStatus(error.status),
        message: error.message,
        issues: issues.success ? issues.data : [],
        ...(apiCode && { apiCode }),
        ...(fieldErrors.success && { fieldErrors: fieldErrors.data }),
      },
    };
  }
  // Contract mismatches and unexpected exceptions are logged by the server, never shown in detail.
  return { ok: false, error: { code: "unknown", issues: [] } };
}
