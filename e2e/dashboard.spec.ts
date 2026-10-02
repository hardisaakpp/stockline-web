import { expect, test } from "@playwright/test";
import { asRole } from "./helpers/orders";

test.describe("dashboard", () => {
  test("shows the headline numbers, the status breakdown and recent orders", async ({
    browser,
  }) => {
    const page = await asRole(browser, "buyer");
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Hello, Bruno" })).toBeVisible();
    for (const label of ["Waiting for you", "Open orders", "Total orders", "ERP failures"]) {
      await expect(page.getByRole("link", { name: new RegExp(label) })).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Orders by status" })).toBeVisible();
    await expect(page.getByRole("img", { name: /bar chart of new orders per day/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent orders" })).toBeVisible();
  });

  test("a headline number leads to the matching filtered list", async ({ browser }) => {
    const page = await asRole(browser, "buyer");
    await page.goto("/dashboard");

    await page.getByRole("link", { name: /Waiting for you/ }).click();

    await expect(page).toHaveURL(/\/orders\?pending=1$/);
    await expect(page.getByRole("button", { name: "Waiting for me" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("a status in the breakdown leads to that status in the list", async ({ browser }) => {
    const page = await asRole(browser, "buyer");
    await page.goto("/dashboard");

    await page
      .getByRole("heading", { name: "Orders by status" })
      .locator("..")
      .getByRole("link")
      .first()
      .click();

    await expect(page).toHaveURL(/\/orders\?status=/);
  });

  test("is translated", async ({ browser }) => {
    const page = await asRole(browser, "supplier", "es-EC");
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Hola, Sofia" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Órdenes por estado" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Órdenes recientes" })).toBeVisible();
  });
});
