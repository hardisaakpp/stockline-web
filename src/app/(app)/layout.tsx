import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AssistantLauncher } from "@/features/assistant";
import { assistantEnabled } from "@/features/assistant/server";
import { requireUser } from "@/features/auth/server";
import { careersEnabled } from "@/features/careers/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell user={user} features={{ careers: careersEnabled() }}>
      {children}
      {assistantEnabled() && <AssistantLauncher permissions={user.permissions} />}
    </AppShell>
  );
}
