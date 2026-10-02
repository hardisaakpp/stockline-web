import { expect, test } from "@playwright/test";
import {
  asRole,
  chooseTemplate,
  confirmDialog,
  expectStatus,
  importOrder,
  uniqueCode,
} from "./helpers/orders";

test.describe.serial("an order's life, from import to ERP", () => {
  const code = uniqueCode();
  let orderId = "";

  test("the buyer imports a spreadsheet after a dry-run check", async ({ browser }) => {
    const page = await asRole(browser, "buyer");

    orderId = await importOrder(page, code);

    await expect(page.getByRole("heading", { name: code })).toBeVisible();
    await expectStatus(page, "Draft");
    await expect(page.getByRole("button", { name: "Submit to supplier" })).toBeVisible();
    await expect(page.getByRole("row", { name: /SKU-1001/ })).toBeVisible();
  });

  test("the buyer submits it to the supplier", async ({ browser }) => {
    const page = await asRole(browser, "buyer");
    await page.goto(`/orders/${orderId}`);

    await page.getByRole("button", { name: "Submit to supplier" }).click();
    await confirmDialog(page);

    await expectStatus(page, "Submitted");
  });

  test("production reviews it and enters what it can make", async ({ browser }) => {
    const page = await asRole(browser, "production");
    await page.goto(`/orders/${orderId}`);

    await page.getByRole("button", { name: "Start review" }).click();
    await expectStatus(page, "Under review");

    // Production never sees costs or prices.
    await expect(page.getByRole("columnheader", { name: "Cost" })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Retail price" })).toHaveCount(0);

    const quantity = page.getByLabel("Confirmed quantity for SKU-1001");
    await quantity.fill("10");
    await quantity.press("Enter");
    await expect(page.getByText("20 short")).toBeVisible();

    await page.getByRole("button", { name: "Confirm production" }).click();
    await confirmDialog(page);

    // Once confirmed, the order leaves production's view: it is taken back to the list.
    await expect(page).toHaveURL(/\/orders$/);
    await page.goto("/orders");
    await expect(page.getByRole("link", { name: code })).toHaveCount(0);
  });

  test("the supplier confirms the order, acknowledging the units that won't be made", async ({
    browser,
  }) => {
    const page = await asRole(browser, "supplier");
    await page.goto(`/orders/${orderId}`);

    await page.getByRole("button", { name: "Confirm order" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("SKU-1001")).toBeVisible();
    await expect(dialog.getByLabel("Skip them")).toBeChecked();
    await dialog.getByRole("button", { name: "Confirm order" }).click();

    await expectStatus(page, "Supplier confirmed");
  });

  test("the buyer redistributes with the proposal and confirms", async ({ browser }) => {
    const page = await asRole(browser, "buyer");
    await page.goto(`/orders/${orderId}?tab=redistribution`);

    await expect(page.getByRole("button", { name: "Confirm redistribution" })).toBeDisabled();
    await page.getByRole("button", { name: "Use proposal" }).click();
    await expect(page.getByText("Balanced").first()).toBeVisible();
    await expect(page.getByText(/to assign|over/)).toHaveCount(0);

    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Draft saved.")).toBeVisible();

    await page.getByRole("button", { name: "Confirm redistribution" }).click();
    await confirmDialog(page, "Confirm redistribution");

    await expectStatus(page, "Redistribution confirmed");
  });

  test("sending to the ERP updates the page live, without a reload", async ({ browser }) => {
    const page = await asRole(browser, "buyer");
    await page.goto(`/orders/${orderId}?tab=erp`);

    await page.getByRole("button", { name: "Send to ERP" }).click();
    await confirmDialog(page);

    // The ERP answers asynchronously; the live stream refreshes the page when it does.
    await expect(page.locator("header").getByText(/^(Sent|ERP submission failed)$/)).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.getByRole("row", { name: /Purchase order/ }).first()).toBeVisible();
  });

  test("the history lists every step with who did it", async ({ browser }) => {
    const page = await asRole(browser, "buyer");
    await page.goto(`/orders/${orderId}?tab=history`);

    await expect(page.getByText("Supplier production").first()).toBeVisible();
    await expect(page.getByText(/Confirmed quantity of SKU-1001 changed/)).toBeVisible();
    await expect(page.getByRole("list").getByText("Supplier confirmed").first()).toBeVisible();
  });
});

test.describe("import validation", () => {
  test("rejects files that are not spreadsheets before uploading", async ({ browser }) => {
    const page = await asRole(browser, "buyer");
    await page.goto("/orders/import");

    await page
      .locator('input[type="file"]')
      .setInputFiles({ name: "orders.csv", mimeType: "text/csv", buffer: Buffer.from("a,b") });

    await expect(page.getByRole("alert").filter({ hasText: "xlsx" })).toHaveText(
      "Only .xlsx files are supported.",
    );
    await expect(page.getByRole("button", { name: "Check file" })).toHaveCount(0);
  });

  test("reports a workbook that is missing the required sheets", async ({ browser }) => {
    const page = await asRole(browser, "buyer");
    await page.goto("/orders/import");

    // A zip with the right extension but no workbook inside.
    await page.locator('input[type="file"]').setInputFiles({
      name: "broken.xlsx",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("not a workbook"),
    });
    await page.getByRole("button", { name: "Check file" }).click();

    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Import order" })).toHaveCount(0);
  });

  test("refuses an order code that already exists", async ({ browser }) => {
    const page = await asRole(browser, "buyer");
    const code = uniqueCode("DUP");
    await importOrder(page, code);

    await page.goto("/orders/import");
    await chooseTemplate(page, code);
    await page.getByRole("button", { name: "Check file" }).click();
    const importButton = page.getByRole("button", { name: "Import order" });
    if (await importButton.isVisible().catch(() => false)) await importButton.click();

    await expect(page.getByText(/already exists/).first()).toBeVisible();
  });

  test("a draft can be discarded", async ({ browser }) => {
    const page = await asRole(browser, "buyer");
    const code = uniqueCode("DISC");
    await importOrder(page, code);

    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Discard order" }).click();
    await confirmDialog(page, "Discard order");

    await expect(page).toHaveURL(/\/orders$/);
    await page.goto(`/orders?q=${code}`);
    await expect(page.getByText("No orders match your filters")).toBeVisible();
  });
});

test.describe("who sees what", () => {
  test("the supplier cannot import orders", async ({ browser }) => {
    const page = await asRole(browser, "supplier");

    await page.goto("/orders");
    await expect(page.getByRole("link", { name: "Import order" })).toHaveCount(0);

    await page.goto("/orders/import");
    await expect(page).toHaveURL(/\/forbidden$/);
  });

  test("production can only filter by the statuses it works on", async ({ browser }) => {
    const page = await asRole(browser, "production");
    await page.goto("/orders");

    const options = await page.getByLabel("Status").locator("option").allTextContents();

    expect(options).toEqual(["All statuses", "Submitted", "Under review"]);
  });

  test("production cannot open an order outside its statuses", async ({ browser }) => {
    const buyer = await asRole(browser, "buyer");
    const id = await importOrder(buyer, uniqueCode("HIDDEN"));
    const production = await asRole(browser, "production");

    await production.goto(`/orders/${id}`);

    // The API answers 404 (not 403) so the order's existence is not revealed.
    await expect(production.getByText("Page not found")).toBeVisible();
  });
});

test.describe("the list", () => {
  test("filters live in the URL and narrow the results", async ({ browser }) => {
    const page = await asRole(browser, "buyer");
    const code = uniqueCode("FIND");
    await importOrder(page, code);

    await page.goto("/orders");
    await page.getByLabel("Search orders").fill(code);

    await expect(page).toHaveURL(new RegExp(`q=${code}`));
    await expect(page.getByRole("row")).toHaveCount(2); // header + the match
    await expect(page.getByRole("link", { name: code })).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page).toHaveURL(/\/orders$/);
  });

  test("statuses and labels follow the interface language", async ({ browser }) => {
    const page = await asRole(browser, "buyer", "es-EC");

    await page.goto("/orders");

    await expect(page.getByRole("heading", { name: "Órdenes" })).toBeVisible();
    await expect(
      page
        .getByRole("button", { name: "Importar orden" })
        .or(page.getByRole("link", { name: "Importar orden" })),
    ).toBeVisible();
    await expect(page.getByLabel("Estado").locator("option", { hasText: "Borrador" })).toHaveCount(
      1,
    );
  });
});
