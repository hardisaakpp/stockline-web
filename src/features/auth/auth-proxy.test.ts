// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/problem";

// A plain function, not vi.fn(): a spy chains a handler onto every promise it returns, so a rejection
// it hands back would be reported as unhandled even though the code under test catches it.
let refreshImpl: (token: string) => Promise<AuthSession | null> = () => Promise.resolve(null);
const refreshCalls: string[] = [];
vi.mock("./refresh", () => ({
  refreshSessionOnce: (token: string) => {
    refreshCalls.push(token);
    return refreshImpl(token);
  },
}));

import { authProxy, decideStep } from "./auth-proxy";
import type { AuthSession } from "./schemas";

const newSession: AuthSession = {
  accessToken: "new-access",
  accessTokenExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  refreshToken: "new-refresh",
  refreshTokenExpiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
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
};

function request(path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  return new NextRequest(`http://localhost:3000${path}`, { headers: cookie ? { cookie } : {} });
}

describe("decideStep", () => {
  it.each([
    [{ isPublic: false, hasRefresh: false, hasAccess: false }, "sign-in"],
    [{ isPublic: true, hasRefresh: false, hasAccess: false }, "continue"],
    [{ isPublic: false, hasRefresh: true, hasAccess: true }, "continue"],
    [{ isPublic: true, hasRefresh: true, hasAccess: true }, "go-home"],
    [{ isPublic: false, hasRefresh: true, hasAccess: false }, "renew"],
    [{ isPublic: true, hasRefresh: true, hasAccess: false }, "renew"],
    // An access token without a refresh token cannot be renewed: treat as signed out.
    [{ isPublic: false, hasRefresh: false, hasAccess: true }, "sign-in"],
  ] as const)("%j → %s", (input, expected) => {
    expect(decideStep(input)).toBe(expected);
  });
});

describe("authProxy", () => {
  beforeEach(() => {
    refreshCalls.length = 0;
    refreshImpl = () => Promise.resolve(null);
  });

  it("redirects an anonymous visitor to the login screen, remembering the destination", async () => {
    const response = await authProxy(request("/orders?status=Draft"));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/orders?status=Draft");
  });

  it("does not remember the root path as a destination", async () => {
    const response = await authProxy(request("/"));

    expect(new URL(response.headers.get("location")!).searchParams.has("next")).toBe(false);
  });

  it("answers 401 JSON to anonymous API calls instead of redirecting", async () => {
    const response = await authProxy(request("/api/bff/orders"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ title: "Not signed in." });
  });

  it("lets a signed-in visitor through and bounces them off the login page", async () => {
    const cookies = { sl_access: "a", sl_refresh: "r" };

    expect((await authProxy(request("/orders", cookies))).headers.get("location")).toBeNull();
    const login = await authProxy(request("/login", cookies));
    expect(new URL(login.headers.get("location")!).pathname).toBe("/dashboard");
    expect(refreshCalls).toEqual([]);
  });

  it("renews an expired access token and sets fresh cookies on the response", async () => {
    refreshImpl = () => Promise.resolve(newSession);

    const response = await authProxy(request("/orders", { sl_refresh: "old" }));

    expect(refreshCalls).toEqual(["old"]);
    expect(response.cookies.get("sl_access")?.value).toBe("new-access");
    expect(response.cookies.get("sl_refresh")?.value).toBe("new-refresh");
    expect(response.cookies.get("sl_access")).toMatchObject({ httpOnly: true, sameSite: "lax" });
  });

  it("signs the visitor out when the refresh token is rejected", async () => {
    refreshImpl = () => Promise.resolve(null);

    const response = await authProxy(request("/orders", { sl_refresh: "revoked" }));

    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
    expect(response.cookies.get("sl_refresh")?.value).toBe("");
  });

  it("keeps the session when the API is unreachable", async () => {
    refreshImpl = () => Promise.reject(new ApiError(503, "down"));

    const response = await authProxy(request("/orders", { sl_refresh: "r" }));

    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get("sl_refresh")).toBeUndefined();
  });

  it("lets a user with a rejected token stay on the login page", async () => {
    refreshImpl = () => Promise.resolve(null);

    const response = await authProxy(request("/login", { sl_refresh: "revoked" }));

    expect(response.headers.get("location")).toBeNull();
  });
});
