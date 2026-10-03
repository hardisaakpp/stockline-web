import type { Browser, Page } from "@playwright/test";
import { DEMO_PASSWORD, signInLocal } from "./sign-in";

const API = process.env.STOCKLINE_API_URL ?? "http://localhost:5182";

async function adminToken(): Promise<string> {
  const response = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@stockline.test", password: DEMO_PASSWORD }),
  });
  return ((await response.json()) as { accessToken: string }).accessToken;
}

/**
 * A brand-new person, created through the API and signed in through the interface. Anything personal
 * (a CV, applications) starts empty for them, whatever earlier runs left behind for the demo accounts.
 */
export async function newPerson(browser: Browser): Promise<{ page: Page; email: string }> {
  const email = `careers-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}@stockline.test`;
  const created = await fetch(`${API}/admin/users`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${await adminToken()}` },
    body: JSON.stringify({
      email,
      displayName: "Careers Tester",
      password: DEMO_PASSWORD,
      role: "Buyer",
      isAdmin: false,
    }),
  });
  if (!created.ok) throw new Error(`Could not create ${email}: ${created.status}`);

  const page = await (await browser.newContext({ locale: "en-US" })).newPage();
  await page.goto("/login");
  await signInLocal(page, email);
  await page.waitForURL(/dashboard/);
  return { page, email };
}
