import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { parseSidebarOpen, SIDEBAR_COOKIE } from "@/components/layout/sidebar-state";
import { AssistantLauncher } from "@/features/assistant";
import { assistantEnabled } from "@/features/assistant/server";
import { requireUser } from "@/features/auth/server";
import { careersEnabled } from "@/features/careers/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const sidebarOpen = parseSidebarOpen((await cookies()).get(SIDEBAR_COOKIE)?.value);
  return (
    <AppShell user={user} features={{ careers: careersEnabled() }} sidebarOpen={sidebarOpen}>
      {children}
      {assistantEnabled() && <AssistantLauncher permissions={user.permissions} />}
    </AppShell>
  );
}
