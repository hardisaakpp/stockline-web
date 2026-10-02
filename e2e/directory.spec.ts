import { expect, test, type Page } from "@playwright/test";
import { chooseProvider, DEMO_PASSWORD } from "./helpers/sign-in";

/**
 * Needs the development directory (api-stockline/dev/directory/up.sh) and the API started with directory
 * sign-in on (`STOCKLINE_DIRECTORY=1 npm run dev:api`). Opt in with E2E_DIRECTORY=1; CI does not run it.
 */
test.skip(
  !process.env.E2E_DIRECTORY,
  "set E2E_DIRECTORY=1 with the directory running to run these",
);

async function signInDirectory(page: Page, username: string, password = DEMO_PASSWORD) {
  await page.goto("/login");
  await chooseProvider(page, "Directory account");
  await page.getByLabel("Username or email").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("signing in with the directory", () => {
  test("offers the directory first, and a local account as the alternative", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("radio", { name: "Directory account" })).toBeChecked();
    await page.getByText("Local account", { exact: true }).click();
    await expect(page.getByLabel("Email")).toBeVisible();
    await page.getByText("Directory account", { exact: true }).click();
    await expect(page.getByLabel("Username or email")).toBeVisible();
  });

  test("a buyer signs in with their username and lands on the dashboard", async ({ page }) => {
    await signInDirectory(page, "ben.buyer");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Hello, Ben" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Administration" })).toHaveCount(0);
  });

  test("an email works as well as a username", async ({ page }) => {
    await signInDirectory(page, "ben.buyer@stockline.test");

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("the role comes from the directory groups: a supplier cannot import orders", async ({
    page,
  }) => {
    await signInDirectory(page, "sam.supplier");
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/orders");

    await expect(page.getByRole("link", { name: "Import order" })).toHaveCount(0);
  });

  test("a member of a nested group gets the role of the group that contains it", async ({
    page,
  }) => {
    await signInDirectory(page, "pia.purchasing"); // purchasing-team is inside stockline-buyers

    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/orders");
    await expect(page.getByRole("link", { name: "Import order" })).toBeVisible();
  });

  test("the administrators group opens the Administration area, with directory accounts marked", async ({
    page,
  }) => {
    await signInDirectory(page, "dan.admin");
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/admin/users");

    const row = page.getByRole("row").filter({ hasText: "dan.admin@stockline.test" });
    await expect(row).toContainText("Directory");
    await row.getByRole("button", { name: "Actions for Dan Admin" }).click();
    await expect(page.getByRole("menuitem", { name: "Reset password" })).toHaveCount(0);
    await page.getByRole("menuitem", { name: "Edit user" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("This account comes from the directory");
    await expect(dialog.getByLabel("Name")).toBeDisabled();
    await expect(dialog.getByLabel("Role")).toBeDisabled();
  });

  test("someone the directory knows but no group admits is told so", async ({ page }) => {
    await signInDirectory(page, "nina.nogroup");

    await expect(page.getByRole("alert").filter({ hasText: "recognised" })).toContainText(
      "isn't authorized to use Stockline",
    );
    await expect(page).toHaveURL(/\/login$/);
  });

  test("a wrong password gets the same generic answer as an unknown user", async ({ page }) => {
    await signInDirectory(page, "ben.buyer", "wrong-password");
    const message = "Invalid email or password.";
    await expect(page.getByRole("alert").filter({ hasText: "Invalid" })).toHaveText(message);

    await signInDirectory(page, "nobody.here");

    await expect(page.getByRole("alert").filter({ hasText: "Invalid" })).toHaveText(message);
  });

  test("a directory account has no local password to fall back on", async ({ page }) => {
    await page.goto("/login");
    await chooseProvider(page, "Local account");
    await page.getByLabel("Email").fill("ben.buyer@stockline.test");
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Invalid" })).toHaveText(
      "Invalid email or password.",
    );
  });
});
