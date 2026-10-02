import { describe, expect, it } from "vitest";
import { ApiContractError } from "../api/client";
import { ApiError } from "../api/problem";
import { toActionError } from "./result";

describe("toActionError", () => {
  it.each([
    [401, "unauthorized"],
    [403, "forbidden"],
    [404, "notFound"],
    [409, "conflict"],
    [400, "invalid"],
    [422, "invalid"],
    [429, "unavailable"],
    [503, "unavailable"],
    [418, "unknown"],
  ])("maps HTTP %i to %s", (status, code) => {
    expect(toActionError(new ApiError(status, "x"))).toEqual({
      ok: false,
      error: { code, message: "x", issues: [] },
    });
  });

  it("carries the rule violations the API reported", () => {
    const issues = [
      {
        code: "TOTAL_MISMATCH",
        message: "Allocated 30 but 10",
        productCode: "SKU-1",
        locationCode: null,
      },
    ];

    const result = toActionError(new ApiError(422, "Not valid", { issues }));

    expect(result).toMatchObject({ ok: false, error: { code: "invalid", issues } });
  });

  it("ignores malformed issue payloads", () => {
    expect(toActionError(new ApiError(422, "x", { issues: "nope" }))).toMatchObject({
      error: { issues: [] },
    });
  });

  it("treats unexpected failures as unknown without leaking details", () => {
    for (const error of [
      new Error("secret stack"),
      new ApiContractError("/x", "bad shape"),
      "string",
    ]) {
      expect(toActionError(error)).toEqual({ ok: false, error: { code: "unknown", issues: [] } });
    }
  });
});
