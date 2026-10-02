import { describe, expect, it } from "vitest";
import { parseRemembered } from "./remembered-login";

describe("parseRemembered", () => {
  it("accepts a valid entry and trims the identifier", () => {
    expect(parseRemembered('{"provider":"directory","identifier":" dan.admin "}')).toEqual({
      provider: "directory",
      identifier: "dan.admin",
    });
  });

  it.each([
    null,
    "",
    "not json",
    "null",
    '{"provider":"ldap","identifier":"x"}',
    '{"provider":"local"}',
    '{"provider":"local","identifier":"   "}',
    `{"provider":"local","identifier":"${"a".repeat(300)}"}`,
  ])("ignores %s", (raw) => expect(parseRemembered(raw)).toBeNull());

  it("never carries a password even if one was stored", () => {
    const parsed = parseRemembered('{"provider":"local","identifier":"a@b.co","password":"x"}');
    expect(parsed).toEqual({ provider: "local", identifier: "a@b.co" });
  });
});
