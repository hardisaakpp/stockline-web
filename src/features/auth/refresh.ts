import { apiRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/problem";
import { authSessionSchema, type AuthSession } from "./schemas";

const inFlight = new Map<string, Promise<AuthSession | null>>();
/** Long enough to cover the parallel requests of one navigation, short enough to forget quickly. */
const SHARE_WINDOW_MS = 15_000;

async function requestRefresh(refreshToken: string): Promise<AuthSession | null> {
  try {
    return await apiRequest("/auth/refresh", authSessionSchema, {
      method: "POST",
      body: { refreshToken },
    });
  } catch (error) {
    // Only an authoritative rejection ends the session; an outage must not log the user out.
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

/**
 * Exchanges a refresh token for a new session, sharing one call between concurrent requests.
 *
 * Refresh tokens rotate and api-stockline treats reuse as theft, so two parallel page requests
 * (navigation + prefetches) presenting the same token would otherwise revoke the whole session.
 * The sharing is per server process; a multi-instance deployment needs sticky routing or a
 * short reuse grace period on the API.
 */
export function refreshSessionOnce(refreshToken: string): Promise<AuthSession | null> {
  const existing = inFlight.get(refreshToken);
  if (existing) return existing;

  const attempt = requestRefresh(refreshToken);
  inFlight.set(refreshToken, attempt);
  const forget = () => setTimeout(() => inFlight.delete(refreshToken), SHARE_WINDOW_MS);
  void attempt.then(forget, () => inFlight.delete(refreshToken));
  return attempt;
}
