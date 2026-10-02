"use server";

import { unstable_rethrow } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getCurrentUser } from "@/features/auth/server";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { env } from "@/lib/env";
import { runAgent } from "./agent";
import { AssistantError } from "./client";
import { askInputSchema, type AskResult } from "./schemas";
import { signAssistantToken } from "./token";

/** Asks Xia on behalf of the signed-in person. Failures come back as codes the interface translates. */
export async function askAssistant(values: unknown): Promise<AskResult> {
  const input = askInputSchema.safeParse(values);
  if (!input.success) return { ok: false, code: "invalid" };

  const config = env.assistant;
  if (!config) return { ok: false, code: "notConfigured" };

  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, code: "unauthorized" };

    const locale = await getLocale();
    const answer = await runAgent({
      baseUrl: config.url,
      token: signAssistantToken(user, config.secret),
      user,
      question: input.data.question,
      history: input.data.history,
      locale: isLocale(locale) ? locale : DEFAULT_LOCALE,
    });
    return { ok: true, answer };
  } catch (error) {
    // A tool that finds the session gone redirects to the sign-in page: let Next.js do that.
    unstable_rethrow(error);
    if (error instanceof AssistantError) {
      return { ok: false, code: error.code, retryAfterSeconds: error.retryAfterSeconds };
    }
    console.error("Assistant request failed", error);
    return { ok: false, code: "unavailable" };
  }
}
