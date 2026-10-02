import { can, PERMISSIONS, type Permission } from "@/features/auth";

/** Starter questions, most distinctive first so a short list still covers each kind of permission. Each one is a key of `assistant.suggestions`; it is only offered to people who could use the answer. */
const SUGGESTIONS = [
  { key: "statuses", permission: PERMISSIONS.ordersView },
  { key: "importOrder", permission: PERMISSIONS.ordersImport },
  { key: "resetPassword", permission: PERMISSIONS.adminUsers },
  { key: "erpRetry", permission: PERMISSIONS.erpSubmit },
  { key: "redistribution", permission: PERMISSIONS.ordersAct },
  { key: "dashboard", permission: PERMISSIONS.dashboardView },
] as const satisfies readonly { key: string; permission: Permission }[];

export type SuggestionKey = (typeof SUGGESTIONS)[number]["key"];

export function suggestionsFor(permissions: readonly string[], limit = 4): SuggestionKey[] {
  const user = { permissions };
  return SUGGESTIONS.filter(({ permission }) => can(user, permission))
    .map(({ key }) => key)
    .slice(0, limit);
}
