import { expect, test } from "@playwright/test";
import { newPerson } from "./helpers/people";

/**
 * The Careers module talks to api-careers (and, for PDFs and rankings, to careers-ai plus Ollama and Docker).
 * Opt in with E2E_CAREERS=1 once they are running; CI does not run it.
 */
test.skip(
  !process.env.E2E_CAREERS,
  "set E2E_CAREERS=1 with api-careers and careers-ai running to run these",
);

test.describe("careers", () => {
  test("sits in the menu under its own section", async ({ browser }) => {
    const { page } = await newPerson(browser);
    await page.goto("/dashboard");

    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByText("Careers", { exact: true })).toBeVisible();
    for (const link of ["My CV", "Job offers", "Applications"]) {
      await expect(nav.getByRole("link", { name: link })).toBeVisible();
    }
  });

  test("a new person is told to write their CV before seeing offers", async ({ browser }) => {
    const { page } = await newPerson(browser);
    await page.goto("/careers/offers");

    await expect(page.getByText("Start with your CV")).toBeVisible();
    await page.getByRole("link", { name: "Go to my CV" }).click();
    await expect(page).toHaveURL(/careers\/cv/);
    await expect(page.getByText("You haven't saved your CV yet")).toBeVisible();
  });

  test("saves the CV, shows it again after reloading, and keeps it private", async ({
    browser,
  }) => {
    const ana = await newPerson(browser);
    await ana.page.goto("/careers/cv");
    await ana.page.getByLabel("Full name").fill("Ana Example");
    await ana.page.getByLabel("Headline").fill("Backend engineer");
    await ana.page.getByRole("button", { name: "Add experience" }).click();
    await ana.page.getByLabel("Role").fill("Developer");
    await ana.page.getByLabel("Organization").fill("Acme");
    await ana.page.getByLabel("Technologies").fill(".NET, SQL Server");
    await ana.page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(ana.page.getByText("CV saved.")).toBeVisible();

    await ana.page.reload();
    await expect(ana.page.getByLabel("Full name")).toHaveValue("Ana Example");
    await expect(ana.page.getByLabel("Role")).toHaveValue("Developer");
    await expect(ana.page.getByLabel("Technologies")).toHaveValue(".NET, SQL Server");

    const luis = await newPerson(browser);
    await luis.page.goto("/careers/cv");
    await expect(luis.page.getByLabel("Full name")).toHaveValue("");
  });

  test("explains which fields need attention instead of failing silently", async ({ browser }) => {
    const { page } = await newPerson(browser);
    await page.goto("/careers/cv");
    await page.getByLabel("Email", { exact: true }).fill("not-an-email");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    const alert = page.getByRole("alert").filter({ hasText: "Some fields need attention" });
    await expect(alert).toContainText("Full name: required");
    await expect(alert).toContainText("Email: not a valid email");
  });

  test("renders the CV as a PDF without saving it", async ({ browser }) => {
    const { page } = await newPerson(browser);
    await page.goto("/careers/cv");
    await page.getByLabel("Full name").fill("Preview Only");
    await page.getByRole("button", { name: "Preview" }).click();

    await expect(page.locator("iframe[title='PDF preview']")).toBeVisible({ timeout: 90_000 });
    await page.reload();
    await expect(page.getByLabel("Full name")).toHaveValue("");
  });

  test("prepares an application and never lets it be sent without confirming it", async ({
    browser,
  }) => {
    test.setTimeout(10 * 60_000);
    const { page } = await newPerson(browser);
    await page.goto("/careers/cv");
    await page.getByLabel("Full name").fill("Applicant");
    await page.getByLabel("Headline").fill("Backend engineer");
    await page.getByLabel("Summary").fill("APIs in .NET with SQL Server and Docker.");
    await page.getByRole("button", { name: "Add experience" }).click();
    await page.getByLabel("Role").fill("Developer");
    await page.getByLabel("Organization").fill("Acme");
    await page.getByLabel("Technologies").fill(".NET, SQL Server, Docker");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("CV saved.")).toBeVisible();

    await page.goto("/careers/offers");
    // The first ranking can take minutes (embeddings are computed in the background); the list fills itself.
    const prepare = page.getByRole("button", { name: "Prepare application" }).first();
    await expect(prepare).toBeVisible({ timeout: 8 * 60_000 });
    await prepare.click();

    // Preparing asks the local model to tailor the CV, which can take a while the first time.
    await expect(page).toHaveURL(/careers\/applications\/[0-9a-f-]{36}/, { timeout: 2 * 60_000 });
    await expect(page.getByText("Careers sends nothing")).toBeVisible();
    await expect(page.getByLabel("Cover letter")).toHaveValue(/^Estimado equipo de /);
    await expect(page.getByRole("button", { name: "Mark as sent" })).toHaveCount(0);

    await page.getByLabel("Cover letter").fill("My own words about this role.");
    await page.getByRole("button", { name: "Save letter" }).click();
    await expect(page.getByText("Letter saved.")).toBeVisible();

    await page.getByRole("button", { name: "I reviewed it" }).click();
    await page.getByRole("button", { name: "Mark as sent" }).click();
    await expect(page.getByText("This status is final.")).toBeVisible();
    await expect(page.getByLabel("Cover letter")).toBeDisabled();

    await page.goto("/careers/applications");
    await expect(page.getByText("Sent", { exact: true }).first()).toBeVisible();
  });

  test("someone else's application looks like one that does not exist", async ({ browser }) => {
    test.setTimeout(10 * 60_000);
    const owner = await newPerson(browser);
    await owner.page.goto("/careers/cv");
    await owner.page.getByLabel("Full name").fill("Owner");
    await owner.page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(owner.page.getByText("CV saved.")).toBeVisible();
    await owner.page.goto("/careers/offers");
    await owner.page
      .getByRole("button", { name: "Prepare application" })
      .first()
      .click({ timeout: 8 * 60_000 });
    await expect(owner.page).toHaveURL(/careers\/applications\/[0-9a-f-]{36}/, {
      timeout: 2 * 60_000,
    });
    const url = owner.page.url();

    const intruder = await newPerson(browser);
    await intruder.page.goto(url);
    // The page streams, so the status line is already 200: what proves nothing leaked is the not-found screen.
    await expect(intruder.page.getByText("Page not found")).toBeVisible();
    await expect(intruder.page.getByLabel("Cover letter")).toHaveCount(0);
    await expect(intruder.page.getByText("Owner")).toHaveCount(0);
  });
});
