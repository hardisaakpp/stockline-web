import { z } from "zod";

export const LOGIN_PROVIDERS = ["local", "directory"] as const;
export type LoginProvider = (typeof LOGIN_PROVIDERS)[number];

const password = z.string().min(1, "passwordRequired");

/**
 * What the sign-in form submits. A local account signs in with its email; a directory account with its
 * username (or email, or user principal name), which the directory resolves, so it is not checked as an email here.
 * Validation messages are catalog keys under `auth.errors`; the form translates them.
 */
export const loginFormSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("local"),
    identifier: z.string().trim().min(1, "emailRequired").pipe(z.email("emailInvalid")),
    password,
  }),
  z.object({
    provider: z.literal("directory"),
    identifier: z.string().trim().min(1, "usernameRequired").max(256, "usernameRequired"),
    password,
  }),
]);

/** Only same-site relative paths are valid return targets (prevents open redirects). */
export function safeReturnPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
