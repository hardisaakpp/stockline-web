import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ASSISTANT_AUDIENCE, ASSISTANT_ISSUER, signAssistantToken } from "./token";

const SECRET = "test-secret-test-secret-test-secret-123";
const user = {
  id: "9f7e",
  email: "buyer@stockline.test",
  role: "Buyer",
  isAdmin: false,
  permissions: ["orders.view", "orders.act"],
} as const;

function decode(token: string) {
  const [header, claims, signature] = token.split(".") as [string, string, string];
  const read = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString());
  return { header: read(header), claims: read(claims), signature, signed: `${header}.${claims}` };
}

describe("signAssistantToken", () => {
  it("signs with HS256 so Xia can verify it with the shared secret", () => {
    const { header, signature, signed } = decode(signAssistantToken(user, SECRET));

    expect(header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(signature).toBe(createHmac("sha256", SECRET).update(signed).digest("base64url"));
  });

  it("carries identity and permissions, and nothing of the user's API session", () => {
    const { claims } = decode(signAssistantToken(user, SECRET));

    expect(claims).toMatchObject({
      sub: "9f7e",
      name: "buyer@stockline.test",
      role: "Buyer",
      permission: ["orders.view", "orders.act"],
      iss: ASSISTANT_ISSUER,
      aud: ASSISTANT_AUDIENCE,
    });
    expect(Object.keys(claims).sort()).toEqual(
      ["aud", "exp", "iat", "iss", "name", "permission", "role", "sub"].sort(),
    );
  });

  it("expires five minutes after it was issued", () => {
    const now = Date.UTC(2026, 9, 1, 12, 0, 0);
    const { claims } = decode(signAssistantToken(user, SECRET, now));

    expect(claims.iat).toBe(now / 1000);
    expect(claims.exp - claims.iat).toBe(300);
  });

  it("marks administrators with the Admin role, which Xia lets read every document", () => {
    const { claims } = decode(signAssistantToken({ ...user, isAdmin: true }, SECRET));
    expect(claims.role).toBe("Admin");
  });

  it("produces a different signature for a different secret", () => {
    const a = decode(signAssistantToken(user, SECRET, 1000)).signature;
    const b = decode(signAssistantToken(user, `${SECRET}x`, 1000)).signature;
    expect(a).not.toBe(b);
  });
});
