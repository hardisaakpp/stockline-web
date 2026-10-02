import "server-only";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { AuthSession } from "./schemas";
import { ACCESS_COOKIE, REFRESH_COOKIE, sessionCookies } from "./session-cookies";

export async function readTokens(): Promise<{ accessToken?: string; refreshToken?: string }> {
  const store = await cookies();
  return {
    accessToken: store.get(ACCESS_COOKIE)?.value,
    refreshToken: store.get(REFRESH_COOKIE)?.value,
  };
}

/** Only callable from a Server Action or Route Handler (Server Components cannot set cookies). */
export async function writeSession(session: AuthSession): Promise<void> {
  const store = await cookies();
  for (const { name, value, options } of sessionCookies(session, env.secureCookies)) {
    store.set(name, value, options);
  }
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}
