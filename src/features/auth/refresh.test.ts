// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshSessionOnce } from "./refresh";

const sessionBody = {
  accessToken: "new-access",
  accessTokenExpiresAt: "2026-10-01T12:15:00Z",
  refreshToken: "new-refresh",
  refreshTokenExpiresAt: "2026-10-08T12:00:00Z",
  user: {
    id: "1",
    email: "a@b.co",
    displayName: "A",
    role: "Buyer",
    isAdmin: false,
    isActive: true,
    provider: "Local",
    permissions: ["orders.view"],
    createdAt: "2026-10-01T00:00:00Z",
  },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("refreshSessionOnce", () => {
  it("shares one API call between concurrent callers with the same token", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(json(sessionBody)));
    vi.stubGlobal("fetch", fetchMock);

    const [a, b, c] = await Promise.all([
      refreshSessionOnce("token-shared"),
      refreshSessionOnce("token-shared"),
      refreshSessionOnce("token-shared"),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a?.accessToken).toBe("new-access");
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it("uses separate calls for different tokens", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(json(sessionBody)));
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([refreshSessionOnce("token-one"), refreshSessionOnce("token-two")]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns null when the API rejects the token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(json({ title: "Session no longer valid." }, 401))),
    );

    await expect(refreshSessionOnce("token-revoked")).resolves.toBeNull();
  });

  it("surfaces an outage instead of reporting a signed-out user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("fetch failed"))),
    );

    await expect(refreshSessionOnce("token-outage")).rejects.toMatchObject({ status: 503 });
  });

  it("lets a failed attempt be retried right away", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(json(sessionBody));
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshSessionOnce("token-retry")).rejects.toBeDefined();
    await expect(refreshSessionOnce("token-retry")).resolves.toMatchObject({
      accessToken: "new-access",
    });
  });
});
