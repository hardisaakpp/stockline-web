"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LOGIN_PROVIDERS, type LoginProvider } from "../login-form-schema";

type Props = { value: LoginProvider; onChange: (value: LoginProvider) => void; disabled?: boolean };

/** Two-way switch between signing in with the corporate directory and with a local account. */
export function ProviderSwitch({ value, onChange, disabled }: Props) {
  const t = useTranslations("auth.login");

  return (
    <div
      role="radiogroup"
      aria-label={t("signInWith")}
      className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
    >
      {[...LOGIN_PROVIDERS].reverse().map((provider) => (
        <label
          key={provider}
          className={cn(
            "flex cursor-pointer items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
            "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
            value === provider && "bg-background text-foreground shadow-sm",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <input
            type="radio"
            name="provider"
            value={provider}
            checked={value === provider}
            disabled={disabled}
            onChange={() => onChange(provider)}
            className="sr-only"
          />
          {t(`provider.${provider}`)}
        </label>
      ))}
    </div>
  );
}
