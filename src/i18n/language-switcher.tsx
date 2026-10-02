"use client";

import { Check, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocaleAction } from "./actions";
import { LOCALE_NAMES, LOCALES } from "./config";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("language");
  const current = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={className}
            aria-label={t("label")}
            disabled={pending}
          />
        }
      >
        <Languages className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            lang={locale}
            onClick={() => startTransition(() => setLocaleAction(locale))}
          >
            {LOCALE_NAMES[locale]}
            {locale === current && <Check className="ml-auto size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
