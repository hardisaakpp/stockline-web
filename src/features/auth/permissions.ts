/** Permission names follow the `module.action` convention shared with api-stockline. */
export const PERMISSIONS = {
  ordersView: "orders.view",
  ordersImport: "orders.import",
  ordersAct: "orders.act",
  erpSubmit: "erp.submit",
  dashboardView: "dashboard.view",
  adminUsers: "admin.users",
  careersUse: "careers.use",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

type HasPermissions = { readonly permissions: readonly string[] };

/** Whether a signed-in user holds a permission. UI gating only: the API enforces authorization. */
export function can(user: HasPermissions | null | undefined, permission: Permission): boolean {
  return user?.permissions.includes(permission) ?? false;
}

export function canAny(
  user: HasPermissions | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => can(user, permission));
}
