"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { loginAction, type LoginState } from "../actions";
import { FormField } from "@/components/ui/form-field";
import type { LoginProvider } from "../login-form-schema";
import { loadRemembered, saveRemembered } from "../remembered-login";
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
  const [remembered, setRemembered] = useState("");
  const [remember, setRemember] = useState(true);
  const viaDirectory = provider === "directory";

  // Read after mount: localStorage does not exist on the server, and the first render must match it.
  useEffect(() => {
    const last = loadRemembered();
    if (!last) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off sync from an external store
    setRemembered(last.identifier);
    if (directoryEnabled || last.provider === "local") setProvider(last.provider);
  }, [directoryEnabled]);

  const rememberChoice = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const identifier = String(data.get("identifier") ?? "").trim();
    saveRemembered(remember && identifier ? { provider, identifier } : null);
  };
  const fieldError = (key?: string) => (key ? t(`errors.${key as FieldErrorKey}`) : undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => rememberChoice(event.currentTarget)}
      className="flex flex-col gap-5"
      noValidate
    >
      {next && <input type="hidden" name="next" value={next} />}
      {directoryEnabled ? (
        <ProviderSwitch value={provider} onChange={setProvider} disabled={pending} />
      ) : (
        <input type="hidden" name="provider" value="local" />
      )}

      {state.error && <ErrorAlert error={state.error} />}

      <IdentifierField
        viaDirectory={viaDirectory}
        value={state.identifier || remembered}
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

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          className="size-4 accent-primary"
        />
        {t("login.remember")}
      </label>

      <Button type="submit" size="lg" className="h-10 w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? t("login.submitting") : t("login.submit")}
      </Button>
    </form>
  );
}
