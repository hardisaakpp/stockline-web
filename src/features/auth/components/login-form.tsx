"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { loginAction, type LoginState } from "../actions";
import { FormField } from "@/components/ui/form-field";
import type { LoginProvider } from "../login-form-schema";
import { ProviderSwitch } from "./provider-switch";

const initialState: LoginState = { identifier: "" };

type FieldErrorKey = "emailRequired" | "emailInvalid" | "usernameRequired" | "passwordRequired";

function ErrorAlert({ error }: { error: NonNullable<LoginState["error"]> }) {
  const t = useTranslations("auth.errors");
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {t(error)}
    </div>
  );
}

type IdentifierFieldProps = { viaDirectory: boolean; value?: string; error?: string };

/** Email for a local account; username (or email) for a directory account. */
function IdentifierField({ viaDirectory, value, error }: IdentifierFieldProps) {
  const t = useTranslations("auth.login");
  return (
    <FormField
      // React resets the form after an action; remounting restores what was typed without
      // changing an uncontrolled input's default value in place.
      key={value}
      id="identifier"
      name="identifier"
      label={viaDirectory ? t("username") : t("email")}
      type={viaDirectory ? "text" : "email"}
      autoComplete="username"
      placeholder={viaDirectory ? t("usernamePlaceholder") : undefined}
      hint={viaDirectory ? t("usernameHint") : undefined}
      defaultValue={value}
      error={error}
    />
  );
}

export function LoginForm({
  next,
  directoryEnabled,
}: {
  next?: string;
  directoryEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const t = useTranslations("auth");
  // The directory is the organisation's way in, so it comes first whenever the API offers it.
  const [provider, setProvider] = useState<LoginProvider>(directoryEnabled ? "directory" : "local");
  const viaDirectory = provider === "directory";
  const fieldError = (key?: string) => (key ? t(`errors.${key as FieldErrorKey}`) : undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {directoryEnabled ? (
        <ProviderSwitch value={provider} onChange={setProvider} disabled={pending} />
      ) : (
        <input type="hidden" name="provider" value="local" />
      )}

      {state.error && <ErrorAlert error={state.error} />}

      <IdentifierField
        viaDirectory={viaDirectory}
        value={state.identifier}
        error={fieldError(state.fieldErrors?.identifier)}
      />
      <FormField
        id="password"
        name="password"
        label={t("login.password")}
        type="password"
        autoComplete="current-password"
        error={fieldError(state.fieldErrors?.password)}
      />

      <Button type="submit" size="lg" className="h-10 w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? t("login.submitting") : t("login.submit")}
      </Button>
    </form>
  );
}
