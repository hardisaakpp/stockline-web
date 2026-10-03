import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import type { ApplicationStatus } from "../schemas";
import { statusVariant } from "../status";

type Item = { id: string; status: ApplicationStatus; title: string; company: string };

export function ApplicationsList({ items }: { items: Item[] }) {
  const t = useTranslations("careers.applications");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      {items.length === 0 ? (
        <EmptyState
          icon={Send}
          title={t("empty")}
          description={t("emptyHint")}
          action={<ButtonLink href="/careers/offers">{t("goToOffers")}</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/careers/applications/${item.id}`}
                className="block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Card className="flex-row items-center justify-between gap-4 px-4 transition-colors hover:bg-muted/50">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.company}</p>
                  </div>
                  <Badge variant={statusVariant(item.status)}>{t(`status.${item.status}`)}</Badge>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
