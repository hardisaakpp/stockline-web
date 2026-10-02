import { describe, expect, it } from "vitest";
import { loginFormSchema, safeReturnPath } from "./login-form-schema";

describe("safeReturnPath", () => {
  it("keeps same-site relative paths, including the query string", () => {
    expect(safeReturnPath("/orders?status=Draft")).toBe("/orders?status=Draft");
    expect(safeReturnPath("/admin/users")).toBe("/admin/users");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "orders",
    "",
    null,
    undefined,
    42,
  ])("falls back for %j", (value) => {
    expect(safeReturnPath(value)).toBe("/dashboard");
  });

  it("uses the provided fallback", () => {
    expect(safeReturnPath("//x", "/home")).toBe("/home");
  });
});

describe("loginFormSchema", () => {
  const local = { provider: "local", password: "x" } as const;
  const directory = { provider: "directory", password: "x" } as const;

  it("accepts a valid email for a local account, trimming it", () => {
    const result = loginFormSchema.safeParse({ ...local, identifier: "  ana@stockline.test " });

    expect(result.success && result.data.identifier).toBe("ana@stockline.test");
  });

  it("requires an email-shaped identifier for a local account only", () => {
    const fieldErrors = (input: object) => {
      const result = loginFormSchema.safeParse(input);
      return !result.success && result.error.flatten().fieldErrors;
    };

    expect(fieldErrors({ ...local, identifier: "ada.admin" })).toMatchObject({
      identifier: ["emailInvalid"],
    });
    expect(loginFormSchema.safeParse({ ...directory, identifier: "ada.admin" }).success).toBe(true);
  });

  it("lets a directory user sign in with a username, an email or a user principal name", () => {
    for (const identifier of ["ada.admin", "ada.admin@stockline.test", "STOCKLINE\\ada"]) {
      expect(loginFormSchema.safeParse({ ...directory, identifier }).success).toBe(true);
    }
  });

  it("reports field-level errors", () => {
    const result = loginFormSchema.safeParse({
      provider: "directory",
      identifier: " ",
      password: "",
    });

    expect(!result.success && result.error.flatten().fieldErrors).toMatchObject({
      identifier: ["usernameRequired"],
      password: ["passwordRequired"],
    });
  });

  it("rejects an unknown provider", () => {
    expect(
      loginFormSchema.safeParse({ provider: "kerberos", identifier: "a", password: "x" }).success,
    ).toBe(false);
  });
});
