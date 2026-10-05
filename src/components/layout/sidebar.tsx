"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { sidebarCookie } from "./sidebar-state";

/**
 * Collapsible desktop sidebar: <SidebarProvider> wraps the shell, <SidebarPanel> is the sidebar and
 * <SidebarToggle> the button (Ctrl/Cmd+B does the same). Below `lg` the sidebar is the mobile sheet instead.
 * The choice is remembered in a cookie; pass its value as `defaultOpen` so the first paint already matches.
 */
type SidebarContext = { open: boolean; toggle: () => void };
const Context = createContext<SidebarContext | null>(null);

function useSidebar(): SidebarContext {
  const context = useContext(Context);
  if (!context) throw new Error("Sidebar components must be used inside <SidebarProvider>");
  return context;
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export function SidebarProvider({
  defaultOpen,
  children,
}: {
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () =>
    setOpen((current) => {
      document.cookie = sidebarCookie(!current);
      return !current;
    });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "b" || !(event.metaKey || event.ctrlKey) || event.altKey)
        return;
      if (isTyping(event.target)) return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Context value={{ open, toggle }}>
      <div
        data-sidebar={open ? "open" : "closed"}
        className="min-h-dvh transition-[grid-template-columns] duration-200 motion-reduce:transition-none lg:grid lg:grid-cols-[16rem_1fr] lg:data-[sidebar=closed]:grid-cols-[0rem_1fr]"
      >
        {children}
      </div>
    </Context>
  );
}

export const SIDEBAR_ID = "app-sidebar";

export function SidebarPanel({ children }: { children: ReactNode }) {
  const { open } = useSidebar();
  return (
    <aside
      id={SIDEBAR_ID}
      // `inert` takes the hidden links out of the tab order and the accessibility tree.
      inert={!open}
      className="sticky top-0 hidden h-dvh min-w-0 overflow-hidden bg-sidebar text-sidebar-foreground lg:block"
    >
      {/* Fixed width: the content must not reflow while the column animates. */}
      <div className="flex h-full w-64 flex-col gap-6 px-3 py-5">{children}</div>
    </aside>
  );
}

export function SidebarToggle() {
  const { open, toggle } = useSidebar();
  const t = useTranslations("nav");
  const Icon = open ? PanelLeftClose : PanelLeftOpen;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="hidden lg:inline-flex"
      aria-label={open ? t("hideSidebar") : t("showSidebar")}
      aria-expanded={open}
      aria-controls={SIDEBAR_ID}
      title={`${open ? t("hideSidebar") : t("showSidebar")} (Ctrl+B)`}
      onClick={toggle}
    >
      <Icon className="size-4" />
    </Button>
  );
}
