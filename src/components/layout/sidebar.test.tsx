import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it } from "vitest";
import messages from "@/messages/en";
import { SidebarPanel, SidebarProvider, SidebarToggle } from "./sidebar";
import { parseSidebarOpen, SIDEBAR_COOKIE, sidebarCookie } from "./sidebar-state";

const renderShell = (defaultOpen: boolean) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <SidebarPanel>
          <a href="/x">Link</a>
        </SidebarPanel>
        <SidebarToggle />
      </SidebarProvider>
    </NextIntlClientProvider>,
  );

const saved = () => document.cookie.match(new RegExp(`${SIDEBAR_COOKIE}=(\\w+)`))?.[1];
const clearCookie = () => {
  document.cookie = `${SIDEBAR_COOKIE}=; path=/; max-age=0`;
};

describe("sidebar state", () => {
  it("is open unless the saved value says closed", () => {
    expect(parseSidebarOpen(undefined)).toBe(true);
    expect(parseSidebarOpen("open")).toBe(true);
    expect(parseSidebarOpen("garbage")).toBe(true);
    expect(parseSidebarOpen("closed")).toBe(false);
    expect(sidebarCookie(false)).toContain(`${SIDEBAR_COOKIE}=closed`);
  });
});

describe("Sidebar", () => {
  beforeEach(clearCookie);

  it("starts as the server said and the toggle describes the next action", () => {
    renderShell(false);
    expect(screen.getByRole("button", { name: "Show sidebar" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(document.getElementById("app-sidebar")).toHaveAttribute("inert");
  });

  it("closes and reopens, remembering the choice in a cookie", async () => {
    renderShell(true);
    const aside = document.getElementById("app-sidebar")!;
    expect(aside).not.toHaveAttribute("inert");

    await userEvent.click(screen.getByRole("button", { name: "Hide sidebar" }));
    expect(aside).toHaveAttribute("inert");
    expect(saved()).toBe("closed");

    await userEvent.click(screen.getByRole("button", { name: "Show sidebar" }));
    expect(aside).not.toHaveAttribute("inert");
    expect(saved()).toBe("open");
  });

  it("Ctrl+B toggles it, except while typing in a field", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SidebarProvider defaultOpen>
          <SidebarPanel>
            <a href="/x">Link</a>
          </SidebarPanel>
          <input aria-label="field" />
        </SidebarProvider>
      </NextIntlClientProvider>,
    );
    const aside = document.getElementById("app-sidebar")!;

    await userEvent.keyboard("{Control>}b{/Control}");
    expect(aside).toHaveAttribute("inert");

    await userEvent.click(screen.getByLabelText("field"));
    await userEvent.keyboard("{Control>}b{/Control}");
    expect(aside).toHaveAttribute("inert"); // unchanged: the keystroke belongs to the field
  });
});
