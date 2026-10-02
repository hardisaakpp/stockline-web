import type { LoginProvider } from "./login-form-schema";

/** Catalog keys under `auth.errors` for a failed sign-in. */
export type LoginError =
  | "invalidCredentials"
  | "tooManyAttempts"
  | "unreachable"
  | "notAuthorized"
  | "emailConflict"
  | "directoryUnavailable";

/** Tells the person what actually went wrong, without revealing whether an account exists. */
export function loginErrorFor(status: number, provider: LoginProvider): LoginError {
  if (status === 429) return "tooManyAttempts";
  if (provider === "directory") {
    if (status === 403) return "notAuthorized";
    if (status === 409) return "emailConflict";
    if (status === 503) return "directoryUnavailable";
  }
  return status < 500 ? "invalidCredentials" : "unreachable";
}
