"use server";

import { redirect } from "next/navigation";
import { apiRequest, apiRequestVoid } from "@/lib/api/client";
import { ApiError } from "@/lib/api/problem";
import { loginErrorFor, type LoginError } from "./login-errors";
import { loginFormSchema, safeReturnPath, type LoginProvider } from "./login-form-schema";
import { authSessionSchema } from "./schemas";
import { clearSession, readTokens, writeSession } from "./session";

export type LoginState = {
  /** Catalog key under `auth.errors`. */
  error?: LoginError;
  fieldErrors?: { identifier?: string; password?: string };
  identifier?: string;
};

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginFormSchema.safeParse({
    provider: formData.get("provider") ?? "local",
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  const identifier = String(formData.get("identifier") ?? "");
  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten();
    return {
      identifier,
      fieldErrors: { identifier: fieldErrors.identifier?.[0], password: fieldErrors.password?.[0] },
    };
  }

  const { provider, password } = parsed.data;
  try {
    const session = await apiRequest("/auth/login", authSessionSchema, {
      method: "POST",
      body: { email: parsed.data.identifier, password, provider },
    });
    await writeSession(session);
  } catch (error) {
    return { identifier, error: failure(error, provider) };
  }

  redirect(safeReturnPath(formData.get("next")));
}

function failure(error: unknown, provider: LoginProvider): LoginError {
  return error instanceof ApiError ? loginErrorFor(error.status, provider) : "unreachable";
}

export async function logoutAction(): Promise<void> {
  const { refreshToken } = await readTokens();
  if (refreshToken) {
    // Best effort: the local session is cleared even if the API is unreachable.
    await apiRequestVoid("/auth/logout", { method: "POST", body: { refreshToken } }).catch(
      () => undefined,
    );
  }
  await clearSession();
  redirect("/login");
}
