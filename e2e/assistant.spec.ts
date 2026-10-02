import { expect, test, type Page } from "@playwright/test";
import { asRole, importOrder, uniqueCode, type RoleName } from "./helpers/orders";

/**
 * Needs the assistant switched on in the web app (XIA_URL and XIA_JWT_SECRET) and Xia running with the Stockline
 * knowledge base (`npm run dev:xia`) plus Ollama. Opt in with E2E_XIA=1; CI does not run it.
 */
test.skip(!process.env.E2E_XIA, "set E2E_XIA=1 with Xia running to run the assistant tests");
test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

async function openAssistant(
  role: RoleName,
  browser: Parameters<typeof asRole>[0],
  locale = "en-US",
) {
  const page = await asRole(browser, role, locale);
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /Ask Xia|Preguntar a Xia/ }).click();
  return page;
}

async function ask(page: Page, question: string, label = "Your question") {
  await page.getByRole("textbox", { name: label }).fill(question);
  await page.keyboard.press("Enter");
}

const conversation = (page: Page) => page.getByRole("log");

test.describe("assistant", () => {
  test("greets and suggests questions that fit the role", async ({ browser }) => {
    const buyer = await openAssistant("buyer", browser);
    await expect(buyer.getByRole("heading", { name: "Hi, I'm Xia" })).toBeVisible();
    await expect(buyer.getByRole("button", { name: "How do I import an order?" })).toBeVisible();
    await expect(
      buyer.getByRole("button", { name: "How do I reset a user's password?" }),
    ).toHaveCount(0);

    const admin = await openAssistant("admin", browser);
    await expect(
      admin.getByRole("button", { name: "How do I reset a user's password?" }),
    ).toBeVisible();

    const supplier = await openAssistant("supplier", browser);
    await expect(supplier.getByRole("button", { name: "How do I import an order?" })).toHaveCount(
      0,
    );
  });

  test("answers from the documentation and cites its sources", async ({ browser }) => {
    const page = await openAssistant("buyer", browser);

    await page.getByRole("button", { name: "How do I import an order?" }).click();

    await expect(conversation(page).getByText("Sources:")).toBeVisible({ timeout: 150_000 });
    await expect(conversation(page).getByText("Importing an order")).toBeVisible();
    await expect(page.getByText(/\d+ questions? left of \d+/)).toBeVisible();
  });

  test("keeps the conversation while navigating and can start over", async ({ browser }) => {
    const page = await openAssistant("buyer", browser);
    await ask(page, "Who can import an order?");
    await expect(conversation(page).getByText("Sources:")).toBeVisible({ timeout: 150_000 });

    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: "Orders" }).first().click();
    await expect(page).toHaveURL(/\/orders$/);
    await page.getByRole("button", { name: "Ask Xia" }).click();
    await expect(conversation(page).getByText("Who can import an order?")).toBeVisible();

    await page.getByRole("button", { name: "New conversation" }).click();
    await expect(page.getByRole("heading", { name: "Hi, I'm Xia" })).toBeVisible();
  });

  test("never answers from documents the role is not allowed to read", async ({ browser }) => {
    const buyer = await openAssistant("buyer", browser);
    await ask(buyer, "How do I reset a user's password?");
    await expect(buyer.getByRole("status")).toBeHidden({ timeout: 150_000 });
    await expect(conversation(buyer).getByText("Administration", { exact: true })).toHaveCount(0);

    const admin = await openAssistant("admin", browser);
    await ask(admin, "How do I reset a user's password?");
    await expect(conversation(admin).getByText("Administration", { exact: true })).toBeVisible({
      timeout: 150_000,
    });
  });

  test("speaks Spanish when the interface does", async ({ browser }) => {
    const page = await asRole(browser, "buyer");
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Language" }).click();
    await page.getByRole("menuitem", { name: "Español" }).click();
    await page.getByRole("button", { name: "Preguntar a Xia" }).click();

    await expect(page.getByRole("heading", { name: "Hola, soy Xia" })).toBeVisible();
    await page.getByRole("button", { name: "¿Cómo importo una orden?" }).click();

    await expect(conversation(page).getByText("Fuentes:")).toBeVisible({ timeout: 150_000 });
    await expect(page.getByText(/\d+ preguntas? restantes? de \d+/)).toBeVisible();
  });

  test("looks up the person's own numbers and the answer matches the dashboard", async ({
    browser,
  }) => {
    const page = await asRole(browser, "buyer");
    await page.goto("/dashboard");
    const waiting = (await page.getByRole("link", { name: /Waiting for you/ }).innerText()).match(
      /\d+/,
    )?.[0];
    expect(waiting).toBeTruthy();

    await page.getByRole("button", { name: "Ask Xia" }).click();
    await page.getByRole("button", { name: "What is waiting for me?" }).click();

    await expect(conversation(page).getByText("Looked up:")).toBeVisible({ timeout: 150_000 });
    await expect(conversation(page)).toContainText(String(waiting));
  });

  test("finds an order by its code and offers a link that opens it", async ({ browser }) => {
    const buyer = await asRole(browser, "buyer");
    const code = uniqueCode("AI");
    const id = await importOrder(buyer, code);

    await buyer.getByRole("button", { name: "Ask Xia" }).click();
    await ask(buyer, `What is the status of order ${code}?`);

    const link = buyer.getByRole("link", { name: `Open ${code}` });
    await expect(link).toBeVisible({ timeout: 150_000 });
    await expect(conversation(buyer)).toContainText("Draft");
    await link.click();
    await expect(buyer).toHaveURL(new RegExp(`/orders/${id}$`));
  });

  test("never shows what the API hides from the role", async ({ browser }) => {
    const buyer = await asRole(browser, "buyer");
    const code = uniqueCode("HID");
    await importOrder(buyer, code); // a draft: supplier production cannot see it

    const production = await asRole(browser, "production");
    await production.goto("/dashboard");
    await production.getByRole("button", { name: "Ask Xia" }).click();
    await ask(production, `What is the status of order ${code}?`);

    await expect(production.getByText("Looked up:")).toBeVisible({ timeout: 150_000 });
    await expect(production.getByRole("status")).toBeHidden({ timeout: 150_000 });
    await expect(conversation(production)).not.toContainText("Draft");
    await expect(production.getByRole("link", { name: `Open ${code}` })).toHaveCount(0);
  });
});
