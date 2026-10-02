import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button-link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("forbidden");
  return { title: t("metaTitle") };
}

export default async function ForbiddenPage() {
  const t = await getTranslations("forbidden");

  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-6" />
      </span>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <ButtonLink href="/dashboard">{t("back")}</ButtonLink>
    </div>
  );
}
