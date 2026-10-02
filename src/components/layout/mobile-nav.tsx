"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { User } from "@/features/auth";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("openMenu")} />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetTitle className="sr-only">{t("navigation")}</SheetTitle>
        <SheetDescription className="sr-only">{t("menuDescription")}</SheetDescription>
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        <div className="px-3">
          <SidebarNav user={user} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
