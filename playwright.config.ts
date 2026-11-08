import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BENCH_URL || "http://127.0.0.1:4471";

export default defineConfig({
  testDir: ".",
  testMatch: ["tests/**/*.spec.ts", "projects/**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node practice-app/server.js",
    url: `${baseURL}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts$/,
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      dependencies: ["setup"],
      grep: /@cross/,
      testIgnore: /auth\.setup\.ts$/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      dependencies: ["setup"],
      grep: /@cross/,
      testIgnore: /auth\.setup\.ts$/,
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
