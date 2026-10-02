import { createHmac } from "node:crypto";
import type { User } from "@/features/auth";

/** Lifetime of the credential handed to Xia: just long enough for one question. */
const TTL_SECONDS = 300;
export const ASSISTANT_ISSUER = "stockline-web";
export const ASSISTANT_AUDIENCE = "xia";

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

type TokenUser = Pick<User, "id" | "email" | "role" | "isAdmin"> & {
  permissions: readonly string[];
};

/**
 * A short-lived HS256 token that tells Xia who is asking and what they may read. The user's own API
 * token is never shared with Xia: this one carries only the identity and the permissions, so Xia can
 * hide documents the person is not allowed to see. Signed on the server with a secret the browser never has.
 */
export function signAssistantToken(user: TokenUser, secret: string, now = Date.now()): string {
  const issuedAt = Math.floor(now / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const claims = encode({
    sub: user.id,
    name: user.email,
    role: user.isAdmin ? "Admin" : user.role,
    permission: user.permissions,
    iss: ASSISTANT_ISSUER,
    aud: ASSISTANT_AUDIENCE,
    iat: issuedAt,
    exp: issuedAt + TTL_SECONDS,
  });
  const signature = createHmac("sha256", secret).update(`${header}.${claims}`).digest("base64url");
  return `${header}.${claims}.${signature}`;
}
