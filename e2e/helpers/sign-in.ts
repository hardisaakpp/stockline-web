import type { Page } from "@playwright/test";

export const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD ?? "Demo-Pass-2026!";

/** Picks how to sign in when the API offers the directory too (the switch is absent otherwise). */
export async function chooseProvider(page: Page, provider: "Directory account" | "Local account") {
  const choice = page.getByRole("radio", { name: provider });
  // The radio is visually hidden inside its label; the label is what a person clicks.
  if ((await choice.count()) > 0) await page.getByText(provider, { exact: true }).click();
}

/** Signs in with a local account, whether or not the directory is also available. */
export async function signInLocal(page: Page, email: string, password = DEMO_PASSWORD) {
  await chooseProvider(page, "Local account");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}
