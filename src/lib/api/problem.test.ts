import { describe, expect, it } from "vitest";
import { ApiError } from "./problem";

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/problem+json" },
  });

describe("ApiError.fromResponse", () => {
  it("uses the problem title and keeps extension members", async () => {
    const error = await ApiError.fromResponse(
      json({ title: "Unknown action.", status: 400, validActions: ["Submit"] }, 400),
    );

    expect(error.status).toBe(400);
    expect(error.message).toBe("Unknown action.");
    expect(error.extensions).toEqual({ validActions: ["Submit"] });
  });

  it("prefers the detail over the title", async () => {
    const error = await ApiError.fromResponse(json({ title: "Bad", detail: "More precise" }, 400));

    expect(error.message).toBe("More precise");
  });

  it("falls back to a generic message for non-problem bodies", async () => {
    expect((await ApiError.fromResponse(new Response("boom", { status: 502 }))).message).toBe(
      "Request failed (502)",
    );
    expect((await ApiError.fromResponse(json([1, 2], 500))).message).toBe("Request failed (500)");
  });

  it("exposes status helpers", async () => {
    expect((await ApiError.fromResponse(json({}, 401))).isUnauthorized).toBe(true);
    expect((await ApiError.fromResponse(json({}, 403))).isForbidden).toBe(true);
    expect((await ApiError.fromResponse(json({}, 404))).isNotFound).toBe(true);
  });
});
