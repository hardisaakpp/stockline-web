import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { UserMenu, type User } from "@/features/auth";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { MobileNav } from "./mobile-nav";
import { SidebarPanel, SidebarProvider, SidebarToggle } from "./sidebar";
import { SidebarNav, type Features } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";

export function AppShell({
  user,
  features,
  sidebarOpen,
  children,
}: {
  user: User;
  features: Features;
  /** Saved desktop sidebar state (see sidebar-state.ts). */
  sidebarOpen: boolean;
  children: ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <SidebarPanel>
        <Logo className="px-3" />
        <SidebarNav user={user} features={features} />
      </SidebarPanel>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <MobileNav user={user} features={features} />
          <SidebarToggle />
          <div className="ml-auto flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
