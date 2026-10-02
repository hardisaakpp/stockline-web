import { z } from "zod";

/** Server-side configuration. Only ever import this from server code (route handlers, actions, proxy). */
const schema = z.object({
  STOCKLINE_API_URL: z.url().default("http://localhost:5182"),
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
  /** Xia, the assistant engine. The assistant is switched off unless both values are set. */
  XIA_URL: z.url().optional(),
  XIA_JWT_SECRET: z.string().min(32).optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${z.prettifyError(parsed.error)}`);
}

export const env = {
  apiUrl: parsed.data.STOCKLINE_API_URL.replace(/\/+$/, ""),
  /** Session cookies are `Secure` in production unless explicitly disabled (plain-http local runs). */
  secureCookies: parsed.data.COOKIE_SECURE
    ? parsed.data.COOKIE_SECURE === "true"
    : process.env.NODE_ENV === "production",
  /** Connection to Xia, or `null` when the assistant is not configured (the interface then hides it). */
  assistant:
    parsed.data.XIA_URL && parsed.data.XIA_JWT_SECRET
      ? { url: parsed.data.XIA_URL.replace(/\/+$/, ""), secret: parsed.data.XIA_JWT_SECRET }
      : null,
};
