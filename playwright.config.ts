import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3100);

/**
 * End-to-end tests run against a real api-stockline (see `.env.example` for STOCKLINE_API_URL)
 * seeded with the Development demo users. They are not part of the default `npm test`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${port}`, trace: "on-first-retry" },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `http://localhost:${port}/login`,
    // Opt in explicitly: silently reusing whatever is listening on the port tests the wrong app.
    reuseExistingServer: Boolean(process.env.E2E_REUSE_SERVER),
    timeout: 120_000,
  },
});
