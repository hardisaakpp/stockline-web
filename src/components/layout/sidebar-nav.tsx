"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { canAny } from "@/features/auth";
import type { User } from "@/features/auth";
import { NAVIGATION } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav aria-label={t("main")} className="flex flex-col gap-6">
      {NAVIGATION.map((section) => {
        const items = section.items.filter((item) => canAny(user, item.anyOf));
        if (items.length === 0) return null;

        return (
          <div key={section.titleKey ?? "main"} className="flex flex-col gap-1">
            {section.titleKey && (
              <p className="px-3 pb-1 text-xs font-medium tracking-wider text-sidebar-foreground/50 uppercase">
                {t(section.titleKey)}
              </p>
            )}
            {items.map(({ labelKey, href, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    active && "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className={cn("size-4", active && "text-sidebar-primary")} />
                  {t(labelKey)}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
