import { defineConfig, devices } from "@playwright/test";

const runRealE2E = process.env.RUN_REAL_E2E === "true";
const e2ePort = 3100;
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;
const webServerCommand = runRealE2E
  ? `AUTH_URL=${e2eBaseUrl} NEXT_DIST_DIR=.next-playwright PORT=${e2ePort} NODE_ENV=development E2E_TEST_MODE=true USE_STUB_AUTH=false USE_STUB_POSTS=false pnpm dev`
  : `AUTH_URL=${e2eBaseUrl} NEXT_DIST_DIR=.next-playwright PORT=${e2ePort} NODE_ENV=development E2E_TEST_MODE=true USE_STUB_AUTH=true USE_STUB_POSTS=true pnpm dev`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  globalSetup: "./e2e/setup/ensure-safe-test-db.ts",
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
  },
  webServer: {
    command: webServerCommand,
    url: e2eBaseUrl,
    // Avoid reusing a manually started dev server with mismatched auth/db flags.
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: runRealE2E
    ? [
        {
          name: "chromium",
          testIgnore: /.*\.real\.spec\.ts/,
          use: { ...devices["Desktop Chrome"] },
        },
        {
          name: "real-chromium",
          testMatch: /.*\.real\.spec\.ts/,
          use: { ...devices["Desktop Chrome"] },
        },
      ]
    : [
        {
          name: "chromium",
          testIgnore: /.*\.real\.spec\.ts/,
          use: { ...devices["Desktop Chrome"] },
        },
      ],
});
