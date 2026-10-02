import type { Metadata } from "next";
import { Boxes, ShieldCheck, Workflow } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LoginForm, safeReturnPath } from "@/features/auth";
import { getAuthProviders } from "@/features/auth/server";
import { LanguageSwitcher } from "@/i18n/language-switcher";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return { title: t("metaTitle") };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const [{ next }, t, providers] = await Promise.all([
    searchParams,
    getTranslations("auth.login"),
    getAuthProviders(),
  ]);
  const returnTo = typeof next === "string" ? safeReturnPath(next, "") : "";
  const highlights = [
    { icon: Workflow, text: t("highlightTrack") },
    { icon: Boxes, text: t("highlightConfirm") },
    { icon: ShieldCheck, text: t("highlightRoles") },
  ];

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div
          aria-hidden="true"
          className="absolute -top-32 -right-32 size-96 rounded-full bg-sidebar-primary/20 blur-3xl"
        />
        <Logo className="relative" />
        <div className="relative max-w-md space-y-8">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight">{t("tagline")}</h1>
          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sidebar-foreground/80">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-primary">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-sidebar-foreground/50">{t("footer")}</p>
      </aside>

      <main className="relative flex items-center justify-center px-6 py-12">
        <LanguageSwitcher className="absolute top-4 right-4" />
        <div className="w-full max-w-sm space-y-8">
          <Logo className="lg:hidden" />
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">{t("heading")}</h2>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <LoginForm next={returnTo || undefined} directoryEnabled={providers.directory} />
        </div>
      </main>
    </div>
  );
}
