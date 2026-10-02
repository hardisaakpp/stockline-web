import { expect, test } from "@playwright/test";
import { asRole, uniqueCode } from "./helpers/orders";

test.describe("access", () => {
  test("only administrators can open the administration pages", async ({ browser }) => {
    for (const role of ["buyer", "supplier", "production"] as const) {
      const page = await asRole(browser, role);
      await page.goto("/admin/users");
      await expect(page, role).toHaveURL(/\/forbidden$/);
    }
  });

  test("the administration section is in the menu and /admin opens the user list", async ({
    browser,
  }) => {
    const page = await asRole(browser, "admin");

    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin\/users$/);
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const link of ["Users", "Roles", "Locations", "Notifications"]) {
      await expect(nav.getByRole("link", { name: link })).toBeVisible();
    }
  });
});

test.describe("users", () => {
  test("an administrator creates a user, who then appears in the list", async ({ browser }) => {
    const page = await asRole(browser, "admin");
    const email = `${uniqueCode("new").toLowerCase()}@stockline.test`;
    await page.goto("/admin/users");

    await page.getByRole("button", { name: "New user" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Email").fill(email);
    await dialog.getByLabel("Name").fill("Nora New");
    await dialog.getByLabel("Initial password").fill("A-long-password-1");
    await dialog.getByLabel("Role").selectOption("Supplier");
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(page.getByText("User created.")).toBeVisible();
    await expect(page.getByRole("row", { name: new RegExp(email) })).toContainText("Supplier");
  });

  test("the form explains what is wrong before sending anything", async ({ browser }) => {
    const page = await asRole(browser, "admin");
    await page.goto("/admin/users");

    await page.getByRole("button", { name: "New user" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Email").fill("not-an-email");
    await dialog.getByLabel("Initial password").fill("short");
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(dialog.getByText("Enter a valid email.")).toBeVisible();
    await expect(dialog.getByText("Enter a name.")).toBeVisible();
    await expect(dialog.getByText("Use at least 10 characters.")).toBeVisible();
  });

  test("an email that is already in use is refused", async ({ browser }) => {
    const page = await asRole(browser, "admin");
    await page.goto("/admin/users");

    await page.getByRole("button", { name: "New user" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Email").fill("buyer@stockline.test");
    await dialog.getByLabel("Name").fill("Copycat");
    await dialog.getByLabel("Initial password").fill("A-long-password-1");
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(dialog.getByRole("alert")).toHaveText("A user with this email already exists.");
  });

  test("a user's role can be changed", async ({ browser }) => {
    const page = await asRole(browser, "admin");
    const email = `${uniqueCode("role").toLowerCase()}@stockline.test`;
    await page.goto("/admin/users");
    await page.getByRole("button", { name: "New user" }).click();
    const create = page.getByRole("dialog");
    await create.getByLabel("Email").fill(email);
    await create.getByLabel("Name").fill("Rhoda Role");
    await create.getByLabel("Initial password").fill("A-long-password-1");
    await create.getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("row", { name: new RegExp(email) })).toBeVisible();

    await page
      .getByRole("row", { name: new RegExp(email) })
      .getByRole("button", { name: /^Actions for/ })
      .click();
    await page.getByRole("menuitem", { name: "Edit user" }).click();
    await page.getByRole("dialog").getByLabel("Role").selectOption("SupplierProduction");
    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("User updated.")).toBeVisible();
    await expect(page.getByRole("row", { name: new RegExp(email) })).toContainText(
      "Supplier production",
    );
  });

  // The directory suite signs another administrator in, so "the only administrator" no longer holds then.
  test("the only administrator cannot be demoted or disabled", async ({ browser }) => {
    test.skip(Boolean(process.env.E2E_DIRECTORY), "directory accounts add a second administrator");
    const page = await asRole(browser, "admin");
    await page.goto("/admin/users");

    await page.getByRole("button", { name: "Actions for Ada Admin" }).click();
    await page.getByRole("menuitem", { name: "Edit user" }).click();
    const dialog = page.getByRole("dialog");

    await expect(dialog.getByRole("switch", { name: "Administrator" })).toBeDisabled();
    await expect(dialog.getByRole("switch", { name: "Active" })).toBeDisabled();
    await expect(
      dialog.getByText("This is the only active administrator", { exact: false }).first(),
    ).toBeVisible();
  });

  test("a password reset needs a long enough password", async ({ browser }) => {
    const page = await asRole(browser, "admin");
    await page.goto("/admin/users");

    await page.getByRole("button", { name: "Actions for Bruno Buyer" }).click();
    await page.getByRole("menuitem", { name: "Reset password" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("New password").fill("short");
    await dialog.getByRole("button", { name: "Reset password" }).click();

    await expect(dialog.getByText("Use at least 10 characters.")).toBeVisible();
  });
});

test.describe("roles", () => {
  test("lists what each role is allowed to do", async ({ browser }) => {
    const page = await asRole(browser, "admin");
    await page.goto("/admin/roles");

    const importRow = page.getByRole("row", { name: /Import orders/ });
    await expect(importRow.getByText("Allowed", { exact: true })).toHaveCount(1); // buyer only
    await expect(
      page
        .getByRole("row", { name: /Administer the system/ })
        .getByText("Allowed", { exact: true }),
    ).toHaveCount(1); // administrator add-on
  });
});

test.describe("locations", () => {
  test("a location can be created and renamed", async ({ browser }) => {
    const page = await asRole(browser, "admin");
    const code = uniqueCode("ST").slice(0, 14);
    await page.goto("/admin/locations");

    await page.getByRole("button", { name: "New location" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Code").fill(code);
    await dialog.getByLabel("Name").fill("Pop-up store");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Location created.")).toBeVisible();
    await expect(page.getByRole("row", { name: new RegExp(code) })).toContainText("Pop-up store");

    await page.getByRole("button", { name: `Edit: ${code}` }).click();
    await page.getByRole("dialog").getByLabel("Name").fill("Pop-up flagship");
    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("row", { name: new RegExp(code) })).toContainText(
      "Pop-up flagship",
    );
  });

  test("a code that exists is refused", async ({ browser }) => {
    const page = await asRole(browser, "admin");
    await page.goto("/admin/locations");

    await page.getByRole("button", { name: "New location" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Code").fill("ST-001");
    await dialog.getByLabel("Name").fill("Duplicate");
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog.getByRole("alert")).toHaveText("A location with this code already exists.");
  });
});

test.describe("notifications", () => {
  test("subscribes an email to a topic and removes it", async ({ browser }) => {
    const page = await asRole(browser, "admin");
    const email = `${uniqueCode("sub").toLowerCase()}@stockline.test`;
    await page.goto("/admin/notifications");

    await page.getByLabel("Add an email to Order submitted").fill(email);
    await page.getByLabel("Add an email to Order submitted").press("Enter");
    await expect(page.getByText("Subscribed.")).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    await page.getByRole("button", { name: `Remove ${email}` }).click();
    await expect(page.getByText("Subscription removed.")).toBeVisible();
    await expect(page.getByText(email)).toHaveCount(0);
  });

  test("shows a sandboxed preview of the email", async ({ browser }) => {
    const page = await asRole(browser, "admin");
    await page.goto("/admin/notifications");

    await page.getByRole("button", { name: "Preview email" }).first().click();

    const frame = page.getByRole("dialog").locator("iframe");
    await expect(frame).toBeVisible();
    await expect(frame).toHaveAttribute("sandbox", "");
  });
});
