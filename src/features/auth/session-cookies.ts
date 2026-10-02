import type { AuthSession } from "./schemas";

export const ACCESS_COOKIE = "sl_access";
export const REFRESH_COOKIE = "sl_refresh";

/** The access cookie expires slightly before the token so a request never carries a dying token. */
const EXPIRY_SKEW_MS = 30_000;

export type CookieSpec = {
  name: string;
  value: string;
  options: {
    httpOnly: true;
    secure: boolean;
    sameSite: "lax";
    path: "/";
    expires: Date;
  };
};

/** Cookie definitions for a fresh session. Tokens are never readable from browser JavaScript. */
export function sessionCookies(
  session: AuthSession,
  secure: boolean,
  now = Date.now(),
): CookieSpec[] {
  const base = { httpOnly: true, secure, sameSite: "lax", path: "/" } as const;
  const accessExpiry = new Date(session.accessTokenExpiresAt).getTime() - EXPIRY_SKEW_MS;
  const cookies: CookieSpec[] = [
    {
      name: REFRESH_COOKIE,
      value: session.refreshToken,
      options: { ...base, expires: new Date(session.refreshTokenExpiresAt) },
    },
  ];
  if (accessExpiry > now) {
    cookies.push({
      name: ACCESS_COOKIE,
      value: session.accessToken,
      options: { ...base, expires: new Date(accessExpiry) },
    });
  }
  return cookies;
}
