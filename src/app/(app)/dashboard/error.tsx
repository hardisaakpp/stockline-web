"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("orders.errors");

  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" />
      </span>
      <p className="font-medium">{t("loadFailed")}</p>
      <Button onClick={reset}>{t("retry")}</Button>
    </div>
  );
}
