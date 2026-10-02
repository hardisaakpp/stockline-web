import { Check, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PERMISSIONS } from "@/features/auth";
import type { RolesMatrix } from "../schemas";

const KEY_BY_PERMISSION = Object.fromEntries(
  Object.entries(PERMISSIONS).map(([key, value]) => [value, key]),
) as Record<string, keyof typeof PERMISSIONS>;

function Mark({ allowed }: { allowed: boolean }) {
  const t = useTranslations("admin.roles");
  return allowed ? (
    <span className="inline-flex items-center justify-center rounded-full bg-emerald-500/10 p-1 text-emerald-700 dark:text-emerald-300">
      <Check className="size-4" aria-hidden="true" />
      <span className="sr-only">{t("granted")}</span>
    </span>
  ) : (
    <span className="inline-flex items-center justify-center p-1 text-muted-foreground/60">
      <Minus className="size-4" aria-hidden="true" />
      <span className="sr-only">{t("notGranted")}</span>
    </span>
  );
}

/** Read-only grid of what each role (and the administrator add-on) is allowed to do. */
export function RolesMatrixTable({ matrix }: { matrix: RolesMatrix }) {
  const t = useTranslations("admin");
  const roleName = (role: string) =>
    ["Buyer", "Supplier", "SupplierProduction"].includes(role)
      ? t(`roles.roles.${role as "Buyer"}`)
      : role;

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t("roles.permission")}</TableHead>
            {matrix.roles.map(({ role }) => (
              <TableHead key={role} className="text-center">
                {roleName(role)}
              </TableHead>
            ))}
            <TableHead className="text-center">{t("roles.adminColumn")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matrix.allPermissions.map((permission) => {
            const key = KEY_BY_PERMISSION[permission];
            return (
              <TableRow key={permission}>
                <TableCell>
                  <span className="font-medium">{key ? t(`permissions.${key}`) : permission}</span>
                  <span className="block font-mono text-xs text-muted-foreground">
                    {permission}
                  </span>
                </TableCell>
                {matrix.roles.map(({ role, permissions }) => (
                  <TableCell key={role} className="text-center">
                    <Mark allowed={permissions.includes(permission)} />
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <Mark allowed={matrix.adminPermissions.includes(permission)} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
