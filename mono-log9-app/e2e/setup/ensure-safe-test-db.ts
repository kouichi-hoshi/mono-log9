import type { FullConfig } from "@playwright/test";

import { ensureSafeTestDatabaseOrThrow } from "../../lib/db/testDatabaseGuard";

async function globalSetup(_config: FullConfig): Promise<void> {
  if (process.env.RUN_REAL_E2E !== "true") {
    return;
  }

  await ensureSafeTestDatabaseOrThrow({
    runner: "playwright-real-e2e",
  });
}

export default globalSetup;

