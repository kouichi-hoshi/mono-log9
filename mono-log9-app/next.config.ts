import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), "package.json"), "utf-8")
) as { version?: string };

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version ?? "0.0.0",
  },
};

export default nextConfig;
