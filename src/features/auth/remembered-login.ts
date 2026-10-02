import type { LoginProvider } from "./login-form-schema";

const KEY = "stockline.login";

export type RememberedLogin = { provider: LoginProvider; identifier: string };

/** Only who signed in and how, never the password: that is for the browser's password manager. */
export function parseRemembered(raw: string | null): RememberedLogin | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { provider, identifier } = value as Record<string, unknown>;
    if ((provider !== "local" && provider !== "directory") || typeof identifier !== "string")
      return null;
    const trimmed = identifier.trim();
    return trimmed && trimmed.length <= 254 ? { provider, identifier: trimmed } : null;
  } catch {
    return null;
  }
}

export function loadRemembered(): RememberedLogin | null {
  try {
    return parseRemembered(window.localStorage.getItem(KEY));
  } catch {
    return null; // storage can be blocked (private windows); the form works without it
  }
}

export function saveRemembered(login: RememberedLogin | null): void {
  try {
    if (login) window.localStorage.setItem(KEY, JSON.stringify(login));
    else window.localStorage.removeItem(KEY);
  } catch {
    // ignore: remembering is a convenience
  }
}
