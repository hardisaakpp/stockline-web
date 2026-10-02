import {
  Bell,
  LayoutDashboard,
  MapPin,
  PackageSearch,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS, type Permission } from "@/features/auth";

export type NavItem = {
  /** Key under `nav` in the message catalogs. */
  labelKey: "dashboard" | "orders" | "users" | "roles" | "locations" | "notifications";
  href: string;
  icon: LucideIcon;
  /** The item is shown when the user holds at least one of these. */
  anyOf: readonly Permission[];
};

export type NavSection = { titleKey?: "administration"; items: readonly NavItem[] };

export const NAVIGATION: readonly NavSection[] = [
  {
    items: [
      {
        labelKey: "dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        anyOf: [PERMISSIONS.dashboardView],
      },
      { labelKey: "orders", href: "/orders", icon: PackageSearch, anyOf: [PERMISSIONS.ordersView] },
    ],
  },
  {
    titleKey: "administration",
    items: [
      { labelKey: "users", href: "/admin/users", icon: Users, anyOf: [PERMISSIONS.adminUsers] },
      {
        labelKey: "roles",
        href: "/admin/roles",
        icon: ShieldCheck,
        anyOf: [PERMISSIONS.adminUsers],
      },
      {
        labelKey: "locations",
        href: "/admin/locations",
        icon: MapPin,
        anyOf: [PERMISSIONS.adminUsers],
      },
      {
        labelKey: "notifications",
        href: "/admin/notifications",
        icon: Bell,
        anyOf: [PERMISSIONS.adminUsers],
      },
    ],
  },
];
