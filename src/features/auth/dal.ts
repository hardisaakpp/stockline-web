import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { apiRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/problem";
import { can, type Permission } from "./permissions";
import { userSchema, type User } from "./schemas";
import { readTokens } from "./session";

/**
 * The signed-in user, or `null`. Asks the API on every request (memoized per render) so a disabled
 * account or a changed role takes effect immediately instead of when a token expires.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const { accessToken } = await readTokens();
  if (!accessToken) return null;

  try {
    return await apiRequest("/auth/me", userSchema, { accessToken });
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) return null;
    throw error;
  }
});

/** Guard for protected pages: send anonymous visitors to the login screen. */
export async function requireUser(returnTo?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login");
  }
  return user;
}

/** Guard for pages that need a specific permission. */
export async function requirePermission(permission: Permission): Promise<User> {
  const user = await requireUser();
  if (!can(user, permission)) redirect("/forbidden");
  return user;
}

/** The access token for calling the API on the user's behalf from server code. */
export async function requireAccessToken(): Promise<string> {
  const { accessToken } = await readTokens();
  if (!accessToken) redirect("/login");
  return accessToken;
}
