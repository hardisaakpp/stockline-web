import { describe, expect, it } from "vitest";
import type { AuthSession } from "./schemas";
import { ACCESS_COOKIE, REFRESH_COOKIE, sessionCookies } from "./session-cookies";

const now = Date.parse("2026-10-01T12:00:00Z");

const session = (overrides: Partial<AuthSession> = {}): AuthSession => ({
  accessToken: "access",
  accessTokenExpiresAt: "2026-10-01T12:15:00Z",
  refreshToken: "refresh",
  refreshTokenExpiresAt: "2026-10-08T12:00:00Z",
  user: {
    id: "1",
    email: "a@b.co",
    displayName: "A",
    role: "Buyer",
    isAdmin: false,
    isActive: true,
    provider: "Local",
    permissions: [],
    createdAt: "2026-10-01T00:00:00Z",
  },
  ...overrides,
});

describe("sessionCookies", () => {
  it("emits HttpOnly, lax, site-wide cookies for both tokens", () => {
    const cookies = sessionCookies(session(), true, now);

    expect(cookies.map((c) => c.name).sort()).toEqual([ACCESS_COOKIE, REFRESH_COOKIE].sort());
    for (const { options } of cookies) {
      expect(options).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    }
  });

  it("expires the access cookie 30s before the token and the refresh cookie with its token", () => {
    const cookies = sessionCookies(session(), false, now);

    const access = cookies.find((c) => c.name === ACCESS_COOKIE);
    const refresh = cookies.find((c) => c.name === REFRESH_COOKIE);
    expect(access?.options.expires.toISOString()).toBe("2026-10-01T12:14:30.000Z");
    expect(refresh?.options.expires.toISOString()).toBe("2026-10-08T12:00:00.000Z");
    expect(access?.options.secure).toBe(false);
  });

  it("skips an access token that is already (almost) expired", () => {
    const cookies = sessionCookies(
      session({ accessTokenExpiresAt: "2026-10-01T12:00:10Z" }),
      true,
      now,
    );

    expect(cookies.map((c) => c.name)).toEqual([REFRESH_COOKIE]);
  });
});
