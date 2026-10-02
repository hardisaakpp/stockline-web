import { describe, expect, it } from "vitest";
import { loginErrorFor } from "./login-errors";

describe("loginErrorFor", () => {
  it("never tells a wrong password from an unknown account", () => {
    expect(loginErrorFor(401, "local")).toBe("invalidCredentials");
    expect(loginErrorFor(401, "directory")).toBe("invalidCredentials");
  });

  it("explains a rate limit the same way for both providers", () => {
    expect(loginErrorFor(429, "local")).toBe("tooManyAttempts");
    expect(loginErrorFor(429, "directory")).toBe("tooManyAttempts");
  });

  it("tells directory users when they were recognised but not admitted", () => {
    expect(loginErrorFor(403, "directory")).toBe("notAuthorized");
    expect(loginErrorFor(409, "directory")).toBe("emailConflict");
  });

  it("separates an unreachable directory from an unreachable service", () => {
    expect(loginErrorFor(503, "directory")).toBe("directoryUnavailable");
    expect(loginErrorFor(503, "local")).toBe("unreachable");
    expect(loginErrorFor(500, "directory")).toBe("unreachable");
  });

  it("treats other client errors on a local sign-in as bad credentials", () => {
    expect(loginErrorFor(403, "local")).toBe("invalidCredentials");
    expect(loginErrorFor(400, "local")).toBe("invalidCredentials");
  });
});
