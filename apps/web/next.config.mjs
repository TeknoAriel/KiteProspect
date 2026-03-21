import path from "path";
import { fileURLToPath } from "url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, "../..");
loadEnvConfig(monorepoRoot);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@kite-prospect/db"],
};

export default nextConfig;
