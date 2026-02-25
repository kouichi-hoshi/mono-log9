import { getPrismaClient } from "@/lib/db/prisma";

type GuardRunner = "jest-db" | "playwright-real-e2e";

const RUNNER_FLAG_KEY: Record<GuardRunner, "RUN_DB_INTEGRATION_TESTS" | "RUN_REAL_E2E"> = {
  "jest-db": "RUN_DB_INTEGRATION_TESTS",
  "playwright-real-e2e": "RUN_REAL_E2E",
};

type EnsureSafeTestDatabaseParams = {
  runner: GuardRunner;
  databaseUrl?: string;
  currentDatabaseResolver?: () => Promise<string>;
};

function parseAllowList(raw: string | undefined, key: string): Set<string> {
  const values = (raw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (values.length === 0) {
    throw new Error(`[test-db-guard] ${key} must be set and contain at least one value.`);
  }

  return new Set(values);
}

function getDatabaseNameFromUrl(databaseUrl: string): { host: string; dbName: string } {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error("[test-db-guard] DATABASE_URL must be a valid URL.");
  }

  const host = parsedUrl.hostname.trim();
  if (!host) {
    throw new Error("[test-db-guard] DATABASE_URL host is empty.");
  }

  const dbName = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, "")).trim();
  if (!dbName) {
    throw new Error("[test-db-guard] DATABASE_URL must include a database name in path.");
  }

  return { host, dbName };
}

async function resolveCurrentDatabaseFromPrisma(): Promise<string> {
  const prisma = (await getPrismaClient()) as {
    $queryRawUnsafe: (query: string) => Promise<unknown>;
  };
  const result = await prisma.$queryRawUnsafe("SELECT current_database() AS current_database");

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error("[test-db-guard] Could not read current database from Prisma query result.");
  }

  const row = result[0] as { current_database?: unknown };
  if (typeof row.current_database !== "string" || row.current_database.trim() === "") {
    throw new Error("[test-db-guard] Prisma current_database() returned invalid value.");
  }

  return row.current_database;
}

export async function ensureSafeTestDatabaseOrThrow({
  runner,
  databaseUrl = process.env.DATABASE_URL,
  currentDatabaseResolver = resolveCurrentDatabaseFromPrisma,
}: EnsureSafeTestDatabaseParams): Promise<void> {
  const runnerFlagKey = RUNNER_FLAG_KEY[runner];
  if (process.env[runnerFlagKey] !== "true") {
    throw new Error(`[test-db-guard] ${runnerFlagKey}=true is required for ${runner}.`);
  }

  if (process.env.ALLOW_DB_WRITE_FOR_TESTS !== "true") {
    throw new Error("[test-db-guard] ALLOW_DB_WRITE_FOR_TESTS=true is required.");
  }

  if (!databaseUrl || databaseUrl === "undefined" || databaseUrl === "null") {
    throw new Error("[test-db-guard] DATABASE_URL is required.");
  }

  const hostAllowList = parseAllowList(process.env.TEST_DB_HOST_ALLOWLIST, "TEST_DB_HOST_ALLOWLIST");
  const dbNameAllowList = parseAllowList(process.env.TEST_DB_NAME_ALLOWLIST, "TEST_DB_NAME_ALLOWLIST");
  const { host, dbName } = getDatabaseNameFromUrl(databaseUrl);

  if (!hostAllowList.has(host)) {
    throw new Error(
      `[test-db-guard] DATABASE_URL host "${host}" is not allowed. Allowed hosts: ${[
        ...hostAllowList,
      ].join(", ")}`
    );
  }

  if (!dbNameAllowList.has(dbName)) {
    throw new Error(
      `[test-db-guard] DATABASE_URL dbName "${dbName}" is not allowed. Allowed db names: ${[
        ...dbNameAllowList,
      ].join(", ")}`
    );
  }

  const currentDb = (await currentDatabaseResolver()).trim();
  if (!currentDb) {
    throw new Error("[test-db-guard] current database name is empty.");
  }

  if (currentDb !== dbName) {
    throw new Error(
      `[test-db-guard] current database mismatch. URL dbName="${dbName}", current_database()="${currentDb}".`
    );
  }
}
