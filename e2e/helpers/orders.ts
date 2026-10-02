import { expect, type Browser, type Page } from "@playwright/test";
import { buildOrderTemplate } from "./order-template";

export type RoleName = "buyer" | "supplier" | "production" | "admin";

export const uniqueCode = (prefix = "E2E") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

/** A page signed in as a role, using the session saved by `auth.setup.ts`. */
export async function asRole(browser: Browser, role: RoleName, locale = "en-US"): Promise<Page> {
  const context = await browser.newContext({ storageState: `e2e/.auth/${role}.json`, locale });
  return context.newPage();
}

export async function chooseTemplate(page: Page, code: string) {
  await page.locator('input[type="file"]').setInputFiles({
    name: `${code}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: await buildOrderTemplate({ code }),
  });
}

/** Imports an order through the wizard and returns its id (taken from the "View order" link). */
export async function importOrder(page: Page, code: string): Promise<string> {
  await page.goto("/orders/import");
  await chooseTemplate(page, code);
  await page.getByRole("button", { name: "Check file" }).click();
  await expect(page.getByText("The file is valid")).toBeVisible();
  await page.getByRole("button", { name: "Import order" }).click();
  await expect(page.getByText("Order imported.").first()).toBeVisible();
  await page.getByRole("link", { name: "View order" }).click();
  await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
  return page.url().split("/").pop()!;
}

/** The status pill in the order header. */
export const statusBadge = (page: Page) =>
  page
    .locator("header")
    .getByText(/^[A-Z]/)
    .first();

export async function expectStatus(page: Page, label: string | RegExp) {
  await expect(page.locator("header").getByText(label).first()).toBeVisible();
}

export async function confirmDialog(page: Page, button = "Yes, continue") {
  await page.getByRole("dialog").getByRole("button", { name: button }).click();
}
