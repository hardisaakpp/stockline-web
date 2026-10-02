import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import { ok, toActionError, type ActionResult } from "./result";

/**
 * Runs a Server Action body: validates the arguments, calls the API and converts any failure
 * into an `ActionResult`. Next.js control-flow errors (redirects such as "session ended") pass through.
 */
export async function runAction<S extends z.ZodType, T>(
  schema: S,
  args: unknown,
  operation: (input: z.infer<S>) => Promise<T>,
): Promise<ActionResult<T>> {
  const parsed = schema.safeParse(args);
  if (!parsed.success) return { ok: false, error: { code: "invalid", issues: [] } };

  try {
    return ok(await operation(parsed.data));
  } catch (error) {
    unstable_rethrow(error);
    const result = toActionError(error);
    if (result.error.code === "unknown") console.error("Order action failed", error);
    return result;
  }
}
