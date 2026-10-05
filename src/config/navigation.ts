import {
  Bell,
  Briefcase,
  Eye,
  FileText,
  LayoutDashboard,
  MapPin,
  PackageSearch,
  Send,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS, type Permission } from "@/features/auth";

export type NavItem = {
  /** Key under `nav` in the message catalogs. */
  labelKey:
    | "dashboard"
    | "orders"
    | "myCv"
    | "savedCv"
    | "jobOffers"
    | "applications"
    | "users"
    | "roles"
    | "locations"
    | "notifications";
  href: string;
  icon: LucideIcon;
  /** The item is shown when the user holds at least one of these. */
  anyOf: readonly Permission[];
  /** Hidden unless that optional module is configured (see `features` in the app shell). */
  feature?: "careers";
};

export type NavSection = { titleKey?: "careers" | "administration"; items: readonly NavItem[] };

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
    titleKey: "careers",
    items: [
      {
        labelKey: "myCv",
        href: "/careers/cv",
        icon: FileText,
        anyOf: [PERMISSIONS.careersUse],
        feature: "careers",
      },
      {
        labelKey: "savedCv",
        href: "/careers/cv-view",
        icon: Eye,
        anyOf: [PERMISSIONS.careersUse],
        feature: "careers",
      },
      {
        labelKey: "jobOffers",
        href: "/careers/offers",
        icon: Briefcase,
        anyOf: [PERMISSIONS.careersUse],
        feature: "careers",
      },
      {
        labelKey: "applications",
        href: "/careers/applications",
        icon: Send,
        anyOf: [PERMISSIONS.careersUse],
        feature: "careers",
      },
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
