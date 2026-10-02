"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{t("description")}</p>
      {error.digest && <code className="rounded bg-muted px-2 py-1 text-xs">{error.digest}</code>}
      <Button onClick={reset}>{t("retry")}</Button>
    </main>
  );
}
