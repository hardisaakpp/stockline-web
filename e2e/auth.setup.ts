import { expect, test as setup } from "@playwright/test";
import { signInLocal } from "./helpers/sign-in";

const PASSWORD = process.env.E2E_DEMO_PASSWORD ?? "Demo-Pass-2026!";

/**
 * Signs in once per role and saves the cookies, so the rest of the suite does not hit the login
 * endpoint (which is rate limited) for every test. Tests that exercise the login itself, or that
 * consume a session (renewal, sign-out), log in on their own.
 */
const ROLES = [
  { name: "buyer", email: "buyer@stockline.test" },
  { name: "supplier", email: "supplier@stockline.test" },
  { name: "admin", email: "admin@stockline.test" },
  { name: "production", email: "production@stockline.test" },
] as const;

for (const { name, email } of ROLES) {
  setup(`sign in as ${name}`, async ({ page }) => {
    await page.goto("/login");
    await signInLocal(page, email, PASSWORD);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.context().storageState({ path: `e2e/.auth/${name}.json` });
  });
}
