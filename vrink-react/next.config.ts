import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const isGithubPages = process.env.GITHUB_PAGES === "true";
const githubPagesBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  turbopack: {
    root: configDirectory,
  },
  ...(isGithubPages
    ? {
        assetPrefix: githubPagesBasePath ? `${githubPagesBasePath}/` : undefined,
        basePath: githubPagesBasePath || undefined,
        images: {
          unoptimized: true,
        },
        output: "export" as const,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
