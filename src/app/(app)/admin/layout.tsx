import type { ReactNode } from "react";
import { PERMISSIONS } from "@/features/auth";
import { requirePermission } from "@/features/auth/server";

/** Every administration page needs the administrator permission. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requirePermission(PERMISSIONS.adminUsers);
  return children;
}
