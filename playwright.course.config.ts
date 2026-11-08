import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./site-tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-site" }]],
  use: {
    baseURL: "http://127.0.0.1:43123",
    ...devices["Desktop Chrome"],
    permissions: ["clipboard-read", "clipboard-write"],
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:43123",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
