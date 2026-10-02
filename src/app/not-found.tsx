import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button-link";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <ButtonLink href="/dashboard">{t("back")}</ButtonLink>
    </main>
  );
}
