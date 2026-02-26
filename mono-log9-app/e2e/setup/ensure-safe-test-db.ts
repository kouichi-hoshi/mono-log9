import { loadEnvConfig } from "@next/env";

import { ensureSafeTestDatabaseOrThrow } from "../../lib/db/testDatabaseGuard";

async function globalSetup(): Promise<void> {
  loadEnvConfig(process.cwd());

  if (process.env.RUN_REAL_E2E !== "true") {
    return;
  }

  await ensureSafeTestDatabaseOrThrow({
    runner: "playwright-real-e2e",
  });
}

export default globalSetup;
