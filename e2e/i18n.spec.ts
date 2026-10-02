import { expect, test } from "@playwright/test";
import { chooseProvider } from "./helpers/sign-in";

test.describe("language", () => {
  test("follows the browser language on the first visit", async ({ browser }) => {
    const context = await browser.newContext({ locale: "es-EC" });
    const page = await context.newPage();

    await page.goto("/login");

    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("heading", { name: "Bienvenido de nuevo" })).toBeVisible();
    await context.close();
  });

  test("falls back to English for unsupported languages", async ({ browser }) => {
    const context = await browser.newContext({ locale: "fr-FR" });
    const page = await context.newPage();

    await page.goto("/login");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await context.close();
  });

  test("the switcher changes the language and remembers the choice", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    await page.getByRole("button", { name: "Language" }).click();
    await page.getByRole("menuitem", { name: "Español" }).click();

    await expect(page.getByRole("heading", { name: "Bienvenido de nuevo" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");

    await page.reload();
    await expect(page.getByRole("heading", { name: "Bienvenido de nuevo" })).toBeVisible();
  });

  test("translates validation and authentication errors", async ({ page }) => {
    await page.goto("/login");
    await chooseProvider(page, "Local account");
    await page.getByRole("button", { name: "Language" }).click();
    await page.getByRole("menuitem", { name: "Español" }).click();

    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByText("Ingresa tu correo electrónico.")).toBeVisible();

    await page.getByLabel("Correo electrónico").fill("buyer@stockline.test");
    await page.getByLabel("Contraseña").fill("incorrecta");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "incorrectos" })).toHaveText(
      "Correo electrónico o contraseña incorrectos.",
    );
  });

  test.describe("signed in", () => {
    test.use({ storageState: "e2e/.auth/admin.json", locale: "es-EC" });

    test("the app shell is translated", async ({ page }) => {
      await page.goto("/dashboard");

      await expect(page.getByRole("heading", { name: "Hola, Ada" })).toBeVisible();
      const nav = page.getByRole("navigation", { name: "Principal" });
      await expect(nav.getByRole("link", { name: "Panel" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Usuarios" })).toBeVisible();
    });
  });
});
