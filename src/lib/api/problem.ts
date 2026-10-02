import { z } from "zod";

const problemSchema = z.looseObject({
  title: z.string().optional(),
  detail: z.string().optional(),
  status: z.number().optional(),
});

/** An error answer from api-stockline (RFC 9457 problem details) or a transport failure. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Extra problem-details members (e.g. `issues`, `validActions`). */
    readonly extensions: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const fallback = `Request failed (${response.status})`;
    try {
      const body: unknown = await response.json();
      const problem = problemSchema.safeParse(body);
      if (!problem.success) return new ApiError(response.status, fallback);
      const { title, detail, status: _status, ...extensions } = problem.data;
      return new ApiError(response.status, detail ?? title ?? fallback, extensions);
    } catch {
      return new ApiError(response.status, fallback);
    }
  }
}
