import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PERMISSIONS } from "@/features/auth";
import { requirePermission } from "@/features/auth/server";
import { careersEnabled } from "@/features/careers/server";

/** Every Careers page needs the module to be configured and the person to hold `careers.use`. */
export default async function CareersLayout({ children }: { children: ReactNode }) {
  await requirePermission(PERMISSIONS.careersUse);
  if (!careersEnabled()) notFound();
  return children;
}
