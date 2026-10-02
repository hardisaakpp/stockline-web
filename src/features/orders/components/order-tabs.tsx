import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { TabName } from "../tabs";

/** Tabs are plain links (`?tab=`), so each section is bookmarkable and works without JavaScript. */
export function OrderTabs({
  orderId,
  available,
  active,
}: {
  orderId: string;
  available: readonly TabName[];
  active: TabName;
}) {
  const t = useTranslations("orders.detail.tabs");

  return (
    <nav aria-label={t("label")} className="flex gap-1 overflow-x-auto border-b">
      {available.map((tab) => (
        <Link
          key={tab}
          href={tab === "lines" ? `/orders/${orderId}` : `/orders/${orderId}?tab=${tab}`}
          replace
          scroll={false}
          aria-current={tab === active ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
            tab === active
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t(tab)}
        </Link>
      ))}
    </nav>
  );
}
