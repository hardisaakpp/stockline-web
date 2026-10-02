import { expect, test, type Page } from "@playwright/test";
import { chooseProvider, signInLocal } from "./helpers/sign-in";

// Demo accounts seeded by api-stockline in Development (password from its Seed:DemoPassword).
const PASSWORD = process.env.E2E_DEMO_PASSWORD ?? "Demo-Pass-2026!";
const BASE_URL = `http://localhost:${process.env.PORT ?? 3100}`;

const signIn = (page: Page, email: string, password = PASSWORD) =>
  signInLocal(page, email, password);

test.describe("signing in", () => {
  test("anonymous visitors are sent to the login page and back after signing in", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);

    await signIn(page, "buyer@stockline.test");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Hello, Bruno" })).toBeVisible();
  });

  test("shows a generic error for wrong credentials and keeps the typed email", async ({
    page,
  }) => {
    await page.goto("/login");

    await signIn(page, "buyer@stockline.test", "wrong-password");

    await expect(page.getByRole("alert").filter({ hasText: "Invalid email" })).toHaveText(
      "Invalid email or password.",
    );
    await expect(page.getByLabel("Email")).toHaveValue("buyer@stockline.test");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("validates the form before calling the API", async ({ page }) => {
    await page.goto("/login");
    await chooseProvider(page, "Local account");

    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Enter your email.")).toBeVisible();
    await expect(page.getByText("Enter your password.")).toBeVisible();
  });
});

test.describe("session lifecycle", () => {
  test("renews an expired access token transparently using the refresh token", async ({
    page,
    context,
  }) => {
    // Own login: renewing rotates the refresh token, which would break a shared stored session.
    await page.goto("/login");
    await signIn(page, "buyer@stockline.test");
    await expect(page).toHaveURL(/\/dashboard$/);

    await context.clearCookies({ name: "sl_access" });
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Hello, Bruno" })).toBeVisible();
    expect((await context.cookies()).some((c) => c.name === "sl_access")).toBe(true);
  });

  test("signing out ends the session for good", async ({ page, context }) => {
    await page.goto("/login");
    await signIn(page, "buyer@stockline.test");
    await expect(page).toHaveURL(/\/dashboard$/);
    const refreshToken = (await context.cookies()).find((c) => c.name === "sl_refresh")!.value;

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);

    // The old refresh token is useless even if it leaked.
    await context.addCookies([
      { name: "sl_refresh", value: refreshToken, url: BASE_URL, httpOnly: true, sameSite: "Lax" },
    ]);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("buyer session", () => {
  test.use({ storageState: "e2e/.auth/buyer.json" });

  test("never exposes the tokens to browser JavaScript", async ({ page, context }) => {
    await page.goto("/dashboard");

    const session = (await context.cookies()).filter((c) => c.name.startsWith("sl_"));
    expect(session.map((c) => c.name).sort()).toEqual(["sl_access", "sl_refresh"]);
    expect(session.every((c) => c.httpOnly && c.sameSite === "Lax")).toBe(true);
    expect(await page.evaluate(() => document.cookie)).toBe("");
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).toBe(
      "{}",
    );
  });

  test("is bounced off the login page", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe("role-based navigation", () => {
  test.describe("supplier", () => {
    test.use({ storageState: "e2e/.auth/supplier.json" });

    test("does not see administration", async ({ page }) => {
      await page.goto("/dashboard");

      const nav = page.getByRole("navigation", { name: "Main" });
      await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Users" })).toHaveCount(0);
    });
  });

  test.describe("admin", () => {
    test.use({ storageState: "e2e/.auth/admin.json" });

    test("sees administration", async ({ page }) => {
      await page.goto("/dashboard");

      const nav = page.getByRole("navigation", { name: "Main" });
      await expect(nav.getByRole("link", { name: "Users" })).toBeVisible();
    });
  });
});
