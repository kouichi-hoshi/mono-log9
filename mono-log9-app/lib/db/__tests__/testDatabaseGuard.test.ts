import { getPrismaClient } from "@/lib/db/prisma";
import { ensureSafeTestDatabaseOrThrow } from "@/lib/db/testDatabaseGuard";

jest.mock("@/lib/db/prisma", () => ({
  getPrismaClient: jest.fn(),
}));

describe("testDatabaseGuard", () => {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const originalRunDbIntegration = process.env.RUN_DB_INTEGRATION_TESTS;
  const originalRunRealE2E = process.env.RUN_REAL_E2E;
  const originalAllowDbWrite = process.env.ALLOW_DB_WRITE_FOR_TESTS;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalHostAllowList = process.env.TEST_DB_HOST_ALLOWLIST;
  const originalDbNameAllowList = process.env.TEST_DB_NAME_ALLOWLIST;

  beforeEach(() => {
    mutableEnv.RUN_DB_INTEGRATION_TESTS = "true";
    mutableEnv.RUN_REAL_E2E = undefined;
    mutableEnv.ALLOW_DB_WRITE_FOR_TESTS = "true";
    mutableEnv.DATABASE_URL = "postgresql://user:pass@localhost:5432/mono_log9_test?schema=public";
    mutableEnv.TEST_DB_HOST_ALLOWLIST = "localhost,127.0.0.1";
    mutableEnv.TEST_DB_NAME_ALLOWLIST = "mono_log9_test,mono_log9_e2e_test";

    (getPrismaClient as jest.Mock).mockResolvedValue({
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ current_database: "mono_log9_test" }]),
    });
  });

  afterEach(() => {
    mutableEnv.RUN_DB_INTEGRATION_TESTS = originalRunDbIntegration;
    mutableEnv.RUN_REAL_E2E = originalRunRealE2E;
    mutableEnv.ALLOW_DB_WRITE_FOR_TESTS = originalAllowDbWrite;
    mutableEnv.DATABASE_URL = originalDatabaseUrl;
    mutableEnv.TEST_DB_HOST_ALLOWLIST = originalHostAllowList;
    mutableEnv.TEST_DB_NAME_ALLOWLIST = originalDbNameAllowList;
    jest.clearAllMocks();
  });

  it("fails when runner flag is missing", async () => {
    mutableEnv.RUN_DB_INTEGRATION_TESTS = "false";

    await expect(
      ensureSafeTestDatabaseOrThrow({
        runner: "jest-db",
      })
    ).rejects.toThrow("RUN_DB_INTEGRATION_TESTS=true");
  });

  it("fails when ALLOW_DB_WRITE_FOR_TESTS is missing", async () => {
    mutableEnv.ALLOW_DB_WRITE_FOR_TESTS = "false";

    await expect(
      ensureSafeTestDatabaseOrThrow({
        runner: "jest-db",
      })
    ).rejects.toThrow("ALLOW_DB_WRITE_FOR_TESTS=true");
  });

  it("fails when DATABASE_URL is missing", async () => {
    mutableEnv.DATABASE_URL = undefined;

    await expect(
      ensureSafeTestDatabaseOrThrow({
        runner: "jest-db",
      })
    ).rejects.toThrow("DATABASE_URL is required");
  });

  it("fails when DATABASE_URL host is not allowlisted", async () => {
    mutableEnv.DATABASE_URL = "postgresql://user:pass@prod-db.example.com:5432/mono_log9_test";

    await expect(
      ensureSafeTestDatabaseOrThrow({
        runner: "jest-db",
      })
    ).rejects.toThrow('host "prod-db.example.com" is not allowed');
  });

  it("fails when DATABASE_URL dbName is not allowlisted", async () => {
    mutableEnv.DATABASE_URL = "postgresql://user:pass@localhost:5432/mono_log9_prod";

    await expect(
      ensureSafeTestDatabaseOrThrow({
        runner: "jest-db",
      })
    ).rejects.toThrow('dbName "mono_log9_prod" is not allowed');
  });

  it("fails when current_database() does not match URL db name", async () => {
    await expect(
      ensureSafeTestDatabaseOrThrow({
        runner: "jest-db",
        currentDatabaseResolver: async () => "mono_log9_other",
      })
    ).rejects.toThrow("current database mismatch");
  });

  it("succeeds when all guard conditions are satisfied", async () => {
    await expect(
      ensureSafeTestDatabaseOrThrow({
        runner: "jest-db",
      })
    ).resolves.toBeUndefined();
  });

  it("uses RUN_REAL_E2E flag for playwright-real-e2e runner", async () => {
    mutableEnv.RUN_DB_INTEGRATION_TESTS = "false";
    mutableEnv.RUN_REAL_E2E = "true";

    await expect(
      ensureSafeTestDatabaseOrThrow({
        runner: "playwright-real-e2e",
      })
    ).resolves.toBeUndefined();
  });
});

